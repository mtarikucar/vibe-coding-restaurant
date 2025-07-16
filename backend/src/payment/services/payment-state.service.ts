import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentStateTransition } from '../entities/payment-state.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';

@Injectable()
export class PaymentStateService {
  private readonly logger = new Logger(PaymentStateService.name);

  // Define valid state transitions
  private readonly validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
    [PaymentStatus.PENDING]: [PaymentStatus.COMPLETED, PaymentStatus.FAILED, PaymentStatus.CANCELLED],
    [PaymentStatus.COMPLETED]: [PaymentStatus.REFUNDED],
    [PaymentStatus.FAILED]: [PaymentStatus.PENDING, PaymentStatus.CANCELLED],
    [PaymentStatus.CANCELLED]: [], // Terminal state
    [PaymentStatus.REFUNDED]: [], // Terminal state
  };

  constructor(
    @InjectRepository(PaymentStateTransition)
    private readonly stateTransitionRepository: Repository<PaymentStateTransition>,
  ) {}

  /**
   * Validate if a state transition is allowed
   */
  isValidTransition(fromStatus: PaymentStatus, toStatus: PaymentStatus): boolean {
    return this.validTransitions[fromStatus]?.includes(toStatus) || false;
  }

  /**
   * Record a state transition
   */
  async recordTransition(
    payment: Payment,
    fromStatus: PaymentStatus,
    toStatus: PaymentStatus,
    reason?: string,
    userId?: string,
    metadata?: Record<string, any>,
  ): Promise<PaymentStateTransition> {
    if (!this.isValidTransition(fromStatus, toStatus)) {
      throw new BadRequestException(
        `Invalid payment state transition from ${fromStatus} to ${toStatus}`
      );
    }

    const transition = this.stateTransitionRepository.create({
      paymentId: payment.id,
      fromStatus,
      toStatus,
      reason,
      userId,
      metadata,
    });

    const savedTransition = await this.stateTransitionRepository.save(transition);
    
    this.logger.log(
      `Payment ${payment.id} transitioned from ${fromStatus} to ${toStatus}. Reason: ${reason || 'N/A'}`
    );

    return savedTransition;
  }

  /**
   * Get payment state history
   */
  async getPaymentHistory(paymentId: string): Promise<PaymentStateTransition[]> {
    return this.stateTransitionRepository.find({
      where: { paymentId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get all possible next states for current status
   */
  getValidNextStates(currentStatus: PaymentStatus): PaymentStatus[] {
    return this.validTransitions[currentStatus] || [];
  }

  /**
   * Get state transition statistics
   */
  async getTransitionStats(tenantId?: string): Promise<any> {
    // This would need tenant filtering if implemented
    const query = this.stateTransitionRepository
      .createQueryBuilder('transition')
      .select([
        'transition.fromStatus',
        'transition.toStatus',
        'COUNT(*) as count'
      ])
      .groupBy('transition.fromStatus, transition.toStatus')
      .orderBy('count', 'DESC');

    const results = await query.getRawMany();
    
    return results.reduce((acc, curr) => {
      const key = `${curr.transition_fromStatus}_to_${curr.transition_toStatus}`;
      acc[key] = parseInt(curr.count);
      return acc;
    }, {});
  }
}