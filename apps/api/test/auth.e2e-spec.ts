import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { ResendVerificationDto } from '../src/modules/auth/dto/resend-verification.dto';
import { VerifyOtpDto } from '../src/modules/auth/dto/verify-otp.dto';
import { MailService } from '../src/modules/auth/mail.service';
import { VerificationService } from '../src/modules/auth/verification.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let controller: AuthController;
  const validationPipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  });

  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const jwt = {
    signAsync: jest.fn().mockResolvedValue('token'),
  };

  const mail = {
    send: jest.fn(),
  };

  const verification = {
    createToken: jest.fn(),
    consumeToken: jest.fn(),
    createOtp: jest.fn(),
    consumeOtp: jest.fn(),
    deleteOtp: jest.fn(),
    getOtpTtlSeconds: jest.fn().mockReturnValue(600),
  };

  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        NODE_ENV: 'test',
        APP_URL: 'http://localhost:3000',
      };
      return values[key];
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: MailService, useValue: mail },
        { provide: VerificationService, useValue: verification },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    controller = moduleRef.get(AuthController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /auth/register returns verification code sent', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.user.create.mockResolvedValueOnce({
      id: 'u1',
      email: 'new@example.com',
      displayName: 'New User',
    });
    verification.createOtp.mockResolvedValueOnce('123456');
    mail.send.mockResolvedValueOnce(undefined);

    const body = await controller.register({
      email: 'new@example.com',
      password: 'secret123',
      displayName: 'New User',
    });
    expect(body.message).toContain('Verification code sent');
  });

  it('POST /auth/verify-otp validates otp format', async () => {
    await expect(
      validationPipe.transform(
        {
          email: 'new@example.com',
          otp: 'abc',
        },
        { type: 'body', metatype: VerifyOtpDto } as never,
      ),
    ).rejects.toThrow();
  });

  it('POST /auth/verify-otp verifies valid code', async () => {
    verification.consumeOtp.mockResolvedValueOnce('u1');
    prisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', email: 'new@example.com' });
    prisma.user.update.mockResolvedValueOnce(undefined);

    const payload = (await validationPipe.transform(
      {
        email: 'new@example.com',
        otp: '123456',
      },
      { type: 'body', metatype: VerifyOtpDto } as never,
    )) as VerifyOtpDto;

    const body = await controller.verifyOtp(payload);
    expect(body.message).toContain('Email verified');
  });

  it('POST /auth/resend returns generic response for unknown email', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);

    const payload = (await validationPipe.transform(
      {
        email: 'missing@example.com',
      },
      { type: 'body', metatype: ResendVerificationDto } as never,
    )) as ResendVerificationDto;

    const body = await controller.resend(payload);
    expect(body.message).toContain('If an account exists');
  });
});
