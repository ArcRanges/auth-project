import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { RedisService } from '../../redis/redis.service';
import { SessionResponseDto } from '../dto/session-response.dto';

type SessionRecord = {
  userId: string;
  refreshTokenHash: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAtMs: number;
};

@Injectable()
export class SessionService {
  constructor(private readonly redisService: RedisService) {}

  newSessionId(): string {
    return randomUUID();
  }

  async createSession(params: {
    sessionId: string;
    userId: string;
    refreshToken: string;
    expiresAtMs: number;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    const nowIso = new Date().toISOString();
    const record: SessionRecord = {
      userId: params.userId,
      refreshTokenHash: this.hash(params.refreshToken),
      ip: params.ip,
      userAgent: params.userAgent,
      createdAt: nowIso,
      lastUsedAt: nowIso,
      expiresAtMs: params.expiresAtMs,
    };

    const ttlSeconds = this.remainingTtlSeconds(params.expiresAtMs);
    await this.redisService.setJson(this.sessionKey(params.sessionId), record, ttlSeconds);
    await this.redisService.addToSet(this.userSessionsKey(params.userId), params.sessionId);
  }

  async validateRefreshToken(params: {
    userId: string;
    sessionId: string;
    refreshToken: string;
  }): Promise<void> {
    const record = await this.getSessionRecord(params.sessionId);
    if (!record) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (record.userId !== params.userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (record.refreshTokenHash !== this.hash(params.refreshToken)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (Date.now() >= record.expiresAtMs) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.touchSession(params.sessionId);
  }

  async touchSession(sessionId: string): Promise<void> {
    const record = await this.getSessionRecord(sessionId);
    if (!record) return;

    const ttlSeconds = this.remainingTtlSeconds(record.expiresAtMs);
    const updated: SessionRecord = {
      ...record,
      lastUsedAt: new Date().toISOString(),
    };
    await this.redisService.setJson(this.sessionKey(sessionId), updated, ttlSeconds);
  }

  async touchSessionIfStale(sessionId: string, minIntervalMs = 5 * 60 * 1000): Promise<void> {
    const record = await this.getSessionRecord(sessionId);
    if (!record) return;

    const lastUsedAtMs = Date.parse(record.lastUsedAt);
    if (Number.isFinite(lastUsedAtMs) && Date.now() - lastUsedAtMs < minIntervalMs) {
      return;
    }

    const ttlSeconds = this.remainingTtlSeconds(record.expiresAtMs);
    const updated: SessionRecord = {
      ...record,
      lastUsedAt: new Date().toISOString(),
    };
    await this.redisService.setJson(this.sessionKey(sessionId), updated, ttlSeconds);
  }

  async assertSessionActiveAndTouchIfStale(params: {
    userId: string;
    sessionId: string;
    minIntervalMs?: number;
  }): Promise<void> {
    const record = await this.getSessionRecord(params.sessionId);
    if (!record) {
      throw new UnauthorizedException('Session revoked');
    }

    if (record.userId !== params.userId) {
      throw new UnauthorizedException('Session revoked');
    }

    if (Date.now() >= record.expiresAtMs) {
      throw new UnauthorizedException('Session revoked');
    }

    const minIntervalMs = params.minIntervalMs ?? 5 * 60 * 1000;
    const lastUsedAtMs = Date.parse(record.lastUsedAt);
    if (Number.isFinite(lastUsedAtMs) && Date.now() - lastUsedAtMs < minIntervalMs) {
      return;
    }

    const ttlSeconds = this.remainingTtlSeconds(record.expiresAtMs);
    const updated: SessionRecord = {
      ...record,
      lastUsedAt: new Date().toISOString(),
    };
    await this.redisService.setJson(this.sessionKey(params.sessionId), updated, ttlSeconds);
  }

  async getUserSessions(userId: string): Promise<SessionResponseDto[]> {
    const sessionIds = await this.redisService.getSet(this.userSessionsKey(userId));
    if (sessionIds.length === 0) return [];

    const sessions: SessionResponseDto[] = [];
    for (const sessionId of sessionIds) {
      const record = await this.getSessionRecord(sessionId);
      if (!record) {
        await this.redisService.removeFromSet(this.userSessionsKey(userId), sessionId);
        continue;
      }

      sessions.push({
        sessionId,
        ip: record.ip,
        userAgent: record.userAgent,
        createdAt: record.createdAt,
        lastUsedAt: record.lastUsedAt,
        expiresAt: new Date(record.expiresAtMs).toISOString(),
      });
    }

    return sessions;
  }

  async deleteUserSession(userId: string, sessionId: string): Promise<void> {
    const record = await this.getSessionRecord(sessionId);
    if (!record) {
      await this.redisService.removeFromSet(this.userSessionsKey(userId), sessionId);
      return;
    }

    if (record.userId !== userId) {
      throw new UnauthorizedException('Session does not belong to user');
    }

    await this.redisService.delete(this.sessionKey(sessionId));
    await this.redisService.removeFromSet(this.userSessionsKey(userId), sessionId);
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    const sessionIds = await this.redisService.getSet(this.userSessionsKey(userId));
    await Promise.all(sessionIds.map((sessionId) => this.redisService.delete(this.sessionKey(sessionId))));
    await this.redisService.delete(this.userSessionsKey(userId));
  }

  async deleteAllUserSessionsExcept(userId: string, keepSessionId: string): Promise<void> {
    const sessionIds = await this.redisService.getSet(this.userSessionsKey(userId));
    if (sessionIds.length === 0) return;

    const toDelete = sessionIds.filter((id) => id !== keepSessionId);
    await Promise.all(toDelete.map((sessionId) => this.redisService.delete(this.sessionKey(sessionId))));
    await Promise.all(toDelete.map((sessionId) => this.redisService.removeFromSet(this.userSessionsKey(userId), sessionId)));
  }

  async tryDeleteSessionFromRefreshToken(params: {
    userId: string;
    sessionId?: string;
  }): Promise<void> {
    if (!params.sessionId) return;
    try {
      await this.deleteUserSession(params.userId, params.sessionId);
    } catch {
      // best-effort cleanup
    }
  }

  private async getSessionRecord(sessionId: string): Promise<SessionRecord | undefined> {
    return this.redisService.getJson<SessionRecord>(this.sessionKey(sessionId));
  }

  private remainingTtlSeconds(expiresAtMs: number): number {
    const remainingMs = expiresAtMs - Date.now();
    return Math.max(1, Math.ceil(Math.max(0, remainingMs) / 1000));
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private sessionKey(sessionId: string): string {
    return `auth:session:${sessionId}`;
  }

  private userSessionsKey(userId: string): string {
    return `auth:session:user:${userId}`;
  }
}
