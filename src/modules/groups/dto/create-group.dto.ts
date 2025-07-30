import { IsNotEmpty, IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GroupVisibility } from '@prisma/client';

export class CreateGroupDto {
  @ApiProperty({ example: 'Book Lovers Club' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'A group for passionate book readers', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 50, minimum: 2, maximum: 1000 })
  @IsInt()
  @Min(2)
  @Max(1000)
  maxCapacity: number;

  @ApiProperty({ enum: GroupVisibility, example: GroupVisibility.PUBLIC })
  @IsEnum(GroupVisibility)
  visibility: GroupVisibility;
}