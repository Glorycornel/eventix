'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { API_BASE } from '../../../lib/api';
import { formatDateRange } from '../../../lib/format';
import { formatMoney } from '../../../lib/money';
import { AuthPrompt } from '../../../components/AuthPrompt';
import { useAuth } from '../../../components/AuthProvider';

type TicketWithDetails = {
  id: string;
  token: string;
  checkedInAt: string | null;
  canceledAt: string | null;
  ticketType: {
    id: string;
    name: string;
    price: number;
    currency: string;
  };
  order: {
    id: string;
    status: 'PENDING' | 'PAID' | 'CANCELED' | 'REFUNDED';
    refundAmount: number | null;
    refundFeeAmount: number | null;
    canceledAt: string | null;
    refundedAt: string | null;
    event: {
      id: string;
      title: string;
      bannerUrl: string | null;
      city: string;
      venue: string;
      startAt: string;
      endAt: string;
      refundAllowed: boolean;
      refundWindowHours: number;
      refundFeePercent: number;
    };
  };
};

function TicketCard({
  ticket,
  onCancel,
  canceling,
  actionStatus,
}: {
  ticket: TicketWithDetails;
  onCancel: (ticket: TicketWithDetails) => void;
  canceling: boolean;
  actionStatus?: string;
}) {
  const [qrUrl, setQrUrl] = useState('');
  const [downloading, setDownloading] = useState(false);

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
  const statusLabel =
    ticket.order.status === 'REFUNDED'
      ? 'Refunded'
      : ticket.order.status === 'CANCELED'
        ? 'Canceled'
        : ticket.order.status === 'PAID'
          ? 'Paid'
          : 'Pending';
  const canCancel = ticket.order.status === 'PAID' && !ticket.checkedInAt && !ticket.canceledAt;

  const downloadTicket = async () => {
    if (!qrUrl || ticket.canceledAt || downloading) {
      return;
    }
    setDownloading(true);
    try {
      const qrImage = new Image();
      const imageLoaded = new Promise<void>((resolve, reject) => {
        qrImage.onload = () => resolve();
        qrImage.onerror = () => reject(new Error('Failed to load QR image'));
      });
      qrImage.src = qrUrl;
      await imageLoaded;

      const width = 1200;
      const height = 700;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas not available');
      }

      ctx.fillStyle = '#0b0f12';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#141a21';
      ctx.fillRect(40, 40, width - 80, height - 80);

      ctx.fillStyle = '#e5e7eb';
      ctx.font = '600 36px ui-sans-serif, system-ui, -apple-system, sans-serif';
      ctx.fillText(ticket.order.event.title, 80, 130);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '16px ui-sans-serif, system-ui, -apple-system, sans-serif';
      ctx.fillText(ticket.order.event.venue, 80, 170);
      ctx.fillText(ticket.order.event.city, 80, 195);
      ctx.fillText(formatDateRange(ticket.order.event.startAt, ticket.order.event.endAt), 80, 220);

      ctx.fillStyle = '#d1d5db';
      ctx.font = '18px ui-sans-serif, system-ui, -apple-system, sans-serif';
      ctx.fillText(`Ticket: ${ticket.ticketType.name}`, 80, 270);
      ctx.fillText(
        `Price: ${formatMoney(ticket.ticketType.price, ticket.ticketType.currency)}`,
        80,
        300,
      );

      ctx.fillStyle = '#6ee7b7';
      ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.fillText(`Token: ${ticket.token}`, 80, 340);

      const qrSize = 260;
      const qrX = width - qrSize - 120;
      const qrY = 180;
      ctx.fillStyle = '#0b0f12';
      ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1);
      });
      if (!blob) {
        throw new Error('Unable to generate ticket image');
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket-${ticket.id}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Silent failure; user can retry.
    } finally {
      setDownloading(false);
    }
  };

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
            <span>{formatMoney(ticket.ticketType.price, ticket.ticketType.currency)}</span>
            <span className="text-emerald-300">{checkedInLabel}</span>
            <span className="text-neutral-500">Status: {statusLabel}</span>
          </div>
          <div className="flex flex-wrap gap-3 pt-2 text-xs">
            <button
              type="button"
              disabled={!canCancel || canceling}
              onClick={() => onCancel(ticket)}
              className={
                canCancel
                  ? 'rounded-full border border-white/10 px-4 py-2 text-neutral-200 transition hover:border-white/60'
                  : 'rounded-full border border-white/10 px-4 py-2 text-neutral-500'
              }
            >
              {canceling ? 'Canceling...' : 'Cancel order'}
            </button>
            <button
              type="button"
              disabled={!qrUrl || !!ticket.canceledAt || downloading}
              onClick={downloadTicket}
              className={
                !qrUrl || ticket.canceledAt
                  ? 'rounded-full border border-white/10 px-4 py-2 text-neutral-400'
                  : 'rounded-full border border-white/10 px-4 py-2 text-emerald-200 transition hover:border-white/60'
              }
            >
              {downloading ? 'Preparing...' : 'Download ticket'}
            </button>
          </div>
          {actionStatus ? <p className="pt-2 text-xs text-emerald-200">{actionStatus}</p> : null}
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
  const [actionStatus, setActionStatus] = useState<Record<string, string>>({});
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);

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

  const handleCancel = async (ticket: TicketWithDetails) => {
    if (!token) {
      return;
    }
    const confirmCancel = window.confirm(
      'Cancel this order? Refund eligibility depends on the event policy.',
    );
    if (!confirmCancel) {
      return;
    }

    setCancelingOrderId(ticket.order.id);
    setActionStatus((prev) => ({
      ...prev,
      [ticket.order.id]: 'Processing cancellation...',
    }));

    try {
      const response = await fetch(`${API_BASE}/orders/${ticket.order.id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setActionStatus((prev) => ({
        ...prev,
        [ticket.order.id]: 'Cancellation processed.',
      }));
      await loadTickets();
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : 'Unable to cancel order.';
      setActionStatus((prev) => ({ ...prev, [ticket.order.id]: message }));
    } finally {
      setCancelingOrderId(null);
    }
  };

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
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onCancel={handleCancel}
            canceling={cancelingOrderId === ticket.order.id}
            actionStatus={actionStatus[ticket.order.id]}
          />
        ))}
      </section>
    </main>
  );
}
