import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import Stripe from 'npm:stripe@14.12.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obter configuração do Stripe
    const { data: stripeConfig } = await supabase
      .from('psp_configurations')
      .select('api_key_secret, webhook_secret')
      .eq('psp_name', 'stripe')
      .single();

    if (!stripeConfig || !stripeConfig.api_key_secret) {
      throw new Error('Stripe não está configurado');
    }

    const stripe = new Stripe(stripeConfig.api_key_secret, {
      apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event: Stripe.Event;

    // Verificar assinatura do webhook se webhook_secret estiver configurado
    if (stripeConfig.webhook_secret && signature) {
      try {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          stripeConfig.webhook_secret
        );
      } catch (err: any) {
        console.error('Erro ao verificar assinatura do webhook:', err.message);
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      event = JSON.parse(body);
    }

    console.log('Stripe Webhook recebido:', event.type);

    // Processar diferentes tipos de eventos
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        const { error } = await supabase
          .from('transactions')
          .update({
            status: 'paid',
            gateway_response: paymentIntent,
            settled_at: new Date().toISOString(),
          })
          .eq('gateway_transaction_id', paymentIntent.id);

        if (error) {
          console.error('Erro ao atualizar transação:', error);
        } else {
          console.log('Transação marcada como paga:', paymentIntent.id);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        const { error } = await supabase
          .from('transactions')
          .update({
            status: 'failed',
            gateway_response: paymentIntent,
          })
          .eq('gateway_transaction_id', paymentIntent.id);

        if (error) {
          console.error('Erro ao atualizar transação:', error);
        } else {
          console.log('Transação marcada como falha:', paymentIntent.id);
        }
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        const { error } = await supabase
          .from('transactions')
          .update({
            status: 'cancelled',
            gateway_response: paymentIntent,
          })
          .eq('gateway_transaction_id', paymentIntent.id);

        if (error) {
          console.error('Erro ao atualizar transação:', error);
        } else {
          console.log('Transação cancelada:', paymentIntent.id);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        
        const { error } = await supabase
          .from('transactions')
          .update({
            status: 'refunded',
            gateway_response: charge,
            refunded_at: new Date().toISOString(),
          })
          .eq('gateway_transaction_id', charge.payment_intent);

        if (error) {
          console.error('Erro ao atualizar transação:', error);
        } else {
          console.log('Transação reembolsada:', charge.payment_intent);
        }
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        
        const { error } = await supabase
          .from('transactions')
          .update({
            status: 'chargeback',
            gateway_response: dispute,
          })
          .eq('gateway_transaction_id', dispute.payment_intent);

        if (error) {
          console.error('Erro ao atualizar transação:', error);
        } else {
          console.log('Chargeback criado:', dispute.payment_intent);
        }
        break;
      }

      default:
        console.log('Evento não tratado:', event.type);
    }

    // Registrar evento no log
    await supabase
      .from('activity_logs')
      .insert({
        action: 'stripe_webhook',
        resource_type: 'webhook',
        details: {
          event_type: event.type,
          event_id: event.id,
        },
      });

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Erro ao processar webhook Stripe:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao processar webhook',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});