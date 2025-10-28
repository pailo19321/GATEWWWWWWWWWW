import { useState, useEffect, useMemo, useCallback, lazy, Suspense, memo } from 'react';
import { createClient } from '@supabase/supabase-js';
const Checkout = lazy(() => import('./Checkout'));
const Integrations = lazy(() => import('./Integrations'));
const Webhooks = lazy(() => import('./Webhooks'));
const Disputes = lazy(() => import('./Disputes'));
const Wallet = lazy(() => import('./Wallet'));
const Sales = lazy(() => import('./Sales'));
const Customers = lazy(() => import('./Customers'));
const Fees = lazy(() => import('./Fees'));
const PaymentLink = lazy(() => import('./PaymentLink'));
const Settings = lazy(() => import('./Settings'));
const Company = lazy(() => import('./Company'));
const Help = lazy(() => import('./Help'));
import {
  Home,
  Wallet as WalletIcon,
  ShoppingCart,
  Users,
  Receipt,
  GitBranch,
  Link2,
  Settings as SettingsIcon,
  Building2,
  Calendar,
  ShoppingBag,
  TrendingUp,
  Target,
  CreditCard,
  Eye,
  EyeOff,
  X,
  Zap,
  FileText,
  Menu,
  Ghost,
  Webhook,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';

interface DashboardProps {
  userName: string;
}

function Dashboard({ userName }: DashboardProps) {
  const [activeMenuItem, setActiveMenuItem] = useState('Início');
  const [showValues, setShowValues] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [dateRange, setDateRange] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const [chartDates, setChartDates] = useState<string[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<number[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [averageTicket, setAverageTicket] = useState(0);
  const [approvalRate, setApprovalRate] = useState(0);
  const [balance, setBalance] = useState(0);
  const [userId, setUserId] = useState<string>('');

  const supabase = useMemo(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
  }, []);

  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return;
    }

    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };

    loadUser();

    const updateDateRange = () => {
      const today = new Date();

      const formatDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      setDateRange(`01/01/2024 - ${formatDate(today)}`);

      const dates: string[] = [];
      for (let i = 7; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(formatDate(date));
      }
      setChartDates(dates);
    };

    const loadTransactions = async () => {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'paid');

      if (transactions) {
        const last8Days = Array.from({ length: 8 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (7 - i));
          return date.toISOString().split('T')[0];
        });

        const revenueByDay = last8Days.map(day => {
          const dayTransactions = transactions.filter(t =>
            t.paid_at && t.paid_at.startsWith(day)
          );
          return dayTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        });

        setDailyRevenue(revenueByDay);

        const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        setTotalSales(totalRevenue);
        setBalance(totalRevenue * 0.95);

        const avgTicket = transactions.length > 0 ? totalRevenue / transactions.length : 0;
        setAverageTicket(avgTicket);

        const { data: allTransactions } = await supabase
          .from('transactions')
          .select('status');

        if (allTransactions && allTransactions.length > 0) {
          const paidCount = allTransactions.filter(t => t.status === 'paid').length;
          setApprovalRate((paidCount / allTransactions.length) * 100);
        }
      }
    };

    updateDateRange();
    loadTransactions();

    const subscription = supabase
      .channel('transactions_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        () => {
          loadTransactions();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const menuItems = [
    { icon: Home, label: 'Início', active: true },
    { icon: WalletIcon, label: 'Carteira' },
    { icon: ShoppingCart, label: 'Vendas' },
    { icon: Users, label: 'Clientes' },
    { icon: Receipt, label: 'Taxas' },
    { icon: GitBranch, label: 'Integrações' },
    { icon: Webhook, label: 'Webhooks' },
    { icon: AlertTriangle, label: 'Disputas' },
    { icon: Link2, label: 'Link de Pagamento' },
    { icon: HelpCircle, label: 'Central de Ajuda' },
    { icon: SettingsIcon, label: 'Configurações' },
    { icon: Building2, label: 'Sua Empresa' },
  ];

  const paymentIndices = [
    { label: 'Cartão', value: 'R$ 0,00', percentage: '0%' },
    { label: 'PIX', value: 'R$ 0,00', percentage: '0%' },
    { label: 'Boleto', value: 'R$ 0,00', percentage: '0%' },
    { label: 'Estornos', value: 'R$ 0,00', percentage: '0%' },
    { label: 'Chargeback', value: 'R$ 0,00', percentage: '0%' },
  ];

  const paymentMethods = [
    {
      icon: Zap,
      name: 'PIX',
      value: 'R$ 0,00',
      percentage: '0%',
      iconColor: 'text-black'
    },
    {
      icon: CreditCard,
      name: 'Cartão de Crédito',
      value: 'R$ 0,00',
      percentage: '0%',
      iconColor: 'text-black'
    },
    {
      icon: FileText,
      name: 'Boleto Bancário',
      value: 'R$ 0,00',
      percentage: '0%',
      iconColor: 'text-black'
    },
  ];

  const handlePaymentSuccess = useCallback(() => {
    if (supabase) {
      const loadTransactions = async () => {
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('status', 'paid');

        if (transactions) {
          const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
          setTotalSales(totalRevenue);
          setBalance(totalRevenue * 0.95);
        }
      };
      loadTransactions();
    }
  }, [supabase]);

  return (
    <div>
      {showCheckout && (
        <Checkout
          amount={100}
          description="Pagamento de teste"
          onClose={() => setShowCheckout(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <div className="flex min-h-screen bg-[#0f0f0f]">
        {showTermsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Termos de Uso e Política de Privacidade</h2>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                  <p className="mb-4">
                    O uso da plataforma digital desenvolvida e disponibilizada pela Blackpay está sujeito a prévia aceitação
                    e cumprimento dos presentes Termos e Condições de Uso e Serviços, os quais estão em conformidade
                    com as leis brasileiras, incluindo o Código Civil, o Marco Civil da Internet, a Lei Geral de Proteção de
                    Dados Pessoais e outras legislações aplicáveis. Estes Termos de Uso, juntamente com nossas Políticas
                    de Privacidade, estabelecem as regras e condições aplicáveis ao acesso e uso dos serviços oferecidos
                    pela (Nome da Empresa) através de sua plataforma digital. A (Nome da Empresa) disponibiliza esses
                    produtos e serviços. O uso da plataforma e a contratação de nossos produtos e/ou serviços estão
                    sujeitos à aceitação prévia destes Termos de Uso. O usuário deve ler e concordar com todas as disposições
                    desses documentos. A (Nome da Empresa) reserva-se o direito de modificar estes Termos de Uso a
                    qualquer momento, mediante notificação aos usuários por e-mail ou através de aviso na própria
                    plataforma. O uso da plataforma ou contratação dos produtos e serviços após as modificações entrarem
                    em vigor constituirá aceitação e concordância do usuário com os novos termos contratuais. Caso o
                    usuário não concorde com as alterações ou modificações, ele poderá solicitar o cancelamento de sua
                    conta a qualquer momento. Para concordar com estes Termos de Uso, o usuário deve clicar em "Eu
                    li e concordo com os termos e condições".
                  </p>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setTermsAccepted(!termsAccepted)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                      termsAccepted ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        termsAccepted ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <label className="text-sm font-medium text-gray-900">
                    Eu li e concordo com os termos e condições
                  </label>
                </div>

                <button
                  onClick={() => {
                    if (termsAccepted) {
                      setShowTermsModal(false);
                    }
                  }}
                  disabled={!termsAccepted}
                  className="w-full py-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-500 text-black font-bold rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Aceitar Termos
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="hidden lg:flex w-64 bg-[#1a1a1a] border-r border-gray-800 flex-col">
          <div className="p-6 border-b border-gray-800">
            <div className="inline-flex items-center gap-2 mb-6">
              <Ghost className="w-10 h-10 text-amber-500 animate-pulse" />
              <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent">GoldsPay</span>
            </div>

            <div className="bg-[#0f0f0f] rounded-lg p-3 border border-gray-800 hover:border-amber-500/50 transition-all duration-200">
              <div className="text-xs text-gray-400 mb-1">Minha carteira</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <div className="text-xs font-semibold text-gray-400 mb-3 px-3">Recursos</div>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => setActiveMenuItem(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                    activeMenuItem === item.label
                      ? 'bg-amber-500/20 text-amber-500 font-medium'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="lg:hidden sticky top-0 bg-[#0f0f0f] border-b border-gray-800 px-4 py-4 flex items-center justify-between z-40">
            <div className="flex items-center gap-2">
              <Ghost className="w-8 h-8 text-amber-500 animate-pulse" />
              <span className="text-lg font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent">GoldsPay</span>
            </div>
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
          </div>
          <div className="max-w-7xl mx-auto p-4 lg:p-8">
            {activeMenuItem === 'Início' ? (
              <div>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 lg:mb-8 gap-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-semibold text-white mb-1">
                  Bem-vindo, <span className="text-white font-bold">{userName}</span>
                </h1>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-800 rounded-lg text-sm text-gray-300 hover:bg-gray-800">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs lg:text-sm">{dateRange}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
              <div className="bg-[#1a1a1a] rounded-xl p-4 lg:p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <ShoppingBag className="w-5 h-5 text-black" />
                    </div>
                    <span className="text-xs lg:text-sm text-gray-400">Minhas Vendas</span>
                  </div>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-white">
                  {totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>

              <div className="bg-[#1a1a1a] rounded-xl p-4 lg:p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <Target className="w-5 h-5 text-black" />
                    </div>
                    <span className="text-xs lg:text-sm text-gray-400">Ticket médio</span>
                  </div>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-white">
                  {averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>

              <div className="bg-[#1a1a1a] rounded-xl p-4 lg:p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <TrendingUp className="w-5 h-5 text-black" />
                    </div>
                    <span className="text-xs lg:text-sm text-gray-400">Taxa de Aprovação</span>
                  </div>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-white">{approvalRate.toFixed(1)}%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
              <div className="lg:col-span-2 bg-[#1a1a1a] rounded-xl p-4 lg:p-6 border border-gray-800">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 lg:mb-6 gap-3">
                  <div>
                    <h2 className="text-base lg:text-lg font-semibold text-white mb-1">Gráfico de receitas</h2>
                    <p className="text-xs lg:text-sm text-gray-400">Últimos 8 dias</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <button
                      onClick={() => setShowValues(!showValues)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f0f0f] border border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700 transition-all"
                    >
                      {showValues ? <><Eye className="w-3 lg:w-4 h-3 lg:h-4" /> <span className="hidden sm:inline">Ocultar</span></> : <><EyeOff className="w-3 lg:w-4 h-3 lg:h-4" /> <span className="hidden sm:inline">Mostrar</span></>}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] lg:text-xs text-gray-500 pr-2 lg:pr-4 border-r border-gray-800">
                    {Array.from({ length: 5 }, (_, i) => {
                      const maxRevenue = Math.max(...dailyRevenue, 100);
                      const value = maxRevenue - (maxRevenue / 4) * i;
                      return (
                        <span key={i} className="text-right w-12 lg:w-20">
                          {showValues ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : '---'}
                        </span>
                      );
                    })}
                  </div>

                  <div className="h-48 lg:h-64 flex items-end justify-between gap-1.5 lg:gap-3 ml-14 lg:ml-24 border-b border-gray-800 pb-4">
                    {dailyRevenue.map((revenue, i) => {
                      const maxRevenue = Math.max(...dailyRevenue, 1);
                      const heightPercent = revenue === 0 ? 2 : (revenue / maxRevenue) * 85 + 10;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                          {showValues && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
                              <div className="bg-gray-900 border border-gray-700 text-white text-xs py-2 px-3 rounded-lg whitespace-nowrap shadow-xl">
                                <div className="font-semibold mb-1">{chartDates[i]}</div>
                                <div className="text-amber-400 font-bold">
                                  {revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                              </div>
                              <div className="w-2 h-2 bg-gray-900 border-l border-b border-gray-700 transform rotate-45 mx-auto -mt-1"></div>
                            </div>
                          )}
                          <div
                            className="w-full bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 rounded-t-lg transition-all duration-500 hover:from-amber-500 hover:via-amber-400 hover:to-amber-300 cursor-pointer shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 relative overflow-hidden"
                            style={{
                              height: `${heightPercent}%`,
                              minHeight: revenue > 0 ? '8px' : '2px'
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20"></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between text-[10px] lg:text-xs text-gray-500 mt-3 ml-14 lg:ml-24">
                    {chartDates.map((date) => (
                      <span key={date} className="flex-1 text-center font-medium">
                        {date.split('/')[0]}/{date.split('/')[1]}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 lg:mt-6 pt-4 border-t border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4 lg:gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 lg:w-3 h-2 lg:h-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/50"></div>
                      <span className="text-xs lg:text-sm text-gray-400">Receita diária</span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xs text-gray-500 mb-1">Total do período</div>
                    <div className="text-base lg:text-lg font-bold text-white">
                      {showValues ? dailyRevenue.reduce((sum, val) => sum + val, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '---'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] rounded-xl p-4 lg:p-6 border border-gray-800">
                <h2 className="text-base lg:text-lg font-semibold text-white mb-4 lg:mb-6">Índices</h2>
                <div className="space-y-3 lg:space-y-4">
                  {paymentIndices.map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-500 flex items-center justify-center text-xs lg:text-sm text-black font-bold shadow-lg shadow-amber-500/30">
                          {item.percentage}
                        </div>
                        <div>
                          <div className="text-xs lg:text-sm font-medium text-white">{item.label}</div>
                          <div className="text-xs text-gray-400">{item.value}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-4 lg:p-6 border border-gray-800 mb-6 lg:mb-8">
              <h2 className="text-base lg:text-lg font-semibold text-white mb-4 lg:mb-6">Parcelas</h2>
              <div className="flex justify-between items-center h-24 lg:h-32 border-b border-gray-800 overflow-x-auto">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="text-center flex-shrink-0 px-1 lg:px-0">
                    <div className="text-[10px] lg:text-xs text-gray-400">{i + 1}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-4 lg:p-6 border border-gray-800 mb-6 lg:mb-8">
              <h2 className="text-base lg:text-lg font-semibold text-white mb-4 lg:mb-6">Métodos de Pagamento</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paymentMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                  <div key={method.name} className="bg-[#0f0f0f] rounded-xl p-4 lg:p-5 border border-gray-800">
                    <div className="flex items-start justify-between mb-4 lg:mb-6">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <div className={`w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30 border-0 text-black`}>
                          <IconComponent className="w-4 lg:w-5 h-4 lg:h-5" />
                        </div>
                        <div>
                          <div className="text-xs lg:text-sm font-semibold text-white">{method.name}</div>
                          <div className="text-[10px] lg:text-xs text-gray-400">{method.value}</div>
                        </div>
                      </div>
                      <div className="text-xs lg:text-sm font-medium text-gray-400">{method.percentage}</div>
                    </div>

                    <div className="space-y-2 lg:space-y-3 text-[10px] lg:text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Valor Total</span>
                        <span className="font-medium text-white">R$ 0,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Valor Pago</span>
                        <span className="font-medium text-white">R$ 0,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Transações</span>
                        <span className="font-medium text-white">0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Transações Pagas</span>
                        <span className="font-medium text-white">0</span>
                      </div>
                      <div className="flex justify-between pt-2 lg:pt-3 border-t border-gray-800">
                        <span className="text-gray-400">Taxa de Conversão</span>
                        <span className="font-medium text-amber-500">{method.percentage}</span>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>
            ) : activeMenuItem === 'Carteira' ? (
              <Suspense fallback={<div className="flex items-center justify-center py-20"><Ghost className="w-12 h-12 text-amber-500 animate-pulse" /></div>}>
                <Wallet userId={userId} />
              </Suspense>
            ) : activeMenuItem === 'Vendas' ? (
              <Suspense fallback={<div className="flex items-center justify-center py-20"><Ghost className="w-12 h-12 text-amber-500 animate-pulse" /></div>}>
                <Sales userId={userId} />
              </Suspense>
            ) : activeMenuItem === 'Clientes' ? (
              <Suspense fallback={<div className="flex items-center justify-center py-20"><Ghost className="w-12 h-12 text-amber-500 animate-pulse" /></div>}>
                <Customers userId={userId} />
              </Suspense>
            ) : activeMenuItem === 'Taxas' ? (
              <Suspense fallback={<div className="flex items-center justify-center py-20"><Ghost className="w-12 h-12 text-amber-500 animate-pulse" /></div>}>
                <Fees />
              </Suspense>
            ) : activeMenuItem === 'Integrações' ? (
              <Suspense fallback={<div className="flex items-center justify-center py-20"><Ghost className="w-12 h-12 text-amber-500 animate-pulse" /></div>}>
                <Integrations userId={userId} />
              </Suspense>
            ) : activeMenuItem === 'Webhooks' ? (
              <Suspense fallback={<div className="flex items-center justify-center py-20"><Ghost className="w-12 h-12 text-amber-500 animate-pulse" /></div>}>
                <Webhooks userId={userId} />
              </Suspense>
            ) : activeMenuItem === 'Disputas' ? (
              <Suspense fallback={<div className="flex items-center justify-center py-20"><Ghost className="w-12 h-12 text-amber-500 animate-pulse" /></div>}>
                <Disputes userId={userId} />
              </Suspense>
            ) : activeMenuItem === 'Link de Pagamento' ? (
              <Suspense fallback={<div className="flex items-center justify-center py-20"><Ghost className="w-12 h-12 text-amber-500 animate-pulse" /></div>}>
                <PaymentLink userId={userId} />
              </Suspense>
            ) : activeMenuItem === 'Central de Ajuda' ? (
              <Suspense fallback={<div className="flex items-center justify-center py-20"><Ghost className="w-12 h-12 text-amber-500 animate-pulse" /></div>}>
                <Help />
              </Suspense>
            ) : activeMenuItem === 'Configurações' ? (
              <Suspense fallback={<div className="flex items-center justify-center py-20"><Ghost className="w-12 h-12 text-amber-500 animate-pulse" /></div>}>
                <Settings />
              </Suspense>
            ) : activeMenuItem === 'Sua Empresa' ? (
              <Suspense fallback={<div className="flex items-center justify-center py-20"><Ghost className="w-12 h-12 text-amber-500 animate-pulse" /></div>}>
                <Company userId={userId} />
              </Suspense>
            ) : (
              <div className="text-center py-20">
                <h2 className="text-2xl font-semibold text-white mb-4">Em breve</h2>
                <p className="text-gray-400">Esta seção está em desenvolvimento</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showMobileSidebar && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 lg:hidden" onClick={() => setShowMobileSidebar(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#1a1a1a] border-r border-gray-800 p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div className="inline-flex items-center gap-2">
                <Ghost className="w-8 h-8 text-amber-500 animate-pulse" />
                <span className="text-lg font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent">GoldsPay</span>
              </div>
              <button onClick={() => setShowMobileSidebar(false)} className="p-2 hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="bg-[#0f0f0f] rounded-lg p-3 border border-gray-800 hover:border-amber-500/50 transition-all duration-200 mb-6">
              <div className="text-xs text-gray-400 mb-1">Minha carteira</div>
              <div className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>

            <div className="text-xs font-semibold text-gray-400 mb-3 px-3">Recursos</div>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setActiveMenuItem(item.label);
                    setShowMobileSidebar(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                    activeMenuItem === item.label
                      ? 'bg-amber-500/20 text-amber-500 font-medium'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
