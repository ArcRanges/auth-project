import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  Req,
  Delete,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { UserService } from '../user/user.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserNotFoundException } from '../common/exceptions/user-not-found.exception';
import { SessionService } from './services/session.service';

interface JwtPayloadUser {
  userId: string;
  email: string;
}

@ApiTags('Authentication')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Req() req: Request,
    @Body() loginDto: LoginDto,
  ): Promise<AuthResponseDto> {
    if (req.headers?.['user-agent']) {
      return this.authService.login(loginDto, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }
    throw new Error('User-Agent header is missing');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'New access token generated',
    schema: {
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<{ access_token: string }> {
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 204, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @Req() req: Request,
    @CurrentUser() user: JwtPayloadUser,
    @Body() logoutDto: LogoutDto,
  ): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new Error('Authorization header is missing');
    }

    const accessToken = authHeader.slice('Bearer '.length).trim();

    await this.authService.logout(
      user.userId,
      accessToken,
      logoutDto?.refreshToken,
    );
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List active sessions for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of active sessions',
    type: [SessionResponseDto],
  })
  async listSessions(
    @CurrentUser() user: JwtPayloadUser,
  ): Promise<SessionResponseDto[]> {
    return this.sessionService.getUserSessions(user.userId);
  }

  @Delete('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke all sessions for the current user' })
  @ApiResponse({ status: 204, description: 'All sessions revoked' })
  async revokeAllSessions(@CurrentUser() user: JwtPayloadUser): Promise<void> {
    await this.sessionService.deleteAllUserSessions(user.userId);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a specific session by session ID' })
  @ApiParam({ name: 'sessionId', description: 'Session ID (UUID)' })
  @ApiResponse({ status: 204, description: 'Session revoked' })
  async revokeSession(
    @CurrentUser() user: JwtPayloadUser,
    @Param('sessionId') sessionId: string,
  ): Promise<void> {
    await this.sessionService.deleteUserSession(user.userId, sessionId);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(
    @CurrentUser() user: JwtPayloadUser,
  ): Promise<UserResponseDto> {
    const currentUser = await this.userService.findOne(user.userId);
    if (!currentUser) {
      throw new UserNotFoundException(user.userId);
    }
    return new UserResponseDto(currentUser);
  }
}
