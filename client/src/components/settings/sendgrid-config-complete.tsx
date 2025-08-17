import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SendGridTemplatesManager } from './sendgrid-templates';
import { 
  Mail, 
  Settings, 
  FileText, 
  Send, 
  Key, 
  Globe, 
  CheckCircle, 
  AlertTriangle,
  Info
} from 'lucide-react';

export function SendGridConfigComplete() {
  const [activeTab, setActiveTab] = useState('settings');
  const [apiKey, setApiKey] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);

  const handleSaveSettings = () => {
    console.log('Saving SendGrid settings:', {
      apiKey,
      fromEmail,
      fromName,
      replyTo,
      isEnabled
    });
  };

  const handleTestConnection = () => {
    console.log('Testing SendGrid connection...');
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurazione
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Template
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Test & Invio
          </TabsTrigger>
        </TabsList>

        {/* Tab Configurazione SendGrid */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                Configurazione API SendGrid
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="enable-sendgrid" 
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                />
                <Label htmlFor="enable-sendgrid">Abilita SendGrid</Label>
                <Badge variant={isEnabled ? 'default' : 'secondary'}>
                  {isEnabled ? 'Attivo' : 'Disattivo'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="api-key">API Key SendGrid</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="SG.xxxxxxxxxxxxxxxxxxxx"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={!isEnabled}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Ottieni la tua API Key dal dashboard SendGrid
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from-email">Email Mittente</Label>
                    <Input
                      id="from-email"
                      type="email"
                      placeholder="noreply@tuodominio.com"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      disabled={!isEnabled}
                    />
                  </div>
                  <div>
                    <Label htmlFor="from-name">Nome Mittente</Label>
                    <Input
                      id="from-name"
                      placeholder="EasyCashFlows"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      disabled={!isEnabled}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reply-to">Reply-To Email</Label>
                  <Input
                    id="reply-to"
                    type="email"
                    placeholder="support@tuodominio.com"
                    value={replyTo}
                    onChange={(e) => setReplyTo(e.target.value)}
                    disabled={!isEnabled}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={!isEnabled}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Salva Configurazione
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={!isEnabled || !apiKey}
                  className="flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  Test Connessione
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Informazioni Configurazione
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <strong>API Key:</strong> Necessaria per autenticare le richieste a SendGrid
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <strong>Email Mittente:</strong> Deve essere verificata nel tuo account SendGrid
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <strong>Template HTML:</strong> Supporto completo per template dinamici e personalizzabili
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <strong>Tracking:</strong> Monitoraggio aperture, click e delivery status
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Template */}
        <TabsContent value="templates">
          <SendGridTemplatesManager />
        </TabsContent>

        {/* Tab Test */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-green-600" />
                Test Email SendGrid
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="test-email">Email di Test</Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="test@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="test-subject">Oggetto</Label>
                  <Input
                    id="test-subject"
                    placeholder="Test Email SendGrid"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="test-message">Messaggio</Label>
                <Textarea
                  id="test-message"
                  placeholder="Questo è un messaggio di test da EasyCashFlows"
                  rows={4}
                />
              </div>

              <Button className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Invia Email di Test
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stato Servizio SendGrid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Stato API</span>
                  <Badge variant={isEnabled && apiKey ? 'default' : 'secondary'}>
                    {isEnabled && apiKey ? 'Configurato' : 'Non Configurato'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Email Mittente</span>
                  <Badge variant={fromEmail ? 'default' : 'secondary'}>
                    {fromEmail ? 'Configurata' : 'Non Configurata'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Template Disponibili</span>
                  <Badge variant="outline">0</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}