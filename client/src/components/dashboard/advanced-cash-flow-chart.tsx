import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, TrendingUp, TrendingDown, DollarSign, Filter, ZoomIn } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface CashFlowData {
  date: string;
  income: number;
  expenses: number;
  balance: number;
  category?: string;
  formattedDate?: string;
  netFlow?: number;
  trend?: string;
  details?: Array<{
    description: string;
    amount: number;
    type: "income" | "expense";
  }>;
}

interface AdvancedCashFlowChartProps {
  data?: CashFlowData[];
  isLoading?: boolean;
}

export default function AdvancedCashFlowChart({ data = [], isLoading }: AdvancedCashFlowChartProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [selectedPoint, setSelectedPoint] = useState<CashFlowData | null>(null);
  const [chartType, setChartType] = useState<"line" | "bar" | "composed">("composed");
  const [showDrillDown, setShowDrillDown] = useState(false);

  // Fetch detailed data when needed
  const { data: detailedData } = useQuery({
    queryKey: [`/api/analytics/cash-flow-detailed`, timeRange],
    queryFn: () => fetch(`/api/analytics/cash-flow?days=${timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365}&detailed=true`).then(res => res.json()),
    enabled: showDrillDown,
  });

  const processedData = useMemo(() => {
    if (!data) return [];
    
    return data.map(item => ({
      ...item,
      formattedDate: format(new Date(item.date), "dd MMM", { locale: it }),
      netFlow: item.income - item.expenses,
      trend: item.income > item.expenses ? "positive" : "negative"
    }));
  }, [data]);

  const stats = useMemo(() => {
    const totalIncome = processedData.reduce((sum, item) => sum + item.income, 0);
    const totalExpenses = processedData.reduce((sum, item) => sum + item.expenses, 0);
    const avgDaily = processedData.length > 0 ? (totalIncome - totalExpenses) / processedData.length : 0;
    const trend = processedData.length > 1 ? 
      (processedData[processedData.length - 1].balance - processedData[0].balance) / processedData[0].balance * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      netFlow: totalIncome - totalExpenses,
      avgDaily,
      trend
    };
  }, [processedData]);

  const pieData = useMemo(() => [
    { name: "Entrate", value: stats.totalIncome, fill: "#22c55e" },
    { name: "Uscite", value: Math.abs(stats.totalExpenses), fill: "#ef4444" }
  ], [stats]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="h-6 bg-muted animate-pulse rounded w-1/3" />
          <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const handleDataPointClick = (data: any) => {
    setSelectedPoint(data);
    setShowDrillDown(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 h-6 text-xs"
            onClick={() => handleDataPointClick(payload[0]?.payload)}
          >
            <ZoomIn className="h-3 w-3 mr-1" />
            Dettagli
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analisi Flussi di Cassa Avanzata
              </CardTitle>
              <CardDescription>
                Dashboard interattivo con drill-down e analisi predittiva
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 giorni</SelectItem>
                  <SelectItem value="30d">30 giorni</SelectItem>
                  <SelectItem value="90d">90 giorni</SelectItem>
                  <SelectItem value="1y">1 anno</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Linee</SelectItem>
                  <SelectItem value="bar">Barre</SelectItem>
                  <SelectItem value="composed">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Entrate Totali</p>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(stats.totalIncome)}</p>
                </div>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Uscite Totali</p>
                  <p className="text-lg font-semibold text-red-600">{formatCurrency(Math.abs(stats.totalExpenses))}</p>
                </div>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Flusso Netto</p>
                  <p className={`text-lg font-semibold ${stats.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.netFlow)}
                  </p>
                </div>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Trend</p>
                  <p className={`text-lg font-semibold ${stats.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.trend >= 0 ? '+' : ''}{stats.trend.toFixed(1)}%
                  </p>
                </div>
                <Badge variant={stats.trend >= 0 ? "default" : "destructive"} className="text-xs">
                  {stats.trend >= 0 ? 'Crescita' : 'Calo'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Charts Tabs */}
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="distribution">Distribuzione</TabsTrigger>
              <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timeline" className="mt-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "composed" ? (
                    <ComposedChart data={processedData} onClick={handleDataPointClick}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="formattedDate" 
                        className="text-xs"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fontSize: 11 }}
                        tickFormatter={formatCurrency}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="income" fill="#22c55e" name="Entrate" />
                      <Bar dataKey="expenses" fill="#ef4444" name="Uscite" />
                      <Line 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Saldo"
                      />
                    </ComposedChart>
                  ) : chartType === "line" ? (
                    <ComposedChart data={processedData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="formattedDate" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={formatCurrency} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} name="Entrate" />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Uscite" />
                      <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={3} name="Saldo" />
                    </ComposedChart>
                  ) : (
                    <ComposedChart data={processedData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="formattedDate" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={formatCurrency} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="income" fill="#22c55e" name="Entrate" />
                      <Bar dataKey="expenses" fill="#ef4444" name="Uscite" />
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="distribution" className="mt-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="heatmap" className="mt-4">
              <div className="grid grid-cols-7 gap-1 h-80">
                {processedData.map((day, index) => {
                  const intensity = Math.abs(day.netFlow) / Math.max(...processedData.map(d => Math.abs(d.netFlow))) || 0;
                  const isPositive = day.netFlow >= 0;
                  
                  return (
                    <div
                      key={index}
                      className={`relative aspect-square rounded cursor-pointer transition-all hover:scale-110 hover:z-10 ${
                        isPositive 
                          ? `bg-green-100 dark:bg-green-900` 
                          : `bg-red-100 dark:bg-red-900`
                      }`}
                      style={{
                        opacity: 0.3 + (intensity * 0.7),
                        backgroundColor: isPositive 
                          ? `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`
                          : `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`
                      }}
                      title={`${day.formattedDate}: ${formatCurrency(day.netFlow)}`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white mix-blend-difference">
                          {format(new Date(day.date), "d")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Drill-down Details */}
      {showDrillDown && selectedPoint && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Dettaglio {selectedPoint.formattedDate}</span>
              <Button variant="ghost" size="sm" onClick={() => setShowDrillDown(false)}>
                Chiudi
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-green-600 mb-2">Entrate</h4>
                <div className="space-y-1">
                  {selectedPoint.details?.filter(d => d.type === "income").map((detail, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{detail.description}</span>
                      <span className="font-medium text-green-600">{formatCurrency(detail.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-red-600 mb-2">Uscite</h4>
                <div className="space-y-1">
                  {selectedPoint.details?.filter(d => d.type === "expense").map((detail, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{detail.description}</span>
                      <span className="font-medium text-red-600">{formatCurrency(detail.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}