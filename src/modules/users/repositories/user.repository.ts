import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { IUserRepository } from '../interfaces/user.interface';
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly db: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.db.user.create({
      data: createUserDto,
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id },
      include: {
        groupMemberships: {
          include: {
            group: true,
          },
        },
        ownedGroups: true,
      },
    });
  }
  
  

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { phoneNumber },
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.db.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.user.delete({
      where: { id },
    });
  }
}