import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "@/contexts/theme-context";
import { ErrorBoundary } from "@/components/ui/error-boundary";

// Lazy loading dei componenti per evitare errori di caricamento
import { lazy, Suspense } from "react";

const Sidebar = lazy(() => import("@/components/layout/sidebar"));
const Dashboard = lazy(() => import("@/pages/dashboard-simple"));
const Movements = lazy(() => import("@/pages/movements"));
const Analytics = lazy(() => import("@/pages/analytics"));
const Settings = lazy(() => import("@/pages/settings"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

// Layout wrapper con error boundary
function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-background transition-colors">
        <Suspense fallback={<div className="w-64 bg-muted/20" />}>
          <Sidebar />
        </Suspense>
        <main className="flex-1 overflow-auto">
          <Suspense fallback={<LoadingSpinner />}>
            {children}
          </Suspense>
        </main>
      </div>
    </ErrorBoundary>
  );
}

function Router() {
  return (
    <Switch>
      {/* Route di autenticazione pubblica */}
      <Route path="/auth">
        <Suspense fallback={<LoadingSpinner />}>
          <AuthPage />
        </Suspense>
      </Route>
      
      <Route path="/forgot-password">
        <Suspense fallback={<LoadingSpinner />}>
          <ForgotPasswordPage />
        </Suspense>
      </Route>
      
      <Route path="/reset-password">
        <Suspense fallback={<LoadingSpinner />}>
          <ResetPasswordPage />
        </Suspense>
      </Route>
      
      {/* Route protette con layout */}
      <ProtectedRoute 
        path="/" 
        component={() => (
          <LayoutWrapper>
            <Dashboard />
          </LayoutWrapper>
        )} 
      />
      
      <ProtectedRoute 
        path="/dashboard" 
        component={() => (
          <LayoutWrapper>
            <Dashboard />
          </LayoutWrapper>
        )} 
      />
      
      <ProtectedRoute 
        path="/movements" 
        component={() => (
          <LayoutWrapper>
            <Movements />
          </LayoutWrapper>
        )} 
      />
      
      <ProtectedRoute 
        path="/analytics" 
        component={() => (
          <LayoutWrapper>
            <Analytics />
          </LayoutWrapper>
        )} 
      />
      
      <ProtectedRoute 
        path="/settings" 
        component={() => (
          <LayoutWrapper>
            <Settings />
          </LayoutWrapper>
        )} 
      />
      
      {/* 404 Page */}
      <Route>
        <Suspense fallback={<LoadingSpinner />}>
          <NotFound />
        </Suspense>
      </Route>
    </Switch>
  );
}

function App() {
  console.log("🚀 EasyCashFlows App loading...");
  
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <Router />
              <Toaster />
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;