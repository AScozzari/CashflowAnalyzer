import React, { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "@/lib/theme-provider";
// ErrorBoundary removed - using try-catch instead
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
      <BottomNavigation />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Route di autenticazione pubblica */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      
      {/* Route protette con layout responsive */}
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

export default function App() {
  console.log('[APP] EasyCashFlows starting...');
  
  // IMMEDIATE TEST: Return simple UI first
  if (window.location.search.includes('test=immediate')) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial' }}>
        <h1 style={{ color: 'green' }}>✅ React App Funziona!</h1>
        <p>Caricamento immediato senza dipendenze</p>
        <button onClick={() => window.location.href = '/'}>App Normale</button>
      </div>
    );
  }
  
  // CRASH-PROOF: Error boundary fallback
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string>("");

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('[APP] Runtime error caught:', error);
      setHasError(true);
      setErrorInfo(error.message || 'Errore sconosciuto');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // DEBUG MODE: Simple render for testing
  if (window.location.search.includes('debug=simple')) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial' }}>
        <h1>🟢 App Debug Mode</h1>
        <p>React: {React ? '✅' : '❌'}</p>
        <p>useState: {typeof useState === 'function' ? '✅' : '❌'}</p>
        <p>useEffect: {typeof useEffect === 'function' ? '✅' : '❌'}</p>
        <button onClick={() => window.location.reload()}>Ricarica</button>
        <button onClick={() => window.location.href = '/'}>App Normale</button>
      </div>
    );
  }

  // ERROR STATE: Show error UI
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-semibold mb-2 text-red-600">🚨 Errore dell'applicazione</h2>
          <p className="text-gray-600 mb-4">Si è verificato un errore:</p>
          <code className="block bg-gray-100 p-2 text-sm mb-4 rounded">{errorInfo}</code>
          <div className="space-x-2">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Ricarica pagina
            </button>
            <button 
              onClick={() => { setHasError(false); setErrorInfo(""); }} 
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('[APP] Rendering main app structure...');
  
  // SAFETY: Try minimal render first
  try {
    console.log('[APP] Attempting full app render...');
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="easycashflow-theme">
          <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <AuthProvider>
              <TooltipProvider>
                <Router />
                <Toaster />
              </TooltipProvider>
            </AuthProvider>
          </div>
        </ThemeProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('[APP] Fatal rendering error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Errore di Rendering</h2>
          <p className="text-gray-600 mb-4">Impossibile caricare l'applicazione</p>
          <code className="block bg-gray-100 p-2 text-sm mb-4 rounded">
            {error instanceof Error ? error.message : String(error)}
          </code>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Ricarica pagina
          </button>
        </div>
      </div>
    );
  }
}
