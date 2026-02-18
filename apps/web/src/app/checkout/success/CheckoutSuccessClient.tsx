'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { API_BASE } from '../../../lib/api';
import { AuthPrompt } from '../../../components/AuthPrompt';
import { useAuth } from '../../../components/AuthProvider';

export function CheckoutSuccessClient() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  const [status, setStatus] = useState('Confirming payment...');
  const [eventInfo, setEventInfo] = useState<{
    title: string;
    refundAllowed: boolean;
    refundWindowHours: number;
    refundFeePercent: number;
  } | null>(null);

  const formatRefundPolicy = () => {
    if (!eventInfo) {
      return null;
    }
    if (eventInfo.refundAllowed === false) {
      return 'Refunds are not available for this event.';
    }
    if (eventInfo.refundFeePercent > 0) {
      return `Refunds up to ${eventInfo.refundWindowHours}h before start (fee ${eventInfo.refundFeePercent}%).`;
    }
    return `Full refunds up to ${eventInfo.refundWindowHours}h before start.`;
  };

  useEffect(() => {
    if (!token) {
      return;
    }
    if (!sessionId) {
      setStatus('Missing checkout session.');
      return;
    }

    const controller = new AbortController();

    fetch(`${API_BASE}/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const message = await res.text();
          throw new Error(message || 'Unable to confirm payment.');
        }
        return res.json();
      })
      .then((data: { event?: typeof eventInfo }) => {
        setStatus('Payment confirmed. Your tickets are ready.');
        if (data?.event) {
          setEventInfo(data.event);
        }
      })
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        const message =
          error instanceof Error && error.message ? error.message : 'Unable to confirm payment.';
        setStatus(message);
      });

    return () => controller.abort();
  }, [sessionId, token]);

  if (!token) {
    return (
      <AuthPrompt
        title="Sign in to confirm your purchase"
        description="Sign in with the account that completed checkout to access your tickets."
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-16">
      <Link href="/" className="text-xs uppercase tracking-[0.3em] text-emerald-300">
        Back to events
      </Link>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Checkout complete</h1>
        <p className="text-sm text-neutral-300">
          We are confirming your payment and issuing tickets.
        </p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-emerald-200">{status}</p>
        {eventInfo ? (
          <p className="mt-2 text-xs text-neutral-400">Refund policy: {formatRefundPolicy()}</p>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/me/tickets"
          className="rounded-full border border-emerald-400/60 px-5 py-2 text-emerald-200 transition hover:border-emerald-200"
        >
          View tickets
        </Link>
        <Link
          href="/"
          className="rounded-full border border-white/20 px-5 py-2 text-white/70 transition hover:border-white/50"
        >
          Return to discover
        </Link>
      </div>
    </main>
  );
}
