import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Hook per la memorizzazione ottimizzata dei risultati delle query
export const useOptimizedQuery = <T,>(data: T, dependencies: unknown[]) => {
  return useMemo(() => data, dependencies);
};

// Hook per callback ottimizzati
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  dependencies: unknown[]
): T => {
  return useCallback(callback, dependencies);
};

// Hook per il debouncing degli input
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook per il monitoraggio delle performance
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const endTime = Date.now();
    const renderTime = endTime - startTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERFORMANCE] ${componentName} render #${renderCount.current} - ${renderTime}ms`);
    }
    
    startTime.current = endTime;
  });

  return {
    renderCount: renderCount.current,
    logPerformance: (operation: string, duration: number) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PERFORMANCE] ${componentName} - ${operation}: ${duration}ms`);
      }
    }
  };
};

// Hook per il lazy loading dei componenti
export const useLazyComponent = (importFn: () => Promise<any>) => {
  const [Component, setComponent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    
    importFn()
      .then((module) => {
        if (mounted) {
          setComponent(() => module.default || module);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [importFn]);

  return { Component, loading, error };
};