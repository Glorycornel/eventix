import * as bcrypt from 'bcryptjs';

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const IDS = {
  events: {
    publicBookable: 'seed_event_public_bookable',
    archivedFuture: 'seed_event_archived_future',
    publicPast: 'seed_event_public_past',
    publicWithOrders: 'seed_event_public_with_orders',
    publicNoOrders: 'seed_event_public_no_orders',
    draftFuture: 'seed_event_draft_future',
  },
  ticketTypes: {
    free: 'seed_tickettype_free',
    standard: 'seed_tickettype_standard',
    vip: 'seed_tickettype_vip',
  },
  orders: {
    freePaid: 'seed_order_free_paid',
    paidActive: 'seed_order_paid_active',
    paidRefunded: 'seed_order_paid_refunded',
  },
  orderItems: {
    freePaid: 'seed_orderitem_free_paid',
    paidActive: 'seed_orderitem_paid_active',
    paidRefunded: 'seed_orderitem_paid_refunded',
  },
  tickets: {
    freePaid: 'seed_ticket_free_paid',
    paidActive: 'seed_ticket_paid_active',
    paidRefunded: 'seed_ticket_paid_refunded',
  },
};

const EMAILS = {
  primary: 'seed.primary@eventix.local',
  secondary: 'seed.secondary@eventix.local',
  unverified: 'seed.unverified@eventix.local',
};

async function upsertUsers() {
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const verifiedAt = new Date();

  const primary = await prisma.user.upsert({
    where: { email: EMAILS.primary },
    update: {
      displayName: 'Seed Primary User',
      passwordHash,
      emailVerified: true,
      emailVerifiedAt: verifiedAt,
      role: 'USER',
    },
    create: {
      email: EMAILS.primary,
      displayName: 'Seed Primary User',
      passwordHash,
      emailVerified: true,
      emailVerifiedAt: verifiedAt,
      role: 'USER',
    },
  });

  await prisma.user.upsert({
    where: { email: EMAILS.secondary },
    update: {
      displayName: 'Seed Secondary User',
      passwordHash,
      emailVerified: true,
      emailVerifiedAt: verifiedAt,
      role: 'USER',
    },
    create: {
      email: EMAILS.secondary,
      displayName: 'Seed Secondary User',
      passwordHash,
      emailVerified: true,
      emailVerifiedAt: verifiedAt,
      role: 'USER',
    },
  });

  await prisma.user.upsert({
    where: { email: EMAILS.unverified },
    update: {
      displayName: 'Seed Unverified User',
      passwordHash,
      emailVerified: false,
      emailVerifiedAt: null,
      role: 'USER',
    },
    create: {
      email: EMAILS.unverified,
      displayName: 'Seed Unverified User',
      passwordHash,
      emailVerified: false,
      emailVerifiedAt: null,
      role: 'USER',
    },
  });

  return { primaryUserId: primary.id };
}

