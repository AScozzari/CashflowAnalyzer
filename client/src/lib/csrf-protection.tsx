import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiRequest } from './queryClient';

interface CSRFContextType {
  token: string | null;
  refreshToken: () => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
}

const CSRFContext = createContext<CSRFContextType | null>(null);

export const CSRFProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);

  const refreshToken = async () => {
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        console.log('[CSRF] Token refreshed successfully');
      } else {
        console.error('[CSRF] Failed to refresh token');
      }
    } catch (error) {
      console.error('[CSRF] Error refreshing token:', error);
    }
  };

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['X-CSRF-Token'] = token;
    }
    
    return headers;
  };

  useEffect(() => {
    // Ottieni il token CSRF all'avvio
    refreshToken();
  }, []);

  return (
    <CSRFContext.Provider value={{ token, refreshToken, getAuthHeaders }}>
      {children}
    </CSRFContext.Provider>
  );
};

export const useCSRF = () => {
  const context = useContext(CSRFContext);
  if (!context) {
    throw new Error('useCSRF must be used within a CSRFProvider');
  }
  return context;
};

// Wrapper per apiRequest con protezione CSRF
export const secureApiRequest = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  // Ottieni il token CSRF dal cookie se disponibile
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf-token='))
    ?.split('=')[1];

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(csrfToken && { 'X-CSRF-Token': csrfToken })
  };

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });
};

// Middleware per validare token CSRF sul server
export const validateCSRFMiddleware = (req: any, res: any, next: any) => {
  // Skip per richieste GET
  if (req.method === 'GET') {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    console.log('[CSRF] Token validation failed:', { 
      received: token, 
      expected: sessionToken 
    });
    return res.status(403).json({ error: 'Token CSRF non valido' });
  }

  next();
};