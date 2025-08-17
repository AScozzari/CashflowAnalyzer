import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Cloud, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Settings, 
  AlertTriangle,
  Save,
  TestTube
} from 'lucide-react';

interface ProviderStatus {
  provider: string;
  available: boolean;
  configured: boolean;
  error?: string;
  lastTest?: string;
}

export function BackupProviderConfig() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);

  // Form states
  const [s3Config, setS3Config] = useState({
    AWS_ACCESS_KEY_ID: '',
    AWS_SECRET_ACCESS_KEY: '',
    AWS_S3_BUCKET_NAME: 'easycashflows-backup',
    AWS_REGION: 'us-east-1'
  });

  const [azureConfig, setAzureConfig] = useState({
    AZURE_STORAGE_ACCOUNT_NAME: '',
    AZURE_STORAGE_ACCOUNT_KEY: '',
    AZURE_CONTAINER_NAME: 'easycashflows-backup'
  });

  // Load provider status
  const loadProviderStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/backup/providers/status');
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
      } else {
        toast({
          title: "Errore",
          description: "Impossibile caricare lo stato dei provider",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading provider status:', error);
      toast({
        title: "Errore di connessione",
        description: "Verifica la connessione di rete",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Test provider connection
  const testProvider = async (providerKey: string, config: any) => {
    try {
      setTestingProvider(providerKey);
      const response = await fetch(`/api/backup/providers/${providerKey}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast({
          title: "Test completato",
          description: `${providerKey.toUpperCase()}: Connessione riuscita!`,
          variant: "default"
        });
        return true;
      } else {
        toast({
          title: "Test fallito",
          description: result.error || "Credenziali non valide",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error(`Error testing ${providerKey}:`, error);
      toast({
        title: "Errore test",
        description: "Impossibile testare la connessione",
        variant: "destructive"
      });
      return false;
    } finally {
      setTestingProvider(null);
    }
  };

  // Save provider configuration
  const saveProvider = async (providerKey: string, config: any) => {
    try {
      setSavingProvider(providerKey);
      const response = await fetch(`/api/backup/providers/${providerKey}/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast({
          title: "Configurazione salvata",
          description: result.message || `${providerKey.toUpperCase()} configurato con successo`,
          variant: "default"
        });
        
        // Reload provider status
        await loadProviderStatus();
        return true;
      } else {
        toast({
          title: "Errore salvataggio",
          description: result.error || "Impossibile salvare la configurazione",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error(`Error saving ${providerKey}:`, error);
      toast({
        title: "Errore salvataggio",
        description: "Impossibile salvare la configurazione",
        variant: "destructive"
      });
      return false;
    } finally {
      setSavingProvider(null);
    }
  };

  // Handle S3 test and save
  const handleS3Test = () => testProvider('s3', s3Config);
  const handleS3Save = async () => {
    const testSuccess = await testProvider('s3', s3Config);
    if (testSuccess) {
      await saveProvider('s3', s3Config);
    }
  };

  // Handle Azure test and save
  const handleAzureTest = () => testProvider('azure', azureConfig);
  const handleAzureSave = async () => {
    const testSuccess = await testProvider('azure', azureConfig);
    if (testSuccess) {
      await saveProvider('azure', azureConfig);
    }
  };

  useEffect(() => {
    loadProviderStatus();
  }, []);

  const getProviderStatus = (providerKey: string) => {
    return providers.find(p => p.provider === providerKey);
  };

  const StatusBadge = ({ status }: { status?: ProviderStatus }) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    if (status.configured && status.available) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Attivo</Badge>;
    }
    if (status.configured && !status.available) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Errore</Badge>;
    }
    if (!status.configured) {
      return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />Non configurato</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Caricamento provider...</span>
      </div>
    );
  }

  const gcsStatus = getProviderStatus('gcs');
  const s3Status = getProviderStatus('s3');
  const azureStatus = getProviderStatus('azure');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Configurazione Provider Backup</h3>
        <p className="text-muted-foreground">
          Configura i provider cloud per il backup multi-cloud. Inserisci le credenziali di accesso per abilitare i backup ridondanti.
        </p>
      </div>

      {/* Provider Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Google Cloud Storage</h4>
                <p className="text-sm text-muted-foreground">Provider primario Replit</p>
              </div>
              <StatusBadge status={gcsStatus} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Amazon S3</h4>
                <p className="text-sm text-muted-foreground">Backup ridondante AWS</p>
              </div>
              <StatusBadge status={s3Status} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Azure Blob</h4>
                <p className="text-sm text-muted-foreground">Backup enterprise Microsoft</p>
              </div>
              <StatusBadge status={azureStatus} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Forms */}
      <Tabs defaultValue="s3" className="space-y-4">
        <TabsList>
          <TabsTrigger value="s3">Amazon S3</TabsTrigger>
          <TabsTrigger value="azure">Azure Blob</TabsTrigger>
          <TabsTrigger value="gcs">Google Cloud</TabsTrigger>
        </TabsList>

        {/* S3 Configuration */}
        <TabsContent value="s3" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Amazon S3 Configuration
              </CardTitle>
              <CardDescription>
                Configura le credenziali AWS per abilitare il backup su Amazon S3
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="aws-access-key">Access Key ID</Label>
                  <Input
                    id="aws-access-key"
                    type="text"
                    placeholder="AKIA..."
                    value={s3Config.AWS_ACCESS_KEY_ID}
                    onChange={(e) => setS3Config(prev => ({ ...prev, AWS_ACCESS_KEY_ID: e.target.value }))}
                    data-testid="input-aws-access-key"
                  />
                </div>
                <div>
                  <Label htmlFor="aws-secret-key">Secret Access Key</Label>
                  <Input
                    id="aws-secret-key"
                    type="password"
                    placeholder="*********************"
                    value={s3Config.AWS_SECRET_ACCESS_KEY}
                    onChange={(e) => setS3Config(prev => ({ ...prev, AWS_SECRET_ACCESS_KEY: e.target.value }))}
                    data-testid="input-aws-secret-key"
                  />
                </div>
                <div>
                  <Label htmlFor="aws-bucket">S3 Bucket Name</Label>
                  <Input
                    id="aws-bucket"
                    type="text"
                    placeholder="easycashflows-backup"
                    value={s3Config.AWS_S3_BUCKET_NAME}
                    onChange={(e) => setS3Config(prev => ({ ...prev, AWS_S3_BUCKET_NAME: e.target.value }))}
                    data-testid="input-aws-bucket"
                  />
                </div>
                <div>
                  <Label htmlFor="aws-region">AWS Region</Label>
                  <Input
                    id="aws-region"
                    type="text"
                    placeholder="us-east-1"
                    value={s3Config.AWS_REGION}
                    onChange={(e) => setS3Config(prev => ({ ...prev, AWS_REGION: e.target.value }))}
                    data-testid="input-aws-region"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleS3Test}
                  disabled={testingProvider === 's3' || !s3Config.AWS_ACCESS_KEY_ID || !s3Config.AWS_SECRET_ACCESS_KEY}
                  data-testid="button-test-s3"
                >
                  {testingProvider === 's3' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Test Connessione
                </Button>
                
                <Button
                  onClick={handleS3Save}
                  disabled={savingProvider === 's3' || !s3Config.AWS_ACCESS_KEY_ID || !s3Config.AWS_SECRET_ACCESS_KEY}
                  data-testid="button-save-s3"
                >
                  {savingProvider === 's3' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salva Configurazione
                </Button>
              </div>
              
              {s3Status?.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {s3Status.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Azure Configuration */}
        <TabsContent value="azure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Azure Blob Storage Configuration
              </CardTitle>
              <CardDescription>
                Configura le credenziali Azure per abilitare il backup su Azure Blob Storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="azure-account-name">Storage Account Name</Label>
                  <Input
                    id="azure-account-name"
                    type="text"
                    placeholder="mystorageaccount"
                    value={azureConfig.AZURE_STORAGE_ACCOUNT_NAME}
                    onChange={(e) => setAzureConfig(prev => ({ ...prev, AZURE_STORAGE_ACCOUNT_NAME: e.target.value }))}
                    data-testid="input-azure-account-name"
                  />
                </div>
                <div>
                  <Label htmlFor="azure-account-key">Storage Account Key</Label>
                  <Input
                    id="azure-account-key"
                    type="password"
                    placeholder="*********************"
                    value={azureConfig.AZURE_STORAGE_ACCOUNT_KEY}
                    onChange={(e) => setAzureConfig(prev => ({ ...prev, AZURE_STORAGE_ACCOUNT_KEY: e.target.value }))}
                    data-testid="input-azure-account-key"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="azure-container">Container Name</Label>
                  <Input
                    id="azure-container"
                    type="text"
                    placeholder="easycashflows-backup"
                    value={azureConfig.AZURE_CONTAINER_NAME}
                    onChange={(e) => setAzureConfig(prev => ({ ...prev, AZURE_CONTAINER_NAME: e.target.value }))}
                    data-testid="input-azure-container"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleAzureTest}
                  disabled={testingProvider === 'azure' || !azureConfig.AZURE_STORAGE_ACCOUNT_NAME || !azureConfig.AZURE_STORAGE_ACCOUNT_KEY}
                  data-testid="button-test-azure"
                >
                  {testingProvider === 'azure' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Test Connessione
                </Button>
                
                <Button
                  onClick={handleAzureSave}
                  disabled={savingProvider === 'azure' || !azureConfig.AZURE_STORAGE_ACCOUNT_NAME || !azureConfig.AZURE_STORAGE_ACCOUNT_KEY}
                  data-testid="button-save-azure"
                >
                  {savingProvider === 'azure' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salva Configurazione
                </Button>
              </div>
              
              {azureStatus?.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {azureStatus.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GCS Information */}
        <TabsContent value="gcs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Google Cloud Storage
              </CardTitle>
              <CardDescription>
                Google Cloud Storage è già configurato automaticamente nell'ambiente Replit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Configurazione automatica</strong><br />
                  Google Cloud Storage è il provider primario per questo progetto Replit. 
                  Non è necessaria alcuna configurazione aggiuntiva.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}