async function upsertEvents(primaryUserId: string) {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  const startBookable = new Date(now + 14 * day);
  const startArchived = new Date(now + 21 * day);
  const startPast = new Date(now - 10 * day);
  const startWithOrders = new Date(now + 30 * day);
  const startNoOrders = new Date(now + 45 * day);
  const startDraft = new Date(now + 55 * day);

  const endBookable = new Date(startBookable.getTime() + 3 * hour);
  const endArchived = new Date(startArchived.getTime() + 2 * hour);
  const endPast = new Date(startPast.getTime() + 2 * hour);
  const endWithOrders = new Date(startWithOrders.getTime() + 4 * hour);
  const endNoOrders = new Date(startNoOrders.getTime() + 3 * hour);
  const endDraft = new Date(startDraft.getTime() + 3 * hour);

  await prisma.event.upsert({
    where: { id: IDS.events.publicBookable },
    update: {
      organizerId: primaryUserId,
      title: 'Seed: Public Bookable Event',
      description: 'Main event for discovery and booking tests.',
      venue: 'Skyline Hall, Downtown',
      city: 'Lagos',
      category: 'Music',
      subcategory: 'Live Music',
      startAt: startBookable,
      endAt: endBookable,
      bannerUrl: '/images/eventix_background.png',
      capacity: 120,
      refundAllowed: true,
      refundWindowHours: 24,
      refundFeePercent: 10,
      status: 'APPROVED',
      archivedAt: null,
      submittedAt: new Date(),
    },
    create: {
      id: IDS.events.publicBookable,
      organizerId: primaryUserId,
      title: 'Seed: Public Bookable Event',
      description: 'Main event for discovery and booking tests.',
      venue: 'Skyline Hall, Downtown',
      city: 'Lagos',
      category: 'Music',
      subcategory: 'Live Music',
      startAt: startBookable,
      endAt: endBookable,
      bannerUrl: '/images/eventix_background.png',
      capacity: 120,
      refundAllowed: true,
      refundWindowHours: 24,
      refundFeePercent: 10,
      status: 'APPROVED',
      archivedAt: null,
      submittedAt: new Date(),
    },
  });

  await prisma.event.upsert({
    where: { id: IDS.events.archivedFuture },
    update: {
      organizerId: primaryUserId,
      title: 'Seed: Archived Future Event',
      description: 'Approved but archived to verify hidden public listing.',
      venue: 'Riverside Arena',
      city: 'Lagos',
      category: 'Business',
      subcategory: 'Conference',
      startAt: startArchived,
      endAt: endArchived,
      bannerUrl: '/images/eventix_logo.png',
      capacity: 200,
      refundAllowed: true,
      refundWindowHours: 24,
      refundFeePercent: 0,
      status: 'APPROVED',
      archivedAt: new Date(),
      submittedAt: new Date(),
    },
    create: {
      id: IDS.events.archivedFuture,
      organizerId: primaryUserId,
      title: 'Seed: Archived Future Event',
      description: 'Approved but archived to verify hidden public listing.',
      venue: 'Riverside Arena',
      city: 'Lagos',
      category: 'Business',
      subcategory: 'Conference',
      startAt: startArchived,
      endAt: endArchived,
      bannerUrl: '/images/eventix_logo.png',
      capacity: 200,
      refundAllowed: true,
      refundWindowHours: 24,
      refundFeePercent: 0,
      status: 'APPROVED',
      archivedAt: new Date(),
      submittedAt: new Date(),
    },
  });

  await prisma.event.upsert({
    where: { id: IDS.events.publicPast },
    update: {
      organizerId: primaryUserId,
      title: 'Seed: Public Past Event',
      description: 'Past event used to verify booking closure behavior.',
      venue: 'Old Town Stage',
      city: 'Lagos',
      category: 'Arts',
      subcategory: 'Theater',
      startAt: startPast,
      endAt: endPast,
      bannerUrl: '/images/eventix_background.png',
      capacity: 80,
      refundAllowed: false,
      refundWindowHours: 0,
      refundFeePercent: 0,
      status: 'APPROVED',
      archivedAt: null,
      submittedAt: new Date(),
    },
    create: {
      id: IDS.events.publicPast,
      organizerId: primaryUserId,
      title: 'Seed: Public Past Event',
      description: 'Past event used to verify booking closure behavior.',
      venue: 'Old Town Stage',
      city: 'Lagos',
      category: 'Arts',
      subcategory: 'Theater',
      startAt: startPast,
      endAt: endPast,
      bannerUrl: '/images/eventix_background.png',
      capacity: 80,
      refundAllowed: false,
      refundWindowHours: 0,
      refundFeePercent: 0,
      status: 'APPROVED',
      archivedAt: null,
      submittedAt: new Date(),
    },
  });

  await prisma.event.upsert({
    where: { id: IDS.events.publicWithOrders },
    update: {
      organizerId: primaryUserId,
      title: 'Seed: Event With Orders',
      description: 'Event that has seeded orders for delete/cancel flows.',
      venue: 'Marina Pavilion',
      city: 'Lagos',
      category: 'Food',
      subcategory: 'Food Festival',
      startAt: startWithOrders,
      endAt: endWithOrders,
      bannerUrl: '/images/eventix_background.png',
      capacity: 60,
      refundAllowed: false,
      refundWindowHours: 24,
      refundFeePercent: 0,
      status: 'APPROVED',
      archivedAt: null,
      submittedAt: new Date(),
    },
    create: {
      id: IDS.events.publicWithOrders,
      organizerId: primaryUserId,
      title: 'Seed: Event With Orders',
      description: 'Event that has seeded orders for delete/cancel flows.',
      venue: 'Marina Pavilion',
      city: 'Lagos',
      category: 'Food',
      subcategory: 'Food Festival',
      startAt: startWithOrders,
      endAt: endWithOrders,
      bannerUrl: '/images/eventix_background.png',
      capacity: 60,
      refundAllowed: false,
      refundWindowHours: 24,
      refundFeePercent: 0,
      status: 'APPROVED',
      archivedAt: null,
      submittedAt: new Date(),
    },
  });

  await prisma.event.upsert({
    where: { id: IDS.events.publicNoOrders },
    update: {
      organizerId: primaryUserId,
      title: 'Seed: Event Without Orders',
      description: 'Used to verify hard-delete success.',
      venue: 'Harbor Deck',
      city: 'Lagos',
      category: 'Community',
      subcategory: 'Meetup',
      startAt: startNoOrders,
      endAt: endNoOrders,
      bannerUrl: '/images/eventix_logo.png',
      capacity: 70,
      refundAllowed: true,
      refundWindowHours: 24,
      refundFeePercent: 0,
      status: 'APPROVED',
      archivedAt: null,
      submittedAt: new Date(),
    },
    create: {
      id: IDS.events.publicNoOrders,
      organizerId: primaryUserId,
      title: 'Seed: Event Without Orders',
      description: 'Used to verify hard-delete success.',
      venue: 'Harbor Deck',
      city: 'Lagos',
      category: 'Community',
      subcategory: 'Meetup',
      startAt: startNoOrders,
      endAt: endNoOrders,
      bannerUrl: '/images/eventix_logo.png',
      capacity: 70,
      refundAllowed: true,
      refundWindowHours: 24,
      refundFeePercent: 0,
      status: 'APPROVED',
      archivedAt: null,
      submittedAt: new Date(),
    },
  });

  await prisma.event.upsert({
    where: { id: IDS.events.draftFuture },
    update: {
      organizerId: primaryUserId,
      title: 'Seed: Draft Future Event',
      description: 'Optional draft event for publish workflow tests.',
      venue: 'Civic Center',
      city: 'Lagos',
      category: 'Technology',
      subcategory: 'Workshop',
      startAt: startDraft,
      endAt: endDraft,
      bannerUrl: '/images/eventix_background.png',
      capacity: 90,
      refundAllowed: true,
      refundWindowHours: 24,
      refundFeePercent: 0,
      status: 'DRAFT',
      archivedAt: null,
      submittedAt: null,
    },
    create: {
      id: IDS.events.draftFuture,
      organizerId: primaryUserId,
      title: 'Seed: Draft Future Event',
      description: 'Optional draft event for publish workflow tests.',
      venue: 'Civic Center',
      city: 'Lagos',
      category: 'Technology',
      subcategory: 'Workshop',
      startAt: startDraft,
      endAt: endDraft,
      bannerUrl: '/images/eventix_background.png',
      capacity: 90,
      refundAllowed: true,
      refundWindowHours: 24,
      refundFeePercent: 0,
      status: 'DRAFT',
      archivedAt: null,
      submittedAt: null,
    },
  });
}

