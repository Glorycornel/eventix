'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { API_BASE } from '../../../../lib/api';
import { BannerUploadField } from '../../../../components/BannerUploadField';
import { AuthPrompt } from '../../../../components/AuthPrompt';
import { useAuth } from '../../../../components/AuthProvider';

export default function NewEventPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('');

    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get('title') || ''),
      description: String(form.get('description') || ''),
      venue: String(form.get('venue') || ''),
      city: String(form.get('city') || ''),
      startAt: String(form.get('startAt') || ''),
      endAt: String(form.get('endAt') || ''),
      bannerUrl
    };

    try {
      const response = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setStatus('Event created.');
      setBannerUrl('');
      event.currentTarget.reset();
    } catch {
      setStatus('Unable to create event. Check your details and try again.');
    }
  };

  if (!token) {
    return (
      <AuthPrompt
        title="Sign in to create events"
        description="Create your organizer account to draft and publish new events."
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-16">
      <Link
        href="/org/events"
        className="text-xs uppercase tracking-[0.3em] text-emerald-300"
      >
        Back to organizer
      </Link>

      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">Create a new event</h1>
        <p className="text-sm text-neutral-300">
          Draft now, add ticket types, then publish when ready.
        </p>
      </header>

      {status ? (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs text-emerald-200">{status}</p>
        </section>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            Title
            <input
              name="title"
              required
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            City
            <input
              name="city"
              required
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm">
          Venue
          <input
            name="venue"
            required
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Description
          <textarea
            name="description"
            required
            rows={4}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            Start time
            <input
              type="datetime-local"
              name="startAt"
              required
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            End time
            <input
              type="datetime-local"
              name="endAt"
              required
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>
        <BannerUploadField
          token={token}
          value={bannerUrl}
          onChange={setBannerUrl}
        />
        <button
          type="submit"
          className="mt-2 w-fit rounded-full border border-emerald-400/60 px-6 py-2 text-sm text-emerald-200 transition hover:border-emerald-200"
        >
          Save draft
        </button>
      </form>
    </main>
  );
}
