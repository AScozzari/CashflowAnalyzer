import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log('[MAIN-CLEAN] Starting clean React app without PWA...');

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(<App />);

console.log('[MAIN-CLEAN] ✅ Clean app rendered successfully');