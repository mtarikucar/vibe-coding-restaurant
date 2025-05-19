import { Test, TestingModule } from "@nestjs/testing";
import { PaymentService } from "../payment.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from "../entities/payment.entity";
import { OrderService } from "../../order/order.service";
import { TableService } from "../../table/table.service";
import { ConfigService } from "@nestjs/config";
import { Repository, DataSource } from "typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { OrderStatus } from "../../order/entities/order.entity";
import { TableStatus } from "../../table/entities/table.entity";

// Mock implementations
const mockPaymentRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
});

const mockOrderService = () => ({
  findOne: jest.fn(),
  updateStatus: jest.fn(),
});

const mockTableService = () => ({
  updateStatus: jest.fn(),
});

const mockConfigService = () => ({
  get: jest.fn((key) => {
    if (key === "STRIPE_SECRET_KEY") return "sk_test_123";
    if (key === "STRIPE_WEBHOOK_SECRET") return "whsec_123";
    if (key === "IYZICO_API_KEY") return "api_key_123";
    if (key === "IYZICO_SECRET_KEY") return "secret_key_123";
    return null;
  }),
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

describe("PaymentService", () => {
  let service: PaymentService;
  let paymentRepository: jest.Mocked<Repository<Payment>>;
  let orderService: jest.Mocked<OrderService>;
  let tableService: jest.Mocked<TableService>;
  let configService: jest.Mocked<ConfigService>;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Payment),
          useFactory: mockPaymentRepository,
        },
        { provide: OrderService, useFactory: mockOrderService },
        { provide: TableService, useFactory: mockTableService },
        { provide: ConfigService, useFactory: mockConfigService },
        { provide: DataSource, useFactory: mockDataSource },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    paymentRepository = module.get(getRepositoryToken(Payment)) as jest.Mocked<
      Repository<Payment>
    >;
    orderService = module.get(OrderService) as jest.Mocked<OrderService>;
    tableService = module.get(TableService) as jest.Mocked<TableService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
    dataSource = module.get(DataSource) as jest.Mocked<DataSource>;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new payment", async () => {
      const createPaymentDto = {
        orderId: "order-id",
        amount: 29.99,
        method: PaymentMethod.CASH,
        cashierId: "cashier-id",
      };

      const order = {
        id: "order-id",
        orderNumber: "ORD-123456",
        status: OrderStatus.SERVED,
        totalAmount: 29.99,
        tableId: "table-id",
      };

      const payment = {
        id: "payment-id",
        ...createPaymentDto,
        status: PaymentStatus.PENDING,
      };

      orderService.findOne.mockResolvedValue(order as any);
      paymentRepository.findOne.mockResolvedValue(null);
      paymentRepository.create.mockReturnValue(payment as Payment);
      paymentRepository.save.mockResolvedValue(payment as Payment);

      const result = await service.create(createPaymentDto);

      expect(orderService.findOne).toHaveBeenCalledWith("order-id");
      expect(paymentRepository.findOne).toHaveBeenCalled();
      expect(paymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: "order-id",
          amount: 29.99,
          method: PaymentMethod.CASH,
          status: PaymentStatus.PENDING,
        })
      );
      expect(paymentRepository.save).toHaveBeenCalled();
      expect(result).toEqual(payment);
    });

    it("should throw BadRequestException if payment already exists for order", async () => {
      const createPaymentDto = {
        orderId: "order-id",
        amount: 29.99,
        method: PaymentMethod.CASH,
        cashierId: "cashier-id",
      };

      const order = {
        id: "order-id",
        orderNumber: "ORD-123456",
        status: OrderStatus.SERVED,
        totalAmount: 29.99,
      };

      const existingPayment = {
        id: "payment-id",
        orderId: "order-id",
        status: PaymentStatus.PENDING,
      };

      orderService.findOne.mockResolvedValue(order as any);
      paymentRepository.findOne.mockResolvedValue(existingPayment as Payment);

      await expect(service.create(createPaymentDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it("should throw NotFoundException if order not found", async () => {
      const createPaymentDto = {
        orderId: "nonexistent-id",
        amount: 29.99,
        method: PaymentMethod.CASH,
        cashierId: "cashier-id",
      };

      orderService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.create(createPaymentDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("findOne", () => {
    it("should return a payment by id", async () => {
      const payment = {
        id: "payment-id",
        orderId: "order-id",
        amount: 29.99,
        method: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
      };

      paymentRepository.findOne.mockResolvedValue(payment as Payment);

      const result = await service.findOne("payment-id");

      expect(paymentRepository.findOne).toHaveBeenCalledWith({
        where: { id: "payment-id" },
        relations: ["order"],
      });
      expect(result).toEqual(payment);
    });

    it("should throw NotFoundException if payment not found", async () => {
      paymentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("updateStatus", () => {
    it("should update payment status to COMPLETED and update order and table status", async () => {
      const payment = {
        id: "payment-id",
        orderId: "order-id",
        amount: 29.99,
        method: PaymentMethod.CASH,
        status: PaymentStatus.PENDING,
      };

      const order = {
        id: "order-id",
        tableId: "table-id",
        status: OrderStatus.SERVED,
      };

      const updatedPayment = {
        ...payment,
        status: PaymentStatus.COMPLETED,
      };

      paymentRepository.findOne.mockResolvedValue(payment as Payment);
      orderService.findOne.mockResolvedValue(order as any);
      paymentRepository.save.mockResolvedValue(updatedPayment as Payment);

      const result = await service.updateStatus(
        "payment-id",
        PaymentStatus.COMPLETED
      );

      expect(paymentRepository.findOne).toHaveBeenCalled();
      expect(orderService.findOne).toHaveBeenCalledWith("order-id");
      expect(orderService.updateStatus).toHaveBeenCalledWith(
        "order-id",
        OrderStatus.COMPLETED
      );
      expect(tableService.updateStatus).toHaveBeenCalledWith(
        "table-id",
        TableStatus.AVAILABLE
      );
      expect(paymentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "payment-id",
          status: PaymentStatus.COMPLETED,
        })
      );
      expect(result).toEqual(updatedPayment);
    });

    it("should throw NotFoundException if payment not found", async () => {
      paymentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus("nonexistent-id", PaymentStatus.COMPLETED)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
