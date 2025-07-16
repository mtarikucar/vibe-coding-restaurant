import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsageMetric, UsageMetricType, UsageAggregationType } from '../entities/usage-metric.entity';
import { User } from '../../auth/entities/user.entity';
import { Table } from '../../table/entities/table.entity';
import { Order } from '../../order/entities/order.entity';
import { Invoice } from '../../invoice/entities/invoice.entity';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

interface UsageData {
  tables: { used: number; limit: number | null };
  users: { used: number; limit: number | null };
  storage: { used: number; limit: number | null };
  apiCalls: { used: number; limit: number | null };
  orders: { used: number; limit: number | null };
  invoices: { used: number; limit: number | null };
}

@Injectable()
export class UsageTrackingService {
  private readonly logger = new Logger(UsageTrackingService.name);

  constructor(
    @InjectRepository(UsageMetric)
    private readonly usageMetricRepository: Repository<UsageMetric>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Track a specific metric for a tenant
   */
  async trackMetric(
    tenantId: string,
    userId: string,
    metricType: UsageMetricType,
    value: number = 1,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      const today = startOfDay(new Date());

      // Check if metric already exists for today
      const existingMetric = await this.usageMetricRepository.findOne({
        where: {
          tenantId,
          metricType,
          aggregationType: UsageAggregationType.DAILY,
          date: today,
        },
      });

      if (existingMetric) {
        // Update existing metric
        existingMetric.value += value;
        existingMetric.count += 1;
        if (metadata) {
          existingMetric.metadata = { ...existingMetric.metadata, ...metadata };
        }
        await this.usageMetricRepository.save(existingMetric);
      } else {
        // Create new metric
        const newMetric = this.usageMetricRepository.create({
          tenantId,
          userId,
          metricType,
          aggregationType: UsageAggregationType.DAILY,
          value,
          count: 1,
          date: today,
          metadata,
        });
        await this.usageMetricRepository.save(newMetric);
      }

      this.logger.debug(`Tracked metric ${metricType} for tenant ${tenantId}: ${value}`);
    } catch (error) {
      this.logger.error(`Failed to track metric ${metricType}: ${error.message}`, error.stack);
    }
  }

  /**
   * Get current usage data for a tenant
   */
  async getCurrentUsage(tenantId: string): Promise<UsageData> {
    try {
      const today = new Date();
      const startOfCurrentMonth = startOfMonth(today);

      // Get current counts from actual tables
      const [tableCount, userCount, orderCount, invoiceCount] = await Promise.all([
        this.tableRepository.count({ where: { tenantId } }),
        this.userRepository.count({ where: { tenant: { id: tenantId } } }),
        this.orderRepository.count({
          where: {
            tenantId,
            createdAt: {
              $gte: startOfCurrentMonth,
            } as any,
          },
        }),
        this.invoiceRepository.count({
          where: {
            tenantId,
            createdAt: {
              $gte: startOfCurrentMonth,
            } as any,
          },
        }),
      ]);

      // Get API calls from usage metrics
      const apiCallsMetric = await this.usageMetricRepository
        .createQueryBuilder('metric')
        .select('SUM(metric.value)', 'total')
        .where('metric.tenantId = :tenantId', { tenantId })
        .andWhere('metric.metricType = :metricType', { metricType: UsageMetricType.API_CALLS })
        .andWhere('metric.date >= :startDate', { startDate: startOfCurrentMonth })
        .getRawOne();

      // Calculate storage usage (this would need to be implemented based on file storage)
      const storageUsed = await this.calculateStorageUsage(tenantId);

      return {
        tables: { used: tableCount, limit: null },
        users: { used: userCount, limit: null },
        storage: { used: storageUsed, limit: null },
        apiCalls: { used: parseInt(apiCallsMetric?.total) || 0, limit: null },
        orders: { used: orderCount, limit: null },
        invoices: { used: invoiceCount, limit: null },
      };
    } catch (error) {
      this.logger.error(`Failed to get current usage for tenant ${tenantId}: ${error.message}`, error.stack);
      return {
        tables: { used: 0, limit: null },
        users: { used: 0, limit: null },
        storage: { used: 0, limit: null },
        apiCalls: { used: 0, limit: null },
        orders: { used: 0, limit: null },
        invoices: { used: 0, limit: null },
      };
    }
  }

