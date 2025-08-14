import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

console.log('[MAIN-SAFE] Starting EasyCashFlows in completely safe mode...');

// NUCLEAR OPTION: Override ALL possible HMR functions before any React code loads
if (typeof window !== 'undefined') {
  // Pre-emptively define all HMR functions as no-ops
  (window as any).$RefreshReg$ = () => () => {};
  (window as any).$RefreshSig$ = () => (type: any) => type;
  (window as any).__vite_plugin_react_preamble_installed__ = true;
  
  // Override React Refresh at the core
  (window as any).__react_refresh_utils__ = {
    injectIntoGlobalHook: () => {},
    register: () => {},
    signature: () => () => {}
  };
  
  // Disable hot updates completely
  if (import.meta.hot) {
    import.meta.hot.decline();
  }
}

// SIMPLE ERROR HANDLERS
window.addEventListener('error', (event) => {
  console.error('[MAIN-SAFE] Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[MAIN-SAFE] Rejection:', event.reason);
});

// SIMPLEST POSSIBLE APP - NO JSX TRANSFORMS
import App from "./simple-app";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

console.log('[MAIN-SAFE] Creating React root...');
const root = createRoot(container);

console.log('[MAIN-SAFE] Rendering app...');
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('[MAIN-SAFE] ✅ App rendered successfully');