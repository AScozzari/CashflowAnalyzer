import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  FileText, 
  BarChart3, 
  MessageSquare, 
  Zap, 
  Brain, 
  TrendingUp, 
  FileSearch,
  Sparkles,
  Upload,
  Settings
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface AiTool {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  status: 'active' | 'configured' | 'disabled';
  color: string;
}

export function AiToolsWidget() {
  // Fetch AI settings to determine tool status
  const { data: aiSettings } = useQuery({
    queryKey: ['/api/ai/settings'],
    retry: false,
  });

  const { data: apiKeyStatus } = useQuery({
    queryKey: ['/api/ai/api-key/status'],
    retry: false,
  });

  const hasApiKey = (apiKeyStatus as any)?.hasKey === true;

  const aiTools: AiTool[] = [
    {
      id: 'chat',
      name: 'AI Chat',
      description: 'Chat intelligente per analisi e consigli',
      icon: MessageSquare,
      path: '/ai-chat',
      status: hasApiKey && (aiSettings as any)?.chatEnabled ? 'active' : 'disabled',
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30'
    },
    {
      id: 'document',
      name: 'Analisi Documenti',
      description: 'Estrazione automatica dati da fatture',
      icon: FileSearch,
      path: '/movements/new',
      status: hasApiKey && (aiSettings as any)?.documentProcessingEnabled ? 'active' : 'disabled',
      color: 'text-green-600 bg-green-50 dark:bg-green-950/30'
    },
    {
      id: 'insights',
      name: 'Insights Finanziari',
      description: 'Analisi predittive e raccomandazioni',
      icon: TrendingUp,
      path: '/analytics',
      status: hasApiKey && (aiSettings as any)?.analyticsEnabled ? 'active' : 'disabled',
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30'
    },
    {
      id: 'predictions',
      name: 'Previsioni AI',
      description: 'Forecasting e trend analysis',
      icon: Brain,
      path: '/analytics',
      status: hasApiKey && (aiSettings as any)?.predictionsEnabled ? 'active' : 'disabled',
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30'
    }
  ];

  const activeTools = aiTools.filter(tool => tool.status === 'active');
  const disabledTools = aiTools.filter(tool => tool.status === 'disabled');

  return (
    <Card className="border-0 shadow-lg" data-testid="ai-tools-widget">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/5">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">AI Tools</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Strumenti intelligenti per la gestione aziendale
              </p>
            </div>
          </div>
          <Link href="/settings">
            <Button variant="outline" size="sm" data-testid="button-ai-settings">
              <Settings className="w-4 h-4 mr-2" />
              Config
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!hasApiKey ? (
          <div className="text-center py-6 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              Configura API Key OpenAI
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
              Accedi alle impostazioni per abilitare l'AI
            </p>
          </div>
        ) : (
          <>
            {/* Active Tools */}
            {activeTools.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                    {activeTools.length} Attivi
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {activeTools.map((tool) => (
                    <Link key={tool.id} href={tool.path}>
                      <div 
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md",
                          tool.color,
                          "border-transparent hover:border-current/20"
                        )}
                        data-testid={`ai-tool-${tool.id}`}
                      >
                        <tool.icon className="w-5 h-5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{tool.name}</p>
                          <p className="text-xs opacity-80 truncate">{tool.description}</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className="text-xs border-current/30 bg-current/10"
                        >
                          Attivo
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Disabled Tools */}
            {disabledTools.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-gray-500 border-gray-300">
                    {disabledTools.length} Disattivi
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {disabledTools.map((tool) => (
                    <div 
                      key={tool.id}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 opacity-60"
                      data-testid={`ai-tool-disabled-${tool.id}`}
                    >
                      <tool.icon className="w-5 h-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-600 dark:text-gray-400">
                          {tool.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{tool.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs border-gray-300 text-gray-500">
                        Disattivo
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-3 border-t">
              <div className="flex space-x-2">
                <Link href="/movements/new" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full" data-testid="button-ai-upload">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload AI
                  </Button>
                </Link>
                <Link href="/ai-chat" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full" data-testid="button-ai-chat">
                    <Bot className="w-4 h-4 mr-2" />
                    Chat AI
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}