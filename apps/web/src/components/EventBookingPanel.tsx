'use client';

import { useMemo, useState } from 'react';
import { API_BASE } from '../lib/api';
import { useAuth } from './AuthProvider';
import { useAuthModal } from './AuthModalProvider';

type TicketType = {
  id: string;
  name: string;
  price: number;
  currency: string;
  capacity: number;
  soldCount: number;
};

type EventBookingPanelProps = {
  eventId: string;
  ticketTypes: TicketType[];
};

export function EventBookingPanel({ eventId, ticketTypes }: EventBookingPanelProps) {
  const { token } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currency = ticketTypes[0]?.currency || 'USD';
  const totalAmount = useMemo(() => {
    return ticketTypes.reduce((sum, ticket) => {
      const qty = quantities[ticket.id] || 0;
      return sum + ticket.price * qty;
    }, 0);
  }, [quantities, ticketTypes]);

  const selectedItems = ticketTypes
    .map((ticket) => ({
      ticketTypeId: ticket.id,
      quantity: quantities[ticket.id] || 0,
    }))
    .filter((item) => item.quantity > 0);

  const handleCheckout = async () => {
    if (!token) {
      openAuthModal('Sign in to book tickets.');
      return;
    }

    if (!selectedItems.length) {
      setStatus('Select at least one ticket.');
      return;
    }

    setSubmitting(true);
    setStatus('Creating checkout...');
    try {
      if (totalAmount === 0) {
        const response = await fetch(`${API_BASE}/orders/free`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ eventId, items: selectedItems }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        setStatus('Tickets booked. Check your tickets page.');
        setQuantities({});
        return;
      }

      const response = await fetch(`${API_BASE}/checkout/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId, items: selectedItems }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = (await response.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setStatus('Checkout session created.');
    } catch {
      setStatus('Unable to start checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-8">
      <div>
        <h2 className="text-2xl font-semibold">Book your tickets</h2>
        <p className="text-sm text-neutral-400">
          Choose quantities and proceed to checkout.
        </p>
      </div>
      {ticketTypes.length === 0 ? (
        <p className="text-sm text-neutral-400">No ticket types available yet.</p>
      ) : (
        <div className="grid gap-4">
          {ticketTypes.map((ticket) => {
            const remaining = Math.max(ticket.capacity - ticket.soldCount, 0);
            return (
              <div
                key={ticket.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div>
                  <h3 className="text-lg font-semibold">{ticket.name}</h3>
                  <p className="text-xs text-neutral-400">
                    {ticket.currency} {ticket.price} · {remaining} left
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantities((prev) => ({
                        ...prev,
                        [ticket.id]: Math.max((prev[ticket.id] || 0) - 1, 0),
                      }))
                    }
                    className="h-9 w-9 rounded-full border border-white/20 text-lg text-white/70 transition hover:border-white/60"
                  >
                    -
                  </button>
                  <div className="min-w-[2rem] text-center text-base">
                    {quantities[ticket.id] || 0}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantities((prev) => ({
                        ...prev,
                        [ticket.id]: Math.min((prev[ticket.id] || 0) + 1, remaining),
                      }))
                    }
                    className="h-9 w-9 rounded-full border border-white/20 text-lg text-white/70 transition hover:border-white/60"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-300">
        <span>
          Total: {currency} {totalAmount}
        </span>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={submitting || ticketTypes.length === 0}
          className="rounded-full border border-emerald-400/60 px-6 py-2 text-sm text-emerald-200 transition hover:border-emerald-200 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:text-neutral-500"
        >
          {submitting ? 'Processing...' : totalAmount === 0 ? 'Book for free' : 'Checkout'}
        </button>
      </div>
      {status ? <p className="text-xs text-emerald-200">{status}</p> : null}
    </section>
  );
}
