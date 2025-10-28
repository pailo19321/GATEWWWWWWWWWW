import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AlertTriangle, FileText, Upload, CheckCircle2, Clock, Calendar } from 'lucide-react';

interface Dispute {
  id: string;
  transaction_id: string;
  type: 'chargeback' | 'dispute' | 'inquiry';
  reason: string;
  amount: string;
  status: 'open' | 'under_review' | 'won' | 'lost' | 'closed';
  due_date: string | null;
  evidence_url: string | null;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface DisputesProps {
  userId: string;
}

function Disputes({ userId }: DisputesProps) {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceNotes, setEvidenceNotes] = useState('');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async () => {
    if (!supabase) return;

    const { data } = await supabase
      .from('disputes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setDisputes(data);
    }
  };

  const filteredDisputes = selectedStatus === 'all'
    ? disputes
    : disputes.filter(d => d.status === selectedStatus);

  const submitEvidence = async () => {
    if (!supabase || !selectedDispute || !evidenceFile) return;

    await supabase
      .from('disputes')
      .update({
        evidence_url: evidenceFile.name,
        status: 'under_review'
      })
      .eq('id', selectedDispute.id);

    setShowEvidenceModal(false);
    setSelectedDispute(null);
    setEvidenceFile(null);
    loadDisputes();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'under_review':
        return 'bg-blue-500/20 text-blue-500';
      case 'won':
        return 'bg-green-500/20 text-green-500';
      case 'lost':
        return 'bg-red-500/20 text-red-500';
      case 'closed':
        return 'bg-gray-500/20 text-gray-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      open: 'Aberta',
      under_review: 'Em Análise',
      won: 'Ganhou',
      lost: 'Perdeu',
      closed: 'Fechada'
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      chargeback: 'Chargeback',
      dispute: 'Disputa',
      inquiry: 'Consulta'
    };
    return labels[type] || type;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const stats = {
    total: disputes.length,
    open: disputes.filter(d => d.status === 'open').length,
    under_review: disputes.filter(d => d.status === 'under_review').length,
    won: disputes.filter(d => d.status === 'won').length,
    lost: disputes.filter(d => d.status === 'lost').length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white mb-2">Disputas e Chargebacks</h1>
        <p className="text-gray-400">Gerencie disputas de transações e chargebacks</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
          <div className="text-sm text-gray-400 mb-1">Total</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
          <div className="text-sm text-gray-400 mb-1">Abertas</div>
          <div className="text-2xl font-bold text-yellow-500">{stats.open}</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
          <div className="text-sm text-gray-400 mb-1">Em Análise</div>
          <div className="text-2xl font-bold text-blue-500">{stats.under_review}</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
          <div className="text-sm text-gray-400 mb-1">Ganhas</div>
          <div className="text-2xl font-bold text-green-500">{stats.won}</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
          <div className="text-sm text-gray-400 mb-1">Perdidas</div>
          <div className="text-2xl font-bold text-red-500">{stats.lost}</div>
        </div>
      </div>

      {showEvidenceModal && selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl max-w-lg w-full border border-gray-800">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Enviar Evidências</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Arquivo de Evidência
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      id="evidence"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="evidence"
                      className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-700 rounded-xl hover:border-amber-500 transition-colors cursor-pointer bg-[#0f0f0f] hover:bg-gray-900"
                    >
                      {evidenceFile ? (
                        <div className="flex items-center gap-2 text-sm text-gray-200">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <span>{evidenceFile.name}</span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                          <span className="text-sm text-gray-400">Clique para fazer upload</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Notas Adicionais
                  </label>
                  <textarea
                    value={evidenceNotes}
                    onChange={(e) => setEvidenceNotes(e.target.value)}
                    rows={4}
                    placeholder="Adicione informações relevantes sobre a evidência..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-[#0f0f0f] focus:outline-none focus:ring-2 focus:ring-amber-500 text-white resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowEvidenceModal(false);
                      setSelectedDispute(null);
                      setEvidenceFile(null);
                      setEvidenceNotes('');
                    }}
                    className="flex-1 py-3 border-2 border-gray-700 text-gray-300 font-semibold rounded-lg hover:bg-gray-800 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submitEvidence}
                    disabled={!evidenceFile}
                    className="flex-1 py-3 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-500 text-black font-semibold rounded-lg transition-all disabled:opacity-50"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-white">Lista de Disputas</h2>
          </div>
          <div className="flex gap-2">
            {['all', 'open', 'under_review', 'won', 'lost'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedStatus === status
                    ? 'bg-amber-500 text-black'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {status === 'all' ? 'Todas' : getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredDisputes.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                {selectedStatus === 'all' ? 'Nenhuma disputa registrada' : `Nenhuma disputa ${getStatusLabel(selectedStatus).toLowerCase()}`}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Quando houver disputas, elas aparecerão aqui
              </p>
            </div>
          ) : (
            filteredDisputes.map((dispute) => {
              const daysUntilDue = getDaysUntilDue(dispute.due_date);
              const isUrgent = daysUntilDue !== null && daysUntilDue <= 3;

              return (
                <div
                  key={dispute.id}
                  className={`bg-[#0f0f0f] rounded-lg p-4 border transition-all ${
                    isUrgent ? 'border-red-500' : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(dispute.status)}`}>
                          {getStatusLabel(dispute.status)}
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300">
                          {getTypeLabel(dispute.type)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mb-1">
                        <span className="font-medium text-white">Motivo:</span> {dispute.reason}
                      </div>
                      <div className="text-sm text-gray-400">
                        <span className="font-medium text-white">Valor:</span>{' '}
                        {parseFloat(dispute.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </div>
                    {dispute.status === 'open' && (
                      <button
                        onClick={() => {
                          setSelectedDispute(dispute);
                          setShowEvidenceModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-all text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        Enviar Evidência
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-800">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Aberta em {formatDate(dispute.created_at)}</span>
                    </div>
                    {dispute.due_date && (
                      <div className={`flex items-center gap-1 ${isUrgent ? 'text-red-500 font-medium' : ''}`}>
                        <Clock className="w-3 h-3" />
                        <span>
                          {daysUntilDue !== null && daysUntilDue > 0
                            ? `Responder em ${daysUntilDue} ${daysUntilDue === 1 ? 'dia' : 'dias'}`
                            : 'Prazo vencido'}
                        </span>
                      </div>
                    )}
                    {dispute.evidence_url && (
                      <div className="flex items-center gap-1 text-green-500">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Evidência enviada</span>
                      </div>
                    )}
                  </div>

                  {dispute.resolution_notes && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <div className="text-xs text-gray-400 mb-1">Notas de Resolução:</div>
                      <div className="text-sm text-white">{dispute.resolution_notes}</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Disputes;
