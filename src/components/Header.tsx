import React, { useState } from 'react';
import {
  Sparkles,
  PlusCircle,
  LogIn,
  LogOut,
  Database,
  Code2,
  User as UserIcon,
  Gamepad2,
  Film,
  Music,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface HeaderProps {
  onOpenCreate: () => void;
  onOpenSchemas: () => void;
  currentView: 'cards' | 'table';
  onViewChange: (view: 'cards' | 'table') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreate,
  onOpenSchemas,
  currentView,
  onViewChange,
}) => {
  const { user, logout, openAuthModal, loginDemo } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-indigo-500/20 text-white font-bold">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Mural<span className="text-indigo-400">.</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  <Gamepad2 className="w-3 h-3 text-purple-400" />
                  <Film className="w-3 h-3 text-amber-400" />
                  <Music className="w-3 h-3 text-emerald-400" />
                  Indicações
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Games, Filmes e Músicas curados pela comunidade
              </p>
            </div>
          </div>

          {/* View Mode Switcher (Cards vs Tabela CRUD) */}
          <div className="hidden md:flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <button
              onClick={() => onViewChange('cards')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                currentView === 'cards'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              🖼️ Mural (Cards)
            </button>
            <button
              onClick={() => onViewChange('table')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                currentView === 'table'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              📋 Tabela CRUD (Todas)
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Database Schemas button */}
            <button
              onClick={onOpenSchemas}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
              title="Ver Schema do Banco (SQL e Prisma)"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Schema DB</span>
              <span className="text-[10px] text-zinc-400 font-mono hidden lg:inline">
                (Prisma/SQL)
              </span>
            </button>

            {/* Create Recommendation Button */}
            <button
              onClick={onOpenCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/20 transition cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Indicação</span>
            </button>

            {/* User Session Area */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 transition cursor-pointer"
                >
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.displayName}`}
                    alt={user.displayName}
                    className="w-7 h-7 rounded-full object-cover bg-zinc-800"
                  />
                  <span className="text-xs font-medium max-w-[100px] truncate hidden sm:inline">
                    {user.displayName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl py-2 z-50">
                    <div className="px-3 py-2 border-b border-zinc-800/80">
                      <p className="text-xs font-semibold text-zinc-200 truncate">
                        {user.displayName}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate font-mono">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenCreate();
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 transition cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                        Criar nova indicação
                      </button>
                    </div>

                    <div className="border-t border-zinc-800/80 pt-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sair da conta
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loginDemo()}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-300 bg-amber-950/40 border border-amber-800/50 hover:bg-amber-900/40 transition cursor-pointer"
                  title="Entrar imediatamente com uma conta de teste"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Demo</span>
                </button>

                <button
                  onClick={() => openAuthModal('login')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Entrar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
