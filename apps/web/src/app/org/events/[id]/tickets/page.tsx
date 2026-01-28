'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { API_BASE } from '../../../../../lib/api';
import { TokenField } from '../../../../../components/TokenField';

type TicketType = {
  id: string;
  name: string;
  price: number;
  currency: string;
  capacity: number;
  soldCount: number;
};

export default function TicketTypesPage({
  params
}: {
  params: { id: string };
}) {
  const [token, setToken] = useState('');
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [status, setStatus] = useState('');

  const loadTicketTypes = () => {
    if (!token) {
      setTicketTypes([]);
      return;
    }

    fetch(`${API_BASE}/events/${params.id}/ticket-types/owner`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((data: TicketType[]) => {
        setTicketTypes(data);
        setStatus('');
      })
      .catch(() => setStatus('Unable to load ticket types.'));
  };

  useEffect(() => {
    loadTicketTypes();
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('');
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get('name') || ''),
      price: Number(form.get('price') || 0),
      currency: String(form.get('currency') || 'NGN'),
      capacity: Number(form.get('capacity') || 0)
    };

    try {
      const response = await fetch(
        `${API_BASE}/events/${params.id}/ticket-types`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      event.currentTarget.reset();
      setStatus('Ticket type created.');
      loadTicketTypes();
    } catch {
      setStatus('Unable to create ticket type.');
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-16">
      <Link
        href="/org/events"
        className="text-xs uppercase tracking-[0.3em] text-emerald-300"
      >
        Back to organizer
      </Link>

      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Ticket types</h1>
        <p className="text-sm text-neutral-300">
          Add pricing tiers for this event.
        </p>
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
            Name
            <input
              name="name"
              required
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Currency
            <input
              name="currency"
              defaultValue="NGN"
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            Price (minor units)
            <input
              name="price"
              type="number"
              min={0}
              required
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Capacity
            <input
              name="capacity"
              type="number"
              min={1}
              required
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>
        <button
          type="submit"
          className="mt-2 w-fit rounded-full border border-emerald-400/60 px-6 py-2 text-sm text-emerald-200 transition hover:border-emerald-200"
        >
          Add ticket type
        </button>
      </form>

      <section className="grid gap-4">
        {ticketTypes.length === 0 ? (
          <p className="text-sm text-neutral-400">No ticket types yet.</p>
        ) : (
          ticketTypes.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <h2 className="text-xl font-semibold">{ticket.name}</h2>
              <p className="mt-2 text-sm text-neutral-300">
                {ticket.currency} {ticket.price} - {ticket.capacity} seats
              </p>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
