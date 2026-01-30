'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../../../../../lib/api';
import { BannerUploadField } from '../../../../../components/BannerUploadField';
import { AuthPrompt } from '../../../../../components/AuthPrompt';
import { useAuth } from '../../../../../components/AuthProvider';

type EventDetail = {
  id: string;
  title: string;
  description: string;
  city: string;
  venue: string;
  startAt: string;
  endAt: string;
  bannerUrl: string | null;
  status: string;
};

function toInputDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const offsetMs = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
}

export default function EditEventPage({ params }: { params: { id: string } }) {
  const { token } = useAuth();
  const [eventData, setEventData] = useState<EventDetail | null>(null);
  const [status, setStatus] = useState('Loading event...');
  const [bannerUrl, setBannerUrl] = useState('');

  const startInput = useMemo(
    () => (eventData?.startAt ? toInputDateTime(eventData.startAt) : ''),
    [eventData?.startAt],
  );
  const endInput = useMemo(
    () => (eventData?.endAt ? toInputDateTime(eventData.endAt) : ''),
    [eventData?.endAt],
  );

  useEffect(() => {
    if (!token) {
      setEventData(null);
      setStatus('Sign in to load the event.');
      return;
    }

    setStatus('Loading event...');
    fetch(`${API_BASE}/events/${params.id}/owner`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: EventDetail) => {
        setEventData(data);
        setBannerUrl(data.bannerUrl || '');
        setStatus('');
      })
      .catch(() => {
        setEventData(null);
        setStatus('Unable to load event with that account.');
      });
  }, [params.id, token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setStatus('Please sign in first.');
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get('title') || ''),
      description: String(form.get('description') || ''),
      venue: String(form.get('venue') || ''),
      city: String(form.get('city') || ''),
      startAt: String(form.get('startAt') || ''),
      endAt: String(form.get('endAt') || ''),
      bannerUrl: bannerUrl || null,
    };

    setStatus('Saving changes...');
    try {
      const response = await fetch(`${API_BASE}/events/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const updated = (await response.json()) as EventDetail;
      setEventData(updated);
      setBannerUrl(updated.bannerUrl || '');
      setStatus('Event updated.');
    } catch {
      setStatus('Unable to save changes.');
    }
  };

  if (!token) {
    return (
      <AuthPrompt
        title="Sign in to edit events"
        description="Use your organizer account to update event details."
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
        <h1 className="text-3xl font-semibold">Edit event</h1>
        <p className="text-sm text-neutral-300">
          Update your event details and keep the listing current.
        </p>
      </header>

      {status ? (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs text-emerald-200">{status}</p>
        </section>
      ) : null}

      <form
        onSubmit={handleSubmit}
        key={eventData?.id ?? 'empty'}
        className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            Title
            <input
              name="title"
              required
              defaultValue={eventData?.title || ''}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            City
            <input
              name="city"
              required
              defaultValue={eventData?.city || ''}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm">
          Venue
          <input
            name="venue"
            required
            defaultValue={eventData?.venue || ''}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Description
          <textarea
            name="description"
            required
            rows={4}
            defaultValue={eventData?.description || ''}
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
              defaultValue={startInput}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            End time
            <input
              type="datetime-local"
              name="endAt"
              required
              defaultValue={endInput}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>
        <BannerUploadField token={token} value={bannerUrl} onChange={setBannerUrl} />
        <button
          type="submit"
          disabled={!eventData}
          className="mt-2 w-fit rounded-full border border-emerald-400/60 px-6 py-2 text-sm text-emerald-200 transition hover:border-emerald-200 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:text-neutral-500"
        >
          Save changes
        </button>
      </form>
    </main>
  );
}
