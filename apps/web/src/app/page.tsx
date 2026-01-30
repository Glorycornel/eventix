import Image from 'next/image';
import { apiFetch } from '../lib/api';
import { SidebarMenu } from '../components/SidebarMenu';
import { DiscoverContent, EventItem } from '../components/DiscoverContent';
import { AuthLink } from '../components/AuthLink';
import { DiscoverAuthActions } from '../components/DiscoverAuthActions';

export default async function HomePage() {
  let events: EventItem[] = [];

  try {
    events = await apiFetch<EventItem[]>('/events', { cache: 'no-store' });
  } catch {
    events = [];
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-6 py-8">
      <header className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-end">
        <nav className="flex flex-wrap items-center justify-between gap-4 md:col-span-2">
          <div className="flex items-center gap-3 -ml-6 md:-ml-12">
            <Image
              src="/images/eventix_logo.png"
              width={600}
              height={320}
              alt="Eventix"
              className="h-[160px] w-auto"
            />
            <span className="sr-only">Eventix</span>
          </div>
          <div className="flex items-center gap-3">
            <DiscoverAuthActions />
            <SidebarMenu />
          </div>
        </nav>
        <div className="space-y-1">
          <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
            Find the events that move your city.
          </h1>
          <p className="max-w-xl text-base text-neutral-300 md:text-lg">
            Browse approved events and reserve your seat. Organizers can launch new events in
            minutes.
          </p>
        </div>
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <p className="text-sm text-neutral-300">Organizer quick links</p>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <AuthLink
              href="/org/events"
              className="rounded-full border border-emerald-400/50 px-4 py-2 text-emerald-200 transition hover:border-emerald-200"
              intent="Sign in to manage your events."
            >
              Manage events
            </AuthLink>
            <AuthLink
              href="/org/events/new"
              className="rounded-full border border-white/20 px-4 py-2 text-neutral-200 transition hover:border-white/60"
              intent="Sign in to create a new event."
            >
              Create new event
            </AuthLink>
          </div>
        </div>
      </header>

      <DiscoverContent events={events} />
    </main>
  );
}
