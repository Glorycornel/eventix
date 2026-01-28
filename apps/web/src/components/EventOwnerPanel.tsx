'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';
import { TokenField } from './TokenField';

type OwnerEvent = {
  id: string;
  title: string;
  status: string;
};

export function EventOwnerPanel({ eventId }: { eventId: string }) {
  const [token, setToken] = useState('');
  const [ownerEvent, setOwnerEvent] = useState<OwnerEvent | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const fetchOwner = useCallback(
    async (currentToken: string) => {
      if (!currentToken) {
        setOwnerEvent(null);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/events/${eventId}/owner`, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });

        if (!response.ok) {
          throw new Error('not owner');
        }

        const data = (await response.json()) as OwnerEvent;
        setOwnerEvent(data);
        setStatusMessage('');
      } catch {
        setOwnerEvent(null);
        setStatusMessage('Token cannot manage this event.');
      }
    },
    [eventId]
  );

  useEffect(() => {
    fetchOwner(token);
  }, [fetchOwner, token]);

  const handlePublish = async () => {
    if (!token) {
      setStatusMessage('Please provide a token first.');
      return;
    }

    setStatusMessage('Publishing...');
    const response = await fetch(`${API_BASE}/events/${eventId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      setStatusMessage('Publish failed.');
      return;
    }

    await fetchOwner(token);
    setStatusMessage('Published.');
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
            Organizer controls
          </p>
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

      <TokenField onToken={(value) => setToken(value)} />
      {statusMessage ? (
        <p className="mt-3 text-xs text-emerald-200">{statusMessage}</p>
      ) : null}

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
