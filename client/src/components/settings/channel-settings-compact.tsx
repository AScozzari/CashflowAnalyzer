import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mail, Phone, Send, CheckCircle, X } from 'lucide-react';
import { WhatsAppSettingsWithTabs } from './whatsapp-settings-with-tabs';
import { SendGridConfigComplete } from './sendgrid-config-complete';
import { SmsSettingsSkebby } from './sms-settings-skebby';
import TelegramSettings from './telegram-settings';

interface ChannelConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'implemented' | 'coming_soon';
  statusText: string;
  details: string;
  features: string[];
}

export function ChannelSettingsCompact() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<string | null>(null);

  const channels: ChannelConfig[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'API Business + Template Pre-approvati',
      icon: <MessageSquare className="w-6 h-6 text-green-600" />,
      status: 'implemented',
      statusText: 'Implementato',
      details: 'Sistema completo con template dinamici e variabili avanzate',
      features: ['Template dinamici', 'Variabili automatiche', 'Webhook integrati', 'API Business']
    },
    {
      id: 'email',
      name: 'Email',
      description: 'SendGrid configurato',
      icon: <Mail className="w-6 h-6 text-blue-600" />,
      status: 'implemented',
      statusText: 'Implementato',
      details: 'Sistema email professionale con template personalizzabili',
      features: ['SendGrid API', 'Template HTML', 'Invio massivo', 'Tracking aperture']
    },
    {
      id: 'sms',
      name: 'SMS',
      description: 'Skebby SMS API',
      icon: <Phone className="w-6 h-6 text-orange-600" />,
      status: 'implemented',
      statusText: 'Implementato',
      details: 'Sistema SMS italiano GDPR-compliant con Skebby',
      features: ['Skebby API', 'SMS Italia', 'Delivery status', 'Template brevi']
    },
    {
      id: 'telegram',
      name: 'Telegram',
      description: 'Bot API implementato',
      icon: <Send className="w-6 h-6 text-sky-600" />,
      status: 'implemented',
      statusText: 'Implementato',
      details: 'Sistema completo Telegram Bot con webhook e AI integrato',
      features: ['Bot API gratuita', 'Messaggi istantanei', 'Comandi interattivi', 'AI Assistant', 'Webhook system']
    }
  ];

  const renderConfigModal = () => {
    if (!openModal) return null;

    const channel = channels.find(c => c.id === openModal);
    if (!channel) return null;

    return (
      <div className="mt-8">
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              {channel.icon}
              <CardTitle>Configurazione {channel.name}</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setOpenModal(null)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {openModal === 'whatsapp' && <WhatsAppSettingsWithTabs />}
            {openModal === 'email' && <SendGridConfigComplete />}
            {openModal === 'sms' && <SmsSettingsSkebby />}
            {openModal === 'telegram' && <TelegramSettings />}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Channel Settings</h2>
        <p className="text-muted-foreground">
          Configura i canali di comunicazione per notifiche automatiche
        </p>
      </div>

      {/* Griglia compatta 4 card per riga - Card più piccole */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {channels.map((channel) => (
          <Card 
            key={channel.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
              selectedChannel === channel.id ? 'ring-2 ring-blue-500' : ''
            } ${
              channel.status === 'implemented' 
                ? 'border-green-200 dark:border-green-800' 
                : 'border-orange-200 dark:border-orange-800'
            }`}
            onClick={() => {
              setSelectedChannel(channel.id);
              if (channel.status === 'implemented') {
                setOpenModal(channel.id);
              }
            }}
          >
            <CardContent className="p-3 text-center space-y-2">
              <div className={`mx-auto p-2 rounded-lg w-fit ${
                channel.status === 'implemented' 
                  ? 'bg-green-100 dark:bg-green-900' 
                  : 'bg-orange-100 dark:bg-orange-900'
              }`}>
                {channel.icon}
              </div>
              
              <div>
                <h3 className="font-semibold text-xs">{channel.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{channel.description}</p>
              </div>
              
              <Badge 
                variant={channel.status === 'implemented' ? 'default' : 'secondary'}
                className={`text-xs px-2 py-1 ${
                  channel.status === 'implemented' 
                    ? 'bg-green-600 text-white' 
                    : ''
                }`}
              >
                {channel.statusText}
              </Badge>
              
              <div className="text-xs text-muted-foreground">
                {channel.status === 'implemented' ? 'Click per configurare' : 'Prossimamente'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dettagli canale selezionato */}
      {selectedChannel && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                {channels.find(c => c.id === selectedChannel)?.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">
                  Canale selezionato: {channels.find(c => c.id === selectedChannel)?.name}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {channels.find(c => c.id === selectedChannel)?.details}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {channels.find(c => c.id === selectedChannel)?.features?.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Clicca su "Configura" per accedere alle impostazioni avanzate del canale.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal di configurazione che si apre sotto */}
      {renderConfigModal()}
    </div>
  );
}