import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import { securityManager } from './security-manager';

// Dynamic Rate Limiter - Updates automatically from database settings
export class DynamicRateLimiter {
  private currentLimiter: any;
  private lastUpdate: number = 0;
  private readonly UPDATE_INTERVAL = 5 * 60 * 1000; // Update every 5 minutes

  async getApiLimiter(): Promise<any> {
    const now = Date.now();
    
    // Update limiter if cache expired or doesn't exist
    if (!this.currentLimiter || (now - this.lastUpdate) > this.UPDATE_INTERVAL) {
      await this.updateLimiter();
    }
    
    return this.currentLimiter;
  }

  private async updateLimiter(): Promise<void> {
    try {
      const apiRateLimit = await securityManager.getApiRateLimit();
      
      console.log(`[DYNAMIC SECURITY] Updating API rate limit to ${apiRateLimit} requests/minute`);
      
      this.currentLimiter = rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minute window
        max: apiRateLimit, // DYNAMIC from database
        message: {
          error: 'Troppe richieste. Riprova più tardi.',
          limit: apiRateLimit,
          window: '1 minuto'
        },
        standardHeaders: true,
        legacyHeaders: false,
        // Skip successful requests to be more lenient
        skipSuccessfulRequests: false,
      });
      
      this.lastUpdate = Date.now();
    } catch (error) {
      console.error('[DYNAMIC SECURITY] Error updating API limiter:', error);
      
      // Fallback to default limiter
      this.currentLimiter = rateLimit({
        windowMs: 1 * 60 * 1000,
        max: 100, // Default fallback
        message: {
          error: 'Troppe richieste. Riprova più tardi.'
        },
        standardHeaders: true,
        legacyHeaders: false,
      });
    }
  }
}

// Login Rate Limiter - Updates from database settings
export class DynamicLoginLimiter {
  private currentLimiter: any;
  private lastUpdate: number = 0;
  private readonly UPDATE_INTERVAL = 5 * 60 * 1000; // Update every 5 minutes

  async getLoginLimiter(): Promise<any> {
    const now = Date.now();
    
    if (!this.currentLimiter || (now - this.lastUpdate) > this.UPDATE_INTERVAL) {
      await this.updateLimiter();
    }
    
    return this.currentLimiter;
  }

  private async updateLimiter(): Promise<void> {
    try {
      const loginLimits = await securityManager.getLoginLimits();
      const windowMs = loginLimits.blockDurationMs;
      const maxAttempts = loginLimits.maxAttempts;
      
      console.log(`[DYNAMIC SECURITY] Updating login limiter: ${maxAttempts} attempts per ${windowMs/1000}s window`);
      
      this.currentLimiter = rateLimit({
        windowMs: windowMs, // DYNAMIC block duration
        max: maxAttempts, // DYNAMIC max attempts
        message: {
          error: `Troppi tentativi di login. Riprova tra ${Math.ceil(windowMs/60000)} minuti.`,
          maxAttempts: maxAttempts,
          windowMinutes: Math.ceil(windowMs/60000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true, // Only count failed attempts
      });
      
      this.lastUpdate = Date.now();
    } catch (error) {
      console.error('[DYNAMIC SECURITY] Error updating login limiter:', error);
      
      // Fallback to default
      this.currentLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 attempts
        message: {
          error: 'Troppi tentativi di login. Riprova tra 15 minuti.'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true,
      });
    }
  }
}

// Session Security Middleware - Dynamic IP tracking
export const createDynamicSessionSecurity = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if IP tracking is enabled in security settings
      const ipTrackingEnabled = await securityManager.isIpTrackingEnabled();
      
      if (!ipTrackingEnabled) {
        return next(); // Skip IP tracking if disabled
      }

      if (req.session && req.user) {
        const sessionIP = req.session.ipAddress;
        const currentIP = req.ip || req.connection.remoteAddress;
        
        // Se l'IP è cambiato, distruggi la sessione
        if (sessionIP && sessionIP !== currentIP) {
          console.log(`[DYNAMIC SECURITY] Session hijacking attempt detected - Session IP: ${sessionIP}, Current IP: ${currentIP}`);
          
          // Log security event if audit is enabled
          const auditEnabled = await securityManager.isAuditEnabled();
          if (auditEnabled) {
            console.log(`[SECURITY AUDIT] IP mismatch for user ${req.user.username}: ${sessionIP} -> ${currentIP}`);
          }
          
          req.session.destroy(() => {
            res.status(401).json({ error: 'Sessione non valida - IP address mismatch' });
          });
          return;
        }
        
        // Salva IP della sessione se non presente
        if (!sessionIP) {
          req.session.ipAddress = currentIP;
        }
      }
      
      next();
    } catch (error) {
      console.error('[DYNAMIC SECURITY] Error in session security middleware:', error);
      next(); // Continue even if security check fails
    }
  };
};

// Audit Logging Middleware - Dynamic based on settings
export const createDynamicAuditLogger = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auditEnabled = await securityManager.isAuditEnabled();
      
      if (!auditEnabled) {
        return next(); // Skip audit logging if disabled
      }

      const clientIP = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      const username = req.user?.username || 'anonymous';
      
      // Log tentativi di login
      if (req.path === '/api/auth/login' && req.method === 'POST') {
        console.log(`[SECURITY AUDIT] Login attempt - IP: ${clientIP}, UA: ${userAgent?.substring(0, 50)}, Username: ${req.body?.username}`);
      }
      
      // Log accessi a endpoint sensibili
      if (req.path.includes('/admin') || req.path.includes('/settings') || req.path.includes('/security')) {
        console.log(`[SECURITY AUDIT] Sensitive access - User: ${username}, IP: ${clientIP}, Path: ${req.path}, Method: ${req.method}`);
      }
      
      // Log failed login tracking if enabled
      const trackFailedLogins = await securityManager.getSetting('trackFailedLogins');
      if (trackFailedLogins && req.path === '/api/auth/login' && req.method === 'POST') {
        // This will be logged in passport strategy
      }
      
      next();
    } catch (error) {
      console.error('[DYNAMIC SECURITY] Error in audit logger:', error);
      next(); // Continue even if audit fails
    }
  };
};

// Password Validation Middleware - Dynamic policy enforcement
export const validatePasswordMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only validate password on registration/change password endpoints
    if (!req.body.password || !req.path.includes('password') && !req.path.includes('register')) {
      return next();
    }

    const passwordValidation = await securityManager.validatePassword(req.body.password);
    
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Password non rispetta i criteri di sicurezza',
        details: passwordValidation.errors
      });
    }
    
    next();
  } catch (error) {
    console.error('[DYNAMIC SECURITY] Error in password validation:', error);
    next(); // Continue even if validation fails
  }
};

// Export singleton instances
export const dynamicApiLimiter = new DynamicRateLimiter();
export const dynamicLoginLimiter = new DynamicLoginLimiter();

// Initialize security manager listeners for real-time updates
securityManager.onSettingsChanged((newSettings) => {
  console.log('[DYNAMIC SECURITY] Security settings changed, forcing middleware refresh...');
  
  // Force refresh of all dynamic middleware
  dynamicApiLimiter['lastUpdate'] = 0;
  dynamicLoginLimiter['lastUpdate'] = 0;
});

console.log('✅ Dynamic Security Middleware initialized - all settings are now database-driven!');