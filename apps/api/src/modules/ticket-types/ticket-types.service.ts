import { Injectable, NotFoundException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';

@Injectable()
export class TicketTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { status: true }
    });

    if (!event || event.status !== EventStatus.APPROVED) {
      throw new NotFoundException('Event not found');
    }

    return this.prisma.ticketType.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async listOwner(eventId: string) {
    return this.prisma.ticketType.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async create(eventId: string, dto: CreateTicketTypeDto) {
    return this.prisma.ticketType.create({
      data: {
        eventId,
        name: dto.name,
        price: dto.price,
        currency: dto.currency,
        capacity: dto.capacity
      }
    });
  }

  async update(eventId: string, ticketTypeId: string, dto: UpdateTicketTypeDto) {
    const ticketType = await this.prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      select: { eventId: true }
    });

    if (!ticketType || ticketType.eventId !== eventId) {
      throw new NotFoundException('Ticket type not found');
    }

    return this.prisma.ticketType.update({
      where: { id: ticketTypeId },
      data: {
        name: dto.name,
        price: dto.price,
        currency: dto.currency,
        capacity: dto.capacity
      }
    });
  }

  async remove(eventId: string, ticketTypeId: string) {
    const ticketType = await this.prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      select: { eventId: true }
    });

    if (!ticketType || ticketType.eventId !== eventId) {
      throw new NotFoundException('Ticket type not found');
    }

    return this.prisma.ticketType.delete({ where: { id: ticketTypeId } });
  }
}
