import { NotFoundException } from '@nestjs/common';

export class UserNotFoundException extends NotFoundException {
  constructor(identifier?: string) {
    const message = identifier
      ? `User with identifier '${identifier}' not found`
      : 'User not found';
    super(message);
  }
}
