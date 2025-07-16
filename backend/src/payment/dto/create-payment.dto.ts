import { IsUUID, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsObject, Min, IsPositive } from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'amount must be a number with at most 2 decimal places' })
  @IsPositive({ message: 'amount must be a positive number' })
  @IsNotEmpty({ message: 'amount is required' })
  amount: number;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  method: PaymentMethod;

  @IsUUID()
  @IsNotEmpty()
  cashierId: string;

  @IsObject()
  @IsOptional()
  paymentDetails?: Record<string, any>;
}
