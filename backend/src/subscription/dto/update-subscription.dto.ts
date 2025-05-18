import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDate,
  IsNumber,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionStatus, PaymentProvider } from '../entities/subscription.entity';

export class UpdateSubscriptionDto {
  @IsString()
  @IsOptional()
  planId?: string;

  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  canceledAt?: Date;

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

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  lastPaymentDate?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  nextPaymentDate?: Date;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  currency?: string;
}
