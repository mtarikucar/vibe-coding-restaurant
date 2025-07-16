import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { Tenant } from '../src/tenant/entities/tenant.entity';
import { User, UserRole } from '../src/auth/entities/user.entity';
import { Table, TableStatus } from '../src/table/entities/table.entity';
import { Order, OrderStatus } from '../src/order/entities/order.entity';
import { MenuItem } from '../src/menu/entities/menu-item.entity';
import { OrderItem } from '../src/order/entities/order-item.entity';

export interface TestData {
  app: INestApplication;
  dataSource: DataSource;
  jwtService: JwtService;
  tenant: Tenant;
  user: User;
  table: Table;
  order: Order;
  authToken: string;
}

export async function createTestApp(): Promise<TestData> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  
  const dataSource = moduleFixture.get<DataSource>(DataSource);
  const jwtService = moduleFixture.get<JwtService>(JwtService);
  
  await app.init();

  // Clean database
  await cleanDatabase(dataSource);

  // Create test data
  const tenant = await createTestTenant(dataSource);
  const user = await createTestUser(dataSource, tenant);
  const table = await createTestTable(dataSource, tenant);
  const order = await createTestOrder(dataSource, tenant, user, table);

  // Generate auth token
  const authToken = jwtService.sign({
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: tenant.id,
  });

  return {
    app,
    dataSource,
    jwtService,
    tenant,
    user,
    table,
    order,
    authToken,
  };
}

export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  const entities = [
    'payment',
    'order_item',
    '"order"',
    'menu_item',
    '"table"',
    '"user"',
    'tenant',
  ];

  for (const entity of entities) {
    await dataSource.query(`DELETE FROM ${entity}`);
  }
}

export async function createTestTenant(dataSource: DataSource): Promise<Tenant> {
  return dataSource.getRepository(Tenant).save({
    name: 'Test Restaurant',
    subdomain: 'test-restaurant',
    country: 'Turkey',
    currency: 'TRY',
    timezone: 'Europe/Istanbul',
  });
}

export async function createTestUser(
  dataSource: DataSource,
  tenant: Tenant,
  role: UserRole = UserRole.CASHIER
): Promise<User> {
  return dataSource.getRepository(User).save({
    email: `${role.toLowerCase()}@test.com`,
    fullName: `Test ${role}`,
    role,
    tenantId: tenant.id,
    isActive: true,
  });
}

export async function createTestTable(
  dataSource: DataSource,
  tenant: Tenant,
  number: number = 1,
  status: TableStatus = TableStatus.OCCUPIED
): Promise<Table> {
  return dataSource.getRepository(Table).save({
    number,
    capacity: 4,
    status,
    tenantId: tenant.id,
  });
}

export async function createTestMenuItem(
  dataSource: DataSource,
  tenant: Tenant,
  name: string = 'Test Item',
  price: number = 25.50
): Promise<MenuItem> {
  return dataSource.getRepository(MenuItem).save({
    name,
    description: 'Test menu item',
    price,
    isAvailable: true,
    tenantId: tenant.id,
  });
}

export async function createTestOrder(
  dataSource: DataSource,
  tenant: Tenant,
  user: User,
  table: Table,
  status: OrderStatus = OrderStatus.SERVED
): Promise<Order> {
  // Create menu item first
  const menuItem = await createTestMenuItem(dataSource, tenant);

  // Create order
  const order = await dataSource.getRepository(Order).save({
    orderNumber: 'ORD-001',
    totalAmount: 100.50,
    status,
    tableId: table.id,
    waiterId: user.id,
    tenantId: tenant.id,
  });

  // Create order items
  await dataSource.getRepository(OrderItem).save({
    orderId: order.id,
    menuItemId: menuItem.id,
    quantity: 2,
    price: 25.50,
    notes: 'Test order item',
  });

  await dataSource.getRepository(OrderItem).save({
    orderId: order.id,
    menuItemId: menuItem.id,
    quantity: 1,
    price: 49.50,
    notes: 'Another test order item',
  });

  return order;
}

export function createInvalidAmountTestCases() {
  return [
    {
      description: 'string amount',
      amount: 'invalid-amount',
      expectedError: 'amount must be a number',
    },
    {
      description: 'negative amount',
      amount: -50,
      expectedError: 'amount must be a positive number',
    },
    {
      description: 'zero amount',
      amount: 0,
      expectedError: 'amount must be a positive number',
    },
    {
      description: 'null amount',
      amount: null,
      expectedError: 'amount',
    },
    {
      description: 'undefined amount',
      amount: undefined,
      expectedError: 'amount',
    },
    {
      description: 'NaN amount',
      amount: NaN,
      expectedError: 'amount must be a number',
    },
    {
      description: 'Infinity amount',
      amount: Infinity,
      expectedError: 'amount must be a number',
    },
    {
      description: 'amount with too many decimal places',
      amount: 100.123,
      expectedError: 'amount must be a number with at most 2 decimal places',
    },
  ];
}

export function createInvalidUUIDTestCases() {
  return [
    {
      description: 'invalid UUID format',
      uuid: 'invalid-uuid',
      expectedError: 'must be a UUID',
    },
    {
      description: 'empty string UUID',
      uuid: '',
      expectedError: 'should not be empty',
    },
    {
      description: 'null UUID',
      uuid: null,
      expectedError: 'must be a UUID',
    },
    {
      description: 'undefined UUID',
      uuid: undefined,
      expectedError: 'must be a UUID',
    },
    {
      description: 'number as UUID',
      uuid: 123,
      expectedError: 'must be a UUID',
    },
  ];
}

export function createInvalidPaymentMethodTestCases() {
  return [
    {
      description: 'invalid payment method',
      method: 'invalid-method',
      expectedError: 'method must be a valid enum value',
    },
    {
      description: 'null payment method',
      method: null,
      expectedError: 'method',
    },
    {
      description: 'undefined payment method',
      method: undefined,
      expectedError: 'method',
    },
    {
      description: 'number as payment method',
      method: 123,
      expectedError: 'method must be a valid enum value',
    },
  ];
}

export async function expectValidationError(
  promise: Promise<any>,
  expectedErrorMessage: string
): Promise<void> {
  try {
    await promise;
    throw new Error('Expected validation error but none was thrown');
  } catch (error) {
    expect(error.response?.data?.message || error.message).toContain(expectedErrorMessage);
  }
}

export function createMockPaymentGatewayResponse(success: boolean = true) {
  if (success) {
    return {
      success: true,
      transactionId: 'txn_123456',
      paymentIntentId: 'pi_123456',
      paymentMethodId: 'pm_123456',
    };
  } else {
    return {
      success: false,
      error: 'Payment failed',
      errorCode: 'card_declined',
    };
  }
}

export function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-id',
    orderNumber: 'ORD-001',
    totalAmount: 100.50,
    status: OrderStatus.SERVED,
    tableId: 'table-id',
    waiterId: 'waiter-id',
    tenantId: 'tenant-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Order;
}

export function createMockPayment(overrides: any = {}) {
  return {
    id: 'payment-id',
    orderId: 'order-id',
    amount: 100.50,
    method: 'cash',
    status: 'completed',
    transactionId: 'CASH-123456',
    cashierId: 'cashier-id',
    tenantId: 'tenant-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-id',
    email: 'test@example.com',
    fullName: 'Test User',
    role: UserRole.CASHIER,
    tenantId: 'tenant-id',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
}

export function createMockTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 'tenant-id',
    name: 'Test Restaurant',
    subdomain: 'test-restaurant',
    country: 'Turkey',
    currency: 'TRY',
    timezone: 'Europe/Istanbul',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Tenant;
}
