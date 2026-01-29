import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WebhookProvider } from '@prisma/client';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class WebhooksService {
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {
    const secret = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secret) {
      throw new InternalServerErrorException('Stripe secret key is not configured');
    }

    this.stripe = new Stripe(secret, { apiVersion: '2025-12-15.clover' });
  }

  async handleStripeEvent(rawBody: Buffer, signature: string | string[] | undefined) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new InternalServerErrorException('Stripe webhook secret is not configured');
    }

    const sig = Array.isArray(signature) ? signature[0] : signature;
    const event = this.stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    if (event.type !== 'checkout.session.completed') {
      return { received: true };
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      throw new BadRequestException('Order metadata missing from Stripe event');
    }

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.stripeSessionId !== session.id) {
      throw new NotFoundException('Order not found');
    }

    let webhookEventId: string | null = null;
    try {
      const webhookEvent = await this.prisma.webhookEvent.create({
        data: {
          provider: WebhookProvider.STRIPE,
          eventId: event.id,
        },
      });
      webhookEventId = webhookEvent.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { received: true };
      }
      throw error;
    }

    try {
      const tickets = await this.ordersService.processPaidOrder(orderId);
      return { received: true, ticketsCount: tickets.length };
    } catch (error) {
      if (webhookEventId) {
        await this.prisma.webhookEvent.delete({ where: { id: webhookEventId } });
      }
      throw error;
    }
  }
}
