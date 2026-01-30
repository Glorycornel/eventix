'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_BASE } from '../../lib/api';
import { AuthPrompt } from '../../components/AuthPrompt';
import { useAuth } from '../../components/AuthProvider';

type AccountProfile = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
};

export default function AccountPage() {
  const { token, clearToken } = useAuth();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [status, setStatus] = useState('Loading account...');

  useEffect(() => {
    if (!token) {
      setProfile(null);
      setStatus('Sign in to view your account.');
      return;
    }

    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: AccountProfile) => {
        setProfile(data);
        setStatus('');
      })
      .catch(() => {
        setProfile(null);
        setStatus('Unable to load account details.');
      });
  }, [token]);

  if (!token) {
    return (
      <AuthPrompt
        title="Sign in to view your account"
        description="See your profile details and manage your Eventix access."
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-16">
      <Link href="/" className="text-xs uppercase tracking-[0.3em] text-emerald-300">
        Back to events
      </Link>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Account</h1>
        <p className="text-sm text-neutral-300">Your Eventix profile and access.</p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        {profile ? (
          <div className="grid gap-2 text-sm text-neutral-200">
            <p>
              <span className="text-neutral-400">Name:</span> {profile.displayName}
            </p>
            <p>
              <span className="text-neutral-400">Email:</span> {profile.email}
            </p>
            <p>
              <span className="text-neutral-400">Role:</span> {profile.role}
            </p>
            <p>
              <span className="text-neutral-400">Joined:</span>{' '}
              {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <p className="text-xs text-emerald-200">{status}</p>
        )}
      </section>

      <button
        type="button"
        onClick={clearToken}
        className="w-fit rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-white/40"
      >
        Sign out
      </button>
    </main>
  );
}
