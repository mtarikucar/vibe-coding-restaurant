import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsEnum, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';

export class UpdateOrderDto extends PartialType(OmitType(CreateOrderDto, ['tableId', 'waiterId'] as const)) {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];
}
