import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    minLength: 12,
    maxLength: 72,
    example: 'Str0ng-Passphrase!',
    description:
      '72 chars is bcrypt’s hard limit — anything longer is silently truncated.',
  })
  @IsString()
  @MinLength(12)
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message:
      'password must contain at least one lowercase letter, one uppercase letter, one digit and one symbol',
  })
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Str0ng-Passphrase!' })
  @IsString()
  password: string;
}
