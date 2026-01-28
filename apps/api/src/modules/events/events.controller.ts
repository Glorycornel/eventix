import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventOwnerGuard } from './event-owner.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  listPublic(
    @Query('search') search?: string,
    @Query('city') city?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    return this.eventsService.listPublic({ search, city, from, to });
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  listMine(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.eventsService.listMine(user.id);
  }

  @Get(':id/owner')
  @UseGuards(JwtAuthGuard, EventOwnerGuard)
  getOwner(@Param('id') id: string) {
    return this.eventsService.getOwnerById(id);
  }

  @Get(':id')
  getPublic(@Param('id') id: string) {
    return this.eventsService.getPublicById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: Request, @Body() body: CreateEventDto) {
    const user = req.user as { id: string };
    return this.eventsService.create(user.id, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, EventOwnerGuard)
  update(@Param('id') id: string, @Body() body: UpdateEventDto) {
    return this.eventsService.update(id, body);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, EventOwnerGuard)
  publish(@Param('id') id: string) {
    return this.eventsService.publish(id);
  }
}
