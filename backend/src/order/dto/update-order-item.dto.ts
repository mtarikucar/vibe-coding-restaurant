import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateOrderItemDto } from './create-order-item.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { OrderItemStatus } from '../entities/order-item.entity';

export class UpdateOrderItemDto extends PartialType(OmitType(CreateOrderItemDto, ['menuItemId'] as const)) {
  @IsEnum(OrderItemStatus)
  @IsOptional()
  status?: OrderItemStatus;
}
