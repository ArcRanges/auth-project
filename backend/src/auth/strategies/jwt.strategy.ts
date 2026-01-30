import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';
import type { Request } from 'express';
import { TokenBlacklistService } from '../services/token-blacklist.service';
import { SessionService } from '../services/session.service';

type JwtAccessPayload = {
  sub: string;
  email: string;
  sid?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private userService: UserService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtAccessPayload) {
    const authHeader = req.headers.authorization;
    const token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : undefined;

    if (token && (await this.tokenBlacklistService.isBlacklisted(token))) {
      throw new UnauthorizedException('Token is blacklisted');
    }

    const user = await this.userService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    const sessionId =
      typeof payload.sid === 'string' && payload.sid.length > 0
        ? payload.sid
        : undefined;

    if (!sessionId) {
      throw new UnauthorizedException('Invalid token');
    }

    try {
      await this.sessionService.assertSessionActiveAndTouchIfStale({
        userId: payload.sub,
        sessionId,
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Unauthorized');
    }

    return { userId: payload.sub, email: payload.email, sessionId };
  }
}
