import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderItemStatus } from '../entities/order-item.entity';

export class UpdateOrderItemStatusDto {
  @IsEnum(OrderItemStatus)
  @IsNotEmpty()
  status: OrderItemStatus;
}
