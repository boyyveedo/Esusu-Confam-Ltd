import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinPrivateGroupDto {
  @ApiProperty({ example: 'ABC12345' })
  @IsNotEmpty()
  @IsString()
  inviteCode: string;
}