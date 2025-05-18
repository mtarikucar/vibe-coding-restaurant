import { PartialType } from '@nestjs/mapped-types';
import { CreateTableDto } from './create-table.dto';
import { IsNumber, IsOptional, IsEnum } from 'class-validator';
import { TableStatus } from '../entities/table.entity';

export class UpdateTableDto extends PartialType(CreateTableDto) {
  @IsNumber()
  @IsOptional()
  number?: number;

  @IsNumber()
  @IsOptional()
  capacity?: number;

  @IsEnum(TableStatus)
  @IsOptional()
  status?: TableStatus;
}
