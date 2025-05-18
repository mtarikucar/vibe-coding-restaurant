import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

export class ProcessPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  method: PaymentMethod;

  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @IsString()
  @IsOptional()
  paymentIntentId?: string;

  @IsString()
  @IsOptional()
  cashierId?: string;
}
