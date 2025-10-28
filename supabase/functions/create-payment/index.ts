import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PaymentRequest {
  amount: number;
  payment_method: 'pix' | 'credit_card' | 'boleto';
  customer: {
    name: string;
    email: string;
    document: string;
    phone?: string;
  };
  description?: string;
  credit_card?: {
    card_number: string;
    card_holder_name: string;
    card_expiration_date: string;
    card_cvv: string;
  };
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
    const pagarmeApiKey = Deno.env.get('PAGARME_SECRET_KEY');

    if (!pagarmeApiKey) {
      throw new Error('PAGARME_SECRET_KEY não configurada');
    }

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

    const paymentRequest: PaymentRequest = await req.json();

    const pagarmePayload: any = {
      amount: Math.round(paymentRequest.amount * 100),
      payment_method: paymentRequest.payment_method === 'credit_card' ? 'credit_card' : paymentRequest.payment_method,
      customer: {
        name: paymentRequest.customer.name,
        email: paymentRequest.customer.email,
        document: paymentRequest.customer.document.replace(/\D/g, ''),
        type: paymentRequest.customer.document.replace(/\D/g, '').length === 11 ? 'individual' : 'company',
        document_type: paymentRequest.customer.document.replace(/\D/g, '').length === 11 ? 'cpf' : 'cnpj',
      },
    };

    if (paymentRequest.customer.phone) {
      pagarmePayload.customer.phones = {
        mobile_phone: {
          country_code: '55',
          area_code: paymentRequest.customer.phone.substring(0, 2),
          number: paymentRequest.customer.phone.substring(2),
        },
      };
    }

    if (paymentRequest.payment_method === 'credit_card' && paymentRequest.credit_card) {
      pagarmePayload.card = {
        number: paymentRequest.credit_card.card_number.replace(/\s/g, ''),
        holder_name: paymentRequest.credit_card.card_holder_name,
        exp_month: paymentRequest.credit_card.card_expiration_date.split('/')[0],
        exp_year: paymentRequest.credit_card.card_expiration_date.split('/')[1],
        cvv: paymentRequest.credit_card.card_cvv,
      };
    }

    if (paymentRequest.payment_method === 'pix') {
      pagarmePayload.pix = {
        expires_in: 3600,
      };
    }

    if (paymentRequest.payment_method === 'boleto') {
      pagarmePayload.boleto = {
        due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        instructions: 'Pagar até a data de vencimento',
      };
    }

    const pagarmeResponse = await fetch('https://api.pagar.me/core/v5/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pagarmeApiKey}`,
      },
      body: JSON.stringify({
        items: [{
          amount: Math.round(paymentRequest.amount * 100),
          description: paymentRequest.description || 'Pagamento',
          quantity: 1,
        }],
        customer: pagarmePayload.customer,
        payments: [pagarmePayload],
      }),
    });

    const pagarmeData = await pagarmeResponse.json();

    if (!pagarmeResponse.ok) {
      console.error('Erro Pagar.me:', pagarmeData);
      throw new Error(pagarmeData.message || 'Erro ao processar pagamento');
    }

    const transactionStatus = pagarmeData.charges?.[0]?.status === 'paid' ? 'paid' : 'pending';

    const { data: transaction, error: dbError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount: paymentRequest.amount,
        payment_method: paymentRequest.payment_method,
        status: transactionStatus,
        external_id: pagarmeData.id,
        customer_name: paymentRequest.customer.name,
        customer_email: paymentRequest.customer.email,
        customer_document: paymentRequest.customer.document,
        description: paymentRequest.description || 'Pagamento',
        paid_at: transactionStatus === 'paid' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Erro ao salvar transação:', dbError);
      throw new Error('Erro ao salvar transação no banco de dados');
    }

    const responseData: any = {
      transaction_id: transaction.id,
      external_id: pagarmeData.id,
      status: transactionStatus,
      amount: paymentRequest.amount,
      payment_method: paymentRequest.payment_method,
    };

    if (paymentRequest.payment_method === 'pix' && pagarmeData.charges?.[0]?.last_transaction?.qr_code) {
      responseData.pix = {
        qr_code: pagarmeData.charges[0].last_transaction.qr_code,
        qr_code_url: pagarmeData.charges[0].last_transaction.qr_code_url,
      };
    }

    if (paymentRequest.payment_method === 'boleto' && pagarmeData.charges?.[0]?.last_transaction?.pdf) {
      responseData.boleto = {
        pdf: pagarmeData.charges[0].last_transaction.pdf,
        barcode: pagarmeData.charges[0].last_transaction.line,
      };
    }

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
    console.error('Erro ao processar pagamento:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao processar pagamento',
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