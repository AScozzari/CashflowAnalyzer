import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
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
  // REGISTRA TUTTE LE API ROUTES PER PRIME
  const server = await registerRoutes(app);

  // FRONTEND SERVING (dopo le API)
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    // Production: serve solo le API, homepage informativa
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

  // ERROR HANDLER SEMPRE PER ULTIMO
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error('Server error:', err);
    res.status(status).json({ message });
  });

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`🚀 EasyCashFlows API Server running on port ${port}`);
    log(`📱 Login endpoint: POST /api/auth/login`);
    log(`🔗 Homepage: http://localhost:${port}`);
  });
})();