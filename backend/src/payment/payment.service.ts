import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
} from "./entities/payment.entity";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { OrderService } from "../order/order.service";
import { OrderStatus } from "../order/entities/order.entity";
import { TableService } from "../table/table.service";
import { TableStatus } from "../table/entities/table.entity";
import { PaymentGatewayService } from "./services/payment-gateway.service";
import { PaymentStateService } from "./services/payment-state.service";
import { PaymentIdempotencyService } from "./services/payment-idempotency.service";

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly orderService: OrderService,
    private readonly tableService: TableService,
    private readonly dataSource: DataSource,
    private readonly paymentGatewayService: PaymentGatewayService,
    private readonly paymentStateService: PaymentStateService,
    private readonly idempotencyService: PaymentIdempotencyService,
  ) {}

  async create(createPaymentDto: CreatePaymentDto, userId?: string): Promise<Payment> {
    this.logger.log(`Creating payment for order ${createPaymentDto.orderId} by user ${userId}`);

    // Generate idempotency key
    const idempotencyKey = this.idempotencyService.generateIdempotencyKey(
      createPaymentDto.orderId,
      createPaymentDto.amount,
      createPaymentDto.method,
      userId || 'system'
    );

    // Check for duplicate requests
    const existingPayment = await this.idempotencyService.checkIdempotency(
      idempotencyKey,
      createPaymentDto.orderId,
      createPaymentDto.amount,
      createPaymentDto.method,
    );

    if (existingPayment) {
      this.logger.log(`Returning existing payment due to idempotency: ${existingPayment.id}`);
      return existingPayment;
    }

    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if order exists
      const order = await this.orderService.findOne(createPaymentDto.orderId);

      // Check if order is already paid (with different payment details)
      const orderPayment = await this.paymentRepository.findOne({
        where: { orderId: order.id },
      });

      if (orderPayment) {
        throw new ConflictException({
          message: `Payment for order ${order.orderNumber} already exists`,
          orderNumber: order.orderNumber,
          paymentId: orderPayment.id,
          paymentStatus: orderPayment.status,
          paymentAmount: orderPayment.amount,
          paymentMethod: orderPayment.method,
          createdAt: orderPayment.createdAt,
          suggestion: `Use GET /api/payments/order/${order.orderNumber} to view the existing payment`,
        });
      }

      // Check if order is ready for payment
      if (
        order.status !== OrderStatus.SERVED &&
        order.status !== OrderStatus.COMPLETED
      ) {
        throw new BadRequestException(
          `Order ${order.orderNumber} is not ready for payment`
        );
      }

      // Generate unique transaction ID
      const transactionId = await this.idempotencyService.generateUniqueTransactionId(
        createPaymentDto.method
      );

      // For cash payments, use the simple flow
      if (createPaymentDto.method === PaymentMethod.CASH) {
        // Create payment
        const payment = this.paymentRepository.create({
          ...createPaymentDto,
          status: PaymentStatus.COMPLETED,
          transactionId,
          tenantId: order.tenantId, // Add tenant isolation
        });

        // Save payment
        const savedPayment = await queryRunner.manager.save(payment);

        // Record state transition
        await this.paymentStateService.recordTransition(
          savedPayment,
          PaymentStatus.PENDING,
          PaymentStatus.COMPLETED,
          'Cash payment completed immediately',
          userId,
          { method: 'CASH', orderId: order.id }
        );

        // Update order status
        await queryRunner.manager.save(
          await this.orderService.updateStatus(order.id, OrderStatus.COMPLETED)
        );

        // Update table status
        await queryRunner.manager.save(
          await this.tableService.updateStatus(order.tableId, TableStatus.AVAILABLE)
        );

        // Record idempotency
        await this.idempotencyService.recordPaymentCreation(idempotencyKey, savedPayment);

        // Commit transaction
        await queryRunner.commitTransaction();

        this.logger.log(`Cash payment completed successfully: ${savedPayment.id}`);
        return this.findOne(savedPayment.id);
      } else {
        // For card or online payments, create a payment intent
        const payment = this.paymentRepository.create({
          ...createPaymentDto,
          status: PaymentStatus.PENDING,
          transactionId,
          tenantId: order.tenantId, // Add tenant isolation
        });

        // Save payment to get an ID
        const savedPayment = await queryRunner.manager.save(payment);

        // Record state transition
        await this.paymentStateService.recordTransition(
          savedPayment,
          PaymentStatus.PENDING,
          PaymentStatus.PENDING,
          'Payment created and pending gateway processing',
          userId,
          { method: createPaymentDto.method, orderId: order.id }
        );

        // Commit transaction - we'll update the payment status later
        await queryRunner.commitTransaction();

        // Return payment with order
        return this.findOne(savedPayment.id);
      }
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  async processPayment(id: string, processPaymentDto: any): Promise<Payment> {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get the payment
      const payment = await this.findOne(id);

      // Check if payment is already completed
      if (payment.status === PaymentStatus.COMPLETED) {
        throw new ConflictException(`Payment ${id} is already completed`);
      }

      // Get the order
      const order = await this.orderService.findOne(payment.orderId);

      // Process payment based on method
      if (processPaymentDto.method === PaymentMethod.CASH) {
        // For cash payments, simply mark as completed
        payment.status = PaymentStatus.COMPLETED;
        payment.transactionId = `CASH-${Date.now().toString().slice(-6)}`;
        payment.cashierId = processPaymentDto.cashierId;
      } else {
        // For card or online payments, use payment gateway
        let gatewayResponse;

        // If we have a payment intent ID, process the payment
        if (processPaymentDto.paymentIntentId) {
          gatewayResponse = await this.paymentGatewayService.processPayment(
            processPaymentDto.paymentIntentId,
            processPaymentDto.paymentMethodId
          );
        } else {
          // Create a payment intent
          const amount = Number(order.totalAmount) * 100; // Convert to cents
          gatewayResponse =
            await this.paymentGatewayService.createPaymentIntent(
              amount,
              "usd",
              {
                orderId: order.id,
                orderNumber: order.orderNumber,
              }
            );

          // If we just created a payment intent, return it without completing the payment
          if (gatewayResponse.success) {
            payment.paymentIntentId = gatewayResponse.transactionId;
            payment.status = PaymentStatus.PENDING;
            await this.paymentRepository.save(payment);

            // Commit transaction
            await queryRunner.commitTransaction();

            return {
              ...payment,
              paymentDetails: {
                ...payment.paymentDetails,
                paymentIntentId: gatewayResponse.transactionId,
                requiresAction: true,
              },
            };
          }
        }

        // Handle gateway response
        if (gatewayResponse.success) {
          payment.status = PaymentStatus.COMPLETED;
          payment.transactionId = gatewayResponse.transactionId;
          payment.paymentDetails = {
            ...payment.paymentDetails,
            gatewayResponse,
          };
        } else {
          payment.status = PaymentStatus.FAILED;
          payment.paymentDetails = {
            ...payment.paymentDetails,
            error: gatewayResponse.error,
            gatewayResponse,
          };

          // Save the failed payment
          await this.paymentRepository.save(payment);

          // Commit transaction
          await queryRunner.commitTransaction();

          throw new BadRequestException(
            gatewayResponse.error || "Payment processing failed"
          );
        }
      }

      // Save the payment
      await this.paymentRepository.save(payment);

      // If payment is successful, update order and table
      if (payment.status === PaymentStatus.COMPLETED) {
        // Update order status
        await this.orderService.updateStatus(order.id, OrderStatus.COMPLETED);

        // Update table status
        await this.tableService.updateStatus(
          order.tableId,
          TableStatus.AVAILABLE
        );
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      // Return payment with order
      return this.findOne(payment.id);
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  async findAll(tenantId?: string): Promise<Payment[]> {
    const whereCondition = tenantId ? { tenantId } : {};

    return this.paymentRepository.find({
      where: whereCondition,
      relations: ["order", "order.table", "order.waiter"],
      order: { createdAt: "DESC" },
    });
  }

  async findByOrderId(orderId: string, tenantId?: string): Promise<Payment | null> {
    const whereCondition: any = { orderId };
    if (tenantId) {
      whereCondition.tenantId = tenantId;
    }

    return this.paymentRepository.findOne({
      where: whereCondition,
      relations: ["order", "order.table", "order.waiter"],
    });
  }

  async findByOrderNumber(orderNumber: string, tenantId?: string): Promise<Payment | null> {
    const whereCondition: any = { 
      order: { orderNumber } 
    };
    if (tenantId) {
      whereCondition.tenantId = tenantId;
    }

    return this.paymentRepository.findOne({
      where: whereCondition,
      relations: ["order", "order.table", "order.waiter"],
    });
  }

  async findOne(id: string, tenantId?: string): Promise<Payment> {
    const whereCondition: any = { id };
    if (tenantId) {
      whereCondition.tenantId = tenantId;
    }

    const payment = await this.paymentRepository.findOne({
      where: whereCondition,
      relations: [
        "order",
        "order.items",
        "order.items.menuItem",
        "order.table",
        "order.waiter",
      ],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<Payment> {
    const payment = await this.findOne(id);
    payment.status = status;

    // If payment is refunded, update order status
    if (status === PaymentStatus.REFUNDED) {
      await this.orderService.updateStatus(
        payment.orderId,
        OrderStatus.CANCELLED
      );
    }

    return this.paymentRepository.save(payment);
  }

  async findByOrder(orderId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { orderId },
      relations: [
        "order",
        "order.items",
        "order.items.menuItem",
        "order.table",
        "order.waiter",
      ],
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment for order with ID ${orderId} not found`
      );
    }

    return payment;
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    const payment = await this.paymentRepository.findOne({
      where: { transactionId },
      relations: ["order"],
    });

    return payment;
  }
}
