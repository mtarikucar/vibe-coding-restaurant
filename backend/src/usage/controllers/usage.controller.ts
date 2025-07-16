import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UsageTrackingService } from '../services/usage-tracking.service';
import { UsageMetricType, UsageAggregationType } from '../entities/usage-metric.entity';

export interface UsageData {
  tables: { used: number; limit: number | null };
  users: { used: number; limit: number | null };
  storage: { used: number; limit: number | null };
  apiCalls: { used: number; limit: number | null };
  orders: { used: number; limit: number | null };
  invoices: { used: number; limit: number | null };
}

interface TrackMetricDto {
  metricType: UsageMetricType;
  value?: number;
  metadata?: Record<string, any>;
}

interface GetAnalyticsDto {
  metricType: UsageMetricType;
  aggregationType?: UsageAggregationType;
  startDate: string;
  endDate: string;
}

@Controller('usage')
@UseGuards(JwtAuthGuard)
export class UsageController {
  private readonly logger = new Logger(UsageController.name);

  constructor(private readonly usageTrackingService: UsageTrackingService) {}

  /**
   * Get current usage data for the authenticated tenant
   */
  @Get('current')
  async getCurrentUsage(@Req() req: Request): Promise<UsageData> {
    try {
      const user = req.user as any;
      const tenantId = user.tenant?.id;

      if (!tenantId) {
        throw new HttpException('Tenant not found', HttpStatus.BAD_REQUEST);
      }

      const usage = await this.usageTrackingService.getCurrentUsage(tenantId);
      
      this.logger.log(`Retrieved current usage for tenant ${tenantId}`);
      
      return usage;
    } catch (error) {
      this.logger.error(`Failed to get current usage: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to retrieve usage data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Track a specific metric
   */
  @Post('track')
  async trackMetric(@Req() req: Request, @Body() trackMetricDto: TrackMetricDto) {
    try {
      const user = req.user as any;
      const tenantId = user.tenant?.id;
      const userId = user.id;

      if (!tenantId) {
        throw new HttpException('Tenant not found', HttpStatus.BAD_REQUEST);
      }

      await this.usageTrackingService.trackMetric(
        tenantId,
        userId,
        trackMetricDto.metricType,
        trackMetricDto.value,
        trackMetricDto.metadata,
      );

      this.logger.log(`Tracked metric ${trackMetricDto.metricType} for tenant ${tenantId}`);

      return { success: true, message: 'Metric tracked successfully' };
    } catch (error) {
      this.logger.error(`Failed to track metric: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to track metric',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get usage analytics for a specific metric
   */
  @Get('analytics')
  async getUsageAnalytics(@Req() req: Request, @Query() query: GetAnalyticsDto) {
    try {
      const user = req.user as any;
      const tenantId = user.tenant?.id;

      if (!tenantId) {
        throw new HttpException('Tenant not found', HttpStatus.BAD_REQUEST);
      }

      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new HttpException('Invalid date format', HttpStatus.BAD_REQUEST);
      }

      const analytics = await this.usageTrackingService.getUsageAnalytics(
        tenantId,
        query.metricType,
        query.aggregationType || UsageAggregationType.DAILY,
        startDate,
        endDate,
      );

      this.logger.log(`Retrieved analytics for ${query.metricType} for tenant ${tenantId}`);

      return analytics;
    } catch (error) {
      this.logger.error(`Failed to get usage analytics: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to retrieve usage analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get usage summary with multiple metrics
   */
  @Get('summary')
  async getUsageSummary(@Req() req: Request, @Query() query: { period?: string }) {
    try {
      const user = req.user as any;
      const tenantId = user.tenant?.id;

      if (!tenantId) {
        throw new HttpException('Tenant not found', HttpStatus.BAD_REQUEST);
      }

      const period = query.period || 'month';
      const endDate = new Date();
      let startDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate = new Date();
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
      }

      // Get analytics for multiple metrics
      const [
        apiCallsData,
        ordersData,
        invoicesData,
        reportsData,
      ] = await Promise.all([
        this.usageTrackingService.getUsageAnalytics(
          tenantId,
          UsageMetricType.API_CALLS,
          period === 'week' ? UsageAggregationType.DAILY : UsageAggregationType.WEEKLY,
          startDate,
          endDate,
        ),
        this.usageTrackingService.getUsageAnalytics(
          tenantId,
          UsageMetricType.ORDERS_PROCESSED,
          period === 'week' ? UsageAggregationType.DAILY : UsageAggregationType.WEEKLY,
          startDate,
          endDate,
        ),
        this.usageTrackingService.getUsageAnalytics(
          tenantId,
          UsageMetricType.INVOICES_GENERATED,
          period === 'week' ? UsageAggregationType.DAILY : UsageAggregationType.WEEKLY,
          startDate,
          endDate,
        ),
        this.usageTrackingService.getUsageAnalytics(
          tenantId,
          UsageMetricType.REPORTS_GENERATED,
          period === 'week' ? UsageAggregationType.DAILY : UsageAggregationType.WEEKLY,
          startDate,
          endDate,
        ),
      ]);

      const summary = {
        period,
        startDate,
        endDate,
        metrics: {
          apiCalls: {
            data: apiCallsData,
            total: apiCallsData.reduce((sum, metric) => sum + metric.value, 0),
          },
          orders: {
            data: ordersData,
            total: ordersData.reduce((sum, metric) => sum + metric.value, 0),
          },
          invoices: {
            data: invoicesData,
            total: invoicesData.reduce((sum, metric) => sum + metric.value, 0),
          },
          reports: {
            data: reportsData,
            total: reportsData.reduce((sum, metric) => sum + metric.value, 0),
          },
        },
      };

      this.logger.log(`Retrieved usage summary for tenant ${tenantId}`);

      return summary;
    } catch (error) {
      this.logger.error(`Failed to get usage summary: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to retrieve usage summary',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get usage trends comparison
   */
  @Get('trends')
  async getUsageTrends(@Req() req: Request, @Query() query: { metricType: UsageMetricType }) {
    try {
      const user = req.user as any;
      const tenantId = user.tenant?.id;

      if (!tenantId) {
        throw new HttpException('Tenant not found', HttpStatus.BAD_REQUEST);
      }

      const currentDate = new Date();
      
      // Current month
      const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Previous month
      const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

      const [currentMonthData, previousMonthData] = await Promise.all([
        this.usageTrackingService.getUsageAnalytics(
          tenantId,
          query.metricType,
          UsageAggregationType.DAILY,
          currentMonthStart,
          currentMonthEnd,
        ),
        this.usageTrackingService.getUsageAnalytics(
          tenantId,
          query.metricType,
          UsageAggregationType.DAILY,
          previousMonthStart,
          previousMonthEnd,
        ),
      ]);

      const currentTotal = currentMonthData.reduce((sum, metric) => sum + metric.value, 0);
      const previousTotal = previousMonthData.reduce((sum, metric) => sum + metric.value, 0);
      
      const percentageChange = previousTotal > 0 
        ? ((currentTotal - previousTotal) / previousTotal) * 100 
        : 0;

      const trends = {
        metricType: query.metricType,
        currentMonth: {
          data: currentMonthData,
          total: currentTotal,
          period: 'current_month',
        },
        previousMonth: {
          data: previousMonthData,
          total: previousTotal,
          period: 'previous_month',
        },
        comparison: {
          change: currentTotal - previousTotal,
          percentageChange: Math.round(percentageChange * 100) / 100,
          trend: percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'stable',
        },
      };

      this.logger.log(`Retrieved usage trends for ${query.metricType} for tenant ${tenantId}`);

      return trends;
    } catch (error) {
      this.logger.error(`Failed to get usage trends: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to retrieve usage trends',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}