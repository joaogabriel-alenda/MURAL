import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types.ts';
import { api, authStorage } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, avatarUrl?: string) => Promise<void>;
  loginDemo: (email?: string) => Promise<void>;
  logout: () => void;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authStorage.getUser());
  const [token, setToken] = useState<string | null>(() => authStorage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    async function checkCurrentSession() {
      const storedToken = authStorage.getToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await api.getMe();
        setUser(currentUser);
        setToken(storedToken);
      } catch (err) {
        console.warn('Sessão expirada ou inválida:', err);
        authStorage.clear();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkCurrentSession();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setUser(res.user);
    setToken(res.token);
    setIsAuthModalOpen(false);
  };

  const register = async (email: string, pass: string, name: string, avatarUrl?: string) => {
    const res = await api.register(email, pass, name, avatarUrl);
    setUser(res.user);
    setToken(res.token);
    setIsAuthModalOpen(false);
  };

  const loginDemo = async (email?: string) => {
    const res = await api.loginDemo(email);
    setUser(res.user);
    setToken(res.token);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setToken(null);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        loginDemo,
        logout,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return context;
}
