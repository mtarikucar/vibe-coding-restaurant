import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import * as crypto from 'crypto';

interface IdempotencyRecord {
  key: string;
  paymentId: string;
  createdAt: Date;
  response: any;
}

@Injectable()
export class PaymentIdempotencyService {
  private readonly logger = new Logger(PaymentIdempotencyService.name);
  private readonly idempotencyCache = new Map<string, IdempotencyRecord>();
  private readonly cacheExpiryMs = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {
    // Clean up expired cache entries every hour
    setInterval(() => this.cleanupExpiredEntries(), 60 * 60 * 1000);
  }

  /**
   * Generate idempotency key from request data
   */
  generateIdempotencyKey(orderId: string, amount: number, method: string, userId: string): string {
    const data = `${orderId}-${amount}-${method}-${userId}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Check if request is duplicate and return existing payment if found
   */
  async checkIdempotency(
    idempotencyKey: string,
    orderId: string,
    amount: number,
    method: string,
  ): Promise<Payment | null> {
    // Check cache first
    const cachedRecord = this.idempotencyCache.get(idempotencyKey);
    if (cachedRecord) {
      const isExpired = Date.now() - cachedRecord.createdAt.getTime() > this.cacheExpiryMs;
      if (!isExpired) {
        this.logger.log(`Idempotency hit (cache): ${idempotencyKey}`);
        return await this.paymentRepository.findOne({
          where: { id: cachedRecord.paymentId },
          relations: ['order'],
        });
      } else {
        this.idempotencyCache.delete(idempotencyKey);
      }
    }

    // Check database for existing payment with same characteristics
    const existingPayment = await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .where('payment.orderId = :orderId', { orderId })
      .andWhere('payment.amount = :amount', { amount })
      .andWhere('payment.method = :method', { method })
      .andWhere('payment.createdAt > :since', { 
        since: new Date(Date.now() - this.cacheExpiryMs) 
      })
      .getOne();

    if (existingPayment) {
      // Cache the result
      this.idempotencyCache.set(idempotencyKey, {
        key: idempotencyKey,
        paymentId: existingPayment.id,
        createdAt: new Date(),
        response: existingPayment,
      });

      this.logger.log(`Idempotency hit (database): ${idempotencyKey}`);
      return existingPayment;
    }

    return null;
  }

  /**
   * Record successful payment creation for idempotency
   */
  async recordPaymentCreation(
    idempotencyKey: string,
    payment: Payment,
  ): Promise<void> {
    this.idempotencyCache.set(idempotencyKey, {
      key: idempotencyKey,
      paymentId: payment.id,
      createdAt: new Date(),
      response: payment,
    });

    this.logger.log(`Recorded payment creation: ${idempotencyKey} -> ${payment.id}`);
  }

  /**
   * Generate unique transaction ID
   */
  generateTransactionId(method: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${method.toUpperCase()}-${timestamp}-${random}`;
  }

  /**
   * Validate transaction ID uniqueness
   */
  async validateTransactionIdUniqueness(transactionId: string): Promise<boolean> {
    const existing = await this.paymentRepository.findOne({
      where: { transactionId },
    });
    return !existing;
  }

  /**
   * Generate guaranteed unique transaction ID
   */
  async generateUniqueTransactionId(method: string, maxAttempts = 5): Promise<string> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const transactionId = this.generateTransactionId(method);
      const isUnique = await this.validateTransactionIdUniqueness(transactionId);
      
      if (isUnique) {
        return transactionId;
      }

      this.logger.warn(`Transaction ID collision attempt ${attempt}: ${transactionId}`);
      
      if (attempt === maxAttempts) {
        throw new ConflictException('Unable to generate unique transaction ID after maximum attempts');
      }

      // Wait a bit before retry to avoid rapid collisions
      await new Promise(resolve => setTimeout(resolve, 10 * attempt));
    }

    throw new ConflictException('Failed to generate unique transaction ID');
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, record] of this.idempotencyCache.entries()) {
      if (now - record.createdAt.getTime() > this.cacheExpiryMs) {
        this.idempotencyCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} expired idempotency cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxAge: number; entries: number } {
    const now = Date.now();
    let oldestEntry = now;

    for (const record of this.idempotencyCache.values()) {
      oldestEntry = Math.min(oldestEntry, record.createdAt.getTime());
    }

    return {
      size: this.idempotencyCache.size,
      maxAge: now - oldestEntry,
      entries: this.idempotencyCache.size,
    };
  }
}