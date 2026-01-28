import { Injectable, NotFoundException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(params: {
    search?: string;
    city?: string;
    from?: string;
    to?: string;
  }) {
    const { search, city, from, to } = params;
    return this.prisma.event.findMany({
      where: {
        status: EventStatus.APPROVED,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
              ]
            }
          : {}),
        ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}),
        ...(from ? { startAt: { gte: new Date(from) } } : {}),
        ...(to ? { endAt: { lte: new Date(to) } } : {})
      },
      orderBy: { startAt: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        city: true,
        venue: true,
        startAt: true,
        endAt: true,
        bannerUrl: true,
        status: true,
        organizerId: true
      }
    });
  }

  async listMine(organizerId: string) {
    return this.prisma.event.findMany({
      where: { organizerId },
      orderBy: { createdAt: 'desc' }
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
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        bannerUrl: dto.bannerUrl
      }
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
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        bannerUrl: dto.bannerUrl
      }
    });
  }

  async publish(id: string) {
    return this.prisma.event.update({
      where: { id },
      data: {
        status: EventStatus.APPROVED,
        submittedAt: new Date()
      }
    });
  }
}
