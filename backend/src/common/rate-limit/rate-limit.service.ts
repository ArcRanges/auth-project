import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';

@Injectable()
export class RateLimitService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RateLimitService.name);
  private client: RedisClientType | undefined;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD') || undefined;

    this.client = createClient({
      socket: { host, port },
      password,
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis rate-limit client error', err);
    });

    try {
      await this.client.connect();
      this.logger.log('✅ Redis rate-limit client connected');
    } catch (err) {
      this.logger.error('❌ Failed to connect Redis rate-limit client', err);
      // fail-open: guard will allow requests if Redis is unavailable
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client?.quit();
    } catch {
      // ignore
    }
  }

  async consume(params: {
    key: string;
    ttlSeconds: number;
    limit: number;
  }): Promise<{ count: number; ttlSeconds: number }> {
    if (!this.client?.isOpen) {
      return { count: 0, ttlSeconds: 0 };
    }

    const ttl = Math.max(1, Math.floor(params.ttlSeconds));
    const script = `
      local current = redis.call('INCR', KEYS[1])
      if tonumber(current) == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
      end
      local remainingTtl = redis.call('TTL', KEYS[1])
      return { current, remainingTtl }
    `;

    const result = (await this.client.eval(script, {
      keys: [params.key],
      arguments: [String(ttl)],
    })) as [number | string, number | string];

    const count = typeof result[0] === 'string' ? Number.parseInt(result[0], 10) : result[0];
    const remainingTtl = typeof result[1] === 'string' ? Number.parseInt(result[1], 10) : result[1];

    return {
      count: Number.isFinite(count) ? count : 0,
      ttlSeconds: Number.isFinite(remainingTtl) && remainingTtl > 0 ? remainingTtl : ttl,
    };
  }
}

