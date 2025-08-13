import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

console.log('[MAIN] EasyCashFlows initializing... v2024.08.13.CRASH-PROOF');

// CRASH-PROOF: Global error handlers
window.addEventListener('error', (event) => {
  console.error('[MAIN] Global error:', event.error);
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[MAIN] Unhandled rejection:', event.reason);
  event.preventDefault();
});

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

    // DYNAMIC IMPORT: Choose app version based on URL
    const useSimpleApp = window.location.search.includes('app=simple') || window.location.search.includes('debug=simple');
    
    let AppComponent;
    if (useSimpleApp) {
      console.log('[MAIN] Loading simple test app...');
      const module = await import("./App-simple");
      AppComponent = module.default;
    } else {
      console.log('[MAIN] Loading full app...');
      const module = await import("./App");
      AppComponent = module.default;
    }

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

// SERVICE WORKER: Non-blocking registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('[SW] Registered:', registration))
      .catch(error => console.log('[SW] Registration failed:', error));
  });
}