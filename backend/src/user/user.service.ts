import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';
import { hashPassword } from '../common/utils/password.util';
import { DuplicateEmailException } from '../common/exceptions/duplicate-email.exception';
import { UserNotFoundException } from '../common/exceptions/user-not-found.exception';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new DuplicateEmailException(data.email);
    }

    const hashedPassword = await hashPassword(data.password);
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    // Verify user exists
    const existingUser = await this.findOne(id);
    if (!existingUser) {
      throw new UserNotFoundException(id);
    }

    const updateData = { ...data };

    // Hash password if it's being updated
    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string): Promise<User> {
    // Verify user exists
    const existingUser = await this.findOne(id);
    if (!existingUser) {
      throw new UserNotFoundException(id);
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
