import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

console.log('[MAIN-CLEAN] Starting clean React app without PWA...');

// FIX REFRESH SIG: Ensure HMR is properly initialized
if (import.meta.hot) {
  // Initialize React Refresh globals before importing App
  if (!(window as any).__vite_plugin_react_preamble_installed__) {
    // Fix missing HMR initialization
    (window as any).$RefreshReg$ = () => {};
    (window as any).$RefreshSig$ = () => (type: any) => type;
    (window as any).__vite_plugin_react_preamble_installed__ = true;
  }
}

// SIMPLE DIRECT IMPORT: Back to simple approach
import App from "./App";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(<App />);

console.log('[MAIN-CLEAN] ✅ Clean app rendered successfully');