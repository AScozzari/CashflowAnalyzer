// HMR SAFETY: Disable refresh functions before any imports
if (typeof window !== 'undefined') {
  (window as any).$RefreshReg$ = () => () => {};
  (window as any).$RefreshSig$ = () => (type: any) => type;
  (window as any).__vite_plugin_react_preamble_installed__ = true;
}

import { AiChat } from "@/components/ai/ai-chat";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageSquare, Sparkles } from "lucide-react";

export default function AiChatPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Standard Header con icona Bot per accesso rapido */}
      <Header 
        title="AI Assistant" 
        subtitle="Il tuo assistente intelligente per analisi finanziarie e gestione aziendale"
      />

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <MessageSquare className="w-4 h-4" />
              Chat Intelligente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Conversazioni naturali per analisi finanziarie e consigli di gestione
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
              Analisi Avanzate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Insights dettagliati sui flussi di cassa e previsioni intelligenti
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-400">
              <Bot className="w-4 h-4" />
              Supporto 24/7
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Assistenza continua per decisioni aziendali e ottimizzazione processi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chat Interface */}
      <AiChat />
    </div>
  );
}