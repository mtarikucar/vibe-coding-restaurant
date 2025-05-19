import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsEnum,
  IsDate,
  IsNumber,
  IsEmail,
  IsPhoneNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus, InvoiceType } from '../entities/invoice.entity';

export class CreateInvoiceDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsUUID()
  @IsOptional()
  paymentId?: string;

  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @IsEnum(InvoiceType)
  @IsOptional()
  type?: InvoiceType;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  issueDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerAddress?: string;

  @IsString()
  @IsOptional()
  customerTaxId?: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsPhoneNumber(null)
  @IsOptional()
  customerPhone?: string;
}
