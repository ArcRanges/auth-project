import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ClassSerializerInterceptor,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface JwtPayloadUser {
  userId: string;
  email: string;
}

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userService.findAll();
    return users.map((user) => new UserResponseDto(user));
  }

  @Get('current')
  async getCurrentUser(
    @CurrentUser() user: JwtPayloadUser,
  ): Promise<UserResponseDto> {
    const currentUser = await this.userService.findOne(user.userId);
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }
    return new UserResponseDto(currentUser);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return new UserResponseDto(user);
  }

  @Patch('current')
  async updateCurrentUser(
    @CurrentUser() user: JwtPayloadUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.userService.update(
      user.userId,
      updateUserDto,
    );
    return new UserResponseDto(updatedUser);
  }

  @Delete('current')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCurrentUser(@CurrentUser() user: JwtPayloadUser): Promise<void> {
    await this.userService.remove(user.userId);
  }
}
