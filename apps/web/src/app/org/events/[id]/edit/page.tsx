'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { API_BASE } from '../../../../../lib/api';
import { BannerUploadField } from '../../../../../components/BannerUploadField';
import { TokenField } from '../../../../../components/TokenField';

type EventFormState = {
  title: string;
  description: string;
  venue: string;
  city: string;
  startAt: string;
  endAt: string;
  bannerUrl: string;
  status: string;
};

export default function EditEventPage({
  params
}: {
  params: { id: string };
}) {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');
  const [formState, setFormState] = useState<EventFormState>({
    title: '',
    description: '',
    venue: '',
    city: '',
    startAt: '',
    endAt: '',
    bannerUrl: '',
    status: 'DRAFT'
  });

  useEffect(() => {
    if (!token) {
      return;
    }
    fetch(`${API_BASE}/events/${params.id}/owner`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((data) => {
        setFormState({
          title: data.title || '',
          description: data.description || '',
          venue: data.venue || '',
          city: data.city || '',
          startAt: data.startAt ? data.startAt.slice(0, 16) : '',
          endAt: data.endAt ? data.endAt.slice(0, 16) : '',
          bannerUrl: data.bannerUrl || '',
          status: data.status || 'DRAFT'
        });
        setStatus('');
      })
      .catch(() => setStatus('Unable to load event with that token.'));
  }, [token, params.id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('');
    try {
      const response = await fetch(`${API_BASE}/events/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formState.title,
          description: formState.description,
          venue: formState.venue,
          city: formState.city,
          startAt: formState.startAt,
          endAt: formState.endAt,
          bannerUrl: formState.bannerUrl
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setStatus('Event updated.');
    } catch {
      setStatus('Unable to update event.');
    }
  };

  const handlePublish = async () => {
    if (!token) {
      return;
    }
    await fetch(`${API_BASE}/events/${params.id}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    setStatus('Event published.');
  };

  const updateField = (key: keyof EventFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-16">
      <Link
        href="/org/events"
        className="text-xs uppercase tracking-[0.3em] text-emerald-300"
      >
        Back to organizer
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Edit event</h1>
          <p className="text-sm text-neutral-300">
            Status: {formState.status}
          </p>
        </div>
        {formState.status !== 'APPROVED' ? (
          <button
            type="button"
            onClick={handlePublish}
            className="rounded-full border border-emerald-400/60 px-5 py-2 text-sm text-emerald-200 transition hover:border-emerald-200"
          >
            Publish
          </button>
        ) : null}
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <TokenField onToken={setToken} />
        {status ? <p className="mt-3 text-xs text-emerald-200">{status}</p> : null}
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            Title
            <input
              value={formState.title}
              onChange={(event) => updateField('title', event.target.value)}
              required
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            City
            <input
              value={formState.city}
              onChange={(event) => updateField('city', event.target.value)}
              required
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm">
          Venue
          <input
            value={formState.venue}
            onChange={(event) => updateField('venue', event.target.value)}
            required
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Description
          <textarea
            value={formState.description}
            onChange={(event) => updateField('description', event.target.value)}
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
              value={formState.startAt}
              onChange={(event) => updateField('startAt', event.target.value)}
              required
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            End time
            <input
              type="datetime-local"
              value={formState.endAt}
              onChange={(event) => updateField('endAt', event.target.value)}
              required
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>
        <BannerUploadField
          token={token}
          value={formState.bannerUrl}
          onChange={(value) => updateField('bannerUrl', value)}
        />
        <button
          type="submit"
          className="mt-2 w-fit rounded-full border border-emerald-400/60 px-6 py-2 text-sm text-emerald-200 transition hover:border-emerald-200"
        >
          Save changes
        </button>
      </form>
    </main>
  );
}
