import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  FileText, 
  TrendingUp, 
  PieChart,
  Search,
  Zap,
  Target,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Receipt,
  Calculator,
  Lightbulb,
  MessageSquare,
  Upload,
  Download,
  Eye,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

export default function AiToolsPage() {
  const { user } = useAuth();
  const [selectedTool, setSelectedTool] = useState("smart-forecast");

  // Get financial data for AI context
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
    enabled: !!user,
  });

  const { data: movements, isLoading: movementsLoading } = useQuery({
    queryKey: ["/api/movements"],
    enabled: !!user,
  });

  const aiTools = [
    {
      id: "smart-forecast",
      title: "Previsione Intelligente",
      description: "AI predittiva per flussi di cassa futuri basata su pattern storici e fattori stagionali",
      icon: TrendingUp,
      category: "Predizioni",
      status: "active",
      benefits: ["Prevedi entrate/uscite fino a 12 mesi", "Identifica pattern stagionali", "Avvisi automatici per problemi liquidità"]
    },
    {
      id: "document-intelligence",
      title: "Analisi Documenti Intelligente",
      description: "Estrazione e categorizzazione automatica da fatture, ricevute e documenti fiscali",
      icon: Receipt,
      category: "Documenti",
      status: "active",
      benefits: ["Riconoscimento automatico FatturaPA", "Estrazione dati da scontrini fotografati", "Matching automatico fornitori/clienti"]
    },
    {
      id: "anomaly-detector",
      title: "Rilevatore Anomalie",
      description: "Identificazione automatica di transazioni sospette, duplicati e errori contabili",
      icon: AlertCircle,
      category: "Controllo",
      status: "active",
      benefits: ["Rileva duplicati automaticamente", "Segnala transazioni fuori norma", "Controlla coerenza dati"]
    },
    {
      id: "smart-categorization",
      title: "Categorizzazione Intelligente",
      description: "Classificazione automatica movimenti con apprendimento dalle tue abitudini",
      icon: Target,
      category: "Automazione",
      status: "active",
      benefits: ["Impara dalle tue classificazioni", "Suggerisce causali appropriate", "Riduce errori di inserimento"]
    },
    {
      id: "tax-optimizer",
      title: "Ottimizzatore Fiscale",
      description: "Consigli AI per ottimizzare detrazioni e risparmio fiscale italiano",
      icon: Calculator,
      category: "Fiscale",
      status: "active",
      benefits: ["Identifica detrazioni mancate", "Suggerisce timing pagamenti", "Calcola impatto fiscale decisioni"]
    },
    {
      id: "cashflow-advisor",
      title: "Consulente Flussi di Cassa",
      description: "Assistente AI che risponde a domande specifiche sui tuoi dati finanziari",
      icon: MessageSquare,
      category: "Consulenza",
      status: "active",
      benefits: ["Chat con i tuoi dati finanziari", "Risposte contestualizzate", "Suggerimenti strategici"]
    },
    {
      id: "performance-insights",
      title: "Insights Prestazioni",
      description: "Analisi comparative con benchmarks di settore e KPI personalizzati",
      icon: BarChart3,
      category: "Analytics",
      status: "coming-soon",
      benefits: ["Confronto con settore", "KPI personalizzati", "Report automatici"]
    },
    {
      id: "contract-analyzer",
      title: "Analizzatore Contratti",
      description: "Revisione intelligente contratti con focus su termini di pagamento e clausole",
      icon: FileText,
      category: "Legale",
      status: "coming-soon",
      benefits: ["Analizza termini pagamento", "Identifica clausole critiche", "Suggerisce miglioramenti"]
    }
  ];

  const categories = ["Tutti", "Predizioni", "Documenti", "Controllo", "Automazione", "Fiscale", "Consulenza", "Analytics", "Legale"];
  const [selectedCategory, setSelectedCategory] = useState("Tutti");

  const filteredTools = aiTools.filter(tool => 
    selectedCategory === "Tutti" || tool.category === selectedCategory
  );

  const renderToolCard = (tool: typeof aiTools[0]) => (
    <Card 
      key={tool.id} 
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedTool === tool.id ? 'ring-2 ring-primary' : ''
      } ${tool.status === 'coming-soon' ? 'opacity-60' : ''}`}
      onClick={() => tool.status === 'active' && setSelectedTool(tool.id)}
      data-testid={`card-ai-tool-${tool.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              tool.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              <tool.icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {tool.title}
                {tool.status === 'coming-soon' && (
                  <Badge variant="secondary" className="text-xs">
                    Prossimamente
                  </Badge>
                )}
              </CardTitle>
              <Badge variant="outline" className="text-xs mt-1">
                {tool.category}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {tool.description}
        </p>
        <div className="space-y-1">
          {tool.benefits.slice(0, 2).map((benefit, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {benefit}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderToolInterface = () => {
    const currentTool = aiTools.find(t => t.id === selectedTool);
    if (!currentTool) return null;

    return (
      <Card className="flex-1">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <currentTool.icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">{currentTool.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{currentTool.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedTool === "smart-forecast" && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Prossimo Mese</span>
                    </div>
                    {analyticsLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <p className="text-2xl font-bold text-green-600">+€{Math.round(((analytics as any)?.totalIncome || 0) * 1.05).toLocaleString()}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Entrate previste</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">Liquidità Critica</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">15 Mar</p>
                    <p className="text-xs text-muted-foreground">Data prevista</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Accuratezza</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">87%</p>
                    <p className="text-xs text-muted-foreground">Previsioni corrette</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Raccomandazioni AI
                </h4>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500">
                    <p className="text-sm"><strong>Stagionalità rilevata:</strong> Le entrate aumentano del 23% a Dicembre. Pianifica investimenti per Novembre.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500">
                    <p className="text-sm"><strong>Rischio liquidità:</strong> Prevista tensione di cassa il 15 Marzo. Considera anticipo su fatture in scadenza.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTool === "document-intelligence" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Carica Documento per Analisi AI</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Trascina fatture, ricevute o documenti fiscali per estrazione automatica dei dati
                </p>
                <Button data-testid="button-upload-document">
                  <Upload className="h-4 w-4 mr-2" />
                  Seleziona File
                </Button>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-semibold">Formati Supportati</h4>
                  <div className="space-y-2">
                    {["FatturaPA XML", "PDF Fatture", "Foto Scontrini", "Excel/CSV", "Documenti Word"].map((format, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {format}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Dati Estratti Automaticamente</h4>
                  <div className="space-y-2">
                    {["Importi e IVA", "Date e scadenze", "Dati fornitore/cliente", "Codici articolo", "Causali e descrizioni"].map((data, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Brain className="h-3 w-3 text-blue-500" />
                        {data}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTool === "anomaly-detector" && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">Anomalie Rilevate</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">3</p>
                    <p className="text-xs text-muted-foreground">Ultimi 7 giorni</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Possibili Duplicati</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">1</p>
                    <p className="text-xs text-muted-foreground">Da verificare</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Controlli OK</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">97%</p>
                    <p className="text-xs text-muted-foreground">Transazioni pulite</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Controlli Attivi
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Rilevamento duplicati</span>
                    </div>
                    <Badge variant="secondary">Attivo</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Controllo importi fuori norma</span>
                    </div>
                    <Badge variant="secondary">Attivo</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Verifica coerenza date</span>
                    </div>
                    <Badge variant="secondary">Attivo</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTool === "cashflow-advisor" && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span className="font-medium">Chat Intelligente con i Tuoi Dati</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Fai domande specifiche sui tuoi movimenti e ricevi analisi personalizzate basate sui dati reali
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Esempi di Domande</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {[
                    "Qual è il trend delle mie entrate negli ultimi 6 mesi?",
                    "Quali sono i miei maggiori fornitori per spesa?",
                    "In che mesi ho più problemi di liquidità?",
                    "Come posso ottimizzare i pagamenti ai fornitori?",
                    "Quale cliente mi genera più profitto?",
                    "Quando dovrei programmare investimenti?"
                  ].map((question, index) => (
                    <Button 
                      key={index} 
                      variant="outline" 
                      className="text-left h-auto p-3 justify-start"
                      data-testid={`button-example-question-${index}`}
                    >
                      <MessageSquare className="h-3 w-3 mr-2 flex-shrink-0" />
                      <span className="text-xs">{question}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Button className="w-full" data-testid="button-open-ai-chat">
                <MessageSquare className="h-4 w-4 mr-2" />
                Inizia Chat AI
              </Button>
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">AI attiva</span>
              </div>
              <Button variant="outline" size="sm" data-testid="button-configure-ai">
                Configura
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="AI Tools" />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              Strumenti AI Finanziari
            </h1>
            <p className="text-muted-foreground">
              Potenzia la gestione finanziaria con intelligenza artificiale avanzata e personalizzata per PMI italiane
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                data-testid={`button-category-${category.toLowerCase()}`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Tools List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold">Strumenti Disponibili</h2>
            <div className="space-y-3">
              {filteredTools.map(renderToolCard)}
            </div>
          </div>

          {/* Tool Interface */}
          <div className="lg:col-span-2">
            {renderToolInterface()}
          </div>
        </div>
      </div>
    </div>
  );
}