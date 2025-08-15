import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Database, 
  Cloud, 
  Shield, 
  Clock, 
  Server, 
  Settings, 
  HardDrive,
  Plus,
  Save,
  TestTube2 as TestTube,
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
    staleTime: 30000, // Cache for 30 seconds
  });

  const { data: backupJobs } = useQuery({
    queryKey: ["/api/backup/jobs"],
    queryFn: () => fetch("/api/backup/jobs").then(res => res.json()),
    staleTime: 60000, // Cache for 1 minute
  });

  const { data: backupConfigs } = useQuery({
    queryKey: ["/api/backup/configurations"],
    queryFn: () => fetch("/api/backup/configurations").then(res => res.json()),
    staleTime: 300000, // Cache for 5 minutes
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <HardDrive className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center space-x-2">
            <Cloud className="h-4 w-4" />
            <span>Provider</span>
          </TabsTrigger>
          <TabsTrigger value="configurations" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Configurazioni</span>
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Jobs</span>
          </TabsTrigger>
          <TabsTrigger value="restore" className="flex items-center space-x-2">
            <Archive className="h-4 w-4" />
            <span>Restore Points</span>
          </TabsTrigger>
          <TabsTrigger value="disaster" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Disaster Recovery</span>
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
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Spazio Utilizzato</p>
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
              <CardTitle>Attività Recente</CardTitle>
              <CardDescription>Ultimi backup e restore points creati</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backupJobs?.slice(0, 5).map((job) => (
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
                        {formatBytes(job.backupSizeBytes)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Provider Configuration Tab */}
        <TabsContent value="providers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Cloud className="h-5 w-5 text-blue-500" />
                <span>Configurazione Provider di Storage</span>
              </CardTitle>
              <CardDescription>
                Configura i provider cloud per il backup. Seleziona il provider principale e inserisci le credenziali di accesso.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Provider Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Google Cloud Storage */}
                <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <Cloud className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="font-medium">Google Cloud Storage</span>
                      </div>
                      <Badge variant="default" className="bg-green-100 text-green-800">Attivo</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Bucket:</span>
                        <span className="font-mono text-xs">replit-objstore-bd98...</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Region:</span>
                        <span>us-central1</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Storage:</span>
                        <span>Standard</span>
                      </div>
                    </div>
                    <Button className="w-full mt-3" variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configura
                    </Button>
                  </CardContent>
                </Card>

                {/* Amazon S3 */}
                <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                          <Database className="h-5 w-5 text-orange-600" />
                        </div>
                        <span className="font-medium">Amazon S3</span>
                      </div>
                      <Badge variant="outline">Non configurato</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Backup ridondante su AWS S3</p>
                      <p>• Durata 99.999999999%</p>
                      <p>• Multi-region replication</p>
                      <p>• Glacier per archiviazione</p>
                    </div>
                    <Button className="w-full mt-3" variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi S3
                    </Button>
                  </CardContent>
                </Card>

                {/* Azure Blob Storage */}
                <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <Server className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="font-medium">Azure Blob</span>
                      </div>
                      <Badge variant="outline">Non configurato</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Backup enterprise su Azure</p>
                      <p>• Hot/Cool/Archive tiers</p>
                      <p>• Geo-redundant storage</p>
                      <p>• Compliance avanzato</p>
                    </div>
                    <Button className="w-full mt-3" variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Azure
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Configuration Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Configurazione Provider</CardTitle>
                  <CardDescription>
                    Inserisci le credenziali e configura le impostazioni per i provider di backup
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Provider Selection */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Provider Primario</label>
                        <Select defaultValue="gcs">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                            <SelectItem value="s3">Amazon S3</SelectItem>
                            <SelectItem value="azure">Azure Blob Storage</SelectItem>
                            <SelectItem value="local">Storage Locale</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Bucket/Container</label>
                        <Input 
                          placeholder="nome-bucket-backup"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Percorso Base</label>
                        <Input 
                          placeholder="/backups/easycashflows"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Region</label>
                        <Select defaultValue="us-central1">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="us-central1">US Central 1</SelectItem>
                            <SelectItem value="europe-west1">Europe West 1</SelectItem>
                            <SelectItem value="asia-southeast1">Asia Southeast 1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Credentials */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Access Key ID</label>
                        <Input 
                          type="password"
                          placeholder="••••••••••••••••"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Secret Access Key</label>
                        <Input 
                          type="password"
                          placeholder="••••••••••••••••••••••••••••••••"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Service Account JSON (GCS)</label>
                        <Textarea 
                          placeholder="Incolla qui il contenuto del file JSON..."
                          rows={4}
                          className="mt-1 font-mono text-xs"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch id="encryption" defaultChecked />
                        <label htmlFor="encryption" className="text-sm font-medium">
                          Abilita crittografia server-side
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-6 border-t">
                    <Button variant="outline">
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Connessione
                    </Button>
                    <div className="space-x-2">
                      <Button variant="outline">Annulla</Button>
                      <Button>
                        <Save className="h-4 w-4 mr-2" />
                        Salva Configurazione
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Storage Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Utilizzo Storage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Google Cloud Storage</span>
                      <span className="text-sm text-muted-foreground">2.3 GB / 100 GB</span>
                    </div>
                    <Progress value={23} className="h-2" />
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-lg">156</div>
                        <div className="text-muted-foreground">File Backup</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-lg">2.3 GB</div>
                        <div className="text-muted-foreground">Spazio Usato</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-lg">97.7 GB</div>
                        <div className="text-muted-foreground">Disponibile</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs placeholder */}
        <TabsContent value="configurations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurazioni Backup</CardTitle>
              <CardDescription>
                Gestisci le configurazioni di backup automatizzati
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Configurazione backup in sviluppo</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Funzionalità disponibile nella prossima release
                </p>
              </div>
            </CardContent>
          </Card>
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
                {backupJobs?.map((job) => (
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
                          {formatBytes(job.backupSizeBytes)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
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

        <TabsContent value="disaster" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Disaster Recovery</CardTitle>
              <CardDescription>
                Piano di disaster recovery e procedure di emergenza
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Piano disaster recovery in sviluppo</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Procedure di emergency recovery disponibili nella prossima release
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}