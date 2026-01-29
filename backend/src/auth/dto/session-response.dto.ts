import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty({
    description: 'Session identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Client IP address (if available)',
    required: false,
    example: '127.0.0.1',
  })
  ip?: string;

  @ApiProperty({
    description: 'Client user agent (if available)',
    required: false,
    example: 'Mozilla/5.0 ...',
  })
  userAgent?: string;

  @ApiProperty({
    description: 'Session creation time (ISO)',
    example: '2026-01-28T12:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last time the session was used (ISO)',
    example: '2026-01-28T12:30:00.000Z',
  })
  lastUsedAt: string;

  @ApiProperty({
    description: 'Refresh token expiration time (ISO)',
    example: '2026-02-04T12:00:00.000Z',
  })
  expiresAt: string;
}

