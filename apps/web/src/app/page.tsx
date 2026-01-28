import Link from 'next/link';
import { apiFetch } from '../lib/api';
import { formatDateRange } from '../lib/format';

type EventItem = {
  id: string;
  title: string;
  description: string;
  city: string;
  venue: string;
  startAt: string;
  endAt: string;
  bannerUrl: string | null;
};

export default async function HomePage() {
  let events: EventItem[] = [];

  try {
    events = await apiFetch<EventItem[]>('/events', { cache: 'no-store' });
  } catch {
    events = [];
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-16">
      <header className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-end">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">
            Eventix
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
            Find the nights that move your city.
          </h1>
          <p className="max-w-xl text-base text-neutral-300 md:text-lg">
            Browse approved events and reserve your seat. Organizers can launch
            new events in minutes.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <p className="text-sm text-neutral-300">Organizer quick links</p>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <Link
              href="/org/events"
              className="rounded-full border border-emerald-400/50 px-4 py-2 text-emerald-200 transition hover:border-emerald-200"
            >
              Manage events
            </Link>
            <Link
              href="/org/events/new"
              className="rounded-full border border-white/20 px-4 py-2 text-neutral-200 transition hover:border-white/60"
            >
              Create new event
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {events.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-neutral-300">
            No approved events yet. Create one from the organizer panel.
          </div>
        ) : (
          events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-emerald-300/60"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-transparent to-sky-400/10 opacity-0 transition group-hover:opacity-100" />
              <div className="relative z-10 flex flex-col gap-3">
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
                  {event.city}
                </p>
                <h2 className="text-2xl font-semibold">{event.title}</h2>
                <p className="text-sm text-neutral-300 line-clamp-2">
                  {event.description}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                  <span>{event.venue}</span>
                  <span>-</span>
                  <span>{formatDateRange(event.startAt, event.endAt)}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
