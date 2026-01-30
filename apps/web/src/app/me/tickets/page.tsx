'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { API_BASE } from '../../../lib/api';
import { formatDateRange } from '../../../lib/format';
import { AuthPrompt } from '../../../components/AuthPrompt';
import { useAuth } from '../../../components/AuthProvider';

type TicketWithDetails = {
  id: string;
  token: string;
  checkedInAt: string | null;
  ticketType: {
    id: string;
    name: string;
    price: number;
    currency: string;
  };
  order: {
    id: string;
    event: {
      id: string;
      title: string;
      bannerUrl: string | null;
      city: string;
      venue: string;
      startAt: string;
      endAt: string;
    };
  };
};

function TicketCard({ ticket }: { ticket: TicketWithDetails }) {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    let mounted = true;

    QRCode.toDataURL(ticket.token, { width: 220 })
      .then((source) => {
        if (mounted) {
          setQrUrl(source);
        }
      })
      .catch(() => {
        if (mounted) {
          setQrUrl('');
        }
      });

    return () => {
      mounted = false;
    };
  }, [ticket.token]);

  const checkedInLabel = ticket.checkedInAt
    ? `Checked in ${new Date(ticket.checkedInAt).toLocaleString()}`
    : 'Not checked in yet';

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex-1 space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-200">
            {ticket.order.event.city}
          </p>
          <h2 className="text-2xl font-semibold">{ticket.order.event.title}</h2>
          <p className="text-sm text-neutral-300">{ticket.order.event.venue}</p>
          <p className="text-xs text-neutral-400">
            {formatDateRange(ticket.order.event.startAt, ticket.order.event.endAt)}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
            <span className="rounded-full border border-white/10 px-3 py-1">
              {ticket.ticketType.name}
            </span>
            <span>
              {ticket.ticketType.currency} {ticket.ticketType.price}
            </span>
            <span className="text-emerald-300">{checkedInLabel}</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 border-t border-white/5 pt-4 text-center md:border-l md:border-t-0 md:pt-0 md:pl-6">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="Ticket QR code"
              className="h-32 w-32 rounded-2xl border border-white/10 object-cover"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-white/20 text-[0.7rem] text-neutral-400">
              Generating QR
            </div>
          )}
          <div className="break-words text-[0.65rem] text-neutral-300">
            <p className="text-[0.6rem] uppercase tracking-[0.4em] text-neutral-500">
              Ticket token
            </p>
            <p className="font-mono text-[0.75rem] text-neutral-100">{ticket.token}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function MyTicketsPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [status, setStatus] = useState('Loading tickets...');

  const loadTickets = useCallback(async () => {
    if (!token) {
      setTickets([]);
      setStatus('Sign in to load purchased tickets.');
      return;
    }

    setStatus('Loading tickets...');
    try {
      const response = await fetch(`${API_BASE}/me/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = (await response.json()) as TicketWithDetails[];
      setTickets(data);
      if (!data.length) {
        setStatus('You do not have any tickets yet.');
        return;
      }

      setStatus('');
    } catch {
      setTickets([]);
      setStatus('Unable to load tickets with that account.');
    }
  }, [token]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  if (!token) {
    return (
      <AuthPrompt
        title="Sign in to view tickets"
        description="Access your booked tickets, QR codes, and entry details."
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-16">
      <Link href="/" className="text-xs uppercase tracking-[0.3em] text-emerald-300">
        Back to events
      </Link>

      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">My tickets</h1>
        <p className="text-sm text-neutral-300">
          The purchases below include the QR codes that grant entry.
        </p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
          <button
            type="button"
            onClick={() => void loadTickets()}
            className="rounded-full border border-white/20 px-4 py-2 text-xs transition hover:border-white/60"
          >
            Refresh
          </button>
          {status ? <p className="text-xs text-emerald-200">{status}</p> : null}
        </div>
      </section>

      <section className="grid gap-4">
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </section>
    </main>
  );
}
