import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Estensione del tipo Session per includere ipAddress
declare module 'express-session' {
  interface SessionData {
    ipAddress?: string;
  }
}

// Rate limiting per API login
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // massimo 5 tentativi per IP
  message: {
    error: 'Troppi tentativi di login. Riprova tra 15 minuti.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true,
});

// Rate limiting generale per API
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // massimo 100 richieste per IP al minuto
  message: {
    error: 'Troppe richieste. Riprova più tardi.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware per logging di sicurezza
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  // Log tentativi di login
  if (req.path === '/api/auth/login' && req.method === 'POST') {
    console.log(`[SECURITY] Login attempt - IP: ${clientIP}, UA: ${userAgent}, Username: ${req.body?.username}`);
  }
  
  // Log accessi a endpoint sensibili
  if (req.path.includes('/admin') || req.path.includes('/settings')) {
    const username = req.user?.username || 'anonymous';
    console.log(`[SECURITY] Admin access - User: ${username}, IP: ${clientIP}, Path: ${req.path}`);
  }
  
  next();
};

// Middleware per headers di sicurezza
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevenzione XSS
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // HSTS (solo in produzione con HTTPS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // CSP basic
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:;");
  
  next();
};

// Middleware per validazione e sanitizzazione input
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Rimuovi caratteri potenzialmente pericolosi dai parametri
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Rimuovi script tags e altri elementi pericolosi
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    }
  }
  
  next();
};

// Middleware per controllo session hijacking
export const sessionSecurity = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.user) {
    const sessionIP = req.session.ipAddress;
    const currentIP = req.ip || req.connection.remoteAddress;
    
    // Se l'IP è cambiato, distruggi la sessione
    if (sessionIP && sessionIP !== currentIP) {
      console.log(`[SECURITY] Session hijacking attempt detected - Session IP: ${sessionIP}, Current IP: ${currentIP}`);
      req.session.destroy(() => {
        res.status(401).json({ error: 'Sessione non valida' });
      });
      return;
    }
    
    // Salva IP della sessione se non presente
    if (!sessionIP) {
      req.session.ipAddress = currentIP;
    }
  }
  
  next();
};