import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Settings,
  Server,
  Activity,
  Shield,
  Database,
  Clock,
  Globe,
  Bell,
  FileText,
  Cpu,
  HardDrive,
  Network,
  Users,
  Lock,
  Eye,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap
} from 'lucide-react';

interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  isEditable: boolean;
  updatedAt: string;
}

interface SystemStats {
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    connections: number;
    queries: number;
    size: string;
  };
  api: {
    requests: number;
    errors: number;
    responseTime: number;
  };
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  source: string;
  metadata?: Record<string, any>;
}

export function GeneralSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('system');
  const [selectedConfig, setSelectedConfig] = useState<SystemConfig | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Fetch system configurations
  const { data: configs, isLoading: loadingConfigs } = useQuery({
    queryKey: ['/api/system/config'],
    queryFn: () => fetch('/api/system/config').then(res => res.json()),
    staleTime: 30000
  });

  // Fetch system statistics
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/system/stats'],
    queryFn: () => fetch('/api/system/stats').then(res => res.json()),
    refetchInterval: 5000, // Aggiorna ogni 5 secondi
    staleTime: 0
  });

  // Fetch system logs
  const { data: logs, isLoading: loadingLogs } = useQuery({
    queryKey: ['/api/system/logs'],
    queryFn: () => fetch('/api/system/logs?limit=50').then(res => res.json()),
    refetchInterval: 10000, // Aggiorna ogni 10 secondi
    staleTime: 0
  });

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return apiRequest(`/api/system/config/${key}`, {
        method: 'PUT',
        body: { value }
      });
    },
    onSuccess: () => {
      toast({
        title: "Configurazione aggiornata",
        description: "La configurazione è stata salvata con successo"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/system/config'] });
      setSelectedConfig(null);
      setEditingValue('');
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare la configurazione",
        variant: "destructive"
      });
    }
  });

  // Restart service mutation
  const restartServiceMutation = useMutation({
    mutationFn: async (service: string) => {
      return apiRequest(`/api/system/services/${service}/restart`, {
        method: 'POST'
      });
    },
    onSuccess: (_, service) => {
      toast({
        title: "Servizio riavviato",
        description: `Il servizio ${service} è stato riavviato con successo`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/system/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore riavvio",
        description: error.message || "Impossibile riavviare il servizio",
        variant: "destructive"
      });
    }
  });

  const formatBytes = (bytes: number): string => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'WARN': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'INFO': return <Info className="h-4 w-4 text-blue-500" />;
      case 'DEBUG': return <Eye className="h-4 w-4 text-gray-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const variants = {
      ERROR: 'destructive' as const,
      WARN: 'default' as const,
      INFO: 'secondary' as const,
      DEBUG: 'outline' as const
    };
    return <Badge variant={variants[level as keyof typeof variants] || 'secondary'}>{level}</Badge>;
  };

  const handleConfigEdit = (config: SystemConfig) => {
    setSelectedConfig(config);
    setEditingValue(config.value);
  };

  const handleConfigSave = () => {
    if (selectedConfig) {
      updateConfigMutation.mutate({
        key: selectedConfig.key,
        value: editingValue
      });
    }
  };

  const configsByCategory = configs?.reduce((acc: Record<string, SystemConfig[]>, config: SystemConfig) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Impostazioni Generali
          </h2>
          <p className="text-muted-foreground mt-1">
            Configurazioni globali, parametri sistema, logging e diagnostics avanzati
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/system/config'] });
              queryClient.invalidateQueries({ queryKey: ['/api/system/stats'] });
              queryClient.invalidateQueries({ queryKey: ['/api/system/logs'] });
            }}
            data-testid="button-refresh-all"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="system" data-testid="tab-system">
            <Server className="h-4 w-4 mr-2" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="config" data-testid="tab-config">
            <Settings className="h-4 w-4 mr-2" />
            Configurazioni
          </TabsTrigger>
          <TabsTrigger value="monitoring" data-testid="tab-monitoring">
            <Activity className="h-4 w-4 mr-2" />
            Monitoraggio
          </TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs">
            <FileText className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* System Overview Tab */}
        <TabsContent value="system" className="space-y-6">
          {loadingStats ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Caricamento statistiche sistema...</span>
            </div>
          ) : (
            <>
              {/* System Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card data-testid="card-uptime">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatUptime(stats?.uptime || 0)}
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <Clock className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-memory">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Memoria</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {stats?.memory?.percentage || 0}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(stats?.memory?.used || 0)} / {formatBytes(stats?.memory?.total || 0)}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Cpu className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-disk">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Disco</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {stats?.disk?.percentage || 0}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(stats?.disk?.used || 0)} / {formatBytes(stats?.disk?.total || 0)}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <HardDrive className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-api">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">API</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {stats?.api?.responseTime || 0}ms
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stats?.api?.requests || 0} richieste
                        </p>
                      </div>
                      <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                        <Network className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Services Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Gestione Servizi
                  </CardTitle>
                  <CardDescription>
                    Controlla e riavvia i servizi del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {['database', 'api', 'websocket', 'scheduler', 'backup'].map((service) => (
                      <div key={service} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="font-medium capitalize">{service}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restartServiceMutation.mutate(service)}
                          disabled={restartServiceMutation.isPending}
                          data-testid={`button-restart-${service}`}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          {loadingConfigs ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Caricamento configurazioni...</span>
            </div>
          ) : (
            <>
              {Object.entries(configsByCategory).map(([category, categoryConfigs]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="capitalize">{category}</CardTitle>
                    <CardDescription>
                      Configurazioni per la categoria {category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {categoryConfigs.map((config) => (
                      <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Label className="font-medium">{config.key}</Label>
                            {!config.isEditable && (
                              <Badge variant="secondary">
                                <Lock className="h-3 w-3 mr-1" />
                                Read-only
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
                          <p className="text-sm font-mono mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                            {config.value}
                          </p>
                        </div>
                        {config.isEditable && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfigEdit(config)}
                            data-testid={`button-edit-${config.key}`}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}

              {/* Edit Configuration Dialog */}
              {selectedConfig && (
                <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
                  <CardHeader>
                    <CardTitle>Modifica Configurazione</CardTitle>
                    <CardDescription>{selectedConfig.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="config-value">Valore</Label>
                      {selectedConfig.type === 'boolean' ? (
                        <Select value={editingValue} onValueChange={setEditingValue}>
                          <SelectTrigger data-testid="select-config-boolean">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : selectedConfig.type === 'json' ? (
                        <Textarea
                          id="config-value"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          rows={6}
                          className="font-mono"
                          data-testid="textarea-config-json"
                        />
                      ) : (
                        <Input
                          id="config-value"
                          type={selectedConfig.type === 'number' ? 'number' : 'text'}
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          data-testid="input-config-value"
                        />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleConfigSave}
                        disabled={updateConfigMutation.isPending}
                        data-testid="button-save-config"
                      >
                        {updateConfigMutation.isPending ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Salva
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedConfig(null)}
                        data-testid="button-cancel-config"
                      >
                        Annulla
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Database Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connessioni attive</span>
                  <span className="font-medium">{stats?.database?.connections || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Query eseguite</span>
                  <span className="font-medium">{stats?.database?.queries || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dimensione DB</span>
                  <span className="font-medium">{stats?.database?.size || '0 MB'}</span>
                </div>
              </CardContent>
            </Card>

            {/* API Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  API Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Richieste totali</span>
                  <span className="font-medium">{stats?.api?.requests || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Errori</span>
                  <span className="font-medium text-red-600">{stats?.api?.errors || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tempo medio risposta</span>
                  <span className="font-medium">{stats?.api?.responseTime || 0}ms</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          {loadingLogs ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Caricamento logs...</span>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  System Logs
                </CardTitle>
                <CardDescription>
                  Ultimi 50 log di sistema in tempo reale
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs?.map((log: LogEntry) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg text-sm">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getLevelIcon(log.level)}
                        <span className="text-xs text-muted-foreground font-mono">
                          {new Date(log.timestamp).toLocaleString('it-IT')}
                        </span>
                        {getLevelBadge(log.level)}
                        <span className="text-xs text-muted-foreground">{log.source}</span>
                      </div>
                      <div className="flex-2 min-w-0">
                        <p className="break-words">{log.message}</p>
                        {log.metadata && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer">
                              Dettagli
                            </summary>
                            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!logs || logs.length === 0) && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nessun log disponibile</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}