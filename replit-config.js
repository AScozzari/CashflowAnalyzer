// Configurazione specifica per Replit
export const isReplit = () => {
  return !!(
    process.env.REPLIT_DEV_DOMAIN ||
    process.env.REPL_SLUG ||
    process.env.REPL_OWNER ||
    typeof window !== 'undefined' && window.location.hostname.includes('replit.dev')
  );
};

export const isReplitIframe = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    return window.self !== window.top;
  } catch (e) {
    return true; // Probably in iframe if we can't access parent
  }
};

export const getReplitConfig = () => {
  const inReplit = isReplit();
  const inIframe = isReplitIframe();
  
  return {
    isReplit: inReplit,
    isIframe: inIframe,
    domain: process.env.REPLIT_DEV_DOMAIN || null,
    slug: process.env.REPL_SLUG || null,
    owner: process.env.REPL_OWNER || null,
    
    // CSP configuration for Replit
    csp: inReplit ? {
      'default-src': "'self' 'unsafe-inline' 'unsafe-eval'",
      'connect-src': "'self' *.replit.dev *.repl.co wss: ws: https:",
      'font-src': "'self' fonts.googleapis.com fonts.gstatic.com data:",
      'style-src': "'self' 'unsafe-inline' fonts.googleapis.com",
      'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
      'img-src': "'self' data: blob: https:",
      'frame-ancestors': "'self' *.replit.dev *.repl.co",
      'object-src': "'none'",
      'base-uri': "'self'"
    } : null,
    
    // Vite config adjustments
    vite: {
      hmr: inReplit ? {
        port: 443,
        clientPort: 443
      } : true,
      server: {
        host: '0.0.0.0',
        port: process.env.PORT || 5000
      }
    }
  };
};

console.log('[REPLIT CONFIG] Loaded:', getReplitConfig());