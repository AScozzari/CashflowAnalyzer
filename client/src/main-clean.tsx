import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

console.log('[MAIN-CLEAN] Starting clean React app without PWA...');

// DYNAMIC IMPORT: Fix RefreshSig errors by importing App dynamically
const initApp = async () => {
  try {
    const container = document.getElementById("root");
    if (!container) {
      throw new Error("Root element not found");
    }

    // Clear any existing content and errors
    container.innerHTML = '<div style="padding:20px;text-align:center;">Caricamento...</div>';

    // Import App component dynamically to avoid HMR issues
    const { default: App } = await import("./App");
    
    const root = createRoot(container);
    root.render(<App />);
    
    console.log('[MAIN-CLEAN] ✅ Clean app rendered successfully');
  } catch (error) {
    console.error('[MAIN-CLEAN] Failed to load app:', error);
    const container = document.getElementById("root");
    if (container) {
      container.innerHTML = `
        <div style="padding:20px;text-align:center;font-family:Arial;">
          <h1 style="color:red;">Errore di Caricamento</h1>
          <p>${error instanceof Error ? error.message : String(error)}</p>
          <button onclick="window.location.reload()" style="padding:10px 20px;background:#4CAF50;color:white;border:none;border-radius:5px;cursor:pointer;">
            Ricarica Pagina
          </button>
        </div>
      `;
    }
  }
};

// Initialize app
initApp();