import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
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

    const webhookData = await req.json();
    console.log('Webhook recebido:', JSON.stringify(webhookData, null, 2));

    const event = webhookData.type;
    const charge = webhookData.data;

    if (!charge || !charge.id) {
      throw new Error('Dados do webhook inválidos');
    }

    const orderId = charge.order?.id || charge.id;

    const { data: transaction, error: findError } = await supabase
      .from('transactions')
      .select('*')
      .eq('external_id', orderId)
      .maybeSingle();

    if (findError) {
      console.error('Erro ao buscar transação:', findError);
      throw findError;
    }

    if (!transaction) {
      console.log('Transação não encontrada para o ID:', orderId);
      return new Response(
        JSON.stringify({ message: 'Transação não encontrada' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    let newStatus = transaction.status;
    let paidAt = transaction.paid_at;

    switch (event) {
      case 'charge.paid':
      case 'order.paid':
        newStatus = 'paid';
        paidAt = new Date().toISOString();
        break;
      case 'charge.pending':
      case 'order.pending':
        newStatus = 'pending';
        break;
      case 'charge.failed':
      case 'order.payment_failed':
        newStatus = 'failed';
        break;
      case 'charge.refunded':
      case 'order.refunded':
        newStatus = 'refunded';
        break;
    }

    if (newStatus !== transaction.status) {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ 
          status: newStatus,
          paid_at: paidAt,
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Erro ao atualizar transação:', updateError);
        throw updateError;
      }

      console.log(`Transação ${transaction.id} atualizada de ${transaction.status} para ${newStatus}`);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Webhook processado com sucesso',
        transaction_id: transaction.id,
        old_status: transaction.status,
        new_status: newStatus,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
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