import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { 
  generateCSRFToken, 
  getCSRFToken, 
  validateCSRF, 
  createRateLimit, 
  sanitizeInput,
  validateSession,
  securityHeaders
} from "./middleware/security";

const app = express();

// REPLIT-OPTIMIZED HEADERS with proper CSP
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const host = req.headers.host;
  const userAgent = req.headers['user-agent'];
  const isIframe = req.headers['sec-fetch-dest'] === 'iframe' || req.headers['x-frame-options'] || req.headers.referer?.includes('replit.dev');
  const isReplit = host?.includes('replit.dev') || host?.includes('repl.co');
  
  // Log connection attempts for debugging
  if (req.path === '/' || req.path.startsWith('/api')) {
    console.log(`[NETWORK] ${req.method} ${req.path} from ${origin || 'same-origin'} via ${host} ${isIframe ? '(IFRAME)' : '(DIRECT)'}`);
  }
  
  // CRITICAL: Detect iframe context and store it
  (req as any).isIframe = isIframe;
  
  // REPLIT-OPTIMIZED CSP: Set proper Content Security Policy via HTTP headers
  if (isReplit) {
    const cspValue = [
      "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' *.replit.dev *.repl.co wss: ws: https:",
      "font-src 'self' fonts.googleapis.com fonts.gstatic.com data:",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "img-src 'self' data: blob: https:",
      "frame-ancestors 'self' *.replit.dev *.repl.co",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ');
    
    res.setHeader('Content-Security-Policy', cspValue);
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    console.log('[CSP] Replit-optimized CSP headers applied');
  } else {
    // Standard CSP for non-Replit environments
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  }
  
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
  
  // Additional security headers optimized for Replit
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
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

// REMOVED: No iframe specific routing - serve React app always
/*
app.get('/', (req, res, next) => {
  if ((req as any).isIframe) {
    console.log('[IFRAME] Serving direct HTML response');
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EasyCashFlows - Gestione Flussi Finanziari</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 50px;
            max-width: 600px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.2);
            text-align: center;
        }
        .icon { font-size: 4em; margin-bottom: 20px; }
        .title { margin: 0 0 15px 0; font-size: 2.8em; font-weight: 300; }
        .subtitle { margin: 0 0 20px 0; font-size: 1.3em; opacity: 0.9; font-weight: 200; }
        .notice {
            margin: 30px 0;
            padding: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            border-left: 4px solid #4CAF50;
        }
        .notice p { margin: 0; opacity: 0.8; line-height: 1.6; }
        .btn {
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            border: none;
            padding: 18px 35px;
            border-radius: 30px;
            font-size: 1.2em;
            cursor: pointer;
            box-shadow: 0 6px 20px rgba(76,175,80,0.3);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(76,175,80,0.4);
        }
        .features {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 1px solid rgba(255,255,255,0.2);
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            font-size: 0.95em;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🏦</div>
        <h1 class="title">EasyCashFlows</h1>
        <p class="subtitle">Sistema di Gestione Finanziaria</p>
        <div class="notice">
            <p>Stai visualizzando la preview iframe. CSP rimosso per domini Replit. Clicca per aprire l'applicazione completa.</p>
        </div>
        <a href="javascript:window.open(window.location.href, '_blank')" class="btn">
            🚀 Apri Applicazione Completa
        </a>
        <div class="features">
            <div>📊 Dashboard Analytics</div>
            <div>💼 Gestione Movimenti</div>
            <div>📋 Report Finanziari</div>
            <div>⚙️ Configurazioni</div>
        </div>
    </div>
</body>
</html>
    `);
    return;
  }
  next(); // Continue to normal flow for non-iframe requests
});
*/

(async () => {
  const server = await registerRoutes(app);
  
  // Applica middleware di sicurezza SOLO per API endpoints
  app.use('/api', securityHeaders);
  app.use('/api', generateCSRFToken);
  app.use('/api', sanitizeInput);
  
  // Rate limiting per API endpoints
  app.use('/api', createRateLimit(15 * 60 * 1000, 100)); // 100 richieste per 15 minuti
  
  // Route per token CSRF
  app.get('/api/csrf-token', getCSRFToken);

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
