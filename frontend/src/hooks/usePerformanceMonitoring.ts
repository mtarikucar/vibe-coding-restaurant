import { useEffect, useRef } from 'react';
import performanceMonitoringService, { MetricType } from '../services/performanceMonitoring';

/**
 * Hook for monitoring component performance
 * @param componentName Name of the component to monitor
 * @param options Additional options
 * @returns Object with performance monitoring methods
 */
export const usePerformanceMonitoring = (
  componentName: string,
  options: {
    enabled?: boolean;
    trackMount?: boolean;
    trackRender?: boolean;
    metadata?: Record<string, any>;
  } = {}
) => {
  const {
    enabled = true,
    trackMount = true,
    trackRender = true,
    metadata = {},
  } = options;

  const renderStartTime = useRef<number | null>(null);
  const mountStartTime = useRef<number | null>(null);
  const renderCount = useRef<number>(0);

  // Track component mount time
  useEffect(() => {
    if (!enabled || !trackMount) return;

    const mountEndTime = performance.now();
    if (mountStartTime.current !== null) {
      const duration = mountEndTime - mountStartTime.current;
      performanceMonitoringService.recordMetric({
        type: MetricType.COMPONENT_RENDER,
        name: `${componentName} (mount)`,
        duration,
        timestamp: Date.now(),
        metadata: {
          ...metadata,
          phase: 'mount',
        },
      });
    }

    return () => {
      // Track unmount if needed
      if (enabled) {
        const unmountStartTime = performance.now();
        performanceMonitoringService.recordMetric({
          type: MetricType.COMPONENT_RENDER,
          name: `${componentName} (unmount)`,
          duration: 0, // We don't know how long unmount takes
          timestamp: Date.now(),
          metadata: {
            ...metadata,
            phase: 'unmount',
            renderCount: renderCount.current,
          },
        });
      }
    };
  }, []);

  // Start timing for render
  if (enabled && trackRender && renderStartTime.current === null) {
    renderStartTime.current = performance.now();
    mountStartTime.current = mountStartTime.current || renderStartTime.current;
  }

  // End timing for render
  if (enabled && trackRender && renderStartTime.current !== null) {
    const renderEndTime = performance.now();
    const duration = renderEndTime - renderStartTime.current;
    
    // Only record if this isn't the first render (which is captured as mount)
    if (renderCount.current > 0) {
      performanceMonitoringService.recordMetric({
        type: MetricType.COMPONENT_RENDER,
        name: `${componentName} (render)`,
        duration,
        timestamp: Date.now(),
        metadata: {
          ...metadata,
          renderCount: renderCount.current,
          phase: 'render',
        },
      });
    }
    
    renderCount.current += 1;
    renderStartTime.current = null; // Reset for next render
  }

  // Method to manually track a specific operation within the component
  const trackOperation = (
    operationName: string,
    callback: () => any,
    operationMetadata: Record<string, any> = {}
  ) => {
    if (!enabled) return callback();

    const startTime = performance.now();
    try {
      return callback();
    } finally {
      const endTime = performance.now();
      performanceMonitoringService.recordMetric({
        type: MetricType.USER_INTERACTION,
        name: `${componentName} - ${operationName}`,
        duration: endTime - startTime,
        timestamp: Date.now(),
        metadata: {
          ...metadata,
          ...operationMetadata,
          operation: operationName,
        },
      });
    }
  };

  // Method to manually start tracking an async operation
  const trackAsyncOperation = async (
    operationName: string,
    callback: () => Promise<any>,
    operationMetadata: Record<string, any> = {}
  ) => {
    if (!enabled) return callback();

    const startTime = performance.now();
    try {
      return await callback();
    } finally {
      const endTime = performance.now();
      performanceMonitoringService.recordMetric({
        type: MetricType.USER_INTERACTION,
        name: `${componentName} - ${operationName}`,
        duration: endTime - startTime,
        timestamp: Date.now(),
        metadata: {
          ...metadata,
          ...operationMetadata,
          operation: operationName,
          async: true,
        },
      });
    }
  };

  return {
    trackOperation,
    trackAsyncOperation,
  };
};

export default usePerformanceMonitoring;
