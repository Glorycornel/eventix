'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_BASE } from '../../../lib/api';
import { TokenField } from '../../../components/TokenField';

type EventItem = {
  id: string;
  title: string;
  status: string;
  city: string;
  venue: string;
};

export default function OrganizerEventsPage() {
  const [token, setToken] = useState('');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setEvents([]);
      return;
    }

    fetch(`${API_BASE}/events/mine`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((data: EventItem[]) => {
        setEvents(data);
        setError('');
      })
      .catch(() => setError('Unable to load events with that token.'));
  }, [token]);

  const handlePublish = async (eventId: string) => {
    if (!token) {
      return;
    }
    await fetch(`${API_BASE}/events/${eventId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const refreshed = await fetch(`${API_BASE}/events/mine`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (refreshed.ok) {
      setEvents(await refreshed.json());
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">
            Organizer
          </p>
          <h1 className="text-3xl font-semibold">Your events</h1>
        </div>
        <Link
          href="/org/events/new"
          className="rounded-full border border-emerald-400/60 px-5 py-2 text-sm text-emerald-200 transition hover:border-emerald-200"
        >
          Create event
        </Link>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <TokenField onToken={setToken} />
        {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
      </section>

      <section className="grid gap-4">
        {events.length === 0 ? (
          <p className="text-sm text-neutral-400">
            No events yet. Create one to get started.
          </p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div>
                <h2 className="text-xl font-semibold">{event.title}</h2>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
                  {event.status}
                </p>
                <p className="mt-2 text-sm text-neutral-300">
                  {event.venue} - {event.city}
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                <Link
                  href={`/org/events/${event.id}/tickets`}
                  className="rounded-full border border-white/20 px-4 py-2 transition hover:border-white/60"
                >
                  Ticket types
                </Link>
                <Link
                  href={`/org/events/${event.id}/edit`}
                  className="rounded-full border border-white/20 px-4 py-2 transition hover:border-white/60"
                >
                  Edit
                </Link>
                {event.status !== 'APPROVED' ? (
                  <button
                    type="button"
                    onClick={() => handlePublish(event.id)}
                    className="rounded-full border border-emerald-400/60 px-4 py-2 text-emerald-200 transition hover:border-emerald-200"
                  >
                    Publish
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
