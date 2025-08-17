import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Cloud, Check, X, Settings, Eye, EyeOff, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface ProviderStatus {
  provider: string;
  available: boolean;
  error?: string;
}

interface ProviderConfig {
  [key: string]: string;
}

export function BackupProviderConfig() {
  const { toast } = useToast();
  const [showSecrets, setShowSecrets] = useState<{[key: string]: boolean}>({});
  const [configs, setConfigs] = useState<{[provider: string]: ProviderConfig}>({
    's3': {
      AWS_ACCESS_KEY_ID: '',
      AWS_SECRET_ACCESS_KEY: '',
      AWS_REGION: 'eu-west-1',
      AWS_S3_BUCKET_NAME: 'easycashflows-backup'
    },
    'azure': {
      AZURE_STORAGE_ACCOUNT_NAME: '',
      AZURE_STORAGE_ACCOUNT_KEY: '',
      AZURE_CONTAINER_NAME: 'easycashflows-backup'
    }
  });

  // Query provider status
  const { data: providersStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/backup/providers/status'],
    queryFn: () => fetch('/api/backup/providers/status').then(res => res.json())
  });

  const updateConfig = (provider: string, key: string, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [key]: value
      }
    }));
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const testProvider = async (provider: string) => {
    try {
      const response = await fetch(`/api/backup/providers/${provider}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configs[provider])
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Test riuscito",
          description: `Provider ${provider.toUpperCase()} configurato correttamente`
        });
        refetchStatus();
      } else {
        toast({
          title: "Test fallito", 
          description: result.error || "Errore nella configurazione",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Errore test",
        description: error.message || "Errore durante il test del provider",
        variant: "destructive"
      });
    }
  };

  const saveProviderConfig = async (provider: string) => {
    try {
      const response = await fetch(`/api/backup/providers/${provider}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configs[provider])
      });

      if (response.ok) {
        toast({
          title: "Configurazione salvata",
          description: `Provider ${provider.toUpperCase()} configurato con successo`
        });
        refetchStatus();
      } else {
        const error = await response.json();
        toast({
          title: "Errore salvataggio",
          description: error.message || "Errore nel salvataggio della configurazione",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore durante il salvataggio",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (provider: string) => {
    const status = providersStatus?.providers?.find((p: ProviderStatus) => 
      p.provider.toLowerCase().includes(provider)
    );
    
    if (!status) {
      return <Badge variant="secondary">Non testato</Badge>;
    }
    
    return status.available ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <Check className="h-3 w-3 mr-1" />
        Attivo
      </Badge>
    ) : (
      <Badge variant="destructive">
        <X className="h-3 w-3 mr-1" />
        Non configurato
      </Badge>
    );
  };

  const renderProviderConfig = (provider: string, title: string, description: string) => (
    <Card key={provider}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {getStatusBadge(provider)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(configs[provider] || {}).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <Label className="text-sm font-medium">{key}</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type={showSecrets[key] ? 'text' : 'password'}
                  value={value}
                  onChange={(e) => updateConfig(provider, key, e.target.value)}
                  placeholder={`Inserisci ${key}`}
                  data-testid={`input-${provider}-${key}`}
                />
                {key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={() => toggleSecretVisibility(key)}
                    data-testid={`button-toggle-${key}`}
                  >
                    {showSecrets[key] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        
        <Separator />
        
        <div className="flex gap-2">
          <Button
            onClick={() => testProvider(provider)}
            variant="outline"
            size="sm"
            data-testid={`button-test-${provider}`}
          >
            <TestTube className="h-4 w-4 mr-2" />
            Test Connessione
          </Button>
          <Button
            onClick={() => saveProviderConfig(provider)}
            size="sm"
            data-testid={`button-save-${provider}`}
          >
            <Settings className="h-4 w-4 mr-2" />
            Salva Configurazione
          </Button>
        </div>

        {providersStatus?.providers?.find((p: ProviderStatus) => 
          p.provider.toLowerCase().includes(provider) && !p.available
        )?.error && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">
              {providersStatus.providers.find((p: ProviderStatus) => 
                p.provider.toLowerCase().includes(provider)
              )?.error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-6 max-w-2xl mx-auto">
          <Cloud className="h-10 w-10 text-blue-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Configurazione Provider Backup
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Configura Amazon S3 e Azure Blob Storage per backup multi-cloud sicuri
          </p>
          <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 dark:bg-blue-800 dark:text-blue-200">
            Google Cloud Storage già attivo tramite Replit
          </Badge>
        </div>
      </div>

      {/* Provider Configurations */}
      <div className="space-y-6">
        {renderProviderConfig(
          's3',
          'Amazon S3',
          'Configurazione AWS S3 per backup ridondanti su Amazon Web Services'
        )}
        
        {renderProviderConfig(
          'azure',
          'Azure Blob Storage', 
          'Configurazione Azure Storage per backup su piattaforma Microsoft Azure'
        )}
      </div>

      {/* Provider Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Stato Provider</CardTitle>
          <CardDescription>
            Riepilogo dello stato di tutti i provider backup configurati
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-green-200 bg-green-50 dark:bg-green-900 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-sm">Google Cloud Storage</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">Attivo (Replit integrato)</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${
                  providersStatus?.providers?.find((p: ProviderStatus) => p.provider.includes('S3'))?.available 
                    ? 'bg-green-500' : 'bg-orange-500'
                }`}></div>
                <span className="font-medium text-sm">Amazon S3</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {providersStatus?.providers?.find((p: ProviderStatus) => p.provider.includes('S3'))?.available 
                  ? 'Configurato' : 'Richiede configurazione'}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${
                  providersStatus?.providers?.find((p: ProviderStatus) => p.provider.includes('Azure'))?.available 
                    ? 'bg-green-500' : 'bg-orange-500'
                }`}></div>
                <span className="font-medium text-sm">Azure Blob Storage</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {providersStatus?.providers?.find((p: ProviderStatus) => p.provider.includes('Azure'))?.available 
                  ? 'Configurato' : 'Richiede configurazione'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>Come configurare:</strong><br />
          1. Inserisci le credenziali API per S3 o Azure<br />
          2. Usa "Test Connessione" per verificare la configurazione<br />
          3. Salva la configurazione una volta testata<br />
          4. I backup automatici utilizzeranno tutti i provider attivi
        </AlertDescription>
      </Alert>
    </div>
  );
}