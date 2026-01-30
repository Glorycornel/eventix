import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter | null;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') || 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const secure = this.config.get<string>('SMTP_SECURE') === 'true';

    this.fromAddress = this.config.get<string>('SMTP_FROM') || 'Eventix <no-reply@eventix.local>';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    } else {
      this.transporter = null;
    }
  }

  async send(message: MailMessage) {
    if (!this.transporter) {
      throw new InternalServerErrorException('Email service is not configured');
    }

    await this.transporter.sendMail({
      from: this.fromAddress,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }
}
