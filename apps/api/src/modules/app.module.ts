import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { TicketTypesModule } from './ticket-types/ticket-types.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    EventsModule,
    TicketTypesModule,
    UploadsModule,
    HealthModule
  ],
})
export class AppModule {}
