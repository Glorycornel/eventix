'use client';

import Link from 'next/link';
import { AuthForm } from '../../components/AuthForm';

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-16">
      <Link href="/" className="text-xs uppercase tracking-[0.3em] text-emerald-300">
        Back to events
      </Link>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Welcome to Eventix</h1>
        <p className="text-sm text-neutral-300">
          Sign in to save events, manage tickets, or organize your own experiences.
        </p>
      </header>
      <AuthForm />
    </main>
  );
}
