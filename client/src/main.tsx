import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// FIX REFRESH RUNTIME ERROR: Disable HMR to prevent crashes
if (import.meta.hot) {
  // Disable HMR refresh to prevent RefreshRuntime errors
  import.meta.hot.accept(() => {
    // Prevent automatic refresh on changes
    console.log('[MAIN] HMR change detected but refresh disabled to prevent crashes');
  });
  
  // Override problematic globals
  try {
    (window as any).$RefreshReg$ = () => {};
    (window as any).$RefreshSig$ = () => (type: any) => type;
    (window as any).__vite_plugin_react_preamble_installed__ = true;
    console.log('[MAIN] HMR globals overridden safely');
  } catch (e) {
    console.log('[MAIN] HMR override failed, continuing without HMR');
  }
}

console.log('[MAIN] EasyCashFlows initializing... v2024.08.14.HMR-FIXED');

// SIMPLE ERROR HANDLERS
window.addEventListener('error', (event) => {
  console.error('[MAIN] Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[MAIN] Unhandled rejection:', event.reason);
});

// SIMPLE CACHE CLEANUP
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      if (cacheName.includes('workbox') || cacheName.includes('sw-')) {
        caches.delete(cacheName);
        console.log('[CACHE] Cleaned problematic cache:', cacheName);
      }
    });
  });
}

// DYNAMIC APP LOADING: Load appropriate app version
const initializeApp = async () => {
  try {
    console.log('[MAIN] Starting app initialization...');
    
    const container = document.getElementById("root");
    if (!container) {
      console.error('[MAIN] Root element not found');
      document.body.innerHTML = '<div style="padding:20px;text-align:center;"><h1>🏦 EasyCashFlows</h1><p style="color:red;">Errore: Root element non trovato</p><button onclick="window.location.reload()">Ricarica</button></div>';
      return;
    }

    console.log('[MAIN] Root found, checking React...');
    
    // SAFETY: Verify React availability
    if (!React || !createRoot) {
      console.error('[MAIN] React/createRoot not available');
      container.innerHTML = '<div style="padding:20px;text-align:center;"><h1>🏦 EasyCashFlows</h1><p style="color:red;">Errore: React non disponibile</p><button onclick="window.location.reload()">Ricarica</button></div>';
      return;
    }

    // Switch back to full app now that HMR is fixed
    console.log('[MAIN] Loading full app with HMR fix...');
    const module = await import("./App");
    const AppComponent = module.default;

    console.log('[MAIN] Creating React root...');
    const root = createRoot(container);
    
    console.log('[MAIN] Rendering App component...');
    root.render(
      <React.StrictMode>
        <AppComponent />
      </React.StrictMode>
    );
    
    console.log('[MAIN] ✅ App rendered successfully');

  } catch (error) {
    console.error('[MAIN] Critical initialization error:', error);
    const container = document.getElementById("root");
    if (container) {
      container.innerHTML = `
        <div style="padding:20px;text-align:center;font-family:Arial;">
          <h1>🏦 EasyCashFlows</h1>
          <h2 style="color:red;">Errore di Inizializzazione</h2>
          <p>Errore: ${error instanceof Error ? error.message : String(error)}</p>
          <button onclick="window.location.reload()" style="padding:10px 20px;background:#4CAF50;color:white;border:none;border-radius:5px;cursor:pointer;">
            Ricarica Pagina
          </button>
        </div>
      `;
    }
  }
};

// TIMING: Multiple initialization strategies
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM already ready
  initializeApp();
}

// SERVICE WORKER: DISABLED - Causing cache crash on reload
// TODO: Re-implement service worker when needed for offline functionality
console.log('[SW] Service Worker disabled to prevent cache crashes');