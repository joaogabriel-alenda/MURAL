import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    loginDemo,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);
      if (authModalMode === 'login') {
        await login(email, password);
      } else {
        if (!displayName.trim()) {
          throw new Error('Informe seu nome de exibição');
        }
        await register(email, password, displayName);
      }
      // Reset form on success
      setEmail('');
      setPassword('');
      setDisplayName('');
    } catch (err: any) {
      setError(err.message || 'Erro durante a autenticação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string) => {
    setError(null);
    try {
      setIsSubmitting(true);
      await loginDemo(demoEmail);
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar com usuário demo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white">
              {authModalMode === 'login' ? 'Entrar no Mural' : 'Criar Nova Conta'}
            </h2>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/30">
          <button
            type="button"
            onClick={() => {
              openAuthModal('login');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition cursor-pointer ${
              authModalMode === 'login'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Já tenho conta
          </button>
          <button
            type="button"
            onClick={() => {
              openAuthModal('register');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition cursor-pointer ${
              authModalMode === 'register'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Cadastrar-se
          </button>
        </div>

        {/* Demo Fast Login Box */}
        <div className="px-6 pt-4 pb-2 bg-indigo-950/20 border-b border-indigo-900/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Acesso Rápido de Teste (1 Clique):
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('carlos.dev@exemplo.com')}
              disabled={isSubmitting}
              className="px-2 py-1.5 rounded-lg text-[11px] font-medium bg-zinc-800 hover:bg-indigo-900/40 text-zinc-200 border border-zinc-700/80 transition cursor-pointer text-center truncate"
            >
              Carlos Dev
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('ana.silva@exemplo.com')}
              disabled={isSubmitting}
              className="px-2 py-1.5 rounded-lg text-[11px] font-medium bg-zinc-800 hover:bg-indigo-900/40 text-zinc-200 border border-zinc-700/80 transition cursor-pointer text-center truncate"
            >
              Ana Silva
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('mariana.geek@exemplo.com')}
              disabled={isSubmitting}
              className="px-2 py-1.5 rounded-lg text-[11px] font-medium bg-zinc-800 hover:bg-indigo-900/40 text-zinc-200 border border-zinc-700/80 transition cursor-pointer text-center truncate"
            >
              Mariana C.
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Nome de exibição *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu Nome ou Nickname"
                  className="w-full pl-9 pr-3.5 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  required={authModalMode === 'register'}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              E-mail *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full pl-9 pr-3.5 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Senha *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                minLength={6}
                className="w-full pl-9 pr-3.5 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <span>
                  {authModalMode === 'login' ? 'Entrar na Conta' : 'Criar Minha Conta'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
