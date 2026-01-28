import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { TicketTypesController } from './ticket-types.controller';
import { TicketTypesService } from './ticket-types.service';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [TicketTypesController],
  providers: [TicketTypesService]
})
export class TicketTypesModule {}
