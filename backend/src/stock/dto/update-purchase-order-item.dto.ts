import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePurchaseOrderItemDto } from './create-purchase-order-item.dto';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdatePurchaseOrderItemDto extends PartialType(
  OmitType(CreatePurchaseOrderItemDto, ['stockId'] as const),
) {
  @IsNumber()
  @Min(0)
  @IsOptional()
  receivedQuantity?: number;
}
