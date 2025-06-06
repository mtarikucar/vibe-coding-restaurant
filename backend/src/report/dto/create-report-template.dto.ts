import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsBoolean,
} from "class-validator";
import { ReportType, TemplateCategory } from "../entities/report.enums";

export class CreateReportTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ReportType)
  @IsNotEmpty()
  type: ReportType;

  @IsEnum(TemplateCategory)
  @IsOptional()
  category?: TemplateCategory;

  @IsObject()
  @IsNotEmpty()
  structure: Record<string, any>;

  @IsObject()
  @IsOptional()
  defaultParameters?: Record<string, any>;

  @IsObject()
  @IsOptional()
  visualizationOptions?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
