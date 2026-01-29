import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { comparePassword, hashPassword } from '../common/utils/password.util';
import { InvalidCredentialsException } from '../common/exceptions/invalid-credentials.exception';
import { UserNotFoundException } from '../common/exceptions/user-not-found.exception';
import { TokenBlacklistService } from './services/token-blacklist.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.userService.create(registerDto);
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
    );
    await this.updateRefreshToken(user.id, refreshToken);
    return new AuthResponseDto(
      accessToken,
      refreshToken,
      new UserResponseDto(user),
    );
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
    );
    await this.updateRefreshToken(user.id, refreshToken);
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

      const payload = this.jwtService.verify(refreshToken);

      const user = await this.userService.findOne(payload.sub);
      if (!user) {
        throw new UserNotFoundException(payload.sub);
      }

      if (!user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isRefreshTokenValid = await comparePassword(
        refreshToken,
        user.refreshToken,
      );

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

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
    }

    await this.userService.update(userId, { refreshToken: null });
  }

  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload);

    return { accessToken, refreshToken };
  }

  private generateAccessToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }

  private async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await hashPassword(refreshToken);
    await this.userService.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  private getRemainingTtlSeconds(token: string): number | undefined {
    const decoded = this.jwtService.decode(token) as { exp?: number } | null;
    if (!decoded?.exp) return undefined;

    const remainingMs = decoded.exp * 1000 - Date.now();
    if (remainingMs <= 0) return undefined;

    return Math.max(1, Math.ceil(remainingMs / 1000));
  }
}
