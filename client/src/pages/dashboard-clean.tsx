import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import FooterSignature from "@/components/layout/footer-signature";
import { InstallPrompt } from "@/components/ui/install-prompt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  BarChart3, 
  Settings,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  FileText,
  Building,
  Users
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from "date-fns";
import { it } from "date-fns/locale";

// Componente Azioni Rapide
function QuickActionsCard() {
  const [, setLocation] = useLocation();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Azioni Rapide</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          className="w-full justify-start" 
          onClick={() => setLocation('/movements')}
          data-testid="button-new-movement"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Movimento
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-start" 
          onClick={() => setLocation('/analytics')}
          data-testid="button-analytics"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Analytics
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-start" 
          onClick={() => setLocation('/settings')}
          data-testid="button-settings"
        >
          <Settings className="w-4 h-4 mr-2" />
          Impostazioni
        </Button>
      </CardContent>
    </Card>
  );
}

// Interfacce per TypeScript
interface StatsData {
  totalIncome: number;
  totalExpenses: number;
  totalMovements: number;
  totalCompanies: number;
}

// Componente Statistiche Principali
function StatsOverview() {
  const { data: statsData, isLoading } = useQuery<StatsData>({
    queryKey: ['/api/analytics/stats'],
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = statsData || { totalIncome: 0, totalExpenses: 0, totalMovements: 0, totalCompanies: 0 };
  const netFlow = stats.totalIncome - stats.totalExpenses;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-muted-foreground">Entrate Totali</span>
          </div>
          <div className="text-2xl font-bold text-green-600" data-testid="text-total-income">
            {formatCurrency(stats.totalIncome)}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-muted-foreground">Uscite Totali</span>
          </div>
          <div className="text-2xl font-bold text-red-600" data-testid="text-total-expenses">
            {formatCurrency(stats.totalExpenses)}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-muted-foreground">Flusso Netto</span>
          </div>
          <div className={`text-2xl font-bold ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-net-flow">
            {formatCurrency(netFlow)}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-muted-foreground">Movimenti</span>
          </div>
          <div className="text-2xl font-bold" data-testid="text-total-movements">
            {stats.totalMovements || 0}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente Grafico Cash Flow
function CashFlowChart() {
  const { data: cashFlowData, isLoading } = useQuery({
    queryKey: ['/api/analytics/cash-flow/30d'],
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Flusso di Cassa (30 giorni)</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = Array.isArray(cashFlowData) ? cashFlowData : [];

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Flusso di Cassa (30 giorni)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: it })}
            />
            <YAxis 
              tickFormatter={(value) => 
                new Intl.NumberFormat('it-IT', {
                  style: 'currency',
                  currency: 'EUR',
                  notation: 'compact'
                }).format(value)
              }
            />
            <Tooltip
              formatter={(value: number) => [
                new Intl.NumberFormat('it-IT', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(value),
                'Importo'
              ]}
              labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: it })}
            />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Componente Distribuzione Stati
function StatusDistributionChart() {
  const { data: statusData, isLoading } = useQuery({
    queryKey: ['/api/analytics/status-distribution'],
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Distribuzione Stati</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = Array.isArray(statusData) ? statusData : [];
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Distribuzione Stati</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ statusName, percent }) => `${statusName} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Interfacce per movimenti
interface Movement {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  companyName: string;
}

interface MovementsResponse {
  data: Movement[];
}

// Componente Movimenti Recenti
function RecentMovements() {
  const { data: movementsData, isLoading } = useQuery<MovementsResponse>({
    queryKey: ['/api/movements'],
    staleTime: 2 * 60 * 1000,
  });

  const recentMovements = useMemo(() => {
    if (!movementsData?.data || !Array.isArray(movementsData.data)) return [];
    return movementsData.data.slice(0, 5);
  }, [movementsData]);

  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Movimenti Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Movimenti Recenti</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLocation('/movements')}
          data-testid="button-view-all-movements"
        >
          Vedi Tutti
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentMovements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nessun movimento recente</p>
            </div>
          ) : (
            recentMovements.map((movement: any) => (
              <div key={movement.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <div className="font-medium">{movement.description || 'Movimento senza descrizione'}</div>
                  <div className="text-sm text-muted-foreground">
                    {movement.companyName || 'N/A'} • {(() => {
                      try {
                        const date = movement.flowDate || movement.insertDate;
                        return date ? format(new Date(date), 'dd/MM/yyyy', { locale: it }) : 'Data non disponibile';
                      } catch (error) {
                        return 'Data non disponibile';
                      }
                    })()}
                  </div>
                </div>
                <div className={`font-bold ${movement.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {movement.type === 'income' ? '+' : '-'}
                  {new Intl.NumberFormat('it-IT', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format(Math.abs(movement.amount))}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardClean() {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Dashboard" 
        subtitle="Panoramica finanziaria e controllo aziendale"
      />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Avviso PWA */}
        <InstallPrompt />
        
        {/* Statistiche Principali */}
        <StatsOverview />
        
        {/* Layout Griglia */}
        <div className="grid gap-6 md:grid-cols-6">
          {/* Azioni Rapide */}
          <div className="md:col-span-2">
            <QuickActionsCard />
          </div>
          
          {/* Grafico Cash Flow */}
          <div className="md:col-span-4">
            <CashFlowChart />
          </div>
          
          {/* Distribuzione Stati */}
          <div className="md:col-span-3">
            <StatusDistributionChart />
          </div>
          
          {/* Movimenti Recenti */}
          <div className="md:col-span-3">
            <RecentMovements />
          </div>
        </div>
      </div>
      
      <FooterSignature />
    </div>
  );
}