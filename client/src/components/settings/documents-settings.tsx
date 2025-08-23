import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText,
  Upload,
  Download,
  HardDrive,
  Cloud,
  FileCheck,
  FilePlus,
  Trash2,
  Settings,
  Shield,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Folder,
  Search
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface DocumentSettings {
  // Storage configuration
  maxFileSize: number; // MB
  allowedFormats: string[];
  storageProvider: 'local' | 'gcp' | 's3' | 'azure';
  autoBackup: boolean;
  
  // Processing settings
  autoProcessXML: boolean;
  validateFatturaPA: boolean;
  extractMetadata: boolean;
  generateThumbnails: boolean;
  
  // Security settings
  encryptFiles: boolean;
  requireApproval: boolean;
  accessLogging: boolean;
  virusScan: boolean;
  
  // Retention policy
  retentionDays: number;
  autoArchive: boolean;
  archiveAfterDays: number;
  
  // Templates
  fatturapaTemplate: string;
  invoiceTemplate: string;
  reportTemplate: string;
}

interface DocumentStats {
  totalFiles: number;
  totalSize: string;
  byType: {
    pdf: { count: number; size: string };
    xml: { count: number; size: string };
    xlsx: { count: number; size: string };
    other: { count: number; size: string };
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  recent: Array<{
    id: string;
    name: string;
    type: string;
    size: string;
    uploadedAt: string;
    processedAt?: string;
    status: 'processing' | 'completed' | 'error';
  }>;
  processing: {
    pending: number;
    completed: number;
    failed: number;
  };
}

const allowedFormats = [
  { value: 'pdf', label: 'PDF', icon: '📄' },
  { value: 'xml', label: 'XML (FatturaPA)', icon: '📋' },
  { value: 'xlsx', label: 'Excel', icon: '📊' },
  { value: 'xls', label: 'Excel Legacy', icon: '📊' },
  { value: 'csv', label: 'CSV', icon: '📈' },
  { value: 'doc', label: 'Word', icon: '📝' },
  { value: 'docx', label: 'Word', icon: '📝' },
  { value: 'txt', label: 'Testo', icon: '📄' },
  { value: 'jpg', label: 'JPEG', icon: '🖼️' },
  { value: 'png', label: 'PNG', icon: '🖼️' },
  { value: 'gif', label: 'GIF', icon: '🖼️' }
];

const storageProviders = [
  { value: 'local', label: 'Storage Locale', icon: '🗄️' },
  { value: 'gcp', label: 'Google Cloud Storage', icon: '☁️' },
  { value: 's3', label: 'Amazon S3', icon: '📦' },
  { value: 'azure', label: 'Azure Blob Storage', icon: '🔷' }
];

export default function DocumentsSettings() {
  const [activeTab, setActiveTab] = useState('storage');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch document settings
  const { data: settings, isLoading: settingsLoading } = useQuery<DocumentSettings>({
    queryKey: ['/api/documents/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/documents/settings');
      return response.json();
    }
  });

  // Fetch document stats
  const { data: stats, isLoading: statsLoading } = useQuery<DocumentStats>({
    queryKey: ['/api/documents/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/documents/stats');
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<DocumentSettings>) => {
      const response = await apiRequest('PUT', '/api/documents/settings', newSettings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '✅ Impostazioni Salvate',
        description: 'Le impostazioni documenti sono state aggiornate'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/settings'] });
    }
  });