async function upsertTicketTypes() {
  await prisma.ticketType.upsert({
    where: { id: IDS.ticketTypes.free },
    update: {
      eventId: IDS.events.publicBookable,
      name: 'Free Pass',
      price: 0,
      currency: 'USD',
      capacity: 20,
      soldCount: 1,
    },
    create: {
      id: IDS.ticketTypes.free,
      eventId: IDS.events.publicBookable,
      name: 'Free Pass',
      price: 0,
      currency: 'USD',
      capacity: 20,
      soldCount: 1,
    },
  });

  await prisma.ticketType.upsert({
    where: { id: IDS.ticketTypes.standard },
    update: {
      eventId: IDS.events.publicBookable,
      name: 'Standard',
      price: 2500,
      currency: 'USD',
      capacity: 80,
      soldCount: 0,
    },
    create: {
      id: IDS.ticketTypes.standard,
      eventId: IDS.events.publicBookable,
      name: 'Standard',
      price: 2500,
      currency: 'USD',
      capacity: 80,
      soldCount: 0,
    },
  });

  await prisma.ticketType.upsert({
    where: { id: IDS.ticketTypes.vip },
    update: {
      eventId: IDS.events.publicWithOrders,
      name: 'VIP',
      price: 5000,
      currency: 'USD',
      capacity: 10,
      soldCount: 1,
    },
    create: {
      id: IDS.ticketTypes.vip,
      eventId: IDS.events.publicWithOrders,
      name: 'VIP',
      price: 5000,
      currency: 'USD',
      capacity: 10,
      soldCount: 1,
    },
  });
}

