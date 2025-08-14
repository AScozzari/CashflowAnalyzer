// IMPORT HMR DISABLE FIRST
import "./hmr-disable";

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
import AiChatPage from "@/pages/ai-chat";
import AuthPage from "@/pages/auth-page";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import NotFound from "@/pages/not-found";

// HMR SAFETY: Ensure all refresh functions are disabled in App component too
if (typeof window !== 'undefined') {
  (window as any).$RefreshReg$ = () => () => {};
  (window as any).$RefreshSig$ = () => (type: any) => type;
  (window as any).__vite_plugin_react_preamble_installed__ = true;
}

// REPLIT CRITICAL FIXES - TypeScript-safe version
if (typeof window !== 'undefined') {
  console.log('[REPLIT FIXES] Applying comprehensive fixes...');
  
  // 1. HMR WebSocket fix con proper typing
  const originalWebSocket = window.WebSocket;
  window.WebSocket = class extends originalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      let finalUrl = url.toString();
      if (finalUrl.includes('/@vite/client') || finalUrl.includes('hmr') || finalUrl.includes('ws://')) {
        const replitDomain = window.location.hostname;
        finalUrl = finalUrl.replace('ws://localhost', `wss://${replitDomain}`);
        finalUrl = finalUrl.replace('ws://', 'wss://');
        console.log('[REPLIT HMR] WebSocket redirect per spock proxy:', finalUrl);
      }
      super(finalUrl, protocols);
    }
  } as typeof WebSocket;
  
  // 2. Fetch retry mechanism con cache bypass per reload
  const originalFetch = window.fetch;
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const maxRetries = 3;
    
    // Force cache bypass on development reload to prevent cache crashes
    if (process.env.NODE_ENV === 'development') {
      init = { 
        ...init, 
        cache: 'no-cache',
        headers: {
          ...init?.headers,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      };
    }
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await originalFetch(input, init);
        if (response.ok || response.status === 401) return response;
        if (i === maxRetries - 1) throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        if (i === maxRetries - 1) {
          console.error('[REPLIT FETCH] Max retries raggiunto per:', input, error);
          throw error;
        }
        console.log(`[REPLIT FETCH] Retry ${i + 1}/${maxRetries} per:`, input);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw new Error('Unreachable code');
  };
  
  // 3. iframe detection e document.domain fix
  try {
    const isIframe = window.self !== window.top;
    if (isIframe && window.location.hostname.includes('replit.dev')) {
      document.domain = 'replit.dev';
      console.log('[REPLIT] document.domain impostato per iframe');
    }
  } catch (e) {
    const error = e as Error;
    console.log('[REPLIT] Domain fix non necessario:', error.message);
  }
  
  // 4. React Refresh completamente disabilitato nel main.tsx
  
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
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

// ULTRA-SIMPLE APP FOR DEBUGGING
function App() {
  console.log('[APP] Function component render started');
  
  const handleClick = () => {
    console.log('[APP] Button clicked!');
    alert('React funziona!');
  };
  
  console.log('[APP] About to return JSX');
  
  return (
    <div 
      style={{ 
        padding: '20px', 
        minHeight: '100vh', 
        backgroundColor: '#f0f0f0',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>
        🏦 EasyCashFlows - Debug Test
      </h1>
      <p style={{ fontSize: '18px', marginBottom: '20px' }}>
        Se vedi questo testo, React sta funzionando correttamente!
      </p>
      <button 
        onClick={handleClick}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Test Click
      </button>
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>Timestamp: {new Date().toLocaleTimeString()}</p>
        <p>Status: App renderizzata con successo</p>
      </div>
    </div>
  );
}

export default App;