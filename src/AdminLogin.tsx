import { useState } from 'react';
import { Eye, EyeOff, Shield, Ghost } from 'lucide-react';
import { supabase } from './lib/supabase';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!supabase) {
        setError('Erro de configuração do banco de dados');
        setIsLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (authError || !authData.user) {
        setError('Email ou senha incorretos');
        setIsLoading(false);
        return;
      }

      const { data: adminRole, error: roleError } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (roleError || !adminRole) {
        await supabase.auth.signOut();
        setError('Acesso negado. Você não tem permissão de administrador');
        setIsLoading(false);
        return;
      }

      onLoginSuccess();
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!supabase) {
        setError('Erro de configuração do banco de dados');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        resetEmail.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        setError('Email não encontrado no sistema');
        setIsLoading(false);
        return;
      }

      setResetSuccess(true);
      setError('');
      setIsLoading(false);
    } catch (err) {
      setError('Erro ao enviar email de recuperação');
      setIsLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex relative">
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-16 bg-[#0f0f0f]">
          <div className="text-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-500/20 blur-3xl rounded-full"></div>
            <div className="relative inline-flex items-center gap-3 mb-6">
              <Ghost className="w-16 h-16 text-amber-500 animate-pulse drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
              <span className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">GoldsPay</span>
            </div>
            <div className="relative">
              <Shield className="w-24 h-24 text-amber-500 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]" />
              <p className="text-gray-400 text-lg max-w-md mx-auto">Recuperação de Senha</p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 bg-[#1a1a1a] flex items-center justify-center p-6 lg:p-16">
          <div className="w-full max-w-md">
            <div className="inline-flex items-center gap-2 mb-8 lg:hidden">
              <Ghost className="w-8 h-8 text-amber-500 animate-pulse" />
              <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent">GoldsPay</span>
            </div>

            <div className="space-y-6">
              {resetSuccess ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-green-500" />
                  </div>
                  <h1 className="text-2xl font-semibold text-white">Email Enviado!</h1>
                  <p className="text-gray-400 text-sm">
                    Enviamos um link de recuperação para seu email. Verifique sua caixa de entrada e siga as instruções.
                  </p>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetSuccess(false);
                      setResetEmail('');
                    }}
                    className="w-full py-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-500 text-black font-bold rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Voltar ao Login
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="w-8 h-8 text-amber-500" />
                      <h1 className="text-2xl font-semibold text-white">
                        Esqueci minha senha
                      </h1>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Digite seu email para receber um link de recuperação
                    </p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div>
                      <label htmlFor="resetEmail" className="block text-sm font-medium text-white mb-2">
                        E-mail
                      </label>
                      <input
                        type="email"
                        id="resetEmail"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="admin@exemplo.com"
                        required
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-700 bg-[#0f0f0f] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-white placeholder:text-gray-500"
                      />
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-sm text-red-500">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || !resetEmail}
                      className="w-full py-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-500 text-black font-bold rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setError('');
                        setResetEmail('');
                      }}
                      className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Voltar ao login
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex relative">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-16 bg-[#0f0f0f]">
        <div className="text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-500/20 blur-3xl rounded-full"></div>
          <div className="relative inline-flex items-center gap-3 mb-6">
            <Ghost className="w-16 h-16 text-amber-500 animate-pulse drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
            <span className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">GoldsPay</span>
          </div>
          <div className="relative">
            <Shield className="w-24 h-24 text-amber-500 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]" />
            <p className="text-gray-400 text-lg max-w-md mx-auto">Painel Administrativo</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 bg-[#1a1a1a] flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md">
          <div className="inline-flex items-center gap-2 mb-8 lg:hidden">
            <Ghost className="w-8 h-8 text-amber-500 animate-pulse" />
            <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent">GoldsPay</span>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-amber-500" />
                <h1 className="text-2xl font-semibold text-white">
                  Acesso Administrativo
                </h1>
              </div>
              <p className="text-gray-400 text-sm">
                Digite suas credenciais para acessar o painel administrativo
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@exemplo.com"
                  required
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-700 bg-[#0f0f0f] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    className="w-full px-4 py-3.5 pr-12 rounded-xl border border-gray-700 bg-[#0f0f0f] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-white placeholder:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full py-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-500 text-black font-bold rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? 'Verificando...' : 'Acessar Painel'}
              </button>

              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="w-full text-center text-sm text-gray-400 hover:text-amber-500 transition-colors"
              >
                Esqueci minha senha
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
