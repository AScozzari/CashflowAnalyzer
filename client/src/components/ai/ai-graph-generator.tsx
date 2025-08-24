import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BarChart3, PieChart, LineChart, TrendingUp, Loader2, Download, Eye, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter
} from 'recharts';

interface ChartConfig {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  data: any[];
  config: {
    xKey: string;
    yKeys: string[];
    colors: string[];
    formatters?: Record<string, (value: any) => string>;
  };
  description: string;
  insights: string[];
  createdAt: string;
  confidence: number;
}

interface AIGraphGeneratorProps {
  onChartGenerated?: (chart: ChartConfig) => void;
  dataSource?: 'movements' | 'companies' | 'analytics' | 'all';
}

const CHART_TYPES = [
  { value: 'line', label: 'Grafico a Linee', icon: LineChart },
  { value: 'bar', label: 'Grafico a Barre', icon: BarChart3 },
  { value: 'pie', label: 'Grafico a Torta', icon: PieChart },
  { value: 'area', label: 'Grafico ad Area', icon: TrendingUp },
  { value: 'scatter', label: 'Grafico a Dispersione', icon: BarChart3 }
];

// Query generate dinamicamente basate sui dati reali del database
const generateDynamicQueries = (movements: any[], companies: any[], suppliers: any[]) => {
  const baseQueries = [
    "Andamento delle entrate e uscite negli ultimi 6 mesi",
    "Evoluzione del cashflow nel tempo",
    "Distribuzione dei movimenti per categoria"
  ];

  const dynamicQueries = [];
  
  // Aggiungi query basate sui dati reali
  if (movements?.length > 0) {
    const categories = [...new Set(movements.map(m => m.category).filter(Boolean))];
    if (categories.length > 0) {
      dynamicQueries.push(`Analisi per categoria: ${categories.slice(0, 3).join(', ')}`);
    }

    const types = [...new Set(movements.map(m => m.type).filter(Boolean))];
    if (types.length > 1) {
      dynamicQueries.push("Confronto entrate vs uscite per periodo");
    }
  }

  if (companies?.length > 0) {
    dynamicQueries.push(`Performance delle ${companies.length} aziende registrate`);
    dynamicQueries.push("Ripartizione geografica delle aziende clienti");
  }

  if (suppliers?.length > 0) {
    dynamicQueries.push(`Analisi dei ${suppliers.length} fornitori per volume di spesa`);
  }

  return [...baseQueries, ...dynamicQueries].slice(0, 8);
};

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

