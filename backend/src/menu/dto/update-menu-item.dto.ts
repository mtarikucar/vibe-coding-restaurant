import { PartialType } from "@nestjs/mapped-types";
import { CreateMenuItemDto } from "./create-menu-item.dto";
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
} from "class-validator";
import { Exclude } from "class-transformer";

export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @Exclude()
  tenantId?: string;

  @Exclude()
  createdAt?: Date;

  @Exclude()
  updatedAt?: Date;

  @Exclude()
  category?: any;

  @Exclude()
  imageFile?: any;
}
