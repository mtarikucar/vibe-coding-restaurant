import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseOrder, PurchaseOrderStatus } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { Stock } from './entities/stock.entity';
import { StockHistory, StockActionType } from './entities/stock-history.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { SupplierService } from './supplier.service';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly purchaseOrderItemRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    @InjectRepository(StockHistory)
    private readonly stockHistoryRepository: Repository<StockHistory>,
    private readonly supplierService: SupplierService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createPurchaseOrderDto: CreatePurchaseOrderDto & { tenantId?: string }): Promise<PurchaseOrder> {
    // Check if supplier exists
    await this.supplierService.findOne(createPurchaseOrderDto.supplierId, createPurchaseOrderDto.tenantId);

    // Generate order number if not provided
    if (!createPurchaseOrderDto.orderNumber) {
      createPurchaseOrderDto.orderNumber = `PO-${Date.now()}`;
    }

    // Set default status if not provided
    if (!createPurchaseOrderDto.status) {
      createPurchaseOrderDto.status = PurchaseOrderStatus.DRAFT;
    }

    // Calculate totals if not provided
    let subtotal = 0;
    for (const item of createPurchaseOrderDto.items) {
      // Check if stock exists
      const stock = await this.stockRepository.findOne({
        where: { id: item.stockId, tenantId: createPurchaseOrderDto.tenantId },
      });
      
      if (!stock) {
        throw new NotFoundException(`Stock with ID ${item.stockId} not found`);
      }

      // Calculate item total
      const itemTotal = item.quantity * item.unitPrice;
      subtotal += itemTotal;
      
      // Set item total if not provided
      if (!item.totalPrice) {
        item.totalPrice = itemTotal;
      }
    }

    // Set subtotal if not provided
    if (!createPurchaseOrderDto.subtotal) {
      createPurchaseOrderDto.subtotal = subtotal;
    }

    // Set tax amount if not provided
    if (!createPurchaseOrderDto.taxAmount) {
      createPurchaseOrderDto.taxAmount = 0;
    }

    // Set shipping amount if not provided
    if (!createPurchaseOrderDto.shippingAmount) {
      createPurchaseOrderDto.shippingAmount = 0;
    }

    // Set discount amount if not provided
    if (!createPurchaseOrderDto.discountAmount) {
      createPurchaseOrderDto.discountAmount = 0;
    }

    // Calculate total amount if not provided
    if (!createPurchaseOrderDto.totalAmount) {
      createPurchaseOrderDto.totalAmount =
        createPurchaseOrderDto.subtotal +
        createPurchaseOrderDto.taxAmount +
        createPurchaseOrderDto.shippingAmount -
        createPurchaseOrderDto.discountAmount;
    }

    // Create purchase order
    const purchaseOrder = this.purchaseOrderRepository.create(createPurchaseOrderDto);
    
    // Save purchase order
    return this.purchaseOrderRepository.save(purchaseOrder);
  }

  async findAll(tenantId: string, status?: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
    const query: any = {
      tenantId,
      isDeleted: false,
    };

    if (status) {
      query.status = status;
    }

    return this.purchaseOrderRepository.find({
      where: query,
      relations: ['supplier', 'items', 'items.stock', 'createdBy', 'lastUpdatedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderRepository.findOne({
      where: { id, tenantId, isDeleted: false },
      relations: ['supplier', 'items', 'items.stock', 'createdBy', 'lastUpdatedBy'],
    });

    if (!purchaseOrder) {
      throw new NotFoundException(`Purchase order with ID ${id} not found`);
    }

    return purchaseOrder;
  }

  async update(
    id: string,
    updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    tenantId: string,
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.findOne(id, tenantId);

    // Don't allow updating completed or canceled orders
    if (
      purchaseOrder.status === PurchaseOrderStatus.RECEIVED ||
      purchaseOrder.status === PurchaseOrderStatus.CANCELED
    ) {
      throw new BadRequestException(`Cannot update a ${purchaseOrder.status} purchase order`);
    }

    // Update purchase order
    Object.assign(purchaseOrder, updatePurchaseOrderDto);
    
    // Save purchase order
    return this.purchaseOrderRepository.save(purchaseOrder);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const purchaseOrder = await this.findOne(id, tenantId);
    
    // Don't allow deleting orders that are not in DRAFT or CANCELED status
    if (
      purchaseOrder.status !== PurchaseOrderStatus.DRAFT &&
      purchaseOrder.status !== PurchaseOrderStatus.CANCELED
    ) {
      throw new BadRequestException(`Cannot delete a ${purchaseOrder.status} purchase order`);
    }
    
    // Soft delete
    purchaseOrder.isDeleted = true;
    await this.purchaseOrderRepository.save(purchaseOrder);
  }

  async receiveOrder(
    id: string,
    items: { id: string; receivedQuantity: number }[],
    userId: string,
    tenantId: string,
  ): Promise<PurchaseOrder> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const purchaseOrder = await this.findOne(id, tenantId);

      // Don't allow receiving canceled orders
      if (purchaseOrder.status === PurchaseOrderStatus.CANCELED) {
        throw new BadRequestException('Cannot receive a canceled purchase order');
      }

      // Don't allow receiving already received orders
      if (purchaseOrder.status === PurchaseOrderStatus.RECEIVED) {
        throw new BadRequestException('Purchase order has already been fully received');
      }

      let allItemsReceived = true;
      let anyItemReceived = false;

      // Update received quantities and increase stock
      for (const item of items) {
        const orderItem = purchaseOrder.items.find(i => i.id === item.id);
        
        if (!orderItem) {
          throw new NotFoundException(`Order item with ID ${item.id} not found in this purchase order`);
        }

        // Validate received quantity
        if (item.receivedQuantity < 0) {
          throw new BadRequestException('Received quantity cannot be negative');
        }

        if (item.receivedQuantity > orderItem.quantity - orderItem.receivedQuantity) {
          throw new BadRequestException('Received quantity cannot exceed remaining quantity');
        }

        if (item.receivedQuantity > 0) {
          anyItemReceived = true;
          
          // Update received quantity
          orderItem.receivedQuantity += item.receivedQuantity;
          await this.purchaseOrderItemRepository.save(orderItem);

          // Increase stock
          const stock = await this.stockRepository.findOne({
            where: { id: orderItem.stockId, tenantId },
          });

          if (stock) {
            const previousQuantity = Number(stock.quantity);
            const newQuantity = previousQuantity + item.receivedQuantity;
            
            // Update stock
            stock.quantity = newQuantity;
            stock.isLowStock = newQuantity <= stock.minQuantity;
            stock.isCriticalStock = newQuantity <= stock.criticalQuantity;
            stock.lastOrderDate = new Date();
            await this.stockRepository.save(stock);

            // Create stock history
            await this.stockHistoryRepository.save({
              stockId: stock.id,
              actionType: StockActionType.PURCHASE,
              quantity: item.receivedQuantity,
              previousQuantity,
              newQuantity,
              userId,
              notes: `Purchase order ${purchaseOrder.orderNumber}`,
              tenantId,
            });
          }
        }

        // Check if all items are fully received
        if (orderItem.receivedQuantity < orderItem.quantity) {
          allItemsReceived = false;
        }
      }

      // Update purchase order status
      if (anyItemReceived) {
        if (allItemsReceived) {
          purchaseOrder.status = PurchaseOrderStatus.RECEIVED;
          purchaseOrder.deliveryDate = new Date();
        } else {
          purchaseOrder.status = PurchaseOrderStatus.PARTIALLY_RECEIVED;
        }
        
        await this.purchaseOrderRepository.save(purchaseOrder);
      }

      await queryRunner.commitTransaction();
      
      return this.findOne(id, tenantId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findBySupplier(supplierId: string, tenantId: string): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.find({
      where: { supplierId, tenantId, isDeleted: false },
      relations: ['supplier', 'items', 'items.stock'],
      order: { createdAt: 'DESC' },
    });
  }
}
