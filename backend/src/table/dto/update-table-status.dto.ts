import { IsEnum, IsNotEmpty } from 'class-validator';
import { TableStatus } from '../entities/table.entity';

export class UpdateTableStatusDto {
  @IsEnum(TableStatus)
  @IsNotEmpty()
  status: TableStatus;
}
