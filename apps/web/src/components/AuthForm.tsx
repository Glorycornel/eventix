'use client';

import { FormEvent, useState } from 'react';
import { API_BASE } from '../lib/api';
import { useAuth } from './AuthProvider';

type AuthMode = 'login' | 'signup';

type AuthFormProps = {
  initialMode?: AuthMode;
  headline?: string;
  helper?: string;
  onSuccess?: () => void;
  compact?: boolean;
};

export function AuthForm({
  initialMode = 'login',
  headline,
  helper,
  onSuccess,
  compact = false,
}: AuthFormProps) {
  const { setToken } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('');

    const form = new FormData(event.currentTarget);
    if (mode === 'signup') {
      const password = String(form.get('password') || '');
      const confirmPassword = String(form.get('confirmPassword') || '');
      if (password !== confirmPassword) {
        setStatus('Passwords do not match.');
        return;
      }
    }
    const payload =
      mode === 'login'
        ? {
            email: String(form.get('email') || ''),
            password: String(form.get('password') || ''),
          }
        : {
            displayName: String(form.get('displayName') || ''),
            email: String(form.get('email') || ''),
            password: String(form.get('password') || ''),
          };

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = '';
        try {
          const data = (await response.json()) as { message?: string | string[] };
          if (Array.isArray(data.message)) {
            message = data.message.join(', ');
          } else if (data.message) {
            message = data.message;
          }
        } catch {
          message = await response.text();
        }
        throw new Error(message || 'Request failed.');
      }

      if (mode === 'login') {
        const data = (await response.json()) as { accessToken: string };
        setToken(data.accessToken);
        setStatus('Signed in.');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const data = (await response.json()) as { message?: string };
        setStatus(data.message || 'Check your email to confirm your account.');
      }
    } catch (error) {
      const fallback = mode === 'login' ? 'Login failed.' : 'Signup failed.';
      if (error instanceof Error && error.message) {
        setStatus(error.message);
      } else {
        setStatus(fallback);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={compact ? '' : 'rounded-3xl border border-white/10 bg-white/5 p-6'}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
            {mode === 'login' ? 'Welcome back' : 'Join Eventix'}
          </p>
          <h2 className="text-2xl font-semibold">
            {headline || (mode === 'login' ? 'Sign in to continue' : 'Create your account')}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setStatus('');
          }}
          className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-white/30"
        >
          {mode === 'login' ? 'Need an account?' : 'Have an account?'}
        </button>
      </div>

      {helper ? <p className="mt-2 text-sm text-neutral-300">{helper}</p> : null}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 text-sm">
        {mode === 'signup' ? (
          <label className="flex flex-col gap-2">
            Display name
            <input
              name="displayName"
              required
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
        ) : null}
        <label className="flex flex-col gap-2">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-2">
          Password
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              className="w-full bg-transparent text-sm text-white outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="text-neutral-300 transition hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M4 4l16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
              )}
            </button>
          </div>
        </label>
        {mode === 'signup' ? (
          <label className="flex flex-col gap-2">
            Confirm password
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2">
              <input
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={6}
                className="w-full bg-transparent text-sm text-white outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((value) => !value)}
                className="text-neutral-300 transition hover:text-white"
                aria-label={showConfirm ? 'Hide password confirmation' : 'Show password confirmation'}
              >
                {showConfirm ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M4 4l16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                  </svg>
                )}
              </button>
            </div>
          </label>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-fit rounded-full border border-emerald-400/60 px-6 py-2 text-sm text-emerald-200 transition hover:border-emerald-200 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:text-neutral-500"
        >
          {loading ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
        {status ? <p className="text-xs text-emerald-200">{status}</p> : null}
      </form>
    </div>
  );
}
