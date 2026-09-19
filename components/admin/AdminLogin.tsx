import { useState, type FormEvent } from 'react';
import { ShieldCheck, Lock, User, ArrowLeft, AlertCircle, Scissors } from 'lucide-react';
import { setAdminLoggedIn } from '../../utils/storage';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToClient: () => void;
}

export function AdminLogin({ onLoginSuccess, onBackToClient }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Credenciais administrativas padrão: admin / admin123
    const userClean = username.trim().toLowerCase();
    if (!userClean || !password) {
      setError('Por favor, informe o usuário e a senha.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      if ((userClean === 'admin' && password === 'admin123') || (userClean === 'barbearia' && password === 'admin')) {
        setAdminLoggedIn(true);
        onLoginSuccess();
      } else {
        setError('Usuário ou senha incorretos. Verifique suas credenciais.');
        setIsLoading(false);
      }
    }, 400);
  };

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between p-4 sm:p-6">
      <div className="w-full max-w-sm mx-auto my-auto pt-6 pb-8">
        {/* Voltar para área do cliente */}
        <button
          id="btn-voltar-cliente-login"
          type="button"
          onClick={onBackToClient}
          className="inline-flex items-center gap-2 text-xs text-stone-400 hover:text-amber-400 transition mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Área do Cliente</span>
        </button>

        {/* Card de Login */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/10">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-white">Acesso Administrativo</h1>
            <p className="text-xs text-stone-400 mt-1">
              Gerencie a agenda, clientes e serviços da barbearia
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="admin-input-user"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="w-full pl-10 pr-3 py-3 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-input-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-3 py-3 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <button
              id="btn-admin-entrar"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-stone-950 font-black rounded-xl text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Entrar no Painel</span>
              )}
            </button>
          </form>

          {/* Dica de demonstração para acesso rápido */}
          <div className="mt-6 pt-4 border-t border-stone-800/80 text-center">
            <p className="text-[11px] text-stone-500">
              Credenciais de demonstração:
            </p>
            <button
              type="button"
              id="btn-preencher-admin-demo"
              onClick={handleQuickFill}
              className="mt-1 text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
            >
              Preencher com admin / admin123
            </button>
          </div>
        </div>
      </div>

      <footer className="text-center text-[11px] text-stone-400 pb-2">
        Painel de Gestão da Barbearia • Segurança e Acesso Restrito
      </footer>
    </div>
  );
}
