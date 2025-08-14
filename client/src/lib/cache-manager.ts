/**
 * Advanced Cache Manager for EasyCashFlows
 * Handles intelligent caching, cache invalidation, and storage optimization
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: string;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  version: string;
}

class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private storage: Storage;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 100, // Maximum number of entries
      defaultTTL: 5 * 60 * 1000, // 5 minutes default
      version: '1.0.0',
      ...config
    };
    
    // Use sessionStorage for temporary cache, localStorage for persistent
    this.storage = window.sessionStorage;
    this.loadFromStorage();
    this.setupCleanup();
  }

  /**
   * Store data in cache with optional TTL
   */
  set(key: string, data: any, ttl?: number): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      version: this.config.version
    };

    // Enforce size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
    this.saveToStorage(key, entry);
    
    console.log(`[CACHE] Stored: ${key} (TTL: ${entry.ttl}ms)`);
  }

  /**
   * Retrieve data from cache if valid
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log(`[CACHE] Miss: ${key}`);
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key);
      console.log(`[CACHE] Expired: ${key}`);
      return null;
    }

    // Check version compatibility
    if (entry.version !== this.config.version) {
      this.delete(key);
      console.log(`[CACHE] Version mismatch: ${key}`);
      return null;
    }

    console.log(`[CACHE] Hit: ${key}`);
    return entry.data;
  }

  /**
   * Check if cache entry exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry) && entry.version === this.config.version;
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.removeFromStorage(key);
      console.log(`[CACHE] Deleted: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.clearStorage();
    console.log('[CACHE] Cleared all entries');
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hits: number; misses: number; hitRate: string } {
    // This would need hit/miss counters in a real implementation
    return {
      size: this.cache.size,
      hits: 0,
      misses: 0,
      hitRate: '0%'
    };
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.delete(key);
        count++;
      }
    }
    console.log(`[CACHE] Invalidated ${count} entries matching pattern: ${pattern}`);
    return count;
  }

  /**
   * Preload cache with critical data
   */
  async preload(preloadFunctions: Array<{ key: string; loader: () => Promise<any>; ttl?: number }>): Promise<void> {
    const promises = preloadFunctions.map(async ({ key, loader, ttl }) => {
      try {
        if (!this.has(key)) {
          const data = await loader();
          this.set(key, data, ttl);
        }
      } catch (error) {
        console.error(`[CACHE] Preload failed for ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log(`[CACHE] Preload completed for ${preloadFunctions.length} entries`);
  }

  // Private methods

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictOldest(): void {
    let oldest: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldest = key;
      }
    }

    if (oldest) {
      this.delete(oldest);
      console.log(`[CACHE] Evicted oldest entry: ${oldest}`);
    }
  }

  private setupCleanup(): void {
    // Clean expired entries every 2 minutes
    setInterval(() => {
      const now = Date.now();
      const toDelete: string[] = [];

      for (const [key, entry] of this.cache.entries()) {
        if (this.isExpired(entry)) {
          toDelete.push(key);
        }
      }

      toDelete.forEach(key => this.delete(key));
      
      if (toDelete.length > 0) {
        console.log(`[CACHE] Cleaned ${toDelete.length} expired entries`);
      }
    }, 2 * 60 * 1000);
  }

  private loadFromStorage(): void {
    try {
      const stored = this.storage.getItem('easycashflows-cache');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([key, entry]) => {
          this.cache.set(key, entry as CacheEntry);
        });
        console.log(`[CACHE] Loaded ${Object.keys(data).length} entries from storage`);
      }
    } catch (error) {
      console.error('[CACHE] Failed to load from storage:', error);
    }
  }

  private saveToStorage(key: string, entry: CacheEntry): void {
    try {
      const allData = this.getAllCacheData();
      allData[key] = entry;
      this.storage.setItem('easycashflows-cache', JSON.stringify(allData));
    } catch (error) {
      console.error('[CACHE] Failed to save to storage:', error);
    }
  }

  private removeFromStorage(key: string): void {
    try {
      const allData = this.getAllCacheData();
      delete allData[key];
      this.storage.setItem('easycashflows-cache', JSON.stringify(allData));
    } catch (error) {
      console.error('[CACHE] Failed to remove from storage:', error);
    }
  }

  private clearStorage(): void {
    try {
      this.storage.removeItem('easycashflows-cache');
    } catch (error) {
      console.error('[CACHE] Failed to clear storage:', error);
    }
  }

  private getAllCacheData(): Record<string, CacheEntry> {
    try {
      const stored = this.storage.getItem('easycashflows-cache');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('[CACHE] Failed to get cache data:', error);
      return {};
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager({
  maxSize: 150,
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  version: '2024.08.14'
});

// Cache keys constants
export const CACHE_KEYS = {
  MOVEMENTS: 'api/movements',
  ANALYTICS: 'api/analytics/stats',
  NOTIFICATIONS: 'api/notifications',
  COMPANIES: 'api/companies',
  USER_PROFILE: 'api/auth/user',
  AI_SESSIONS: 'api/ai/chat/sessions',
  SETTINGS: 'api/settings'
} as const;

// Helper functions for common caching patterns
export const cacheHelpers = {
  /**
   * Cache API response with automatic key generation
   */
  cacheApiResponse: (endpoint: string, data: any, ttl?: number): void => {
    const key = `api:${endpoint.replace(/\//g, ':')}`;
    cacheManager.set(key, data, ttl);
  },

  /**
   * Get cached API response
   */
  getCachedApiResponse: (endpoint: string): any | null => {
    const key = `api:${endpoint.replace(/\//g, ':')}`;
    return cacheManager.get(key);
  },

  /**
   * Invalidate all API caches
   */
  invalidateApiCache: (): number => {
    return cacheManager.invalidatePattern(/^api:/);
  },

  /**
   * Cache user-specific data
   */
  cacheUserData: (userId: string, dataType: string, data: any, ttl?: number): void => {
    const key = `user:${userId}:${dataType}`;
    cacheManager.set(key, data, ttl);
  },

  /**
   * Get cached user data
   */
  getCachedUserData: (userId: string, dataType: string): any | null => {
    const key = `user:${userId}:${dataType}`;
    return cacheManager.get(key);
  }
};

export default cacheManager;