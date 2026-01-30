'use client';

import { useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';
import { useAuth } from './AuthProvider';
import { useAuthModal } from './AuthModalProvider';

type Profile = {
  displayName: string;
};

export function DiscoverAuthActions() {
  const { token, clearToken } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [name, setName] = useState('');

  useEffect(() => {
    if (!token) {
      setName('');
      return;
    }

    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Profile) => {
        setName(data.displayName || '');
      })
      .catch(() => {
        setName('');
      });
  }, [token]);

  if (token) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70">
          Welcome to Eventix {name || 'there'}
        </div>
        <button
          type="button"
          onClick={clearToken}
          className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-white/50"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() =>
          openAuthModal('Sign in or create an account to save events and book tickets.')
        }
        className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-white/50"
      >
        Sign in
      </button>
      <button
        type="button"
        onClick={() =>
          openAuthModal('Sign in or create an account to save events and book tickets.')
        }
        className="rounded-full border border-emerald-400/60 bg-emerald-300/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-emerald-200 transition hover:border-emerald-200"
      >
        Sign up
      </button>
    </div>
  );
}
