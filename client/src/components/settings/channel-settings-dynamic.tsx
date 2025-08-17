import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Send,
  Settings,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WhatsAppSettingsWithTabs } from './whatsapp-settings-with-tabs';
import { SendGridTemplatesManager } from './sendgrid-templates';
import { SmsSettingsSkebby } from './sms-settings-skebby';

interface ChannelConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'implemented' | 'coming_soon' | 'error' | 'configuring';
  statusText: string;
  details: string;
  action: {
    text: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'outline';
  };
  features?: string[];
}

export function ChannelSettingsDynamic() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [openConfigModal, setOpenConfigModal] = useState<string | null>(null);

  const channels: ChannelConfig[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'Template dinamici',
      icon: <MessageSquare className="w-5 h-5 text-green-600" />,
      status: 'implemented',
      statusText: 'Implementato',
      details: 'Sistema completo con template dinamici e variabili avanzate',
      features: ['Template dinamici', 'Variabili automatiche', 'Webhook integrati', 'API Business'],
      action: {
        text: 'Configura',
        onClick: () => setOpenConfigModal('whatsapp'),
        variant: 'default'
      }
    },
    {
      id: 'email',
      name: 'Email',
      description: 'SendGrid configurato',
      icon: <Mail className="w-5 h-5 text-blue-600" />,
      status: 'implemented',
      statusText: 'Implementato',
      details: 'Sistema email professionale con template personalizzabili',
      features: ['SendGrid API', 'Template HTML', 'Invio massivo', 'Tracking aperture'],
      action: {
        text: 'Configura',
        onClick: () => setOpenConfigModal('email'),
        variant: 'default'
      }
    },
    {
      id: 'sms',
      name: 'SMS',
      description: 'Skebby API Italia',
      icon: <Phone className="w-5 h-5 text-orange-600" />,
      status: 'implemented',
      statusText: 'Implementato',
      details: 'Sistema SMS italiano GDPR-compliant con Skebby',
      features: ['Skebby API', 'SMS Italia', 'Delivery status', 'Template brevi'],
      action: {
        text: 'Configura',
        onClick: () => setOpenConfigModal('sms'),
        variant: 'default'
      }
    },
    {
      id: 'telegram',
      name: 'Telegram',
      description: 'Bot API gratuita',
      icon: <Send className="w-5 h-5 text-sky-600" />,
      status: 'coming_soon',
      statusText: 'Prossimamente',
      details: 'Bot Telegram per notifiche istantanee e interazioni',
      features: ['Bot API gratuita', 'Messaggi istantanei', 'Comandi interattivi', 'File sharing'],
      action: {
        text: 'Attiva',
        onClick: () => setSelectedChannel('telegram'),
        variant: 'secondary'
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Channel Settings</h2>
        <p className="text-muted-foreground">
          Configura i canali di comunicazione per notifiche automatiche
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.map((channel) => (
          <Card 
            key={channel.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              selectedChannel === channel.id && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950",
              channel.status === 'implemented' && "border-green-200 dark:border-green-800",
              channel.status === 'coming_soon' && "border-orange-200 dark:border-orange-800"
            )}
            onClick={() => setSelectedChannel(channel.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    channel.status === 'implemented' && "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
                    channel.status === 'coming_soon' && "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400"
                  )}>
                    {channel.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{channel.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {channel.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(channel.status)}
                  {getStatusBadge(channel.status, channel.statusText)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {channel.details}
              </p>
              
              {channel.features && (
                <div className="flex flex-wrap gap-1">
                  {channel.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              )}
              
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  channel.action.onClick();
                }}
                variant={channel.action.variant || 'default'}
                className="w-full"
                disabled={channel.status === 'coming_soon'}
              >
                {channel.action.text}
                {channel.status === 'implemented' && (
                  <ExternalLink className="w-4 h-4 ml-2" />
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedChannel && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-blue-700 dark:text-blue-300">
                Canale selezionato: {channels.find(c => c.id === selectedChannel)?.name}
              </span>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Clicca su "Configura" per accedere alle impostazioni avanzate del canale.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog per configurazioni */}
      <Dialog open={!!openConfigDialog} onOpenChange={() => setOpenConfigDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Configurazione {channels.find(c => c.id === openConfigDialog)?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {openConfigDialog === 'whatsapp' && <WhatsAppSettingsWithTabs />}
            {openConfigDialog === 'email' && <SendGridTemplatesManager />}
            {openConfigDialog === 'sms' && <SmsSettingsSkebby />}
            {openConfigDialog === 'telegram' && (
              <div className="text-center py-8">
                <Send className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Telegram Bot in arrivo</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  L'integrazione Telegram Bot sarà disponibile presto
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}