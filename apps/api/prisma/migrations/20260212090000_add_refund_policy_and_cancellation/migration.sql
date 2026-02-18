-- Add refund policy fields to Event
ALTER TABLE "Event"
ADD COLUMN "refundAllowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "refundWindowHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN "refundFeePercent" INTEGER NOT NULL DEFAULT 0;

-- Add refund tracking fields to Order
ALTER TABLE "Order"
ADD COLUMN "stripePaymentIntentId" TEXT,
ADD COLUMN "stripeRefundId" TEXT,
ADD COLUMN "refundAmount" INTEGER,
ADD COLUMN "refundFeeAmount" INTEGER,
ADD COLUMN "canceledAt" TIMESTAMP(3),
ADD COLUMN "refundedAt" TIMESTAMP(3);

-- Add canceled flag to Ticket
ALTER TABLE "Ticket"
ADD COLUMN "canceledAt" TIMESTAMP(3);
