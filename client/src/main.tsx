import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

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

// VITE CACHE BREAKER - v2024.08.13
console.log('[MAIN] Starting app initialization... v2024.08.13');

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('[MAIN] Root element not found!');
  document.body.innerHTML = '<h1 style="color:red">ROOT NOT FOUND!</h1>';
} else {
  console.log('[MAIN] Root element found, creating React root...');
  try {
    const root = createRoot(rootElement);
    console.log('[MAIN] React root created, rendering App...');
    root.render(<App />);
    console.log('[MAIN] App render called successfully');
  } catch (error) {
    console.error('[MAIN] Error creating/rendering app:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial;">
        <h2 style="color: red;">Errore di inizializzazione</h2>
        <p>Errore: ${errorMessage}</p>
        <button onclick="window.location.reload()">Ricarica</button>
      </div>
    `;
  }
}
