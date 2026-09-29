import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Role } from '../../../common/enums/role.enum.js';

export class CreateUserDto {
  @ApiPropertyOptional({ example: 'ada@example.com', description: 'Defaults to a generated placeholder when omitted' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ minLength: 12, example: 'Str0ng-Passphrase!' })
  @IsString()
  @MinLength(12)
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({ enum: Role, default: Role.USER })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateUserRoleDto {
  @ApiPropertyOptional({ enum: Role })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

export class UpdateUserStatusDto {
  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  isActive: boolean;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
