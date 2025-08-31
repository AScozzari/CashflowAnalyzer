import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calendar,
  Link,
  Unlink,
  Settings,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Globe,
  Save,
  TestTube,
  Loader2,
  Copy
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CalendarIntegration {
  id: string;
  provider: 'google' | 'outlook';
  email: string;
  syncEnabled: boolean;
  syncDirection: 'outbound' | 'inbound' | 'bidirectional';
  lastSyncAt?: string;
  lastError?: string;
  isActive: boolean;
  createdAt: string;
}

export default function CalendarIntegrations() {
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'outlook' | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState<'google' | 'outlook' | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  
  // Configuration states
  const [googleConfig, setGoogleConfig] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: `${window.location.origin}/api/auth/google/calendar/callback`
  });
  
  const [outlookConfig, setOutlookConfig] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: `${window.location.origin}/api/auth/outlook/calendar/callback`
  });
  
  const { toast } = useToast();

  // Copy URI function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "URI Copiato!",
      description: "L'URI di redirect è stato copiato negli appunti",
      duration: 2000
    });
  };
  const queryClient = useQueryClient();

  // Fetch existing integrations
  const { data: integrations = [], isLoading } = useQuery<CalendarIntegration[]>({
    queryKey: ['/api/calendar/integrations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/calendar/integrations');
      return response.json();
    }
  });

  // Fetch provider configuration status
  const { data: providersStatus = {} } = useQuery({
    queryKey: ['/api/calendar/providers/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/calendar/providers/status');
      return response.json();
    }
  });

  // Sync calendar mutation
  const syncCalendarMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest('POST', `/api/calendar/sync/${provider}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: '✅ Sincronizzazione Completata',
        description: `${data.syncedEvents} eventi sincronizzati con ${data.provider}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/integrations'] });
    },
    onError: () => {
      toast({
        title: '❌ Errore Sincronizzazione',
        description: 'Impossibile sincronizzare il calendario',
        variant: 'destructive'
      });
    }
  });

  // Disconnect integration mutation
  const disconnectMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await apiRequest('DELETE', `/api/calendar/integrations/${integrationId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '✅ Disconnessione Completata',
        description: 'L\'integrazione calendario è stata rimossa'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/integrations'] });
    }
  });

  // Toggle sync mutation
  const toggleSyncMutation = useMutation({
    mutationFn: async ({ integrationId, syncEnabled }: { integrationId: string; syncEnabled: boolean }) => {
      const response = await apiRequest('PUT', `/api/calendar/integrations/${integrationId}`, { syncEnabled });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '✅ Impostazioni Aggiornate',
        description: 'Le impostazioni di sincronizzazione sono state aggiornate'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/integrations'] });
    }
  });

  // Test configuration mutation
  const testConfigMutation = useMutation({
    mutationFn: async ({ provider, config }: { provider: string; config: any }) => {
      const response = await apiRequest('POST', `/api/calendar/config/${provider}/test`, config);
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: '✅ Test Riuscito',
        description: `Configurazione ${variables.provider} valida e funzionante`
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Test Fallito',
        description: error.message || 'Configurazione non valida',
        variant: 'destructive'
      });
    }
  });

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async ({ provider, config }: { provider: string; config: any }) => {
      const response = await apiRequest('POST', `/api/calendar/config/${provider}`, config);
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: '✅ Configurazione Salvata',
        description: `${variables.provider} configurato correttamente`
      });
      setConfigDialogOpen(null);
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/integrations'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Errore Salvataggio',
        description: error.message || 'Impossibile salvare la configurazione',
        variant: 'destructive'
      });
    }
  });

  const handleConnect = (provider: 'google' | 'outlook') => {
    // First try to initiate OAuth flow, if not configured, show config dialog
    if (provider === 'google') {
      window.open('/api/auth/google/calendar', '_blank');
    } else {
      window.open('/api/auth/outlook/calendar', '_blank');
    }
  };

  const handleConfigure = (provider: 'google' | 'outlook') => {
    setConfigDialogOpen(provider);
  };

  const handleTestConfig = (provider: 'google' | 'outlook') => {
    const config = provider === 'google' ? googleConfig : outlookConfig;
    setTestingProvider(provider);
    testConfigMutation.mutate({ provider, config });
    setTestingProvider(null);
  };

  const handleSaveConfig = (provider: 'google' | 'outlook') => {
    const config = provider === 'google' ? googleConfig : outlookConfig;
    setSavingProvider(provider);
    saveConfigMutation.mutate({ provider, config });
    setSavingProvider(null);
  };

  const handleSync = (provider: string) => {
    syncCalendarMutation.mutate(provider);
  };

  const handleDisconnect = (integrationId: string) => {
    if (window.confirm('Sei sicuro di voler disconnettere questa integrazione?')) {
      disconnectMutation.mutate(integrationId);
    }
  };

  const getProviderIcon = (provider: string) => {
    return provider === 'google' ? '🔴' : '🔵'; // Google red, Outlook blue
  };

  const getProviderName = (provider: string) => {
    return provider === 'google' ? 'Google Calendar' : 'Microsoft Outlook';
  };

  const getSyncStatus = (integration: CalendarIntegration) => {
    if (integration.lastError) {
      return { status: 'error', color: 'destructive', message: integration.lastError };
    }
    if (integration.lastSyncAt) {
      return { 
        status: 'success', 
        color: 'default', 
        message: `Ultimo sync: ${new Date(integration.lastSyncAt).toLocaleString('it-IT')}` 
      };
    }
    return { status: 'pending', color: 'secondary', message: 'Non ancora sincronizzato' };
  };

  if (isLoading) {
    return <div className="text-center py-4">Caricamento integrazioni...</div>;
  }

  return (
    <div className="space-y-6" data-testid="calendar-integrations">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Integrazioni Calendario</h2>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Collega il tuo Google Calendar o Microsoft Outlook per sincronizzare automaticamente 
          gli eventi di EasyCashFlows con i tuoi calendari esterni.
        </AlertDescription>
      </Alert>

      {/* Connected Integrations */}
      {integrations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Calendari Collegati</h3>
          {integrations.map((integration) => {
            const syncStatus = getSyncStatus(integration);
            
            return (
              <Card key={integration.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getProviderIcon(integration.provider)}</span>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {getProviderName(integration.provider)}
                          <Badge variant={integration.isActive ? 'default' : 'secondary'}>
                            {integration.isActive ? 'Attivo' : 'Inattivo'}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{integration.email}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(integration.provider)}
                        disabled={syncCalendarMutation.isPending}
                        data-testid={`button-sync-${integration.provider}`}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sincronizza
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(integration.id)}
                        disabled={disconnectMutation.isPending}
                        data-testid={`button-disconnect-${integration.provider}`}
                      >
                        <Unlink className="h-4 w-4 mr-2" />
                        Disconnetti
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Sync Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`sync-${integration.id}`}
                        checked={integration.syncEnabled}
                        onCheckedChange={(checked) => 
                          toggleSyncMutation.mutate({ 
                            integrationId: integration.id, 
                            syncEnabled: checked 
                          })
                        }
                      />
                      <Label htmlFor={`sync-${integration.id}`}>
                        Sincronizzazione automatica
                      </Label>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-muted-foreground">Direzione</Label>
                      <Select 
                        value={integration.syncDirection} 
                        onValueChange={(value) => {
                          // TODO: Implement sync direction update
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="outbound">Solo uscita (ECF → Calendario)</SelectItem>
                          <SelectItem value="inbound">Solo entrata (Calendario → ECF)</SelectItem>
                          <SelectItem value="bidirectional">Bidirezionale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Sync Status */}
                  <div className="flex items-center gap-2">
                    {syncStatus.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {syncStatus.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                    {syncStatus.status === 'pending' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                    <span className="text-sm text-muted-foreground">{syncStatus.message}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Connect New Calendar */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Collega Nuovo Calendario</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Google Calendar */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🔴</span>
                <div>
                  <CardTitle className="text-base">Google Calendar</CardTitle>
                  <CardDescription>
                    Sincronizza con il tuo Google Calendar
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-2">
              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-2">
                {providersStatus.google?.configured ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Configurato</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-orange-600 font-medium">Non configurato</span>
                  </>
                )}
              </div>
              
              <Button 
                onClick={() => handleConnect('google')}
                disabled={integrations.some(i => i.provider === 'google') || !providersStatus.google?.configured}
                className="w-full"
                data-testid="button-connect-google"
              >
                <Link className="h-4 w-4 mr-2" />
                {integrations.some(i => i.provider === 'google') ? 'Già Collegato' : 
                 !providersStatus.google?.configured ? 'Configura Prima OAuth' : 'Collega Google'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleConfigure('google')}
                className="w-full"
                data-testid="button-configure-google"
              >
                <Settings className="h-4 w-4 mr-2" />
                {providersStatus.google?.configured ? 'Riconfigura OAuth' : 'Configura OAuth'}
              </Button>
            </CardContent>
          </Card>

          {/* Microsoft Outlook */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🔵</span>
                <div>
                  <CardTitle className="text-base">Microsoft Outlook</CardTitle>
                  <CardDescription>
                    Sincronizza con Outlook Calendar
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-2">
              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-2">
                {providersStatus.outlook?.configured ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Configurato</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-orange-600 font-medium">Non configurato</span>
                  </>
                )}
              </div>
              
              <Button 
                onClick={() => handleConnect('outlook')}
                disabled={integrations.some(i => i.provider === 'outlook') || !providersStatus.outlook?.configured}
                className="w-full"
                data-testid="button-connect-outlook"
              >
                <Link className="h-4 w-4 mr-2" />
                {integrations.some(i => i.provider === 'outlook') ? 'Già Collegato' : 
                 !providersStatus.outlook?.configured ? 'Configura Prima OAuth' : 'Collega Outlook'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleConfigure('outlook')}
                className="w-full"
                data-testid="button-configure-outlook"
              >
                <Settings className="h-4 w-4 mr-2" />
                {providersStatus.outlook?.configured ? 'Riconfigura OAuth' : 'Configura OAuth'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Come Funziona la Sincronizzazione
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Solo uscita:</strong> Gli eventi di EasyCashFlows vengono copiati nel calendario esterno</p>
          <p>• <strong>Solo entrata:</strong> Gli eventi del calendario esterno vengono importati in EasyCashFlows</p>
          <p>• <strong>Bidirezionale:</strong> Sincronizzazione completa in entrambe le direzioni</p>
          <p>• <strong>Prefisso eventi:</strong> Gli eventi sincronizzati vengono marcati con [ECF] per identificazione</p>
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={!!configDialogOpen} onOpenChange={() => setConfigDialogOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurazione {configDialogOpen === 'google' ? 'Google Calendar' : 'Microsoft Outlook'}
            </DialogTitle>
            <DialogDescription>
              Inserisci le credenziali OAuth2 per abilitare l'integrazione calendario.
              {configDialogOpen === 'google' && (
                <div className="mt-2">
                  <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Ottieni credenziali Google
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {configDialogOpen === 'outlook' && (
                <div className="mt-2">
                  <a 
                    href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Ottieni credenziali Azure
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {configDialogOpen === 'google' && (
              <>
                <div>
                  <Label htmlFor="google-client-id">Client ID</Label>
                  <Input
                    id="google-client-id"
                    type="text"
                    placeholder="123456789.apps.googleusercontent.com"
                    value={googleConfig.clientId}
                    onChange={(e) => setGoogleConfig(prev => ({ ...prev, clientId: e.target.value }))}
                    data-testid="input-google-client-id"
                  />
                </div>
                <div>
                  <Label htmlFor="google-client-secret">Client Secret</Label>
                  <Input
                    id="google-client-secret"
                    type="password"
                    placeholder="GOCSPX-*********************"
                    value={googleConfig.clientSecret}
                    onChange={(e) => setGoogleConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                    data-testid="input-google-client-secret"
                  />
                </div>
                <div>
                  <Label htmlFor="google-redirect-uri">Redirect URI</Label>
                  <div className="flex gap-2">
                    <Input
                      id="google-redirect-uri"
                      type="text"
                      value={googleConfig.redirectUri}
                      disabled
                      className="bg-gray-50 flex-1"
                      data-testid="input-google-redirect-uri"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(googleConfig.redirectUri)}
                      data-testid="button-copy-google-uri"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Copia questo URL nelle impostazioni OAuth della tua app Google
                  </p>
                </div>
              </>
            )}
            
            {configDialogOpen === 'outlook' && (
              <>
                <div>
                  <Label htmlFor="outlook-client-id">Application (client) ID</Label>
                  <Input
                    id="outlook-client-id"
                    type="text"
                    placeholder="12345678-1234-1234-1234-123456789012"
                    value={outlookConfig.clientId}
                    onChange={(e) => setOutlookConfig(prev => ({ ...prev, clientId: e.target.value }))}
                    data-testid="input-outlook-client-id"
                  />
                </div>
                <div>
                  <Label htmlFor="outlook-client-secret">Client Secret</Label>
                  <Input
                    id="outlook-client-secret"
                    type="password"
                    placeholder="*********************"
                    value={outlookConfig.clientSecret}
                    onChange={(e) => setOutlookConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                    data-testid="input-outlook-client-secret"
                  />
                </div>
                <div>
                  <Label htmlFor="outlook-redirect-uri">Redirect URI</Label>
                  <div className="flex gap-2">
                    <Input
                      id="outlook-redirect-uri"
                      type="text"
                      value={outlookConfig.redirectUri}
                      disabled
                      className="bg-gray-50 flex-1"
                      data-testid="input-outlook-redirect-uri"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(outlookConfig.redirectUri)}
                      data-testid="button-copy-outlook-uri"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Copia questo URL nelle impostazioni dell'app Azure
                  </p>
                </div>
              </>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => handleTestConfig(configDialogOpen!)}
                disabled={testingProvider === configDialogOpen || !((configDialogOpen === 'google' && googleConfig.clientId && googleConfig.clientSecret) || (configDialogOpen === 'outlook' && outlookConfig.clientId && outlookConfig.clientSecret))}
                data-testid={`button-test-${configDialogOpen}`}
              >
                {testingProvider === configDialogOpen ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test
              </Button>
              <Button
                onClick={() => handleSaveConfig(configDialogOpen!)}
                disabled={savingProvider === configDialogOpen || !((configDialogOpen === 'google' && googleConfig.clientId && googleConfig.clientSecret) || (configDialogOpen === 'outlook' && outlookConfig.clientId && outlookConfig.clientSecret))}
                data-testid={`button-save-${configDialogOpen}`}
              >
                {savingProvider === configDialogOpen ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}