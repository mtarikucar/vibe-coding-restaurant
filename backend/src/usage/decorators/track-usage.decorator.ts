import { SetMetadata } from '@nestjs/common';
import { UsageMetricType } from '../entities/usage-metric.entity';

export const TRACK_USAGE_KEY = 'track_usage';

export interface UsageTrackingConfig {
  metricType: UsageMetricType;
  value?: number;
  extractFromResponse?: string; // Path to extract value from response
  extractFromBody?: string; // Path to extract value from request body
  condition?: (req: any, res: any) => boolean; // Only track if condition is true
  metadata?: Record<string, any> | ((req: any, res: any) => Record<string, any>);
}

/**
 * Decorator to automatically track usage metrics
 * 
 * @param config - Usage tracking configuration
 * 
 * @example
 * ```typescript
 * @TrackUsage({ metricType: UsageMetricType.API_CALLS })
 * @Get('data')
 * async getData() {
 *   // API call will be tracked automatically
 * }
 * 
 * @TrackUsage({ 
 *   metricType: UsageMetricType.ORDERS_PROCESSED,
 *   condition: (req, res) => res.statusCode === 201
 * })
 * @Post('orders')
 * async createOrder() {
 *   // Only tracks when order is successfully created
 * }
 * 
 * @TrackUsage({
 *   metricType: UsageMetricType.INVOICES_GENERATED,
 *   extractFromResponse: 'data.length',
 *   metadata: (req, res) => ({ 
 *     endpoint: req.url,
 *     method: req.method 
 *   })
 * })
 * @Get('invoices')
 * async getInvoices() {
 *   // Tracks number of invoices returned
 * }
 * ```
 */
export const TrackUsage = (config: UsageTrackingConfig) =>
  SetMetadata(TRACK_USAGE_KEY, config);

/**
 * Decorator to track API calls
 */
export const TrackApiCall = (metadata?: Record<string, any>) =>
  TrackUsage({ 
    metricType: UsageMetricType.API_CALLS,
    metadata,
  });

/**
 * Decorator to track orders processed
 */
export const TrackOrdersProcessed = () =>
  TrackUsage({ 
    metricType: UsageMetricType.ORDERS_PROCESSED,
    condition: (req, res) => res.statusCode >= 200 && res.statusCode < 300,
  });

/**
 * Decorator to track invoices generated
 */
export const TrackInvoicesGenerated = () =>
  TrackUsage({ 
    metricType: UsageMetricType.INVOICES_GENERATED,
    condition: (req, res) => res.statusCode >= 200 && res.statusCode < 300,
  });

/**
 * Decorator to track reports generated
 */
export const TrackReportsGenerated = () =>
  TrackUsage({ 
    metricType: UsageMetricType.REPORTS_GENERATED,
    condition: (req, res) => res.statusCode >= 200 && res.statusCode < 300,
  });

/**
 * Decorator to track reservations made
 */
export const TrackReservationsMade = () =>
  TrackUsage({ 
    metricType: UsageMetricType.RESERVATIONS_MADE,
    condition: (req, res) => res.statusCode === 201,
  });