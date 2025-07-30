import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    await this.validateUserUniqueness(createUserDto.email, createUserDto.phoneNumber);
    
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    
    const user = await this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return new UserResponseDto(user);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return new UserResponseDto(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  private async validateUserUniqueness(email: string, phoneNumber: string): Promise<void> {
    const [existingUserByEmail, existingUserByPhone] = await Promise.all([
      this.userRepository.findByEmail(email),
      this.userRepository.findByPhoneNumber(phoneNumber),
    ]);

    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    if (existingUserByPhone) {
      throw new ConflictException('User with this phone number already exists');
    }
  }
}