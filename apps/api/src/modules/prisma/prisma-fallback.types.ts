export const EventStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export const OrderStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELED: 'CANCELED',
  REFUNDED: 'REFUNDED',
} as const;

export const WebhookProvider = {
  STRIPE: 'STRIPE',
} as const;
