import { IsUUID, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateStockDto {
  @IsUUID()
  @IsNotEmpty()
  menuItemId: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minQuantity?: number;
}
