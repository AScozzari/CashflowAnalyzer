import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackupProviderConfigProfessional } from './backup-provider-config-professional';
import type { BackupJob } from '../../../../shared/backup-schema';
import { 
  Database, 
  Cloud, 
  Clock, 
  Settings, 
  HardDrive,
  CheckCircle,
  XCircle,
  Play,
  Archive,
  RotateCcw
} from "lucide-react";

export function BackupSettings() {
  const [activeTab, setActiveTab] = useState("overview");

  // Real data from backup API
  const { data: backupStats } = useQuery({
    queryKey: ["/api/backup/stats"],
    queryFn: () => fetch("/api/backup/stats").then(res => res.json()),
    staleTime: 30000,
  });

  const { data: backupJobs } = useQuery({
    queryKey: ["/api/backup/jobs"],
    queryFn: () => fetch("/api/backup/jobs").then(res => res.json()),
    staleTime: 60000,
  });

  const { data: backupConfigs } = useQuery({
    queryKey: ["/api/backup/configurations"],
    queryFn: () => fetch("/api/backup/configurations").then(res => res.json()),
    staleTime: 300000,
  });

  // Helper functions
  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Play className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Sistema Backup e Recovery
          </h2>
          <p className="text-muted-foreground mt-1">
            Gestione backup automatizzati, restore points e disaster recovery per business continuity
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <HardDrive className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center space-x-2">
            <Cloud className="h-4 w-4" />
            <span>Provider</span>
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Jobs</span>
          </TabsTrigger>
          <TabsTrigger value="restore" className="flex items-center space-x-2">
            <Archive className="h-4 w-4" />
            <span>Restore</span>
          </TabsTrigger>
          <TabsTrigger value="configurations" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Config</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Configurazioni Attive</p>
                    <p className="text-2xl font-bold text-green-600">
                      {backupStats?.activeConfigurations || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Settings className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Backup Completati</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {backupStats?.successfulJobs || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Database className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Storage Totale</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatBytes(backupStats?.totalBackupSize || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <HardDrive className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Restore Points</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {backupStats?.totalRestorePoints || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Archive className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Attività Recenti</CardTitle>
              <CardDescription>Ultimi backup e restore points creati</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backupJobs?.slice(0, 5).map((job: BackupJob) => (
                  <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <p className="font-medium">{job.type} Backup</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(job.createdAt).toLocaleString('it-IT')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="default">
                        {job.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatBytes(job.backupSizeBytes || 0)}
                      </p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nessuna attività recente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Provider Configuration Tab - PROFESSIONAL CARDS */}
        <TabsContent value="providers" className="space-y-6">
          <BackupProviderConfigProfessional />
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cronologia Backup Jobs</CardTitle>
              <CardDescription>
                Stato e dettagli di tutti i job di backup eseguiti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backupJobs?.map((job: BackupJob) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <h4 className="font-medium">{job.type} Backup</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(job.createdAt).toLocaleString('it-IT')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="default">{job.status}</Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatBytes(job.backupSizeBytes || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nessun job eseguito</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restore" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Restore Points</CardTitle>
              <CardDescription>
                Punti di ripristino disponibili per il recovery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nessun restore point disponibile</p>
                <p className="text-sm text-muted-foreground mt-1">
                  I restore points verranno creati automaticamente con i backup
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configurations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurazioni Backup</CardTitle>
              <CardDescription>
                Gestisci le configurazioni di backup automatizzato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backupConfigs?.map((config: any) => (
                  <div key={config.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-medium">{config.name}</h5>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={config.enabled ? "default" : "outline"}>
                          {config.enabled ? "Attivo" : "Disabilitato"}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nessuna configurazione trovata</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}