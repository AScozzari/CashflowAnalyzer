import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Ensure React is globally available to prevent hook errors
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                if (confirm('Nuova versione disponibile. Aggiornare l\'applicazione?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Wait for DOM to be ready and React to be fully initialized
const initializeApp = () => {
  try {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element not found");
    }
    
    const root = createRoot(rootElement);
    root.render(<App />);
  } catch (error) {
    console.error("Failed to initialize app:", error);
    // Retry after a short delay
    setTimeout(initializeApp, 100);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
