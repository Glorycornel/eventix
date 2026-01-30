'use client';

import { AuthForm } from './AuthForm';

type AuthPromptProps = {
  title: string;
  description?: string;
};

export function AuthPrompt({ title, description }: AuthPromptProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-16">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">{title}</h1>
        {description ? <p className="text-sm text-neutral-300">{description}</p> : null}
      </header>
      <AuthForm helper="Sign in or create an account to continue." />
    </main>
  );
}
