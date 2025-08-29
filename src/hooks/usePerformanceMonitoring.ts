import { useEffect } from 'react';

interface PerformanceMetrics {
  name: string;
  duration: number;
  startTime: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public startMeasure(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${name}-start`);
    }
  }

  public endMeasure(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name, 'measure')[0];
      if (measure) {
        this.metrics.push({
          name,
          duration: measure.duration,
          startTime: measure.startTime,
        });
        
        // Clean up marks and measures
        performance.clearMarks(`${name}-start`);
        performance.clearMarks(`${name}-end`);
        performance.clearMeasures(name);
        
        // Log performance issues
        if (measure.duration > 1000) {
          console.warn(`Performance warning: ${name} took ${measure.duration.toFixed(2)}ms`);
        }
      }
    }
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public clearMetrics(): void {
    this.metrics = [];
  }

  public reportWebVitals(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          console.log(`Web Vital - ${entry.name}:`, (entry as any).value || entry.duration);
        });
      });

      try {
        observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      } catch (e) {
        console.warn('Performance Observer not supported');
      }
    }
  }
}

export const usePerformanceMonitoring = (componentName?: string) => {
  const monitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    if (componentName) {
      monitor.startMeasure(`component-${componentName}`);
      
      return () => {
        monitor.endMeasure(`component-${componentName}`);
      };
    }
  }, [componentName, monitor]);

  const measureAsyncOperation = async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    monitor.startMeasure(operationName);
    try {
      const result = await operation();
      return result;
    } finally {
      monitor.endMeasure(operationName);
    }
  };

  return {
    measureAsyncOperation,
    getMetrics: () => monitor.getMetrics(),
    clearMetrics: () => monitor.clearMetrics(),
    reportWebVitals: () => monitor.reportWebVitals(),
  };
};