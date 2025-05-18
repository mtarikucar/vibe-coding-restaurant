import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem, OrderItemStatus } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { TableService } from '../table/table.service';
import { MenuService } from '../menu/menu.service';
import { StockService } from '../stock/stock.service';
import { TableStatus } from '../table/entities/table.entity';
import { StockActionType } from '../stock/entities/stock-history.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly tableService: TableService,
    private readonly menuService: MenuService,
    private readonly stockService: StockService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if table exists and is available
      const table = await this.tableService.findOne(createOrderDto.tableId);
      if (table.status !== TableStatus.AVAILABLE && table.status !== TableStatus.OCCUPIED) {
        throw new BadRequestException(`Table ${table.number} is not available`);
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

      // Create order
      const order = this.orderRepository.create({
        orderNumber,
        tableId: createOrderDto.tableId,
        waiterId: createOrderDto.waiterId,
        notes: createOrderDto.notes,
        status: OrderStatus.PENDING,
        totalAmount: 0,
      });

      // Save order
      const savedOrder = await this.orderRepository.save(order);

      // Create order items
      let totalAmount = 0;
      const orderItems: OrderItem[] = [];

      for (const item of createOrderDto.items) {
        // Check if menu item exists
        const menuItem = await this.menuService.findOneMenuItem(item.menuItemId);
        if (!menuItem.isAvailable) {
          throw new BadRequestException(`Menu item ${menuItem.name} is not available`);
        }

        // Create order item
        const orderItem = this.orderItemRepository.create({
          orderId: savedOrder.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: menuItem.price,
          notes: item.notes,
          status: OrderItemStatus.PENDING,
        });

        // Save order item
        const savedOrderItem = await this.orderItemRepository.save(orderItem);
        orderItems.push(savedOrderItem);

        // Update total amount
        totalAmount += menuItem.price * item.quantity;

        // Update stock
        await this.stockService.decreaseStock(
          item.menuItemId,
          item.quantity,
          savedOrder.id,
          createOrderDto.waiterId,
          StockActionType.DECREASE,
        );
      }

      // Update order total amount
      savedOrder.totalAmount = totalAmount;
      await this.orderRepository.save(savedOrder);

      // Update table status to occupied
      await this.tableService.updateStatus(table.id, TableStatus.OCCUPIED);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Return order with items
      return this.findOne(savedOrder.id);
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['items', 'items.menuItem', 'table', 'waiter'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.menuItem', 'table', 'waiter'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update order status if provided
      if (updateOrderDto.status) {
        order.status = updateOrderDto.status;
      }

      // Update order notes if provided
      if (updateOrderDto.notes !== undefined) {
        order.notes = updateOrderDto.notes;
      }

      // Update order items if provided
      if (updateOrderDto.items) {
        // Remove existing items
        await this.orderItemRepository.remove(order.items);

        // Create new items
        let totalAmount = 0;
        const orderItems: OrderItem[] = [];

        for (const item of updateOrderDto.items) {
          // Check if menu item exists
          const menuItem = await this.menuService.findOneMenuItem(item.menuItemId);
          if (!menuItem.isAvailable) {
            throw new BadRequestException(`Menu item ${menuItem.name} is not available`);
          }

          // Create order item
          const orderItem = this.orderItemRepository.create({
            orderId: order.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: menuItem.price,
            notes: item.notes,
            status: OrderItemStatus.PENDING,
          });

          // Save order item
          const savedOrderItem = await this.orderItemRepository.save(orderItem);
          orderItems.push(savedOrderItem);

          // Update total amount
          totalAmount += menuItem.price * item.quantity;

          // Update stock
          await this.stockService.decreaseStock(
            item.menuItemId,
            item.quantity,
            order.id,
            order.waiterId,
            StockActionType.DECREASE,
          );
        }

        // Update order total amount
        order.totalAmount = totalAmount;
      }

      // Save order
      await this.orderRepository.save(order);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Return updated order
      return this.findOne(order.id);
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);

    // Check if order can be deleted
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CANCELLED) {
      throw new BadRequestException(`Cannot delete order with status ${order.status}`);
    }

    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Remove order items
      await this.orderItemRepository.remove(order.items);

      // Remove order
      await this.orderRepository.remove(order);

      // Update table status if no other active orders
      const activeOrders = await this.orderRepository.find({
        where: { tableId: order.tableId, status: OrderStatus.PENDING },
      });

      if (activeOrders.length === 0) {
        await this.tableService.updateStatus(order.tableId, TableStatus.AVAILABLE);
      }

      // Commit transaction
      await queryRunner.commitTransaction();
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    order.status = status;

    // If order is completed, update table status
    if (status === OrderStatus.COMPLETED) {
      await this.tableService.updateStatus(order.tableId, TableStatus.AVAILABLE);
    }

    return this.orderRepository.save(order);
  }

  async updateOrderItemStatus(orderId: string, itemId: string, status: OrderItemStatus): Promise<OrderItem> {
    const order = await this.findOne(orderId);
    const orderItem = order.items.find(item => item.id === itemId);

    if (!orderItem) {
      throw new NotFoundException(`Order item with ID ${itemId} not found in order ${orderId}`);
    }

    orderItem.status = status;
    return this.orderItemRepository.save(orderItem);
  }

  async findByStatus(status: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { status: status as OrderStatus },
      relations: ['items', 'items.menuItem', 'table', 'waiter'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByTable(tableId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { tableId },
      relations: ['items', 'items.menuItem', 'waiter'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByWaiter(waiterId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { waiterId },
      relations: ['items', 'items.menuItem', 'table'],
      order: { createdAt: 'DESC' },
    });
  }
}
