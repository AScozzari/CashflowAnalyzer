import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar,
  Link,
  Unlink,
  Settings,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Globe
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
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing integrations
  const { data: integrations = [], isLoading } = useQuery<CalendarIntegration[]>({
    queryKey: ['/api/calendar/integrations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/calendar/integrations');
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

  const handleConnect = (provider: 'google' | 'outlook') => {
    // In a real implementation, this would initiate OAuth flow
    if (provider === 'google') {
      window.open('/api/auth/google/calendar', '_blank');
    } else {
      window.open('/api/auth/outlook/calendar', '_blank');
    }
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
            
            <CardContent>
              <Button 
                onClick={() => handleConnect('google')}
                disabled={integrations.some(i => i.provider === 'google')}
                className="w-full"
                data-testid="button-connect-google"
              >
                <Link className="h-4 w-4 mr-2" />
                {integrations.some(i => i.provider === 'google') ? 'Già Collegato' : 'Collega Google'}
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
            
            <CardContent>
              <Button 
                onClick={() => handleConnect('outlook')}
                disabled={integrations.some(i => i.provider === 'outlook')}
                className="w-full"
                data-testid="button-connect-outlook"
              >
                <Link className="h-4 w-4 mr-2" />
                {integrations.some(i => i.provider === 'outlook') ? 'Già Collegato' : 'Collega Outlook'}
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
    </div>
  );
}