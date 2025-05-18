import { IsUUID, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsObject } from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  @IsNotEmpty()
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
