import { PartialType } from "@nestjs/mapped-types";
import { CreateInvoiceDto } from "./create-invoice.dto";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { InvoiceStatus } from "../entities/invoice.entity";

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @IsString()
  @IsOptional()
  fileUrl?: string;
}

export class UpdateInvoiceStatusDto {
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status: InvoiceStatus;
}
