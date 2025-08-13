import React, { useState } from "react";
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
  // Safety check: ensure React is properly loaded
  if (!React || typeof React.useState !== 'function') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Caricamento...</h2>
          <p className="text-gray-600">Inizializzazione dell'applicazione in corso</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="easycashflow-theme">
          <AuthProvider>
            <TooltipProvider>
              <Router />
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
