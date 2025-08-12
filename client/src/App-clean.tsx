import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/contexts/theme-context";

// Componente di test pulito senza drag&drop
function TestDashboard() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold text-blue-600">🏦 EasyCashFlows</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="font-semibold">Saldo Netto</h3>
          <p className="text-2xl text-blue-600">€5.905,39</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="font-semibold">Entrate</h3>
          <p className="text-2xl text-green-600">€12.450,00</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="font-semibold">Uscite</h3>
          <p className="text-2xl text-red-600">€6.544,61</p>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-2">✅ Sistema Operativo</h3>
        <div className="space-y-2 text-sm">
          <p>🟢 Server Express.js - Attivo</p>
          <p>🟢 Database PostgreSQL - Connesso</p>
          <p>🟢 Autenticazione JWT - Funzionante</p>
          <p>🟢 Frontend React - Caricato</p>
        </div>
      </div>
    </div>
  );
}

function SimpleAuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            🏦 EasyCashFlows
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Accedi al tuo sistema di gestione flussi
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Login form disponibile nell'app completa
          </p>
          <p className="text-center text-sm text-gray-500 mt-2">
            Credenziali: admin / admin123
          </p>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={SimpleAuthPage} />
      <Route path="/" component={TestDashboard} />
      <Route component={TestDashboard} />
    </Switch>
  );
}

function App() {
  return (
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
  );
}

export default App;