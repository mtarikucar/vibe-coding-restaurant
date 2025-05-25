import { IsArray, ValidateNested, IsOptional } from "class-validator";
import { Type, Exclude } from "class-transformer";
import { CreateCategoryDto } from "./create-category.dto";
import { UpdateCategoryDto } from "./update-category.dto";

export class CategoryDto extends UpdateCategoryDto {
  @IsOptional()
  id?: string;

  @Exclude()
  tenantId?: string;

  @Exclude()
  createdAt?: Date;

  @Exclude()
  updatedAt?: Date;
}

export class BatchCategoriesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryDto)
  categories: CategoryDto[];
}
