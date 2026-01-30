'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useAuthModal } from './AuthModalProvider';
import { loadSavedEventIds, persistSavedEventIds } from '../lib/saved';

type SavedToggleButtonProps = {
  eventId: string;
  className?: string;
};

export function SavedToggleButton({ eventId, className }: SavedToggleButtonProps) {
  const { token } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    setSavedIds(loadSavedEventIds());
  }, []);

  const isSaved = savedIds.includes(eventId);

  const toggleSaved = () => {
    if (!token) {
      openAuthModal('Sign in to save events for later.', 'login');
      return;
    }
    const updated = isSaved
      ? savedIds.filter((id) => id !== eventId)
      : [...savedIds, eventId];
    setSavedIds(updated);
    persistSavedEventIds(updated);
  };

  return (
    <button
      type="button"
      onClick={toggleSaved}
      className={
        className ||
        `rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em] transition ${
          isSaved
            ? 'border-emerald-400/60 text-emerald-200 hover:border-emerald-200'
            : 'border-white/20 text-white/70 hover:border-white/60 hover:text-white'
        }`
      }
    >
      {isSaved ? 'Saved' : 'Save'}
    </button>
  );
}
