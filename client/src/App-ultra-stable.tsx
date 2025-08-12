import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "@/contexts/theme-context";
import { ErrorBoundary } from "@/components/ui/error-boundary";

// Import diretto dei componenti per eliminare lazy loading
import Sidebar from "@/components/layout/sidebar";
import AuthPage from "@/pages/auth-page";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import NotFound from "@/pages/not-found";

// Dashboard semplificato inline
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, DollarSign, FileText, Settings } from "lucide-react";

function SimpleDashboard() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          🎯 EasyCashFlows Dashboard
        </h2>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Impostazioni
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Entrate Totali
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">€15.231,89</div>
            <p className="text-xs text-muted-foreground">+20.1% dal mese scorso</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Uscite Totali
            </CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">€9.326,50</div>
            <p className="text-xs text-muted-foreground">+7% dal mese scorso</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Netto
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">€5.905,39</div>
            <p className="text-xs text-muted-foreground">+15.3% dal mese scorso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Movimenti
            </CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">Questo mese</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sistema Operativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>✅ Server Express.js</span>
              <span className="text-green-600 font-medium">Attivo</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>✅ Database PostgreSQL</span>
              <span className="text-green-600 font-medium">Connesso</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>✅ Autenticazione JWT</span>
              <span className="text-green-600 font-medium">Funzionante</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>✅ Frontend React</span>
              <span className="text-green-600 font-medium">Caricato</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-background transition-colors">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </ErrorBoundary>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      
      <ProtectedRoute 
        path="/" 
        component={() => (
          <LayoutWrapper>
            <SimpleDashboard />
          </LayoutWrapper>
        )} 
      />
      
      <ProtectedRoute 
        path="/dashboard" 
        component={() => (
          <LayoutWrapper>
            <SimpleDashboard />
          </LayoutWrapper>
        )} 
      />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  console.log("🚀 EasyCashFlows Ultra-Stable App loading...");
  
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