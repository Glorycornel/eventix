import Link from 'next/link';
import { EventOwnerPanel } from '../../../components/EventOwnerPanel';
import { EventBookingPanel } from '../../../components/EventBookingPanel';
import { SavedToggleButton } from '../../../components/SavedToggleButton';
import { apiFetch } from '../../../lib/api';
import { formatDateRange } from '../../../lib/format';

type EventDetail = {
  id: string;
  title: string;
  description: string;
  city: string;
  venue: string;
  startAt: string;
  endAt: string;
  bannerUrl: string | null;
};

type TicketType = {
  id: string;
  name: string;
  price: number;
  currency: string;
  capacity: number;
  soldCount: number;
};

export default async function EventDetailPage({
  params
}: {
  params: { id: string };
}) {
  const event = await apiFetch<EventDetail>(`/events/${params.id}`, {
    cache: 'no-store'
  });
  let ticketTypes: TicketType[] = [];

  try {
    ticketTypes = await apiFetch<TicketType[]>(
      `/events/${params.id}/ticket-types`,
      { cache: 'no-store' }
    );
  } catch {
    ticketTypes = [];
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.3em] text-emerald-300"
        >
          Back to events
        </Link>
        <SavedToggleButton eventId={event.id} />
      </div>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-4xl font-semibold">{event.title}</h1>
        <p className="mt-3 text-sm text-neutral-300">{event.description}</p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-neutral-400">
          <span>{event.venue}</span>
          <span>{event.city}</span>
          <span>{formatDateRange(event.startAt, event.endAt)}</span>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div>
          <h2 className="text-2xl font-semibold">Ticket types</h2>
          <p className="text-sm text-neutral-400">
            Pricing and capacity for this event.
          </p>
        </div>
        {ticketTypes.length === 0 ? (
          <p className="text-sm text-neutral-400">No ticket types yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {ticketTypes.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <h3 className="text-xl font-semibold">{ticket.name}</h3>
                <p className="mt-2 text-sm text-neutral-300">
                  {ticket.currency} {ticket.price} - {ticket.capacity} capacity
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
      <EventBookingPanel eventId={event.id} ticketTypes={ticketTypes} />
      <EventOwnerPanel eventId={params.id} />
    </main>
  );
}
