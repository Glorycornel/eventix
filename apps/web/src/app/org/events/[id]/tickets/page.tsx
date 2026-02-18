'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { API_BASE } from '../../../../../lib/api';
import { AuthPrompt } from '../../../../../components/AuthPrompt';
import { useAuth } from '../../../../../components/AuthProvider';
import { fromMinorUnits, toMinorUnits } from '../../../../../lib/money';

type TicketType = {
  id: string;
  name: string;
  price: number;
  currency: string;
  capacity: number;
  soldCount: number;
  priceInput?: string;
};

type CreateForm = {
  name: string;
  price: string;
  currency: string;
  capacity: string;
};

const STRIPE_CURRENCIES = [
  'AED',
  'AFN',
  'ALL',
  'AMD',
  'ANG',
  'AOA',
  'ARS',
  'AUD',
  'AWG',
  'AZN',
  'BAM',
  'BBD',
  'BDT',
  'BGN',
  'BHD',
  'BIF',
  'BMD',
  'BND',
  'BOB',
  'BRL',
  'BSD',
  'BWP',
  'BYN',
  'BZD',
  'CAD',
  'CDF',
  'CHF',
  'CLP',
  'CNY',
  'COP',
  'CRC',
  'CVE',
  'CZK',
  'DJF',
  'DKK',
  'DOP',
  'DZD',
  'EGP',
  'ETB',
  'EUR',
  'FJD',
  'FKP',
  'GBP',
  'GEL',
  'GIP',
  'GMD',
  'GNF',
  'GTQ',
  'GYD',
  'HKD',
  'HNL',
  'HRK',
  'HTG',
  'HUF',
  'IDR',
  'ILS',
  'INR',
  'ISK',
  'JMD',
  'JOD',
  'JPY',
  'KES',
  'KGS',
  'KHR',
  'KMF',
  'KRW',
  'KWD',
  'KYD',
  'KZT',
  'LAK',
  'LBP',
  'LKR',
  'LRD',
  'LSL',
  'MAD',
  'MDL',
  'MGA',
  'MKD',
  'MMK',
  'MNT',
  'MOP',
  'MUR',
  'MVR',
  'MWK',
  'MXN',
  'MYR',
  'MZN',
  'NAD',
  'NGN',
  'NIO',
  'NOK',
  'NPR',
  'NZD',
  'OMR',
  'PAB',
  'PEN',
  'PGK',
  'PHP',
  'PKR',
  'PLN',
  'PYG',
  'QAR',
  'RON',
  'RSD',
  'RUB',
  'RWF',
  'SAR',
  'SBD',
  'SCR',
  'SEK',
  'SGD',
  'SHP',
  'SLE',
  'SOS',
  'SRD',
  'STD',
  'SZL',
  'THB',
  'TJS',
  'TND',
  'TOP',
  'TRY',
  'TTD',
  'TWD',
  'TZS',
  'UAH',
  'UGX',
  'UYU',
  'UZS',
  'VND',
  'VUV',
  'WST',
  'XAF',
  'XCD',
  'XOF',
  'XPF',
  'YER',
  'ZAR',
  'ZMW',
  'USDC',
  'BTN',
  'GHS',
  'EEK',
  'LVL',
  'SVC',
  'VEF',
  'LTL',
  'SLL',
  'MRO',
];

type OwnerEvent = {
  id: string;
  capacity: number | null;
};

type CurrencySelectProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function CurrencySelect({ value, onChange, disabled }: CurrencySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const visible = STRIPE_CURRENCIES.filter((currency) =>
    currency.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const handleSelect = (currency: string) => {
    onChange(currency);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={open ? query : value}
        placeholder="Search currency..."
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 100);
        }}
        disabled={disabled}
        className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
      />
      {open ? (
        <div className="absolute z-10 mt-2 max-h-56 w-full overflow-auto rounded-lg border border-white/10 bg-[#0f141a] shadow-lg">
          {visible.length ? (
            visible.map((currency) => (
              <button
                key={currency}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(currency)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-white/10 ${
                  currency === value ? 'text-emerald-200' : 'text-neutral-200'
                }`}
              >
                {currency}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-neutral-400">No matches.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function TicketTypesPage({ params }: { params: { id: string } }) {
  const { token } = useAuth();
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [status, setStatus] = useState('Loading ticket types...');
  const [eventCapacity, setEventCapacity] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>({
    name: '',
    price: '',
    currency: 'USD',
    capacity: '',
  });

  const loadTicketTypes = async (currentToken: string) => {
    if (!currentToken) {
      setTicketTypes([]);
      setEventCapacity(null);
      setStatus('Sign in to manage ticket types.');
      return;
    }

    setStatus('Loading ticket types...');
    try {
      const [typesResponse, eventResponse] = await Promise.all([
        fetch(`${API_BASE}/events/${params.id}/ticket-types/owner`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        }),
        fetch(`${API_BASE}/events/${params.id}/owner`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        }),
      ]);

      if (!typesResponse.ok) {
        throw new Error(await typesResponse.text());
      }

      const data = (await typesResponse.json()) as TicketType[];
      setTicketTypes(
        data.map((type) => ({
          ...type,
          priceInput: String(fromMinorUnits(type.price, type.currency)),
        })),
      );
      if (eventResponse.ok) {
        const eventData = (await eventResponse.json()) as OwnerEvent;
        setEventCapacity(eventData.capacity ?? null);
        setCreateForm((prev) =>
          prev.capacity
            ? prev
            : {
                ...prev,
                capacity: typeof eventData.capacity === 'number' ? String(eventData.capacity) : '',
              },
        );
      }
      setStatus('');
    } catch {
      setTicketTypes([]);
      setEventCapacity(null);
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
          price: toMinorUnits(createForm.price || 0, createForm.currency),
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
      const response = await fetch(`${API_BASE}/events/${params.id}/ticket-types/${ticketTypeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

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
      <Link href="/org/events" className="text-xs uppercase tracking-[0.3em] text-emerald-300">
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
        {typeof eventCapacity === 'number' ? (
          <p className="text-xs text-neutral-400">
            Event capacity: {eventCapacity}. Ticket type capacity controls how many can be booked
            for this tier.
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            Name
            <input
              name="name"
              required
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Currency
            <CurrencySelect
              value={createForm.currency}
              onChange={(currency) => setCreateForm((prev) => ({ ...prev, currency }))}
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            Price
            <input
              name="price"
              required
              type="number"
              min="0"
              step="0.01"
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
            <div key={ticketType.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
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
                          item.id === ticketType.id ? { ...item, name: event.target.value } : item,
                        ),
                      )
                    }
                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  Currency
                  <CurrencySelect
                    value={ticketType.currency}
                    onChange={(currency) =>
                      setTicketTypes((prev) =>
                        prev.map((item) =>
                          item.id === ticketType.id
                            ? {
                                ...item,
                                currency,
                                price: toMinorUnits(
                                  item.priceInput ??
                                    String(fromMinorUnits(item.price, item.currency)),
                                  currency,
                                ),
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  Price
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      ticketType.priceInput ??
                      String(fromMinorUnits(ticketType.price, ticketType.currency))
                    }
                    onChange={(event) =>
                      setTicketTypes((prev) =>
                        prev.map((item) =>
                          item.id === ticketType.id
                            ? {
                                ...item,
                                priceInput: event.target.value,
                                price: toMinorUnits(event.target.value || 0, item.currency),
                              }
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
