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
  Building2
} from "lucide-react";
import type { MovementWithRelations } from "@shared/schema";

interface AnalyticsChartsProps {
  movements: MovementWithRelations[];
  isLoading?: boolean;
}

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

export default function AnalyticsChartsImproved({ movements, isLoading }: AnalyticsChartsProps) {
  const chartData = useMemo(() => {
    if (!movements || movements.length === 0) return null;

    // 1. Analisi mensile con trend
    const monthlyData = movements.reduce((acc, movement) => {
      const monthKey = new Date(movement.flowDate).toLocaleDateString('it-IT', { 
        year: 'numeric', 
        month: '2-digit' 
      });
      const monthLabel = new Date(movement.flowDate).toLocaleDateString('it-IT', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!acc[monthKey]) {
        acc[monthKey] = { 
          month: monthLabel,
          monthKey,
          income: 0, 
          expense: 0,
          net: 0,
          count: 0
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
    }, {} as Record<string, { month: string; monthKey: string; income: number; expense: number; net: number; count: number }>);

    const sortedMonthlyData = Object.values(monthlyData).sort((a, b) => 
      a.monthKey.localeCompare(b.monthKey)
    );

    // 2. Distribuzione per ragione sociale (top 8)
    const companyData = movements.reduce((acc, movement) => {
      const company = movement.company?.name || 'Senza Ragione Sociale';
      if (!acc[company]) {
        acc[company] = { name: company, income: 0, expense: 0, total: 0, count: 0 };
      }
      
      const amount = parseFloat(movement.amount);
      acc[company].total += amount;
      acc[company].count += 1;
      
      if (movement.type === 'income') {
        acc[company].income += amount;
      } else {
        acc[company].expense += amount;
      }
      
      return acc;
    }, {} as Record<string, { name: string; income: number; expense: number; total: number; count: number }>);

    const topCompanies = Object.values(companyData)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // 3. Distribuzione per stato con percentuali
    const statusData = movements.reduce((acc, movement) => {
      const status = movement.status?.name || 'Senza Stato';
      const amount = parseFloat(movement.amount);
      
      if (!acc[status]) {
        acc[status] = { name: status, value: 0, count: 0 };
      }
      
      acc[status].value += amount;
      acc[status].count += 1;
      return acc;
    }, {} as Record<string, { name: string; value: number; count: number }>);

    const statusChartData = Object.values(statusData);
    const totalValue = statusChartData.reduce((sum, item) => sum + item.value, 0);

    // 4. Analisi IVA dettagliata
    const vatData = movements.reduce((acc, movement) => {
      if (movement.vatType && movement.vatAmount) {
        const vatType = movement.vatType === 'iva_22' ? 'IVA 22%' :
                       movement.vatType === 'iva_10' ? 'IVA 10%' :
                       movement.vatType === 'iva_4' ? 'IVA 4%' :
                       movement.vatType === 'esente' ? 'Esente' : movement.vatType;
        
        if (!acc[vatType]) {
          acc[vatType] = { name: vatType, amount: 0, count: 0 };
        }
        
        acc[vatType].amount += parseFloat(movement.vatAmount);
        acc[vatType].count += 1;
      }
      return acc;
    }, {} as Record<string, { name: string; amount: number; count: number }>);

    const vatChartData = Object.values(vatData);

    // 5. Top fornitori (solo uscite)
    const supplierData = movements
      .filter(m => m.supplier && m.type === 'expense')
      .reduce((acc, movement) => {
        const supplier = movement.supplier!.name;
        const amount = parseFloat(movement.amount);
        
        if (!acc[supplier]) {
          acc[supplier] = { name: supplier, value: 0, count: 0 };
        }
        
        acc[supplier].value += amount;
        acc[supplier].count += 1;
        return acc;
      }, {} as Record<string, { name: string; value: number; count: number }>);

    const topSuppliers = Object.values(supplierData)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // 6. Trend settimanale degli ultimi 30 giorni
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentMovements = movements.filter(m => 
      new Date(m.flowDate) >= thirtyDaysAgo
    );

    const weeklyData = recentMovements.reduce((acc, movement) => {
      const date = new Date(movement.flowDate);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
      
      if (!acc[weekKey]) {
        acc[weekKey] = { 
          week: weekLabel,
          weekKey,
          income: 0, 
          expense: 0,
          net: 0,
          transactions: 0
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
    }, {} as Record<string, { week: string; weekKey: string; income: number; expense: number; net: number; transactions: number }>);

    const sortedWeeklyData = Object.values(weeklyData).sort((a, b) => 
      a.weekKey.localeCompare(b.weekKey)
    );

    return {
      monthly: sortedMonthlyData,
      companies: topCompanies,
      status: statusChartData,
      statusTotal: totalValue,
      vat: vatChartData,
      suppliers: topSuppliers,
      weekly: sortedWeeklyData
    };
  }, [movements]);

  // Statistiche di riepilogo
  const stats = useMemo(() => {
    if (!movements || movements.length === 0) return null;

    const totalIncome = movements
      .filter(m => m.type === 'income')
      .reduce((sum, m) => sum + parseFloat(m.amount), 0);

    const totalExpense = movements
      .filter(m => m.type === 'expense')
      .reduce((sum, m) => sum + parseFloat(m.amount), 0);

    const totalVat = movements
      .filter(m => m.vatAmount)
      .reduce((sum, m) => sum + parseFloat(m.vatAmount!), 0);

    const withDocuments = movements.filter(m => m.documentPath).length;

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      totalVat,
      count: movements.length,
      documentsPercentage: (withDocuments / movements.length) * 100
    };
  }, [movements]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);

  const formatPercentage = (value: number, total: number) => 
    `${((value / total) * 100).toFixed(1)}%`;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!chartData || !stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nessun dato disponibile per i grafici</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entrate Totali</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Uscite Totali</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpense)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${stats.net >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                <Euro className={`h-6 w-6 ${stats.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo Netto</p>
                <p className={`text-2xl font-bold ${stats.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatCurrency(stats.net)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Movimenti</p>
                <p className="text-2xl font-bold text-purple-600">{stats.count}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.documentsPercentage.toFixed(0)}% con documenti
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Mensile */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Trend Mensile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.monthly}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#374151' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#374151' }}
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value), 
                    name === 'income' ? 'Entrate' : name === 'expense' ? 'Uscite' : 'Netto'
                  ]}
                  labelFormatter={(label) => `Mese: ${label}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Entrate"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Uscite"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
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
              Ragioni Sociali (Top 8)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.companies} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  width={120}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Totale']}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuzione Stati */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Stati Movimenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.status}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatPercentage(value, chartData.statusTotal)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Importo']} />
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
                <BarChart data={chartData.vat}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'IVA']} />
                  <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
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
                <TrendingDown className="h-5 w-5" />
                Top Fornitori
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.suppliers}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, angle: -45 }}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Speso']} />
                  <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}