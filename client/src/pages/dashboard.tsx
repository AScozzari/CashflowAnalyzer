import { useQuery } from "@tanstack/react-query";
import { useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Activity, FileText, PieChart, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/header";
import FooterSignature from "@/components/layout/footer-signature";
import { InstallPrompt } from "@/components/ui/install-prompt";
import { ResponsiveLayout, useScreenSize } from "@/components/responsive/responsive-layout";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import DashboardCashFlowChart from "@/components/dashboard/cash-flow-chart";
import DashboardMovementStatusChart from "@/components/dashboard/movement-status-chart";
import DashboardRecentMovements from "@/components/dashboard/recent-movements";

const COLORS = {
  "Saldato": "#10B981",
  "Da Saldare": "#F59E0B", 
  "In Lavorazione": "#2563EB",
  "Saldato Parziale": "#8B5CF6",
  "Annullato": "#EF4444",
  "Sospeso": "#6B7280",
};

function StatsCards({ stats, isLoading }: { stats: any; isLoading: boolean }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entrate Totali</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(stats?.totalIncome)}</div>
          <p className="text-xs text-muted-foreground">Totale incassi del periodo</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Uscite Totali</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(stats?.totalExpenses)}</div>
          <p className="text-xs text-muted-foreground">Totale spese del periodo</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Flusso di Cassa Netto</CardTitle>
          <DollarSign className={`h-4 w-4 ${(stats?.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${(stats?.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats?.netBalance)}
          </div>
          <p className="text-xs text-muted-foreground">Differenza entrate-uscite</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Movimenti Totali</CardTitle>
          <Activity className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats?.totalMovements || 0}</div>
          <p className="text-xs text-muted-foreground">Operazioni registrate</p>
        </CardContent>
      </Card>
    </div>
  );
}

function InlineCashFlowChart({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Andamento Flussi di Cassa</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Andamento Flussi di Cassa</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => [
                new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value),
                ''
              ]}
            />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#10B981" name="Entrate" strokeWidth={2} />
            <Line type="monotone" dataKey="expenses" stroke="#EF4444" name="Uscite" strokeWidth={2} />
            <Line type="monotone" dataKey="balance" stroke="#2563EB" name="Bilancio" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function StatusChart({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stati Movimenti</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stati Movimenti</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={data || []}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {(data || []).map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.statusName as keyof typeof COLORS] || "#8884d8"} />
              ))}
            </Pie>
            <Tooltip />
          </RechartsPieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function InlineRecentMovements({ movements, isLoading }: { movements: any; isLoading: boolean }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Movimenti Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-20 ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Movimenti Recenti</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(movements || []).slice(0, 5).map((movement: any) => (
            <div key={movement.id} className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${movement.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="font-medium text-sm">{movement.description}</p>
                  <p className="text-xs text-muted-foreground">{movement.companyName}</p>
                </div>
              </div>
              <div className={`font-medium ${movement.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {movement.type === 'income' ? '+' : '-'}{formatCurrency(movement.amount)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();

  // Check authentication status first
  const { data: user, isLoading: authLoading, error: authError } = useQuery({
    queryKey: ["/api/auth/user"],
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    retry: 1,
  });

  // Only fetch dashboard data if user is authenticated
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["/api/analytics/stats"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: !!user && !authLoading,
    retry: 1,
  });

  const { data: cashFlowData, isLoading: cashFlowLoading, error: cashFlowError } = useQuery({
    queryKey: ["/api/analytics/cash-flow"],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: !!user && !authLoading,
    retry: 1,
  });

  const { data: statusDistribution, isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ["/api/analytics/status-distribution"],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: !!user && !authLoading,
    retry: 1,
  });

  const { data: recentMovements, isLoading: movementsLoading, error: movementsError } = useQuery({
    queryKey: ["/api/movements"],
    queryFn: async () => {
      const response = await fetch("/api/movements?limit=5", {
        credentials: "include"
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized');
        }
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: !!user && !authLoading,
    retry: 1,
  });

  // Redirect to auth if not authenticated
  useEffect(() => {
    const errors = [authError, statsError, cashFlowError, statusError, movementsError];
    const hasUnauthorizedError = errors.some(error => error?.message?.includes('401'));
    
    if (!authLoading && hasUnauthorizedError) {
      setLocation('/auth');
    }
  }, [authLoading, authError, statsError, cashFlowError, statusError, movementsError, setLocation]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifica autenticazione...</p>
        </div>
      </div>
    );
  }

  // Show error state if there are API errors
  if (statsError || cashFlowError || statusError || movementsError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Errore nel caricamento della dashboard</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Ricarica pagina
          </button>
        </div>
      </div>
    );
  }

  const { isMobile } = useScreenSize();
  
  // Memoize loading state to prevent unnecessary re-renders
  const isLoading = useMemo(() => 
    statsLoading || cashFlowLoading || statusLoading || movementsLoading,
    [statsLoading, cashFlowLoading, statusLoading, movementsLoading]
  );

  // Memoize data to prevent unnecessary re-renders
  const memoizedStats = useMemo(() => stats, [stats]);
  const memoizedCashFlowData = useMemo(() => cashFlowData, [cashFlowData]);
  const memoizedStatusDistribution = useMemo(() => statusDistribution as Array<{statusName: string; count: number}> | undefined, [statusDistribution]);
  const memoizedRecentMovements = useMemo(() => recentMovements, [recentMovements]);

  // Desktop layout
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background transition-colors">
        <Header 
          title="Dashboard" 
          subtitle="Panoramica generale dei flussi finanziari"
        />
        
        <div className="p-6 space-y-6">
          <StatsCards stats={memoizedStats} isLoading={statsLoading} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DashboardCashFlowChart data={memoizedCashFlowData} isLoading={cashFlowLoading} />
            <DashboardMovementStatusChart data={memoizedStatusDistribution} isLoading={statusLoading} />
            <DashboardRecentMovements movements={memoizedRecentMovements} isLoading={movementsLoading} />
          </div>
          
          <InstallPrompt />
        </div>
        
        <FooterSignature />
      </div>
    );
  }

  // Mobile layout
  return (
    <ResponsiveLayout
      title="Dashboard"
      subtitle="Panoramica flussi finanziari"
      enableGestures={true}
    >
      <div className="space-y-4">
        <InstallPrompt />
        
        <StatsCards stats={memoizedStats} isLoading={statsLoading} />
        
        <div className="space-y-4">
          <DashboardCashFlowChart data={memoizedCashFlowData} isLoading={cashFlowLoading} />
          <DashboardMovementStatusChart data={memoizedStatusDistribution} isLoading={statusLoading} />
          <DashboardRecentMovements movements={memoizedRecentMovements} isLoading={movementsLoading} />
        </div>
      </div>
    </ResponsiveLayout>
  );
}
