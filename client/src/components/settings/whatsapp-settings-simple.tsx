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
import { MessageSquare, CheckCircle, AlertCircle, ExternalLink, DollarSign } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";

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
    webhookUrl: ''
  });

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

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
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

  const handleSave = () => {
    saveSettingsMutation.mutate(formData);
  };

  const handleTestConnection = () => {
    testConnectionMutation.mutate();
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

  const currentProvider = providerConfig[formData.provider];

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
              <div className="space-y-2">
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
                <a 
                  href={currentProvider.docs} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  Documentazione ufficiale <ExternalLink className="h-3 w-3" />
                </a>
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
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testConnectionMutation.isPending || !formData.isActive}
            >
              {testConnectionMutation.isPending ? "Testing..." : "Test Connessione"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveSettingsMutation.isPending}
            >
              {saveSettingsMutation.isPending ? "Salvando..." : "Salva Configurazione"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}