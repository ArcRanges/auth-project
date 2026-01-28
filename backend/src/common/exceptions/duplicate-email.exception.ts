import { ConflictException } from '@nestjs/common';

export class DuplicateEmailException extends ConflictException {
  constructor(email: string) {
    super(`A user with email '${email}' already exists`);
  }
}
