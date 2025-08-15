import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Webhook, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle,
  Zap,
  Bot,
  Shield,
  Activity,
  Copy,
  ExternalLink,
  RefreshCw
} from "lucide-react";

interface WebhookInfo {
  webhookUrls: {
    twilio: {
      incoming: string;
      status: string;
      headers: { [key: string]: string };
    };
    linkmobility: {
      incoming: string;
      status: string;
      headers: { [key: string]: string };
    };
  };
  security: {
    production: boolean;
    signatureValidation: string;
    supportedMethods: string[];
  };
}

interface WebhookTestResult {
  success: boolean;
  message: string;
  timestamp: string;
  endpoints: string[];
}

export function WebhookDiagnostics() {
  const { toast } = useToast();
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);

  // Fetch webhook configuration info
  const { data: webhookInfo, isLoading, refetch } = useQuery<WebhookInfo>({
    queryKey: ["/api/webhooks/info"],
  });

  // Test webhook connectivity
  const { data: testResult, refetch: testWebhooks, isLoading: isTestingWebhooks } = useQuery<WebhookTestResult>({
    queryKey: ["/api/webhooks/test"],
    enabled: false
  });

  // Handle test webhook with toast feedback
  const handleTestWebhooks = async () => {
    try {
      const result = await testWebhooks();
      const data = result.data;
      
      toast({
        title: data?.success ? "✅ Test Webhook Completato" : "❌ Test Webhook Fallito",
        description: data?.success 
          ? `Sistema operativo: ${data.endpoints?.length || 0} endpoint testati con successo`
          : `Errore: ${data?.message || 'Test fallito'}`,
        variant: data?.success ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "❌ Errore Test Webhook",
        description: "Impossibile eseguire il test. Verifica la connessione di rete.",
        variant: "destructive",
      });
    }
  };

  // Handle refresh with toast feedback
  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "🔄 Configurazione Aggiornata",
        description: "Informazioni webhook caricate correttamente",
      });
    } catch (error) {
      toast({
        title: "❌ Errore Aggiornamento",
        description: "Impossibile aggiornare le configurazioni webhook",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiato!",
        description: `${label} copiato negli appunti`,
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile copiare negli appunti",
        variant: "destructive",
      });
    }
  };

  const testEndpoint = async (endpoint: string) => {
    setTestingEndpoint(endpoint);
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'User-Agent': 'EasyCashFlows-Webhook-Tester/1.0'
        }
      });
      
      const isSuccess = response.ok;
      toast({
        title: isSuccess ? "Test riuscito" : "Test fallito",
        description: `Endpoint ${endpoint}: ${response.status} ${response.statusText}`,
        variant: isSuccess ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Errore di connessione",
        description: `Impossibile raggiungere ${endpoint}`,
        variant: "destructive",
      });
    } finally {
      setTestingEndpoint(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Caricamento configurazioni webhook...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Sistema Webhook Multi-Channel
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleTestWebhooks}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={isTestingWebhooks}
              >
                <Activity className={`h-4 w-4 ${isTestingWebhooks ? 'animate-spin' : ''}`} />
                Test Generale
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Aggiorna
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="endpoints" className="space-y-4">
            <TabsList>
              <TabsTrigger value="endpoints">Endpoint</TabsTrigger>
              <TabsTrigger value="security">Sicurezza</TabsTrigger>
              <TabsTrigger value="ai">AI Integration</TabsTrigger>
              <TabsTrigger value="test">Test Results</TabsTrigger>
            </TabsList>

            <TabsContent value="endpoints" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Twilio Webhooks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                      Twilio WhatsApp
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Incoming Messages
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 p-2 bg-muted rounded text-xs font-mono">
                          {webhookInfo?.webhookUrls.twilio.incoming}
                        </code>
                        <Button
                          onClick={() => copyToClipboard(
                            webhookInfo?.webhookUrls.twilio.incoming || '',
                            'URL Twilio Incoming'
                          )}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => testEndpoint(webhookInfo?.webhookUrls.twilio.incoming || '')}
                          variant="outline"
                          size="sm"
                          disabled={testingEndpoint === webhookInfo?.webhookUrls.twilio.incoming}
                        >
                          {testingEndpoint === webhookInfo?.webhookUrls.twilio.incoming ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <ExternalLink className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Status Updates
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 p-2 bg-muted rounded text-xs font-mono">
                          {webhookInfo?.webhookUrls.twilio.status}
                        </code>
                        <Button
                          onClick={() => copyToClipboard(
                            webhookInfo?.webhookUrls.twilio.status || '',
                            'URL Twilio Status'
                          )}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Headers: x-provider: twilio
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* LinkMobility Webhooks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageSquare className="h-5 w-5 text-green-500" />
                      LinkMobility WhatsApp
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Incoming Messages
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 p-2 bg-muted rounded text-xs font-mono">
                          {webhookInfo?.webhookUrls.linkmobility.incoming}
                        </code>
                        <Button
                          onClick={() => copyToClipboard(
                            webhookInfo?.webhookUrls.linkmobility.incoming || '',
                            'URL LinkMobility Incoming'
                          )}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => testEndpoint(webhookInfo?.webhookUrls.linkmobility.incoming || '')}
                          variant="outline"
                          size="sm"
                          disabled={testingEndpoint === webhookInfo?.webhookUrls.linkmobility.incoming}
                        >
                          {testingEndpoint === webhookInfo?.webhookUrls.linkmobility.incoming ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <ExternalLink className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Status Updates
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 p-2 bg-muted rounded text-xs font-mono">
                          {webhookInfo?.webhookUrls.linkmobility.status}
                        </code>
                        <Button
                          onClick={() => copyToClipboard(
                            webhookInfo?.webhookUrls.linkmobility.status || '',
                            'URL LinkMobility Status'
                          )}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Headers: x-provider: linkmobility
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Configurazioni Sicurezza
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${webhookInfo?.security.production ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {webhookInfo?.security.production ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium">Environment</p>
                        <p className="text-sm text-muted-foreground">
                          {webhookInfo?.security.production ? 'Produzione' : 'Sviluppo'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Signature Validation</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {webhookInfo?.security.signatureValidation}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Metodi Supportati</p>
                        <p className="text-sm text-muted-foreground">
                          {webhookInfo?.security.supportedMethods.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Funzionalità di Sicurezza</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">HMAC Signature Validation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Rate Limiting (100 req/min)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Timing-Safe Comparison</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Multi-Provider Support</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    AI-Powered Auto-Response
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-3">Funzionalità AI</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Analisi Intent Messages</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Auto-Response Intelligenti</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Business Hours Detection</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Urgent Message Priority</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Scenari Supportati</h4>
                      <div className="space-y-2">
                        <Badge variant="outline" className="mr-2 mb-2">Saluti</Badge>
                        <Badge variant="outline" className="mr-2 mb-2">Pagamenti</Badge>
                        <Badge variant="outline" className="mr-2 mb-2">Supporto</Badge>
                        <Badge variant="outline" className="mr-2 mb-2">Urgenze</Badge>
                        <Badge variant="outline" className="mr-2 mb-2">Orario Ufficio</Badge>
                        <Badge variant="outline" className="mr-2 mb-2">Info Generali</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Configurazione AI</h4>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="text-center p-3 bg-muted rounded">
                        <p className="text-2xl font-bold text-blue-500">GPT-3.5</p>
                        <p className="text-sm text-muted-foreground">Modello AI</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded">
                        <p className="text-2xl font-bold text-green-500">70%</p>
                        <p className="text-sm text-muted-foreground">Confidence Threshold</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded">
                        <p className="text-2xl font-bold text-purple-500">160</p>
                        <p className="text-sm text-muted-foreground">Max Response Chars</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Risultati Test Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {testResult ? (
                    <div className="space-y-4">
                      <div className={`flex items-center gap-2 p-3 rounded ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {testResult.success ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                        <span className="font-medium">{testResult.message}</span>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Endpoint Testati</h4>
                        <div className="space-y-1">
                          {testResult.endpoints.map((endpoint, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <code className="bg-muted px-2 py-1 rounded">{endpoint}</code>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Test eseguito il: {new Date(testResult.timestamp).toLocaleString('it-IT')}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground mb-4">
                        Nessun test eseguito ancora
                      </p>
                      <Button onClick={() => testWebhooks()}>
                        Esegui Test Sistema
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}