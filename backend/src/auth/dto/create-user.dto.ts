import {
  IsString,
  IsNotEmpty,
  IsEnum,
  MinLength,
  IsEmail,
  IsOptional,
  IsUUID,
  IsBoolean,
} from "class-validator";
import { UserRole } from "../entities/user.entity";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @IsOptional()
  preferredLanguage?: string;

  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @IsBoolean()
  @IsOptional()
  isSuperAdmin?: boolean;
}
