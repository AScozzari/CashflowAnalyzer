import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown, AlertTriangle, Brain, RefreshCw, Eye, BarChart3, PieChart } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar } from 'recharts';

interface FinancialInsight {
  id: string;
  type: 'trend' | 'prediction' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: 'income' | 'expense' | 'cashflow' | 'general';
  data?: any;
  createdAt: string;
  priority: number;
}

interface InsightMetrics {
  totalInsights: number;
  highPriorityAlerts: number;
  predictionAccuracy: number;
  lastUpdateTime: string;
  trendsData: Array<{
    period: string;
    income: number;
    expense: number;
    net: number;
  }>;
  categoryBreakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

interface FinancialInsightsWidgetProps {
  showFullInterface?: boolean;
  maxInsights?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

export function FinancialInsightsWidget({ 
  showFullInterface = false, 
  maxInsights = 5,
  autoRefresh = true,
  refreshInterval = 300000 // 5 minutes
}: FinancialInsightsWidgetProps) {
  const [selectedInsight, setSelectedInsight] = useState<FinancialInsight | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  // Fetch financial insights
  const { data: insights = [], isLoading: insightsLoading, refetch: refetchInsights } = useQuery<FinancialInsight[]>({
    queryKey: ['/api/ai/financial-insights'],
    retry: false,
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch metrics
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<InsightMetrics>({
    queryKey: ['/api/ai/financial-insights/metrics'],
    retry: false,
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Generate new insights mutation
  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/ai/financial-insights/generate');
      return response;
    },
    onSuccess: () => {
      toast({
        title: "✅ Insights Generati",
        description: "Nuovi insights finanziari sono stati generati dall'AI",
      });
      refetchInsights();
      refetchMetrics();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore Generazione",
        description: error.message || "Errore nella generazione degli insights",
        variant: "destructive",
      });
    },
  });

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetchInsights();
        refetchMetrics();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refetchInsights, refetchMetrics]);

  const getInsightIcon = (type: FinancialInsight['type']) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'prediction':
        return <Brain className="w-4 h-4 text-purple-500" />;
      case 'anomaly':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'recommendation':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  const getImpactBadge = (impact: FinancialInsight['impact']) => {
    const variants = {
      high: { variant: "destructive" as const, text: "Alto Impatto" },
      medium: { variant: "secondary" as const, text: "Medio Impatto" },
      low: { variant: "outline" as const, text: "Basso Impatto" }
    };
    const config = variants[impact];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const displayedInsights = insights.slice(0, maxInsights);

  if (!showFullInterface) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-lg">AI Financial Insights</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => generateInsightsMutation.mutate()}
              disabled={generateInsightsMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 ${generateInsightsMutation.isPending ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {insightsLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Caricamento insights...
            </div>
          ) : displayedInsights.length === 0 ? (
            <div className="text-center py-4">
              <Brain className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Nessun insight disponibile
              </p>
              <Button 
                onClick={() => generateInsightsMutation.mutate()}
                disabled={generateInsightsMutation.isPending}
                size="sm"
                variant="outline"
              >
                Genera Insights AI
              </Button>
            </div>
          ) : (
            displayedInsights.map((insight) => (
              <div key={insight.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {insight.description.substring(0, 80)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {getImpactBadge(insight.impact)}
                    <span className="text-xs text-muted-foreground">
                      {(insight.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{metrics.totalInsights}</p>
                  <p className="text-xs text-muted-foreground">Total Insights</p>
                </div>
                <Brain className="h-6 w-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-red-600">{metrics.highPriorityAlerts}</p>
                  <p className="text-xs text-muted-foreground">Alert Prioritari</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{(metrics.predictionAccuracy * 100).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Accuratezza</p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">Ultimo Update</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(metrics.lastUpdateTime).toLocaleTimeString('it-IT')}
                  </p>
                </div>
                <RefreshCw className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Trend Finanziari</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={metrics.trendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => [`€${value.toLocaleString('it-IT')}`, '']}
                    labelFormatter={(label) => `Periodo: ${label}`}
                  />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Entrate" />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Uscite" />
                  <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} name="Netto" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="w-5 h-5" />
                <span>Ripartizione Categorie</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={metrics.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {metrics.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`€${value.toLocaleString('it-IT')}`, '']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Insights Dettagliati</CardTitle>
            <Button 
              onClick={() => generateInsightsMutation.mutate()}
              disabled={generateInsightsMutation.isPending}
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generateInsightsMutation.isPending ? 'animate-spin' : ''}`} />
              Genera Nuovi
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {insightsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Caricamento insights...
            </div>
          ) : insights.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Nessun insight disponibile. Genera il primo set di analisi AI.
              </p>
              <Button 
                onClick={() => generateInsightsMutation.mutate()}
                disabled={generateInsightsMutation.isPending}
              >
                Genera Insights AI
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => (
                <div key={insight.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {insight.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <span>Categoria: {insight.category}</span>
                          <span>Confidenza: {(insight.confidence * 100).toFixed(1)}%</span>
                          <span>{new Date(insight.createdAt).toLocaleDateString('it-IT')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getImpactBadge(insight.impact)}
                      {insight.data && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{insight.title}</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-96">
                              <div className="space-y-3">
                                <p>{insight.description}</p>
                                <Separator />
                                <div>
                                  <h5 className="font-medium mb-2">Dati di Supporto:</h5>
                                  <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                                    {JSON.stringify(insight.data, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}