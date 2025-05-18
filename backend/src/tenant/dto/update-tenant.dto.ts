import { PartialType } from '@nestjs/mapped-types';
import { CreateTenantDto } from './create-tenant.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { TenantStatus } from '../entities/tenant.entity';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @IsEnum(TenantStatus)
  @IsOptional()
  status?: TenantStatus;
}
