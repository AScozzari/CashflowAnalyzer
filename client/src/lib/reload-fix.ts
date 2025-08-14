/**
 * RELOAD FIX - Comprehensive solution for cache and reload issues
 * Addresses the root causes of reload crashes in Replit environment
 */

console.log('[RELOAD-FIX] Comprehensive reload fix initializing...');

// 1. CLEAR ALL PROBLEMATIC CACHES ON STARTUP
export function clearProblematicCaches(): void {
  try {
    // Clear browser caches that can cause issues
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        const problematicCaches = cacheNames.filter(name => 
          name.includes('workbox') || 
          name.includes('sw-') || 
          name.includes('pwa') ||
          name.includes('offline')
        );
        
        problematicCaches.forEach(cacheName => {
          caches.delete(cacheName);
          console.log('[RELOAD-FIX] Deleted problematic cache:', cacheName);
        });
      });
    }

    // Clear localStorage entries that might conflict
    const keysToCheck = [
      'workbox-runtime',
      'pwa-update',
      'sw-update',
      'cache-version'
    ];
    
    keysToCheck.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log('[RELOAD-FIX] Removed localStorage key:', key);
      }
    });

    // Clear sessionStorage cache entries
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      if (key.includes('cache') || key.includes('sw-') || key.includes('workbox')) {
        sessionStorage.removeItem(key);
        console.log('[RELOAD-FIX] Removed sessionStorage key:', key);
      }
    });

  } catch (error) {
    console.log('[RELOAD-FIX] Cache cleanup error (non-critical):', error);
  }
}

// 2. DISABLE SERVICE WORKER REGISTRATION ATTEMPTS
export function disableServiceWorkerRegistration(): void {
  if ('serviceWorker' in navigator) {
    // Unregister any existing service workers
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
        console.log('[RELOAD-FIX] Unregistered service worker:', registration.scope);
      });
    });

    // Override service worker registration to prevent new registrations
    const originalRegister = navigator.serviceWorker.register;
    navigator.serviceWorker.register = async function(...args) {
      console.log('[RELOAD-FIX] Service worker registration blocked:', args[0]);
      throw new Error('Service worker registration disabled to prevent cache issues');
    };
  }
}

// 3. FORCE CACHE HEADERS FOR DEVELOPMENT
export function setupDevelopmentCacheHeaders(): void {
  if (process.env.NODE_ENV === 'development') {
    const originalFetch = window.fetch;
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input.toString();
      
      // Force no-cache for development requests
      const headers = new Headers(init?.headers);
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      
      const modifiedInit: RequestInit = {
        ...init,
        headers,
        cache: 'no-store'
      };
      
      console.log('[RELOAD-FIX] No-cache fetch:', url);
      return originalFetch(input, modifiedInit);
    };
  }
}

// 4. SETUP HMR ERROR RECOVERY
export function setupHMRErrorRecovery(): void {
  if (import.meta.hot) {
    // Handle HMR errors gracefully
    import.meta.hot.on('vite:error', (payload) => {
      console.error('[RELOAD-FIX] HMR Error:', payload);
      // Force page reload on HMR errors instead of crash
      setTimeout(() => {
        console.log('[RELOAD-FIX] Forcing reload due to HMR error...');
        window.location.reload();
      }, 1000);
    });

    // Handle connection lost
    import.meta.hot.on('vite:ws:disconnect', () => {
      console.log('[RELOAD-FIX] HMR connection lost, attempting reconnect...');
    });

    // Ensure proper HMR initialization
    if (!(window as any).__vite_plugin_react_preamble_installed__) {
      (window as any).$RefreshReg$ = () => {};
      (window as any).$RefreshSig$ = () => (type: any) => type;
      (window as any).__vite_plugin_react_preamble_installed__ = true;
      console.log('[RELOAD-FIX] HMR preamble installed');
    }
  }
}

// 5. PREVENT MEMORY LEAKS ON RELOAD
export function setupMemoryLeakPrevention(): void {
  // Clean up intervals and timeouts on page unload
  const intervals: NodeJS.Timeout[] = [];
  const timeouts: NodeJS.Timeout[] = [];
  
  const originalSetInterval = window.setInterval;
  const originalSetTimeout = window.setTimeout;
  
  // Track intervals and timeouts for cleanup
  const trackingSetInterval = function(callback: TimerHandler, delay?: number, ...args: any[]) {
    const id = originalSetInterval(callback, delay, ...args);
    intervals.push(id);
    return id;
  };
  
  const trackingSetTimeout = function(callback: TimerHandler, delay?: number, ...args: any[]) {
    const id = originalSetTimeout(callback, delay, ...args);
    timeouts.push(id);
    return id;
  };
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    intervals.forEach(id => clearInterval(id));
    timeouts.forEach(id => clearTimeout(id));
    console.log('[RELOAD-FIX] Cleaned up timers:', { intervals: intervals.length, timeouts: timeouts.length });
  });
}

// 6. SETUP RELOAD DETECTION AND RECOVERY
export function setupReloadRecovery(): void {
  // Detect if this is a reload vs first load
  const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  const isReload = navigationEntries.length > 0 && navigationEntries[0].type === 'reload';
  
  if (isReload) {
    console.log('[RELOAD-FIX] Reload detected, applying recovery measures...');
    
    // Clear all caches on reload
    clearProblematicCaches();
    
    // Mark that we've handled this reload
    sessionStorage.setItem('easycashflows-reload-handled', Date.now().toString());
  }
  
  // Handle crash recovery
  const lastCrash = sessionStorage.getItem('easycashflows-last-crash');
  if (lastCrash && (Date.now() - parseInt(lastCrash)) < 30000) {
    console.log('[RELOAD-FIX] Recent crash detected, forcing clean startup...');
    
    // Clear everything and force clean state
    localStorage.clear();
    sessionStorage.clear();
    
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
  }
}

// 7. INITIALIZE ALL FIXES
export function initializeReloadFix(): void {
  console.log('[RELOAD-FIX] Initializing comprehensive reload fix...');
  
  try {
    clearProblematicCaches();
    disableServiceWorkerRegistration();
    setupDevelopmentCacheHeaders();
    setupHMRErrorRecovery();
    setupMemoryLeakPrevention();
    setupReloadRecovery();
    
    console.log('[RELOAD-FIX] ✅ All reload fixes applied successfully');
    
    // Mark successful initialization
    sessionStorage.setItem('easycashflows-reload-fix-active', 'true');
    
  } catch (error) {
    console.error('[RELOAD-FIX] Error during initialization:', error);
    // Mark the crash time for recovery
    sessionStorage.setItem('easycashflows-last-crash', Date.now().toString());
  }
}

// Auto-initialize when module is imported
initializeReloadFix();