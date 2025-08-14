import { useState, useEffect } from "react";
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
import AiChatPage from "@/pages/ai-chat";
import AuthPage from "@/pages/auth-page";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import NotFound from "@/pages/not-found";

// WEBSOCKET AND CACHE FIX - Address the real root cause
if (typeof window !== 'undefined') {
  console.log('[WEBSOCKET] Fixing WebSocket and cache issues...');
  
  // 1. Clear problematic cache on load
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        if (cacheName.includes('vite') || cacheName.includes('workbox')) {
          console.log('[CACHE] Clearing problematic cache:', cacheName);
          caches.delete(cacheName);
        }
      });
    });
  }
  
  // 2. Fix WebSocket connection issues
  const originalWebSocket = window.WebSocket;
  window.WebSocket = class extends originalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      let finalUrl = url.toString();
      
      // Fix WebSocket URL for Replit environment
      if (finalUrl.includes('localhost:undefined') || finalUrl.includes('ws://localhost')) {
        const domain = window.location.hostname;
        finalUrl = finalUrl.replace('ws://localhost:undefined', `wss://${domain}`);
        finalUrl = finalUrl.replace('ws://localhost', `wss://${domain}`);
        console.log('[WEBSOCKET] Fixed URL:', finalUrl);
      }
      
      super(finalUrl, protocols);
      
      // Add error handling
      this.addEventListener('error', (event) => {
        console.log('[WEBSOCKET] Connection error handled:', event);
      });
    }
  } as typeof WebSocket;
  
  console.log('[WEBSOCKET] ✅ WebSocket and cache fixes applied');
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
      <Route path="/auth">
        {() => {
          console.log('[ROUTER] Loading AuthPage...');
          return <AuthPage />;
        }}
      </Route>
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      
      {/* Protected routes con layout */}
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
      
      <ProtectedRoute path="/ai-chat" component={() => (
        <AppLayout>
          <AiChatPage />
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
      
      {/* Default route - redirect to dashboard or auth */}
      <ProtectedRoute path="/" component={() => (
        <AppLayout>
          <Dashboard />
        </AppLayout>
      )} />
      
      {/* Fallback - TEMPORANEO DISABILITATO */}
      {/* <Route component={NotFound} /> */}
    </Switch>
  );
}

// MAIN EASYCASHFLOWS APP - Now working with HMR fixes
function App() {
  console.log('[APP] Full EasyCashFlows app rendering...');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <div className="min-h-screen bg-background">
              <Toaster />
              <AuthProvider>
                <Router />
              </AuthProvider>
            </div>
          </ErrorBoundary>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;