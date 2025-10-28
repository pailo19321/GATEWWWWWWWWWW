import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Wallet as WalletIcon, TrendingDown, ArrowDownToLine, Eye, EyeOff, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';

interface WalletProps {
  userId: string;
}

interface Wallet {
  id: string;
  available_balance: number;
  pending_balance: number;
  total_withdrawn: number;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  bank_name: string;
  account_number: string;
  requested_at: string;
  completed_at: string | null;
}

function Wallet({ userId }: WalletProps) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [showValues, setShowValues] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState('checking');
  const [accountNumber, setAccountNumber] = useState('');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

  useEffect(() => {
    if (!supabase || !userId) return;

    const loadWallet = async () => {
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!walletData) {
        const { data: newWallet } = await supabase
          .from('wallets')
          .insert([{
            user_id: userId,
            available_balance: 0,
            pending_balance: 0,
            total_withdrawn: 0
          }])
          .select()
          .single();

        if (newWallet) setWallet(newWallet);
      } else {
        setWallet(walletData);
      }
    };

    const loadWithdrawals = async () => {
      const { data } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (data) setWithdrawals(data);
    };

    loadWallet();
    loadWithdrawals();
  }, [userId, supabase]);

  const handleWithdraw = async () => {
    if (!supabase || !wallet || !userId) return;

    const amount = parseFloat(withdrawAmount);
    if (amount <= 0 || amount > wallet.available_balance) return;

    const { error } = await supabase
      .from('withdrawals')
      .insert([{
        user_id: userId,
        wallet_id: wallet.id,
        amount,
        bank_name: bankName,
        account_type: accountType,
        account_number: accountNumber,
        status: 'pending'
      }]);

    if (!error) {
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setBankName('');
      setAccountNumber('');
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'Pendente',
      processing: 'Processando',
      completed: 'Concluído',
      failed: 'Falhou'
    };
    return statusMap[status] || status;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-white mb-1">Carteira</h1>
          <p className="text-sm lg:text-base text-gray-400">Gerencie seu saldo e saques</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowValues(!showValues)}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-800 rounded-lg text-sm text-gray-300 hover:bg-gray-800 flex-1 sm:flex-none"
          >
            {showValues ? <><Eye className="w-4 h-4" /> Ocultar</> : <><EyeOff className="w-4 h-4" /> Mostrar</>}
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={!wallet || wallet.available_balance <= 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-500 text-black font-semibold rounded-lg shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span className="hidden sm:inline">Solicitar Saque</span>
            <span className="sm:hidden">Sacar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-[#1a1a1a] rounded-xl p-4 lg:p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <DollarSign className="w-4 lg:w-5 h-4 lg:h-5 text-black" />
              </div>
              <span className="text-xs lg:text-sm text-gray-400">Saldo Disponível</span>
            </div>
          </div>
          <div className="text-xl lg:text-3xl font-bold text-white">
            {showValues ? formatCurrency(wallet?.available_balance || 0) : '---'}
          </div>
          <div className="text-xs text-gray-400 mt-2">Disponível para saque</div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-4 lg:p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Clock className="w-4 lg:w-5 h-4 lg:h-5 text-black" />
              </div>
              <span className="text-xs lg:text-sm text-gray-400">Saldo Pendente</span>
            </div>
          </div>
          <div className="text-xl lg:text-3xl font-bold text-white">
            {showValues ? formatCurrency(wallet?.pending_balance || 0) : '---'}
          </div>
          <div className="text-xs text-gray-400 mt-2">Aguardando aprovação</div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-4 lg:p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <TrendingDown className="w-4 lg:w-5 h-4 lg:h-5 text-black" />
              </div>
              <span className="text-xs lg:text-sm text-gray-400">Total Sacado</span>
            </div>
          </div>
          <div className="text-xl lg:text-3xl font-bold text-white">
            {showValues ? formatCurrency(wallet?.total_withdrawn || 0) : '---'}
          </div>
          <div className="text-xs text-gray-400 mt-2">Histórico total</div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl p-4 lg:p-6 border border-gray-800">
        <h2 className="text-base lg:text-lg font-semibold text-white mb-4 lg:mb-6">Histórico de Saques</h2>

        {withdrawals.length === 0 ? (
          <div className="text-center py-12">
            <WalletIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum saque realizado ainda</p>
          </div>
        ) : (
          <div className="space-y-4 lg:space-y-0">
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Data</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Valor</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Banco</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Conta</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b border-gray-800 hover:bg-[#0f0f0f] transition-colors">
                      <td className="py-4 px-4 text-sm text-white">
                        {new Date(withdrawal.requested_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-4 px-4 text-sm font-semibold text-white">
                        {formatCurrency(withdrawal.amount)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-300">{withdrawal.bank_name}</td>
                      <td className="py-4 px-4 text-sm text-gray-300">{withdrawal.account_number}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(withdrawal.status)}
                          <span className="text-sm text-gray-300">{getStatusText(withdrawal.status)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="lg:hidden space-y-3">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="bg-[#0f0f0f] rounded-lg p-4 border border-gray-800">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-white mb-1">{formatCurrency(withdrawal.amount)}</div>
                      <div className="text-xs text-gray-400">{new Date(withdrawal.requested_at).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(withdrawal.status)}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Banco</span>
                      <span className="text-white">{withdrawal.bank_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Conta</span>
                      <span className="text-white">{withdrawal.account_number}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                      <span className="text-gray-400">Status</span>
                      <span className="text-white">{getStatusText(withdrawal.status)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl max-w-md w-full p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-6">Solicitar Saque</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Valor</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-[#0f0f0f] focus:outline-none focus:ring-2 focus:ring-amber-500 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Saldo disponível: {formatCurrency(wallet?.available_balance || 0)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Banco</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Nome do banco"
                  className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-[#0f0f0f] focus:outline-none focus:ring-2 focus:ring-amber-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Tipo de Conta</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-[#0f0f0f] focus:outline-none focus:ring-2 focus:ring-amber-500 text-white"
                >
                  <option value="checking">Conta Corrente</option>
                  <option value="savings">Conta Poupança</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Número da Conta</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="0000-0"
                  className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-[#0f0f0f] focus:outline-none focus:ring-2 focus:ring-amber-500 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 py-3 border border-gray-700 rounded-lg text-white hover:bg-[#0f0f0f] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || !bankName || !accountNumber}
                className="flex-1 py-3 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-500 text-black font-semibold rounded-lg shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Wallet;
