import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

console.log('[MAIN-SAFE] Starting EasyCashFlows in safe mode...');

// COMPLETELY DISABLE ALL HMR FUNCTIONALITY
(window as any).$RefreshReg$ = function() { return function() {}; };
(window as any).$RefreshSig$ = function() { return function(type: any) { return type; }; };
(window as any).__vite_plugin_react_preamble_installed__ = true;

// SIMPLE ERROR HANDLERS
window.addEventListener('error', (event) => {
  console.error('[MAIN-SAFE] Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[MAIN-SAFE] Rejection:', event.reason);
});

// DIRECT APP IMPORT - USE WORKING VERSION
import App from "./App-working";

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