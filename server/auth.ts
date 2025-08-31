import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as DbUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends DbUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Funzione per generare token di reset password
function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function setupAuth(app: Express) {
  // Session settings with default timeout (will be updated dynamically)
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "cashflow-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // Default 24 hours (updated dynamically)
      httpOnly: true,
      secure: false, // Disabled for Replit development
      sameSite: 'lax', // Allow cross-site cookies for Replit
    },
  };

  // Update session timeout dynamically from security settings
  (async () => {
    try {
      const { securityManager } = await import('./services/security-manager');
      const dynamicTimeout = await securityManager.getSessionTimeout();
      sessionSettings.cookie!.maxAge = dynamicTimeout;
      console.log(`[SECURITY] Session timeout set to ${dynamicTimeout/1000}s from database`);
    } catch (error) {
      console.error('[SECURITY] Error loading dynamic session timeout:', error);
    }
  })();

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Rate limiting per protezione brute force (enhanced by dynamic middleware)
  const loginAttempts = new Map<string, { attempts: number; lastAttempt: number }>();

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Controllo rate limiting - DEFAULT VALUES (dynamic middleware will handle this)
        const userAttempts = loginAttempts.get(username) || { attempts: 0, lastAttempt: 0 };
        const now = Date.now();
        
        // Use default values for passport strategy (dynamic middleware provides additional protection)
        const MAX_ATTEMPTS = 5;
        const LOCKOUT_TIME = 15 * 60 * 1000;
        
        // Reset contatore se sono passati più di 15 minuti
        if (now - userAttempts.lastAttempt > LOCKOUT_TIME) {
          userAttempts.attempts = 0;
        }
        
        // Blocco temporaneo se troppi tentativi (additional protection via dynamic middleware)
        if (userAttempts.attempts >= MAX_ATTEMPTS) {
          const timeLeft = Math.ceil((LOCKOUT_TIME - (now - userAttempts.lastAttempt)) / 60000);
          return done(null, false, { 
            message: `Account temporaneamente bloccato. Riprova tra ${timeLeft} minuti.` 
          });
        }

        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          // Incrementa tentativi falliti
          userAttempts.attempts += 1;
          userAttempts.lastAttempt = now;
          loginAttempts.set(username, userAttempts);
          
          return done(null, false, { message: "Credenziali non valide" });
        }
        
        // Reset tentativi su login riuscito
        loginAttempts.delete(username);
        
        // Aggiorna ultimo accesso
        await storage.updateLastLogin(user.id);
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || false);
    } catch (error) {
      done(error);
    }
  });

  // Middleware per verificare autenticazione
  function requireAuth(req: any, res: any, next: any) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Accesso non autorizzato" });
    }
    next();
  }

  // Middleware per verificare ruoli
  function requireRole(...allowedRoles: string[]) {
    return (req: any, res: any, next: any) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Accesso non autorizzato" });
      }
      
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: "Accesso negato per questo ruolo" });
      }
      
      next();
    };
  }

  // Route per registrazione (solo per admin)
  app.post("/api/auth/register", requireRole("admin"), async (req, res) => {
    try {
      const { username, password, email, role = "user", resourceId } = req.body;
      
      // Verifica se l'utente esiste già
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username già esistente" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email già esistente" });
      }

      // Valida password secondo criteri di sicurezza
      const { securityManager } = await import('./services/security-manager');
      const passwordValidation = await securityManager.validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          error: "Password non valida", 
          details: passwordValidation.errors 
        });
      }
    

      const hashedPassword = await hashPassword(password);
      
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        role,
        resourceId: resourceId || null,
        isFirstAccess: true,
      });

      // Rimuovi la password dalla risposta
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Errore durante la registrazione" });
    }
  });

  // Route per login con rate limiting
  app.post("/api/auth/login", async (req, res, next) => {
    // Importa loginLimiter solo quando serve per evitare errori circolari
    const { loginLimiter } = await import("./security-middleware");
    
    // Applica rate limiting
    loginLimiter(req, res, (err) => {
      if (err) return;
      
      console.log("Login request received:", req.body);
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      console.log("Passport authenticate result:", { err, user: !!user, info });
      
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Errore del server" });
      }
      if (!user) {
        console.log("Login failed:", info?.message);
        return res.status(401).json({ error: info?.message || "Credenziali non valide" });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error("Session login error:", err);
          return res.status(500).json({ error: "Errore durante il login" });
        }
        
        console.log("Login successful for user:", user.username);
        // Rimuovi la password dalla risposta
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
    });
  });

  // Route per logout
  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logout effettuato con successo" });
    });
  });

  // Route per ottenere l'utente corrente
  app.get("/api/auth/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Non autenticato" });
    }
    
    try {
      // Get user with resource information
      const user = req.user;
      let userWithResource = { ...user };
      
      // If user has a resourceId, fetch the resource data for firstName/lastName
      if (user.resourceId) {
        const { storage } = await import('./storage');
        const resource = await storage.getResource(user.resourceId);
        if (resource) {
          userWithResource.firstName = resource.firstName;
          userWithResource.lastName = resource.lastName;
        }
      }
      
      // Rimuovi la password dalla risposta
      const { password: _, ...userWithoutPassword } = userWithResource;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error fetching user with resource:', error);
      // Fallback to basic user data without resource info
      const { password: _, ...userWithoutPassword } = req.user;
      res.json(userWithoutPassword);
    }
  });

  // Route per cambiare password
  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      // Verifica password attuale
      if (!user || !(await comparePasswords(currentPassword, user.password))) {
        return res.status(400).json({ error: "Password attuale non corretta" });
      }

      const hashedNewPassword = await hashPassword(newPassword);
      await storage.updatePassword(user.id, hashedNewPassword);

      // Se è il primo accesso, segna come completato
      if (user.isFirstAccess) {
        await storage.setFirstAccessCompleted(user.id);
      }

      res.json({ message: "Password aggiornata con successo" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Errore durante il cambio password" });
    }
  });

  // Route per richiedere reset password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Non rivelare se l'email esiste o no per sicurezza
        return res.json({ message: "Se l'email esiste, riceverai le istruzioni per il reset" });
      }

      const resetToken = generateResetToken();
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 ora

      await storage.setResetToken(email, resetToken, expiry);

      // Qui dovresti inviare l'email con il token
      // Per ora ritorniamo solo un messaggio
      console.log(`Reset token per ${email}: ${resetToken}`);
      
      res.json({ message: "Se l'email esiste, riceverai le istruzioni per il reset" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Errore durante la richiesta di reset" });
    }
  });

  // Route per reset password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ error: "Token non valido o scaduto" });
      }

      const hashedNewPassword = await hashPassword(newPassword);
      await storage.updatePassword(user.id, hashedNewPassword);
      await storage.clearResetToken(user.id);

      res.json({ message: "Password resettata con successo" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Errore durante il reset password" });
    }
  });

  // Middleware per controllare se l'utente deve cambiare password al primo accesso
  app.use("/api", (req, res, next) => {
    // Salta il controllo per le route di autenticazione
    if (req.path.startsWith("/auth/") || !req.isAuthenticated()) {
      return next();
    }

    if (req.user && req.user.isFirstAccess && req.path !== "/auth/change-password") {
      return res.status(202).json({ 
        error: "Primo accesso: è necessario cambiare la password",
        requirePasswordChange: true 
      });
    }

    next();
  });

  return { requireAuth, requireRole, hashPassword };
}

export { hashPassword };