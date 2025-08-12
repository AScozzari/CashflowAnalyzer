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
  Area,
  AreaChart
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import type { MovementWithRelations } from "@shared/schema";

interface AnalyticsChartsProps {
  movements: MovementWithRelations[];
  isLoading?: boolean;
}

export default function AnalyticsCharts({ movements, isLoading }: AnalyticsChartsProps) {
  const chartData = useMemo(() => {
    if (!movements || movements.length === 0) return null;

    // 1. Analisi per mese
    const monthlyData = movements.reduce((acc, movement) => {
      const month = new Date(movement.flowDate).toLocaleDateString('it-IT', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!acc[month]) {
        acc[month] = { month, income: 0, expense: 0 };
      }
      
      const amount = parseFloat(movement.amount);
      if (movement.type === 'income') {
        acc[month].income += amount;
      } else {
        acc[month].expense += amount;
      }
      
      return acc;
    }, {} as Record<string, { month: string; income: number; expense: number }>);

    const sortedMonthlyData = Object.values(monthlyData).sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );

    // 2. Distribuzione per stato
    const statusData = movements.reduce((acc, movement) => {
      const status = movement.status?.name || 'Senza Stato';
      acc[status] = (acc[status] || 0) + parseFloat(movement.amount);
      return acc;
    }, {} as Record<string, number>);

    const statusChartData = Object.entries(statusData).map(([name, value]) => ({
      name,
      value
    }));

    // 3. Distribuzione per tipo IVA
    const vatData = movements.reduce((acc, movement) => {
      if (movement.vatType && movement.vatAmount) {
        const vatType = movement.vatType.replace('iva_', 'IVA ').replace('_', '%').replace('art_74', 'Art 74');
        acc[vatType] = (acc[vatType] || 0) + parseFloat(movement.vatAmount);
      }
      return acc;
    }, {} as Record<string, number>);

    const vatChartData = Object.entries(vatData).map(([name, value]) => ({
      name,
      value
    }));

    // 4. Top Fornitori
    const supplierData = movements
      .filter(m => m.supplier && m.type === 'expense')
      .reduce((acc, movement) => {
        const supplier = movement.supplier!.name;
        acc[supplier] = (acc[supplier] || 0) + parseFloat(movement.amount);
        return acc;
      }, {} as Record<string, number>);

    const topSuppliers = Object.entries(supplierData)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    // 5. Distribuzione per Ragione Sociale
    const companyData = movements.reduce((acc, movement) => {
      const company = movement.company?.name || 'Senza Ragione Sociale';
      if (!acc[company]) {
        acc[company] = { company, income: 0, expense: 0 };
      }
      
      const amount = parseFloat(movement.amount);
      if (movement.type === 'income') {
        acc[company].income += amount;
      } else {
        acc[company].expense += amount;
      }
      
      return acc;
    }, {} as Record<string, { company: string; income: number; expense: number }>);

    const companyChartData = Object.values(companyData);

    // 6. Trend giornaliero
    const dailyData = movements.reduce((acc, movement) => {
      const date = new Date(movement.flowDate).toLocaleDateString('it-IT');
      
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0, net: 0 };
      }
      
      const amount = parseFloat(movement.amount);
      if (movement.type === 'income') {
        acc[date].income += amount;
        acc[date].net += amount;
      } else {
        acc[date].expense += amount;
        acc[date].net -= amount;
      }
      
      return acc;
    }, {} as Record<string, { date: string; income: number; expense: number; net: number }>);

    const sortedDailyData = Object.values(dailyData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      monthly: sortedMonthlyData,
      status: statusChartData,
      vat: vatChartData,
      suppliers: topSuppliers,
      companies: companyChartData,
      daily: sortedDailyData
    };
  }, [movements]);

  // Statistiche totali
  const totalStats = useMemo(() => {
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

    const net = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      totalVat,
      net,
      count: movements.length
    };
  }, [movements]);

  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!chartData || !totalStats) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Nessun dato disponibile per generare i grafici</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiche Totali */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entrate Totali</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(totalStats.totalIncome)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uscite Totali</p>
                <p className="text-2xl font-bold text-red-600">
                  {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(totalStats.totalExpense)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bilancio Netto</p>
                <p className={`text-2xl font-bold ${totalStats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(totalStats.net)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">IVA Totale</p>
                <p className="text-2xl font-bold text-blue-600">
                  {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(totalStats.totalVat)}
                </p>
                <p className="text-xs text-gray-500">{totalStats.count} movimenti</p>
              </div>
              <PieChartIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grafici */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Mensile */}
        <Card>
          <CardHeader>
            <CardTitle>Trend Mensile</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => [
                    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value),
                    undefined
                  ]}
                />
                <Legend />
                <Bar dataKey="income" name="Entrate" fill="#22C55E" />
                <Bar dataKey="expense" name="Uscite" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuzione per Stato */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuzione per Stato</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.status}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [
                  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value)
                ]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trend Giornaliero */}
        <Card>
          <CardHeader>
            <CardTitle>Trend Giornaliero</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => [
                    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value),
                    undefined
                  ]}
                />
                <Legend />
                <Line type="monotone" dataKey="net" name="Saldo Netto" stroke="#2563EB" strokeWidth={2} />
                <Line type="monotone" dataKey="income" name="Entrate" stroke="#22C55E" strokeWidth={1} />
                <Line type="monotone" dataKey="expense" name="Uscite" stroke="#EF4444" strokeWidth={1} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuzione IVA */}
        {chartData.vat.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Distribuzione IVA</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.vat}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.vat.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [
                    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value)
                  ]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Grafici a larghezza piena */}
      <div className="space-y-6">
        {/* Top Fornitori */}
        {chartData.suppliers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Fornitori (per Spesa)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.suppliers} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip 
                    formatter={(value: number) => [
                      new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value),
                      'Spesa Totale'
                    ]}
                  />
                  <Bar dataKey="value" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Distribuzione per Ragione Sociale */}
        <Card>
          <CardHeader>
            <CardTitle>Analisi per Ragione Sociale</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData.companies}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="company" angle={-45} textAnchor="end" height={100} />
                <YAxis tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => [
                    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value),
                    undefined
                  ]}
                />
                <Legend />
                <Bar dataKey="income" name="Entrate" fill="#22C55E" />
                <Bar dataKey="expense" name="Uscite" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}