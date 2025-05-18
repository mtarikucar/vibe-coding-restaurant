import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateStockDto } from './create-stock.dto';
import { IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateStockDto extends PartialType(OmitType(CreateStockDto, ['menuItemId'] as const)) {
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minQuantity?: number;
}
