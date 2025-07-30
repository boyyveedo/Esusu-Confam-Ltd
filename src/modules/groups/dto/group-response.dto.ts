import { ApiProperty } from '@nestjs/swagger';
import { GroupVisibility } from '@prisma/client';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class GroupResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  maxCapacity: number;

  @ApiProperty({ enum: GroupVisibility })
  visibility: GroupVisibility;

  @ApiProperty()
  inviteCode?: string;

  @ApiProperty()
  ownerId: string;

  @ApiProperty()
  owner?: UserResponseDto;

  @ApiProperty()
  memberCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<GroupResponseDto>) {
    Object.assign(this, partial);
  }
}