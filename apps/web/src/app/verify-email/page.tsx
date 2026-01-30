'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { API_BASE } from '../../lib/api';
import { useAuthModal } from '../../components/AuthModalProvider';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState('Verifying your email...');
  const { openAuthModal } = useAuthModal();

  useEffect(() => {
    if (!token) {
      setStatus('Missing verification token.');
      return;
    }

    fetch(`${API_BASE}/auth/verify?token=${encodeURIComponent(token)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(() => {
        setStatus('Email verified. You can now sign in.');
      })
      .catch(() => {
        setStatus('Verification link is invalid or expired.');
      });
  }, [token]);

  return (
    <>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Confirm your email</h1>
        <p className="text-sm text-neutral-300">{status}</p>
      </header>
      <button
        type="button"
        onClick={() => openAuthModal('Sign in to continue.')}
        className="w-fit rounded-full border border-emerald-400/60 px-6 py-2 text-sm text-emerald-200 transition hover:border-emerald-200"
      >
        Sign in
      </button>
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
