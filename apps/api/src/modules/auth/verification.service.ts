import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomInt } from 'crypto';
import Redis from 'ioredis';

@Injectable()
export class VerificationService {
  private readonly redis: Redis;
  private readonly linkTtlSeconds: number;
  private readonly otpTtlSeconds: number;
  private readonly otpMaxAttempts: number;
  private readonly linkKeyPrefix = 'eventix:verify:link:';
  private readonly otpKeyPrefix = 'eventix:verify:otp:';

  constructor(private readonly config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (redisUrl) {
      this.redis = new Redis(redisUrl);
    } else {
      const host = this.config.get<string>('REDIS_HOST') || '127.0.0.1';
      const port = Number(this.config.get<string>('REDIS_PORT') || 6379);
      const password = this.config.get<string>('REDIS_PASSWORD');
      this.redis = new Redis({ host, port, password });
    }

    this.linkTtlSeconds = Number(this.config.get<string>('EMAIL_VERIFY_TTL_SECONDS') || 86400);
    this.otpTtlSeconds = Number(this.config.get<string>('EMAIL_OTP_TTL_SECONDS') || 600);
    this.otpMaxAttempts = Number(this.config.get<string>('EMAIL_OTP_MAX_ATTEMPTS') || 5);
  }

  async createToken(userId: string) {
    const token = randomBytes(32).toString('hex');
    await this.redis.setex(`${this.linkKeyPrefix}${token}`, this.linkTtlSeconds, userId);
    return token;
  }

  async consumeToken(token: string) {
    const key = `${this.linkKeyPrefix}${token}`;
    const userId = await this.redis.get(key);
    if (!userId) {
      return null;
    }
    await this.redis.del(key);
    return userId;
  }

  async createOtp(email: string, userId: string) {
    const otp = String(randomInt(100000, 1000000));
    const key = this.otpKey(email);
    const otpHash = this.hashOtp(email, otp);

    await this.redis.setex(
      key,
      this.otpTtlSeconds,
      JSON.stringify({ userId, otpHash, attempts: 0 }),
    );

    return otp;
  }

  async consumeOtp(email: string, otp: string) {
    const key = this.otpKey(email);
    const raw = await this.redis.get(key);
    if (!raw) {
      return null;
    }

    const parsed = this.parseOtpRecord(raw);
    if (!parsed) {
      await this.redis.del(key);
      return null;
    }

    const incomingHash = this.hashOtp(email, otp);
    if (parsed.otpHash !== incomingHash) {
      const attempts = parsed.attempts + 1;
      if (attempts >= this.otpMaxAttempts) {
        await this.redis.del(key);
      } else {
        await this.redis.setex(key, this.otpTtlSeconds, JSON.stringify({ ...parsed, attempts }));
      }
      return null;
    }

    await this.redis.del(key);
    return parsed.userId;
  }

  async deleteOtp(email: string) {
    await this.redis.del(this.otpKey(email));
  }

  getOtpTtlSeconds() {
    return this.otpTtlSeconds;
  }

  private otpKey(email: string) {
    return `${this.otpKeyPrefix}${email.trim().toLowerCase()}`;
  }

  private hashOtp(email: string, otp: string) {
    const normalizedEmail = email.trim().toLowerCase();
    return createHash('sha256').update(`${normalizedEmail}:${otp}`).digest('hex');
  }

  private parseOtpRecord(
    raw: string,
  ): { userId: string; otpHash: string; attempts: number } | null {
    try {
      const parsed = JSON.parse(raw) as {
        userId?: string;
        otpHash?: string;
        attempts?: number;
      };

      if (!parsed.userId || !parsed.otpHash) {
        return null;
      }

      return {
        userId: parsed.userId,
        otpHash: parsed.otpHash,
        attempts: Number(parsed.attempts || 0),
      };
    } catch {
      return null;
    }
  }
}
