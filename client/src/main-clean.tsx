import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

console.log('[MAIN-CLEAN] Starting clean React app without PWA...');

// SIMPLE DIRECT IMPORT: Back to simple approach
import App from "./App-new";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(<App />);

console.log('[MAIN-CLEAN] ✅ Clean app rendered successfully');