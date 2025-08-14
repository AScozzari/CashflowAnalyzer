/**
 * React Hook for Cache Management
 * Provides easy-to-use cache functionality in React components
 */

import { useState, useEffect, useCallback } from 'react';
import { cacheManager, cacheHelpers } from '@/lib/cache-manager';

interface UseCacheOptions {
  ttl?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface CacheHookReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
  isStale: boolean;
}

/**
 * Hook for caching data with automatic loading and refresh
 */
export function useCache<T>(
  key: string,
  loader: () => Promise<T>,
  options: UseCacheOptions = {}
): CacheHookReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  const { ttl, autoRefresh = false, refreshInterval = 5 * 60 * 1000 } = options;

  const loadData = useCallback(async () => {
    // Check cache first
    const cached = cacheManager.get(key);
    if (cached) {
      setData(cached);
      setIsStale(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await loader();
      setData(result);
      setIsStale(false);
      cacheManager.set(key, result, ttl);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error(`[CACHE HOOK] Failed to load data for key: ${key}`, error);
    } finally {
      setIsLoading(false);
    }
  }, [key, loader, ttl]);

  const refetch = useCallback(async () => {
    cacheManager.delete(key);
    await loadData();
  }, [key, loadData]);

  const invalidate = useCallback(() => {
    cacheManager.delete(key);
    setData(null);
    setIsStale(true);
  }, [key]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        setIsStale(true);
        loadData();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, loadData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidate,
    isStale
  };
}

/**
 * Hook for caching API responses with TanStack Query integration
 */
export function useApiCache(endpoint: string, options: UseCacheOptions = {}) {
  const loader = useCallback(async () => {
    const response = await fetch(`/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }, [endpoint]);

  return useCache(`api:${endpoint}`, loader, options);
}

/**
 * Hook for batch cache operations
 */
export function useBatchCache() {
  const [operations, setOperations] = useState<Array<{ key: string; loader: () => Promise<any>; ttl?: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [completed, setCompleted] = useState(0);

  const addOperation = useCallback((key: string, loader: () => Promise<any>, ttl?: number) => {
    setOperations(prev => [...prev, { key, loader, ttl }]);
  }, []);

  const execute = useCallback(async () => {
    if (operations.length === 0) return;

    setIsLoading(true);
    setCompleted(0);

    const promises = operations.map(async ({ key, loader, ttl }, index) => {
      try {
        if (!cacheManager.has(key)) {
          const data = await loader();
          cacheManager.set(key, data, ttl);
        }
        setCompleted(prev => prev + 1);
      } catch (error) {
        console.error(`[BATCH CACHE] Failed to load ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
    setIsLoading(false);
    setOperations([]);
  }, [operations]);

  const clear = useCallback(() => {
    setOperations([]);
    setCompleted(0);
  }, []);

  return {
    addOperation,
    execute,
    clear,
    isLoading,
    progress: operations.length > 0 ? (completed / operations.length) * 100 : 0,
    totalOperations: operations.length
  };
}

/**
 * Hook for cache statistics and management
 */
export function useCacheManager() {
  const [stats, setStats] = useState(cacheManager.getStats());

  const refreshStats = useCallback(() => {
    setStats(cacheManager.getStats());
  }, []);

  const clearAll = useCallback(() => {
    cacheManager.clear();
    refreshStats();
  }, [refreshStats]);

  const invalidatePattern = useCallback((pattern: RegExp) => {
    const count = cacheManager.invalidatePattern(pattern);
    refreshStats();
    return count;
  }, [refreshStats]);

  const invalidateApi = useCallback(() => {
    const count = cacheHelpers.invalidateApiCache();
    refreshStats();
    return count;
  }, [refreshStats]);

  useEffect(() => {
    const interval = setInterval(refreshStats, 5000); // Update stats every 5 seconds
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    stats,
    clearAll,
    invalidatePattern,
    invalidateApi,
    refreshStats,
    cacheManager
  };
}

export default useCache;