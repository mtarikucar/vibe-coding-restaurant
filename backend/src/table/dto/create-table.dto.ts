import { IsNumber, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { TableStatus } from '../entities/table.entity';

export class CreateTableDto {
  @IsNumber()
  @IsNotEmpty()
  number: number;

  @IsNumber()
  @IsOptional()
  capacity?: number;

  @IsEnum(TableStatus)
  @IsOptional()
  status?: TableStatus;
}
