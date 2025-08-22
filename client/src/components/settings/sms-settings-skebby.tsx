import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  MessageSquare, 
  Settings, 
  TestTube, 
  CreditCard, 
  Shield, 
  Users, 
  BarChart3, 
  Send,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  FileText
} from 'lucide-react';
import type { SmsSettings, SmsTemplate, InsertSmsSettings, InsertSmsTemplate } from '@shared/sms-schema';

export function SmsSettingsSkebby() {
  const [activeTab, setActiveTab] = useState('settings');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; credits?: number } | null>(null);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch SMS settings
  const { data: settings, isLoading: settingsLoading } = useQuery<SmsSettings>({
    queryKey: ['/api/sms/settings'],
  });

  // Fetch SMS templates
  const { data: templates, isLoading: templatesLoading } = useQuery<SmsTemplate[]>({
    queryKey: ['/api/sms/templates'],
  });

  // Fetch SMS statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/sms/statistics'],
  });

  // Test connection mutation
  const testConnection = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/sms/test-connection');
      return response.json();
    },
    onSuccess: (data) => {
      setTestResult(data);
      if (data.success) {
        toast({ title: 'Connessione riuscita!', description: `Crediti disponibili: ${data.credits || 0}` });
      } else {
        toast({ title: 'Test fallito', description: data.message, variant: 'destructive' });
      }
    },
    onError: () => {
      toast({ title: 'Errore nel test', variant: 'destructive' });
    }
  });

  // Save settings mutation
  const saveSettings = useMutation({
    mutationFn: async (data: Partial<InsertSmsSettings>) => {
      const response = await apiRequest('POST', '/api/sms/settings', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sms/settings'] });
      toast({ title: 'Impostazioni salvate con successo' });
    },
    onError: () => {
      toast({ title: 'Errore nel salvataggio', variant: 'destructive' });
    }
  });

  // Handle test connection
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      await testConnection.mutateAsync();
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento impostazioni SMS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            SMS con Skebby
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configura l'invio SMS professionale tramite Skebby API
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={settings?.isActive ? 'default' : 'secondary'}>
            {settings?.isActive ? 'Attivo' : 'Disattivato'}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={handleTestConnection}
            disabled={isTestingConnection}
            data-testid="button-test-connection"
          >
            <TestTube className="w-4 h-4 mr-2" />
            {isTestingConnection ? 'Testing...' : 'Test Connessione'}
          </Button>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <Card className={`border ${testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.message}
                </p>
                {testResult.success && testResult.credits !== undefined && (
                  <p className="text-sm text-green-600">
                    Crediti disponibili: {testResult.credits}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurazione
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Template
          </TabsTrigger>
          <TabsTrigger value="blacklist" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Blacklist
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Statistiche
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurazione Skebby API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Configurazione Base */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Credenziali API Skebby</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username Skebby</Label>
                    <Input
                      id="username"
                      type="email"
                      defaultValue={settings?.username || 'a.scozzari@easydigitalgroup.it'}
                      placeholder="your-email@example.com"
                      data-testid="input-username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password API</Label>
                    <Input
                      id="password"
                      type="password"
                      defaultValue={settings?.password || ''}
                      placeholder="••••••••"
                      data-testid="input-password"
                    />
                  </div>
                </div>
              </div>

              {/* Token Configuration */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Token di Autenticazione</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accessToken">Token Permanente</Label>
                    <Input
                      id="accessToken"
                      type="text"
                      defaultValue={settings?.accessToken || 'rLxV6yjcmlcFo2EQCXxhhhHu'}
                      placeholder="Token da dashboard Skebby"
                      data-testid="input-access-token"
                    />
                    <p className="text-xs text-gray-500">
                      Token dalla sezione "Tokens" nel pannello Skebby
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userKey">User Key</Label>
                    <Input
                      id="userKey"
                      type="text"
                      defaultValue={settings?.userKey || ''}
                      placeholder="User key ottenuta dal login"
                      data-testid="input-user-key"
                      readOnly
                    />
                    <p className="text-xs text-gray-500">
                      Generata automaticamente al primo login
                    </p>
                  </div>
                </div>
              </div>

              {/* Webhook Configuration */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Delivery Receipts (Notifiche Stato)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">URL Notifica Stato SMS</Label>
                    <Input
                      id="webhookUrl"
                      type="url"
                      defaultValue={settings?.webhookUrl || ''}
                      placeholder="https://yourserver.com/webhook/sms"
                      data-testid="input-webhook-url"
                    />
                    <p className="text-xs text-gray-500">
                      URL dove ricevere notifiche di delivery
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhookMethod">Metodo Webhook</Label>
                    <Select defaultValue={settings?.webhookMethod || 'POST'}>
                      <SelectTrigger data-testid="select-webhook-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="GET">GET</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="deliveryReceipts">Abilita Delivery Receipts</Label>
                    <p className="text-sm text-gray-500">
                      Ricevi notifiche quando gli SMS vengono consegnati
                    </p>
                  </div>
                  <Switch
                    id="deliveryReceipts"
                    defaultChecked={settings?.deliveryReceiptsEnabled ?? false}
                    data-testid="switch-delivery-receipts"
                  />
                </div>
              </div>

              {/* SMS Configuration */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Configurazione SMS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultSender">Mittente Predefinito</Label>
                    <Input
                      id="defaultSender"
                      defaultValue={settings?.defaultSender || ''}
                      placeholder="YourCompany"
                      maxLength={11}
                      data-testid="input-default-sender"
                    />
                    <p className="text-xs text-gray-500">
                      Max 11 caratteri alfanumerici (opzionale)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="messageType">Qualità Messaggi</Label>
                    <Select defaultValue={settings?.messageType || 'GP'}>
                      <SelectTrigger data-testid="select-message-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GP">Alta Qualità (GP)</SelectItem>
                        <SelectItem value="TI">Media Qualità (TI)</SelectItem>
                        <SelectItem value="SI">Bassa Qualità (SI)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Service Controls */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="isActive">Servizio Attivo</Label>
                    <p className="text-sm text-gray-500">
                      Abilita l'invio SMS tramite Skebby
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    defaultChecked={settings?.isActive ?? true}
                    data-testid="switch-active"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="testMode">Modalità Test</Label>
                    <p className="text-sm text-gray-500">
                      Gli SMS non vengono inviati realmente
                    </p>
                  </div>
                  <Switch
                    id="testMode"
                    defaultChecked={settings?.testMode ?? false}
                    data-testid="switch-test-mode"
                  />
                </div>

                <div className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                  <a 
                    href="https://www.skebby.it/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Vai a Skebby.it
                  </a>
                </Button>
                <Button 
                  onClick={() => {
                    const formData = {
                      username: (document.getElementById('username') as HTMLInputElement)?.value || '',
                      password: (document.getElementById('password') as HTMLInputElement)?.value || '',
                      accessToken: (document.getElementById('accessToken') as HTMLInputElement)?.value || '',
                      webhookUrl: (document.getElementById('webhookUrl') as HTMLInputElement)?.value || '',
                      defaultSender: (document.getElementById('defaultSender') as HTMLInputElement)?.value || '',
                      deliveryReceiptsEnabled: (document.getElementById('deliveryReceipts') as HTMLInputElement)?.checked || false,
                      isActive: (document.getElementById('isActive') as HTMLInputElement)?.checked || false,
                      testMode: (document.getElementById('testMode') as HTMLInputElement)?.checked || false
                    };
                    saveSettings.mutate(formData);
                  }}
                  disabled={saveSettings.isPending}
                  data-testid="button-save-settings"
                >
                  {saveSettings.isPending ? 'Salvando...' : 'Salva Configurazione'}
                </Button>
              </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Template SMS</h3>
            <Button 
              onClick={() => setIsAddingTemplate(true)}
              data-testid="button-add-template"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Template
            </Button>
          </div>

          {templatesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Caricamento template...</p>
            </div>
          ) : templates && templates.length > 0 ? (
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge variant="outline">{template.category}</Badge>
                          {template.isActive ? (
                            <Badge variant="default">Attivo</Badge>
                          ) : (
                            <Badge variant="secondary">Disattivato</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm font-mono">
                          {template.messageBody}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Caratteri: {template.characterCount || 0}</span>
                          <span>Codifica: {template.encoding}</span>
                          <span>Priorità: {template.priority}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingTemplate(template)}
                          data-testid={`button-edit-template-${template.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`button-delete-template-${template.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nessun template SMS</h3>
                <p className="text-gray-600 mb-4">
                  Crea il tuo primo template SMS per iniziare
                </p>
                <Button onClick={() => setIsAddingTemplate(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crea Template
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Blacklist Tab */}
        <TabsContent value="blacklist" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Blacklist SMS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                I numeri in blacklist non riceveranno SMS
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="+39 123 456 7890"
                    className="flex-1"
                    data-testid="input-blacklist-number"
                  />
                  <Button data-testid="button-add-blacklist">
                    Aggiungi
                  </Button>
                </div>
                
                <div className="text-center py-8 text-gray-500">
                  Nessun numero in blacklist
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">SMS Inviati Oggi</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Send className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Crediti Rimanenti</p>
                    <p className="text-2xl font-bold">{testResult?.credits || '-'}</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tasso Consegna</p>
                    <p className="text-2xl font-bold">-%</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Panoramica Ultimi 30 Giorni</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Nessun dato disponibile
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}