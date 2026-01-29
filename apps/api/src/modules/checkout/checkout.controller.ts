import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { CheckoutService } from './checkout.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @UseGuards(JwtAuthGuard)
  @Post('session')
  createSession(@Body() dto: CreateOrderDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.checkoutService.createSession(user.id, dto);
  }
}
