import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  BarChart3, 
  MessageSquare,
  FileText,
  Calculator,
  ExternalLink,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Target,
  Clock
} from "lucide-react";
import { FooterSignature } from "@/components/layout/footer-signature";
import { useAuth } from "@/hooks/use-auth";

export default function AiToolsNewPage() {
  const { user } = useAuth();

  const aiFeatures = [
    {
      id: "analytics-ai",
      title: "AI Analytics Dashboard",
      description: "Quick Wins AI già integrati nella pagina Analytics",
      icon: BarChart3,
      status: "live",
      location: "Analytics",
      route: "/analytics",
      features: [
        "✅ Financial Health Score (0-100)",
        "✅ AI Insights in tempo reale", 
        "✅ Anomaly Detection automatico"
      ],
      bgColor: "bg-green-50 dark:bg-green-900/20",
      iconColor: "text-green-600",
      buttonText: "Usa Analytics AI"
    },
    {
      id: "chat-assistant",
      title: "Assistente AI Conversazionale",
      description: "Chat intelligente sui tuoi dati finanziari",
      icon: MessageSquare,
      status: "active",
      location: "AI Tools",
      route: "/ai-chat",
      features: [
        "🤖 Risposte su movimenti specifici",
        "💡 Consigli personalizzati", 
        "🔍 Query in linguaggio naturale"
      ],
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600",
      buttonText: "Apri Chat AI"
    },
    {
      id: "document-ai",
      title: "Analisi Documenti AI",
      description: "Upload e parsing automatico FatturaPA",
      icon: FileText,
      status: "active",
      location: "Movements",
      route: "/movements",
      features: [
        "📄 Riconoscimento FatturaPA",
        "⚡ Estrazione dati automatica",
        "🎯 Creazione movimenti suggeriti"
      ],
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconColor: "text-purple-600",
      buttonText: "Prova Upload AI"
    },
    {
      id: "tax-ai",
      title: "Consulente Fiscale AI",
      description: "Ottimizzazione fiscale per PMI italiane",
      icon: Calculator,
      status: "development",
      location: "Future",
      features: [
        "🇮🇹 Specifico per normative italiane",
        "📊 Detrazioni e agevolazioni",
        "💰 Timing pagamenti ottimale"
      ],
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      iconColor: "text-orange-600",
      buttonText: "In Sviluppo"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Live</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Attivo</Badge>;
      case 'development':
        return <Badge variant="secondary">In Sviluppo</Badge>;
      case 'coming-soon':
        return <Badge variant="outline">Prossimamente</Badge>;
      default:
        return <Badge variant="outline">Sconosciuto</Badge>;
    }
  };

  const getButton = (feature: typeof aiFeatures[0]) => {
    if (feature.route) {
      return (
        <Link href={feature.route}>
          <Button className="w-full" data-testid={`button-${feature.id}`}>
            {feature.buttonText}
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      );
    }
    
    return (
      <Button 
        variant="outline" 
        disabled={feature.status !== 'active'}
        className="w-full"
        data-testid={`button-${feature.id}`}
      >
        {feature.buttonText}
        {feature.status === 'development' && <Clock className="ml-2 h-4 w-4" />}
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="AI Assistant Hub" 
        subtitle="Centro di controllo per l'intelligenza artificiale finanziaria"
      />
      
      <div className="p-4 lg:p-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center py-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border">
          <Brain className="h-16 w-16 mx-auto text-purple-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            La tua AI Finanziaria è Attiva!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4">
            I Quick Wins AI sono già operativi nella pagina Analytics.
            Scopri tutte le funzionalità intelligenti disponibili.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              4 strumenti AI attivi • Chat AI disponibile via shortcut
            </span>
          </div>
        </div>

        {/* Status Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Stato AI Tools - Dettagli Completi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span><strong>Analytics AI</strong>: VERI e FUNZIONANTI (GPT-4o)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span><strong>Chat Assistant</strong>: ATTIVO (shortcut in header)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span><strong>Document AI</strong>: ATTIVO (parsing FatturaPA)</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span><strong>Tax AI</strong>: In sviluppo (demo)</span>
            </div>
          </div>
        </div>

        {/* AI Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {aiFeatures.map((feature) => (
            <Card 
              key={feature.id} 
              className={`${feature.bgColor} border-2 hover:shadow-lg transition-all duration-200`}
              data-testid={`card-ai-feature-${feature.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg bg-white/80 dark:bg-gray-800/80 ${feature.iconColor}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {feature.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {feature.location}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(feature.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  {feature.description}
                </p>
                
                {/* Features List */}
                <div className="space-y-2">
                  {feature.features.map((feat, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  {getButton(feature)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-800 rounded-lg p-6 border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-center">
            <Target className="h-12 w-12 mx-auto text-blue-600 mb-3" />
            <h3 className="text-xl font-semibold mb-2">Prossimi AI Tools</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Stiamo sviluppando nuovi strumenti AI specifici per PMI italiane
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                <div className="font-medium text-blue-600 mb-1">📊 Previsioni Cash Flow</div>
                <div className="text-gray-600 dark:text-gray-300">Predizioni 12 mesi</div>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                <div className="font-medium text-green-600 mb-1">🤖 AI Assistant Chat</div>
                <div className="text-gray-600 dark:text-gray-300">Q&A sui tuoi dati</div>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                <div className="font-medium text-purple-600 mb-1">⚖️ Compliance AI</div>
                <div className="text-gray-600 dark:text-gray-300">Normative italiane</div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-3">Quick Access AI</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Accesso rapido agli strumenti AI più utilizzati:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Analytics AI (Health Score, Insights, Anomalie)
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              Chat AI (icona Bot in header)
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-500" />
              Document AI (parsing FatturaPA)
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Tax AI (in sviluppo)
            </span>
          </div>
          <Link href="/analytics">
            <Button size="lg" className="px-8" data-testid="button-goto-analytics">
              Vai ad Analytics AI
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
      
      <FooterSignature />
    </div>
  );
}