  // Process pending documents mutation
  const processDocumentsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/documents/process-pending');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '✅ Elaborazione Avviata',
        description: 'I documenti in coda sono in elaborazione'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/stats'] });
    }
  });

  // Clean up old documents mutation
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/documents/cleanup');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: '✅ Pulizia Completata',
        description: `${data.deleted} documenti rimossi, ${data.archived} archiviati`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/stats'] });
    }
  });

  const handleSettingChange = (key: keyof DocumentSettings, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const getStorageColor = () => {
    if (!stats) return 'bg-gray-200';
    if (stats.storage.percentage < 70) return 'bg-green-500';
    if (stats.storage.percentage < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (settingsLoading || statsLoading) {
    return <div className="text-center py-8">Caricamento impostazioni documenti...</div>;
  }

  return (
    <div className="space-y-6" data-testid="documents-settings">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-indigo-600" />
        <h2 className="text-xl font-semibold">Gestione Documenti</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="processing">Elaborazione</TabsTrigger>
          <TabsTrigger value="security">Sicurezza</TabsTrigger>
          <TabsTrigger value="templates">Template</TabsTrigger>
          <TabsTrigger value="maintenance">Manutenzione</TabsTrigger>
        </TabsList>

        <TabsContent value="storage" className="space-y-4">
          {/* Storage Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Documenti Totali</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalFiles || 0}</div>
                <p className="text-xs text-muted-foreground">File archiviati</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Spazio Utilizzato</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalSize || '0 MB'}</div>
                <Progress 
                  value={stats?.storage.percentage || 0} 
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.storage.percentage || 0}% utilizzato
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">In Elaborazione</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats?.processing.pending || 0}</div>
                <p className="text-xs text-muted-foreground">Documenti in coda</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Completati</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats?.processing.completed || 0}</div>
                <p className="text-xs text-muted-foreground">Elaborati con successo</p>
              </CardContent>
            </Card>
          </div>

          {/* Storage Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configurazione Storage</CardTitle>
              <CardDescription>
                Impostazioni di archiviazione e limiti file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxFileSize">Dimensione Max File (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={settings?.maxFileSize || 50}
                    onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="storageProvider">Provider Storage</Label>
                  <Select
                    value={settings?.storageProvider || 'local'}
                    onValueChange={(value) => handleSettingChange('storageProvider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {storageProviders.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          <div className="flex items-center gap-2">
                            <span>{provider.icon}</span>
                            {provider.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Formati Consentiti</Label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                  {allowedFormats.map((format) => (
                    <div key={format.value} className="flex items-center space-x-2">
                      <Switch
                        id={`format-${format.value}`}
                        checked={settings?.allowedFormats?.includes(format.value) || false}
                        onCheckedChange={(checked) => {
                          const current = settings?.allowedFormats || [];
                          const updated = checked 
                            ? [...current, format.value]
                            : current.filter(f => f !== format.value);
                          handleSettingChange('allowedFormats', updated);
                        }}
                      />
                      <Label htmlFor={`format-${format.value}`} className="flex items-center gap-1 text-xs">
                        <span>{format.icon}</span>
                        {format.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="autoBackup"
                  checked={settings?.autoBackup || false}
                  onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
                />
                <Label htmlFor="autoBackup">Backup Automatico</Label>
              </div>
            </CardContent>
          </Card>

          {/* File Types Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Tipologie File</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.byType && Object.entries(stats.byType).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{type.toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground">{data.count} file</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{data.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          {/* Processing Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Elaborazione</CardTitle>
              <CardDescription>
                Configurazione automatica del processing documenti
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoProcessXML"
                    checked={settings?.autoProcessXML || false}
                    onCheckedChange={(checked) => handleSettingChange('autoProcessXML', checked)}
                  />
                  <Label htmlFor="autoProcessXML">Elaborazione Automatica XML</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="validateFatturaPA"
                    checked={settings?.validateFatturaPA || false}
                    onCheckedChange={(checked) => handleSettingChange('validateFatturaPA', checked)}
                  />
                  <Label htmlFor="validateFatturaPA">Validazione FatturaPA</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="extractMetadata"
                    checked={settings?.extractMetadata || false}
                    onCheckedChange={(checked) => handleSettingChange('extractMetadata', checked)}
                  />
                  <Label htmlFor="extractMetadata">Estrazione Metadati</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="generateThumbnails"
                    checked={settings?.generateThumbnails || false}
                    onCheckedChange={(checked) => handleSettingChange('generateThumbnails', checked)}
                  />
                  <Label htmlFor="generateThumbnails">Generazione Thumbnail</Label>
                </div>
              </div>

              <Button
                onClick={() => processDocumentsMutation.mutate()}
                disabled={processDocumentsMutation.isPending}
                className="w-full"
              >
                <FilePlus className="h-4 w-4 mr-2" />
                Elabora Documenti in Coda ({stats?.processing.pending || 0})
              </Button>
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documenti Recenti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.recent?.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(doc.status)}
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.type} • {doc.size} • {new Date(doc.uploadedAt).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={doc.status === 'completed' ? 'default' : 
                              doc.status === 'error' ? 'destructive' : 'secondary'}
                    >
                      {doc.status}
                    </Badge>
                  </div>
                )) || <p className="text-muted-foreground">Nessun documento recente</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sicurezza Documenti</CardTitle>
              <CardDescription>
                Impostazioni di sicurezza e controllo accessi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="encryptFiles"
                    checked={settings?.encryptFiles || false}
                    onCheckedChange={(checked) => handleSettingChange('encryptFiles', checked)}
                  />
                  <Label htmlFor="encryptFiles">Cifratura File</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="requireApproval"
                    checked={settings?.requireApproval || false}
                    onCheckedChange={(checked) => handleSettingChange('requireApproval', checked)}
                  />
                  <Label htmlFor="requireApproval">Richiedi Approvazione</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="accessLogging"
                    checked={settings?.accessLogging || false}
                    onCheckedChange={(checked) => handleSettingChange('accessLogging', checked)}
                  />
                  <Label htmlFor="accessLogging">Log Accessi</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="virusScan"
                    checked={settings?.virusScan || false}
                    onCheckedChange={(checked) => handleSettingChange('virusScan', checked)}
                  />
                  <Label htmlFor="virusScan">Scansione Antivirus</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Documenti</CardTitle>
              <CardDescription>
                Configurazione template per FatturaPA e altri documenti
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fatturapaTemplate">Template FatturaPA</Label>
                <Select
                  value={settings?.fatturapaTemplate || ''}
                  onValueChange={(value) => handleSettingChange('fatturapaTemplate', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard IT</SelectItem>
                    <SelectItem value="simplified">Semplificato</SelectItem>
                    <SelectItem value="custom">Personalizzato</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="invoiceTemplate">Template Fatture</Label>
                <Select
                  value={settings?.invoiceTemplate || ''}
                  onValueChange={(value) => handleSettingChange('invoiceTemplate', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professionale</SelectItem>
                    <SelectItem value="simple">Semplice</SelectItem>
                    <SelectItem value="detailed">Dettagliato</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reportTemplate">Template Report</Label>
                <Select
                  value={settings?.reportTemplate || ''}
                  onValueChange={(value) => handleSettingChange('reportTemplate', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executive">Esecutivo</SelectItem>
                    <SelectItem value="detailed">Dettagliato</SelectItem>
                    <SelectItem value="summary">Riassuntivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Politiche di Retention</CardTitle>
              <CardDescription>
                Gestione archiviazione e pulizia automatica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="retentionDays">Giorni Retention</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    value={settings?.retentionDays || 365}
                    onChange={(e) => handleSettingChange('retentionDays', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="archiveAfterDays">Archivia Dopo (giorni)</Label>
                  <Input
                    id="archiveAfterDays"
                    type="number"
                    value={settings?.archiveAfterDays || 90}
                    onChange={(e) => handleSettingChange('archiveAfterDays', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="autoArchive"
                  checked={settings?.autoArchive || false}
                  onCheckedChange={(checked) => handleSettingChange('autoArchive', checked)}
                />
                <Label htmlFor="autoArchive">Archiviazione Automatica</Label>
              </div>

              <Button
                onClick={() => cleanupMutation.mutate()}
                disabled={cleanupMutation.isPending}
                variant="outline"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Avvia Pulizia Documenti
              </Button>
            </CardContent>
          </Card>

          {/* Storage Health */}
          <Card>
            <CardHeader>
              <CardTitle>Salute Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Utilizzo Storage</span>
                    <span>{stats?.storage.percentage || 0}%</span>
                  </div>
                  <Progress 
                    value={stats?.storage.percentage || 0}
                    className={`h-3 ${getStorageColor()}`}
                  />
                </div>

                {stats?.storage.percentage > 90 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Lo storage è quasi pieno. Considera l'archiviazione o l'eliminazione di documenti vecchi.
                    </AlertDescription>
                  </Alert>
                )}

                {stats?.processing.failed > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {stats.processing.failed} documenti hanno fallito l'elaborazione. 
                      Controlla i log per dettagli.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}