export function AIGraphGenerator({ onChartGenerated, dataSource = 'all' }: AIGraphGeneratorProps) {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [generatedCharts, setGeneratedCharts] = useState<ChartConfig[]>([]);
  const [viewingChart, setViewingChart] = useState<ChartConfig | null>(null);
  const { toast } = useToast();

  // Fetch dati reali per generare query dinamiche
  const { data: movements = [] } = useQuery({
    queryKey: ['/api/movements'],
    staleTime: 5 * 60 * 1000,
    enabled: dataSource === 'all' || dataSource === 'movements'
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['/api/companies'],
    staleTime: 5 * 60 * 1000,
    enabled: dataSource === 'all' || dataSource === 'companies'
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['/api/suppliers'],
    staleTime: 5 * 60 * 1000,
    enabled: dataSource === 'all'
  });

  // Genera preset queries dinamici basati sui dati reali
  const PRESET_QUERIES = generateDynamicQueries(movements, companies, suppliers);

  // Generate chart mutation
  const generateChartMutation = useMutation({
    mutationFn: async ({ query, chartType }: { query: string; chartType?: string }) => {
      const response = await apiRequest('POST', '/api/ai/generate-chart', {
        query,
        chartType,
        dataSource,
        includeInsights: true
      });
      return response;
    },
    onSuccess: (chart: ChartConfig) => {
      toast({
        title: "✅ Grafico Generato",
        description: `Creato grafico "${chart.title}" con confidenza ${(chart.confidence * 100).toFixed(0)}%`,
      });
      
      setGeneratedCharts(prev => [chart, ...prev.slice(0, 9)]); // Keep last 10 charts
      setQuery("");
      setSelectedType("");
      
      if (onChartGenerated) {
        onChartGenerated(chart);
      }
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore Generazione",
        description: error.message || "Errore nella generazione del grafico",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      generateChartMutation.mutate({ 
        query: query.trim(), 
        chartType: selectedType || undefined 
      });
    }
  };

  const executePresetQuery = (presetQuery: string) => {
    setQuery(presetQuery);
    generateChartMutation.mutate({ query: presetQuery });
  };

  const exportChart = (chart: ChartConfig) => {
    const chartData = {
      title: chart.title,
      type: chart.type,
      data: chart.data,
      config: chart.config,
      insights: chart.insights,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(chartData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chart_${chart.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "📊 Export Completato",
      description: "La configurazione del grafico è stata esportata",
    });
  };

  const renderChart = (chart: ChartConfig) => {
    const { type, data, config } = chart;
    const { xKey, yKeys, colors } = config;

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              {yKeys.map((key, index) => (
                <Line 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  stroke={colors[index] || COLORS[index % COLORS.length]} 
                  strokeWidth={2}
                />
              ))}
            </RechartsLineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              {yKeys.map((key, index) => (
                <Bar 
                  key={key}
                  dataKey={key} 
                  fill={colors[index] || COLORS[index % COLORS.length]} 
                />
              ))}
            </RechartsBarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey={yKeys[0]}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index] || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              {yKeys.map((key, index) => (
                <Area 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  stackId="1"
                  stroke={colors[index] || COLORS[index % COLORS.length]} 
                  fill={colors[index] || COLORS[index % COLORS.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Scatter dataKey={yKeys[0]} fill={colors[0] || COLORS[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return <div className="h-64 flex items-center justify-center text-muted-foreground">Tipo di grafico non supportato</div>;
    }
  };

  const getChartTypeIcon = (type: string) => {
    const chartType = CHART_TYPES.find(t => t.value === type);
    const Icon = chartType?.icon || BarChart3;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Chart Generator */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Palette className="w-5 h-5 text-purple-600" />
            <CardTitle>Generatore Grafici AI</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Descrivi il grafico che vuoi creare... es: 'Mostra l'andamento delle entrate per mese'"
                className="flex-1"
                disabled={generateChartMutation.isPending}
              />
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipo grafico (opzionale)" />
                </SelectTrigger>
                <SelectContent>
                  {CHART_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <type.icon className="w-4 h-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="submit" 
                disabled={generateChartMutation.isPending || !query.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {generateChartMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <BarChart3 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>

          {/* Preset Queries */}
          <div>
            <p className="text-sm font-medium mb-3">Grafici Suggeriti:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {PRESET_QUERIES.map((preset, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => executePresetQuery(preset)}
                  disabled={generateChartMutation.isPending}
                  className="text-xs justify-start h-auto py-2"
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>

          {/* AI Processing Info */}
          {generateChartMutation.isPending && (
            <div className="p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span className="text-sm text-purple-800 dark:text-purple-200">
                  L'AI sta generando il grafico e analizzando i dati...
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Charts */}
      {generatedCharts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Grafici Generati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {generatedCharts.map((chart) => (
                <Card key={chart.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getChartTypeIcon(chart.type)}
                        <CardTitle className="text-base">{chart.title}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={chart.confidence > 0.8 ? "default" : "secondary"}>
                          {(chart.confidence * 100).toFixed(0)}%
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => exportChart(chart)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh]">
                            <DialogHeader>
                              <DialogTitle>{chart.title}</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-[70vh]">
                              <div className="space-y-4">
                                <div className="h-96">
                                  {renderChart(chart)}
                                </div>
                                
                                <Separator />
                                
                                <div>
                                  <h5 className="font-medium mb-2">Insights AI:</h5>
                                  <ul className="space-y-1 text-sm text-muted-foreground">
                                    {chart.insights.map((insight, idx) => (
                                      <li key={idx}>• {insight}</li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div>
                                  <h5 className="font-medium mb-2">Descrizione:</h5>
                                  <p className="text-sm text-muted-foreground">{chart.description}</p>
                                </div>
                                
                                <div className="text-xs text-muted-foreground">
                                  Generato il {new Date(chart.createdAt).toLocaleString('it-IT')}
                                </div>
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 mb-3">
                      {renderChart(chart)}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-2">{chart.description}</p>
                      <div className="flex items-center justify-between">
                        <span>{chart.data.length} punti dati</span>
                        <span>{new Date(chart.createdAt).toLocaleDateString('it-IT')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}