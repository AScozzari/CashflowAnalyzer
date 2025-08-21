import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// 🔧 ROBUST NEON CONNECTION WITH ERROR HANDLING
console.log('[NEON-CONFIG] Configuring Neon database connection...');

// Enhanced WebSocket configuration for Neon
if (typeof globalThis !== 'undefined' && !globalThis.WebSocket) {
  neonConfig.webSocketConstructor = ws;
  console.log('[NEON-CONFIG] ✅ WebSocket constructor configured');
}

// Disable WebSocket pooling to prevent connection issues
neonConfig.poolQueryViaFetch = true;
neonConfig.useSecureWebSocket = true;
neonConfig.wsProxy = (host: string) => host;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;
console.log('[NEON-CONFIG] Database URL configured');

// Create pool with enhanced error handling
let pool: Pool;
try {
  pool = new Pool({ 
    connectionString,
    max: 3, // Reduced pool size to prevent connection issues
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 5000,
  });
  console.log('[NEON-CONFIG] ✅ Connection pool created successfully');
} catch (error) {
  console.error('[NEON-CONFIG] ❌ Failed to create connection pool:', error);
  throw error;
}

// Initialize Drizzle with enhanced error handling
let db: ReturnType<typeof drizzle>;
try {
  db = drizzle({ client: pool, schema });
  console.log('[NEON-CONFIG] ✅ Drizzle ORM initialized successfully');
} catch (error) {
  console.error('[NEON-CONFIG] ❌ Failed to initialize Drizzle:', error);
  throw error;
}

export { pool, db };

// Global error handler for uncaught Neon WebSocket errors
process.on('uncaughtException', (error) => {
  if (error.message && error.message.includes('Cannot set property message')) {
    console.warn('[NEON-WORKAROUND] ⚠️  Caught Neon WebSocket error - continuing...', error.message);
    return; // Don't crash the process
  }
  throw error; // Re-throw other errors
});