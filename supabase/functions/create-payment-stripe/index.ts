import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import Stripe from 'npm:stripe@14.12.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PaymentRequest {
  amount: number;
  payment_method: 'credit_card' | 'debit_card';
  customer: {
    name: string;
    email: string;
    document: string;
    phone?: string;
  };
  description?: string;
  payment_method_id?: string;
}

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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autenticação não fornecido');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Obter configuração do Stripe do banco
    const { data: stripeConfig } = await supabase
      .from('psp_configurations')
      .select('api_key_secret, is_active')
      .eq('psp_name', 'stripe')
      .single();

    if (!stripeConfig || !stripeConfig.is_active) {
      throw new Error('Stripe não está configurado ou ativo');
    }

    if (!stripeConfig.api_key_secret) {
      throw new Error('Chave secreta do Stripe não configurada');
    }

    const stripe = new Stripe(stripeConfig.api_key_secret, {
      apiVersion: '2023-10-16',
    });

    const paymentRequest: PaymentRequest = await req.json();
    const startTime = Date.now();

    // Criar ou obter cliente Stripe
    let stripeCustomer;
    const existingCustomers = await stripe.customers.list({
      email: paymentRequest.customer.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      stripeCustomer = existingCustomers.data[0];
    } else {
      stripeCustomer = await stripe.customers.create({
        email: paymentRequest.customer.email,
        name: paymentRequest.customer.name,
        metadata: {
          document: paymentRequest.customer.document,
          phone: paymentRequest.customer.phone || '',
        },
      });
    }

    // Criar Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(paymentRequest.amount * 100),
      currency: 'brl',
      customer: stripeCustomer.id,
      description: paymentRequest.description || 'Pagamento',
      payment_method: paymentRequest.payment_method_id,
      confirm: paymentRequest.payment_method_id ? true : false,
      automatic_payment_methods: paymentRequest.payment_method_id ? undefined : {
        enabled: true,
      },
      metadata: {
        user_id: user.id,
        customer_document: paymentRequest.customer.document,
      },
    });

    const processingTime = Date.now() - startTime;

    // Determinar status da transação
    let transactionStatus = 'pending';
    if (paymentIntent.status === 'succeeded') {
      transactionStatus = 'paid';
    } else if (paymentIntent.status === 'processing') {
      transactionStatus = 'processing';
    } else if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'requires_confirmation') {
      transactionStatus = 'pending';
    } else if (paymentIntent.status === 'canceled') {
      transactionStatus = 'cancelled';
    } else if (paymentIntent.status === 'payment_failed') {
      transactionStatus = 'failed';
    }

    // Salvar transação no banco
    const { data: transaction, error: dbError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount: paymentRequest.amount,
        payment_method: paymentRequest.payment_method,
        payment_gateway: 'stripe',
        gateway_transaction_id: paymentIntent.id,
        gateway_response: paymentIntent,
        status: transactionStatus,
        customer_name: paymentRequest.customer.name,
        customer_email: paymentRequest.customer.email,
        customer_document: paymentRequest.customer.document,
        description: paymentRequest.description || 'Pagamento',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Erro ao salvar transação:', dbError);
      throw new Error('Erro ao salvar transação no banco de dados');
    }

    // Salvar log da transação PSP
    await supabase
      .from('psp_transaction_logs')
      .insert({
        transaction_id: transaction.id,
        psp_name: 'stripe',
        request_payload: paymentRequest,
        response_payload: paymentIntent,
        status_code: 200,
        processing_time_ms: processingTime,
      });

    const responseData: any = {
      transaction_id: transaction.id,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_client_secret: paymentIntent.client_secret,
      status: transactionStatus,
      amount: paymentRequest.amount,
      payment_method: paymentRequest.payment_method,
    };

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Erro ao processar pagamento Stripe:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao processar pagamento',
        details: error.raw?.message || null,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});