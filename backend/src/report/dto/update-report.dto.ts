import { PartialType } from "@nestjs/mapped-types";
import { CreateReportDto } from "./create-report.dto";
import { IsEnum, IsOptional } from "class-validator";
import { ReportStatus } from "../entities/report.enums";

export class UpdateReportDto extends PartialType(CreateReportDto) {
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;
}
