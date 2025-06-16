import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDate,
  IsNumber,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionStatus, PaymentProvider } from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @IsString()
  @IsOptional()
  subscriptionId?: string;

  @IsEnum(PaymentProvider)
  @IsOptional()
  paymentProvider?: PaymentProvider;

  @IsObject()
  @IsOptional()
  paymentDetails?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsOptional()
  @IsObject()
  billingAddress?: Record<string, any>;

  @IsOptional()
  @IsString()
  invoiceEmail?: string;

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsOptional()
  @IsObject()
  usageMetrics?: Record<string, any>;
}
