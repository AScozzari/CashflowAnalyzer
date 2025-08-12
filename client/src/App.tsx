import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "@/contexts/theme-context";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import Sidebar from "@/components/layout/sidebar";
import Dashboard from "@/pages/dashboard-new";
import Movements from "@/pages/movements";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import AuthPage from "@/pages/auth-page";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Route di autenticazione pubblica */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      
      {/* Route protette con layout */}
      <ProtectedRoute path="/" component={() => (
        <div className="flex min-h-screen bg-background transition-colors">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Dashboard />
          </main>
        </div>
      )} />
      
      <ProtectedRoute path="/dashboard" component={() => (
        <div className="flex min-h-screen bg-background transition-colors">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Dashboard />
          </main>
        </div>
      )} />
      
      <ProtectedRoute path="/movements" component={() => (
        <div className="flex min-h-screen bg-background transition-colors">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Movements />
          </main>
        </div>
      )} />
      
      <ProtectedRoute path="/analytics" component={() => (
        <div className="flex min-h-screen bg-background transition-colors">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Analytics />
          </main>
        </div>
      )} />
      
      {/* Settings accessibile solo ad Admin e Finance */}
      <ProtectedRoute 
        path="/settings" 
        allowedRoles={["admin", "finance"]}
        component={() => (
          <div className="flex min-h-screen bg-background transition-colors">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              <Settings />
            </main>
          </div>
        )}
      />
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
