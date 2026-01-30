'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { AuthPrompt } from '../../components/AuthPrompt';
import { useAuth } from '../../components/AuthProvider';
import { loadSavedEventIds } from '../../lib/saved';
import { formatDateRange } from '../../lib/format';

type EventItem = {
  id: string;
  title: string;
  description: string;
  city: string;
  venue: string;
  startAt: string;
  endAt: string;
};

export default function SavedEventsPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [status, setStatus] = useState('Loading saved events...');
  const savedIds = useMemo(() => loadSavedEventIds(), []);

  useEffect(() => {
    if (!token) {
      setEvents([]);
      setStatus('Sign in to view saved events.');
      return;
    }

    if (!savedIds.length) {
      setEvents([]);
      setStatus('No saved events yet.');
      return;
    }

    apiFetch<EventItem[]>('/events', { cache: 'no-store' })
      .then((data) => {
        const saved = data.filter((event) => savedIds.includes(event.id));
        setEvents(saved);
        setStatus(saved.length ? '' : 'No saved events yet.');
      })
      .catch(() => {
        setEvents([]);
        setStatus('Unable to load saved events.');
      });
  }, [savedIds, token]);

  if (!token) {
    return (
      <AuthPrompt
        title="Sign in to view saved events"
        description="Keep your favorite events here for quick access."
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-16">
      <Link href="/" className="text-xs uppercase tracking-[0.3em] text-emerald-300">
        Back to events
      </Link>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Saved events</h1>
        <p className="text-sm text-neutral-300">Your short list of events to revisit.</p>
      </header>

      {status ? (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-neutral-300">
          {status}
        </section>
      ) : null}

      <section className="grid gap-4">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-emerald-300/60"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">{event.city}</p>
            <h2 className="mt-2 text-2xl font-semibold">{event.title}</h2>
            <p className="mt-2 text-sm text-neutral-300 line-clamp-2">{event.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
              <span>{event.venue}</span>
              <span>-</span>
              <span>{formatDateRange(event.startAt, event.endAt)}</span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
