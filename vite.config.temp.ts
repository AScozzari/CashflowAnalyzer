import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react({
      // Explicit fast refresh configuration
      fastRefresh: true,
      include: "**/*.{jsx,tsx}",
    }),
    // DISABLED REPLIT PLUGINS TO TEST RefreshSig
    // runtimeErrorOverlay(),
    // cartographer() 
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    hmr: {
      // Explicit HMR configuration
      overlay: true
    }
  },
});