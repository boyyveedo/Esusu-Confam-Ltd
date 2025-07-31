import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import { UserService } from '../../users/services/user.service';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { RegisterResponseDto } from '../dto/register-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<RegisterResponseDto> {
    const user = await this.userService.create(createUserDto);
    const userResponse = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
    const accessToken = this.generateToken(userResponse);

    return new RegisterResponseDto({
      message: 'Registration successful. Please log in.',
      user: userResponse,
    });
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userService.findByEmail(loginDto.email);

    if (!user || !(await this.userService.validatePassword(user, loginDto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userResponse = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
    const accessToken = this.generateToken(userResponse);

    return new AuthResponseDto({
      accessToken,
      user: userResponse,
    });
  }

  private generateToken(user: UserResponseDto): string {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}
