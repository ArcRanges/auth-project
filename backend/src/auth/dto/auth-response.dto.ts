import { UserResponseDto } from '../../user/dto/user-response.dto';

export class AuthResponseDto {
  access_token: string;
  refresh_token: string;
  user: UserResponseDto;

  constructor(
    access_token: string,
    refresh_token: string,
    user: UserResponseDto,
  ) {
    this.access_token = access_token;
    this.refresh_token = refresh_token;
    this.user = user;
  }
}
