import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventStatus, OrderStatus, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderItemDto } from './dto/order-item.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureEventApproved(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, status: true },
    });

    if (!event || event.status !== EventStatus.APPROVED) {
      throw new NotFoundException('Event is not available for booking');
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
