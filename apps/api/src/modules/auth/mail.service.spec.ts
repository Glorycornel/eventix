import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('MailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when SMTP is not configured', async () => {
    const config = {
      get: jest.fn(() => undefined),
    } as unknown as ConfigService;

    const service = new MailService(config);

    await expect(
      service.send({
        to: 'user@example.com',
        subject: 'Subject',
        text: 'Text',
        html: '<p>Text</p>',
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('sends mail through nodemailer transporter', async () => {
    const sendMail = jest.fn().mockResolvedValue(undefined);
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });

    const config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          SMTP_HOST: 'smtp.test.invalid',
          SMTP_PORT: '465',
          SMTP_USER: 'dummy-user',
          SMTP_PASS: 'dummy-password-for-test-only',
          SMTP_SECURE: 'true',
          SMTP_FROM: 'Eventix <no-reply@example.com>',
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    const service = new MailService(config);
    await service.send({
      to: 'user@example.com',
      subject: 'Subject',
      text: 'Text',
      html: '<p>Text</p>',
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Eventix <no-reply@example.com>',
        to: 'user@example.com',
        subject: 'Subject',
      }),
    );
  });
});
