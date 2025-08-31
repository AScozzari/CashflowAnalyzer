import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Server, 
  Activity, 
  Settings, 
  Zap, 
  RefreshCw, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  BarChart3,
  GitBranch,
  HardDrive
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface NeonSettings {
  id: string;
  apiKey: string | null;
  projectId: string | null;
  projectName: string | null;
  region: string | null;
  branchName: string | null;
  databaseName: string | null;
  hostEndpoint: string | null;
  connectionPooling: boolean;
  enableMetrics: boolean;
  enableAlerts: boolean;
  autoBackup: boolean;
  backupRetention: number;
  isActive: boolean;
  lastSync: string | null;
  syncStatus: 'pending' | 'synced' | 'error';
  createdAt: string;
  updatedAt: string;
}

interface ProjectInfo {
  id: string;
  name: string;
  region_id: string;
  created_at: string;
  database?: {
    name: string;
    host: string;
    port: number;
  };
  branch?: {
    id: string;
    name: string;
    primary: boolean;
  };
}

interface DatabaseStats {
  tables: Array<{ name: string; rowCount: number }>;
  totalRecords: number;
  connections: {
    active: number;
    idle: number;
    total: number;
  };
}

export function NeonDBConfiguration() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [formData, setFormData] = useState({
    apiKey: '',
    projectId: '',
    projectName: '',
    region: '',
    branchName: 'main',
    databaseName: '',
    connectionPooling: true,
    enableMetrics: true,
    enableAlerts: false,
    autoBackup: false,
    backupRetention: 7
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current Neon settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/neon/settings'],
    enabled: true
  });

  // Get project info
  const { data: projectInfo, isLoading: projectLoading } = useQuery({
    queryKey: ['/api/neon/project-info'],
    enabled: !!settings?.projectId && !!settings?.apiKey
  });

  // Get database schema
  const { data: dbSchema, isLoading: schemaLoading } = useQuery({
    queryKey: ['/api/neon/schema'],
    enabled: true
  });

  // Get branches
  const { data: branches } = useQuery({
    queryKey: ['/api/neon/branches'],
    enabled: !!settings?.projectId && !!settings?.apiKey
  });

  // Get databases
  const { data: databases } = useQuery({
    queryKey: ['/api/neon/databases'],
    enabled: !!settings?.projectId && !!settings?.apiKey
  });

  // Get operations
  const { data: operations } = useQuery({
    queryKey: ['/api/neon/operations'],
    enabled: !!settings?.projectId && !!settings?.apiKey
  });

  // Get metrics
  const { data: metrics } = useQuery({
    queryKey: ['/api/neon/metrics'],
    enabled: !!settings?.projectId && !!settings?.apiKey
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/neon/settings', { method: 'POST', body: data }),
    onSuccess: () => {
      toast({ title: 'Successo', description: 'Configurazione Neon salvata con successo' });
      queryClient.invalidateQueries({ queryKey: ['/api/neon/settings'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore', 
        description: error.message || 'Errore nel salvare la configurazione',
        variant: 'destructive'
      });
    }
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: (apiKey: string) => apiRequest('/api/neon/test-connection', { 
      method: 'POST', 
      body: { apiKey } 
    }),
    onSuccess: (data) => {
      if (data.success) {
        toast({ 
          title: 'Connessione riuscita', 
          description: `Trovati ${data.data?.projectsCount || 0} progetti` 
        });
      } else {
        toast({ 
          title: 'Connessione fallita', 
          description: data.message,
          variant: 'destructive'
        });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore di connessione', 
        description: error.message || 'Impossibile testare la connessione',
        variant: 'destructive'
      });
    }
  });

  // Auto-detect project info mutation
  const autoDetectMutation = useMutation({
    mutationFn: (apiKey: string) => apiRequest('/api/neon/auto-detect', { 
      method: 'POST', 
      body: { apiKey } 
    }),
    onSuccess: (data) => {
      if (data.success && data.projectData) {
        // Auto-fill form with detected data
        setFormData(prev => ({
          ...prev,
          ...data.projectData
        }));
        toast({ 
          title: 'Auto-detection completata', 
          description: data.message 
        });
      } else {
        toast({ 
          title: 'Auto-detection fallita', 
          description: data.message,
          variant: 'destructive'
        });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore auto-detection', 
        description: error.message || 'Impossibile rilevare automaticamente le informazioni',
        variant: 'destructive'
      });
    }
  });

  // Sync project data mutation
  const syncProjectMutation = useMutation({
    mutationFn: () => apiRequest('/api/neon/sync', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: 'Sincronizzazione completata', description: data.message });
        queryClient.invalidateQueries({ queryKey: ['/api/neon/settings'] });
        queryClient.invalidateQueries({ queryKey: ['/api/neon/project-info'] });
      } else {
        toast({ 
          title: 'Sincronizzazione fallita', 
          description: data.message,
          variant: 'destructive'
        });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: 'Errore sincronizzazione', 
        description: error.message || 'Impossibile sincronizzare i dati',
        variant: 'destructive'
      });
    }
  });

  // Update form data when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData({
        apiKey: settings.apiKey === '***MASKED***' ? '' : settings.apiKey || '',
        projectId: settings.projectId || '',
        projectName: settings.projectName || '',
        region: settings.region || '',
        branchName: settings.branchName || 'main',
        databaseName: settings.databaseName || '',
        connectionPooling: settings.connectionPooling ?? true,
        enableMetrics: settings.enableMetrics ?? true,
        enableAlerts: settings.enableAlerts ?? false,
        autoBackup: settings.autoBackup ?? false,
        backupRetention: settings.backupRetention ?? 7
      });
    }
  }, [settings]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const dataToSave = { ...formData };
    // Don't send empty API key if it's masked
    if (settings?.apiKey === '***MASKED***' && !formData.apiKey) {
      delete dataToSave.apiKey;
    }
    saveSettingsMutation.mutate(dataToSave);
  };

  const handleTestConnection = () => {
    if (!formData.apiKey) {
      toast({ 
        title: 'API Key richiesta', 
        description: 'Inserisci la tua API Key Neon per testare la connessione',
        variant: 'destructive'
      });
      return;
    }
    testConnectionMutation.mutate(formData.apiKey);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Caricamento configurazione Neon...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="neon-db-configuration">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configurazione NEON DB</h2>
          <p className="text-muted-foreground">Gestisci la configurazione e il monitoraggio del database Neon</p>
        </div>
        {settings && (
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(settings.syncStatus)}`} />
            <span className="text-sm text-muted-foreground">
              Status: {settings.syncStatus}
            </span>
            {settings.lastSync && (
              <span className="text-xs text-muted-foreground">
                (Ultimo sync: {new Date(settings.lastSync).toLocaleString()})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Step-by-step Setup Guide */}
      {!settings?.apiKey && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
              <Database className="h-5 w-5" />
              <span>Guida Setup Neon DB - Facile e Veloce</span>
            </CardTitle>
            <CardDescription className="text-blue-600 dark:text-blue-400">
              Segui questi semplici passaggi per configurare il tuo database Neon in pochi minuti
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <h4 className="font-semibold text-blue-700 dark:text-blue-300">Crea Account Neon</h4>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 pl-8">
                  Vai su <a href="https://neon.tech" target="_blank" rel="noopener" className="underline">neon.tech</a> e registrati gratuitamente. 
                  Neon offre 3GB gratis per sempre.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <h4 className="font-semibold text-blue-700 dark:text-blue-300">Crea Progetto</h4>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 pl-8">
                  Crea un nuovo progetto chiamato "EasyCashFlows" e scegli la regione più vicina a te (es: eu-central-1).
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <h4 className="font-semibold text-blue-700 dark:text-blue-300">Ottieni API Key</h4>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 pl-8">
                  Nel dashboard, vai su "Account Settings" → "API Keys" e crea una nuova chiave. Copiala qui sotto.
                </p>
              </div>
            </div>

            {/* Detailed Instructions */}
            <div className="border-t border-blue-200 dark:border-blue-800 pt-4">
              <h5 className="font-semibold text-blue-700 dark:text-blue-300 mb-3">Istruzioni Dettagliate:</h5>
              <div className="space-y-3 text-sm text-blue-600 dark:text-blue-400">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">A</div>
                  <div>
                    <p className="font-medium">Come ottenere l'API Key:</p>
                    <p>Console Neon → Icona account (in alto a destra) → Account Settings → API Keys → "Create API Key" → Copia la chiave</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">B</div>
                  <div>
                    <p className="font-medium">Come trovare Project ID:</p>
                    <p>Console Neon → Seleziona il tuo progetto → L'ID è visibile nell'URL: neon.tech/app/projects/<strong>PROJECT_ID</strong></p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">C</div>
                  <div>
                    <p className="font-medium">Auto-Detection:</p>
                    <p>Una volta inserita l'API Key e il Project ID, il sistema rileverà automaticamente tutte le altre informazioni (nome, regione, branch, database).</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="border-t border-blue-200 dark:border-blue-800 pt-4">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open('https://console.neon.tech', '_blank')}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Apri Console Neon
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open('https://neon.tech/docs/manage/api-keys', '_blank')}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Guida API Keys
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuration" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Configurazione</span>
          </TabsTrigger>
          <TabsTrigger value="project" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Progetto</span>
          </TabsTrigger>
          <TabsTrigger value="schema" className="flex items-center space-x-2">
            <HardDrive className="h-4 w-4" />
            <span>Schema</span>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Monitoring</span>
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configurazione API</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key Neon</Label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      value={formData.apiKey}
                      onChange={(e) => handleInputChange('apiKey', e.target.value)}
                      placeholder={settings?.apiKey === '***MASKED***' ? 'API Key configurata' : 'Inserisci la tua API Key Neon'}
                      data-testid="input-api-key"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleTestConnection}
                    disabled={testConnectionMutation.isPending || !formData.apiKey}
                    data-testid="button-test-connection"
                  >
                    {testConnectionMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    <span className="ml-2">Test</span>
                  </Button>
                </div>
              </div>

              {/* Auto-Detection Section */}
              {formData.apiKey && !formData.projectId && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-300">API Key inserita con successo!</p>
                          <p className="text-sm text-green-600 dark:text-green-400">Clicca "Rileva Automaticamente" per configurare tutto il resto</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => autoDetectMutation.mutate(formData.apiKey)}
                        disabled={autoDetectMutation.isPending || !formData.apiKey}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        data-testid="button-auto-detect"
                      >
                        {autoDetectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Rileva Automaticamente
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project ID</Label>
                  <Input
                    id="projectId"
                    value={formData.projectId}
                    onChange={(e) => handleInputChange('projectId', e.target.value)}
                    placeholder="neon-project-id"
                    data-testid="input-project-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Puoi trovarlo nell'URL della console: neon.tech/app/projects/<strong>PROJECT_ID</strong>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectName">Nome Progetto</Label>
                  <Input
                    id="projectName"
                    value={formData.projectName}
                    onChange={(e) => handleInputChange('projectName', e.target.value)}
                    placeholder="Nome del progetto"
                    data-testid="input-project-name"
                  />
                  <p className="text-xs text-muted-foreground">
                    Verrà rilevato automaticamente dopo il test della connessione
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Regione</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                    placeholder="us-east-1"
                    data-testid="input-region"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branchName">Branch</Label>
                  <Input
                    id="branchName"
                    value={formData.branchName}
                    onChange={(e) => handleInputChange('branchName', e.target.value)}
                    placeholder="main"
                    data-testid="input-branch"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Opzioni Avanzate</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Connection Pooling</Label>
                    <p className="text-sm text-muted-foreground">Abilita il pooling delle connessioni</p>
                  </div>
                  <Switch
                    checked={formData.connectionPooling}
                    onCheckedChange={(checked) => handleInputChange('connectionPooling', checked)}
                    data-testid="switch-pooling"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Metriche</Label>
                    <p className="text-sm text-muted-foreground">Abilita il monitoraggio delle metriche</p>
                  </div>
                  <Switch
                    checked={formData.enableMetrics}
                    onCheckedChange={(checked) => handleInputChange('enableMetrics', checked)}
                    data-testid="switch-metrics"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Avvisi</Label>
                    <p className="text-sm text-muted-foreground">Abilita le notifiche per gli avvisi</p>
                  </div>
                  <Switch
                    checked={formData.enableAlerts}
                    onCheckedChange={(checked) => handleInputChange('enableAlerts', checked)}
                    data-testid="switch-alerts"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Backup Automatico</Label>
                    <p className="text-sm text-muted-foreground">Abilita i backup automatici</p>
                  </div>
                  <Switch
                    checked={formData.autoBackup}
                    onCheckedChange={(checked) => handleInputChange('autoBackup', checked)}
                    data-testid="switch-backup"
                  />
                </div>

                {formData.autoBackup && (
                  <div className="space-y-2">
                    <Label htmlFor="backupRetention">Ritenzione Backup (giorni)</Label>
                    <Input
                      id="backupRetention"
                      type="number"
                      min="1"
                      max="365"
                      value={formData.backupRetention}
                      onChange={(e) => handleInputChange('backupRetention', parseInt(e.target.value))}
                      data-testid="input-backup-retention"
                    />
                  </div>
                )}
              </div>

              {/* Configuration Status */}
              {formData.apiKey && formData.projectId && formData.projectName && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-300">Configurazione Pronta!</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Progetto: {formData.projectName} ({formData.region}) - Clicca "Salva" per completare
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex space-x-2">
                <Button 
                  onClick={handleSave}
                  disabled={saveSettingsMutation.isPending || !formData.apiKey}
                  className="flex-1"
                  data-testid="button-save-settings"
                >
                  {saveSettingsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <span className="ml-2">Salva Configurazione</span>
                </Button>
                
                {settings?.apiKey && (
                  <Button 
                    variant="outline" 
                    onClick={() => syncProjectMutation.mutate()}
                    disabled={syncProjectMutation.isPending}
                    data-testid="button-sync"
                  >
                    {syncProjectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2">Sincronizza</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project Tab */}
        <TabsContent value="project" className="space-y-4">
          {projectInfo ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Informazioni Progetto</span>
                  <Button variant="ghost" size="sm" asChild>
                    <a 
                      href={`https://console.neon.tech/app/projects/${projectInfo.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome Progetto</Label>
                    <p className="font-medium">{projectInfo.name}</p>
                  </div>
                  <div>
                    <Label>Project ID</Label>
                    <p className="font-mono text-sm">{projectInfo.id}</p>
                  </div>
                  <div>
                    <Label>Regione</Label>
                    <p>{projectInfo.region_id}</p>
                  </div>
                  <div>
                    <Label>Creato il</Label>
                    <p>{new Date(projectInfo.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {projectInfo.database && (
                  <div className="space-y-2">
                    <Label>Database</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p><strong>Nome:</strong> {projectInfo.database.name}</p>
                      <p><strong>Host:</strong> {projectInfo.database.host}</p>
                      <p><strong>Porta:</strong> {projectInfo.database.port}</p>
                    </div>
                  </div>
                )}

                {projectInfo.branch && (
                  <div className="space-y-2">
                    <Label>Branch Principale</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p><strong>Nome:</strong> {projectInfo.branch.name}</p>
                      <p><strong>ID:</strong> {projectInfo.branch.id}</p>
                      {projectInfo.branch.primary && (
                        <Badge variant="default">Primary</Badge>
                      )}
                    </div>
                  </div>
                )}

                {branches && branches.length > 0 && (
                  <div className="space-y-2">
                    <Label>Altri Branch</Label>
                    <div className="space-y-2">
                      {branches.map((branch: any) => (
                        <div key={branch.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            <GitBranch className="h-4 w-4" />
                            <span>{branch.name}</span>
                          </div>
                          {branch.primary && <Badge variant="default">Primary</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Configura l'API Key per visualizzare le informazioni del progetto
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Schema Tab */}
        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HardDrive className="h-5 w-5" />
                <span>Schema Database</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dbSchema ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{dbSchema.tables?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">Tabelle</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{dbSchema.totalRecords || 0}</p>
                      <p className="text-sm text-muted-foreground">Record Totali</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{dbSchema.connections?.total || 0}</p>
                      <p className="text-sm text-muted-foreground">Connessioni</p>
                    </div>
                  </div>

                  {dbSchema.tables && dbSchema.tables.length > 0 && (
                    <div className="space-y-2">
                      <Label>Tabelle del Database</Label>
                      <div className="space-y-1 max-h-60 overflow-y-auto">
                        {dbSchema.tables.map((table: any) => (
                          <div 
                            key={table.name} 
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <span className="font-mono text-sm">{table.name}</span>
                            <Badge variant="outline">{table.rowCount || 0} record</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <HardDrive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Impossibile caricare lo schema del database
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Stato Connessioni</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dbSchema?.connections ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Connessioni Attive:</span>
                      <Badge variant="default">{dbSchema.connections.active}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Connessioni Idle:</span>
                      <Badge variant="secondary">{dbSchema.connections.idle}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Totale:</span>
                      <Badge variant="outline">{dbSchema.connections.total}</Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Dati non disponibili</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="h-5 w-5" />
                  <span>Operazioni Recenti</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {operations && operations.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {operations.slice(0, 5).map((op: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="truncate">{op.action || 'Operation'}</span>
                        <Badge 
                          variant={op.status === 'finished' ? 'default' : 'secondary'}
                        >
                          {op.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Nessuna operazione recente</p>
                )}
              </CardContent>
            </Card>

            {metrics && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Metriche di Consumo</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Le metriche di consumo dettagliate verranno visualizzate qui una volta configurate.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}