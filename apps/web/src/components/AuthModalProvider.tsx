'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { AuthModal } from './AuthModal';

type AuthModalContextValue = {
  openAuthModal: (intent?: string, mode?: 'login' | 'signup') => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<'login' | 'signup' | undefined>(undefined);

  const openAuthModal = (nextIntent?: string, nextMode?: 'login' | 'signup') => {
    setIntent(nextIntent);
    setMode(nextMode);
    setOpen(true);
  };

  const value = useMemo(() => ({ openAuthModal }), []);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal
        open={open}
        onClose={() => setOpen(false)}
        intent={intent}
        initialMode={mode}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }
  return context;
}
