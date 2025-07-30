import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class JoinRequestResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  user: UserResponseDto;

  @ApiProperty()
  createdAt: Date;

  constructor(partial: Partial<JoinRequestResponseDto>) {
    Object.assign(this, partial);
  }
}