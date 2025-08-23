import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Webhook,
  Settings,
  Eye,
  TestTube,
  Send,
  Clock,
  Users,
  Filter,
  Volume2,
  VolumeX,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface NotificationSettings {
  // General settings
  enableNotifications: boolean;
  enableSounds: boolean;
  enableDesktopNotifications: boolean;
  
  // Email notifications
  emailEnabled: boolean;
  emailDigestEnabled: boolean;
  emailDigestFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  
  // Push notifications
  pushEnabled: boolean;
  pushOnMovements: boolean;
  pushOnMessages: boolean;
  pushOnAlerts: boolean;
  
  // SMS notifications
  smsEnabled: boolean;
  smsOnUrgent: boolean;
  smsQuietHours: boolean;
  smsQuietStart: string;
  smsQuietEnd: string;
  
  // WhatsApp notifications
  whatsappEnabled: boolean;
  whatsappTemplateId: string;
  
  // Webhook notifications
  webhookEnabled: boolean;
  webhookUrl: string;
  webhookSecret: string;
  webhookEvents: string[];
  
  // Filtering
  categoriesEnabled: string[];
  priorityThreshold: 'all' | 'normal' | 'high' | 'urgent';
  
  // Advanced
  retryAttempts: number;
  retryDelay: number;
  maxQueueSize: number;
}

interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  channels: {
    email: { sent: number; failed: number };
    sms: { sent: number; failed: number };
    whatsapp: { sent: number; failed: number };
    push: { sent: number; failed: number };
    webhook: { sent: number; failed: number };
  };
  lastWeek: Array<{
    date: string;
    sent: number;
    failed: number;
  }>;
}

