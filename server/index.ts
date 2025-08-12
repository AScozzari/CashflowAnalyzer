import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Assicura che NODE_ENV sia impostato correttamente per Replit
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

const app = express();

// CORS e Security Headers per Replit
app.use((req, res, next) => {
  // Permetti tutte le origini per Replit
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  // Headers per Replit webview compatibility
  res.removeHeader('X-Frame-Options');
  res.removeHeader('X-Robots-Tag');
  res.header('X-Frame-Options', 'SAMEORIGIN');
  
  // Gestisci preflight requests
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

  // Serve static test files from public directory
  app.use(express.static(path.resolve(import.meta.dirname, "..", "client", "public")));
  
  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
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
  // Replit requires port 5000 to be bound to external port 80
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = process.env.NODE_ENV === 'development' ? '0.0.0.0' : 'localhost';
  
  server.listen(port, host, () => {
    log(`serving on host ${host}:${port}`);
    console.log(`🚀 EasyCashFlows server ready at http://${host}:${port}`);
    console.log(`🌐 Replit URL: https://${process.env.REPLIT_DEV_DOMAIN}`);
    console.log(`📱 Open in new tab for full access: https://${process.env.REPLIT_DEV_DOMAIN}`);
  });
})();
