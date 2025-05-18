import { Injectable } from '@nestjs/common';
import { OrderService } from '../order/order.service';
import { OrderStatus } from '../order/entities/order.entity';
import { OrderItemStatus } from '../order/entities/order-item.entity';

@Injectable()
export class KitchenService {
  constructor(private readonly orderService: OrderService) {}

  async findActiveOrders() {
    // Get orders with status PENDING or PREPARING
    const activeOrders = await this.orderService.findByStatus(OrderStatus.PENDING);
    const preparingOrders = await this.orderService.findByStatus(OrderStatus.PREPARING);
    
    return [...activeOrders, ...preparingOrders];
  }

  async updateOrderItemStatus(orderId: string, itemId: string, status: OrderItemStatus) {
    // Update the order item status
    const updatedItem = await this.orderService.updateOrderItemStatus(orderId, itemId, status);
    
    // Get the updated order
    const order = await this.orderService.findOne(orderId);
    
    // Check if all items are in the same status
    const allItemsStatus = this.checkAllItemsStatus(order.items);
    
    // Update order status if needed
    if (allItemsStatus) {
      await this.orderService.updateStatus(orderId, this.mapItemStatusToOrderStatus(allItemsStatus));
    }
    
    return updatedItem;
  }
  
  private checkAllItemsStatus(items: any[]): OrderItemStatus | null {
    if (items.length === 0) return null;
    
    const firstStatus = items[0].status;
    const allSameStatus = items.every(item => item.status === firstStatus);
    
    return allSameStatus ? firstStatus : null;
  }
  
  private mapItemStatusToOrderStatus(itemStatus: OrderItemStatus): OrderStatus {
    switch (itemStatus) {
      case OrderItemStatus.PENDING:
        return OrderStatus.PENDING;
      case OrderItemStatus.PREPARING:
        return OrderStatus.PREPARING;
      case OrderItemStatus.READY:
        return OrderStatus.READY;
      case OrderItemStatus.SERVED:
        return OrderStatus.SERVED;
      case OrderItemStatus.CANCELLED:
        return OrderStatus.CANCELLED;
      default:
        return OrderStatus.PENDING;
    }
  }
}
