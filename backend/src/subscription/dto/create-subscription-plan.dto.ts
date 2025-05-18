import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  IsObject,
} from 'class-validator';
import { PlanType, PlanStatus } from '../entities/subscription-plan.entity';

export class CreateSubscriptionPlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(PlanType)
  type: PlanType;

  @IsNumber()
  @Min(1)
  duration: number;

  @IsEnum(PlanStatus)
  @IsOptional()
  status?: PlanStatus;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  trialPeriod?: number;

  @IsObject()
  @IsOptional()
  features?: Record<string, any>;
}
