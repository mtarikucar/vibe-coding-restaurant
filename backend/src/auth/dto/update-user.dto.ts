import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsEmail,
} from "class-validator";
import { UserRole } from "../entities/user.entity";

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  preferredLanguage?: string;
}
