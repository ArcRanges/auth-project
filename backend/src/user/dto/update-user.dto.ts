import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  Length,
} from 'class-validator';

export class UpdateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @IsString({ message: 'Password must be a string' })
  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password?: string;

  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  @Length(2, 100, {
    message: 'Name must be between 2 and 100 characters long',
  })
  name?: string;

  @IsString()
  @IsOptional()
  refreshToken?: string | null;
}