async function upsertOrdersAndTickets(primaryUserId: string) {
  const now = Date.now();

  await prisma.order.upsert({
    where: { id: IDS.orders.freePaid },
    update: {
      userId: primaryUserId,
      eventId: IDS.events.publicBookable,
      status: 'PAID',
      totalAmount: 0,
      currency: 'USD',
      stripeSessionId: null,
      stripePaymentIntentId: null,
      stripeRefundId: null,
      refundAmount: null,
      refundFeeAmount: null,
      canceledAt: null,
      refundedAt: null,
    },
    create: {
      id: IDS.orders.freePaid,
      userId: primaryUserId,
      eventId: IDS.events.publicBookable,
      status: 'PAID',
      totalAmount: 0,
      currency: 'USD',
    },
  });

  await prisma.order.upsert({
    where: { id: IDS.orders.paidActive },
    update: {
      userId: primaryUserId,
      eventId: IDS.events.publicWithOrders,
      status: 'PAID',
      totalAmount: 5000,
      currency: 'USD',
      stripeSessionId: 'cs_seed_paid_active',
      stripePaymentIntentId: 'pi_seed_paid_active',
      stripeRefundId: null,
      refundAmount: null,
      refundFeeAmount: null,
      canceledAt: null,
      refundedAt: null,
    },
    create: {
      id: IDS.orders.paidActive,
      userId: primaryUserId,
      eventId: IDS.events.publicWithOrders,
      status: 'PAID',
      totalAmount: 5000,
      currency: 'USD',
      stripeSessionId: 'cs_seed_paid_active',
      stripePaymentIntentId: 'pi_seed_paid_active',
    },
  });

  await prisma.order.upsert({
    where: { id: IDS.orders.paidRefunded },
    update: {
      userId: primaryUserId,
      eventId: IDS.events.publicWithOrders,
      status: 'REFUNDED',
      totalAmount: 5000,
      currency: 'USD',
      stripeSessionId: 'cs_seed_paid_refunded',
      stripePaymentIntentId: 'pi_seed_paid_refunded',
      stripeRefundId: 're_seed_paid_refunded',
      refundAmount: 4500,
      refundFeeAmount: 500,
      canceledAt: null,
      refundedAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
    },
    create: {
      id: IDS.orders.paidRefunded,
      userId: primaryUserId,
      eventId: IDS.events.publicWithOrders,
      status: 'REFUNDED',
      totalAmount: 5000,
      currency: 'USD',
      stripeSessionId: 'cs_seed_paid_refunded',
      stripePaymentIntentId: 'pi_seed_paid_refunded',
      stripeRefundId: 're_seed_paid_refunded',
      refundAmount: 4500,
      refundFeeAmount: 500,
      refundedAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.orderItem.upsert({
    where: { id: IDS.orderItems.freePaid },
    update: {
      orderId: IDS.orders.freePaid,
      ticketTypeId: IDS.ticketTypes.free,
      unitPrice: 0,
      quantity: 1,
    },
    create: {
      id: IDS.orderItems.freePaid,
      orderId: IDS.orders.freePaid,
      ticketTypeId: IDS.ticketTypes.free,
      unitPrice: 0,
      quantity: 1,
    },
  });

  await prisma.orderItem.upsert({
    where: { id: IDS.orderItems.paidActive },
    update: {
      orderId: IDS.orders.paidActive,
      ticketTypeId: IDS.ticketTypes.vip,
      unitPrice: 5000,
      quantity: 1,
    },
    create: {
      id: IDS.orderItems.paidActive,
      orderId: IDS.orders.paidActive,
      ticketTypeId: IDS.ticketTypes.vip,
      unitPrice: 5000,
      quantity: 1,
    },
  });

  await prisma.orderItem.upsert({
    where: { id: IDS.orderItems.paidRefunded },
    update: {
      orderId: IDS.orders.paidRefunded,
      ticketTypeId: IDS.ticketTypes.vip,
      unitPrice: 5000,
      quantity: 1,
    },
    create: {
      id: IDS.orderItems.paidRefunded,
      orderId: IDS.orders.paidRefunded,
      ticketTypeId: IDS.ticketTypes.vip,
      unitPrice: 5000,
      quantity: 1,
    },
  });

  await prisma.ticket.upsert({
    where: { id: IDS.tickets.freePaid },
    update: {
      orderId: IDS.orders.freePaid,
      ticketTypeId: IDS.ticketTypes.free,
      token: 'seed-token-free-paid',
      canceledAt: null,
      checkedInAt: null,
      checkedInByUserId: null,
    },
    create: {
      id: IDS.tickets.freePaid,
      orderId: IDS.orders.freePaid,
      ticketTypeId: IDS.ticketTypes.free,
      token: 'seed-token-free-paid',
    },
  });

  await prisma.ticket.upsert({
    where: { id: IDS.tickets.paidActive },
    update: {
      orderId: IDS.orders.paidActive,
      ticketTypeId: IDS.ticketTypes.vip,
      token: 'seed-token-paid-active',
      canceledAt: null,
      checkedInAt: null,
      checkedInByUserId: null,
    },
    create: {
      id: IDS.tickets.paidActive,
      orderId: IDS.orders.paidActive,
      ticketTypeId: IDS.ticketTypes.vip,
      token: 'seed-token-paid-active',
    },
  });

  await prisma.ticket.upsert({
    where: { id: IDS.tickets.paidRefunded },
    update: {
      orderId: IDS.orders.paidRefunded,
      ticketTypeId: IDS.ticketTypes.vip,
      token: 'seed-token-paid-refunded',
      canceledAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
      checkedInAt: null,
      checkedInByUserId: null,
    },
    create: {
      id: IDS.tickets.paidRefunded,
      orderId: IDS.orders.paidRefunded,
      ticketTypeId: IDS.ticketTypes.vip,
      token: 'seed-token-paid-refunded',
      canceledAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
    },
  });
}

async function main() {
  const { primaryUserId } = await upsertUsers();
  await upsertEvents(primaryUserId);
  await upsertTicketTypes();
  await upsertOrdersAndTickets(primaryUserId);

  // Remove accidental duplicate webhook state from previous runs.
  await prisma.webhookEvent.deleteMany({
    where: { eventId: { in: ['evt_seed_checkout_completed'] } },
  });

  console.log('Seed completed.');
  console.log(`Primary user: ${EMAILS.primary} / Password123!`);
  console.log(`Secondary user: ${EMAILS.secondary} / Password123!`);
  console.log(`Unverified user: ${EMAILS.unverified} / Password123!`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
