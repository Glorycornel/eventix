import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as { id: string } | undefined;
    const eventId = req.params.eventId || req.params.id;

    if (!user?.id) {
      throw new ForbiddenException('Missing user');
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true }
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organizerId !== user.id) {
      throw new ForbiddenException('Not event owner');
    }

    return true;
  }
}
