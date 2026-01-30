'use client';

import { AuthForm } from './AuthForm';

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  intent?: string;
  initialMode?: 'login' | 'signup';
};

export function AuthModal({ open, onClose, intent, initialMode }: AuthModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-neutral-950/95 p-6 text-white shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Account</p>
            <h3 className="text-2xl font-semibold">Sign in to continue</h3>
            {intent ? <p className="mt-2 text-sm text-neutral-300">{intent}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl"
          >
            &times;
          </button>
        </div>

        <div className="mt-6">
          <AuthForm
            compact
            initialMode={initialMode}
            headline="Use your Eventix account"
            onSuccess={onClose}
            helper="Use your Eventix account to unlock tickets, saved events, and organizer tools."
          />
        </div>
      </div>
    </div>
  );
}
