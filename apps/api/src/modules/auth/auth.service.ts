import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerificationService } from './verification.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly verificationService: VerificationService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        displayName: dto.displayName,
        passwordHash,
        emailVerified: false,
      },
    });

    const token = await this.verificationService.createToken(user.id);
    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/verify-email?token=${token}`;

    try {
      await this.mailService.send({
        to: user.email,
        subject: 'Confirm your Eventix account',
        text: `Hi ${user.displayName}, confirm your email by visiting: ${verifyUrl}`,
        html: `
          <p>Hi ${user.displayName},</p>
          <p>Please confirm your email to activate your Eventix account.</p>
          <p><a href="${verifyUrl}">Confirm my email</a></p>
          <p>If you did not request this, you can ignore this email.</p>
        `,
      });
    } catch (error) {
      await this.verificationService.consumeToken(token);
      await this.prisma.user.delete({ where: { id: user.id } });
      throw error;
    }

    return {
      message: 'Verification email sent. Please check your inbox to continue.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Email not verified. Check your inbox.');
    }

    return this.issueToken(user.id, user.email);
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, displayName: true, email: true, emailVerified: true },
    });

    if (!user || user.emailVerified) {
      return { message: 'If an account exists, a verification email has been sent.' };
    }

    const token = await this.verificationService.createToken(user.id);
    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/verify-email?token=${token}`;

    await this.mailService.send({
      to: user.email,
      subject: 'Confirm your Eventix account',
      text: `Hi ${user.displayName}, confirm your email by visiting: ${verifyUrl}`,
      html: `
        <p>Hi ${user.displayName},</p>
        <p>Please confirm your email to activate your Eventix account.</p>
        <p><a href="${verifyUrl}">Confirm my email</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    });

    return { message: 'Verification email sent. Please check your inbox to continue.' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async issueToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    const userId = await this.verificationService.consumeToken(token);
    if (!userId) {
      throw new BadRequestException('Verification token is invalid or expired');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    });

    return { message: 'Email verified. You can now sign in.' };
  }
}
