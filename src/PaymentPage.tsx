import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CreditCard, Lock, ArrowLeft } from 'lucide-react';

interface PaymentPageProps {
  slug: string;
  onBack: () => void;
}

interface PaymentLinkData {
  id: string;
  title: string;
  description: string;
  amount: number;
  user_id: string;
}

function PaymentPage({ slug, onBack }: PaymentPageProps) {
  const [loading, setLoading] = useState(true);
  const [paymentLink, setPaymentLink] = useState<PaymentLinkData | null>(null);
  const [error, setError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

  useEffect(() => {
    loadPaymentLink();
  }, [slug]);

  const loadPaymentLink = async () => {
    if (!supabase) {
      setError('Erro ao carregar dados do pagamento');
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('payment_links')
        .select('id, title, description, amount, user_id')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Link de pagamento não encontrado ou inativo');
        setPaymentLink(null);
      } else {
        setPaymentLink(data);
        await incrementClicks(data.id);
      }
    } catch (err) {
      console.error('Erro ao carregar link:', err);
      setError('Erro ao carregar dados do pagamento');
    } finally {
      setLoading(false);
    }
  };

  const incrementClicks = async (linkId: string) => {
    if (!supabase) return;

    try {
      await supabase.rpc('increment_payment_link_clicks', { link_id: linkId });
    } catch (err) {
      console.error('Erro ao incrementar cliques:', err);
    }
  };

  const formatCurrency = (value: number) => {
    return (value / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDocument = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  const handleDocumentChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    setCustomerDocument(digits.slice(0, 14));
  };

  const handlePayment = async () => {
    if (!customerName || !customerEmail || !customerDocument || !paymentLink) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (customerDocument.length < 11) {
      setError('CPF/CNPJ inválido');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      alert(`Pagamento de ${formatCurrency(paymentLink.amount)} será processado.\n\nEsta é uma versão demo. Em produção, aqui seria integrado com o gateway de pagamento.`);

      setCustomerName('');
      setCustomerEmail('');
      setCustomerDocument('');
    } catch (err) {
      console.error('Erro ao processar pagamento:', err);
      setError('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error && !paymentLink) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Link Inválido</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={onBack}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-500 text-black font-semibold rounded-lg shadow-lg shadow-amber-500/30 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-black/20 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">{paymentLink?.title}</h1>
                <p className="text-black/70 text-sm">Pagamento Seguro</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-[#0f0f0f] rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Valor a pagar:</span>
                <span className="text-3xl font-bold text-white">
                  {formatCurrency(paymentLink?.amount || 0)}
                </span>
              </div>
              {paymentLink?.description && (
                <p className="text-sm text-gray-400 mt-3 pt-3 border-t border-gray-800">
                  {paymentLink.description}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Digite seu nome completo"
                  className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-[#0f0f0f] text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-[#0f0f0f] text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  CPF/CNPJ
                </label>
                <input
                  type="text"
                  value={formatDocument(customerDocument)}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-[#0f0f0f] text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={isProcessing || !customerName || !customerEmail || !customerDocument}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-500 text-black font-bold rounded-xl shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="w-5 h-5" />
              <span>{isProcessing ? 'Processando...' : 'Pagar Agora'}</span>
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Lock className="w-3 h-3" />
              <span>Pagamento seguro e criptografado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
