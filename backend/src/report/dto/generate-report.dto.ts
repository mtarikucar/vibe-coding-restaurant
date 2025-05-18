import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsDateString,
  IsUUID,
} from "class-validator";
import { ReportType, ReportFormat } from "../entities/report.entity";

export class GenerateReportDto {
  @IsUUID()
  @IsOptional()
  reportId?: string;

  @IsUUID()
  @IsOptional()
  templateId?: string;

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
  format?: ReportFormat = ReportFormat.PDF;
}
