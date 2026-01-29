import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export const RATE_LIMIT_META_KEY = 'rateLimit';

export type RateLimitOptions = {
  ttl: number;
  limit: number;
};

export function ApiRateLimit(options: RateLimitOptions) {
  return applyDecorators(
    SetMetadata(RATE_LIMIT_META_KEY, options),
    ApiResponse({
      status: 429,
      description: 'Too Many Requests',
    }),
  );
}

