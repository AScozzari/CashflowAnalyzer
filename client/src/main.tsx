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

// CRITICAL FIX: Ensure React and hooks are ready before rendering
const initializeApp = () => {
  try {
    // Validate React is fully loaded with hooks
    if (!React.useState || !React.useEffect || !React.createContext) {
      console.warn('React hooks not ready, retrying...');
      setTimeout(initializeApp, 50);
      return;
    }
    
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element not found");
    }
    
    console.log('React hooks validated, initializing app...');
    const root = createRoot(rootElement);
    root.render(<App />);
  } catch (error) {
    console.error("Failed to initialize app:", error);
    // Retry with longer delay to allow React to fully load
    setTimeout(initializeApp, 200);
  }
};

// Enhanced initialization sequence
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Add extra delay for React to be ready
    setTimeout(initializeApp, 100);
  });
} else {
  // Document ready, but still wait for React
  setTimeout(initializeApp, 50);
}
