import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useOptimizedQuery, useOptimizedCallback, usePerformanceMonitor } from "@/hooks/use-performance";
import { LoadingSkeleton, CardLoadingSkeleton, CenteredLoader } from "@/components/ui/loading-states";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  BarChart3, 
  Settings,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Building2,
  Users,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { MovementWithRelations } from "@shared/schema";

// Interfacce ottimizzate
interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  movementCount: number;
  pendingCount: number;
  completedToday: number;
}

interface ChartDataPoint {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

// Componente Stats Cards ottimizzato con memorizzazione
const OptimizedStatsCards = React.memo(({ 
  stats, 
  isLoading 
}: { 
  stats: DashboardStats | undefined; 
  isLoading: boolean;
}) => {
  const { logPerformance } = usePerformanceMonitor('StatsCards');
  
  const formatCurrency = useOptimizedCallback((amount: number) => {
    const start = performance.now();
    const result = new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
    logPerformance('formatCurrency', performance.now() - start);
    return result;
  }, [logPerformance]);

  if (isLoading) {
    return <CardLoadingSkeleton count={4} />;
  }

  const cardsData = [
    {
      title: "Entrate Totali",
      value: stats?.totalIncome || 0,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      trend: "+12.5%"
    },
    {
      title: "Uscite Totali",
      value: stats?.totalExpenses || 0,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      trend: "-3.2%"
    },
    {
      title: "Flusso Netto",
      value: stats?.netCashFlow || 0,
      icon: DollarSign,
      color: (stats?.netCashFlow || 0) >= 0 ? "text-green-600" : "text-red-600",
      bgColor: (stats?.netCashFlow || 0) >= 0 ? "bg-green-50 dark:bg-green-950/30" : "bg-red-50 dark:bg-red-950/30",
      trend: "+8.1%"
    },
    {
      title: "Movimenti Totali",
      value: stats?.movementCount || 0,
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      trend: "+15.3%",
      isCount: true
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cardsData.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.isCount ? card.value : formatCurrency(card.value)}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                {card.isCount ? 'Operazioni registrate' : 'Rispetto al mese scorso'}
              </p>
              <Badge variant="secondary" className="text-xs">
                {card.trend}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

// Componente Quick Actions ottimizzato
const QuickActions = React.memo(() => {
  const { logPerformance } = usePerformanceMonitor('QuickActions');
  
  const handleAction = useOptimizedCallback((action: string) => {
    const start = performance.now();
    console.log(`[DASHBOARD] Quick action: ${action}`);
    logPerformance(`action-${action}`, performance.now() - start);
  }, [logPerformance]);

  const actions = [
    { label: "Nuovo Movimento", icon: Plus, action: "new-movement", primary: true },
    { label: "Analytics", icon: BarChart3, action: "analytics" },
    { label: "Impostazioni", icon: Settings, action: "settings" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Azioni Rapide</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.primary ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => handleAction(action.action)}
            data-testid={`button-${action.action}`}
          >
            <action.icon className="w-4 h-4 mr-2" />
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
});

// Componente Chart ottimizzato con lazy loading
const OptimizedChart = React.memo(({ 
  data, 
  isLoading, 
  type = 'line' 
}: { 
  data: ChartDataPoint[];
  isLoading: boolean;
  type?: 'line' | 'pie';
}) => {
  const { logPerformance } = usePerformanceMonitor('Chart');
  
  const chartData = useOptimizedQuery(data, [data]);
  
  const formatTooltip = useOptimizedCallback((value: number, name: string) => {
    const start = performance.now();
    const result = [
      new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
      }).format(value),
      name === 'income' ? 'Entrate' : name === 'expenses' ? 'Uscite' : 'Netto'
    ];
    logPerformance('formatTooltip', performance.now() - start);
    return result;
  }, [logPerformance]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Andamento Cash Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton lines={6} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Andamento Cash Flow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={formatTooltip} />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="#10B981" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="#EF4444" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="net" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

// Dashboard principale ottimizzata
export default function OptimizedDashboard() {
  const { renderCount, logPerformance } = usePerformanceMonitor('OptimizedDashboard');
  
  // Query ottimizzate con cache (TanStack Query v5)
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/analytics/stats'],
    staleTime: 5 * 60 * 1000, // 5 minuti
    gcTime: 10 * 60 * 1000, // 10 minuti (renamed from cacheTime)
  }) as { data: DashboardStats | undefined; isLoading: boolean };

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['/api/analytics/cashflow'],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  }) as { data: ChartDataPoint[] | undefined; isLoading: boolean };

  const { data: movements, isLoading: movementsLoading } = useQuery({
    queryKey: ['/api/movements/recent'],
    staleTime: 2 * 60 * 1000, // 2 minuti per dati più dinamici
    gcTime: 5 * 60 * 1000,
  }) as { data: MovementWithRelations[] | undefined; isLoading: boolean };

  React.useEffect(() => {
    logPerformance('dashboard-render', renderCount);
  }, [renderCount, logPerformance]);

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Panoramica finanziaria aggiornata al {format(new Date(), 'dd MMMM yyyy', { locale: it })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Render #{renderCount}
            </Badge>
            <Button>
              <Calendar className="w-4 h-4 mr-2" />
              Esporta Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <ErrorBoundary>
          <OptimizedStatsCards stats={stats} isLoading={statsLoading} />
        </ErrorBoundary>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Charts Column */}
          <div className="lg:col-span-2 space-y-6">
            <ErrorBoundary>
              <OptimizedChart 
                data={chartData || []} 
                isLoading={chartLoading} 
              />
            </ErrorBoundary>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ErrorBoundary>
              <QuickActions />
            </ErrorBoundary>
            
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attività Recente</CardTitle>
              </CardHeader>
              <CardContent>
                {movementsLoading ? (
                  <LoadingSkeleton lines={4} />
                ) : (
                  <div className="space-y-3">
                    {movements?.slice(0, 5).map((movement: MovementWithRelations, index: number) => (
                      <div key={movement.id || index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            movement.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {movement.type === 'income' ? 
                              <ArrowUpRight className="h-3 w-3" /> : 
                              <ArrowDownLeft className="h-3 w-3" />
                            }
                          </div>
                          <div>
                            <p className="text-sm font-medium">{movement.reason || 'Movimento generico'}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(movement.flowDate), 'dd/MM/yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${
                          movement.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {movement.type === 'income' ? '+' : '-'}€{movement.amount}
                        </div>
                      </div>
                    )) || []}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

OptimizedStatsCards.displayName = 'OptimizedStatsCards';
QuickActions.displayName = 'QuickActions';
OptimizedChart.displayName = 'OptimizedChart';