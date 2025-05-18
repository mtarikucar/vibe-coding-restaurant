import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsArray,
  IsDate,
  IsUUID,
  Matches,
  ValidateIf,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { 
  CampaignType, 
  CampaignStatus, 
  CampaignApplicability 
} from '../entities/campaign.entity';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CampaignType)
  type: CampaignType;

  @IsNumber()
  @Min(0)
  @ValidateIf(o => o.type !== CampaignType.FREE_ITEM)
  value: number;

  @IsEnum(CampaignStatus)
  @IsOptional()
  status?: CampaignStatus;

  @IsEnum(CampaignApplicability)
  applicability: CampaignApplicability;

  @IsArray()
  @IsUUID('4', { each: true })
  @ValidateIf(o => o.applicability !== CampaignApplicability.ALL_ITEMS)
  @ArrayMinSize(1)
  applicableItems?: string[];

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsArray()
  @ValidateIf(o => o.isRecurring === true)
  @ArrayMinSize(1)
  recurringDays?: number[];

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { 
    message: 'Recurring start time must be in HH:MM format' 
  })
  @ValidateIf(o => o.isRecurring === true)
  recurringStartTime?: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { 
    message: 'Recurring end time must be in HH:MM format' 
  })
  @ValidateIf(o => o.isRecurring === true)
  recurringEndTime?: string;

  @IsBoolean()
  @IsOptional()
  requiresCode?: boolean;

  @IsString()
  @ValidateIf(o => o.requiresCode === true)
  code?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  usageLimit?: number;
}
