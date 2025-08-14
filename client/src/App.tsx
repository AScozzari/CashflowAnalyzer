import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "@/lib/theme-provider";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import Sidebar from "@/components/layout/sidebar";
import { BottomNavigation } from "@/components/mobile/mobile-navigation";
import Dashboard from "@/pages/dashboard-professional";
import Movements from "@/pages/movements";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import AuthPage from "@/pages/auth-page";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import NotFound from "@/pages/not-found";

// REPLIT CRITICAL FIXES - Soluzione basata su ricerca web approfondita
// Fix per: Connection Denied + Hot Reload non funzionante
if (typeof window !== 'undefined') {
  console.log('[REPLIT FIXES] Applying comprehensive fixes...');
  
  // 1. HMR WebSocket fix per architettura spock proxy
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    if (url.includes('/@vite/client') || url.includes('hmr') || url.includes('ws://')) {
      const replitDomain = window.location.hostname;
      url = url.replace('ws://localhost', `wss://${replitDomain}`);
      url = url.replace('ws://', 'wss://');
      console.log('[REPLIT HMR] WebSocket redirect per spock proxy:', url);
    }
    return new originalWebSocket(url, protocols);
  };
  
  // 2. Fetch retry mechanism per Connection Denied
  const originalFetch = window.fetch;
  window.fetch = async function(url, options = {}) {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await originalFetch(url, options);
        if (response.ok || response.status === 401) return response;
        if (i === maxRetries - 1) throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        if (i === maxRetries - 1) {
          console.error('[REPLIT FETCH] Max retries raggiunto per:', url, error);
          throw error;
        }
        console.log(`[REPLIT FETCH] Retry ${i + 1}/${maxRetries} per:`, url);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };
  
  // 3. iframe detection e document.domain fix
  try {
    const isIframe = window.self !== window.top;
    if (isIframe && window.location.hostname.includes('replit.dev')) {
      document.domain = 'replit.dev';
      console.log('[REPLIT] document.domain impostato per iframe');
    }
  } catch (e) {
    console.log('[REPLIT] Domain fix non necessario:', e.message);
  }
  
  // 4. React Refresh fix per ambiente Replit
  if (window.__reactRefreshInjected) {
    const originalRefresh = window.$RefreshSig$;
    if (originalRefresh) {
      window.$RefreshSig$ = function() {
        try {
          return originalRefresh.apply(this, arguments);
        } catch (error) {
          console.log('[REPLIT REFRESH] Errore gestito:', error.message);
          return function() { return null; };
        }
      };
    }
  }
  
  console.log('[REPLIT FIXES] ✅ Tutti i fix applicati per Connection Denied + Hot Reload');
}

// Layout wrapper component
function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  return (
    <div className="flex min-h-screen bg-background transition-colors">
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar 
          isCollapsed={sidebarCollapsed} 
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>
      <main className="flex-1 min-h-screen overflow-auto pb-20 lg:pb-0 transition-all duration-300">
        {children}
      </main>
      
      {/* Mobile navigation sempre visibile su mobile */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-40">
        <BottomNavigation />
      </div>
    </div>
  );
}

// Main router component
function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      
      {/* Protected routes con layout */}
      <ProtectedRoute path="/" component={() => (
        <AppLayout>
          <Dashboard />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/dashboard" component={() => (
        <AppLayout>
          <Dashboard />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/movements" component={() => (
        <AppLayout>
          <Movements />
        </AppLayout>
      )} />
      
      <ProtectedRoute path="/analytics" component={() => (
        <AppLayout>
          <Analytics />
        </AppLayout>
      )} />
      
      {/* Settings accessibile solo ad Admin e Finance */}
      <ProtectedRoute 
        path="/settings" 
        allowedRoles={["admin", "finance"]}
        component={() => (
          <AppLayout>
            <Settings />
          </AppLayout>
        )}
      />
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

// MAIN APP COMPONENT - ARROW FUNCTION WITH ERROR BOUNDARIES
const App = () => {
  console.log('[APP] EasyCashFlows starting - REPLIT-OPTIMIZED with Error Boundaries...');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <ThemeProvider defaultTheme="light" storageKey="easycashflow-theme">
            <ErrorBoundary>
              <AuthProvider>
                <TooltipProvider>
                  <ErrorBoundary>
                    <Router />
                  </ErrorBoundary>
                  <Toaster />
                </TooltipProvider>
              </AuthProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;