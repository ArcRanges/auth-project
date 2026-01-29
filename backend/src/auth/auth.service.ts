import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { comparePassword } from '../common/utils/password.util';
import { InvalidCredentialsException } from '../common/exceptions/invalid-credentials.exception';
import { UserNotFoundException } from '../common/exceptions/user-not-found.exception';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { SessionService } from './services/session.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly sessionService: SessionService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.userService.create(registerDto);
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      undefined,
    );
    return new AuthResponseDto(
      accessToken,
      refreshToken,
      new UserResponseDto(user),
    );
  }

  async login(
    loginDto: LoginDto,
    meta?: { ip?: string; userAgent?: string },
  ): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      meta,
    );
    return new AuthResponseDto(
      accessToken,
      refreshToken,
      new UserResponseDto(user),
    );
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    return user;
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ access_token: string }> {
    try {
      if (await this.tokenBlacklistService.isBlacklisted(refreshToken)) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const payload = this.jwtService.verify(refreshToken) as {
        sub: string;
        email: string;
        sid?: string;
      };

      const user = await this.userService.findOne(payload.sub);
      if (!user) {
        throw new UserNotFoundException(payload.sub);
      }

      if (!payload.sid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      await this.sessionService.validateRefreshToken({
        userId: user.id,
        sessionId: payload.sid,
        refreshToken,
      });

      const accessToken = this.generateAccessToken(user.id, user.email);
      return { access_token: accessToken };
    } catch (error) {
      if (
        error instanceof UserNotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(
    userId: string,
    accessToken?: string,
    refreshToken?: string,
  ): Promise<void> {
    if (accessToken) {
      const ttl = this.getRemainingTtlSeconds(accessToken);
      if (ttl) {
        await this.tokenBlacklistService.addToBlacklist(accessToken, ttl);
      }
    }

    if (refreshToken) {
      const ttl = this.getRemainingTtlSeconds(refreshToken);
      if (ttl) {
        await this.tokenBlacklistService.addToBlacklist(refreshToken, ttl);
      }

      const sessionId = this.getSessionIdFromToken(refreshToken);
      await this.sessionService.tryDeleteSessionFromRefreshToken({
        userId,
        sessionId,
      });
    }
  }

  private async generateTokens(
    userId: string,
    email: string,
    meta?: { ip?: string; userAgent?: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessPayload = { sub: userId, email };
    const sessionId = this.sessionService.newSessionId();
    const refreshPayload = { sub: userId, email, sid: sessionId };

    const accessExpiresIn = (process.env.JWT_EXPIRES_IN ?? '1h') as any;
    const refreshExpiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as any;

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: accessExpiresIn,
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: refreshExpiresIn,
    });

    const expiresAtMs = this.getExpiresAtMs(refreshToken);
    if (!expiresAtMs) {
      throw new UnauthorizedException('Failed to create session');
    }

    await this.sessionService.createSession({
      sessionId,
      userId,
      refreshToken,
      expiresAtMs,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return { accessToken, refreshToken };
  }

  private generateAccessToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_EXPIRES_IN ?? '1h') as any,
    });
  }

  private getExpiresAtMs(token: string): number | undefined {
    const decoded = this.jwtService.decode(token) as { exp?: number } | null;
    if (!decoded?.exp) return undefined;
    return decoded.exp * 1000;
  }

  private getRemainingTtlSeconds(token: string): number | undefined {
    const decoded = this.jwtService.decode(token) as { exp?: number } | null;
    if (!decoded?.exp) return undefined;

    const remainingMs = decoded.exp * 1000 - Date.now();
    if (remainingMs <= 0) return undefined;

    return Math.max(1, Math.ceil(remainingMs / 1000));
  }

  private getSessionIdFromToken(token: string): string | undefined {
    const decoded = this.jwtService.decode(token) as { sid?: string } | null;
    return decoded?.sid;
  }
}
