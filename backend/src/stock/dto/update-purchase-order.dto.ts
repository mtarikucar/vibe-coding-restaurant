import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePurchaseOrderDto } from './create-purchase-order.dto';
import {
  IsEnum,
  IsOptional,
  IsDate,
  IsBoolean,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderStatus } from '../entities/purchase-order.entity';

export class UpdatePurchaseOrderDto extends PartialType(
  OmitType(CreatePurchaseOrderDto, ['supplierId'] as const),
) {
  @IsEnum(PurchaseOrderStatus)
  @IsOptional()
  status?: PurchaseOrderStatus;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  deliveryDate?: Date;

  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  invoiceDate?: Date;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  paidDate?: Date;

  @IsBoolean()
  @IsOptional()
  isDeleted?: boolean;

  @IsUUID()
  @IsOptional()
  lastUpdatedById?: string;
}
