import { Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('stripe')
  handleStripe(@Req() req: Request) {
    const signature = req.headers['stripe-signature'];
    const rawBody = req.body as Buffer;
    return this.webhooksService.handleStripeEvent(
      rawBody,
      signature as string | string[] | undefined,
    );
  }
}
