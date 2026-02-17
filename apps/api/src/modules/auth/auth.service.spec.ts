import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { MailService } from './mail.service';
import { VerificationService } from './verification.service';

describe('AuthService', () => {
  let service: AuthService;
  let nodeEnv = 'test';

  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as PrismaService;

  const jwt = {
    signAsync: jest.fn().mockResolvedValue('jwt-token'),
  } as unknown as JwtService;

  const mail = {
    send: jest.fn(),
  } as unknown as MailService;

  const verification = {
    createToken: jest.fn(),
    consumeToken: jest.fn(),
    createOtp: jest.fn(),
    consumeOtp: jest.fn(),
    deleteOtp: jest.fn(),
    getOtpTtlSeconds: jest.fn().mockReturnValue(600),
  } as unknown as VerificationService;

  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        NODE_ENV: nodeEnv,
        APP_URL: 'http://localhost:3000',
      };
      return values[key];
    }),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    nodeEnv = 'test';
    service = new AuthService(prisma, jwt, mail, verification, config);
  });

  it('rejects duplicate registration', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue({ id: 'u1' });

    await expect(
      service.register({ email: 'a@b.com', password: 'secret123', displayName: 'A' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('registers and sends OTP email', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue(null);
    prisma.user.create = jest.fn().mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      displayName: 'A',
    });
    (verification.createOtp as jest.Mock).mockResolvedValue('123456');
    (mail.send as jest.Mock).mockResolvedValue(undefined);

    const result = await service.register({
      email: 'a@b.com',
      password: 'secret123',
      displayName: 'A',
    });

    expect(result.message).toContain('Verification code sent');
    expect(verification.createOtp).toHaveBeenCalledWith('a@b.com', 'u1');
    expect(mail.send).toHaveBeenCalled();
  });

  it('cleans up user on production mail failure', async () => {
    nodeEnv = 'production';
    prisma.user.findUnique = jest.fn().mockResolvedValue(null);
    prisma.user.create = jest.fn().mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      displayName: 'A',
    });
    (verification.createOtp as jest.Mock).mockResolvedValue('123456');
    (mail.send as jest.Mock).mockRejectedValue(new Error('smtp failed'));

    await expect(
      service.register({ email: 'a@b.com', password: 'secret123', displayName: 'A' }),
    ).rejects.toThrow('smtp failed');

    expect(verification.deleteOtp).toHaveBeenCalledWith('a@b.com');
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('returns generic resend message for unknown email', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue(null);

    const result = await service.resendVerification('missing@user.com');
    expect(result.message).toContain('If an account exists');
  });

  it('verifies otp and marks email verified', async () => {
    (verification.consumeOtp as jest.Mock).mockResolvedValue('u1');
    prisma.user.findUnique = jest.fn().mockResolvedValue({ id: 'u1', email: 'a@b.com' });
    prisma.user.update = jest.fn().mockResolvedValue(undefined);

    const result = await service.verifyEmailOtp('a@b.com', '123456');
    expect(result.message).toContain('Email verified');
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('rejects invalid otp', async () => {
    (verification.consumeOtp as jest.Mock).mockResolvedValue(null);

    await expect(service.verifyEmailOtp('a@b.com', '123456')).rejects.toThrow(BadRequestException);
  });

  it('rejects invalid verification token', async () => {
    (verification.consumeToken as jest.Mock).mockResolvedValue(null);

    await expect(service.verifyEmail('bad-token')).rejects.toThrow(BadRequestException);
  });

  it('blocks login when email is not verified', async () => {
    const passwordHash = await bcrypt.hash('secret123', 4);
    prisma.user.findUnique = jest.fn().mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      passwordHash,
      emailVerified: false,
    });

    await expect(service.login({ email: 'a@b.com', password: 'secret123' })).rejects.toThrow(
      'Email not verified',
    );
  });
});