  /**
   * Get usage analytics for a tenant
   */
  async getUsageAnalytics(
    tenantId: string,
    metricType: UsageMetricType,
    aggregationType: UsageAggregationType = UsageAggregationType.DAILY,
    startDate: Date,
    endDate: Date,
  ): Promise<UsageMetric[]> {
    return this.usageMetricRepository.find({
      where: {
        tenantId,
        metricType,
        aggregationType,
        date: {
          $gte: startDate,
          $lte: endDate,
        } as any,
      },
      order: { date: 'ASC' },
    });
  }

  /**
   * Aggregate daily metrics into weekly/monthly/yearly
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async aggregateMetrics(): Promise<void> {
    this.logger.log('Starting metric aggregation');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Aggregate weekly metrics (run on Mondays)
      if (yesterday.getDay() === 0) { // Sunday
        await this.aggregateWeeklyMetrics(yesterday);
      }

      // Aggregate monthly metrics (run on first day of month)
      if (yesterday.getDate() === new Date(yesterday.getFullYear(), yesterday.getMonth() + 1, 0).getDate()) {
        await this.aggregateMonthlyMetrics(yesterday);
      }

      // Aggregate yearly metrics (run on December 31st)
      if (yesterday.getMonth() === 11 && yesterday.getDate() === 31) {
        await this.aggregateYearlyMetrics(yesterday);
      }

      this.logger.log('Metric aggregation completed');
    } catch (error) {
      this.logger.error(`Error in metric aggregation: ${error.message}`, error.stack);
    }
  }

  /**
   * Collect current usage snapshots for all tenants
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async collectUsageSnapshots(): Promise<void> {
    this.logger.log('Starting usage snapshot collection');

    try {
      // Get all unique tenant IDs
      const tenantIds = await this.userRepository
        .createQueryBuilder('user')
        .select('DISTINCT user.tenantId', 'tenantId')
        .where('user.tenantId IS NOT NULL')
        .getRawMany();

      for (const { tenantId } of tenantIds) {
        try {
          await this.collectTenantSnapshot(tenantId);
        } catch (error) {
          this.logger.error(`Failed to collect snapshot for tenant ${tenantId}: ${error.message}`);
        }
      }

      this.logger.log('Usage snapshot collection completed');
    } catch (error) {
      this.logger.error(`Error in usage snapshot collection: ${error.message}`, error.stack);
    }
  }

  /**
   * Collect usage snapshot for a specific tenant
   */
  private async collectTenantSnapshot(tenantId: string): Promise<void> {
    const today = startOfDay(new Date());

    // Get actual counts
    const [tableCount, userCount] = await Promise.all([
      this.tableRepository.count({ where: { tenantId } }),
      this.userRepository.count({ where: { tenant: { id: tenantId } } }),
    ]);

    // Create or update metrics
    await this.upsertMetric(tenantId, UsageMetricType.TABLE_COUNT, tableCount, today);
    await this.upsertMetric(tenantId, UsageMetricType.USER_COUNT, userCount, today);

    // Calculate and track storage usage
    const storageUsed = await this.calculateStorageUsage(tenantId);
    await this.upsertMetric(tenantId, UsageMetricType.STORAGE_USED, storageUsed, today);
  }

  /**
   * Upsert a metric value for a specific date
   */
  private async upsertMetric(
    tenantId: string,
    metricType: UsageMetricType,
    value: number,
    date: Date,
  ): Promise<void> {
    const existingMetric = await this.usageMetricRepository.findOne({
      where: {
        tenantId,
        metricType,
        aggregationType: UsageAggregationType.DAILY,
        date,
      },
    });

    if (existingMetric) {
      existingMetric.value = value;
      await this.usageMetricRepository.save(existingMetric);
    } else {
      const newMetric = this.usageMetricRepository.create({
        tenantId,
        userId: 'system',
        metricType,
        aggregationType: UsageAggregationType.DAILY,
        value,
        count: 1,
        date,
      });
      await this.usageMetricRepository.save(newMetric);
    }
  }

  /**
   * Aggregate weekly metrics
   */
  private async aggregateWeeklyMetrics(date: Date): Promise<void> {
    const weekStart = startOfWeek(date);
    const weekEnd = endOfWeek(date);

    await this.aggregateMetricsForPeriod(
      weekStart,
      weekEnd,
      UsageAggregationType.WEEKLY,
      weekStart,
    );
  }

  /**
   * Aggregate monthly metrics
   */
  private async aggregateMonthlyMetrics(date: Date): Promise<void> {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    await this.aggregateMetricsForPeriod(
      monthStart,
      monthEnd,
      UsageAggregationType.MONTHLY,
      monthStart,
    );
  }

