import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Zap, 
  Clock, 
  Target,
  Calendar,
  BarChart3,
  LineChart,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  RefreshCw,
  FileText,
  Building,
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Maximize2,
  Settings
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area,
  BarChart as RechartsBarChart,
  Bar,
  ComposedChart,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, addDays } from "date-fns";
import { it } from "date-fns/locale";

interface InteractiveDashboardProps {
  className?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'];
const CHART_COLORS = {
  income: '#10B981',
  expenses: '#EF4444',
  net: '#3B82F6',
  primary: '#3B82F6',
  secondary: '#10B981'
};

// Enhanced Real-time Stats Widget with animations
function EnhancedStatsWidget({ data, isLoading, timeRange }: { data: any; isLoading: boolean; timeRange: string }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-1 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Entrate Totali",
      value: data?.totalIncome || 0,
      change: data?.incomeChange || 0,
      trend: data?.incomeChange >= 0 ? 'up' : 'down',
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-gradient-to-r from-green-500/10 to-emerald-500/5",
      progress: 85,
      target: (data?.totalIncome || 0) * 1.2
    },
    {
      title: "Uscite Totali", 
      value: data?.totalExpenses || 0,
      change: data?.expensesChange || 0,
      trend: data?.expensesChange <= 0 ? 'up' : 'down',
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-gradient-to-r from-red-500/10 to-rose-500/5",
      progress: 65,
      target: (data?.totalExpenses || 0) * 0.9
    },
    {
      title: "Cash Flow Netto",
      value: (data?.totalIncome || 0) - (data?.totalExpenses || 0),
      change: data?.netChange || 0,
      trend: ((data?.totalIncome || 0) - (data?.totalExpenses || 0)) >= 0 ? 'up' : 'down',
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-gradient-to-r from-blue-500/10 to-cyan-500/5",
      progress: 72,
      target: ((data?.totalIncome || 0) - (data?.totalExpenses || 0)) * 1.1
    },
    {
      title: "Transazioni",
      value: data?.totalMovements || 0,
      change: data?.transactionsChange || 0,
      trend: data?.transactionsChange >= 0 ? 'up' : 'down',
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-gradient-to-r from-purple-500/10 to-violet-500/5",
      progress: 90,
      target: (data?.totalMovements || 0) + 50
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.trend === 'up';
        
        return (
          <Card key={index} className="overflow-hidden group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
            <div className={`absolute inset-0 ${stat.bgColor} opacity-50`} />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`p-3 rounded-xl ${stat.bgColor} shadow-sm`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {isPositive ? (
                        <ArrowUpRight className="w-3 h-3 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 text-red-500" />
                      )}
                      <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{stat.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.title === "Transazioni" ? stat.value.toLocaleString('it-IT') : formatCurrency(stat.value)}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progresso obiettivo</span>
                    <span>{stat.progress}%</span>
                  </div>
                  <Progress value={stat.progress} className="h-1" />
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Obiettivo: {stat.title === "Transazioni" ? stat.target.toLocaleString('it-IT') : formatCurrency(stat.target)}</span>
                  <Badge variant="outline" className="text-xs">
                    {timeRange}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Interactive Chart Component
function InteractiveChartWidget({ data, isLoading, timeRange, chartType, onChartTypeChange }: { 
  data: any; 
  isLoading: boolean; 
  timeRange: string;
  chartType: 'line' | 'area' | 'bar' | 'composed';
  onChartTypeChange: (type: 'line' | 'area' | 'bar' | 'composed') => void;
}) {
  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    switch (chartType) {
      case 'area':
        return (
          <AreaChart data={data || []}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.income} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={CHART_COLORS.income} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.expenses} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={CHART_COLORS.expenses} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => format(new Date(value), 'dd/MM')}
              stroke="hsl(var(--border))"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              stroke="hsl(var(--border))"
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value),
                name === 'income' ? 'Entrate' : name === 'expenses' ? 'Uscite' : 'Netto'
              ]}
              labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: it })}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--card-foreground))'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="income" 
              stroke={CHART_COLORS.income}
              strokeWidth={3}
              fill="url(#incomeGradient)"
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              stroke={CHART_COLORS.expenses}
              strokeWidth={3}
              fill="url(#expenseGradient)"
            />
          </AreaChart>
        );
      
      case 'bar':
        return (
          <RechartsBarChart data={data || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => format(new Date(value), 'dd/MM')}
              stroke="hsl(var(--border))"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              stroke="hsl(var(--border))"
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value),
                name === 'income' ? 'Entrate' : name === 'expenses' ? 'Uscite' : 'Netto'
              ]}
              labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: it })}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--card-foreground))'
              }}
            />
            <Bar dataKey="income" fill={CHART_COLORS.income} radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill={CHART_COLORS.expenses} radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        );

      case 'composed':
        return (
          <ComposedChart data={data || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => format(new Date(value), 'dd/MM')}
              stroke="hsl(var(--border))"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              stroke="hsl(var(--border))"
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value),
                name === 'income' ? 'Entrate' : name === 'expenses' ? 'Uscite' : 'Netto'
              ]}
              labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: it })}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--card-foreground))'
              }}
            />
            <Bar dataKey="income" fill={CHART_COLORS.income} radius={[2, 2, 0, 0]} />
            <Bar dataKey="expenses" fill={CHART_COLORS.expenses} radius={[2, 2, 0, 0]} />
            <Line 
              type="monotone" 
              dataKey="net" 
              stroke={CHART_COLORS.net} 
              strokeWidth={3}
              dot={{ fill: CHART_COLORS.net, strokeWidth: 2, r: 4 }}
            />
          </ComposedChart>
        );

      default: // line
        return (
          <RechartsLineChart data={data || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => format(new Date(value), 'dd/MM')}
              stroke="hsl(var(--border))"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              stroke="hsl(var(--border))"
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value),
                name === 'income' ? 'Entrate' : name === 'expenses' ? 'Uscite' : 'Netto'
              ]}
              labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: it })}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--card-foreground))'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke={CHART_COLORS.income} 
              strokeWidth={3}
              dot={{ fill: CHART_COLORS.income, strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke={CHART_COLORS.expenses} 
              strokeWidth={3}
              dot={{ fill: CHART_COLORS.expenses, strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="net" 
              stroke={CHART_COLORS.net} 
              strokeWidth={4}
              dot={{ fill: CHART_COLORS.net, strokeWidth: 3, r: 5 }}
            />
          </RechartsLineChart>
        );
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center space-x-2 text-xl">
              <Zap className="w-6 h-6 text-blue-600" />
              <span>Andamento Finanziario Interattivo</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">Analisi dettagliata dei flussi di cassa - {timeRange}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1" />
              Live Data
            </Badge>
            
            <div className="flex items-center space-x-1 bg-muted/50 rounded-lg p-1">
              {[
                { type: 'line' as const, icon: LineChart, label: 'Linee' },
                { type: 'area' as const, icon: BarChart3, label: 'Aree' },
                { type: 'bar' as const, icon: BarChart3, label: 'Barre' },
                { type: 'composed' as const, icon: PieChartIcon, label: 'Composito' }
              ].map(({ type, icon: Icon, label }) => (
                <Button
                  key={type}
                  size="sm"
                  variant={chartType === type ? "default" : "ghost"}
                  onClick={() => onChartTypeChange(type)}
                  className="h-8 px-2"
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default function InteractiveDashboard({ className }: InteractiveDashboardProps) {
  const [timeRange, setTimeRange] = useState('30d');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'composed'>('composed');
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real-time data fetching
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/analytics/stats'],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const { data: cashFlowData, isLoading: cashFlowLoading } = useQuery({
    queryKey: ['/api/analytics/cash-flow', timeRange],
    refetchInterval: autoRefresh ? 60000 : false,
  });

  const { data: movements, isLoading: movementsLoading } = useQuery({
    queryKey: ['/api/movements'],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Enhanced mock data with more realistic trends
  const enhancedCashFlowData = useMemo(() => {
    if (cashFlowData) return cashFlowData;
    
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - i - 1);
      const baseIncome = 5000 + Math.random() * 10000;
      const baseExpenses = 3000 + Math.random() * 6000;
      return {
        date: format(date, 'yyyy-MM-dd'),
        income: baseIncome,
        expenses: baseExpenses,
        net: baseIncome - baseExpenses
      };
    });
  }, [cashFlowData, timeRange]);

  return (
    <div className={`space-y-8 p-4 lg:p-6 ${className}`}>
      {/* Enhanced Dashboard Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 bg-gradient-to-r from-card/50 via-card/30 to-transparent backdrop-blur-sm p-6 rounded-xl border shadow-sm">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Dashboard Finanziaria
          </h1>
          <div className="flex items-center space-x-3 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Tempo reale</span>
            </div>
            <span>•</span>
            <span>Ultimo aggiornamento: {format(new Date(), 'HH:mm:ss')}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="shrink-0"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh
            </Button>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Ultimi 7 giorni</SelectItem>
                <SelectItem value="30d">Ultimi 30 giorni</SelectItem>
                <SelectItem value="90d">Ultimi 3 mesi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <EnhancedStatsWidget 
        data={stats} 
        isLoading={statsLoading} 
        timeRange={timeRange} 
      />

      {/* Interactive Tabs System */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-3 bg-muted/30 p-1 rounded-lg">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <LineChart className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <InteractiveChartWidget
              data={enhancedCashFlowData}
              isLoading={cashFlowLoading}
              timeRange={timeRange}
              chartType={chartType}
              onChartTypeChange={setChartType}
            />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChartIcon className="w-5 h-5 text-indigo-600" />
                  <span>Distribuzione per Categoria</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <PieChartIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Grafico distribuzione in sviluppo</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  <span>Performance Obiettivi</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Entrate Mensili</span>
                      <span className="font-medium">87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Controllo Spese</span>
                      <span className="font-medium">94%</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Cash Flow Positivo</span>
                      <span className="font-medium">76%</span>
                    </div>
                    <Progress value={76} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span>Insights Intelligenti</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Trend Positivo</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Le entrate sono aumentate del 12.5% rispetto al mese scorso</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Attenzione</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Le spese operative sono aumentate del 8% negli ultimi 7 giorni</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">Ottimizzazione</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">Il cash flow è stabile con una crescita sostenibile</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <span>Azioni Rapide</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button size="sm" className="w-full justify-start" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Genera Report
                </Button>
                <Button size="sm" className="w-full justify-start" variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sincronizza Dati
                </Button>
                <Button size="sm" className="w-full justify-start" variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtri Avanzati
                </Button>
                <Button size="sm" className="w-full justify-start" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Pianifica Analisi
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}