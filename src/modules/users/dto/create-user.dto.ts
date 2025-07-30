import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'david.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+2347045255001' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+234[789][01]\d{8}$/, {
    message: 'Phone number must be a valid Nigerian number',
  })
  phoneNumber: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}