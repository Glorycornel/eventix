'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AuthContextValue = {
  token: string;
  setToken: (token: string) => void;
  clearToken: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState('');

  useEffect(() => {
    const stored = window.localStorage.getItem('eventix_token') || '';
    setTokenState(stored);
  }, []);

  const setToken = (value: string) => {
    setTokenState(value);
    if (value) {
      window.localStorage.setItem('eventix_token', value);
    } else {
      window.localStorage.removeItem('eventix_token');
    }
  };

  const clearToken = () => setToken('');

  const value = useMemo(
    () => ({
      token,
      setToken,
      clearToken,
    }),
    [token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
