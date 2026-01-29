import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrderStatus } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me/orders')
  listOrders(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.ordersService.getOrdersForUser(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/tickets')
  listTickets(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.ordersService.getTicketsForUser(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/free')
  async createFreeOrder(@Req() req: Request, @Body() dto: CreateOrderDto) {
    const user = req.user as { id: string };
    await this.ordersService.ensureEventApproved(dto.eventId);
    const order = await this.ordersService.createOrderWithItems({
      userId: user.id,
      dto,
      status: OrderStatus.PAID,
    });
    const tickets = await this.ordersService.processPaidOrder(order.id);
    return { orderId: order.id, tickets };
  }
}
