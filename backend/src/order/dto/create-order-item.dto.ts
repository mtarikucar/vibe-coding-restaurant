import { IsUUID, IsNotEmpty, IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  menuItemId: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
