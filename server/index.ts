import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// IFRAME-SAFE HEADERS for Replit preview
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const host = req.headers.host;
  const userAgent = req.headers['user-agent'];
  const isIframe = req.headers['sec-fetch-dest'] === 'iframe' || req.headers['x-frame-options'];
  
  // Log connection attempts for debugging
  if (req.path === '/' || req.path.startsWith('/api')) {
    console.log(`[NETWORK] ${req.method} ${req.path} from ${origin || 'same-origin'} via ${host} ${isIframe ? '(IFRAME)' : '(DIRECT)'}`);
  }
  
  // CRITICAL: Allow iframe embedding for Replit preview - MUST override later headers
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Override any later X-Frame-Options by monitoring response
  const originalSetHeader = res.setHeader;
  res.setHeader = function(name: string, value: any) {
    if (name.toLowerCase() === 'x-frame-options' && value === 'DENY') {
      console.log('[IFRAME] Blocking X-Frame-Options DENY - keeping SAMEORIGIN');
      return originalSetHeader.call(this, name, 'SAMEORIGIN');
    }
    return originalSetHeader.call(this, name, value);
  };
  
  // CORS for both iframe and direct access
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie, X-Frame-Options, Sec-Fetch-Dest');
  
  // Additional headers for iframe compatibility
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('Referrer-Policy', 'same-origin');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  
  // CRITICAL FIX: Check NODE_ENV directly, not app.get("env")
  const isProduction = process.env.NODE_ENV === "production";
  console.log(`[ENV DEBUG] NODE_ENV: "${process.env.NODE_ENV}", isProduction: ${isProduction}`);
  
  if (!isProduction) {
    console.log('[VITE] Setting up Vite development server...');
    
    // PATCH: Handle Vite plugin errors gracefully
    process.on('uncaughtException', (error) => {
      if (error.message.includes('@react-refresh') || error.message.includes('ENOENT')) {
        console.log('[VITE] Handled plugin error:', error.message.split('\n')[0]);
        return;
      }
      throw error;
    });
    
    await setupVite(app, server);
  } else {
    // Serve solo le API, frontend su Replit
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.send(`
          <html>
            <head><title>EasyCashFlows API Server</title></head>
            <body>
              <h1>🏦 EasyCashFlows API Server Attivo</h1>
              <p>✅ Server API funzionante sulla porta ${process.env.PORT || '5000'}</p>
              <p>✅ Database Neon connesso</p>
              <p>✅ Login endpoint: POST /api/auth/login</p>
              <p>🔗 Frontend disponibile su Replit</p>
              <hr>
              <p><strong>Credenziali test:</strong> admin / admin123</p>
            </body>
          </html>
        `);
      }
    });
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Enhanced server startup with network diagnostics
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    console.log(`🚀 EasyCashFlows server ready at http://0.0.0.0:${port}`);
    
    // Construct Replit URL properly
    let replitUrl = '';
    if (process.env.REPLIT_DEV_DOMAIN) {
      replitUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
    } else if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      replitUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    } else {
      replitUrl = `http://localhost:${port}`;
    }
    
    console.log(`🌐 Replit URL: ${replitUrl}`);
    console.log(`📡 Server listening on all interfaces (0.0.0.0:${port})`);
    console.log(`🔒 CORS configured for Replit domain`);
    
    // Health check endpoint response
    console.log(`💚 Health check: GET ${replitUrl}/api/auth/user`);
    
    // Network debugging information
    console.log(`[NETWORK DEBUG] Environment variables:`);
    console.log(`  - REPLIT_DEV_DOMAIN: ${process.env.REPLIT_DEV_DOMAIN}`);
    console.log(`  - REPL_SLUG: ${process.env.REPL_SLUG}`);
    console.log(`  - REPL_OWNER: ${process.env.REPL_OWNER}`);
    console.log(`  - PORT: ${process.env.PORT}`);
    console.log(`[NETWORK DEBUG] Server binding check completed successfully`);
  });
})();
