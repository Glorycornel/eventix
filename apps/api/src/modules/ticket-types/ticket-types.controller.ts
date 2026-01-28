import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventOwnerGuard } from '../events/event-owner.guard';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';
import { TicketTypesService } from './ticket-types.service';

@Controller('events/:eventId/ticket-types')
export class TicketTypesController {
  constructor(private readonly ticketTypesService: TicketTypesService) {}

  @Get()
  listPublic(@Param('eventId') eventId: string) {
    return this.ticketTypesService.listPublic(eventId);
  }

  @Get('owner')
  @UseGuards(JwtAuthGuard, EventOwnerGuard)
  listOwner(@Param('eventId') eventId: string) {
    return this.ticketTypesService.listOwner(eventId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, EventOwnerGuard)
  create(
    @Param('eventId') eventId: string,
    @Body() body: CreateTicketTypeDto
  ) {
    return this.ticketTypesService.create(eventId, body);
  }

  @Patch(':ticketTypeId')
  @UseGuards(JwtAuthGuard, EventOwnerGuard)
  update(
    @Param('eventId') eventId: string,
    @Param('ticketTypeId') ticketTypeId: string,
    @Body() body: UpdateTicketTypeDto
  ) {
    return this.ticketTypesService.update(eventId, ticketTypeId, body);
  }

  @Delete(':ticketTypeId')
  @UseGuards(JwtAuthGuard, EventOwnerGuard)
  remove(
    @Param('eventId') eventId: string,
    @Param('ticketTypeId') ticketTypeId: string
  ) {
    return this.ticketTypesService.remove(eventId, ticketTypeId);
  }
}
