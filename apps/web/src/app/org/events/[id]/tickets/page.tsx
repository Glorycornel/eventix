'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { API_BASE } from '../../../../../lib/api';
import { AuthPrompt } from '../../../../../components/AuthPrompt';
import { useAuth } from '../../../../../components/AuthProvider';

type TicketType = {
  id: string;
  name: string;
  price: number;
  currency: string;
  capacity: number;
  soldCount: number;
};

type CreateForm = {
  name: string;
  price: string;
  currency: string;
  capacity: string;
};

export default function TicketTypesPage({ params }: { params: { id: string } }) {
  const { token } = useAuth();
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [status, setStatus] = useState('Loading ticket types...');
  const [createForm, setCreateForm] = useState<CreateForm>({
    name: '',
    price: '',
    currency: 'USD',
    capacity: '',
  });

  const loadTicketTypes = async (currentToken: string) => {
    if (!currentToken) {
      setTicketTypes([]);
      setStatus('Sign in to manage ticket types.');
      return;
    }

    setStatus('Loading ticket types...');
    try {
      const response = await fetch(
        `${API_BASE}/events/${params.id}/ticket-types/owner`,
        {
          headers: { Authorization: `Bearer ${currentToken}` },
        },
      );
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = (await response.json()) as TicketType[];
      setTicketTypes(data);
      setStatus('');
    } catch {
      setTicketTypes([]);
      setStatus('Unable to load ticket types with that account.');
    }
  };

  useEffect(() => {
    void loadTicketTypes(token);
  }, [params.id, token]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setStatus('Please sign in first.');
      return;
    }

    setStatus('Creating ticket type...');
    try {
      const response = await fetch(`${API_BASE}/events/${params.id}/ticket-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: createForm.name,
          price: Number(createForm.price || 0),
          currency: createForm.currency || 'USD',
          capacity: Number(createForm.capacity || 0),
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setCreateForm({ name: '', price: '', currency: 'USD', capacity: '' });
      await loadTicketTypes(token);
      setStatus('Ticket type created.');
    } catch {
      setStatus('Unable to create ticket type.');
    }
  };

  const updateTicketType = async (ticketType: TicketType) => {
    if (!token) {
      setStatus('Please sign in first.');
      return;
    }

    setStatus('Saving ticket type...');
    try {
      const response = await fetch(
        `${API_BASE}/events/${params.id}/ticket-types/${ticketType.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: ticketType.name,
            price: Number(ticketType.price || 0),
            currency: ticketType.currency,
            capacity: Number(ticketType.capacity || 0),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await loadTicketTypes(token);
      setStatus('Ticket type updated.');
    } catch {
      setStatus('Unable to update ticket type.');
    }
  };

  const removeTicketType = async (ticketTypeId: string) => {
    if (!token) {
      setStatus('Please sign in first.');
      return;
    }

    setStatus('Removing ticket type...');
    try {
      const response = await fetch(
        `${API_BASE}/events/${params.id}/ticket-types/${ticketTypeId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await loadTicketTypes(token);
      setStatus('Ticket type removed.');
    } catch {
      setStatus('Unable to remove ticket type.');
    }
  };

  if (!token) {
    return (
      <AuthPrompt
        title="Sign in to manage ticket types"
        description="Add tiers, pricing, and capacity for this event."
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-16">
      <Link
        href="/org/events"
        className="text-xs uppercase tracking-[0.3em] text-emerald-300"
      >
        Back to organizer
      </Link>

      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Ticket types</h1>
        <p className="text-sm text-neutral-300">
          Define pricing, inventory, and tiers for this event.
        </p>
      </header>

      {status ? (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs text-emerald-200">{status}</p>
        </section>
      ) : null}

      <form
        onSubmit={handleCreate}
        className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6"
      >
        <h2 className="text-lg font-semibold">Create ticket type</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            Name
            <input
              name="name"
              required
              value={createForm.name}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Currency
            <input
              name="currency"
              required
              value={createForm.currency}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, currency: event.target.value }))
              }
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            Price (minor units)
            <input
              name="price"
              required
              type="number"
              min="0"
              value={createForm.price}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, price: event.target.value }))
              }
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Capacity
            <input
              name="capacity"
              required
              type="number"
              min="1"
              value={createForm.capacity}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, capacity: event.target.value }))
              }
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={!token}
          className="mt-2 w-fit rounded-full border border-emerald-400/60 px-6 py-2 text-sm text-emerald-200 transition hover:border-emerald-200 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:text-neutral-500"
        >
          Add ticket type
        </button>
      </form>

      <section className="grid gap-4">
        {ticketTypes.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-neutral-300">
            No ticket types yet. Create the first tier above.
          </div>
        ) : (
          ticketTypes.map((ticketType, index) => (
            <div
              key={ticketType.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
                    Ticket tier {index + 1}
                  </p>
                  <h3 className="text-xl font-semibold">{ticketType.name}</h3>
                </div>
                <div className="text-xs text-neutral-400">
                  Sold {ticketType.soldCount} / {ticketType.capacity}
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  Name
                  <input
                    value={ticketType.name}
                    onChange={(event) =>
                      setTicketTypes((prev) =>
                        prev.map((item) =>
                          item.id === ticketType.id
                            ? { ...item, name: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  Currency
                  <input
                    value={ticketType.currency}
                    onChange={(event) =>
                      setTicketTypes((prev) =>
                        prev.map((item) =>
                          item.id === ticketType.id
                            ? { ...item, currency: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
                  />
                </label>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  Price (minor units)
                  <input
                    type="number"
                    min="0"
                    value={ticketType.price}
                    onChange={(event) =>
                      setTicketTypes((prev) =>
                        prev.map((item) =>
                          item.id === ticketType.id
                            ? { ...item, price: Number(event.target.value || 0) }
                            : item,
                        ),
                      )
                    }
                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  Capacity
                  <input
                    type="number"
                    min="1"
                    value={ticketType.capacity}
                    onChange={(event) =>
                      setTicketTypes((prev) =>
                        prev.map((item) =>
                          item.id === ticketType.id
                            ? { ...item, capacity: Number(event.target.value || 0) }
                            : item,
                        ),
                      )
                    }
                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => updateTicketType(ticketType)}
                  className="rounded-full border border-emerald-400/60 px-5 py-2 text-sm text-emerald-200 transition hover:border-emerald-200"
                >
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={() => removeTicketType(ticketType.id)}
                  className="rounded-full border border-rose-400/60 px-5 py-2 text-sm text-rose-200 transition hover:border-rose-200"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
