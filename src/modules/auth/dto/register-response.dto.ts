

import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';


export class RegisterResponseDto {
    @ApiProperty({ example: 'Registration successful. Please log in.' })
    message: string;
  
    @ApiProperty()
    user: UserResponseDto;
  
    constructor(partial: Partial<RegisterResponseDto>) {
      Object.assign(this, partial);
    }
  }
  