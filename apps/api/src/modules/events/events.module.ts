import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventOwnerGuard } from './event-owner.guard';

@Module({
  imports: [PrismaModule],
  controllers: [EventsController],
  providers: [EventsService, EventOwnerGuard],
  exports: [EventsService, EventOwnerGuard]
})
export class EventsModule {}
