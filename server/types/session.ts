import { Session } from 'express-session';

// Estendi il tipo Session per includere i campi personalizzati
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    csrfToken?: string;
    userRole?: string;
    loginAttempts?: number;
    lastActivity?: number;
  }
}

export interface CustomSession extends Session {
  userId?: number;
  csrfToken?: string;
  userRole?: string;
  loginAttempts?: number;
  lastActivity?: number;
}