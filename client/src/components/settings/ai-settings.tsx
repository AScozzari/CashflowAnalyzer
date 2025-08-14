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
import { Brain, Zap, Shield, FileText, MessageSquare, TrendingUp, Settings2, Key } from "lucide-react";

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

  // Fetch current AI settings
  const { data: aiSettings, isLoading } = useQuery({
    queryKey: ['/api/ai/settings'],
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
        defaultModel: aiSettings.defaultModel || 'gpt-4o',
        chatEnabled: aiSettings.chatEnabled ?? true,
        documentProcessingEnabled: aiSettings.documentProcessingEnabled ?? true,
        analyticsEnabled: aiSettings.analyticsEnabled ?? true,
        predictionsEnabled: aiSettings.predictionsEnabled ?? true,
        maxTokens: aiSettings.maxTokens || 2000,
        temperature: aiSettings.temperature || 0.7,
        privacyMode: aiSettings.privacyMode || 'standard',
        dataRetention: aiSettings.dataRetention || 'none',
        openaiApiKey: '', // Don't pre-fill for security
      });
    }
  }, [aiSettings, form]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: AiSettingsFormData) => {
      const response = await apiRequest('/api/ai/settings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
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

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/ai/test-connection', {
        method: 'POST',
      });
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

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">Stato Connessione OpenAI</CardTitle>
            </div>
            <Button 
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              variant="outline"
              size="sm"
            >
              {isTestingConnection ? 'Testing...' : 'Test Connessione'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            {connectionStatus === 'idle' && (
              <Badge variant="secondary">Non Testato</Badge>
            )}
            {connectionStatus === 'success' && (
              <Badge variant="default" className="bg-green-100 text-green-800">✅ Connesso</Badge>
            )}
            {connectionStatus === 'error' && (
              <Badge variant="destructive">❌ Errore</Badge>
            )}
            <span className="text-sm text-muted-foreground">
              Chiave API OpenAI configurata nelle variabili d'ambiente
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
                        <FormLabel>Creatività Risposte: {temperatureValue.toFixed(1)}</FormLabel>
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