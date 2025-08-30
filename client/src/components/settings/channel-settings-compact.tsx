import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mail, Phone, Send, CheckCircle, X, Loader2 } from 'lucide-react';
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

  // Fetch real channel status from backend
  const { data: channelsData, isLoading: loadingChannels } = useQuery({
    queryKey: ['/api/channels/status'],
    queryFn: () => fetch('/api/channels/status').then(res => res.json()),
    staleTime: 30000
  });

  // Define channel template with icons and base info
  const channelTemplates = {
    whatsapp: {
      icon: <MessageSquare className="w-6 h-6 text-green-600" />,
      name: 'WhatsApp Business',
      description: 'API Business + Template Pre-approvati'
    },
    email: {
      icon: <Mail className="w-6 h-6 text-blue-600" />,
      name: 'Email',  
      description: 'SendGrid configurato'
    },
    sms: {
      icon: <Phone className="w-6 h-6 text-orange-600" />,
      name: 'SMS',
      description: 'Skebby SMS API'
    },
    telegram: {
      icon: <Send className="w-6 h-6 text-sky-600" />,
      name: 'Telegram',
      description: 'Bot API implementato'
    }
  };

  // 🔥 FIX: Assicura che channelsData sia sempre un array
  const channels: ChannelConfig[] = (channelsData && Array.isArray(channelsData)) ? 
    channelsData.map((channelData: any) => ({
      ...channelData,
      icon: channelTemplates[channelData.id as keyof typeof channelTemplates]?.icon || <Send className="w-6 h-6" />,
      name: channelTemplates[channelData.id as keyof typeof channelTemplates]?.name || channelData.name,
      description: channelTemplates[channelData.id as keyof typeof channelTemplates]?.description || channelData.description
    })) : [
      // Fallback channels se l'API non è disponibile
      {
        id: 'whatsapp',
        name: 'WhatsApp Business', 
        description: 'API Business + Template Pre-approvati',
        icon: <MessageSquare className="w-6 h-6 text-green-600" />,
        status: 'coming_soon' as const,
        statusText: 'Non configurato',
        details: 'Configurazione richiesta',
        features: ['Template pre-approvati', 'Messaggi interattivi']
      },
      {
        id: 'email',
        name: 'Email',
        description: 'SendGrid configurato',
        icon: <Mail className="w-6 h-6 text-blue-600" />,
        status: 'implemented' as const,
        statusText: 'Configurato',
        details: 'SendGrid attivo',
        features: ['Template HTML', 'Tracking aperture']
      },
      {
        id: 'sms',
        name: 'SMS',
        description: 'Skebby SMS API',
        icon: <Phone className="w-6 h-6 text-orange-600" />,
        status: 'implemented' as const,
        statusText: 'Configurato',
        details: 'Skebby API attiva',
        features: ['SMS Italia', 'Messaggi multipli']
      },
      {
        id: 'telegram',
        name: 'Telegram',
        description: 'Bot API implementato',
        icon: <Send className="w-6 h-6 text-sky-600" />,
        status: 'implemented' as const,
        statusText: 'Configurato',
        details: 'Bot API attivo',
        features: ['Chat private', 'Risposte automatiche']
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

  // Loading state
  if (loadingChannels) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Channel Settings</h2>
          <p className="text-muted-foreground">
            Configura i canali di comunicazione per notifiche automatiche
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Caricamento configurazioni canali...</span>
        </div>
      </div>
    );
  }

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
              // Permettiamo configurazione per tutti i canali
              setOpenModal(channel.id);
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
                Click per configurare
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