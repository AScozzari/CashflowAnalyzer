// IMPORT HMR DISABLE FIRST
import "./hmr-disable";

import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// HMR COMPLETE OVERRIDE BEFORE ANY REACT CODE
if (typeof window !== 'undefined') {
  // Define safe no-op functions BEFORE they are called
  window.$RefreshReg$ = () => () => {};
  window.$RefreshSig$ = () => (type: any) => type;
  window.__vite_plugin_react_preamble_installed__ = true;
  
  // Disable HMR if available
  if (import.meta.hot) {
    try {
      import.meta.hot.decline();
    } catch (e) {
      console.log('[MAIN] HMR decline failed (expected):', e);
    }
  }
}

console.log('[MAIN] EasyCashFlows initializing with HMR disabled...');

// APP INITIALIZATION
async function initializeApp() {
  try {
    console.log('[MAIN] Starting app initialization...');
    
    // Import App component
    const { default: AppComponent } = await import("./App");
    console.log('[MAIN] App component loaded:', typeof AppComponent);
    
    // Get root container
    const container = document.getElementById("root");
    if (!container) {
      throw new Error("Root container not found");
    }
    console.log('[MAIN] Root container found');

    // Create React root
    const root = createRoot(container);
    console.log('[MAIN] React root created');
    
    // Render app
    root.render(
      <React.StrictMode>
        <AppComponent />
      </React.StrictMode>
    );
    console.log('[MAIN] ✅ App rendered successfully');
    
    // Verify content after render
    setTimeout(() => {
      const content = container.innerHTML;
      if (content && content.length > 50) {
        console.log('[MAIN] ✅ Content verified - app is working');
      } else {
        console.warn('[MAIN] ⚠️ No content detected');
        container.innerHTML = `
          <div style="padding:20px;text-align:center;font-family:Arial;">
            <h1 style="color:#2563eb;">🏦 EasyCashFlows</h1>
            <p>Fallback render - React component may have failed</p>
            <button onclick="window.location.reload()" style="padding:10px 20px;background:#2563eb;color:white;border:none;border-radius:5px;">Ricarica</button>
          </div>
        `;
      }
    }, 1000);
    
  } catch (error) {
    console.error('[MAIN] ❌ App initialization failed:', error);
    const container = document.getElementById("root");
    if (container) {
      container.innerHTML = `
        <div style="padding:20px;color:red;font-family:Arial;">
          <h1>Errore di Inizializzazione</h1>
          <p>Errore: ${String(error)}</p>
          <button onclick="window.location.reload()" style="padding:10px 20px;background:#dc2626;color:white;border:none;border-radius:5px;">Ricarica Pagina</button>
        </div>
      `;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('[MAIN] Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[MAIN] Unhandled rejection:', event.reason);
});
