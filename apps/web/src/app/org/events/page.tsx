'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_BASE } from '../../../lib/api';
import { AuthPrompt } from '../../../components/AuthPrompt';
import { useAuth } from '../../../components/AuthProvider';

type EventItem = {
  id: string;
  title: string;
  status: string;
  city: string;
  venue: string;
  startAt: string;
  endAt: string;
  archivedAt?: string | null;
  orderCount?: number;
  capacity?: number | null;
  ticketSoldCount?: number;
  ticketsRemaining?: number | null;
};

export default function OrganizerEventsPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'current' | 'past'>('all');
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [archiveStatus, setArchiveStatus] = useState('');
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const now = new Date();

  const visibleEvents = events.filter((event) => !event.archivedAt);
  const archivedEvents = events.filter((event) => event.archivedAt);

  const categorizeEvent = (event: EventItem) => {
    const startAt = new Date(event.startAt);
    const endAt = new Date(event.endAt);
    if (endAt < now) {
      return 'past';
    }
    if (startAt > now) {
      return 'upcoming';
    }
    return 'current';
  };

  const upcomingEvents = visibleEvents.filter((event) => categorizeEvent(event) === 'upcoming');
  const currentEvents = visibleEvents.filter((event) => categorizeEvent(event) === 'current');
  const pastEvents = visibleEvents.filter((event) => categorizeEvent(event) === 'past');

  const filteredEvents =
    activeTab === 'all'
      ? visibleEvents
      : activeTab === 'upcoming'
        ? upcomingEvents
        : activeTab === 'current'
          ? currentEvents
          : pastEvents;

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  useEffect(() => {
    if (!token) {
      setEvents([]);
      return;
    }

    fetch(`${API_BASE}/events/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((data: EventItem[]) => {
        setEvents(data);
        setError('');
      })
      .catch(() => setError('Unable to load events with that account.'));
  }, [token]);

  const handlePublish = async (eventId: string) => {
    if (!token) {
      return;
    }
    await fetch(`${API_BASE}/events/${eventId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const refreshed = await fetch(`${API_BASE}/events/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (refreshed.ok) {
      setEvents(await refreshed.json());
    }
  };

  const handleArchive = async (eventId: string, archive: boolean) => {
    if (!token) {
      return;
    }
    setArchivingId(eventId);
    setArchiveStatus(archive ? 'Archiving event...' : 'Unarchiving event...');
    try {
      const response = await fetch(
        `${API_BASE}/events/${eventId}/${archive ? 'archive' : 'unarchive'}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Unable to update archive status.');
      }

      const updated = await response.json();
      setEvents((prev) =>
        prev.map((event) => (event.id === eventId ? { ...event, ...updated } : event)),
      );
      setArchiveStatus('');
    } catch (archiveError) {
      const message =
        archiveError instanceof Error && archiveError.message
          ? archiveError.message
          : 'Unable to update archive status.';
      setArchiveStatus(message);
    } finally {
      setArchivingId(null);
    }
  };

  const handleDelete = async () => {
    if (!token || !deleteTarget) {
      return;
    }
    setDeleting(true);
    setDeleteStatus('Deleting event...');
    try {
      const response = await fetch(`${API_BASE}/events/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Unable to delete event.');
      }

      setEvents((prev) => prev.filter((event) => event.id !== deleteTarget.id));
      setDeleteTarget(null);
      setDeleteStatus('');
    } catch (deleteError) {
      const message =
        deleteError instanceof Error && deleteError.message
          ? deleteError.message
          : 'Unable to delete event.';
      setDeleteStatus(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!token || selectedIds.length === 0) {
      return;
    }
    setDeleting(true);
    setDeleteStatus('Deleting events...');
    try {
      const results = await Promise.all(
        selectedIds.map((eventId) =>
          fetch(`${API_BASE}/events/${eventId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }).then(async (response) => ({
            eventId,
            ok: response.ok,
            message: response.ok ? '' : await response.text(),
          })),
        ),
      );

      const failed = results.filter((result) => !result.ok);
      const deletedIds = results.filter((result) => result.ok).map((result) => result.eventId);

      if (deletedIds.length) {
        setEvents((prev) => prev.filter((event) => !deletedIds.includes(event.id)));
        setSelectedIds((prev) => prev.filter((id) => !deletedIds.includes(id)));
      }

      if (failed.length) {
        setDeleteStatus('Some events could not be deleted.');
        return;
      }

      setDeleteStatus('');
      setBulkDeleteOpen(false);
    } catch {
      setDeleteStatus('Unable to delete selected events.');
    } finally {
      setDeleting(false);
    }
  };

  const isPast = (event: EventItem) => categorizeEvent(event) === 'past';
  const hasOrders = (event: EventItem) => (event.orderCount || 0) > 0;
  const canHardDelete = (event: EventItem) => !hasOrders(event);
  const remainingTickets = (event: EventItem) =>
    typeof event.ticketsRemaining === 'number' ? event.ticketsRemaining : null;
  const soldTickets = (event: EventItem) => event.ticketSoldCount || 0;

  if (!token) {
    return (
      <AuthPrompt
        title="Sign in to manage events"
        description="Use your account to view drafts, publish listings, and edit event details."
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-16">
      <Link href="/" className="text-xs uppercase tracking-[0.3em] text-emerald-300">
        Back to events
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Organizer</p>
          <h1 className="text-3xl font-semibold">Your events</h1>
          <p className="mt-2 text-xs text-neutral-400">
            Past events can be bulk deleted when they have no bookings. Archive to hide events from
            discovery while keeping tickets and saves.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {activeTab === 'past' ? (
            <button
              type="button"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={pastEvents.length === 0}
              className="rounded-full border border-rose-400/60 px-4 py-2 text-sm text-rose-200 transition hover:border-rose-200 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:text-neutral-500"
            >
              Bulk delete
            </button>
          ) : null}
          <Link
            href="/org/events/new"
            className="rounded-full border border-emerald-400/60 px-5 py-2 text-sm text-emerald-200 transition hover:border-emerald-200"
          >
            Create event
          </Link>
        </div>
      </header>

      <section className="flex flex-wrap gap-2 text-sm">
        {(['all', 'upcoming', 'current', 'past'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em] transition ${
              activeTab === tab
                ? 'border-emerald-400/60 text-emerald-200'
                : 'border-white/20 text-white/70 hover:border-white/60'
            }`}
          >
            {tab === 'all' ? 'all events' : tab}
          </button>
        ))}
      </section>

      {error ? (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs text-rose-300">{error}</p>
        </section>
      ) : null}

      <section className="grid gap-4">
        {filteredEvents.length === 0 ? (
          <p className="text-sm text-neutral-400">
            {activeTab === 'all'
              ? 'No events yet. Create one to get started.'
              : `No ${activeTab} events yet. Create one to get started.`}
          </p>
        ) : (
          filteredEvents.map((event) => {
            const remaining = remainingTickets(event);
            const capacityKnown = typeof event.capacity === 'number';

            return (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-start gap-3">
                  {activeTab === 'past' ? (
                    <label className="mt-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(event.id)}
                        disabled={!canHardDelete(event)}
                        onChange={(eventChange) => {
                          const checked = eventChange.target.checked;
                          if (!canHardDelete(event)) {
                            return;
                          }
                          setSelectedIds((prev) =>
                            checked ? [...prev, event.id] : prev.filter((id) => id !== event.id),
                          );
                        }}
                        className="h-4 w-4 rounded border-white/30 bg-white/10 text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </label>
                  ) : null}
                  <div>
                    <h2 className="text-xl font-semibold">{event.title}</h2>
                    <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
                      {event.status}
                    </p>
                    <p className="mt-2 text-sm text-neutral-300">
                      {event.venue} - {event.city}
                    </p>
                    {hasOrders(event) ? (
                      <p className="mt-2 text-xs text-neutral-500">{event.orderCount} booking(s)</p>
                    ) : null}
                    {hasOrders(event) ? (
                      <p className="mt-1 text-xs text-neutral-500">
                        Booked events can only be archived.
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-neutral-500">
                      Tickets:{' '}
                      {capacityKnown
                        ? `${soldTickets(event)} booked · ${remaining ?? 0} remaining`
                        : `${soldTickets(event)} booked`}
                    </p>
                    {capacityKnown && remaining !== null && remaining <= 10 ? (
                      <p className="mt-1 text-xs text-amber-300">Low availability</p>
                    ) : null}
                  </div>
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
                  <button
                    type="button"
                    onClick={() => handleArchive(event.id, true)}
                    disabled={archivingId === event.id}
                    className="rounded-full border border-white/30 px-4 py-2 text-white/70 transition hover:border-white/60 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:text-neutral-500"
                  >
                    Archive
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTarget(event);
                      setDeleteStatus('');
                    }}
                    disabled={!canHardDelete(event)}
                    className="rounded-full border border-rose-400/60 px-4 py-2 text-rose-200 transition hover:border-rose-200 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:text-neutral-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Archive</p>
            <h2 className="text-2xl font-semibold">Archived events</h2>
            <p className="text-sm text-neutral-300">
              Archived events stay visible to ticket holders and saved lists, but disappear from
              discovery.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {archivedEvents.length === 0 ? (
            <p className="text-sm text-neutral-400">No archived events.</p>
          ) : (
            archivedEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Archived</p>
                  <h3 className="text-lg font-semibold">{event.title}</h3>
                  <p className="text-xs text-neutral-400">
                    {event.venue} - {event.city}
                  </p>
                </div>
                <div className="flex gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => handleArchive(event.id, false)}
                    disabled={archivingId === event.id}
                    className="rounded-full border border-emerald-400/60 px-4 py-2 text-emerald-200 transition hover:border-emerald-200 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:text-neutral-500"
                  >
                    Unarchive
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTarget(event);
                      setDeleteStatus('');
                    }}
                    disabled={!canHardDelete(event)}
                    className="rounded-full border border-rose-400/60 px-4 py-2 text-rose-200 transition hover:border-rose-200 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:text-neutral-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {archiveStatus ? <p className="text-xs text-emerald-200">{archiveStatus}</p> : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-neutral-950/95 p-6 text-white shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
                  Confirm delete
                </p>
                <h3 className="text-2xl font-semibold">Delete this event?</h3>
                <p className="mt-2 text-sm text-neutral-300">
                  "{deleteTarget.title}" will be removed from your events list.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {deleteStatus ? <p className="mt-4 text-xs text-rose-200">{deleteStatus}</p> : null}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 transition hover:border-white/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full border border-rose-400/60 px-5 py-2 text-sm text-rose-100 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:text-neutral-500"
              >
                {deleting ? 'Deleting...' : 'Delete event'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {bulkDeleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-neutral-950/95 p-6 text-white shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Bulk delete</p>
                <h3 className="text-2xl font-semibold">Delete selected past events?</h3>
                <p className="mt-2 text-sm text-neutral-300">
                  This removes {selectedIds.length} selected event(s) with no bookings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBulkDeleteOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {deleteStatus ? <p className="mt-4 text-xs text-rose-200">{deleteStatus}</p> : null}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setBulkDeleteOpen(false)}
                className="rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 transition hover:border-white/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={deleting || selectedIds.length === 0}
                className="rounded-full border border-rose-400/60 px-5 py-2 text-sm text-rose-100 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:text-neutral-500"
              >
                {deleting ? 'Deleting...' : 'Delete selected'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
