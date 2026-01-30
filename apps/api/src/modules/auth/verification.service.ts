import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import Redis from 'ioredis';

@Injectable()
export class VerificationService {
  private readonly redis: Redis;
  private readonly ttlSeconds: number;
  private readonly keyPrefix = 'eventix:verify:';

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

    this.ttlSeconds = Number(this.config.get<string>('EMAIL_VERIFY_TTL_SECONDS') || 86400);
  }

  async createToken(userId: string) {
    const token = randomBytes(32).toString('hex');
    await this.redis.setex(`${this.keyPrefix}${token}`, this.ttlSeconds, userId);
    return token;
  }

  async consumeToken(token: string) {
    const key = `${this.keyPrefix}${token}`;
    const userId = await this.redis.get(key);
    if (!userId) {
      return null;
    }
    await this.redis.del(key);
    return userId;
  }
}