const notificationCategories = [
  { id: 'movement', name: 'Movimenti Finanziari', icon: '💰' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬' },
  { id: 'sms', name: 'SMS', icon: '📱' },
  { id: 'email', name: 'Email', icon: '📧' },
  { id: 'messenger', name: 'Messenger', icon: '💌' },
  { id: 'system', name: 'Sistema', icon: '⚙️' },
  { id: 'security', name: 'Sicurezza', icon: '🔒' },
];

export default function NotificationsSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [testChannel, setTestChannel] = useState<string>('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notification settings
  const { data: settings, isLoading: settingsLoading } = useQuery<NotificationSettings>({
    queryKey: ['/api/notifications/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/notifications/settings');
      return response.json();
    }
  });

  // Fetch notification stats
  const { data: stats, isLoading: statsLoading } = useQuery<NotificationStats>({
    queryKey: ['/api/notifications/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/notifications/stats');
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<NotificationSettings>) => {
      const response = await apiRequest('PUT', '/api/notifications/settings', newSettings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '✅ Impostazioni Salvate',
        description: 'Le impostazioni notifiche sono state aggiornate'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/settings'] });
    }
  });

  // Test notification mutation
  const testNotificationMutation = useMutation({
    mutationFn: async ({ channel, message }: { channel: string; message: string }) => {
      const response = await apiRequest('POST', '/api/notifications/test', { channel, message });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '✅ Notifica Test Inviata',
        description: 'Controlla il canale selezionato per verificare la ricezione'
      });
    },
    onError: () => {
      toast({
        title: '❌ Errore Test',
        description: 'Impossibile inviare la notifica di test',
        variant: 'destructive'
      });
    }
  });

  const handleSettingChange = (key: keyof NotificationSettings, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const handleTestNotification = () => {
    if (!testChannel) {
      toast({
        title: '❌ Canale richiesto',
        description: 'Seleziona un canale per il test',
        variant: 'destructive'
      });
      return;
    }

    testNotificationMutation.mutate({
      channel: testChannel,
      message: 'Questa è una notifica di test da EasyCashFlows'
    });
  };

  const getChannelStatus = (channel: keyof NotificationStats['channels']) => {
    if (!stats) return { color: 'gray', status: 'Sconosciuto' };
    
    const channelStats = stats.channels[channel];
    const successRate = channelStats.sent / (channelStats.sent + channelStats.failed) * 100;
    
    if (successRate >= 95) return { color: 'green', status: 'Eccellente' };
    if (successRate >= 85) return { color: 'yellow', status: 'Buono' };
    return { color: 'red', status: 'Problemi' };
  };

  if (settingsLoading || statsLoading) {
    return <div className="text-center py-8">Caricamento impostazioni notifiche...</div>;
  }

  return (
    <div className="space-y-6" data-testid="notifications-settings">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Sistema Notifiche</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Generale</TabsTrigger>
          <TabsTrigger value="channels">Canali</TabsTrigger>
          <TabsTrigger value="filtering">Filtri</TabsTrigger>
          <TabsTrigger value="advanced">Avanzate</TabsTrigger>
          <TabsTrigger value="testing">Test</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Notifiche Totali</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">Ultimo mese</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Inviate con Successo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats?.sent || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.total ? Math.round((stats.sent / stats.total) * 100) : 0}% successo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Fallite</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.total ? Math.round((stats.failed / stats.total) * 100) : 0}% errori
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">In Coda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
                <p className="text-xs text-muted-foreground">In attesa</p>
              </CardContent>
            </Card>
          </div>

          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Generali</CardTitle>
              <CardDescription>
                Configurazioni base del sistema di notifiche
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enableNotifications"
                  checked={settings?.enableNotifications || false}
                  onCheckedChange={(checked) => handleSettingChange('enableNotifications', checked)}
                />
                <Label htmlFor="enableNotifications">Abilita Notifiche</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enableSounds"
                  checked={settings?.enableSounds || false}
                  onCheckedChange={(checked) => handleSettingChange('enableSounds', checked)}
                />
                <Label htmlFor="enableSounds">Suoni Notifiche</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enableDesktopNotifications"
                  checked={settings?.enableDesktopNotifications || false}
                  onCheckedChange={(checked) => handleSettingChange('enableDesktopNotifications', checked)}
                />
                <Label htmlFor="enableDesktopNotifications">Notifiche Desktop</Label>
              </div>
            </CardContent>
          </Card>

          {/* Category Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Categorie Notifiche</CardTitle>
              <CardDescription>
                Seleziona quali tipologie di notifiche ricevere
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {notificationCategories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Switch
                      id={`category-${category.id}`}
                      checked={settings?.categoriesEnabled?.includes(category.id) || false}
                      onCheckedChange={(checked) => {
                        const current = settings?.categoriesEnabled || [];
                        const updated = checked 
                          ? [...current, category.id]
                          : current.filter(id => id !== category.id);
                        handleSettingChange('categoriesEnabled', updated);
                      }}
                    />
                    <Label htmlFor={`category-${category.id}`} className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          {/* Channel Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats?.channels || {}).map(([channel, channelStats]) => {
              const status = getChannelStatus(channel as keyof NotificationStats['channels']);
              const channelIcons = {
                email: Mail,
                sms: Smartphone,
                whatsapp: MessageSquare,
                push: Bell,
                webhook: Webhook
              };
              const Icon = channelIcons[channel as keyof typeof channelIcons] || Bell;
              
              return (
                <Card key={channel}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {channel.charAt(0).toUpperCase() + channel.slice(1)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Inviate:</span>
                        <Badge variant="outline">{channelStats.sent}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Fallite:</span>
                        <Badge variant="outline">{channelStats.failed}</Badge>
                      </div>
                      <Badge 
                        variant={status.color === 'green' ? 'default' : 'destructive'}
                        className="w-full justify-center"
                      >
                        {status.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Impostazioni Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="emailEnabled"
                  checked={settings?.emailEnabled || false}
                  onCheckedChange={(checked) => handleSettingChange('emailEnabled', checked)}
                />
                <Label htmlFor="emailEnabled">Notifiche Email</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="emailDigest"
                  checked={settings?.emailDigestEnabled || false}
                  onCheckedChange={(checked) => handleSettingChange('emailDigestEnabled', checked)}
                />
                <Label htmlFor="emailDigest">Digest Email</Label>
              </div>

              <div>
                <Label htmlFor="digestFrequency">Frequenza Digest</Label>
                <Select
                  value={settings?.emailDigestFrequency || 'daily'}
                  onValueChange={(value) => handleSettingChange('emailDigestFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediato</SelectItem>
                    <SelectItem value="hourly">Ogni Ora</SelectItem>
                    <SelectItem value="daily">Giornaliero</SelectItem>
                    <SelectItem value="weekly">Settimanale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* SMS Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Impostazioni SMS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="smsEnabled"
                  checked={settings?.smsEnabled || false}
                  onCheckedChange={(checked) => handleSettingChange('smsEnabled', checked)}
                />
                <Label htmlFor="smsEnabled">Notifiche SMS</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="smsOnUrgent"
                  checked={settings?.smsOnUrgent || false}
                  onCheckedChange={(checked) => handleSettingChange('smsOnUrgent', checked)}
                />
                <Label htmlFor="smsOnUrgent">SMS solo per Urgenti</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="smsQuietHours"
                  checked={settings?.smsQuietHours || false}
                  onCheckedChange={(checked) => handleSettingChange('smsQuietHours', checked)}
                />
                <Label htmlFor="smsQuietHours">Ore Silenziose</Label>
              </div>

              {settings?.smsQuietHours && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="quietStart">Inizio</Label>
                    <Input
                      id="quietStart"
                      type="time"
                      value={settings?.smsQuietStart || '22:00'}
                      onChange={(e) => handleSettingChange('smsQuietStart', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quietEnd">Fine</Label>
                    <Input
                      id="quietEnd"
                      type="time"
                      value={settings?.smsQuietEnd || '08:00'}
                      onChange={(e) => handleSettingChange('smsQuietEnd', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filtering" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filtri Notifiche</CardTitle>
              <CardDescription>
                Configura quali notifiche ricevere in base alla priorità e categoria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="priorityThreshold">Soglia Priorità</Label>
                <Select
                  value={settings?.priorityThreshold || 'all'}
                  onValueChange={(value) => handleSettingChange('priorityThreshold', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte</SelectItem>
                    <SelectItem value="normal">Normale e superiori</SelectItem>
                    <SelectItem value="high">Alta e superiori</SelectItem>
                    <SelectItem value="urgent">Solo Urgenti</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Avanzate</CardTitle>
              <CardDescription>
                Configurazioni tecniche del sistema di notifiche
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="retryAttempts">Tentativi di Reinvio</Label>
                  <Input
                    id="retryAttempts"
                    type="number"
                    value={settings?.retryAttempts || 3}
                    onChange={(e) => handleSettingChange('retryAttempts', parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="retryDelay">Ritardo Reinvio (secondi)</Label>
                  <Input
                    id="retryDelay"
                    type="number"
                    value={settings?.retryDelay || 30}
                    onChange={(e) => handleSettingChange('retryDelay', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="maxQueueSize">Dimensione Massima Coda</Label>
                  <Input
                    id="maxQueueSize"
                    type="number"
                    value={settings?.maxQueueSize || 1000}
                    onChange={(e) => handleSettingChange('maxQueueSize', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={settings?.webhookUrl || ''}
                  onChange={(e) => handleSettingChange('webhookUrl', e.target.value)}
                  placeholder="https://example.com/webhook"
                />
              </div>

              <div>
                <Label htmlFor="webhookSecret">Webhook Secret</Label>
                <Input
                  id="webhookSecret"
                  type="password"
                  value={settings?.webhookSecret || ''}
                  onChange={(e) => handleSettingChange('webhookSecret', e.target.value)}
                  placeholder="Secret per validazione webhook"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Notifiche</CardTitle>
              <CardDescription>
                Invia notifiche di test per verificare la configurazione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testChannel">Canale Test</Label>
                <Select value={testChannel} onValueChange={setTestChannel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona canale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleTestNotification}
                disabled={testNotificationMutation.isPending || !testChannel}
                className="w-full"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Invia Notifica di Test
              </Button>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Le notifiche di test vengono inviate utilizzando le configurazioni correnti. 
                  Assicurati che i canali siano configurati correttamente prima del test.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}