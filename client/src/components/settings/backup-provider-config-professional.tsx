import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Cloud, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Settings, 
  AlertTriangle,
  Save,
  TestTube,
  Shield,
  Database,
  Zap
} from 'lucide-react';

interface ProviderStatus {
  provider: string;
  available: boolean;
  configured: boolean;
  error?: string;
  lastTest?: string;
}

interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'configured' | 'not_configured';
  isPrimary?: boolean;
  features: string[];
}

export function BackupProviderConfigProfessional() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Form states
  const [gcsConfig, setGcsConfig] = useState({
    GOOGLE_CLOUD_PROJECT_ID: '',
    GOOGLE_CLOUD_BUCKET_NAME: 'easycashflows-backup-gcs',
    GOOGLE_CLOUD_REGION: 'europe-west1'
  });

  const [s3Config, setS3Config] = useState({
    AWS_ACCESS_KEY_ID: '',
    AWS_SECRET_ACCESS_KEY: '',
    AWS_S3_BUCKET_NAME: 'easycashflows-backup-s3',
    AWS_REGION: 'eu-west-1'
  });

  const [azureConfig, setAzureConfig] = useState({
    AZURE_STORAGE_ACCOUNT_NAME: '',
    AZURE_STORAGE_ACCOUNT_KEY: '',
    AZURE_CONTAINER_NAME: 'easycashflows-backup-azure'
  });

  const providersInfo: ProviderInfo[] = [
    {
      id: 'gcs',
      name: 'Google Cloud Storage',
      description: 'Provider primario Replit - Storage scalabile e sicuro di Google',
      icon: <Database className="h-8 w-8 text-blue-600" />,
      status: 'active',
      isPrimary: true,
      features: ['Integrazione nativa Replit', 'Backup automatici', 'Crittografia AES-256', 'Latenza globale bassa']
    },
    {
      id: 's3',
      name: 'Amazon S3',
      description: 'Backup ridondante AWS - Il servizio di storage più affidabile al mondo',
      icon: <Shield className="h-8 w-8 text-orange-600" />,
      status: providers.find(p => p.provider === 's3')?.configured ? 'configured' : 'not_configured',
      features: ['99.999999999% durabilità', 'Versioning avanzato', 'Cross-region replication', 'Intelligent tiering']
    },
    {
      id: 'azure',
      name: 'Azure Blob Storage',
      description: 'Backup enterprise Microsoft - Soluzione enterprise con SLA premium',
      icon: <Zap className="h-8 w-8 text-purple-600" />,
      status: providers.find(p => p.provider === 'azure')?.configured ? 'configured' : 'not_configured',
      features: ['Backup ridondante globale', 'Compliance enterprise', 'Hot/Cool/Archive tiers', 'Azure AD integration']
    }
  ];

  // Load provider status
  const loadProviderStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/backup/providers/status');
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Error loading provider status:', error);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        toast({
          title: "Test riuscito!",
          description: `Connessione a ${providerKey.toUpperCase()} stabilita correttamente`,
        });
        await loadProviderStatus();
      } else {
        const error = await response.json();
        toast({
          title: "Test fallito",
          description: error.error || `Impossibile connettersi a ${providerKey.toUpperCase()}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Errore di connessione",
        description: "Verifica la connessione di rete e riprova",
        variant: "destructive"
      });
    } finally {
      setTestingProvider(null);
    }
  };

  // Save provider configuration
  const saveProvider = async (providerKey: string, config: any) => {
    try {
      setSavingProvider(providerKey);
      const response = await fetch(`/api/backup/providers/${providerKey}/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        toast({
          title: "Configurazione salvata!",
          description: `Provider ${providerKey.toUpperCase()} configurato correttamente`,
        });
        await loadProviderStatus();
        setSelectedProvider(null);
      } else {
        const error = await response.json();
        toast({
          title: "Errore salvataggio",
          description: error.error || "Impossibile salvare la configurazione",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Errore di connessione",
        description: "Verifica la connessione di rete e riprova",
        variant: "destructive"
      });
    } finally {
      setSavingProvider(null);
    }
  };

  useEffect(() => {
    loadProviderStatus();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Attivo</Badge>;
      case 'configured':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Configurato</Badge>;
      default:
        return <Badge variant="secondary">Non configurato</Badge>;
    }
  };

  const renderProviderConfig = (provider: ProviderInfo) => {
    if (provider.id === 'gcs') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gcs-project-id">Project ID</Label>
              <Input
                id="gcs-project-id"
                type="text"
                placeholder="my-project-id"
                value={gcsConfig.GOOGLE_CLOUD_PROJECT_ID}
                onChange={(e) => setGcsConfig(prev => ({ ...prev, GOOGLE_CLOUD_PROJECT_ID: e.target.value }))}
                data-testid="input-gcs-project-id"
              />
            </div>
            <div>
              <Label htmlFor="gcs-bucket">Bucket Name</Label>
              <Input
                id="gcs-bucket"
                type="text"
                placeholder="easycashflows-backup-gcs"
                value={gcsConfig.GOOGLE_CLOUD_BUCKET_NAME}
                onChange={(e) => setGcsConfig(prev => ({ ...prev, GOOGLE_CLOUD_BUCKET_NAME: e.target.value }))}
                data-testid="input-gcs-bucket"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="gcs-region">Region</Label>
              <Input
                id="gcs-region"
                type="text"
                placeholder="europe-west1"
                value={gcsConfig.GOOGLE_CLOUD_REGION}
                onChange={(e) => setGcsConfig(prev => ({ ...prev, GOOGLE_CLOUD_REGION: e.target.value }))}
                data-testid="input-gcs-region"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => testProvider('gcs', gcsConfig)}
              disabled={testingProvider === 'gcs'}
              data-testid="button-test-gcs"
            >
              {testingProvider === 'gcs' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TestTube className="h-4 w-4 mr-2" />}
              Test Connessione
            </Button>
            <Button
              onClick={() => saveProvider('gcs', gcsConfig)}
              disabled={savingProvider === 'gcs'}
              data-testid="button-save-gcs"
            >
              {savingProvider === 'gcs' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salva Configurazione
            </Button>
          </div>
        </div>
      );
    }

    if (provider.id === 's3') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="s3-access-key">Access Key ID</Label>
              <Input
                id="s3-access-key"
                type="text"
                placeholder="AKIAIOSFODNN7EXAMPLE"
                value={s3Config.AWS_ACCESS_KEY_ID}
                onChange={(e) => setS3Config(prev => ({ ...prev, AWS_ACCESS_KEY_ID: e.target.value }))}
                data-testid="input-s3-access-key"
              />
            </div>
            <div>
              <Label htmlFor="s3-secret-key">Secret Access Key</Label>
              <Input
                id="s3-secret-key"
                type="password"
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                value={s3Config.AWS_SECRET_ACCESS_KEY}
                onChange={(e) => setS3Config(prev => ({ ...prev, AWS_SECRET_ACCESS_KEY: e.target.value }))}
                data-testid="input-s3-secret-key"
              />
            </div>
            <div>
              <Label htmlFor="s3-bucket">Bucket Name</Label>
              <Input
                id="s3-bucket"
                type="text"
                placeholder="easycashflows-backup-s3"
                value={s3Config.AWS_S3_BUCKET_NAME}
                onChange={(e) => setS3Config(prev => ({ ...prev, AWS_S3_BUCKET_NAME: e.target.value }))}
                data-testid="input-s3-bucket"
              />
            </div>
            <div>
              <Label htmlFor="s3-region">Region</Label>
              <Input
                id="s3-region"
                type="text"
                placeholder="eu-west-1"
                value={s3Config.AWS_REGION}
                onChange={(e) => setS3Config(prev => ({ ...prev, AWS_REGION: e.target.value }))}
                data-testid="input-s3-region"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => testProvider('s3', s3Config)}
              disabled={testingProvider === 's3' || !s3Config.AWS_ACCESS_KEY_ID || !s3Config.AWS_SECRET_ACCESS_KEY}
              data-testid="button-test-s3"
            >
              {testingProvider === 's3' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TestTube className="h-4 w-4 mr-2" />}
              Test Connessione
            </Button>
            <Button
              onClick={() => saveProvider('s3', s3Config)}
              disabled={savingProvider === 's3' || !s3Config.AWS_ACCESS_KEY_ID || !s3Config.AWS_SECRET_ACCESS_KEY}
              data-testid="button-save-s3"
            >
              {savingProvider === 's3' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salva Configurazione
            </Button>
          </div>
        </div>
      );
    }

    if (provider.id === 'azure') {
      return (
        <div className="space-y-4">
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
                placeholder="easycashflows-backup-azure"
                value={azureConfig.AZURE_CONTAINER_NAME}
                onChange={(e) => setAzureConfig(prev => ({ ...prev, AZURE_CONTAINER_NAME: e.target.value }))}
                data-testid="input-azure-container"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => testProvider('azure', azureConfig)}
              disabled={testingProvider === 'azure' || !azureConfig.AZURE_STORAGE_ACCOUNT_NAME || !azureConfig.AZURE_STORAGE_ACCOUNT_KEY}
              data-testid="button-test-azure"
            >
              {testingProvider === 'azure' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TestTube className="h-4 w-4 mr-2" />}
              Test Connessione
            </Button>
            <Button
              onClick={() => saveProvider('azure', azureConfig)}
              disabled={savingProvider === 'azure' || !azureConfig.AZURE_STORAGE_ACCOUNT_NAME || !azureConfig.AZURE_STORAGE_ACCOUNT_KEY}
              data-testid="button-save-azure"
            >
              {savingProvider === 'azure' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salva Configurazione
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Caricamento provider...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Configurazione Provider Backup</h3>
          <p className="text-sm text-muted-foreground">
            Configura i provider cloud per il backup multi-cloud. Inserisci le credenziali di accesso per abilitare i backup ridondanti.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providersInfo.map((provider) => (
          <Card 
            key={provider.id} 
            className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              provider.status === 'active' ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20' :
              provider.status === 'configured' ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20' :
              'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
            }`}
            data-testid={`card-provider-${provider.id}`}
          >
            {provider.isPrimary && (
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-green-600 text-white hover:bg-green-600">PRIMARIO</Badge>
              </div>
            )}
            
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {provider.icon}
                  <div>
                    <CardTitle className="text-base font-semibold">{provider.name}</CardTitle>
                    <CardDescription className="text-sm mt-1">{provider.description}</CardDescription>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                {getStatusBadge(provider.status)}
                {provider.status === 'active' && <CheckCircle className="h-5 w-5 text-green-600" />}
                {provider.status === 'configured' && <CheckCircle className="h-5 w-5 text-blue-600" />}
                {provider.status === 'not_configured' && <XCircle className="h-5 w-5 text-gray-400" />}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Caratteristiche:</h4>
                  <ul className="space-y-1">
                    {provider.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full" 
                      variant={provider.status === 'not_configured' ? 'default' : 'outline'}
                      data-testid={`button-configure-${provider.id}`}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {provider.status === 'not_configured' ? 'Configura' : 'Modifica Configurazione'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {provider.icon}
                        Configurazione {provider.name}
                      </DialogTitle>
                      <DialogDescription>
                        {provider.description}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      {renderProviderConfig(provider)}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {providers.some(p => p.error) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Alcuni provider hanno errori di configurazione. Controlla le credenziali e riprova la connessione.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}