  /**
   * Aggregate yearly metrics
   */
  private async aggregateYearlyMetrics(date: Date): Promise<void> {
    const yearStart = startOfYear(date);
    const yearEnd = endOfYear(date);

    await this.aggregateMetricsForPeriod(
      yearStart,
      yearEnd,
      UsageAggregationType.YEARLY,
      yearStart,
    );
  }

  /**
   * Aggregate metrics for a specific period
   */
  private async aggregateMetricsForPeriod(
    startDate: Date,
    endDate: Date,
    aggregationType: UsageAggregationType,
    aggregateDate: Date,
  ): Promise<void> {
    // Get all unique combinations of tenant and metric type for the period
    const combinations = await this.usageMetricRepository
      .createQueryBuilder('metric')
      .select(['metric.tenantId', 'metric.metricType'])
      .where('metric.date >= :startDate', { startDate })
      .andWhere('metric.date <= :endDate', { endDate })
      .andWhere('metric.aggregationType = :type', { type: UsageAggregationType.DAILY })
      .groupBy('metric.tenantId, metric.metricType')
      .getRawMany();

    for (const { metric_tenantId: tenantId, metric_metricType: metricType } of combinations) {
      // Calculate aggregated values
      const result = await this.usageMetricRepository
        .createQueryBuilder('metric')
        .select([
          'SUM(metric.value) as totalValue',
          'SUM(metric.count) as totalCount',
          'AVG(metric.value) as avgValue',
          'MAX(metric.value) as maxValue',
          'MIN(metric.value) as minValue',
        ])
        .where('metric.tenantId = :tenantId', { tenantId })
        .andWhere('metric.metricType = :metricType', { metricType })
        .andWhere('metric.date >= :startDate', { startDate })
        .andWhere('metric.date <= :endDate', { endDate })
        .andWhere('metric.aggregationType = :type', { type: UsageAggregationType.DAILY })
        .getRawOne();

      // Create aggregated metric
      await this.upsertAggregatedMetric(
        tenantId,
        metricType,
        aggregationType,
        aggregateDate,
        parseInt(result.totalValue) || 0,
        parseInt(result.totalCount) || 0,
        {
          avg: parseFloat(result.avgValue) || 0,
          max: parseInt(result.maxValue) || 0,
          min: parseInt(result.minValue) || 0,
        },
      );
    }
  }

  /**
   * Upsert an aggregated metric
   */
  private async upsertAggregatedMetric(
    tenantId: string,
    metricType: UsageMetricType,
    aggregationType: UsageAggregationType,
    date: Date,
    value: number,
    count: number,
    metadata: Record<string, any>,
  ): Promise<void> {
    const existingMetric = await this.usageMetricRepository.findOne({
      where: {
        tenantId,
        metricType,
        aggregationType,
        date,
      },
    });

    if (existingMetric) {
      existingMetric.value = value;
      existingMetric.count = count;
      existingMetric.metadata = metadata;
      await this.usageMetricRepository.save(existingMetric);
    } else {
      const newMetric = this.usageMetricRepository.create({
        tenantId,
        userId: 'system',
        metricType,
        aggregationType,
        value,
        count,
        date,
        metadata,
      });
      await this.usageMetricRepository.save(newMetric);
    }
  }

  /**
   * Calculate storage usage for a tenant (placeholder implementation)
   */
  private async calculateStorageUsage(tenantId: string): Promise<number> {
    // This would need to be implemented based on actual file storage
    // For now, return a mock value based on database size
    try {
      const tableCount = await this.tableRepository.count({ where: { tenantId } });
      const userCount = await this.userRepository.count({ where: { tenant: { id: tenantId } } });
      
      // Rough estimate: each table = 1MB, each user = 0.5MB
      return Math.round(tableCount * 1 + userCount * 0.5);
    } catch (error) {
      this.logger.error(`Failed to calculate storage usage for tenant ${tenantId}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Clean up old metrics (keep only last 2 years)
   */
  @Cron('0 2 1 * *') // First day of every month at 2 AM
  async cleanupOldMetrics(): Promise<void> {
    this.logger.log('Starting cleanup of old metrics');

    try {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const deleteResult = await this.usageMetricRepository
        .createQueryBuilder()
        .delete()
        .where('date < :date', { date: twoYearsAgo })
        .execute();

      this.logger.log(`Cleaned up ${deleteResult.affected} old metric records`);
    } catch (error) {
      this.logger.error(`Error cleaning up old metrics: ${error.message}`, error.stack);
    }
  }
}