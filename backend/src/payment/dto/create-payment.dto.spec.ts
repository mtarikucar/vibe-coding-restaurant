import { validate } from 'class-validator';
import { CreatePaymentDto } from './create-payment.dto';
import { PaymentMethod } from '../entities/payment.entity';

describe('CreatePaymentDto', () => {
  let dto: CreatePaymentDto;

  beforeEach(() => {
    dto = new CreatePaymentDto();
  });

  describe('orderId validation', () => {
    it('should pass with valid UUID', async () => {
      dto.orderId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = 100.50;
      dto.method = PaymentMethod.CASH;
      dto.cashierId = '123e4567-e89b-12d3-a456-426614174001';

      const errors = await validate(dto);
      const orderIdErrors = errors.filter(error => error.property === 'orderId');
      expect(orderIdErrors).toHaveLength(0);
    });

    it('should fail with invalid UUID', async () => {
      dto.orderId = 'invalid-uuid';
      dto.amount = 100.50;
      dto.method = PaymentMethod.CASH;
      dto.cashierId = '123e4567-e89b-12d3-a456-426614174001';

      const errors = await validate(dto);
      const orderIdErrors = errors.filter(error => error.property === 'orderId');
      expect(orderIdErrors.length).toBeGreaterThan(0);
      expect(orderIdErrors[0].constraints).toHaveProperty('isUuid');
    });

    it('should fail when orderId is empty', async () => {
      dto.orderId = '';
      dto.amount = 100.50;
      dto.method = PaymentMethod.CASH;
      dto.cashierId = '123e4567-e89b-12d3-a456-426614174001';

      const errors = await validate(dto);
      const orderIdErrors = errors.filter(error => error.property === 'orderId');
      expect(orderIdErrors.length).toBeGreaterThan(0);
      expect(orderIdErrors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail when orderId is undefined', async () => {
      dto.amount = 100.50;
      dto.method = PaymentMethod.CASH;
      dto.cashierId = '123e4567-e89b-12d3-a456-426614174001';

      const errors = await validate(dto);
      const orderIdErrors = errors.filter(error => error.property === 'orderId');
      expect(orderIdErrors.length).toBeGreaterThan(0);
    });
  });

  describe('amount validation', () => {
    beforeEach(() => {
      dto.orderId = '123e4567-e89b-12d3-a456-426614174000';
      dto.method = PaymentMethod.CASH;
      dto.cashierId = '123e4567-e89b-12d3-a456-426614174001';
    });

    it('should pass with valid positive number', async () => {
      dto.amount = 100.50;

      const errors = await validate(dto);
      const amountErrors = errors.filter(error => error.property === 'amount');
      expect(amountErrors).toHaveLength(0);
    });

    it('should pass with integer amount', async () => {
      dto.amount = 100;

      const errors = await validate(dto);
      const amountErrors = errors.filter(error => error.property === 'amount');
      expect(amountErrors).toHaveLength(0);
    });

    it('should fail with string amount', async () => {
      (dto as any).amount = '100.50';

      const errors = await validate(dto);
      const amountErrors = errors.filter(error => error.property === 'amount');
      expect(amountErrors.length).toBeGreaterThan(0);
      expect(amountErrors[0].constraints).toHaveProperty('isNumber');
    });

    it('should fail with negative amount', async () => {
      dto.amount = -50;

      const errors = await validate(dto);
      const amountErrors = errors.filter(error => error.property === 'amount');
      expect(amountErrors.length).toBeGreaterThan(0);
    });

    it('should fail with zero amount', async () => {
      dto.amount = 0;

      const errors = await validate(dto);
      const amountErrors = errors.filter(error => error.property === 'amount');
      expect(amountErrors.length).toBeGreaterThan(0);
    });

    it('should fail when amount is undefined', async () => {
      const errors = await validate(dto);
      const amountErrors = errors.filter(error => error.property === 'amount');
      expect(amountErrors.length).toBeGreaterThan(0);
      expect(amountErrors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail when amount is null', async () => {
      (dto as any).amount = null;

      const errors = await validate(dto);
      const amountErrors = errors.filter(error => error.property === 'amount');
      expect(amountErrors.length).toBeGreaterThan(0);
    });

    it('should fail with NaN amount', async () => {
      (dto as any).amount = NaN;

      const errors = await validate(dto);
      const amountErrors = errors.filter(error => error.property === 'amount');
      expect(amountErrors.length).toBeGreaterThan(0);
    });

    it('should fail with Infinity amount', async () => {
      (dto as any).amount = Infinity;

      const errors = await validate(dto);
      const amountErrors = errors.filter(error => error.property === 'amount');
      expect(amountErrors.length).toBeGreaterThan(0);
    });
  });

  describe('method validation', () => {
    beforeEach(() => {
      dto.orderId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = 100.50;
      dto.cashierId = '123e4567-e89b-12d3-a456-426614174001';
    });

    it('should pass with valid payment methods', async () => {
      const validMethods = [
        PaymentMethod.CASH,
        PaymentMethod.CREDIT_CARD,
        PaymentMethod.DEBIT_CARD,
        PaymentMethod.STRIPE,
        PaymentMethod.PAYPAL,
      ];

      for (const method of validMethods) {
        dto.method = method;
        const errors = await validate(dto);
        const methodErrors = errors.filter(error => error.property === 'method');
        expect(methodErrors).toHaveLength(0);
      }
    });

    it('should fail with invalid payment method', async () => {
      (dto as any).method = 'invalid-method';

      const errors = await validate(dto);
      const methodErrors = errors.filter(error => error.property === 'method');
      expect(methodErrors.length).toBeGreaterThan(0);
      expect(methodErrors[0].constraints).toHaveProperty('isEnum');
    });

    it('should fail when method is undefined', async () => {
      const errors = await validate(dto);
      const methodErrors = errors.filter(error => error.property === 'method');
      expect(methodErrors.length).toBeGreaterThan(0);
      expect(methodErrors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('cashierId validation', () => {
    beforeEach(() => {
      dto.orderId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = 100.50;
      dto.method = PaymentMethod.CASH;
    });

    it('should pass with valid UUID', async () => {
      dto.cashierId = '123e4567-e89b-12d3-a456-426614174001';

      const errors = await validate(dto);
      const cashierIdErrors = errors.filter(error => error.property === 'cashierId');
      expect(cashierIdErrors).toHaveLength(0);
    });

    it('should fail with invalid UUID', async () => {
      dto.cashierId = 'invalid-uuid';

      const errors = await validate(dto);
      const cashierIdErrors = errors.filter(error => error.property === 'cashierId');
      expect(cashierIdErrors.length).toBeGreaterThan(0);
      expect(cashierIdErrors[0].constraints).toHaveProperty('isUuid');
    });

    it('should fail when cashierId is empty', async () => {
      dto.cashierId = '';

      const errors = await validate(dto);
      const cashierIdErrors = errors.filter(error => error.property === 'cashierId');
      expect(cashierIdErrors.length).toBeGreaterThan(0);
      expect(cashierIdErrors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail when cashierId is undefined', async () => {
      const errors = await validate(dto);
      const cashierIdErrors = errors.filter(error => error.property === 'cashierId');
      expect(cashierIdErrors.length).toBeGreaterThan(0);
    });
  });

  describe('paymentDetails validation', () => {
    beforeEach(() => {
      dto.orderId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = 100.50;
      dto.method = PaymentMethod.CASH;
      dto.cashierId = '123e4567-e89b-12d3-a456-426614174001';
    });

    it('should pass with valid object', async () => {
      dto.paymentDetails = { key: 'value', number: 123 };

      const errors = await validate(dto);
      const paymentDetailsErrors = errors.filter(error => error.property === 'paymentDetails');
      expect(paymentDetailsErrors).toHaveLength(0);
    });

    it('should pass when paymentDetails is undefined (optional)', async () => {
      const errors = await validate(dto);
      const paymentDetailsErrors = errors.filter(error => error.property === 'paymentDetails');
      expect(paymentDetailsErrors).toHaveLength(0);
    });

    it('should fail with non-object paymentDetails', async () => {
      (dto as any).paymentDetails = 'not-an-object';

      const errors = await validate(dto);
      const paymentDetailsErrors = errors.filter(error => error.property === 'paymentDetails');
      expect(paymentDetailsErrors.length).toBeGreaterThan(0);
      expect(paymentDetailsErrors[0].constraints).toHaveProperty('isObject');
    });
  });
});
