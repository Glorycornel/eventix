'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';
import { useAuth } from './AuthProvider';
import { useAuthModal } from './AuthModalProvider';

type OwnerEvent = {
  id: string;
  title: string;
  status: string;
};

export function EventOwnerPanel({ eventId }: { eventId: string }) {
  const { token } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [ownerEvent, setOwnerEvent] = useState<OwnerEvent | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchOwner = useCallback(async () => {
    if (!token) {
      setOwnerEvent(null);
      setStatusMessage('');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/events/${eventId}/owner`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('not owner');
      }

      const data = (await response.json()) as OwnerEvent;
      setOwnerEvent(data);
      setStatusMessage('');
    } catch {
      setOwnerEvent(null);
      setStatusMessage('');
    } finally {
      setLoading(false);
    }
  }, [eventId, token]);

  useEffect(() => {
    fetchOwner();
  }, [fetchOwner, token]);

  const handlePublish = async () => {
    if (!token) {
      openAuthModal('Sign in to manage this event.', 'login');
      return;
    }

    setStatusMessage('Publishing...');
    const response = await fetch(`${API_BASE}/events/${eventId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      setStatusMessage('Publish failed.');
      return;
    }

    await fetchOwner();
    setStatusMessage('Published.');
  };

  if (loading || !ownerEvent) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Organizer controls</p>
          <h2 className="text-xl font-semibold">Manage this event</h2>
        </div>
        {ownerEvent ? (
          <Link
            href={`/org/events/${eventId}/edit`}
            className="text-xs uppercase tracking-[0.3em] text-emerald-200"
          >
            Edit
          </Link>
        ) : null}
      </div>

      {statusMessage ? <p className="mt-3 text-xs text-emerald-200">{statusMessage}</p> : null}

      {ownerEvent && ownerEvent.status !== 'APPROVED' ? (
        <button
          type="button"
          onClick={handlePublish}
          className="mt-4 w-full rounded-full border border-emerald-400/60 px-4 py-2 text-sm text-emerald-200 transition hover:border-emerald-200"
        >
          Publish event
        </button>
      ) : null}
    </section>
  );
}
