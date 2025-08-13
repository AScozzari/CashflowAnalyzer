import { useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieChartIcon,
  Euro,
  FileText,
  Calendar,
  Building2,
  Users,
  Target
} from "lucide-react";
import type { MovementWithRelations } from "@shared/schema";

interface AnalyticsChartsProps {
  movements: MovementWithRelations[];
  isLoading?: boolean;
}

const PROFESSIONAL_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  purple: '#8b5cf6',
  teal: '#06b6d4',
  pink: '#ec4899',
  indigo: '#6366f1'
};

const CHART_COLORS = [
  PROFESSIONAL_COLORS.info,
  PROFESSIONAL_COLORS.success,
  PROFESSIONAL_COLORS.danger,
  PROFESSIONAL_COLORS.warning,
  PROFESSIONAL_COLORS.purple,
  PROFESSIONAL_COLORS.teal,
  PROFESSIONAL_COLORS.pink,
  PROFESSIONAL_COLORS.indigo
];

export default function AnalyticsChartsProfessional({ movements, isLoading }: AnalyticsChartsProps) {
  const chartData = useMemo(() => {
    if (!movements || movements.length === 0) return null;

    // 1. Trend mensile con calcoli dettagliati
    const monthlyData = movements.reduce((acc, movement) => {
      const date = new Date(movement.flowDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('it-IT', { year: 'numeric', month: 'short' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = { 
          month: monthLabel,
          income: 0, 
          expense: 0,
          net: 0,
          count: 0,
          avgTransaction: 0
        };
      }
      
      const amount = parseFloat(movement.amount);
      if (movement.type === 'income') {
        acc[monthKey].income += amount;
        acc[monthKey].net += amount;
      } else {
        acc[monthKey].expense += amount;
        acc[monthKey].net -= amount;
      }
      acc[monthKey].count += 1;
      
      return acc;
    }, {} as Record<string, any>);

    // Calcola media transazioni
    Object.values(monthlyData).forEach((month: any) => {
      month.avgTransaction = (month.income + month.expense) / month.count;
    });

    const sortedMonthlyData = Object.values(monthlyData).sort((a: any, b: any) => 
      a.month.localeCompare(b.month)
    );

    // 2. Top ragioni sociali con analisi dettagliata
    const companyData = movements.reduce((acc, movement) => {
      const company = movement.company?.name || 'Senza Ragione Sociale';
      if (!acc[company]) {
        acc[company] = { 
          name: company.length > 20 ? company.substring(0, 20) + '...' : company,
          fullName: company,
          income: 0, 
          expense: 0, 
          total: 0, 
          count: 0,
          net: 0
        };
      }
      
      const amount = parseFloat(movement.amount);
      acc[company].total += amount;
      acc[company].count += 1;
      
      if (movement.type === 'income') {
        acc[company].income += amount;
        acc[company].net += amount;
      } else {
        acc[company].expense += amount;
        acc[company].net -= amount;
      }
      
      return acc;
    }, {} as Record<string, any>);

    const topCompanies = Object.values(companyData)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 8);

    // 3. Distribuzione stati con percentuali
    const statusData = movements.reduce((acc, movement) => {
      const status = movement.status?.name || 'Senza Stato';
      const amount = parseFloat(movement.amount);
      
      if (!acc[status]) {
        acc[status] = { name: status, value: 0, count: 0, percentage: 0 };
      }
      
      acc[status].value += amount;
      acc[status].count += 1;
      return acc;
    }, {} as Record<string, any>);

    const totalStatusValue = Object.values(statusData).reduce((sum: number, item: any) => sum + item.value, 0);
    const statusChartData = Object.values(statusData).map((item: any) => ({
      ...item,
      percentage: ((item.value / totalStatusValue) * 100).toFixed(1)
    }));

    // 4. Analisi IVA professionale
    const vatData = movements.reduce((acc, movement) => {
      if (movement.vatType && movement.vatAmount) {
        const vatTypeMap: Record<string, string> = {
          'iva_22': 'IVA 22%',
          'iva_10': 'IVA 10%',
          'iva_4': 'IVA 4%',
          'esente': 'Esente'
        };
        
        const vatType = vatTypeMap[movement.vatType] || movement.vatType;
        
        if (!acc[vatType]) {
          acc[vatType] = { name: vatType, amount: 0, count: 0, avgAmount: 0 };
        }
        
        acc[vatType].amount += parseFloat(movement.vatAmount);
        acc[vatType].count += 1;
      }
      return acc;
    }, {} as Record<string, any>);

    // Calcola media IVA
    Object.values(vatData).forEach((vat: any) => {
      vat.avgAmount = vat.amount / vat.count;
    });

    const vatChartData = Object.values(vatData);

    // 5. Top fornitori con analisi spese
    const supplierData = movements
      .filter(m => m.supplier && m.type === 'expense')
      .reduce((acc, movement) => {
        const supplier = movement.supplier!.name;
        const amount = parseFloat(movement.amount);
        
        if (!acc[supplier]) {
          acc[supplier] = { 
            name: supplier.length > 15 ? supplier.substring(0, 15) + '...' : supplier,
            fullName: supplier,
            value: 0, 
            count: 0,
            avgExpense: 0
          };
        }
        
        acc[supplier].value += amount;
        acc[supplier].count += 1;
        return acc;
      }, {} as Record<string, any>);

    // Calcola media spese per fornitore
    Object.values(supplierData).forEach((supplier: any) => {
      supplier.avgExpense = supplier.value / supplier.count;
    });

    const topSuppliers = Object.values(supplierData)
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 6);

    // 6. Performance settimanale
    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    
    const recentMovements = movements.filter(m => 
      new Date(m.flowDate) >= fourWeeksAgo
    );

    const weeklyData = recentMovements.reduce((acc, movement) => {
      const date = new Date(movement.flowDate);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      const weekLabel = `Sett. ${Math.ceil((date.getTime() - fourWeeksAgo.getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
      
      if (!acc[weekKey]) {
        acc[weekKey] = { 
          week: weekLabel,
          income: 0, 
          expense: 0,
          net: 0,
          transactions: 0,
          efficiency: 0
        };
      }
      
      const amount = parseFloat(movement.amount);
      if (movement.type === 'income') {
        acc[weekKey].income += amount;
        acc[weekKey].net += amount;
      } else {
        acc[weekKey].expense += amount;
        acc[weekKey].net -= amount;
      }
      acc[weekKey].transactions += 1;
      
      return acc;
    }, {} as Record<string, any>);

    // Calcola efficienza settimanale
    Object.values(weeklyData).forEach((week: any) => {
      week.efficiency = week.income > 0 ? (week.net / week.income) * 100 : 0;
    });

    const sortedWeeklyData = Object.values(weeklyData).sort((a: any, b: any) => 
      a.week.localeCompare(b.week)
    );

    return {
      monthly: sortedMonthlyData,
      companies: topCompanies,
      status: statusChartData,
      vat: vatChartData,
      suppliers: topSuppliers,
      weekly: sortedWeeklyData
    };
  }, [movements]);

  // Statistiche avanzate
  const stats = useMemo(() => {
    if (!movements || movements.length === 0) return null;

    const income = movements.filter(m => m.type === 'income');
    const expenses = movements.filter(m => m.type === 'expense');
    
    const totalIncome = income.reduce((sum, m) => sum + parseFloat(m.amount), 0);
    const totalExpense = expenses.reduce((sum, m) => sum + parseFloat(m.amount), 0);
    const totalVat = movements.filter(m => m.vatAmount).reduce((sum, m) => sum + parseFloat(m.vatAmount!), 0);
    
    const avgIncome = income.length > 0 ? totalIncome / income.length : 0;
    const avgExpense = expenses.length > 0 ? totalExpense / expenses.length : 0;
    
    const withDocuments = movements.filter(m => m.documentPath).length;
    const withVat = movements.filter(m => m.vatAmount).length;

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      totalVat,
      avgIncome,
      avgExpense,
      count: movements.length,
      incomeCount: income.length,
      expenseCount: expenses.length,
      documentsPercentage: (withDocuments / movements.length) * 100,
      vatPercentage: (withVat / movements.length) * 100,
      profitMargin: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0
    };
  }, [movements]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('it-IT', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);

  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}k`;
    return formatCurrency(value);
  };

  // Custom tooltip per grafici
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span> {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <div className="h-6 w-6 bg-muted-foreground/20 rounded" />
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted-foreground/20 rounded mb-2" />
                    <div className="h-6 bg-muted-foreground/20 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted-foreground/20 rounded w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted-foreground/10 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!chartData || !stats) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-96 text-center">
          <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nessun dato disponibile</h3>
          <p className="text-muted-foreground max-w-md">
            Applica i filtri per visualizzare grafici e analisi dettagliate dei tuoi movimenti finanziari.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Entrate Totali</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(stats.totalIncome)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.incomeCount} movimenti • Media: {formatCompactCurrency(stats.avgIncome)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Uscite Totali</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(stats.totalExpense)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.expenseCount} movimenti • Media: {formatCompactCurrency(stats.avgExpense)}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className={`bg-gradient-to-br p-6 ${
              stats.net >= 0 
                ? 'from-blue-500/10 to-blue-600/5' 
                : 'from-orange-500/10 to-orange-600/5'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saldo Netto</p>
                  <p className={`text-2xl font-bold ${
                    stats.net >= 0 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    {formatCurrency(stats.net)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Margine: {stats.profitMargin.toFixed(1)}%
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  stats.net >= 0 
                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                    : 'bg-orange-100 dark:bg-orange-900/30'
                }`}>
                  <Euro className={`h-6 w-6 ${
                    stats.net >= 0 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-orange-600 dark:text-orange-400'
                  }`} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">IVA Totale</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(stats.totalVat)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.vatPercentage.toFixed(0)}% movimenti con IVA
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Professional Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Mensile Avanzato */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Analisi Trend Mensile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData.monthly} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PROFESSIONAL_COLORS.success} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={PROFESSIONAL_COLORS.success} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PROFESSIONAL_COLORS.danger} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={PROFESSIONAL_COLORS.danger} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--muted-foreground))" 
                  opacity={0.3}
                />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={formatCompactCurrency}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Entrate"
                  stroke={PROFESSIONAL_COLORS.success}
                  fill="url(#incomeGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Uscite"
                  stroke={PROFESSIONAL_COLORS.danger}
                  fill="url(#expenseGradient)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  name="Saldo Netto"
                  stroke={PROFESSIONAL_COLORS.info}
                  strokeWidth={3}
                  dot={{ fill: PROFESSIONAL_COLORS.info, strokeWidth: 2, r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Ragioni Sociali */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Top Ragioni Sociali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData.companies} layout="horizontal" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--muted-foreground))" 
                  opacity={0.3}
                />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={formatCompactCurrency}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  width={120}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="total" 
                  fill={PROFESSIONAL_COLORS.info} 
                  radius={[0, 4, 4, 0]}
                  name="Volume Totale"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuzione Stati */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Stati Movimenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={chartData.status}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.status.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Analisi IVA */}
        {chartData.vat.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Distribuzione IVA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.vat} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--muted-foreground))" 
                    opacity={0.3}
                  />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={formatCompactCurrency}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="amount" 
                    fill={PROFESSIONAL_COLORS.purple} 
                    radius={[4, 4, 0, 0]}
                    name="Importo IVA"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Fornitori */}
        {chartData.suppliers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Fornitori
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.suppliers} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--muted-foreground))" 
                    opacity={0.3}
                  />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    interval={0}
                    height={60}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={formatCompactCurrency}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="value" 
                    fill={PROFESSIONAL_COLORS.danger} 
                    radius={[4, 4, 0, 0]}
                    name="Spese Totali"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}