import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Database,
  Activity,
  Server,
  HardDrive,
  Clock,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  BarChart3,
  Download,
  Upload,
  Cloud
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { NeonDBConfiguration } from './neon-db-configuration';

interface DatabaseStats {
  connections: {
    active: number;
    idle: number;
    total: number;
    maxConnections: number;
  };
  performance: {
    avgQueryTime: number;
    slowQueries: number;
    queriesPerSecond: number;
    cacheHitRatio: number;
  };
  storage: {
    totalSize: string;
    dataSize: string;
    indexSize: string;
    freeSpace: string;
    usagePercentage: number;
  };
  tables: Array<{
    name: string;
    rows: number;
    size: string;
    lastUpdated: string;
  }>;
  backups: {
    lastBackup: string;
    backupSize: string;
    autoBackupEnabled: boolean;
    nextBackup: string;
  };
}

interface DatabaseConfig {
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
  autoVacuumEnabled: boolean;
  logSlowQueries: boolean;
  slowQueryThreshold: number;
  autoBackupEnabled: boolean;
  backupRetentionDays: number;
}

export default function DatabaseSettings() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch database statistics
  const { data: stats, isLoading: statsLoading } = useQuery<DatabaseStats>({
    queryKey: ['/api/database/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/database/stats');
      return response.json();
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch database configuration
  const { data: config, isLoading: configLoading } = useQuery<DatabaseConfig>({
    queryKey: ['/api/database/config'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/database/config');
      return response.json();
    }
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: Partial<DatabaseConfig>) => {
      const response = await apiRequest('PUT', '/api/database/config', newConfig);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '✅ Configurazione Aggiornata',
        description: 'Le impostazioni del database sono state salvate'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/database/config'] });
    }
  });

  // Backup mutation
  const backupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/database/backup');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '✅ Backup Creato',
        description: 'Il backup del database è stato completato'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/database/stats'] });
    }
  });

  // Optimize mutation
  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/database/optimize');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '✅ Ottimizzazione Completata',
        description: 'Il database è stato ottimizzato'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/database/stats'] });
    }
  });

  const getConnectionStatus = () => {
    if (!stats) return { color: 'gray', status: 'Sconosciuto' };
    
    const percentage = (stats.connections.active / stats.connections.maxConnections) * 100;
    
    if (percentage < 50) return { color: 'green', status: 'Ottimo' };
    if (percentage < 80) return { color: 'yellow', status: 'Buono' };
    return { color: 'red', status: 'Critico' };
  };

  const getPerformanceStatus = () => {
    if (!stats) return { color: 'gray', status: 'Sconosciuto' };
    
    if (stats.performance.avgQueryTime < 100) return { color: 'green', status: 'Eccellente' };
    if (stats.performance.avgQueryTime < 500) return { color: 'yellow', status: 'Buono' };
    return { color: 'red', status: 'Lento' };
  };

  if (statsLoading || configLoading) {
    return <div className="text-center py-8">Caricamento statistiche database...</div>;
  }

  return (
    <div className="space-y-6" data-testid="database-settings">
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-green-600" />
        <h2 className="text-xl font-semibold">Configurazione Database</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="tables">Tabelle</TabsTrigger>
          <TabsTrigger value="config">Configurazione</TabsTrigger>
          <TabsTrigger value="neon" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            <span>Configurazione NEON DB</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Connection Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Connessioni Attive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.connections.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  di {stats?.connections.maxConnections || 0} disponibili
                </p>
                <Badge 
                  variant={getConnectionStatus().color === 'green' ? 'default' : 'destructive'}
                  className="mt-2"
                >
                  {getConnectionStatus().status}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Tempo Query Medio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.performance.avgQueryTime || 0}ms</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.performance.queriesPerSecond || 0} query/sec
                </p>
                <Badge 
                  variant={getPerformanceStatus().color === 'green' ? 'default' : 'destructive'}
                  className="mt-2"
                >
                  {getPerformanceStatus().status}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Utilizzo Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.storage.totalSize || '0 MB'}</div>
                <Progress 
                  value={stats?.storage.usagePercentage || 0} 
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.storage.usagePercentage || 0}% utilizzato
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Cache Hit Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.performance.cacheHitRatio || 0}%</div>
                <Progress 
                  value={stats?.performance.cacheHitRatio || 0} 
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Efficienza cache
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Azioni Rapide</CardTitle>
              <CardDescription>
                Operazioni di manutenzione e backup del database
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button 
                onClick={() => backupMutation.mutate()}
                disabled={backupMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                Backup Manuale
              </Button>
              <Button 
                variant="outline"
                onClick={() => optimizeMutation.mutate()}
                disabled={optimizeMutation.isPending}
              >
                <Zap className="h-4 w-4 mr-2" />
                Ottimizza Database
              </Button>
              <Button 
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/database/stats'] })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Aggiorna Stats
              </Button>
            </CardContent>
          </Card>

          {/* Backup Status */}
          <Card>
            <CardHeader>
              <CardTitle>Stato Backup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Ultimo Backup</Label>
                  <p className="font-medium">{stats?.backups.lastBackup || 'Mai eseguito'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Dimensione Backup</Label>
                  <p className="font-medium">{stats?.backups.backupSize || '0 MB'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Backup Automatico</Label>
                  <p className="font-medium">
                    {stats?.backups.autoBackupEnabled ? 'Abilitato' : 'Disabilitato'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Prossimo Backup</Label>
                  <p className="font-medium">{stats?.backups.nextBackup || 'Non programmato'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Query Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Query Lente</span>
                  <Badge variant="outline">{stats?.performance.slowQueries || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Query al Secondo</span>
                  <Badge variant="outline">{stats?.performance.queriesPerSecond || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Tempo Medio</span>
                  <Badge variant="outline">{stats?.performance.avgQueryTime || 0}ms</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connessioni</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Attive</span>
                  <Badge variant="default">{stats?.connections.active || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Idle</span>
                  <Badge variant="outline">{stats?.connections.idle || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Totali</span>
                  <Badge variant="outline">{stats?.connections.total || 0}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {stats?.performance.slowQueries > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Sono state rilevate {stats.performance.slowQueries} query lente. 
                Considera l'ottimizzazione degli indici o la revisione delle query.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tabelle Database</CardTitle>
              <CardDescription>
                Panoramica delle tabelle principali del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.tables?.map((table, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{table.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {table.rows.toLocaleString()} righe
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{table.size}</p>
                      <p className="text-sm text-muted-foreground">
                        Aggiornata: {new Date(table.lastUpdated).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground">Nessuna informazione sulle tabelle disponibile</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurazione Database</CardTitle>
              <CardDescription>
                Impostazioni di performance e sicurezza del database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxConnections">Connessioni Massime</Label>
                  <Input
                    id="maxConnections"
                    type="number"
                    value={config?.maxConnections || 100}
                    onChange={(e) => updateConfigMutation.mutate({ 
                      maxConnections: parseInt(e.target.value) 
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="queryTimeout">Timeout Query (ms)</Label>
                  <Input
                    id="queryTimeout"
                    type="number"
                    value={config?.queryTimeout || 30000}
                    onChange={(e) => updateConfigMutation.mutate({ 
                      queryTimeout: parseInt(e.target.value) 
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="slowQueryThreshold">Soglia Query Lente (ms)</Label>
                  <Input
                    id="slowQueryThreshold"
                    type="number"
                    value={config?.slowQueryThreshold || 1000}
                    onChange={(e) => updateConfigMutation.mutate({ 
                      slowQueryThreshold: parseInt(e.target.value) 
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="backupRetentionDays">Giorni Retention Backup</Label>
                  <Input
                    id="backupRetentionDays"
                    type="number"
                    value={config?.backupRetentionDays || 30}
                    onChange={(e) => updateConfigMutation.mutate({ 
                      backupRetentionDays: parseInt(e.target.value) 
                    })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoVacuum"
                    checked={config?.autoVacuumEnabled || false}
                    onCheckedChange={(checked) => updateConfigMutation.mutate({ 
                      autoVacuumEnabled: checked 
                    })}
                  />
                  <Label htmlFor="autoVacuum">Auto Vacuum Abilitato</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="logSlowQueries"
                    checked={config?.logSlowQueries || false}
                    onCheckedChange={(checked) => updateConfigMutation.mutate({ 
                      logSlowQueries: checked 
                    })}
                  />
                  <Label htmlFor="logSlowQueries">Log Query Lente</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoBackup"
                    checked={config?.autoBackupEnabled || false}
                    onCheckedChange={(checked) => updateConfigMutation.mutate({ 
                      autoBackupEnabled: checked 
                    })}
                  />
                  <Label htmlFor="autoBackup">Backup Automatico</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="neon">
          <NeonDBConfiguration />
        </TabsContent>
      </Tabs>
    </div>
  );
}