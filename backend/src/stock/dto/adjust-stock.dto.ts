import {
  IsNumber,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsOptional,
  IsString,
} from "class-validator";
import { StockActionType } from "../entities/stock-history.entity";

export class AdjustStockDto {
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsEnum(StockActionType)
  @IsNotEmpty()
  actionType: StockActionType;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsOptional()
  orderId?: string;

  @IsUUID()
  @IsOptional()
  purchaseOrderId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
