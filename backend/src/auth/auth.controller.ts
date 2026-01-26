import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { UserService } from '../user/user.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface JwtPayloadUser {
  userId: string;
  email: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<{ access_token: string }> {
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: JwtPayloadUser): Promise<void> {
    await this.authService.logout(user.userId);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(
    @CurrentUser() user: JwtPayloadUser,
  ): Promise<UserResponseDto> {
    const currentUser = await this.userService.findOne(user.userId);
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }
    return new UserResponseDto(currentUser);
  }
}
