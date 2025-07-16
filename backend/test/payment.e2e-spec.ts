import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Payment, PaymentMethod, PaymentStatus } from '../src/payment/entities/payment.entity';
import { Order, OrderStatus } from '../src/order/entities/order.entity';
import { Table, TableStatus } from '../src/table/entities/table.entity';
import { User, UserRole } from '../src/auth/entities/user.entity';
import { Tenant } from '../src/tenant/entities/tenant.entity';
import { JwtService } from '@nestjs/jwt';

describe('Payment E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let authToken: string;
  let tenant: Tenant;
  let user: User;
  let table: Table;
  let order: Order;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    
    dataSource = moduleFixture.get<DataSource>(DataSource);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    
    await app.init();
  });

  beforeEach(async () => {
    // Clean database
    await dataSource.query('DELETE FROM payment');
    await dataSource.query('DELETE FROM "order"');
    await dataSource.query('DELETE FROM "table"');
    await dataSource.query('DELETE FROM "user"');
    await dataSource.query('DELETE FROM tenant');

    // Create test tenant
    tenant = await dataSource.getRepository(Tenant).save({
      name: 'Test Restaurant',
      subdomain: 'test-restaurant',
      country: 'Turkey',
      currency: 'TRY',
      timezone: 'Europe/Istanbul',
    });

    // Create test user
    user = await dataSource.getRepository(User).save({
      email: 'cashier@test.com',
      fullName: 'Test Cashier',
      role: UserRole.CASHIER,
      tenantId: tenant.id,
      isActive: true,
    });

    // Create test table
    table = await dataSource.getRepository(Table).save({
      number: 1,
      capacity: 4,
      status: TableStatus.OCCUPIED,
      tenantId: tenant.id,
    });

    // Create test order
    order = await dataSource.getRepository(Order).save({
      orderNumber: 'ORD-001',
      totalAmount: 100.50,
      status: OrderStatus.SERVED,
      tableId: table.id,
      waiterId: user.id,
      tenantId: tenant.id,
    });

    // Generate auth token
    authToken = jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: tenant.id,
    });
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('POST /payments', () => {
    it('should create a cash payment successfully', async () => {
      const createPaymentDto = {
        orderId: order.id,
        amount: 100.50,
        method: PaymentMethod.CASH,
        cashierId: user.id,
      };

      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPaymentDto)
        .expect(201);

      expect(response.body).toMatchObject({
        orderId: order.id,
        amount: '100.50',
        method: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        cashierId: user.id,
        tenantId: tenant.id,
      });

      expect(response.body.transactionId).toMatch(/^CASH-\d{6}$/);
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('should return 400 for invalid amount (string)', async () => {
      const createPaymentDto = {
        orderId: order.id,
        amount: 'invalid-amount',
        method: PaymentMethod.CASH,
        cashierId: user.id,
      };

      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPaymentDto)
        .expect(400);

      expect(response.body.message).toContain('amount must be a number');
    });

    it('should return 400 for negative amount', async () => {
      const createPaymentDto = {
        orderId: order.id,
        amount: -50,
        method: PaymentMethod.CASH,
        cashierId: user.id,
      };

      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPaymentDto)
        .expect(400);

      expect(response.body.message).toContain('amount must be a positive number');
    });

    it('should return 400 for zero amount', async () => {
      const createPaymentDto = {
        orderId: order.id,
        amount: 0,
        method: PaymentMethod.CASH,
        cashierId: user.id,
      };

      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPaymentDto)
        .expect(400);

      expect(response.body.message).toContain('amount must be a positive number');
    });

    it('should return 400 for invalid UUID orderId', async () => {
      const createPaymentDto = {
        orderId: 'invalid-uuid',
        amount: 100.50,
        method: PaymentMethod.CASH,
        cashierId: user.id,
      };

      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPaymentDto)
        .expect(400);

      expect(response.body.message).toContain('orderId must be a UUID');
    });

    it('should return 400 for invalid payment method', async () => {
      const createPaymentDto = {
        orderId: order.id,
        amount: 100.50,
        method: 'invalid-method',
        cashierId: user.id,
      };

      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPaymentDto)
        .expect(400);

      expect(response.body.message).toContain('method must be a valid enum value');
    });

    it('should return 409 if payment already exists for order', async () => {
      // Create first payment
      const createPaymentDto = {
        orderId: order.id,
        amount: 100.50,
        method: PaymentMethod.CASH,
        cashierId: user.id,
      };

      await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPaymentDto)
        .expect(201);

      // Try to create second payment for same order
      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPaymentDto)
        .expect(409);

      expect(response.body.message).toContain('Payment for order ORD-001 already exists');
    });

    it('should return 400 if order is not ready for payment', async () => {
      // Update order status to pending
      await dataSource.getRepository(Order).update(order.id, {
        status: OrderStatus.PENDING,
      });

      const createPaymentDto = {
        orderId: order.id,
        amount: 100.50,
        method: PaymentMethod.CASH,
        cashierId: user.id,
      };

      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPaymentDto)
        .expect(400);

      expect(response.body.message).toContain('Order ORD-001 is not ready for payment');
    });

    it('should create pending payment for card method', async () => {
      const createPaymentDto = {
        orderId: order.id,
        amount: 100.50,
        method: PaymentMethod.CREDIT_CARD,
        cashierId: user.id,
      };

      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPaymentDto)
        .expect(201);

      expect(response.body).toMatchObject({
        orderId: order.id,
        amount: '100.50',
        method: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.PENDING,
        cashierId: user.id,
        tenantId: tenant.id,
      });
    });

    it('should return 401 without authentication', async () => {
      const createPaymentDto = {
        orderId: order.id,
        amount: 100.50,
        method: PaymentMethod.CASH,
        cashierId: user.id,
      };

      await request(app.getHttpServer())
        .post('/payments')
        .send(createPaymentDto)
        .expect(401);
    });

    it('should handle missing required fields', async () => {
      const incompleteDto = {
        orderId: order.id,
        // missing amount, method, cashierId
      };

      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteDto)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('amount'),
          expect.stringContaining('method'),
          expect.stringContaining('cashierId'),
        ])
      );
    });

    it('should handle amount with too many decimal places', async () => {
      const createPaymentDto = {
        orderId: order.id,
        amount: 100.123, // 3 decimal places
        method: PaymentMethod.CASH,
        cashierId: user.id,
      };

      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPaymentDto)
        .expect(400);

      expect(response.body.message).toContain('amount must be a number with at most 2 decimal places');
    });
  });

  describe('POST /payments/:id/process', () => {
    let payment: Payment;

    beforeEach(async () => {
      // Create a pending payment
      payment = await dataSource.getRepository(Payment).save({
        orderId: order.id,
        amount: 100.50,
        method: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.PENDING,
        cashierId: user.id,
        tenantId: tenant.id,
      });
    });

    it('should process cash payment successfully', async () => {
      const processPaymentDto = {
        orderId: order.id,
        method: PaymentMethod.CASH,
        cashierId: user.id,
      };

      const response = await request(app.getHttpServer())
        .post(`/payments/${payment.id}/process`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(processPaymentDto)
        .expect(200);

      expect(response.body.status).toBe(PaymentStatus.COMPLETED);
      expect(response.body.transactionId).toMatch(/^CASH-\d{6}$/);
    });

    it('should return 409 if payment is already completed', async () => {
      // Update payment to completed
      await dataSource.getRepository(Payment).update(payment.id, {
        status: PaymentStatus.COMPLETED,
      });

      const processPaymentDto = {
        orderId: order.id,
        method: PaymentMethod.CASH,
        cashierId: user.id,
      };

      const response = await request(app.getHttpServer())
        .post(`/payments/${payment.id}/process`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(processPaymentDto)
        .expect(409);

      expect(response.body.message).toContain('Payment');
      expect(response.body.message).toContain('is already completed');
    });

    it('should return 404 for non-existent payment', async () => {
      const processPaymentDto = {
        orderId: order.id,
        method: PaymentMethod.CASH,
        cashierId: user.id,
      };

      await request(app.getHttpServer())
        .post('/payments/non-existent-id/process')
        .set('Authorization', `Bearer ${authToken}`)
        .send(processPaymentDto)
        .expect(404);
    });
  });

  describe('GET /payments/:id', () => {
    let payment: Payment;

    beforeEach(async () => {
      payment = await dataSource.getRepository(Payment).save({
        orderId: order.id,
        amount: 100.50,
        method: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        cashierId: user.id,
        tenantId: tenant.id,
        transactionId: 'CASH-123456',
      });
    });

    it('should get payment by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/payments/${payment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: payment.id,
        orderId: order.id,
        amount: '100.50',
        method: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        transactionId: 'CASH-123456',
      });
    });

    it('should return 404 for non-existent payment', async () => {
      await request(app.getHttpServer())
        .get('/payments/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /payments/order/:orderId', () => {
    let payment: Payment;

    beforeEach(async () => {
      payment = await dataSource.getRepository(Payment).save({
        orderId: order.id,
        amount: 100.50,
        method: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        cashierId: user.id,
        tenantId: tenant.id,
        transactionId: 'CASH-123456',
      });
    });

    it('should get payment by order id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/payments/order/${order.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: payment.id,
        orderId: order.id,
        amount: '100.50',
        method: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
      });
    });

    it('should return 404 for order without payment', async () => {
      // Create another order without payment
      const anotherOrder = await dataSource.getRepository(Order).save({
        orderNumber: 'ORD-002',
        totalAmount: 50.25,
        status: OrderStatus.SERVED,
        tableId: table.id,
        waiterId: user.id,
        tenantId: tenant.id,
      });

      await request(app.getHttpServer())
        .get(`/payments/order/${anotherOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /payments/:id/status', () => {
    let payment: Payment;

    beforeEach(async () => {
      payment = await dataSource.getRepository(Payment).save({
        orderId: order.id,
        amount: 100.50,
        method: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        cashierId: user.id,
        tenantId: tenant.id,
        transactionId: 'CASH-123456',
      });
    });

    it('should update payment status to refunded', async () => {
      const updateStatusDto = {
        status: PaymentStatus.REFUNDED,
      };

      const response = await request(app.getHttpServer())
        .patch(`/payments/${payment.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateStatusDto)
        .expect(200);

      expect(response.body.status).toBe(PaymentStatus.REFUNDED);

      // Check that order status was updated to cancelled
      const updatedOrder = await dataSource.getRepository(Order).findOne({
        where: { id: order.id },
      });
      expect(updatedOrder.status).toBe(OrderStatus.CANCELLED);
    });

    it('should return 400 for invalid status', async () => {
      const updateStatusDto = {
        status: 'invalid-status',
      };

      const response = await request(app.getHttpServer())
        .patch(`/payments/${payment.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateStatusDto)
        .expect(400);

      expect(response.body.message).toContain('status must be a valid enum value');
    });

    it('should return 404 for non-existent payment', async () => {
      const updateStatusDto = {
        status: PaymentStatus.REFUNDED,
      };

      await request(app.getHttpServer())
        .patch('/payments/non-existent-id/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateStatusDto)
        .expect(404);
    });
  });

  describe('Integration with Order and Table Status', () => {
    it('should update order and table status after successful cash payment', async () => {
      const createPaymentDto = {
        orderId: order.id,
        amount: 100.50,
        method: PaymentMethod.CASH,
        cashierId: user.id,
      };

      await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPaymentDto)
        .expect(201);

      // Check order status
      const updatedOrder = await dataSource.getRepository(Order).findOne({
        where: { id: order.id },
      });
      expect(updatedOrder.status).toBe(OrderStatus.COMPLETED);

      // Check table status
      const updatedTable = await dataSource.getRepository(Table).findOne({
        where: { id: table.id },
      });
      expect(updatedTable.status).toBe(TableStatus.AVAILABLE);
    });

    it('should not update order/table status for pending card payment', async () => {
      const createPaymentDto = {
        orderId: order.id,
        amount: 100.50,
        method: PaymentMethod.CREDIT_CARD,
        cashierId: user.id,
      };

      await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPaymentDto)
        .expect(201);

      // Check order status (should remain SERVED)
      const updatedOrder = await dataSource.getRepository(Order).findOne({
        where: { id: order.id },
      });
      expect(updatedOrder.status).toBe(OrderStatus.SERVED);

      // Check table status (should remain OCCUPIED)
      const updatedTable = await dataSource.getRepository(Table).findOne({
        where: { id: table.id },
      });
      expect(updatedTable.status).toBe(TableStatus.OCCUPIED);
    });
  });

  describe('Tenant Isolation', () => {
    let anotherTenant: Tenant;
    let anotherUser: User;
    let anotherAuthToken: string;

    beforeEach(async () => {
      // Create another tenant
      anotherTenant = await dataSource.getRepository(Tenant).save({
        name: 'Another Restaurant',
        subdomain: 'another-restaurant',
        country: 'USA',
        currency: 'USD',
        timezone: 'America/New_York',
      });

      // Create user for another tenant
      anotherUser = await dataSource.getRepository(User).save({
        email: 'cashier@another.com',
        fullName: 'Another Cashier',
        role: UserRole.CASHIER,
        tenantId: anotherTenant.id,
        isActive: true,
      });

      // Generate auth token for another tenant
      anotherAuthToken = jwtService.sign({
        sub: anotherUser.id,
        email: anotherUser.email,
        role: anotherUser.role,
        tenantId: anotherTenant.id,
      });
    });

    it('should not allow access to payments from different tenant', async () => {
      // Create payment for first tenant
      const payment = await dataSource.getRepository(Payment).save({
        orderId: order.id,
        amount: 100.50,
        method: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        cashierId: user.id,
        tenantId: tenant.id,
        transactionId: 'CASH-123456',
      });

      // Try to access with another tenant's token
      await request(app.getHttpServer())
        .get(`/payments/${payment.id}`)
        .set('Authorization', `Bearer ${anotherAuthToken}`)
        .expect(404); // Should not find payment from different tenant
    });

    it('should isolate payment creation by tenant', async () => {
      const createPaymentDto = {
        orderId: order.id, // Order belongs to first tenant
        amount: 100.50,
        method: PaymentMethod.CASH,
        cashierId: anotherUser.id, // User from second tenant
      };

      // Should fail because order doesn't belong to the authenticated user's tenant
      await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${anotherAuthToken}`)
        .send(createPaymentDto)
        .expect(404); // Order not found in the context of another tenant
    });
  });
});
