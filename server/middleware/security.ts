import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import '../types/session';

// Middleware per generazione token CSRF
export const generateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  // Skip per richieste statiche e Vite HMR
  if (req.path.includes('/@') || req.path.includes('/.vite') || req.path.includes('/src/') || req.path.includes('.ico')) {
    return next();
  }

  if (!req.session) {
    console.log('[CSRF] Warning: Session not available for', req.path);
    return next(); // Non bloccare le richieste senza sessione
  }

  // Genera un nuovo token CSRF se non esiste
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  next();
};

// Route per ottenere il token CSRF
export const getCSRFToken = (req: Request, res: Response) => {
  if (!req.session?.csrfToken) {
    return res.status(500).json({ error: 'Token CSRF non disponibile' });
  }

  // Imposta il token anche come cookie httpOnly per maggiore sicurezza
  res.cookie('csrf-token', req.session.csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 ore
  });

  res.json({ token: req.session.csrfToken });
};

// Middleware per validazione CSRF
export const validateCSRF = (req: Request, res: Response, next: NextFunction) => {
  // Skip validazione per richieste GET
  if (req.method === 'GET') {
    return next();
  }

  const token = req.headers['x-csrf-token'] as string;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    console.log('[SECURITY] CSRF validation failed:', {
      method: req.method,
      path: req.path,
      hasToken: !!token,
      hasSessionToken: !!sessionToken,
      tokensMatch: token === sessionToken
    });
    
    return res.status(403).json({ 
      error: 'Token CSRF non valido',
      code: 'CSRF_INVALID'
    });
  }

  next();
};

// Middleware per rate limiting
export const createRateLimit = (windowMs: number, max: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    let clientData = requests.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      clientData = { count: 1, resetTime: now + windowMs };
      requests.set(clientId, clientData);
      return next();
    }
    
    if (clientData.count >= max) {
      return res.status(429).json({ 
        error: 'Troppi tentativi, riprova più tardi',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
    }
    
    clientData.count++;
    next();
  };
};

// Middleware per sanitizzazione input
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/[<>]/g, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
};

// Middleware per validazione sessione (solo per verifica, non blocca)
export const validateSession = (req: Request, res: Response, next: NextFunction) => {
  // Skip per richieste statiche e Vite HMR
  if (req.path.includes('/@') || req.path.includes('/.vite') || req.path.includes('/src/') || req.path.includes('.ico')) {
    return next();
  }

  if (!req.session) {
    console.log('[SESSION] Warning: Session not configured for', req.path);
    // Non bloccare, solo loggare per debug
  } else {
    // Rinnova automaticamente la sessione se è attiva
    if (req.session.userId) {
      req.session.touch();
    }
  }

  next();
};

// Middleware per headers di sicurezza aggiuntivi
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevenzione clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Prevenzione MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevenzione XSS
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Feature policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
};