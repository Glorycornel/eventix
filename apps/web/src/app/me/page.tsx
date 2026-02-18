'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_BASE } from '../../lib/api';
import { AuthPrompt } from '../../components/AuthPrompt';
import { SidebarMenu } from '../../components/SidebarMenu';
import { DiscoverAuthActions } from '../../components/DiscoverAuthActions';
import { loadSavedEventIds, subscribeSavedEventIds } from '../../lib/saved';
import { useAuth } from '../../components/AuthProvider';

type AccountProfile = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
};

type OrganizerEventSummary = {
  id: string;
  title: string;
  ticketSoldCount?: number;
  ticketsRemaining?: number | null;
};

type TicketSummary = {
  id: string;
  order: {
    event: {
      id: string;
      title: string;
      startAt: string;
      endAt: string;
    };
  };
};

type SavedEventSummary = {
  id: string;
  title: string;
  capacity?: number | null;
  ticketSoldCount?: number;
  ticketsRemaining?: number | null;
  startAt: string;
};

export default function AccountPage() {
  const { token, clearToken } = useAuth();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [status, setStatus] = useState('Loading account...');
  const [activityStatus, setActivityStatus] = useState('Loading activity...');
  const [activityCount, setActivityCount] = useState(0);
  const [activitySummary, setActivitySummary] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>(() => loadSavedEventIds());

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

  useEffect(() => {
    const unsubscribe = subscribeSavedEventIds(setSavedIds);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!token) {
      setActivityStatus('Sign in to view activity.');
      setActivityCount(0);
      setActivitySummary([]);
      return;
    }

    setActivityStatus('Loading activity...');
    const savedRequest =
      savedIds.length > 0
        ? fetch(`${API_BASE}/events/lookup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ ids: savedIds }),
          })
        : Promise.resolve(null);

    Promise.all([
      fetch(`${API_BASE}/me/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_BASE}/events/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      savedRequest,
    ])
      .then(async ([ticketsResponse, eventsResponse, savedResponse]) => {
        if (!ticketsResponse.ok || !eventsResponse.ok) {
          throw new Error('Unable to load activity.');
        }
        if (savedResponse && !savedResponse.ok) {
          throw new Error('Unable to load saved events.');
        }
        const tickets = (await ticketsResponse.json()) as TicketSummary[];
        const events = (await eventsResponse.json()) as OrganizerEventSummary[];
        const savedEvents = savedResponse
          ? ((await savedResponse.json()) as SavedEventSummary[])
          : [];
        const totalBookings = events.reduce((sum, event) => sum + (event.ticketSoldCount || 0), 0);
        const eventsWithBookings = events.filter(
          (event) => (event.ticketSoldCount || 0) > 0,
        ).length;
        const remainingSeats = events.reduce((sum, event) => {
          if (typeof event.ticketsRemaining === 'number') {
            return sum + event.ticketsRemaining;
          }
          return sum;
        }, 0);

        const summary: string[] = [];
        summary.push(`You have ${tickets.length} booked ticket(s).`);
        const now = Date.now();
        const upcomingBooked = tickets
          .map((ticket) => ({
            id: ticket.id,
            title: ticket.order.event.title,
            startAt: ticket.order.event.startAt,
          }))
          .filter((ticket) => new Date(ticket.startAt).getTime() > now)
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
          .slice(0, 3);
        if (upcomingBooked.length) {
          summary.push(
            `Upcoming booking(s): ${upcomingBooked
              .map(
                (ticket) => `${ticket.title} on ${new Date(ticket.startAt).toLocaleDateString()}`,
              )
              .join(', ')}.`,
          );
        }

        const soonBooked = upcomingBooked.filter((ticket) => {
          const daysUntil = (new Date(ticket.startAt).getTime() - now) / (1000 * 60 * 60 * 24);
          return daysUntil <= 7;
        });
        if (soonBooked.length) {
          summary.push(
            `Starting soon: ${soonBooked
              .map(
                (ticket) =>
                  `${ticket.title} in ${Math.max(
                    Math.ceil((new Date(ticket.startAt).getTime() - now) / (1000 * 60 * 60 * 24)),
                    1,
                  )} day(s)`,
              )
              .join(', ')}.`,
          );
        }

        const organizerLowAvailability = events
          .filter(
            (event) =>
              typeof event.ticketsRemaining === 'number' &&
              event.ticketsRemaining > 0 &&
              event.ticketsRemaining <= 10,
          )
          .map((event) => ({
            title: event.title,
            remaining: event.ticketsRemaining ?? 0,
          }));

        if (organizerLowAvailability.length) {
          summary.push(
            `Your events are filling fast: ${organizerLowAvailability
              .slice(0, 3)
              .map((event) => `${event.title} (${event.remaining} left)`)
              .join(', ')}.`,
          );
        }

        const savedLowAvailability = savedEvents
          .filter((event) => typeof event.capacity === 'number')
          .map((event) => ({
            title: event.title,
            remaining: event.ticketsRemaining ?? 0,
            capacity: event.capacity ?? 0,
          }))
          .filter((event) => {
            if (!event.capacity) {
              return false;
            }
            const remainingRatio = event.remaining / event.capacity;
            return event.remaining > 0 && (event.remaining <= 10 || remainingRatio <= 0.2);
          });

        if (savedLowAvailability.length) {
          summary.push(
            `Saved events nearing capacity: ${savedLowAvailability
              .slice(0, 3)
              .map((event) => `${event.title} (${event.remaining} left)`)
              .join(', ')}.`,
          );
        }

        const savedStartingSoon = savedEvents
          .map((event) => ({
            title: event.title,
            startAt: event.startAt,
          }))
          .filter((event) => {
            const daysUntil = (new Date(event.startAt).getTime() - now) / (1000 * 60 * 60 * 24);
            return daysUntil > 0 && daysUntil <= 7;
          })
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
          .slice(0, 3);

        if (savedStartingSoon.length) {
          summary.push(
            `Saved events starting soon: ${savedStartingSoon
              .map(
                (event) =>
                  `${event.title} in ${Math.max(
                    Math.ceil((new Date(event.startAt).getTime() - now) / (1000 * 60 * 60 * 24)),
                    1,
                  )} day(s)`,
              )
              .join(', ')}.`,
          );
        }

        if (events.length) {
          summary.push(
            `Your events have ${totalBookings} booking(s) across ${eventsWithBookings} event(s).`,
          );
          if (remainingSeats > 0) {
            summary.push(`Remaining seats across your events: ${remainingSeats}.`);
          }
        }

        setActivitySummary(summary);
        const notificationCount =
          upcomingBooked.length +
          soonBooked.length +
          organizerLowAvailability.length +
          savedLowAvailability.length +
          savedStartingSoon.length;
        setActivityCount(Math.min(notificationCount, 99));
        setActivityStatus('');
      })
      .catch(() => {
        setActivityStatus('Unable to load activity.');
        setActivityCount(0);
        setActivitySummary([]);
      });
  }, [savedIds, token]);

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
      <nav className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 -ml-6 md:-ml-12">
          <Image
            src="/images/eventix_logo.png"
            width={600}
            height={320}
            alt="Eventix"
            className="h-[120px] w-auto"
          />
          <span className="sr-only">Eventix</span>
        </Link>
        <div className="flex items-center gap-3">
          <DiscoverAuthActions />
          <SidebarMenu />
        </div>
      </nav>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Account</h1>
          <p className="text-sm text-neutral-300">Your Eventix profile and access.</p>
        </div>
        <div className="relative">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                d="M12 4.5c-3 0-5.5 2.6-5.5 5.8v2.2l-1.5 2V16h14v-1.5l-1.5-2v-2.2c0-3.2-2.5-5.8-5.5-5.8Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M9.5 18a2.5 2.5 0 0 0 5 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
          {activityCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-400 px-1 text-[0.65rem] font-semibold text-neutral-900">
              {activityCount}
            </span>
          ) : null}
        </div>
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

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Activity</p>
            <h2 className="text-2xl font-semibold">Notifications</h2>
          </div>
          {activityCount > 0 ? (
            <span className="rounded-full border border-emerald-400/60 px-3 py-1 text-xs text-emerald-200">
              {activityCount} new
            </span>
          ) : null}
        </div>
        {activityStatus ? (
          <p className="mt-4 text-xs text-neutral-400">{activityStatus}</p>
        ) : (
          <ul className="mt-4 grid gap-2 text-sm text-neutral-200">
            {activitySummary.map((item) => (
              <li key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
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
