import { UserResponseDto } from '../../user/dto/user-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Session ID (UUID) for the current session',
    example: '8f94b7c8-3e4e-4d9d-86c7-8a5d3cb4e1e9',
  })
  session_id: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token: string;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  constructor(
    access_token: string,
    session_id: string,
    refresh_token: string,
    user: UserResponseDto,
  ) {
    this.access_token = access_token;
    this.session_id = session_id;
    this.refresh_token = refresh_token;
    this.user = user;
  }
}
