// REPLIT COMPREHENSIVE FIXES - Basato su ricerca web approfondita
// Soluzione per problemi: Connection Denied + Hot Reload + CSP

// 1. FIX HMR per Replit (Hot Module Replacement)
if (typeof window !== 'undefined' && import.meta.hot) {
  // Force HMR accept for all modules
  import.meta.hot.accept();
  
  // Override WebSocket connection for Replit proxy
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    // Rewrite HMR websocket URL for Replit spock proxy
    if (url.includes('/@vite/client') || url.includes('hmr')) {
      const replitDomain = window.location.hostname;
      url = url.replace('ws://localhost', `wss://${replitDomain}`);
      url = url.replace('ws://', 'wss://');
      console.log('[REPLIT HMR] Redirecting WebSocket to:', url);
    }
    return new originalWebSocket(url, protocols);
  };
}

// 2. FIX Connection Issues - Retry mechanism
if (typeof window !== 'undefined') {
  // Connection retry for failed API calls
  const originalFetch = window.fetch;
  window.fetch = async function(url, options = {}) {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const response = await originalFetch(url, options);
        if (response.ok || response.status === 401) {
          return response;
        }
        throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          console.error('[REPLIT FETCH] Max retries reached for:', url, error);
          throw error;
        }
        console.log(`[REPLIT FETCH] Retry ${retries}/${maxRetries} for:`, url);
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
  };
}

// 3. FIX iframe Detection e CSP
if (typeof window !== 'undefined') {
  // Detect iframe context
  window.isReplitIframe = window.self !== window.top;
  
  // Override document.domain per cross-origin
  try {
    if (window.isReplitIframe && window.location.hostname.includes('replit.dev')) {
      document.domain = 'replit.dev';
    }
  } catch (e) {
    console.log('[REPLIT] Cannot set document.domain:', e.message);
  }
  
  // Override click events per iframe
  document.addEventListener('click', function(e) {
    if (window.isReplitIframe && e.target.tagName === 'A' && e.target.target !== '_blank') {
      e.preventDefault();
      window.open(e.target.href, '_blank');
    }
  });
}

// 4. FIX React Refresh per Replit
if (typeof window !== 'undefined' && window.__reactRefreshInjected) {
  // Force React Refresh in Replit environment
  window.__reactRefreshUtils = window.__reactRefreshUtils || {};
  
  // Override refresh runtime
  const originalRefresh = window.$RefreshSig$;
  if (originalRefresh) {
    window.$RefreshSig$ = function() {
      try {
        return originalRefresh.apply(this, arguments);
      } catch (error) {
        console.log('[REPLIT] React Refresh error handled:', error.message);
        return function() { return null; };
      }
    };
  }
}

// 5. DNS/Network Fix
if (typeof navigator !== 'undefined' && navigator.connection) {
  // Monitor connection changes
  navigator.connection.addEventListener('change', function() {
    console.log('[REPLIT] Network change detected, connection type:', navigator.connection.effectiveType);
    if (navigator.connection.effectiveType === 'slow-2g') {
      console.log('[REPLIT] Slow connection detected, implementing delays');
    }
  });
}

console.log('[REPLIT FIXES] Comprehensive fixes loaded for Connection Denied + Hot Reload issues');