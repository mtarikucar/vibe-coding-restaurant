import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Payment, PaymentMethod, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { OrderService } from '../order/order.service';
import { TableService } from '../table/table.service';
import { PaymentGatewayService } from './services/payment-gateway.service';
import { PaymentStateService } from './services/payment-state.service';
import { PaymentIdempotencyService } from './services/payment-idempotency.service';
import { OrderStatus } from '../order/entities/order.entity';
import { TableStatus } from '../table/entities/table.entity';

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepository: Repository<Payment>;
  let orderService: OrderService;
  let tableService: TableService;
  let paymentGatewayService: PaymentGatewayService;
  let dataSource: DataSource;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  const mockPaymentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockOrderService = {
    findOne: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockTableService = {
    updateStatus: jest.fn(),
  };

  const mockPaymentGatewayService = {
    createPaymentIntent: jest.fn(),
    processPayment: jest.fn(),
    verifyPayment: jest.fn(),
  };

  const mockPaymentStateService = {
    canTransition: jest.fn(() => true),
    recordTransition: jest.fn(),
    getTransitionHistory: jest.fn(),
  };

  const mockPaymentIdempotencyService = {
    generateIdempotencyKey: jest.fn(() => 'test-idempotency-key'),
    checkIdempotency: jest.fn(() => null),
    storeIdempotency: jest.fn(),
    generateUniqueTransactionId: jest.fn(() => 'CASH-123456'),
    recordPaymentCreation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
        {
          provide: TableService,
          useValue: mockTableService,
        },
        {
          provide: PaymentGatewayService,
          useValue: mockPaymentGatewayService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: PaymentStateService,
          useValue: mockPaymentStateService,
        },
        {
          provide: PaymentIdempotencyService,
          useValue: mockPaymentIdempotencyService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    paymentRepository = module.get<Repository<Payment>>(getRepositoryToken(Payment));
    orderService = module.get<OrderService>(OrderService);
    tableService = module.get<TableService>(TableService);
    paymentGatewayService = module.get<PaymentGatewayService>(PaymentGatewayService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockOrder = {
      id: 'order-id',
      orderNumber: 'ORD-001',
      totalAmount: 100.50,
      status: OrderStatus.SERVED,
      tableId: 'table-id',
      tenantId: 'tenant-id',
    };

    const createPaymentDto: CreatePaymentDto = {
      orderId: 'order-id',
      amount: 100.50,
      method: PaymentMethod.CASH,
      cashierId: 'cashier-id',
    };

    it('should create a cash payment successfully', async () => {
      const mockPayment = {
        id: 'payment-id',
        ...createPaymentDto,
        status: PaymentStatus.COMPLETED,
        transactionId: 'CASH-123456',
        tenantId: 'tenant-id',
      };

      mockOrderService.findOne.mockResolvedValue(mockOrder);
      mockPaymentRepository.findOne.mockResolvedValue(null);
      mockPaymentRepository.create.mockReturnValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue(mockPayment);
      mockQueryRunner.manager.save.mockResolvedValue(mockPayment);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockPayment as any);

      const result = await service.create(createPaymentDto);

      expect(mockOrderService.findOne).toHaveBeenCalledWith('order-id');
      expect(mockPaymentRepository.findOne).toHaveBeenCalledWith({
        where: { orderId: 'order-id' },
      });
      expect(mockPaymentRepository.create).toHaveBeenCalledWith({
        ...createPaymentDto,
        status: PaymentStatus.COMPLETED,
        transactionId: expect.stringMatching(/^CASH-\d{6}$/),
        tenantId: 'tenant-id',
      });
      expect(mockOrderService.updateStatus).toHaveBeenCalledWith('order-id', OrderStatus.COMPLETED);
      expect(mockTableService.updateStatus).toHaveBeenCalledWith('table-id', TableStatus.AVAILABLE);
      expect(result).toEqual(mockPayment);
    });

    it('should throw BadRequestException for invalid amount (string)', async () => {
      const invalidDto = {
        ...createPaymentDto,
        amount: 'invalid-amount' as any,
      };

      await expect(service.create(invalidDto)).rejects.toThrow();
    });

    it('should throw BadRequestException for negative amount', async () => {
      const invalidDto = {
        ...createPaymentDto,
        amount: -50,
      };

      mockOrderService.findOne.mockResolvedValue(mockOrder);

      await expect(service.create(invalidDto)).rejects.toThrow();
    });

    it('should throw BadRequestException for zero amount', async () => {
      const invalidDto = {
        ...createPaymentDto,
        amount: 0,
      };

      mockOrderService.findOne.mockResolvedValue(mockOrder);

      await expect(service.create(invalidDto)).rejects.toThrow();
    });

    it('should throw ConflictException if payment already exists', async () => {
      const existingPayment = { id: 'existing-payment-id' };

      mockOrderService.findOne.mockResolvedValue(mockOrder);
      mockPaymentRepository.findOne.mockResolvedValue(existingPayment);

      await expect(service.create(createPaymentDto)).rejects.toThrow(ConflictException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if order is not ready for payment', async () => {
      const notReadyOrder = {
        ...mockOrder,
        status: OrderStatus.PENDING,
      };

      mockOrderService.findOne.mockResolvedValue(notReadyOrder);
      mockPaymentRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createPaymentDto)).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should create pending payment for card method', async () => {
      const cardPaymentDto = {
        ...createPaymentDto,
        method: PaymentMethod.CREDIT_CARD,
      };

      const mockPayment = {
        id: 'payment-id',
        ...cardPaymentDto,
        status: PaymentStatus.PENDING,
        tenantId: 'tenant-id',
      };

      mockOrderService.findOne.mockResolvedValue(mockOrder);
      mockPaymentRepository.findOne.mockResolvedValue(null);
      mockPaymentRepository.create.mockReturnValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue(mockPayment);
      mockQueryRunner.manager.save.mockResolvedValue(mockPayment);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockPayment as any);

      const result = await service.create(cardPaymentDto);

      expect(mockPaymentRepository.create).toHaveBeenCalledWith({
        ...cardPaymentDto,
        status: PaymentStatus.PENDING,
        tenantId: 'tenant-id',
        transactionId: expect.any(String),
      });
      expect(result.status).toBe(PaymentStatus.PENDING);
    });
  });

  describe('processPayment', () => {
    const mockPayment = {
      id: 'payment-id',
      orderId: 'order-id',
      amount: 100.50,
      method: PaymentMethod.CREDIT_CARD,
      status: PaymentStatus.PENDING,
      tenantId: 'tenant-id',
    };

    const mockOrder = {
      id: 'order-id',
      orderNumber: 'ORD-001',
      totalAmount: 100.50,
      status: OrderStatus.SERVED,
      tableId: 'table-id',
      tenantId: 'tenant-id',
    };

    const processPaymentDto: ProcessPaymentDto = {
      orderId: 'order-id',
      method: PaymentMethod.CREDIT_CARD,
      paymentMethodId: 'pm_test_123',
      cashierId: 'cashier-id',
    };

    it('should process cash payment successfully', async () => {
      const cashProcessDto = {
        ...processPaymentDto,
        method: PaymentMethod.CASH,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockPayment as any);
      mockOrderService.findOne.mockResolvedValue(mockOrder);
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
        transactionId: 'CASH-123456',
      });

      const result = await service.processPayment('payment-id', cashProcessDto);

      expect(result.status).toBe(PaymentStatus.COMPLETED);
      expect(result.transactionId).toMatch(/^CASH-\d{6}$/);
      expect(mockOrderService.updateStatus).toHaveBeenCalledWith('order-id', OrderStatus.COMPLETED);
    });

    it('should throw ConflictException if payment is already completed', async () => {
      const completedPayment = {
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(completedPayment as any);

      await expect(service.processPayment('payment-id', processPaymentDto))
        .rejects.toThrow(ConflictException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should process card payment with payment gateway', async () => {
      const pendingPayment = {
        ...mockPayment,
        status: PaymentStatus.PENDING,
      };

      const processPaymentDtoWithIntent = {
        ...processPaymentDto,
        paymentIntentId: 'pi_123456',
      };

      const gatewayResponse = {
        success: true,
        transactionId: 'txn_123456',
        paymentIntentId: 'pi_123456',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(pendingPayment as any);
      mockOrderService.findOne.mockResolvedValue(mockOrder);
      mockPaymentGatewayService.processPayment.mockResolvedValue(gatewayResponse);
      mockPaymentRepository.save.mockResolvedValue({
        ...pendingPayment,
        status: PaymentStatus.COMPLETED,
        transactionId: 'txn_123456',
      });

      const result = await service.processPayment('payment-id', processPaymentDtoWithIntent);

      expect(mockPaymentGatewayService.processPayment).toHaveBeenCalled();
      expect(result.status).toBe(PaymentStatus.COMPLETED);
      expect(result.transactionId).toBe('txn_123456');
    });

    it('should handle payment gateway failure', async () => {
      const pendingPayment = {
        ...mockPayment,
        status: PaymentStatus.PENDING,
      };

      const processPaymentDtoWithIntent = {
        ...processPaymentDto,
        paymentIntentId: 'pi_123456',
      };

      const gatewayResponse = {
        success: false,
        error: 'Card declined',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(pendingPayment as any);
      mockOrderService.findOne.mockResolvedValue(mockOrder);
      mockPaymentGatewayService.processPayment.mockResolvedValue(gatewayResponse);

      await expect(service.processPayment('payment-id', processPaymentDtoWithIntent))
        .rejects.toThrow('Card declined');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should create payment intent for card payment without intent ID', async () => {
      const pendingPayment = {
        ...mockPayment,
        status: PaymentStatus.PENDING,
      };

      const gatewayResponse = {
        success: true,
        transactionId: 'pi_123456',
        paymentIntentId: 'pi_123456',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(pendingPayment as any);
      mockOrderService.findOne.mockResolvedValue(mockOrder);
      mockPaymentGatewayService.createPaymentIntent.mockResolvedValue(gatewayResponse);
      mockPaymentRepository.save.mockResolvedValue({
        ...pendingPayment,
        status: PaymentStatus.PENDING,
        paymentIntentId: 'pi_123456',
      });

      const result = await service.processPayment('payment-id', processPaymentDto);

      expect(mockPaymentGatewayService.createPaymentIntent).toHaveBeenCalled();
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(result.paymentIntentId).toBe('pi_123456');
    });
  });

  describe('findOne', () => {
    it('should find payment by id', async () => {
      const mockPayment = {
        id: 'payment-id',
        amount: 100.50,
        status: PaymentStatus.COMPLETED,
      };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);

      const result = await service.findOne('payment-id');

      expect(mockPaymentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'payment-id' },
        relations: [
          'order',
          'order.items',
          'order.items.menuItem',
          'order.table',
          'order.waiter',
        ],
      });
      expect(result).toEqual(mockPayment);
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update payment status', async () => {
      const mockPayment = {
        id: 'payment-id',
        orderId: 'order-id',
        status: PaymentStatus.PENDING,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockPayment as any);
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      });

      const result = await service.updateStatus('payment-id', PaymentStatus.COMPLETED);

      expect(result.status).toBe(PaymentStatus.COMPLETED);
      expect(mockPaymentRepository.save).toHaveBeenCalled();
    });

    it('should update order status when payment is refunded', async () => {
      const mockPayment = {
        id: 'payment-id',
        orderId: 'order-id',
        status: PaymentStatus.COMPLETED,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockPayment as any);
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.REFUNDED,
      });

      await service.updateStatus('payment-id', PaymentStatus.REFUNDED);

      expect(mockOrderService.updateStatus).toHaveBeenCalledWith('order-id', OrderStatus.CANCELLED);
    });
  });

  describe('findByOrder', () => {
    it('should find payment by order id', async () => {
      const mockPayment = {
        id: 'payment-id',
        orderId: 'order-id',
        amount: 100.50,
      };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);

      const result = await service.findByOrder('order-id');

      expect(mockPaymentRepository.findOne).toHaveBeenCalledWith({
        where: { orderId: 'order-id' },
        relations: [
          'order',
          'order.items',
          'order.items.menuItem',
          'order.table',
          'order.waiter',
        ],
      });
      expect(result).toEqual(mockPayment);
    });

    it('should throw NotFoundException if payment not found for order', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(null);

      await expect(service.findByOrder('non-existent-order-id'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
