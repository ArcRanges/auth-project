import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  RATE_LIMIT_META_KEY,
  type RateLimitOptions,
} from '../decorators/api-rate-limit.decorator';
import { RateLimitService } from '../rate-limit/rate-limit.service';

@Injectable()
export class ThrottlerBehindProxyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse();

    const options =
      this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_META_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? this.getDefaultLimit();

    const subject = this.getSubject(req);
    const endpoint = this.getEndpoint(req);
    const key = `auth:ratelimit:${subject}:${endpoint}`;

    const { count, ttlSeconds } = await this.rateLimitService.consume({
      key,
      ttlSeconds: options.ttl,
      limit: options.limit,
    });

    if (count === 0) {
      // Redis unavailable (fail-open)
      return true;
    }

    if (count > options.limit) {
      // Surface retry delay to clients; HttpExceptionFilter will format body, but headers can still be set.
      res?.setHeader?.('Retry-After', String(ttlSeconds));
      throw new HttpException(
        `Rate limit exceeded. Try again in ${ttlSeconds}s.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getDefaultLimit(): RateLimitOptions {
    const ttl = Number.parseInt(process.env.RATE_LIMIT_TTL ?? '60', 10);
    const limit = Number.parseInt(process.env.RATE_LIMIT_LIMIT ?? '100', 10);
    return {
      ttl: Number.isFinite(ttl) && ttl > 0 ? ttl : 60,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 100,
    };
  }

  private getEndpoint(req: Request): string {
    const method = req.method ?? 'GET';
    const baseUrl = req.baseUrl ?? '';
    const routePath =
      typeof req.route?.path === 'string' ? req.route.path : req.path ?? '';
    return `${method}:${baseUrl}${routePath}`;
  }

  private getSubject(req: Request): string {
    const userId = (req as any)?.user?.userId;
    if (typeof userId === 'string' && userId.length > 0) {
      return `user:${userId}`;
    }
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
    return `ip:${ip}`;
  }
}
