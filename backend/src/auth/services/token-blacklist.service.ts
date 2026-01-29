import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class TokenBlacklistService {
  constructor(private readonly redisService: RedisService) {}

  async addToBlacklist(token: string, expiresInSeconds: number): Promise<void> {
    if (!token) return;

    const ttl = Math.max(1, Math.floor(expiresInSeconds));
    await this.redisService.set(this.key(token), true, ttl);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    if (!token) return false;
    return this.redisService.exists(this.key(token));
  }

  async removeFromBlacklist(token: string): Promise<void> {
    if (!token) return;
    await this.redisService.delete(this.key(token));
  }

  private key(token: string): string {
    const digest = createHash('sha256').update(token).digest('hex');
    return `auth:blacklist:${digest}`;
  }
}

