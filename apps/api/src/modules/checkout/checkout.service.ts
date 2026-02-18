import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';

@Injectable()
export class CheckoutService {
  private readonly stripe: Stripe | null;
  private readonly appUrl: string;

  constructor(
    private readonly ordersService: OrdersService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
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
      line_items: order.items.map(
        (item: { quantity: number; unitPrice: number; ticketType: { name: string } }) => ({
          price_data: {
            currency: order.currency.toLowerCase(),
            product_data: {
              name: `${event.title} · ${item.ticketType.name}`,
              description: `${item.ticketType.name} ticket`,
            },
            unit_amount: item.unitPrice,
          },
          quantity: item.quantity,
        }),
      ),
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

  async confirmSession(userId: string, sessionId: string) {
    if (!this.stripe) {
      throw new InternalServerErrorException('Stripe secret key is not configured');
    }
    if (!sessionId) {
      throw new BadRequestException('Checkout session is required');
    }

    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Payment is not completed');
    }

    const orderId = session.metadata?.orderId;
    if (!orderId) {
      throw new BadRequestException('Order metadata missing from Stripe session');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, stripeSessionId: true, eventId: true },
    });

    if (!order || order.stripeSessionId !== session.id) {
      throw new NotFoundException('Order not found');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('Order does not belong to current user');
    }

    if (session.payment_intent && typeof session.payment_intent === 'string') {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { stripePaymentIntentId: session.payment_intent },
      });
    }

    const tickets = await this.ordersService.processPaidOrder(order.id);

    const event = await this.prisma.event.findUnique({
      where: { id: order.eventId },
      select: {
        id: true,
        title: true,
        refundAllowed: true,
        refundWindowHours: true,
        refundFeePercent: true,
      },
    });

    return {
      orderId: order.id,
      ticketsCount: tickets.length,
      event,
    };
  }
}
