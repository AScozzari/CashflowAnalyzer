import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Zap, Shield, FileText, MessageSquare, TrendingUp, Settings2, Key, Eye, EyeOff, Trash2, RefreshCcw } from "lucide-react";

// AI Settings Schema
const aiSettingsSchema = z.object({
  defaultModel: z.enum(['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo']),
  chatEnabled: z.boolean(),
  documentProcessingEnabled: z.boolean(),
  analyticsEnabled: z.boolean(),
  predictionsEnabled: z.boolean(),
  maxTokens: z.number().min(100).max(4000),
  temperature: z.number().min(0).max(2),
  privacyMode: z.enum(['strict', 'standard', 'relaxed']),
  dataRetention: z.enum(['none', '30days', '90days']),
  openaiApiKey: z.string().optional(),
});

type AiSettingsFormData = z.infer<typeof aiSettingsSchema>;

export default function AiSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showApiKey, setShowApiKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');

  // Fetch current AI settings
  const { data: aiSettings, isLoading } = useQuery({
    queryKey: ['/api/ai/settings'],
    retry: false,
  });

  // Fetch API key status
  const { data: apiKeyStatus, refetch: refetchApiKeyStatus } = useQuery({
    queryKey: ['/api/ai/api-key/status'],
    retry: false,
  });

  // Form setup
  const form = useForm<AiSettingsFormData>({
    resolver: zodResolver(aiSettingsSchema),
    defaultValues: {
      defaultModel: 'gpt-4o',
      chatEnabled: true,
      documentProcessingEnabled: true,
      analyticsEnabled: true,
      predictionsEnabled: true,
      maxTokens: 2000,
      temperature: 0.7,
      privacyMode: 'standard',
      dataRetention: 'none',
      openaiApiKey: '',
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (aiSettings) {
      form.reset({
        defaultModel: (aiSettings as any).defaultModel || 'gpt-4o',
        chatEnabled: (aiSettings as any).chatEnabled ?? true,
        documentProcessingEnabled: (aiSettings as any).documentProcessingEnabled ?? true,
        analyticsEnabled: (aiSettings as any).analyticsEnabled ?? true,
        predictionsEnabled: (aiSettings as any).predictionsEnabled ?? true,
        maxTokens: (aiSettings as any).maxTokens || 2000,
        temperature: (aiSettings as any).temperature || 0.7,
        privacyMode: (aiSettings as any).privacyMode || 'standard',
        dataRetention: (aiSettings as any).dataRetention || 'none',
        openaiApiKey: '', // Don't pre-fill for security
      });
    }
  }, [aiSettings, form]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: AiSettingsFormData) => {
      const response = await apiRequest('POST', '/api/ai/settings', data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "✅ Configurazione AI Salvata",
        description: "Le impostazioni AI sono state aggiornate con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore nel Salvataggio",
        description: error.message || "Impossibile salvare le impostazioni AI.",
        variant: "destructive",
      });
    },
  });

  // Update API key mutation
  const updateApiKeyMutation = useMutation({
    mutationFn: async (apiKey: string) => {
      const response = await apiRequest('POST', '/api/ai/api-key/update', { apiKey });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "✅ API Key Aggiornata",
        description: "La chiave OpenAI è stata aggiornata e testata con successo.",
      });
      setNewApiKey('');
      refetchApiKeyStatus();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore API Key",
        description: error.message || "Impossibile aggiornare la chiave OpenAI.",
        variant: "destructive",
      });
    },
  });

  // Delete API key mutation
  const deleteApiKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/ai/api-key');
      return response;
    },
    onSuccess: () => {
      toast({
        title: "✅ API Key Rimossa",
        description: "La chiave OpenAI è stata rimossa dal sistema.",
      });
      refetchApiKeyStatus();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore Rimozione",
        description: error.message || "Impossibile rimuovere la chiave OpenAI.",
        variant: "destructive",
      });
    },
  });

  // Test API key mutation
  const testApiKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/ai/api-key/test');
      return response;
    },
    onSuccess: (data) => {
      setConnectionStatus('success');
      toast({
        title: "✅ Test Connessione Riuscito",
        description: `API key valida. Modelli disponibili: ${data.availableModels?.length || 0}`,
      });
    },
    onError: (error: any) => {
      setConnectionStatus('error');
      toast({
        title: "❌ Test Connessione Fallito",
        description: error.message || "Impossibile connettersi all'API OpenAI.",
        variant: "destructive",
      });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/ai/test-connection');
      return response;
    },
    onSuccess: () => {
      setConnectionStatus('success');
      toast({
        title: "✅ Connessione OpenAI Funzionante",
        description: "La connessione all'API OpenAI è stata verificata con successo.",
      });
    },
    onError: (error: any) => {
      setConnectionStatus('error');
      toast({
        title: "❌ Errore Connessione OpenAI",
        description: error.message || "Impossibile connettersi all'API OpenAI.",
        variant: "destructive",
      });
    },
  });

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    await testConnectionMutation.mutateAsync();
    setIsTestingConnection(false);
  };

  const onSubmit = (data: AiSettingsFormData) => {
    saveSettingsMutation.mutate(data);
  };

  const temperatureValue = form.watch('temperature');
  const maxTokensValue = form.watch('maxTokens');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-blue-600" />
            <CardTitle>Configurazione Assistente AI</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configura l'integrazione OpenAI per chat assistant, analisi documenti, query naturali e previsioni finanziarie.
          </p>
        </CardContent>
      </Card>

      {/* OpenAI API Key Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">Gestione API Key OpenAI</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => testApiKeyMutation.mutate()}
                disabled={testApiKeyMutation.isPending || !apiKeyStatus?.hasKey}
                variant="outline"
                size="sm"
              >
                {testApiKeyMutation.isPending ? 'Testing...' : 'Test Connessione'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current API Key Status */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="font-medium">API Key Corrente</span>
                {apiKeyStatus?.hasKey ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">Configurata</Badge>
                ) : (
                  <Badge variant="outline">Non Configurata</Badge>
                )}
              </div>
              {apiKeyStatus?.hasKey && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteApiKeyMutation.mutate()}
                    disabled={deleteApiKeyMutation.isPending}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            {apiKeyStatus?.hasKey ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 font-mono text-sm">
                  <span className="text-muted-foreground">Chiave:</span>
                  <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {showApiKey ? 'sk-...' : apiKeyStatus.keyPreview}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Ultimo aggiornamento: {new Date(apiKeyStatus.lastUpdated).toLocaleString('it-IT')}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Key className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-muted-foreground mb-1">
                  Nessuna API Key Configurata
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Aggiungi una chiave OpenAI per abilitare chat AI, analisi documenti e previsioni finanziarie
                </p>
                <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <strong>Per iniziare:</strong> Utilizza il modulo qui sotto per aggiungere la tua API key OpenAI
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Add/Update API Key */}
          <div className={`p-4 border rounded-lg ${!apiKeyStatus?.hasKey ? 'border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800' : ''}`}>
            <div className="flex items-center space-x-2 mb-3">
              {!apiKeyStatus?.hasKey && <Key className="h-5 w-5 text-blue-600" />}
              <h4 className="font-medium">
                {apiKeyStatus?.hasKey ? 'Sostituisci API Key' : 'Aggiungi Nuova API Key'}
              </h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Input
                  type={showApiKey ? "text" : "password"}
                  placeholder={!apiKeyStatus?.hasKey ? "sk-proj-... (incolla qui la tua API key OpenAI)" : "sk-..."}
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => updateApiKeyMutation.mutate(newApiKey)}
                  disabled={!newApiKey || updateApiKeyMutation.isPending}
                  size="sm"
                  className={!apiKeyStatus?.hasKey ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  {updateApiKeyMutation.isPending ? 'Salvando...' : (apiKeyStatus?.hasKey ? 'Sostituisci' : 'Aggiungi e Testa')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewApiKey('')}
                >
                  Annulla
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                <div className="flex items-start space-x-2">
                  <span>•</span>
                  <div>
                    La chiave verrà automaticamente testata prima del salvataggio<br/>
                    • Deve iniziare con "sk-" ed avere permessi per l'API OpenAI<br/>
                    • {!apiKeyStatus?.hasKey ? 'Ottieni la tua chiave da ' : 'Gestisci le tue chiavi su '}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" 
                       className="text-blue-600 hover:text-blue-800 underline">
                      platform.openai.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {connectionStatus === 'idle' && (
              <Badge variant="secondary">Non Testato</Badge>
            )}
            {connectionStatus === 'success' && (
              <Badge variant="default" className="bg-green-100 text-green-800">✅ Connessione OK</Badge>
            )}
            {connectionStatus === 'error' && (
              <Badge variant="destructive">❌ Connessione Fallita</Badge>
            )}
            <span className="text-sm text-muted-foreground">
              Stato ultima verifica connessione OpenAI
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Main Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings2 className="w-5 h-5" />
            <span>Configurazione Generale</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Model Selection */}
              <FormField
                control={form.control}
                name="defaultModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modello OpenAI Predefinito</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona modello AI" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (Consigliato)</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Economico)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      GPT-4o offre le migliori prestazioni per analisi finanziarie complesse.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Feature Toggles */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Funzionalità AI Abilitate</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="chatEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            <FormLabel>Chat Assistant</FormLabel>
                          </div>
                          <FormDescription className="text-sm">
                            Assistente conversazionale per domande finanziarie
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="documentProcessingEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-green-600" />
                            <FormLabel>Elaborazione Documenti</FormLabel>
                          </div>
                          <FormDescription className="text-sm">
                            OCR e analisi intelligente di fatture/documenti
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="analyticsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Zap className="w-4 h-4 text-yellow-600" />
                            <FormLabel>Analytics Naturali</FormLabel>
                          </div>
                          <FormDescription className="text-sm">
                            Query in linguaggio naturale sui dati finanziari
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="predictionsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            <FormLabel>Previsioni Cash Flow</FormLabel>
                          </div>
                          <FormDescription className="text-sm">
                            Modelli predittivi per cash flow e scenario analysis
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Advanced Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Impostazioni Avanzate</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Max Tokens */}
                  <FormField
                    control={form.control}
                    name="maxTokens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Token per Risposta: {maxTokensValue}</FormLabel>
                        <FormControl>
                          <Slider
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            max={4000}
                            min={100}
                            step={100}
                            className="w-full"
                          />
                        </FormControl>
                        <FormDescription>
                          Limita la lunghezza delle risposte AI (100-4000 token)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Temperature */}
                  <FormField
                    control={form.control}
                    name="temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Creatività Risposte: {Number(temperatureValue).toFixed(1)}</FormLabel>
                        <FormControl>
                          <Slider
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            max={2}
                            min={0}
                            step={0.1}
                            className="w-full"
                          />
                        </FormControl>
                        <FormDescription>
                          0 = Preciso e deterministico, 2 = Creativo e vario
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Privacy Settings */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="privacyMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modalità Privacy</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="strict">Strict - Anonimizzazione completa</SelectItem>
                            <SelectItem value="standard">Standard - Dati generici (Consigliato)</SelectItem>
                            <SelectItem value="relaxed">Relaxed - Dati dettagliati per analisi</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Controlla quanto dettaglio dei dati aziendali condividere con OpenAI.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataRetention"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conservazione Dati Chat</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Non conservare (Consigliato)</SelectItem>
                            <SelectItem value="30days">30 giorni</SelectItem>
                            <SelectItem value="90days">90 giorni</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Tempo di conservazione dello storico conversazioni AI.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Privacy Notice */}
              <Alert>
                <Shield className="w-4 h-4" />
                <AlertDescription>
                  <strong>Privacy Notice:</strong> I dati finanziari vengono processati secondo la modalità privacy selezionata. 
                  In modalità "Strict", tutti i dati sensibili sono anonimizzati prima dell'invio a OpenAI.
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <div className="flex justify-end space-x-2">
                <Button 
                  type="submit" 
                  disabled={saveSettingsMutation.isPending}
                  data-testid="button-save-ai-settings"
                >
                  {saveSettingsMutation.isPending ? 'Salvando...' : 'Salva Configurazione'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}