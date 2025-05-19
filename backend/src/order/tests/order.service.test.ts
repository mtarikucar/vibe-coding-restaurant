import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from '../order.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem, OrderItemStatus } from '../entities/order-item.entity';
import { TableService } from '../../table/table.service';
import { MenuService } from '../../menu/menu.service';
import { StockService } from '../../stock/stock.service';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TableStatus } from '../../table/entities/table.entity';
import { StockActionType } from '../../stock/entities/stock-history.entity';

// Mock implementations
const mockOrderRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
});

const mockOrderItemRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
});

const mockTableService = () => ({
  findOne: jest.fn(),
  updateStatus: jest.fn(),
});

const mockMenuService = () => ({
  findOneMenuItem: jest.fn(),
});

const mockStockService = () => ({
  decreaseStock: jest.fn(),
});

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    save: jest.fn(),
  },
};

const mockDataSource = () => ({
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
});

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let orderItemRepository: jest.Mocked<Repository<OrderItem>>;
  let tableService: jest.Mocked<TableService>;
  let menuService: jest.Mocked<MenuService>;
  let stockService: jest.Mocked<StockService>;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useFactory: mockOrderRepository },
        { provide: getRepositoryToken(OrderItem), useFactory: mockOrderItemRepository },
        { provide: TableService, useFactory: mockTableService },
        { provide: MenuService, useFactory: mockMenuService },
        { provide: StockService, useFactory: mockStockService },
        { provide: DataSource, useFactory: mockDataSource },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepository = module.get(getRepositoryToken(Order)) as jest.Mocked<Repository<Order>>;
    orderItemRepository = module.get(getRepositoryToken(OrderItem)) as jest.Mocked<Repository<OrderItem>>;
    tableService = module.get(TableService) as jest.Mocked<TableService>;
    menuService = module.get(MenuService) as jest.Mocked<MenuService>;
    stockService = module.get(StockService) as jest.Mocked<StockService>;
    dataSource = module.get(DataSource) as jest.Mocked<DataSource>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new order with items', async () => {
      const createOrderDto = {
        tableId: 'table-id',
        waiterId: 'waiter-id',
        notes: 'Test notes',
        items: [
          { menuItemId: 'item-1', quantity: 2, notes: 'No onions' },
          { menuItemId: 'item-2', quantity: 1 },
        ],
      };

      const table = {
        id: 'table-id',
        number: 1,
        status: TableStatus.AVAILABLE,
      };

      const menuItems = [
        { id: 'item-1', name: 'Item 1', price: 10.99 },
        { id: 'item-2', name: 'Item 2', price: 8.99 },
      ];

      const order = {
        id: 'order-id',
        orderNumber: 'ORD-123456',
        tableId: 'table-id',
        waiterId: 'waiter-id',
        notes: 'Test notes',
        status: OrderStatus.PENDING,
        totalAmount: 0,
      };

      const orderItems = [
        {
          id: 'order-item-1',
          orderId: 'order-id',
          menuItemId: 'item-1',
          quantity: 2,
          price: 10.99,
          notes: 'No onions',
          status: OrderItemStatus.PENDING,
        },
        {
          id: 'order-item-2',
          orderId: 'order-id',
          menuItemId: 'item-2',
          quantity: 1,
          price: 8.99,
          status: OrderItemStatus.PENDING,
        },
      ];

      const savedOrder = {
        ...order,
        totalAmount: 30.97, // (10.99 * 2) + 8.99
        items: orderItems,
      };

      tableService.findOne.mockResolvedValue(table as any);
      orderRepository.create.mockReturnValue(order as any);
      orderRepository.save.mockResolvedValue(order as any);
      
      menuService.findOneMenuItem.mockImplementation((id) => {
        const item = menuItems.find(item => item.id === id);
        return Promise.resolve(item as any);
      });
      
      orderItemRepository.create.mockImplementation((dto) => {
        const menuItem = menuItems.find(item => item.id === dto.menuItemId);
        return {
          ...dto,
          price: menuItem.price,
          status: OrderItemStatus.PENDING,
        } as any;
      });
      
      orderItemRepository.save.mockImplementation((item) => {
        return Promise.resolve({
          id: `order-item-${Math.random()}`,
          ...item,
        } as any);
      });

      // Mock findOne to return the complete order with items
      orderRepository.findOne.mockResolvedValue(savedOrder as any);

      const result = await service.create(createOrderDto);

      expect(tableService.findOne).toHaveBeenCalledWith('table-id');
      expect(orderRepository.create).toHaveBeenCalled();
      expect(orderRepository.save).toHaveBeenCalled();
      expect(menuService.findOneMenuItem).toHaveBeenCalledTimes(2);
      expect(orderItemRepository.create).toHaveBeenCalledTimes(2);
      expect(orderItemRepository.save).toHaveBeenCalledTimes(2);
      expect(tableService.updateStatus).toHaveBeenCalledWith('table-id', TableStatus.OCCUPIED);
      expect(result).toEqual(savedOrder);
    });

    it('should throw BadRequestException if table is not available', async () => {
      const createOrderDto = {
        tableId: 'table-id',
        waiterId: 'waiter-id',
        notes: 'Test notes',
        items: [
          { menuItemId: 'item-1', quantity: 2 },
        ],
      };

      const table = {
        id: 'table-id',
        number: 1,
        status: TableStatus.RESERVED,
      };

      tableService.findOne.mockResolvedValue(table as any);

      await expect(service.create(createOrderDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      const order = {
        id: 'order-id',
        orderNumber: 'ORD-123456',
        status: OrderStatus.PENDING,
        items: [],
      };

      orderRepository.findOne.mockResolvedValue(order as any);

      const result = await service.findOne('order-id');

      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'order-id' },
        relations: ['items', 'items.menuItem', 'table', 'waiter'],
      });
      expect(result).toEqual(order);
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const order = {
        id: 'order-id',
        status: OrderStatus.PENDING,
      };

      const updatedOrder = {
        ...order,
        status: OrderStatus.PREPARING,
      };

      orderRepository.findOne.mockResolvedValue(order as any);
      orderRepository.save.mockResolvedValue(updatedOrder as any);

      const result = await service.updateStatus('order-id', OrderStatus.PREPARING);

      expect(orderRepository.findOne).toHaveBeenCalled();
      expect(orderRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: 'order-id',
        status: OrderStatus.PREPARING,
      }));
      expect(result).toEqual(updatedOrder);
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.updateStatus('nonexistent-id', OrderStatus.PREPARING)).rejects.toThrow(NotFoundException);
    });
  });
});
