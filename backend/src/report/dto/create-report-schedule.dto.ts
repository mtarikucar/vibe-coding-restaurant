import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsBoolean,
  IsArray,
  IsEmail,
  IsDateString,
} from "class-validator";
import {
  ScheduleFrequency,
  DeliveryMethod,
} from "../entities/report-schedule.entity";
import { ReportFormat } from "../entities/report.enums";

export class CreateReportScheduleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ScheduleFrequency)
  @IsNotEmpty()
  frequency: ScheduleFrequency;

  @IsObject()
  @IsOptional()
  cronExpression?: Record<string, any>;

  @IsDateString()
  @IsOptional()
  nextRunDate?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsEnum(DeliveryMethod)
  @IsNotEmpty()
  deliveryMethod: DeliveryMethod;

  @IsObject()
  @IsOptional()
  deliveryConfig?: Record<string, any>;

  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat;

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  recipients?: string[];
}
