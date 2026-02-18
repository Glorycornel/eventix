import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventStatus, OrderStatus, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderItemDto } from './dto/order-item.dto';

@Injectable()
export class OrdersService {
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const secret = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = secret ? new Stripe(secret, { apiVersion: '2025-12-15.clover' }) : null;
  }

  async ensureEventApproved(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, status: true, startAt: true },
    });

    if (!event || event.status !== EventStatus.APPROVED) {
      throw new NotFoundException('Event is not available for booking');
    }

    if (event.startAt.getTime() <= Date.now()) {
      throw new BadRequestException('Event has already started');
    }

    return event;
  }

  async createOrderWithItems(options: {
    userId: string;
    dto: CreateOrderDto;
    status?: OrderStatus;
    stripeSessionId?: string;
  }) {
    if (!options.dto.items?.length) {
      throw new BadRequestException('At least one ticket must be selected');
    }

    const ticketTypeCounts = this.groupItems(options.dto.items);
    const ticketTypes = (await this.prisma.ticketType.findMany({
      where: {
        id: { in: Array.from(ticketTypeCounts.keys()) },
        eventId: options.dto.eventId,
      },
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
        capacity: true,
        soldCount: true,
      },
    })) as Array<{
      id: string;
      name: string;
      price: number;
      currency: string;
      capacity: number;
      soldCount: number;
    }>;

    if (ticketTypes.length !== ticketTypeCounts.size) {
      throw new BadRequestException('One or more ticket types not found');
    }

    const currencySet = new Set(ticketTypes.map((type) => type.currency));
    if (currencySet.size > 1) {
      throw new BadRequestException('Ticket types must share one currency');
    }

    const ticketTypeMap = new Map(ticketTypes.map((type) => [type.id, type]));

    for (const [ticketTypeId, quantity] of ticketTypeCounts) {
      const ticketType = ticketTypeMap.get(ticketTypeId);
      if (!ticketType) {
        throw new BadRequestException('Ticket type not available');
      }
      if (ticketType.soldCount + quantity > ticketType.capacity) {
        throw new BadRequestException('Ticket capacity exceeded');
      }
    }

    const eventCapacity = await this.prisma.event.findUnique({
      where: { id: options.dto.eventId },
      select: {
        id: true,
        capacity: true,
        ticketTypes: { select: { soldCount: true } },
      },
    });

    if (!eventCapacity) {
      throw new NotFoundException('Event not found');
    }

    if (typeof eventCapacity.capacity === 'number') {
      const currentSold = eventCapacity.ticketTypes.reduce(
        (sum, ticketType) => sum + ticketType.soldCount,
        0,
      );
      const requested = options.dto.items.reduce((sum, item) => sum + item.quantity, 0);
      if (currentSold + requested > eventCapacity.capacity) {
        throw new BadRequestException('Event capacity exceeded');
      }
    }

    const totalAmount = options.dto.items.reduce((sum, item) => {
      const ticketType = ticketTypeMap.get(item.ticketTypeId);
      return sum + (ticketType?.price ?? 0) * item.quantity;
    }, 0);

    const currency = ticketTypes[0].currency;

    return this.prisma.order.create({
      data: {
        userId: options.userId,
        eventId: options.dto.eventId,
        status: options.status ?? OrderStatus.PENDING,
        totalAmount,
        currency,
        stripeSessionId: options.stripeSessionId,
        items: {
          create: options.dto.items.map((item) => ({
            ticketTypeId: item.ticketTypeId,
            unitPrice: ticketTypeMap.get(item.ticketTypeId)!.price,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            ticketType: {
              select: { id: true, name: true, price: true, currency: true },
            },
          },
        },
      },
    });
  }

  async linkStripeSession(orderId: string, sessionId: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { stripeSessionId: sessionId },
    });
  }

  async processPaidOrder(orderId: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, tickets: true },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.tickets.length > 0) {
        return order.tickets;
      }

      const ticketCounts = this.groupItems(order.items);
      const ticketTypes = (await tx.ticketType.findMany({
        where: { id: { in: Array.from(ticketCounts.keys()) } },
        select: { id: true, capacity: true, soldCount: true },
      })) as Array<{ id: string; capacity: number; soldCount: number }>;

      const ticketTypeMap = new Map(ticketTypes.map((type) => [type.id, type]));
      const ticketsToCreate: Array<{
        orderId: string;
        ticketTypeId: string;
        token: string;
      }> = [];

      const event = await tx.event.findUnique({
        where: { id: order.eventId },
        select: { capacity: true, ticketTypes: { select: { soldCount: true } } },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      if (typeof event.capacity === 'number') {
        const currentSold = event.ticketTypes.reduce(
          (sum, ticketType) => sum + ticketType.soldCount,
          0,
        );
        const requested = Array.from(ticketCounts.values()).reduce(
          (sum, quantity) => sum + quantity,
          0,
        );
        if (currentSold + requested > event.capacity) {
          throw new BadRequestException('Event capacity exceeded');
        }
      }

      for (const [ticketTypeId, quantity] of ticketCounts) {
        const ticketType = ticketTypeMap.get(ticketTypeId);
        if (!ticketType) {
          throw new BadRequestException('Ticket type not found');
        }

        if (ticketType.soldCount + quantity > ticketType.capacity) {
          throw new BadRequestException('Ticket capacity exceeded');
        }

        const updated = await tx.ticketType.updateMany({
          where: {
            id: ticketTypeId,
            soldCount: { lte: ticketType.capacity - quantity },
          },
          data: { soldCount: { increment: quantity } },
        });

        if (updated.count === 0) {
          throw new BadRequestException('Ticket capacity exceeded');
        }

        for (let index = 0; index < quantity; index += 1) {
          ticketsToCreate.push({
            orderId,
            ticketTypeId,
            token: this.generateToken(),
          });
        }
      }

      if (!ticketsToCreate.length) {
        throw new BadRequestException('No tickets to allocate');
      }

      await tx.ticket.createMany({ data: ticketsToCreate });

      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });

      return tx.ticket.findMany({
        where: { orderId },
        include: {
          ticketType: {
            select: { id: true, name: true, price: true, currency: true },
          },
          order: {
            select: {
              id: true,
              event: {
                select: {
                  id: true,
                  title: true,
                  bannerUrl: true,
                  city: true,
                  venue: true,
                  startAt: true,
                  endAt: true,
                },
              },
            },
          },
        },
      });
    });
  }

  async getOrdersForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            city: true,
            venue: true,
            startAt: true,
            endAt: true,
            bannerUrl: true,
          },
        },
        items: {
          include: {
            ticketType: {
              select: { id: true, name: true, price: true, currency: true },
            },
          },
        },
      },
    });
  }

  async getTicketsForUser(userId: string) {
    return this.prisma.ticket.findMany({
      where: { order: { userId } },
      orderBy: { createdAt: 'desc' },
      include: {
        ticketType: {
          select: { id: true, name: true, price: true, currency: true },
        },
        order: {
          select: {
            id: true,
            status: true,
            refundAmount: true,
            refundFeeAmount: true,
            canceledAt: true,
            refundedAt: true,
            event: {
              select: {
                id: true,
                title: true,
                bannerUrl: true,
                city: true,
                venue: true,
                startAt: true,
                endAt: true,
                refundAllowed: true,
                refundWindowHours: true,
                refundFeePercent: true,
              },
            },
          },
        },
      },
    });
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        tickets: true,
        event: {
          select: {
            id: true,
            startAt: true,
            refundAllowed: true,
            refundWindowHours: true,
            refundFeePercent: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('Order does not belong to current user');
    }

    if (order.status === OrderStatus.CANCELED || order.status === OrderStatus.REFUNDED) {
      return {
        orderId: order.id,
        status: order.status,
        refundAmount: order.refundAmount ?? 0,
      };
    }

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Only paid orders can be canceled');
    }

    const now = new Date();
    if (order.event.startAt.getTime() <= now.getTime()) {
      throw new BadRequestException('Event has already started');
    }

    if (order.tickets.some((ticket) => ticket.checkedInAt)) {
      throw new BadRequestException('Checked-in tickets cannot be canceled');
    }

    const refundAllowed = order.event.refundAllowed;
    const refundWindowHours = order.event.refundWindowHours;
    const refundFeePercent = order.event.refundFeePercent;
    const refundWindowMs = refundWindowHours * 60 * 60 * 1000;
    const withinWindow = order.event.startAt.getTime() - now.getTime() >= refundWindowMs;

    const refundable = refundAllowed && withinWindow;
    const feeAmount = refundable ? Math.round((order.totalAmount * refundFeePercent) / 100) : 0;
    const refundAmount = refundable ? Math.max(order.totalAmount - feeAmount, 0) : 0;

    let stripeRefundId: string | null = null;
    if (refundAmount > 0) {
      if (!this.stripe) {
        throw new InternalServerErrorException('Stripe secret key is not configured');
      }
      if (!order.stripePaymentIntentId) {
        throw new InternalServerErrorException('Stripe payment intent is missing');
      }

      const refund = await this.stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
        amount: refundAmount,
        metadata: { orderId: order.id },
      });
      stripeRefundId = refund.id;
    }

    const ticketCounts = this.groupItems(order.items);
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const [ticketTypeId, quantity] of ticketCounts) {
        await tx.ticketType.updateMany({
          where: { id: ticketTypeId, soldCount: { gte: quantity } },
          data: { soldCount: { decrement: quantity } },
        });
      }

      await tx.ticket.updateMany({
        where: { orderId: order.id },
        data: { canceledAt: new Date() },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: refundAmount > 0 ? OrderStatus.REFUNDED : OrderStatus.CANCELED,
          canceledAt: refundAmount > 0 ? undefined : new Date(),
          refundedAt: refundAmount > 0 ? new Date() : undefined,
          refundAmount: refundAmount > 0 ? refundAmount : 0,
          refundFeeAmount: refundAmount > 0 ? feeAmount : 0,
          stripeRefundId: stripeRefundId ?? undefined,
        },
      });
    });

    return {
      orderId: order.id,
      status: refundAmount > 0 ? OrderStatus.REFUNDED : OrderStatus.CANCELED,
      refundAmount,
      refundFeeAmount: feeAmount,
    };
  }

  private groupItems(items: { ticketTypeId: string; quantity: number }[]) {
    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.ticketTypeId, (counts.get(item.ticketTypeId) ?? 0) + item.quantity);
    }
    return counts;
  }

  private generateToken() {
    return randomBytes(16).toString('hex');
  }
}
