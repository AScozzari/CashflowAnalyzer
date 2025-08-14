/**
 * Performance Monitoring for EasyCashFlows
 * Tracks and optimizes application performance with real-time metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'timer' | 'counter' | 'gauge';
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private maxMetrics = 1000;

  constructor() {
    this.initializeObservers();
    this.startMemoryMonitoring();
  }

  /**
   * Record a custom performance metric
   */
  record(name: string, value: number, type: PerformanceMetric['type'] = 'gauge'): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      type
    };

    this.metrics.push(metric);
    
    // Limit metrics array size
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    console.log(`[PERF] ${name}: ${value}${type === 'timer' ? 'ms' : ''}`);
  }

  /**
   * Start timing an operation
   */
  startTimer(name: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.record(name, duration, 'timer');
    };
  }

  /**
   * Get performance metrics
   */
  getMetrics(filter?: { name?: string; type?: PerformanceMetric['type']; since?: number }): PerformanceMetric[] {
    let filtered = this.metrics;

    if (filter) {
      if (filter.name) {
        filtered = filtered.filter(m => m.name.includes(filter.name!));
      }
      if (filter.type) {
        filtered = filtered.filter(m => m.type === filter.type);
      }
      if (filter.since) {
        filtered = filtered.filter(m => m.timestamp >= filter.since!);
      }
    }

    return filtered;
  }

  /**
   * Get memory usage information
   */
  getMemoryInfo(): MemoryInfo | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  /**
   * Get page load metrics
   */
  getPageLoadMetrics(): Record<string, number> {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (!navigation) return {};

    return {
      dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpConnection: navigation.connectEnd - navigation.connectStart,
      tlsNegotiation: navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : 0,
      serverResponse: navigation.responseStart - navigation.requestStart,
      contentDownload: navigation.responseEnd - navigation.responseStart,
      domParsing: navigation.domContentLoadedEventStart - navigation.responseEnd,
      resourceLoading: navigation.loadEventStart - navigation.domContentLoadedEventStart,
      totalPageLoad: navigation.loadEventEnd - navigation.navigationStart
    };
  }

  /**
   * Get Core Web Vitals
   */
  getCoreWebVitals(): Promise<Record<string, number>> {
    return new Promise((resolve) => {
      const vitals: Record<string, number> = {};

      // First Contentful Paint (FCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcp) {
          vitals.firstContentfulPaint = fcp.startTime;
        }
      }).observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          vitals.largestContentfulPaint = entries[entries.length - 1].startTime;
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        vitals.cumulativeLayoutShift = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });

      // First Input Delay (FID)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          vitals.firstInputDelay = (entries[0] as any).processingStart - entries[0].startTime;
        }
      }).observe({ entryTypes: ['first-input'] });

      // Return vitals after a delay to allow collection
      setTimeout(() => resolve(vitals), 3000);
    });
  }

  /**
   * Monitor React component performance
   */
  measureComponentRender<T>(componentName: string, renderFn: () => T): T {
    const endTimer = this.startTimer(`component.${componentName}.render`);
    try {
      const result = renderFn();
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      this.record(`component.${componentName}.error`, 1, 'counter');
      throw error;
    }
  }

  /**
   * Monitor API request performance
   */
  async measureApiRequest<T>(endpoint: string, requestFn: () => Promise<T>): Promise<T> {
    const endTimer = this.startTimer(`api.${endpoint.replace(/\//g, '.')}.request`);
    try {
      const result = await requestFn();
      endTimer();
      this.record(`api.${endpoint.replace(/\//g, '.')}.success`, 1, 'counter');
      return result;
    } catch (error) {
      endTimer();
      this.record(`api.${endpoint.replace(/\//g, '.')}.error`, 1, 'counter');
      throw error;
    }
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    memoryUsage: MemoryInfo | null;
    averageRenderTime: number;
    apiRequestCount: number;
    errorCount: number;
    cacheHitRate: number;
  } {
    const memory = this.getMemoryInfo();
    const renderMetrics = this.getMetrics({ name: 'component', type: 'timer' });
    const apiSuccess = this.getMetrics({ name: 'api', type: 'counter' }).filter(m => m.name.includes('success'));
    const errors = this.getMetrics({ type: 'counter' }).filter(m => m.name.includes('error'));
    const cacheHits = this.getMetrics({ name: 'cache.hit' });
    const cacheMisses = this.getMetrics({ name: 'cache.miss' });

    const averageRenderTime = renderMetrics.length > 0 
      ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length 
      : 0;

    const totalCache = cacheHits.length + cacheMisses.length;
    const cacheHitRate = totalCache > 0 ? (cacheHits.length / totalCache) * 100 : 0;

    return {
      memoryUsage: memory,
      averageRenderTime,
      apiRequestCount: apiSuccess.length,
      errorCount: errors.length,
      cacheHitRate
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  private initializeObservers(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      // Observe resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 100) { // Only log slow resources
            this.record(`resource.${entry.name.split('/').pop()}`, entry.duration, 'timer');
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Observe navigation
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const nav = entry as PerformanceNavigationTiming;
          this.record('navigation.domContentLoaded', nav.domContentLoadedEventEnd - nav.navigationStart, 'timer');
          this.record('navigation.loadComplete', nav.loadEventEnd - nav.navigationStart, 'timer');
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    }
  }

  private startMemoryMonitoring(): void {
    setInterval(() => {
      const memory = this.getMemoryInfo();
      if (memory) {
        this.record('memory.used', memory.usedJSHeapSize, 'gauge');
        this.record('memory.total', memory.totalJSHeapSize, 'gauge');
        
        // Alert if memory usage is high
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (usagePercent > 80) {
          console.warn(`[PERF] High memory usage: ${usagePercent.toFixed(1)}%`);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for React components
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return (props: P) => {
    return performanceMonitor.measureComponentRender(componentName, () => 
      React.createElement(Component, props)
    );
  };
};

export default performanceMonitor;