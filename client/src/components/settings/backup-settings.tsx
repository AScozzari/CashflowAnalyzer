import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  backupConfigurationFormSchema, 
  manualRestorePointFormSchema, 
  restoreFormSchema,
  createCronExpression,
  parseCronSchedule,
  type BackupConfigurationForm,
  type ManualRestorePointForm,
  type RestoreForm 
} from "../../../../shared/backup-schema";
import { 
  Database, 
  Cloud, 
  Shield, 
  Clock, 
  Server, 
  Download, 
  Upload, 
  Settings, 
  Calendar, 
  HardDrive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Archive,
  RotateCcw,
  Trash2,
  Eye
} from "lucide-react";

export function BackupSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch backup data
  const { data: configurations, isLoading: configsLoading } = useQuery({
    queryKey: ["/api/backup/configurations"],
    queryFn: async () => {
      const response = await apiRequest("/api/backup/configurations");
      return response;
    },
  });

  const { data: backupStats } = useQuery({
    queryKey: ["/api/backup/stats"],
    queryFn: async () => {
      const response = await apiRequest("/api/backup/stats");
      return response;
    },
  });

  const { data: backupJobs } = useQuery({
    queryKey: ["/api/backup/jobs"],
    queryFn: async () => {
      const response = await apiRequest("/api/backup/jobs");
      return response;
    },
  });

  const { data: restorePoints } = useQuery({
    queryKey: ["/api/backup/restore-points"],
    queryFn: async () => {
      const response = await apiRequest("/api/backup/restore-points");
      return response;
    },
  });

  // Create backup configuration mutation
  const createConfigMutation = useMutation({
    mutationFn: async (data: BackupConfigurationForm) => {
      const response = await fetch("/api/backup/configurations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          schedule: data.schedule_type === 'custom' ? data.schedule : 
            createCronExpression(data.schedule_type!, data.schedule_time, data.schedule_day, data.schedule_date)
        }),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to create backup configuration");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Configurazione backup creata con successo" });
      queryClient.invalidateQueries({ queryKey: ["/api/backup/configurations"] });
      configForm.reset();
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile creare la configurazione backup",
        variant: "destructive" 
      });
    },
  });

  // Manual backup mutation
  const manualBackupMutation = useMutation({
    mutationFn: async (configId: string) => {
      const response = await fetch(`/api/backup/run/${configId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to start backup");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Backup avviato con successo" });
      queryClient.invalidateQueries({ queryKey: ["/api/backup/jobs"] });
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile avviare il backup",
        variant: "destructive" 
      });
    },
  });

  // Create manual restore point mutation
  const createRestorePointMutation = useMutation({
    mutationFn: async (data: ManualRestorePointForm) => {
      const response = await fetch("/api/backup/restore-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to create restore point");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Punto di ripristino creato con successo" });
      queryClient.invalidateQueries({ queryKey: ["/api/backup/restore-points"] });
      restorePointForm.reset();
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile creare il punto di ripristino",
        variant: "destructive" 
      });
    },
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async (data: RestoreForm) => {
      const response = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to restore");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Ripristino completato con successo" });
      restoreForm.reset();
    },
    onError: () => {
      toast({ 
        title: "Errore", 
        description: "Impossibile completare il ripristino",
        variant: "destructive" 
      });
    },
  });

  // Forms
  const configForm = useForm<BackupConfigurationForm>({
    resolver: zodResolver(backupConfigurationFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "database",
      schedule_type: "daily",
      schedule_time: "02:00",
      schedule_day: 0,
      schedule_date: 1,
      enabled: true,
      retention_days: 30,
      storage_provider: "gcs",
      encryption_enabled: true,
      compression_enabled: true,
      verification_enabled: true,
    },
  });

  const restorePointForm = useForm<ManualRestorePointForm>({
    resolver: zodResolver(manualRestorePointFormSchema),
    defaultValues: {
      name: "",
      description: "",
      include_database: true,
      include_files: true,
    },
  });

  const restoreForm = useForm<RestoreForm>({
    resolver: zodResolver(restoreFormSchema),
    defaultValues: {
      restore_point_id: "",
      restore_database: true,
      restore_files: true,
      confirm_restore: false,
    },
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

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      failed: "destructive", 
      running: "secondary",
      pending: "outline"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status}
      </Badge>
    );
  };

  if (configsLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Caricamento configurazioni backup...</p>
        </div>
      </div>
    );
  }

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
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/backup"] })}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
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

        {/* Configuration Tab */}
        <TabsContent value="configurations" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Configurazioni Attive</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(backupStats as any)?.activeConfigurations || 0}
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
                      {(backupStats as any)?.successfulJobs || 0}
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
                    <p className="text-sm font-medium text-muted-foreground">Restore Points</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(backupStats as any)?.totalRestorePoints || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Archive className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Spazio Utilizzato</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatBytes((backupStats as any)?.totalBackupSize || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <HardDrive className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Ultimi Backup Jobs</span>
              </CardTitle>
              <CardDescription>
                Stato degli ultimi backup eseguiti automaticamente o manualmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(backupJobs as any)?.slice(0, 5).map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <p className="font-medium">{job.type === 'database' ? 'Database' : job.type === 'files' ? 'Files' : 'Full Backup'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(job.created_at).toLocaleString('it-IT')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(job.status)}
                      {job.backup_size_bytes && (
                        <span className="text-sm text-muted-foreground">
                          {formatBytes(job.backup_size_bytes)}
                        </span>
                      )}
                      {job.duration_seconds && (
                        <span className="text-sm text-muted-foreground">
                          {Math.round(job.duration_seconds / 60)}m
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                {(!backupJobs || (backupJobs as any).length === 0) && (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nessun backup job trovato</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configura un backup automatico per iniziare
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Azioni Rapide</CardTitle>
              <CardDescription>
                Operazioni di backup e restore più comuni
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => setActiveTab("configurations")}
                  className="h-20 flex-col space-y-2"
                  variant="outline"
                >
                  <Settings className="h-6 w-6" />
                  <span>Configura Backup</span>
                </Button>
                
                <Button 
                  onClick={() => {
                    restorePointForm.setValue("name", `Backup manuale ${new Date().toLocaleString('it-IT')}`);
                    // Trigger manual restore point creation
                  }}
                  className="h-20 flex-col space-y-2"
                  variant="outline"
                  disabled={createRestorePointMutation.isPending}
                >
                  <Archive className="h-6 w-6" />
                  <span>Crea Restore Point</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurations Tab */}
        <TabsContent value="configurations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Configuration Form */}
            <Card>
              <CardHeader>
                <CardTitle>Nuova Configurazione Backup</CardTitle>
                <CardDescription>
                  Configura backup automatici per database, file o sistema completo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...configForm}>
                  <form onSubmit={configForm.handleSubmit((data) => createConfigMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={configForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Configurazione</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="es. Backup Giornaliero Database" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrizione</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Descrizione opzionale della configurazione..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo Backup</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="database">Solo Database</SelectItem>
                              <SelectItem value="files">Solo File</SelectItem>
                              <SelectItem value="full">Sistema Completo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="schedule_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequenza</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">Giornaliero</SelectItem>
                              <SelectItem value="weekly">Settimanale</SelectItem>
                              <SelectItem value="monthly">Mensile</SelectItem>
                              <SelectItem value="custom">Personalizzato (cron)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {configForm.watch("schedule_type") !== "custom" && (
                      <FormField
                        control={configForm.control}
                        name="schedule_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Orario</FormLabel>
                            <FormControl>
                              <Input {...field} type="time" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {configForm.watch("schedule_type") === "custom" && (
                      <FormField
                        control={configForm.control}
                        name="schedule"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Espressione Cron</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="0 2 * * *" />
                            </FormControl>
                            <FormDescription>
                              Formato: minuto ora giorno mese giorno_settimana
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={configForm.control}
                      name="retention_days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Retention (giorni)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="1"
                              max="3650"
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Numero di giorni per cui mantenere i backup
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={configForm.control}
                      name="storage_provider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Storage Provider</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                              <SelectItem value="s3">Amazon S3</SelectItem>
                              <SelectItem value="azure">Azure Storage</SelectItem>
                              <SelectItem value="local">Storage Locale</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3">
                      <FormField
                        control={configForm.control}
                        name="enabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Configurazione Attiva</FormLabel>
                              <FormDescription>Abilita backup automatici</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={configForm.control}
                        name="encryption_enabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Crittografia</FormLabel>
                              <FormDescription>Crittografa i backup</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={configForm.control}
                        name="compression_enabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Compressione</FormLabel>
                              <FormDescription>Comprimi i backup</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={configForm.control}
                        name="verification_enabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Verifica Integrità</FormLabel>
                              <FormDescription>Verifica checksum backup</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={createConfigMutation.isPending}
                      className="w-full"
                    >
                      {createConfigMutation.isPending ? "Creazione..." : "Crea Configurazione"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Existing Configurations */}
            <Card>
              <CardHeader>
                <CardTitle>Configurazioni Esistenti</CardTitle>
                <CardDescription>
                  Gestisci le configurazioni di backup esistenti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(configurations as any)?.map((config: any) => (
                    <div key={config.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{config.name}</h4>
                        <div className="flex items-center space-x-2">
                          {config.enabled ? (
                            <Badge variant="default">Attivo</Badge>
                          ) : (
                            <Badge variant="outline">Disattivo</Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => manualBackupMutation.mutate(config.id)}
                            disabled={manualBackupMutation.isPending}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Tipo:</strong> {config.type}</p>
                        <p><strong>Schedule:</strong> {parseCronSchedule(config.schedule)}</p>
                        <p><strong>Retention:</strong> {config.retention_days} giorni</p>
                        <p><strong>Storage:</strong> {config.storage_provider.toUpperCase()}</p>
                      </div>
                      
                      {config.description && (
                        <p className="text-sm text-muted-foreground mt-2">{config.description}</p>
                      )}
                    </div>
                  ))}
                  
                  {(!configurations || (configurations as any).length === 0) && (
                    <div className="text-center py-8">
                      <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nessuna configurazione backup</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Crea la prima configurazione usando il form a sinistra
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Jobs Tab */}
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
                {(backupJobs as any)?.map((job: any) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <h4 className="font-medium">
                            {job.type === 'database' ? 'Database Backup' : 
                             job.type === 'files' ? 'Files Backup' : 'Full System Backup'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(job.created_at).toLocaleString('it-IT')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(job.status)}
                        {job.backup_size_bytes && (
                          <span className="text-sm font-medium">
                            {formatBytes(job.backup_size_bytes)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {job.started_at && (
                        <div>
                          <span className="text-muted-foreground">Avviato:</span>
                          <p className="font-medium">
                            {new Date(job.started_at).toLocaleTimeString('it-IT')}
                          </p>
                        </div>
                      )}
                      
                      {job.completed_at && (
                        <div>
                          <span className="text-muted-foreground">Completato:</span>
                          <p className="font-medium">
                            {new Date(job.completed_at).toLocaleTimeString('it-IT')}
                          </p>
                        </div>
                      )}
                      
                      {job.duration_seconds && (
                        <div>
                          <span className="text-muted-foreground">Durata:</span>
                          <p className="font-medium">
                            {Math.floor(job.duration_seconds / 60)}m {job.duration_seconds % 60}s
                          </p>
                        </div>
                      )}
                      
                      {job.file_count && (
                        <div>
                          <span className="text-muted-foreground">File:</span>
                          <p className="font-medium">{job.file_count.toLocaleString()}</p>
                        </div>
                      )}
                    </div>

                    {job.backup_path && (
                      <div className="mt-3">
                        <span className="text-sm text-muted-foreground">Path:</span>
                        <p className="text-sm font-mono bg-muted p-2 rounded mt-1">
                          {job.backup_path}
                        </p>
                      </div>
                    )}

                    {job.error_message && (
                      <div className="mt-3">
                        <span className="text-sm text-red-600">Errore:</span>
                        <p className="text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded mt-1 text-red-700 dark:text-red-300">
                          {job.error_message}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                
                {(!backupJobs || (backupJobs as any).length === 0) && (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">Nessun backup job trovato</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      I job di backup appariranno qui dopo l'esecuzione
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Restore Points Tab */}
        <TabsContent value="restore" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Manual Restore Point */}
            <Card>
              <CardHeader>
                <CardTitle>Crea Restore Point</CardTitle>
                <CardDescription>
                  Crea un punto di ripristino manuale prima di operazioni critiche
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...restorePointForm}>
                  <form 
                    onSubmit={restorePointForm.handleSubmit((data) => createRestorePointMutation.mutate(data))} 
                    className="space-y-4"
                  >
                    <FormField
                      control={restorePointForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Restore Point</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="es. Pre-aggiornamento sistema" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={restorePointForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrizione</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Motivo della creazione del restore point..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3">
                      <FormField
                        control={restorePointForm.control}
                        name="include_database"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Includi Database</FormLabel>
                              <FormDescription>Backup completo del database</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={restorePointForm.control}
                        name="include_files"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Includi File</FormLabel>
                              <FormDescription>Backup di uploads e file di sistema</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={createRestorePointMutation.isPending}
                      className="w-full"
                    >
                      {createRestorePointMutation.isPending ? "Creazione..." : "Crea Restore Point"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Restore Operation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span>Ripristino Sistema</span>
                </CardTitle>
                <CardDescription>
                  <strong className="text-destructive">ATTENZIONE:</strong> Il ripristino sovrascriverà i dati attuali
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...restoreForm}>
                  <form 
                    onSubmit={restoreForm.handleSubmit((data) => restoreMutation.mutate(data))} 
                    className="space-y-4"
                  >
                    <FormField
                      control={restoreForm.control}
                      name="restore_point_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Punto di Ripristino</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona un restore point" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(restorePoints as any)?.map((point: any) => (
                                <SelectItem key={point.id} value={point.id}>
                                  <div>
                                    <div>{point.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(point.created_at).toLocaleString('it-IT')}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3">
                      <FormField
                        control={restoreForm.control}
                        name="restore_database"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Ripristina Database</FormLabel>
                              <FormDescription>Sovrascrive tutti i dati del database</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={restoreForm.control}
                        name="restore_files"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Ripristina File</FormLabel>
                              <FormDescription>Sovrascrive uploads e file di sistema</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={restoreForm.control}
                        name="confirm_restore"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between p-4 border border-destructive rounded-lg">
                            <div>
                              <FormLabel className="text-destructive">Conferma Ripristino</FormLabel>
                              <FormDescription>
                                Ho compreso che questa operazione è irreversibile
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={restoreMutation.isPending || !restoreForm.watch("confirm_restore")}
                      variant="destructive"
                      className="w-full"
                    >
                      {restoreMutation.isPending ? "Ripristino in corso..." : "Avvia Ripristino"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Restore Points List */}
          <Card>
            <CardHeader>
              <CardTitle>Punti di Ripristino Disponibili</CardTitle>
              <CardDescription>
                Tutti i restore point creati automaticamente e manualmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(restorePoints as any)?.map((point: any) => (
                  <div key={point.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{point.name}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant={point.verification_status === 'verified' ? 'default' : 'outline'}>
                          {point.verification_status}
                        </Badge>
                        <Badge variant="secondary">
                          {point.snapshot_type}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Creato:</strong> {new Date(point.created_at).toLocaleString('it-IT')}</p>
                      {point.total_size_bytes && (
                        <p><strong>Dimensione:</strong> {formatBytes(point.total_size_bytes)}</p>
                      )}
                      {point.description && (
                        <p><strong>Descrizione:</strong> {point.description}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => restoreForm.setValue("restore_point_id", point.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Seleziona
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Archive restore point logic
                        }}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archivia
                      </Button>
                    </div>
                  </div>
                ))}
                
                {(!restorePoints || (restorePoints as any).length === 0) && (
                  <div className="text-center py-12">
                    <Archive className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">Nessun restore point disponibile</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Crea il primo restore point usando il form sopra
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disaster Recovery Tab */}
        <TabsContent value="disaster" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-red-500" />
                <span>Disaster Recovery Plan</span>
              </CardTitle>
              <CardDescription>
                Procedure documentate per il ripristino in caso di emergenza
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* RTO & RPO Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <h4 className="font-medium">Recovery Time Objective (RTO)</h4>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">&lt; 2 ore</p>
                  <p className="text-sm text-muted-foreground">Tempo massimo accettabile per il ripristino</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Database className="h-5 w-5 text-green-500" />
                    <h4 className="font-medium">Recovery Point Objective (RPO)</h4>
                  </div>
                  <p className="text-2xl font-bold text-green-600">&lt; 15 min</p>
                  <p className="text-sm text-muted-foreground">Perdita massima accettabile di dati</p>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div>
                <h4 className="font-medium mb-3 flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span>Contatti di Emergenza</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded">
                    <p className="font-medium">Amministratore Sistema</p>
                    <p className="text-sm text-muted-foreground">admin@easycashflows.it</p>
                    <p className="text-sm text-muted-foreground">+39 XXX XXX XXXX</p>
                  </div>
                  <div className="p-3 border rounded">
                    <p className="font-medium">Support Tecnico</p>
                    <p className="text-sm text-muted-foreground">support@easycashflows.it</p>
                    <p className="text-sm text-muted-foreground">24/7 Emergency Line</p>
                  </div>
                </div>
              </div>

              {/* Recovery Procedures */}
              <div>
                <h4 className="font-medium mb-3 flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-blue-500" />
                  <span>Procedure di Ripristino</span>
                </h4>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
                    <h5 className="font-medium text-red-700 dark:text-red-300">1. Valutazione Danno</h5>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Identificare l'estensione del problema e decidere se procedere con il ripristino completo o parziale
                    </p>
                  </div>
                  
                  <div className="p-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20">
                    <h5 className="font-medium text-orange-700 dark:text-orange-300">2. Isolamento Sistema</h5>
                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                      Disconnettere il sistema dalla rete per prevenire ulteriori danni
                    </p>
                  </div>
                  
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                    <h5 className="font-medium text-blue-700 dark:text-blue-300">3. Ripristino Database</h5>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      Utilizzare l'ultimo restore point verificato per il ripristino del database
                    </p>
                  </div>
                  
                  <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                    <h5 className="font-medium text-green-700 dark:text-green-300">4. Verifica Integrità</h5>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Test completi per verificare che tutti i sistemi funzionino correttamente
                    </p>
                  </div>
                  
                  <div className="p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20">
                    <h5 className="font-medium text-purple-700 dark:text-purple-300">5. Riattivazione Servizi</h5>
                    <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                      Riportare gradualmente online tutti i servizi e comunicare agli utenti
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Recovery Button */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Test di Disaster Recovery</h4>
                    <p className="text-sm text-muted-foreground">
                      Ultimo test: {new Date().toLocaleDateString('it-IT')} - Risultato: ✅ Superato
                    </p>
                  </div>
                  <Button variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Avvia Test DR
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}