import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventStatus } from '../prisma/prisma-fallback.types';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(params: { search?: string; city?: string; from?: string; to?: string }) {
    const { search, city, from, to } = params;
    const now = new Date();
    const fromDate = from ? new Date(from) : null;
    const startFrom = fromDate && fromDate > now ? fromDate : now;
    const events = (await this.prisma.event.findMany({
      where: {
        status: EventStatus.APPROVED,
        archivedAt: null,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}),
        startAt: { gte: startFrom },
        ...(to ? { endAt: { lte: new Date(to) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        ticketTypes: { select: { soldCount: true } },
      },
    })) as any[];

    return events.map((event) => {
      const ticketSoldCount = event.ticketTypes.reduce(
        (sum: number, ticketType: { soldCount: number }) => sum + ticketType.soldCount,
        0,
      );
      const ticketsRemaining =
        typeof event.capacity === 'number' ? Math.max(event.capacity - ticketSoldCount, 0) : null;
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        city: event.city,
        category: event.category,
        subcategory: event.subcategory,
        venue: event.venue,
        startAt: event.startAt,
        endAt: event.endAt,
        bannerUrl: event.bannerUrl,
        status: event.status,
        organizerId: event.organizerId,
        archivedAt: event.archivedAt,
        capacity: event.capacity,
        refundAllowed: event.refundAllowed,
        refundWindowHours: event.refundWindowHours,
        refundFeePercent: event.refundFeePercent,
        ticketSoldCount,
        ticketsRemaining,
      };
    });
  }

  async listMine(organizerId: string) {
    const events = (await this.prisma.event.findMany({
      where: { organizerId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { orders: true } },
        ticketTypes: { select: { soldCount: true } },
      },
    })) as any[];

    return events.map((event) => {
      const ticketSoldCount = event.ticketTypes.reduce(
        (sum: number, ticketType: { soldCount: number }) => sum + ticketType.soldCount,
        0,
      );
      const ticketsRemaining =
        typeof event.capacity === 'number' ? Math.max(event.capacity - ticketSoldCount, 0) : null;
      return {
        ...event,
        orderCount: event._count.orders,
        ticketSoldCount,
        ticketsRemaining,
      };
    });
  }

  async getPublicById(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event || event.status !== EventStatus.APPROVED) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async getOwnerById(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async create(organizerId: string, dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        organizerId,
        title: dto.title,
        description: dto.description,
        venue: dto.venue,
        city: dto.city,
        category: dto.category,
        subcategory: dto.subcategory,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        bannerUrl: dto.bannerUrl,
        capacity: dto.capacity,
        refundAllowed: dto.refundAllowed,
        refundWindowHours: dto.refundWindowHours,
        refundFeePercent: dto.refundFeePercent,
        status: EventStatus.APPROVED,
        submittedAt: new Date(),
      },
    });
  }

  async update(id: string, dto: UpdateEventDto) {
    return this.prisma.event.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        venue: dto.venue,
        city: dto.city,
        category: dto.category,
        subcategory: dto.subcategory,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        bannerUrl: dto.bannerUrl,
        capacity: dto.capacity,
        refundAllowed: dto.refundAllowed,
        refundWindowHours: dto.refundWindowHours,
        refundFeePercent: dto.refundFeePercent,
      },
    });
  }

  async publish(id: string) {
    return this.prisma.event.update({
      where: { id },
      data: {
        status: EventStatus.APPROVED,
        submittedAt: new Date(),
      },
    });
  }

  async remove(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id }, select: { id: true } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const orderCount = await this.prisma.order.count({ where: { eventId: id } });
    if (orderCount > 0) {
      throw new BadRequestException('Events with orders cannot be deleted.');
    }

    const [, , deleted] = await this.prisma.$transaction([
      this.prisma.eventReview.deleteMany({ where: { eventId: id } }),
      this.prisma.ticketType.deleteMany({ where: { eventId: id } }),
      this.prisma.event.delete({ where: { id } }),
    ]);

    return deleted;
  }

  async archive(id: string) {
    return this.prisma.event.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  }

  async unarchive(id: string) {
    return this.prisma.event.update({
      where: { id },
      data: { archivedAt: null },
    });
  }

  async lookup(ids: string[]) {
    if (!ids.length) {
      return [];
    }

    const events = (await this.prisma.event.findMany({
      where: {
        id: { in: ids },
        status: EventStatus.APPROVED,
      },
      include: {
        ticketTypes: { select: { soldCount: true } },
      },
    })) as any[];

    return events.map((event) => {
      const ticketSoldCount = event.ticketTypes.reduce(
        (sum: number, ticketType: { soldCount: number }) => sum + ticketType.soldCount,
        0,
      );
      const ticketsRemaining =
        typeof event.capacity === 'number' ? Math.max(event.capacity - ticketSoldCount, 0) : null;
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        city: event.city,
        category: event.category,
        subcategory: event.subcategory,
        venue: event.venue,
        startAt: event.startAt,
        endAt: event.endAt,
        bannerUrl: event.bannerUrl,
        archivedAt: event.archivedAt,
        capacity: event.capacity,
        refundAllowed: event.refundAllowed,
        refundWindowHours: event.refundWindowHours,
        refundFeePercent: event.refundFeePercent,
        ticketSoldCount,
        ticketsRemaining,
      };
    });
  }
}
