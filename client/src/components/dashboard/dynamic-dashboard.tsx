import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Zap, 
  Clock, 
  Target,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { it } from "date-fns/locale";

interface DynamicDashboardProps {
  className?: string;
}

interface DashboardWidget {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  size: 'small' | 'medium' | 'large' | 'full';
  isVisible: boolean;
  data?: any;
  loading?: boolean;
}

const COLORS = ['#10B981', '#F59E0B', '#2563EB', '#8B5CF6', '#EF4444', '#6B7280'];

// Real-time stats widget
function RealtimeStatsWidget({ data, loading }: { data: any; loading: boolean }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Entrate Oggi",
      value: data?.todayIncome || 0,
      change: data?.todayIncomeChange || 0,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      title: "Uscite Oggi", 
      value: data?.todayExpenses || 0,
      change: data?.todayExpensesChange || 0,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20"
    },
    {
      title: "Cash Flow",
      value: (data?.todayIncome || 0) - (data?.todayExpenses || 0),
      change: data?.cashFlowChange || 0,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Transazioni",
      value: data?.todayTransactions || 0,
      change: data?.transactionsChange || 0,
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.change >= 0;
        
        return (
          <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className={`absolute inset-0 opacity-5 ${stat.bgColor}`} />
            <CardContent className="p-4 relative">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              
              <div className="space-y-1">
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.title === "Transazioni" ? stat.value : formatCurrency(stat.value)}
                </p>
                
                <div className="flex items-center space-x-1">
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isPositive ? '+' : ''}{stat.change.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs ieri</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Enhanced trend chart widget
function TrendChartWidget({ data, loading, timeRange }: { data: any; loading: boolean; timeRange: string }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span>Andamento Flussi - {timeRange}</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data || []}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => format(new Date(value), 'dd/MM')}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value),
                name
              ]}
              labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: it })}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="income" 
              stroke="#10B981" 
              strokeWidth={2}
              fill="url(#incomeGradient)"
              name="Entrate"
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              stroke="#EF4444" 
              strokeWidth={2}
              fill="url(#expenseGradient)"
              name="Uscite"
            />
            <Line 
              type="monotone" 
              dataKey="net" 
              stroke="#2563EB" 
              strokeWidth={3}
              name="Netto"
              dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Quick actions widget - Enhanced with better mobile support
