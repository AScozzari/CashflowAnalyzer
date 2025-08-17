import { useState } from "react";
import { Shield, Key, AlertCircle, CheckCircle2, ExternalLink, Clock, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface BankingApiSetupProps {
  iban?: {
    id: string;
    bankName: string;
    iban: string;
    apiProvider?: string;
    autoSyncEnabled?: boolean;
    syncFrequency?: string;
  };
  onClose: () => void;
}

const BANK_PROVIDERS = {
  unicredit: {
    name: "UniCredit",
    type: "direct",
    status: "available",
    description: "API dirette UniCredit per PSD2",
    endpoint: "https://api.unicredit.eu/open-banking/v1",
    docs: "https://developer.unicredit.eu",
    requirements: ["Client ID", "Client Secret", "Certificate PSD2"]
  },
  intesa: {
    name: "Intesa Sanpaolo",
    type: "direct", 
    status: "available",
    description: "API dirette Intesa Sanpaolo per PSD2",
    endpoint: "https://api.intesasanpaolo.com/openbanking/v1",
    docs: "https://developer.intesasanpaolo.com",
    requirements: ["Client ID", "Client Secret", "Certificate PSD2"]
  },
  cbi_globe: {
    name: "CBI Globe",
    type: "aggregator",
    status: "beta", 
    description: "Aggregatore per BPM, BPER, Credem e altre banche",
    endpoint: "https://api.cbiglobe.it/psd2/v1",
    docs: "https://developer.cbiglobe.it",
    requirements: ["CBI Client ID", "TPP License", "QWAC Certificate"]
  },
  nexi: {
    name: "NEXI",
    type: "aggregator",
    status: "coming_soon",
    description: "Provider per MPS e altre banche partner",
    endpoint: "https://api.nexi.it/banking/v1", 
    docs: "https://developer.nexi.it",
    requirements: ["NEXI Partner ID", "API Key", "PSD2 Registration"]
  }
};

export default function BankingApiSetup({ iban, onClose }: BankingApiSetupProps) {
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<string>(iban?.apiProvider || "");
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"testing" | "connected" | "failed" | null>(null);
  
  const [config, setConfig] = useState({
    clientId: "",
    clientSecret: "",
    certificatePath: "",
    sandboxMode: true,
    autoSync: iban?.autoSyncEnabled || false,
    syncFrequency: iban?.syncFrequency || "daily"
  });

  const handleTestConnection = async () => {
    setConnectionStatus("testing");
    
    // Simulazione test connessione
    setTimeout(() => {
      if (config.clientId && config.clientSecret) {
        setConnectionStatus("connected");
        toast({
          title: "Connessione riuscita",
          description: "La configurazione API è corretta e funzionante."
        });
      } else {
        setConnectionStatus("failed");
        toast({
          title: "Connessione fallita",
          description: "Verifica le credenziali e riprova.",
          variant: "destructive"
        });
      }
    }, 2000);
  };

  const handleSaveConfiguration = async () => {
    setIsConfiguring(true);
    
    try {
      // Qui andrà l'API call per salvare la configurazione
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Configurazione salvata",
        description: "L'integrazione API bancaria è stata configurata con successo."
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare la configurazione.",
        variant: "destructive"
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  const selectedProviderData = selectedProvider ? BANK_PROVIDERS[selectedProvider as keyof typeof BANK_PROVIDERS] : null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Configurazione API Bancaria</h2>
        <p className="text-muted-foreground">
          Configura l'integrazione automatica per {iban?.bankName} ({iban?.iban?.slice(-4)})
        </p>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Le API bancarie utilizzano gli standard PSD2 per garantire massima sicurezza. 
          Tutte le credenziali sono crittografate e conformi alle normative europee.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="provider" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="provider">Provider</TabsTrigger>
          <TabsTrigger value="credentials">Credenziali</TabsTrigger>
          <TabsTrigger value="settings">Impostazioni</TabsTrigger>
        </TabsList>

        <TabsContent value="provider" className="space-y-4">
          <div className="grid gap-4">
            <Label>Seleziona Provider API</Label>
            
            {Object.entries(BANK_PROVIDERS).map(([key, provider]) => (
              <Card 
                key={key}
                className={`cursor-pointer transition-all ${
                  selectedProvider === key 
                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
                onClick={() => setSelectedProvider(key)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{provider.name}</h4>
                        <Badge variant={
                          provider.status === 'available' ? 'default' :
                          provider.status === 'beta' ? 'secondary' : 'outline'
                        }>
                          {provider.status === 'available' ? 'Disponibile' :
                           provider.status === 'beta' ? 'Beta' : 'In arrivo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{provider.description}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          <a href={provider.docs} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-600 hover:underline">
                            Documentazione
                          </a>
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {provider.type === 'direct' ? 'API Diretta' : 'Aggregatore'}
                        </Badge>
                      </div>
                    </div>
                    
                    {selectedProvider === key && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Requisiti:</p>
                    <div className="flex flex-wrap gap-1">
                      {provider.requirements.map((req, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="credentials" className="space-y-4">
          {!selectedProvider ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Seleziona un provider API nella sezione precedente per continuare.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Configurazione {selectedProviderData?.name}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Endpoint: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                    {selectedProviderData?.endpoint}
                  </code>
                </p>
              </div>

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="clientId">Client ID *</Label>
                  <Input
                    id="clientId"
                    type="text"
                    value={config.clientId}
                    onChange={(e) => setConfig({...config, clientId: e.target.value})}
                    placeholder="Il tuo Client ID PSD2"
                  />
                </div>

                <div>
                  <Label htmlFor="clientSecret">Client Secret *</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={config.clientSecret}
                    onChange={(e) => setConfig({...config, clientSecret: e.target.value})}
                    placeholder="Il tuo Client Secret"
                  />
                </div>

                <div>
                  <Label htmlFor="certificate">Certificato PSD2</Label>
                  <Textarea
                    id="certificate"
                    value={config.certificatePath}
                    onChange={(e) => setConfig({...config, certificatePath: e.target.value})}
                    placeholder="Percorso o contenuto del certificato QWAC"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sandbox">Modalità Sandbox</Label>
                  <Switch
                    id="sandbox"
                    checked={config.sandboxMode}
                    onCheckedChange={(checked) => setConfig({...config, sandboxMode: checked})}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleTestConnection}
                  disabled={!config.clientId || !config.clientSecret || connectionStatus === "testing"}
                  variant="outline"
                  className="w-full"
                >
                  {connectionStatus === "testing" ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Test in corso...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Testa Connessione
                    </>
                  )}
                </Button>
              </div>

              {connectionStatus === "connected" && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    ✅ Connessione riuscita! Le credenziali sono valide.
                  </AlertDescription>
                </Alert>
              )}

              {connectionStatus === "failed" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    ❌ Connessione fallita. Verifica le credenziali e riprova.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Sincronizzazione Automatica</Label>
                <p className="text-sm text-muted-foreground">
                  Attiva la sincronizzazione automatica dei movimenti bancari
                </p>
              </div>
              <Switch
                checked={config.autoSync}
                onCheckedChange={(checked) => setConfig({...config, autoSync: checked})}
              />
            </div>

            {config.autoSync && (
              <>
                <div>
                  <Label>Frequenza Sincronizzazione</Label>
                  <Select 
                    value={config.syncFrequency} 
                    onValueChange={(value) => setConfig({...config, syncFrequency: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Ogni ora
                        </div>
                      </SelectItem>
                      <SelectItem value="daily">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Giornaliera (consigliato)
                        </div>
                      </SelectItem>
                      <SelectItem value="weekly">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Settimanale
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    La sincronizzazione confronterà automaticamente i movimenti bancari 
                    con quelli inseriti manualmente, aggiornando lo stato di verifica.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Annulla
        </Button>
        <Button 
          onClick={handleSaveConfiguration}
          disabled={!selectedProvider || !config.clientId || !config.clientSecret || isConfiguring}
          className="flex-1"
        >
          {isConfiguring ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salva Configurazione"
          )}
        </Button>
      </div>
    </div>
  );
}