import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { PaymentMethod, PaymentStatus } from './entities/payment.entity';

describe('PaymentController', () => {
  let controller: PaymentController;
  let paymentService: PaymentService;

  const mockPaymentService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    processPayment: jest.fn(),
    updateStatus: jest.fn(),
    findByOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    paymentService = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createPaymentDto: CreatePaymentDto = {
      orderId: '123e4567-e89b-12d3-a456-426614174000',
      amount: 100.50,
      method: PaymentMethod.CASH,
      cashierId: '123e4567-e89b-12d3-a456-426614174001',
    };

    it('should create a payment successfully', async () => {
      const mockPayment = {
        id: 'payment-id',
        ...createPaymentDto,
        status: PaymentStatus.COMPLETED,
      };

      mockPaymentService.create.mockResolvedValue(mockPayment);

      const mockReq = { user: { id: 'test-user-id' } } as any;
      const result = await controller.create(createPaymentDto, mockReq);

      expect(mockPaymentService.create).toHaveBeenCalledWith(createPaymentDto, 'test-user-id');
      expect(result).toEqual(mockPayment);
    });

    it('should handle validation errors for invalid amount', async () => {
      const invalidDto = {
        ...createPaymentDto,
        amount: 'invalid-amount' as any,
      };

      mockPaymentService.create.mockRejectedValue(
        new BadRequestException('amount must be a number conforming to the specified constraints')
      );

      const mockReq = { user: { id: 'test-user-id' } } as any;
      await expect(controller.create(invalidDto, mockReq)).rejects.toThrow(BadRequestException);
    });

    it('should handle validation errors for negative amount', async () => {
      const invalidDto = {
        ...createPaymentDto,
        amount: -50,
      };

      mockPaymentService.create.mockRejectedValue(
        new BadRequestException('amount must be a positive number')
      );

      const mockReq = { user: { id: 'test-user-id' } } as any;
      await expect(controller.create(invalidDto, mockReq)).rejects.toThrow(BadRequestException);
    });

    it('should handle validation errors for zero amount', async () => {
      const invalidDto = {
        ...createPaymentDto,
        amount: 0,
      };

      mockPaymentService.create.mockRejectedValue(
        new BadRequestException('amount must be greater than 0')
      );

      const mockReq = { user: { id: 'test-user-id' } } as any;
      await expect(controller.create(invalidDto, mockReq)).rejects.toThrow(BadRequestException);
    });

    it('should handle validation errors for invalid UUID', async () => {
      const invalidDto = {
        ...createPaymentDto,
        orderId: 'invalid-uuid',
      };

      mockPaymentService.create.mockRejectedValue(
        new BadRequestException('orderId must be a UUID')
      );

      const mockReq = { user: { id: 'test-user-id' } } as any;
      await expect(controller.create(invalidDto, mockReq)).rejects.toThrow(BadRequestException);
    });

    it('should handle validation errors for invalid payment method', async () => {
      const invalidDto = {
        ...createPaymentDto,
        method: 'invalid-method' as any,
      };

      mockPaymentService.create.mockRejectedValue(
        new BadRequestException('method must be a valid enum value')
      );

      const mockReq = { user: { id: 'test-user-id' } } as any;
      await expect(controller.create(invalidDto, mockReq)).rejects.toThrow(BadRequestException);
    });

    it('should handle conflict when payment already exists', async () => {
      mockPaymentService.create.mockRejectedValue(
        new ConflictException('Payment for order ORD-001 already exists')
      );

      const mockReq = { user: { id: 'test-user-id' } } as any;
      await expect(controller.create(createPaymentDto, mockReq)).rejects.toThrow(ConflictException);
    });

    it('should handle order not ready for payment', async () => {
      mockPaymentService.create.mockRejectedValue(
        new BadRequestException('Order ORD-001 is not ready for payment')
      );

      const mockReq = { user: { id: 'test-user-id' } } as any;
      await expect(controller.create(createPaymentDto, mockReq)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all payments', async () => {
      const mockPayments = [
        { id: 'payment-1', amount: 100.50, status: PaymentStatus.COMPLETED },
        { id: 'payment-2', amount: 75.25, status: PaymentStatus.PENDING },
      ];

      const mockRequest = { user: { tenantId: 'tenant-id' } } as any;

      mockPaymentService.findAll.mockResolvedValue(mockPayments);

      const result = await controller.findAll(mockRequest);

      expect(mockPaymentService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockPayments);
    });
  });

  describe('findOne', () => {
    it('should return a payment by id', async () => {
      const mockPayment = {
        id: 'payment-id',
        amount: 100.50,
        status: PaymentStatus.COMPLETED,
      };

      const mockRequest = { tenantId: 'tenant-id' } as any;

      mockPaymentService.findOne.mockResolvedValue(mockPayment);

      const result = await controller.findOne('payment-id', mockRequest);

      expect(mockPaymentService.findOne).toHaveBeenCalledWith('payment-id', 'tenant-id');
      expect(result).toEqual(mockPayment);
    });

    it('should handle payment not found', async () => {
      const mockRequest = { tenantId: 'tenant-id' } as any;

      mockPaymentService.findOne.mockRejectedValue(
        new NotFoundException('Payment with ID payment-id not found')
      );

      await expect(controller.findOne('payment-id', mockRequest)).rejects.toThrow(NotFoundException);
    });
  });

  describe('processPayment', () => {
    const processPaymentDto: ProcessPaymentDto = {
      orderId: '123e4567-e89b-12d3-a456-426614174000',
      method: PaymentMethod.CREDIT_CARD,
      paymentMethodId: 'pm_test_123',
      cashierId: 'cashier-id',
    };

    it('should process payment successfully', async () => {
      const mockPayment = {
        id: 'payment-id',
        status: PaymentStatus.COMPLETED,
        transactionId: 'txn_123456',
      };

      mockPaymentService.processPayment.mockResolvedValue(mockPayment);

      const result = await controller.processPayment('payment-id', processPaymentDto);

      expect(mockPaymentService.processPayment).toHaveBeenCalledWith('payment-id', processPaymentDto);
      expect(result).toEqual(mockPayment);
    });

    it('should handle payment already completed', async () => {
      mockPaymentService.processPayment.mockRejectedValue(
        new ConflictException('Payment payment-id is already completed')
      );

      await expect(controller.processPayment('payment-id', processPaymentDto))
        .rejects.toThrow(ConflictException);
    });

    it('should handle payment processing failure', async () => {
      mockPaymentService.processPayment.mockRejectedValue(
        new BadRequestException('Payment processing failed')
      );

      await expect(controller.processPayment('payment-id', processPaymentDto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    const updateStatusDto: UpdatePaymentStatusDto = {
      status: PaymentStatus.REFUNDED,
    };

    it('should update payment status successfully', async () => {
      const mockPayment = {
        id: 'payment-id',
        status: PaymentStatus.REFUNDED,
      };

      mockPaymentService.updateStatus.mockResolvedValue(mockPayment);

      const result = await controller.updateStatus('payment-id', updateStatusDto);

      expect(mockPaymentService.updateStatus).toHaveBeenCalledWith('payment-id', PaymentStatus.REFUNDED);
      expect(result).toEqual(mockPayment);
    });

    it('should handle payment not found for status update', async () => {
      mockPaymentService.updateStatus.mockRejectedValue(
        new NotFoundException('Payment with ID payment-id not found')
      );

      await expect(controller.updateStatus('payment-id', updateStatusDto))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOrder', () => {
    it('should return payment by order id', async () => {
      const mockPayment = {
        id: 'payment-id',
        orderId: 'order-id',
        amount: 100.50,
      };

      mockPaymentService.findByOrder.mockResolvedValue(mockPayment);

      const result = await controller.findByOrder('order-id');

      expect(mockPaymentService.findByOrder).toHaveBeenCalledWith('order-id');
      expect(result).toEqual(mockPayment);
    });

    it('should handle payment not found for order', async () => {
      mockPaymentService.findByOrder.mockRejectedValue(
        new NotFoundException('Payment for order with ID order-id not found')
      );

      await expect(controller.findByOrder('order-id')).rejects.toThrow(NotFoundException);
    });
  });
});