function QuickActionsWidget() {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Target className="w-5 h-5 text-green-600" />
          <span>Azioni Rapide</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          size="sm" 
          className="w-full justify-start hover:scale-[1.02] transition-all duration-200" 
          variant="outline"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          <span className="flex-1 text-left">Nuovo Movimento</span>
        </Button>
        <Button 
          size="sm" 
          className="w-full justify-start hover:scale-[1.02] transition-all duration-200" 
          variant="outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          <span className="flex-1 text-left">Aggiorna Dati</span>
        </Button>
        <Button 
          size="sm" 
          className="w-full justify-start hover:scale-[1.02] transition-all duration-200" 
          variant="outline"
        >
          <Calendar className="w-4 h-4 mr-2" />
          <span className="flex-1 text-left">Report Mensile</span>
        </Button>
        <Button 
          size="sm" 
          className="w-full justify-start hover:scale-[1.02] transition-all duration-200" 
          variant="outline"
        >
          <Filter className="w-4 h-4 mr-2" />
          <span className="flex-1 text-left">Filtri Avanzati</span>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DynamicDashboard({ className }: DynamicDashboardProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const [visibleWidgets, setVisibleWidgets] = useState({
    stats: true,
    trends: true,
    actions: true,
    distribution: true
  });

  // Mock data queries (replace with real API calls)
  const { data: realTimeData, isLoading: realTimeLoading } = useQuery({
    queryKey: ['/api/dashboard/realtime'],
    queryFn: () => Promise.resolve({
      todayIncome: 15420,
      todayExpenses: 8300,
      todayTransactions: 23,
      todayIncomeChange: 12.5,
      todayExpensesChange: -5.2,
      transactionsChange: 18.7,
      cashFlowChange: 25.3
    }),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['/api/dashboard/trends', timeRange],
    queryFn: () => {
      // Mock trend data generation
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      return Promise.resolve(
        Array.from({ length: days }, (_, i) => ({
          date: format(subDays(new Date(), days - i - 1), 'yyyy-MM-dd'),
          income: Math.random() * 10000 + 5000,
          expenses: Math.random() * 8000 + 3000,
          net: Math.random() * 5000 - 1000
        }))
      );
    }
  });

  const toggleWidget = (widget: keyof typeof visibleWidgets) => {
    setVisibleWidgets(prev => ({
      ...prev,
      [widget]: !prev[widget]
    }));
  };

  return (
    <div className={`space-y-6 ${className} px-4 sm:px-6 lg:px-8`}>
      {/* Dashboard Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 bg-card/50 backdrop-blur-sm p-4 rounded-xl border">
        <div className="space-y-1">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center space-x-2">
            <Zap className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />
            <span>Dashboard Dinamica</span>
          </h2>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Aggiornamento in tempo reale</span>
            <span>•</span>
            <span>{format(new Date(), 'HH:mm:ss')}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Ultimi 7 giorni</SelectItem>
              <SelectItem value="30d">Ultimi 30 giorni</SelectItem>
              <SelectItem value="90d">Ultimi 3 mesi</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-1 bg-muted/50 rounded-lg p-1">
            {Object.entries(visibleWidgets).map(([key, visible]) => (
              <Button
                key={key}
                size="sm"
                variant={visible ? "default" : "ghost"}
                onClick={() => toggleWidget(key)}
                className="h-8 w-8 p-0"
                title={`${visible ? 'Nascondi' : 'Mostra'} ${key}`}
              >
                {visible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Stats */}
      {visibleWidgets.stats && (
        <div className="animate-in fade-in-0 duration-500">
          <RealtimeStatsWidget data={realTimeData} loading={realTimeLoading} />
        </div>
      )}

      {/* Main Charts and Actions Grid - Responsive */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {visibleWidgets.trends && (
          <div className="xl:col-span-3 animate-in slide-in-from-left-5 duration-500">
            <TrendChartWidget 
              data={trendData} 
              loading={trendLoading} 
              timeRange={timeRange}
            />
          </div>
        )}
        
        {visibleWidgets.actions && (
          <div className="xl:col-span-1 animate-in slide-in-from-right-5 duration-500">
            <QuickActionsWidget />
          </div>
        )}
      </div>

      {/* Additional Widgets Row for better space utilization */}
      {visibleWidgets.distribution && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in-0 duration-700">
          {/* Performance Indicators */}
          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Target className="w-5 h-5 text-blue-600" />
                <span>Indicatori Chiave</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-muted/30 rounded-lg">
                <span className="text-sm font-medium">Liquidità</span>
                <Badge variant="outline" className="text-green-600">Ottima</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/30 rounded-lg">
                <span className="text-sm font-medium">Trend</span>
                <Badge variant="outline" className="text-blue-600">In crescita</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/30 rounded-lg">
                <span className="text-sm font-medium">Previsioni</span>
                <Badge variant="outline" className="text-purple-600">Positive</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Activity className="w-5 h-5 text-orange-600" />
                <span>Attività Recente</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Nuova fattura registrata</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>Pagamento elaborato</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span>Promemoria scadenza</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span>Statistiche Veloci</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">87%</p>
                <p className="text-xs text-muted-foreground">Efficienza operativa</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-muted/30 rounded">
                  <p className="font-bold text-green-600">+12.5%</p>
                  <p className="text-xs text-muted-foreground">vs mese scorso</p>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <p className="font-bold text-blue-600">94%</p>
                  <p className="text-xs text-muted-foreground">Accuratezza</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live Update Indicator - More subtle */}
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span>Sistema sincronizzato</span>
        </div>
      </div>
    </div>
  );
}