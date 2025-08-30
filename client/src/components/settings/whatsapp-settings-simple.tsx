import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, CheckCircle, AlertCircle, ExternalLink, DollarSign, HelpCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { WhatsAppSetupGuide } from "./whatsapp-setup-guide";

interface WhatsAppSettings {
  id?: string;
  provider: 'twilio' | 'linkmobility';
  isActive: boolean;
  businessName?: string;
  businessDescription?: string;
  phoneNumber?: string;
  accountSid?: string;
  authToken?: string;
  apiKey?: string;
  webhookUrl?: string;
  whatsappBusinessAccountId?: string;
  metaBusinessManagerId?: string;
  isBusinessVerified?: boolean;
  isPhoneVerified?: boolean;
  isApiConnected?: boolean;
  lastTestAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function WhatsAppSettingsSimple() {
  const [formData, setFormData] = useState<WhatsAppSettings>({
    provider: 'twilio',
    isActive: false,
    businessName: '',
    businessDescription: '',
    phoneNumber: '',
    accountSid: '',
    authToken: '',
    apiKey: '',
    webhookUrl: '',
    whatsappBusinessAccountId: '',
    metaBusinessManagerId: ''
  });
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/whatsapp/settings'],
    queryFn: async () => {
      const response = await fetch('/api/whatsapp/settings');
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch WhatsApp settings');
      }
      return response.json();
    }
  });

  // Update form when settings load - 🔥 FIX: Gestisci array vuoto dall'API
  useEffect(() => {
    if (settings && Array.isArray(settings) && settings.length > 0) {
      // Se settings è un array con elementi, prendi il primo
      setFormData(settings[0]);
    } else if (settings && !Array.isArray(settings)) {
      // Se settings è un oggetto diretto
      setFormData(settings);
    }
    // Se settings è null, undefined o array vuoto, mantieni formData di default
  }, [settings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: WhatsAppSettings) => {
      const response = await fetch('/api/whatsapp/settings', {
        method: settings ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to save settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/settings'] });
      toast({ title: "Impostazioni WhatsApp salvate con successo" });
    },
    onError: () => {
      toast({ 
        title: "Errore nel salvataggio", 
        description: "Impossibile salvare le impostazioni WhatsApp",
        variant: "destructive"
      });
    }
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/whatsapp/test-connection', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Test failed');
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: "Test connessione", description: result.message });
        queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/settings'] });
      } else {
        toast({ 
          title: "Test fallito", 
          description: result.message,
          variant: "destructive"
        });
      }
    }
  });

  // Test template sending mutation
  const testTemplateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.phoneNumber || '+393297626144',
          type: 'template',
          content: {
            templateName: 'testwap',
            templateLanguage: 'it',
            templateVariables: {}
          },
          metadata: {
            priority: 'high',
            trackingId: 'test-from-frontend'
          }
        })
      });
      if (!response.ok) throw new Error('Template test failed');
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({ 
          title: "Template inviato!", 
          description: `Message ID: ${result.messageId}`,
          duration: 5000
        });
      } else {
        toast({ 
          title: "Invio fallito", 
          description: result.error,
          variant: "destructive"
        });
      }
    }
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(formData);
  };

  const handleTestConnection = () => {
    testConnectionMutation.mutate();
  };

  const handleTestTemplate = () => {
    testTemplateMutation.mutate();
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Caricamento...</div>;
  }

  const providerConfig = {
    twilio: {
      name: "Twilio WhatsApp Business API",
      description: "Provider Enterprise con supporto template e webhook avanzati",
      pricing: "€0.0055/messaggio + setup €50/mese",
      features: ["Template pre-approvati Meta", "Webhook real-time", "Analytics avanzate", "Support 24/7"],
      docs: "https://www.twilio.com/docs/whatsapp"
    },
    linkmobility: {
      name: "LinkMobility WhatsApp Business",
      description: "Provider Europeo con conformità GDPR e prezzi competitivi",
      pricing: "€0.004/messaggio + setup €30/mese",
      features: ["GDPR Compliant", "Template veloce approval", "API REST semplice", "EU Data Centers"],
      docs: "https://docs.linkmobility.com/whatsapp"
    }
  };

  // 🔥 FIX: Assicura che currentProvider sia sempre definito
  const currentProvider = providerConfig[formData.provider] || providerConfig.twilio;

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Configurazione WhatsApp Business API
          </CardTitle>
          <CardDescription>
            Scegli e configura il tuo provider WhatsApp Business per notifiche automatiche
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selector */}
          <div className="space-y-3">
            <Label>Provider WhatsApp Business</Label>
            <Select 
              value={formData.provider} 
              onValueChange={(value: 'twilio' | 'linkmobility') => 
                setFormData(prev => ({ ...prev, provider: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twilio">
                  <div className="flex items-center justify-between w-full">
                    <span>Twilio WhatsApp Business API</span>
                    <Badge variant="secondary" className="ml-2">Enterprise</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="linkmobility">
                  <div className="flex items-center justify-between w-full">
                    <span>LinkMobility WhatsApp Business</span>
                    <Badge variant="outline" className="ml-2">EU GDPR</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Provider Info */}
          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <div className="font-semibold">{currentProvider.name}</div>
                <div className="text-sm text-muted-foreground">{currentProvider.description}</div>
                <div className="text-sm font-medium text-green-600">{currentProvider.pricing}</div>
                <div className="flex flex-wrap gap-1">
                  {currentProvider.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
                
                {/* Business Manager Setup Guide */}
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">
                    📋 Setup Business Manager {formData.provider === 'twilio' ? 'Meta/Twilio' : 'Meta/LinkMobility'}
                  </div>
                  {formData.provider === 'twilio' ? (
                    <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                      <div>1. Crea <strong>Meta Business Manager</strong> su business.facebook.com</div>
                      <div>2. Aggiungi <strong>WhatsApp Business Account</strong> nel Business Manager</div>
                      <div>3. Verifica il tuo <strong>numero business</strong> con documenti aziendali</div>
                      <div>4. Registra account <strong>Twilio</strong> e ottieni Account SID + Auth Token</div>
                      <div>5. Collega <strong>Meta WhatsApp</strong> con Twilio tramite Programmable Messaging</div>
                      <div>6. Crea e approva <strong>Message Templates</strong> via Meta Business Manager</div>
                    </div>
                  ) : (
                    <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                      <div>1. Crea <strong>Meta Business Manager</strong> su business.facebook.com</div>
                      <div>2. Aggiungi <strong>WhatsApp Business Account</strong> nel Business Manager</div>
                      <div>3. Verifica il tuo <strong>numero business</strong> con documenti aziendali</div>
                      <div>4. Contatta <strong>LinkMobility</strong> (+47 22 99 44 00) per account BSP</div>
                      <div>5. Fornisci <strong>Meta Business Manager ID</strong> a LinkMobility</div>
                      <div>6. LinkMobility configura hosting e fornisce <strong>API Key</strong></div>
                      <div>7. Crea e approva <strong>Message Templates</strong> via Meta Business Manager</div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <a 
                    href={currentProvider.docs} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    Documentazione API <ExternalLink className="h-3 w-3" />
                  </a>
                  <a 
                    href="https://business.facebook.com/"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    Meta Business Manager <ExternalLink className="h-3 w-3" />
                  </a>
                  {formData.provider === 'linkmobility' && (
                    <a 
                      href="https://www.linkmobility.com/contact"
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      LinkMobility Contact <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <Separator />

          {/* Configuration Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessName">Nome Business</Label>
                <Input
                  id="businessName"
                  placeholder="Nome della tua azienda"
                  value={formData.businessName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Numero WhatsApp Business</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+39xxxxxxxxxx"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>
            </div>

            {/* Provider Credentials */}
            <div className="space-y-4">
              {formData.provider === 'twilio' ? (
                <>
                  <div>
                    <Label htmlFor="accountSid">Account SID</Label>
                    <Input
                      id="accountSid"
                      type="password"
                      placeholder="Twilio Account SID"
                      value={formData.accountSid || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, accountSid: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="authToken">Auth Token</Label>
                    <Input
                      id="authToken"
                      type="password"
                      placeholder="Twilio Auth Token"
                      value={formData.authToken || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, authToken: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsappBusinessAccountId">WhatsApp Business Account ID</Label>
                    <Input
                      id="whatsappBusinessAccountId"
                      placeholder="771402795269176"
                      value={formData.whatsappBusinessAccountId || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsappBusinessAccountId: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="metaBusinessManagerId">Meta Business Manager ID</Label>
                    <Input
                      id="metaBusinessManagerId"
                      placeholder="725525006356669"
                      value={formData.metaBusinessManagerId || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, metaBusinessManagerId: e.target.value }))}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="LinkMobility API Key"
                    value={formData.apiKey || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Status Section */}
          <div className="space-y-4">
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Attiva WhatsApp Business</Label>
                <div className="text-sm text-muted-foreground">
                  Abilita l'invio di notifiche via WhatsApp
                </div>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>

            {/* Status Indicators */}
            {formData.isActive && (
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  {formData.isApiConnected ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">API Connection</span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.isPhoneVerified ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm">Phone Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.isBusinessVerified ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm">Business Verified</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSetupGuide(!showSetupGuide)}
                className="flex items-center gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                {showSetupGuide ? "Nascondi Guida" : "Guida Setup Completa"}
              </Button>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testConnectionMutation.isPending || !formData.isActive}
              >
                {testConnectionMutation.isPending ? "Testing..." : "Test Connessione"}
              </Button>
              <Button
                variant="outline"
                onClick={handleTestTemplate}
                disabled={testTemplateMutation.isPending || !formData.isActive}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                {testTemplateMutation.isPending ? "Inviando..." : "Test Template"}
              </Button>
            </div>
            <Button
              onClick={handleSave}
              disabled={saveSettingsMutation.isPending}
            >
              {saveSettingsMutation.isPending ? "Salvando..." : "Salva Configurazione"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Setup Guide */}
      {showSetupGuide && (
        <WhatsAppSetupGuide provider={formData.provider} />
      )}
    </div>
  );
}