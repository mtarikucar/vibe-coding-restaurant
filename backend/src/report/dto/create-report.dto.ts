import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsObject,
  IsDateString,
} from "class-validator";
import { ReportType, ReportFormat } from "../entities/report.entity";

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ReportType)
  @IsNotEmpty()
  type: ReportType;

  @IsObject()
  @IsOptional()
  filters?: Record<string, any>;

  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsUUID()
  @IsOptional()
  templateId?: string;

  @IsUUID()
  @IsOptional()
  scheduleId?: string;
}
