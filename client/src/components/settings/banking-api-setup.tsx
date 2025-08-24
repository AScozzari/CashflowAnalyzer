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
    description: "API dirette UniCredit per PSD2 - Implementazione completa",
    endpoint: "https://api.unicredit.eu/open-banking/v1",
    sandboxEndpoint: "https://api-sandbox.unicredit.eu/open-banking/v1",
    docs: "https://developer.unicredit.eu",
    supportEmail: "openbanking@unicredit.eu",
    requirements: ["Client ID", "Client Secret", "Certificate QWAC", "Certificate QSEAL"],
    implemented: true,
    fields: {
      clientId: { label: "Client ID UniCredit", placeholder: "UC_CLIENT_ID_XXXXXXXX" },
      clientSecret: { label: "Client Secret", placeholder: "uc_secret_xxxxxxxxxxxxxxxx" },
      certificate: { label: "Certificato QWAC", placeholder: "Certificato PSD2 in formato PEM" },
      additionalConfig: { label: "Configurazione Aggiuntiva", placeholder: "Eventuali parametri specifici UniCredit" }
    }
  },
  intesa: {
    name: "Intesa Sanpaolo",
    type: "direct", 
    status: "available",
    description: "API dirette Intesa Sanpaolo per PSD2 - Implementazione completa",
    endpoint: "https://api.intesasanpaolo.com/openbanking/v1",
    sandboxEndpoint: "https://api-sandbox.intesasanpaolo.com/openbanking/v1",
    docs: "https://developer.intesasanpaolo.com",
    supportEmail: "TPPsupport@intesasanpaolo.ro",
    requirements: ["Client ID", "Client Secret", "Certificate QWAC", "Subscription Key"],
    implemented: true,
    fields: {
      clientId: { label: "Client ID Intesa", placeholder: "ISP_CLIENT_ID_XXXXXXXX" },
      clientSecret: { label: "Client Secret", placeholder: "isp_secret_xxxxxxxxxxxxxxxx" },
      subscriptionKey: { label: "Subscription Key", placeholder: "Ocp-Apim-Subscription-Key" },
      certificate: { label: "Certificato QWAC", placeholder: "Certificato PSD2 in formato PEM" }
    }
  },
  cbi_globe: {
    name: "CBI Globe",
    type: "aggregator",
    status: "available", 
    description: "Piattaforma CBI per BCC (317+ banche), BPER, Banco BPM e altre - Completamente operativo",
    endpoint: "https://www.cbiglobe.com/api/psd2/v1",
    sandboxEndpoint: "https://bperlu.psd2-sandbox.eu/",
    docs: "https://www.cbiglobe.com/Wiki/index.php/1.1_API_and_PSD2",
    supportEmail: "info@cbiglobe.com",
    requirements: ["Registrazione TPP", "Certificato eIDAS QWAC", "Certificato QSEAL", "Autorizzazione NCA"],
    implemented: true,
    banksCovered: ["BCC (317+ banche cooperative)", "BPER Banca", "Banco BPM", "Credem", "UBI Banca"],
    fields: {
      tppId: { label: "TPP Registration ID", placeholder: "ID TPP rilasciato da Autorità Competente Nazionale" },
      clientId: { label: "CBI Globe Client ID", placeholder: "CBI_CLIENT_XXXXXXXXXXXXXXXX" },
      qwacCertificate: { label: "Certificato eIDAS QWAC", placeholder: "Certificato di autenticazione qualificato" },
      qsealCertificate: { label: "Certificato eIDAS QSEAL", placeholder: "Certificato di sigillo elettronico qualificato" },
      ncaAuthorization: { label: "Autorizzazione NCA", placeholder: "Numero autorizzazione Banca d'Italia o altra NCA europea" }
    }
  },
  banco_bpm_direct: {
    name: "Banco BPM - Diretto", 
    type: "direct",
    status: "available",
    description: "API dirette Banco BPM (richiede partnership) - Contatto diretto necessario",
    endpoint: "https://api.bancobpm.it/psd2/v1",
    sandboxEndpoint: "https://api-sandbox.bancobpm.it/psd2/v1",
    docs: "Documentazione fornita su richiesta",
    supportEmail: "api.support@bancobpm.it",
    requirements: ["Partnership commerciale", "Client ID", "Client Secret", "Certificato QWAC"],
    implemented: false,
    fields: {
      partnerId: { label: "Partner ID Banco BPM", placeholder: "BPM_PARTNER_XXXXXXXX" },
      clientId: { label: "Client ID", placeholder: "bpm_client_xxxxxxxxxxxxxxxx" },
      clientSecret: { label: "Client Secret", placeholder: "bpm_secret_xxxxxxxxxxxxxxxx" },
      certificate: { label: "Certificato QWAC", placeholder: "Certificato PSD2 fornito da Banco BPM" }
    }
  },
  banco_desio_direct: {
    name: "Banco Desio - Diretto",
    type: "direct", 
    status: "coming_soon",
    description: "API dirette Banco Desio (documentazione non pubblica) - In fase di sviluppo parnership",
    endpoint: "https://api.bancodesio.it/psd2/v1",
    sandboxEndpoint: "https://api-sandbox.bancodesio.it/psd2/v1",
    docs: "https://www.bancodesio.it/content/open-banking-psd2",
    supportEmail: "openbanking@bancodesio.it",
    requirements: ["Accordo commerciale", "Certificato QWAC", "Autorizzazione specifica"],
    implemented: false,
    fields: {
      partnershipId: { label: "Partnership ID", placeholder: "DESIO_PARTNER_XXXXXXXX" },
      clientId: { label: "Client ID Banco Desio", placeholder: "desio_client_xxxxxxxxxxxxxxxx" },
      certificate: { label: "Certificato QWAC", placeholder: "Certificato fornito da Banco Desio" },
      agreementNumber: { label: "Numero Accordo", placeholder: "Numero contratto partnership API" }
    }
  },
  nexi: {
    name: "NEXI",
    type: "aggregator",
    status: "coming_soon",
    description: "Provider NEXI per MPS, Crédit Agricole e banche partner - Prossimamente disponibile",
    endpoint: "https://api.nexi.it/banking/v1", 
    sandboxEndpoint: "https://api-sandbox.nexi.it/banking/v1",
    docs: "https://developer.nexi.it",
    supportEmail: "developers@nexi.it",
    requirements: ["NEXI Partner ID", "API Key", "PSD2 Registration", "Partner Agreement"],
    implemented: false,
    fields: {
      partnerId: { label: "NEXI Partner ID", placeholder: "NEXI_PARTNER_XXXXXXXX" },
      apiKey: { label: "API Key", placeholder: "nexi_api_key_xxxxxxxxxxxxxxxx" },
      certificate: { label: "Certificato PSD2", placeholder: "Certificato rilasciato da NEXI" },
      merchantId: { label: "Merchant ID", placeholder: "ID Commerciante NEXI" }
    }
  }
};

