'use client';

import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE } from '../../lib/api';
import { useAuthModal } from '../../components/AuthModalProvider';
import { useAuth } from '../../components/AuthProvider';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState('Verifying your email...');
  const [errorState, setErrorState] = useState<'none' | 'invalid' | 'verified'>('none');
  const [email, setEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const didVerify = useRef(false);
  const { openAuthModal } = useAuthModal();
  const router = useRouter();
  const { token: authToken } = useAuth();

  useEffect(() => {
    if (authToken) {
      router.push('/');
    }
  }, [authToken, router]);

  useEffect(() => {
    if (didVerify.current) {
      return;
    }
    if (!token) {
      setStatus('Missing verification token.');
      return;
    }
    didVerify.current = true;

    fetch(`${API_BASE}/auth/verify?token=${encodeURIComponent(token)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(() => {
        setStatus('Email verified. You can now sign in.');
        setErrorState('verified');
      })
      .catch(() => {
        setStatus('Verification link is invalid or expired.');
        setErrorState('invalid');
      });
  }, [token]);

  const handleResend = async () => {
    if (!email) {
      setResendStatus('Enter your email to resend the verification link.');
      return;
    }

    setResendStatus('Sending verification email...');
    try {
      const response = await fetch(`${API_BASE}/auth/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error();
      }

      const data = (await response.json()) as { message?: string };
      setResendStatus(data.message || 'Verification email sent.');
    } catch {
      setResendStatus('Unable to resend verification email.');
    }
  };

  return (
    <>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Confirm your email</h1>
        <p className="text-sm text-neutral-300">{status}</p>
      </header>
      <button
        type="button"
        onClick={() =>
          openAuthModal('Sign in to continue.', 'login', () => router.push('/'))
        }
        className="w-fit rounded-full border border-emerald-400/60 px-6 py-2 text-sm text-emerald-200 transition hover:border-emerald-200"
      >
        Sign in
      </button>
      {errorState === 'verified' ? (
        <div className="rounded-3xl border border-emerald-400/40 bg-emerald-500/10 p-6 text-sm text-emerald-100">
          <p className="text-emerald-100">
            Your email is verified. You can sign in now.
          </p>
        </div>
      ) : null}
      {errorState === 'invalid' ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-neutral-200">
          <p className="text-neutral-300">
            Need a new verification email? Enter your account email below.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-full border border-white/10 bg-neutral-950/70 px-4 py-2 text-sm text-white"
            />
            <button
              type="button"
              onClick={handleResend}
              className="rounded-full border border-emerald-400/60 px-5 py-2 text-xs uppercase tracking-[0.3em] text-emerald-200 transition hover:border-emerald-200"
            >
              Resend
            </button>
          </div>
          {resendStatus ? <p className="mt-3 text-xs text-emerald-200">{resendStatus}</p> : null}
        </div>
      ) : null}
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
      <Link href="/" className="text-xs uppercase tracking-[0.3em] text-emerald-300">
        Back to events
      </Link>
      <Suspense fallback={<p className="text-sm text-neutral-300">Loading...</p>}>
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
