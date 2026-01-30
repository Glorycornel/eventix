import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';

@Injectable()
export class CheckoutService {
  private readonly stripe: Stripe | null;
  private readonly appUrl: string;

  constructor(
    private readonly ordersService: OrdersService,
    private readonly configService: ConfigService,
  ) {
    const secret = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = secret ? new Stripe(secret, { apiVersion: '2025-12-15.clover' }) : null;
    this.appUrl = this.configService.get<string>('APP_URL') ?? 'http://localhost:3000';
  }

  async createSession(userId: string, dto: CreateOrderDto) {
    if (!this.stripe) {
      throw new InternalServerErrorException('Stripe secret key is not configured');
    }
    const event = await this.ordersService.ensureEventApproved(dto.eventId);

    const order = await this.ordersService.createOrderWithItems({
      userId,
      dto,
    });

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: order.items.map((item) => ({
        price_data: {
          currency: order.currency.toLowerCase(),
          product_data: {
            name: `${event.title} · ${item.ticketType.name}`,
            description: `${item.ticketType.name} ticket`,
          },
          unit_amount: item.unitPrice,
        },
        quantity: item.quantity,
      })),
      success_url: `${this.appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.appUrl}/events/${event.id}`,
      metadata: {
        orderId: order.id,
        eventId: event.id,
      },
    });

    await this.ordersService.linkStripeSession(order.id, session.id);

    return { sessionId: session.id, url: session.url };
  }
}