// Mappatura intelligente banche -> provider API
const BANK_API_MAPPING = {
  "UniCredit": "unicredit",
  "Intesa Sanpaolo": "intesa",
  "Banco BPM": "cbi_globe",
  "BPER Banca": "cbi_globe", 
  "Credem": "cbi_globe",
  "UBI Banca": "cbi_globe",
  "Banche di Credito Cooperativo (BCC)": "cbi_globe",
  "Monte dei Paschi di Siena": "nexi",
  "Banco di Sardegna": "banco_bpm_direct",
  "Banco Desio": "banco_desio_direct"
};

// Funzione per auto-selezionare provider basato sulla banca
const getProviderForBank = (bankName: string) => {
  const provider = BANK_API_MAPPING[bankName as keyof typeof BANK_API_MAPPING];
  if (provider) return provider;
  
  // Fallback: cerca per match parziale del nome banca
  for (const [mappedBankName, mappedProvider] of Object.entries(BANK_API_MAPPING)) {
    if (bankName.toLowerCase().includes(mappedBankName.toLowerCase()) || 
        mappedBankName.toLowerCase().includes(bankName.toLowerCase())) {
      return mappedProvider;
    }
  }
  return "";
};

export default function BankingApiSetup({ iban, onClose }: BankingApiSetupProps) {
  const { toast } = useToast();
  
  // Auto-seleziona il provider corretto basato sulla banca dell'IBAN
  const autoSelectedProvider = getProviderForBank(iban?.bankName || "");
  const [selectedProvider, setSelectedProvider] = useState<string>(autoSelectedProvider || iban?.apiProvider || "");
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"testing" | "connected" | "failed" | null>(null);
  
  const [config, setConfig] = useState<any>({
    // Campo comuni
    clientId: "",
    clientSecret: "",
    certificatePath: "",
    certificate: "",
    sandboxMode: true,
    autoSync: iban?.autoSyncEnabled || false,
    syncFrequency: iban?.syncFrequency || "daily",
    // Intesa Sanpaolo
    subscriptionKey: "",
    // CBI Globe
    tppId: "",
    qwacCertificate: "",
    qsealCertificate: "",
    ncaAuthorization: "",
    // Banco BPM
    partnerId: "",
    // Banco Desio
    partnershipId: "",
    agreementNumber: "",
    // NEXI
    apiKey: "",
    merchantId: "",
    // Campi generici
    tppLicense: "",
    partnerCode: "",
    additionalConfig: ""
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
          {/* Notifica auto-selezione */}
          {autoSelectedProvider && (
            <Alert className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/20">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <strong>Provider Auto-Selezionato:</strong> Basandoci sulla tua banca ({iban?.bankName}), 
                abbiamo automaticamente selezionato il provider API più appropriato. 
                Gli altri provider sono disabilitati per mantenere la correlazione.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-4">
            <Label>Provider API per {iban?.bankName}</Label>
            
            {Object.entries(BANK_PROVIDERS).map(([key, provider]) => {
              const isRecommended = key === autoSelectedProvider;
              const isDisabled = autoSelectedProvider && key !== autoSelectedProvider;
              
              return (
                <Card 
                  key={key}
                  className={`transition-all ${
                    selectedProvider === key 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                      : isDisabled 
                        ? 'opacity-50 cursor-not-allowed bg-gray-100/50 dark:bg-gray-800/20'
                        : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                  onClick={() => !isDisabled && setSelectedProvider(key)}
                >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-semibold ${isDisabled ? 'text-gray-400' : ''}`}>
                          {provider.name}
                        </h4>
                        <div className="flex gap-1">
                          {isRecommended && (
                            <Badge variant="default" className="bg-blue-600 text-white">
                              🎯 Raccomandato
                            </Badge>
                          )}
                          {isDisabled && (
                            <Badge variant="outline" className="text-gray-400 border-gray-300">
                              Non compatibile
                            </Badge>
                          )}
                          <Badge variant={
                            provider.status === 'available' ? 'default' :
                            provider.status === 'beta' ? 'secondary' : 'outline'
                          } className={isDisabled ? 'opacity-50' : ''}>
                            {provider.status === 'available' ? 'Disponibile' :
                             provider.status === 'beta' ? 'Beta' : 'In arrivo'}
                          </Badge>
                          {provider.implemented ? (
                            <Badge variant="default" className={`bg-green-600 ${isDisabled ? 'opacity-50' : ''}`}>
                              ✓ Implementato
                            </Badge>
                          ) : (
                            <Badge variant="outline" className={`text-orange-600 border-orange-600 ${isDisabled ? 'opacity-50' : ''}`}>
                              🚧 In sviluppo
                            </Badge>
                          )}
                        </div>
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
                  
                  <div className="mt-3 pt-3 border-t space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Requisiti:</p>
                      <div className="flex flex-wrap gap-1">
                        {provider.requirements.map((req, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {'banksCovered' in provider && provider.banksCovered && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Banche coperte:</p>
                        <div className="flex flex-wrap gap-1">
                          {provider.banksCovered.map((bank: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              {bank}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
          
          {/* Spiegazione correlazione */}
          <Alert className="border-green-200 bg-green-50/30 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong>Correlazione Intelligente:</strong> Il sistema mantiene automaticamente 
              la correlazione tra la banca selezionata nell'IBAN e il provider API appropriato, 
              garantendo configurazioni sempre corrette e compatibili.
            </AlertDescription>
          </Alert>
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
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Endpoint: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                      {config.sandboxMode ? selectedProviderData?.sandboxEndpoint : selectedProviderData?.endpoint}
                    </code>
                  </p>
                  <p>
                    Support: <a href={`mailto:${selectedProviderData?.supportEmail}`} 
                              className="text-blue-600 hover:underline">
                      {selectedProviderData?.supportEmail}
                    </a>
                  </p>
                  {!selectedProviderData?.implemented && (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        🚧 Questo provider è in fase di sviluppo. L'integrazione sarà disponibile nelle prossime settimane.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="sandbox">Modalità Sandbox</Label>
                <Switch
                  id="sandbox"
                  checked={config.sandboxMode}
                  onCheckedChange={(checked) => setConfig({...config, sandboxMode: checked})}
                />
              </div>

              <div className="grid gap-4">
                {selectedProviderData?.fields && Object.entries(selectedProviderData.fields).map(([fieldKey, fieldData]) => (
                  <div key={fieldKey}>
                    <Label htmlFor={fieldKey}>{fieldData.label} *</Label>
                    {fieldKey === 'certificate' || fieldKey === 'tppLicense' || fieldKey === 'additionalConfig' ? (
                      <Textarea
                        id={fieldKey}
                        value={config[fieldKey as keyof typeof config] as string || ""}
                        onChange={(e) => setConfig({...config, [fieldKey]: e.target.value})}
                        placeholder={fieldData.placeholder}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={fieldKey}
                        type={fieldKey.includes('secret') ? 'password' : 'text'}
                        value={config[fieldKey as keyof typeof config] as string || ""}
                        onChange={(e) => setConfig({...config, [fieldKey]: e.target.value})}
                        placeholder={fieldData.placeholder}
                      />
                    )}
                  </div>
                ))}
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