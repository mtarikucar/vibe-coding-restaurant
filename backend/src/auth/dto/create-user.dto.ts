import {
  IsString,
  IsNotEmpty,
  IsEnum,
  MinLength,
  IsEmail,
  IsOptional,
  IsUUID,
  IsBoolean,
  ValidateIf,
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
  @IsNotEmpty()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @IsOptional()
  preferredLanguage?: string;

  @IsUUID()
  @ValidateIf((o) => o.role !== UserRole.SUPER_ADMIN)
  @IsNotEmpty({ message: "Tenant ID is required for non-super admin users" })
  tenantId?: string;

  @IsBoolean()
  @IsOptional()
  isSuperAdmin?: boolean;
}
