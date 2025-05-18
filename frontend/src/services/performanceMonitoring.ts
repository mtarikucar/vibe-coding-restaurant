import { toast } from "react-hot-toast";

// Performance metric types
export enum MetricType {
  API_REQUEST = "api_request",
  PAGE_LOAD = "page_load",
  COMPONENT_RENDER = "component_render",
  RESOURCE_LOAD = "resource_load",
  USER_INTERACTION = "user_interaction",
  CUSTOM = "custom",
}

// Performance metric interface
export interface PerformanceMetric {
  type: MetricType;
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Thresholds for different metric types (in ms)
const PERFORMANCE_THRESHOLDS = {
  [MetricType.API_REQUEST]: 1000, // 1 second
  [MetricType.PAGE_LOAD]: 3000, // 3 seconds
  [MetricType.COMPONENT_RENDER]: 100, // 100 ms
  [MetricType.RESOURCE_LOAD]: 2000, // 2 seconds
  [MetricType.USER_INTERACTION]: 100, // 100 ms
  [MetricType.CUSTOM]: 1000, // 1 second
};

class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private metricListeners: ((metric: PerformanceMetric) => void)[] = [];
  private isEnabled: boolean = true;
  private isDebugMode: boolean = false;
  private maxMetricsStored: number = 1000;
  private apiRequestTimings = new Map<string, number>();

  constructor() {
    // Initialize web vitals if in browser environment
    if (typeof window !== "undefined") {
      this.initWebVitals();
    }
  }

  // Enable or disable performance monitoring
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Set debug mode
  public setDebugMode(debug: boolean): void {
    this.isDebugMode = debug;
  }

  // Record a performance metric
  public recordMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    // Add to metrics array
    this.metrics.push(metric);

    // Trim metrics array if it gets too large
    if (this.metrics.length > this.maxMetricsStored) {
      this.metrics = this.metrics.slice(-this.maxMetricsStored);
    }

    // Notify listeners
    this.notifyListeners(metric);

    // Log slow operations based on thresholds
    this.checkPerformanceThreshold(metric);

    // Debug logging
    if (this.isDebugMode) {
      console.debug(
        `[Performance] ${metric.type}: ${
          metric.name
        } - ${metric.duration.toFixed(2)}ms`,
        metric.metadata
      );
    }
  }

  // Start timing an API request
  public startApiRequest(requestId: string): void {
    if (!this.isEnabled) return;
    this.apiRequestTimings.set(requestId, performance.now());
  }

  // End timing an API request and record the metric
  public endApiRequest(
    requestId: string,
    metadata: Record<string, any> = {}
  ): number | null {
    if (!this.isEnabled) return null;

    const startTime = this.apiRequestTimings.get(requestId);
    if (!startTime) return null;

    const duration = performance.now() - startTime;
    this.apiRequestTimings.delete(requestId);

    this.recordMetric({
      type: MetricType.API_REQUEST,
      name: metadata.url || requestId,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    return duration;
  }

  // Record a page load metric
  public recordPageLoad(
    pageName: string,
    metadata: Record<string, any> = {}
  ): void {
    if (!this.isEnabled || typeof window === "undefined") return;

    // Use Navigation Timing API if available
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;

      if (loadTime > 0) {
        this.recordMetric({
          type: MetricType.PAGE_LOAD,
          name: pageName,
          duration: loadTime,
          timestamp: Date.now(),
          metadata: {
            ...metadata,
            domContentLoaded:
              timing.domContentLoadedEventEnd - timing.navigationStart,
            firstPaint: timing.responseEnd - timing.navigationStart,
          },
        });
      }
    }
  }

  // Record a component render metric
  public recordComponentRender(
    componentName: string,
    duration: number,
    metadata: Record<string, any> = {}
  ): void {
    if (!this.isEnabled) return;

    this.recordMetric({
      type: MetricType.COMPONENT_RENDER,
      name: componentName,
      duration,
      timestamp: Date.now(),
      metadata,
    });
  }

  // Record a custom metric
  public recordCustomMetric(
    name: string,
    duration: number,
    metadata: Record<string, any> = {}
  ): void {
    if (!this.isEnabled) return;

    this.recordMetric({
      type: MetricType.CUSTOM,
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    });
  }

  // Get all recorded metrics
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Get metrics by type
  public getMetricsByType(type: MetricType): PerformanceMetric[] {
    return this.metrics.filter((metric) => metric.type === type);
  }

  // Add a metric listener
  public addMetricListener(
    listener: (metric: PerformanceMetric) => void
  ): void {
    this.metricListeners.push(listener);
  }

  // Remove a metric listener
  public removeMetricListener(
    listener: (metric: PerformanceMetric) => void
  ): void {
    this.metricListeners = this.metricListeners.filter((l) => l !== listener);
  }

  // Clear all metrics
  public clearMetrics(): void {
    this.metrics = [];
  }

  // Private methods
  private notifyListeners(metric: PerformanceMetric): void {
    this.metricListeners.forEach((listener) => listener(metric));
  }

  private checkPerformanceThreshold(metric: PerformanceMetric): void {
    const threshold = PERFORMANCE_THRESHOLDS[metric.type];
    if (threshold && metric.duration > threshold) {
      console.warn(
        `[Performance Warning] Slow ${metric.type}: ${
          metric.name
        } - ${metric.duration.toFixed(2)}ms`
      );

      // Show toast for extremely slow operations (3x threshold)
      if (metric.duration > threshold * 3) {
        toast.error(
          `Performance issue detected: ${
            metric.name
          } took ${metric.duration.toFixed(0)}ms`
        );
      }
    }
  }

  private initWebVitals(): void {
    // This is a placeholder for web vitals integration
    // You can add web-vitals library integration here
  }
}

export const performanceMonitoringService = new PerformanceMonitoringService();
export default performanceMonitoringService;
