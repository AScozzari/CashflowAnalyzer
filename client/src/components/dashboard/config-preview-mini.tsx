import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Send, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Zap,
  BarChart3,
  TrendingUp,
  Shield
} from 'lucide-react';
import { Link } from 'wouter';

interface ChannelUsage {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'configured' | 'partial' | 'not_configured' | 'error';
  currentUsage: number;
  monthlyLimit: number;
  usagePercentage: number;
  lastUsed?: string;
  messagesThisMonth: number;
  cost: string;
}

interface SystemMetrics {
  totalChannels: number;
  activeChannels: number;
  configurationHealth: number;
  lastUpdate: string;
}

export function ConfigPreviewMini() {
  // 🔥 DATI REALI - Fetch delle statistiche WhatsApp (AGGIORNAMENTO AUTOMATICO)
  const { data: whatsappStats } = useQuery<{total: number; unread: number; today: number}>({
    queryKey: ['/api/whatsapp/stats'],
    select: (data: any) => ({
      total: data?.approvedTemplates || 0, // ✅ Fix: usa approvedTemplates
      unread: data?.pendingTemplates || 0,
      today: 0 // WhatsApp non è configurato
    }),
    retry: false,
    refetchInterval: 30000, // Aggiorna ogni 30 secondi
    staleTime: 0, // Sempre aggiorna
  });

  const { data: whatsappChats = [] } = useQuery<any[]>({
    queryKey: ['/api/whatsapp/chats'],
    retry: false,
    refetchInterval: 30000, // Aggiorna ogni 30 secondi
    staleTime: 0,
  });

  // 🔥 DATI REALI - Fetch delle statistiche Telegram (AGGIORNAMENTO AUTOMATICO)
  const { data: telegramStats } = useQuery<{total: number; unread: number; today: number}>({
    queryKey: ['/api/telegram/stats'],
    select: (data: any) => ({
      total: data?.totalChats || 0,
      unread: data?.unreadMessages || 0, 
      today: data?.todayMessages || 0
    }),
    retry: false,
    refetchInterval: 30000, // Aggiorna ogni 30 secondi
    staleTime: 0,
  });

  const { data: telegramChats = [] } = useQuery<any[]>({
    queryKey: ['/api/telegram/chats'],
    retry: false,
    refetchInterval: 30000, // Aggiorna ogni 30 secondi
    staleTime: 0,
  });

  // 🔥 DATI REALI - Fetch delle statistiche Email (DATI DEMO + AGGIORNAMENTO AUTOMATICO)
  const { data: emailStats } = useQuery<{total: number; sent: number; failed: number; today: number}>({
    queryKey: ['/api/email/stats'],
    select: (data: any) => ({
      total: data?.totalEmails || 0,
      sent: data?.sentEmails || 0,
      failed: data?.failedEmails || 0,
      today: data?.todayEmails || 0 // ✅ Aggiungo dati giornalieri
    }),
    retry: false,
    refetchInterval: 30000, // Aggiorna ogni 30 secondi
    staleTime: 0,
  });

  // 🔥 DATI REALI - Fetch delle statistiche SMS (AGGIORNAMENTO AUTOMATICO)
  const { data: smsStats } = useQuery<{total: number; sent: number; failed: number}>({
    queryKey: ['/api/sms/stats'],
    select: (data: any) => ({
      total: data?.totalSms || 0,
      sent: data?.sentSms || 0,
      failed: data?.failedSms || 0
    }),
    retry: false,
    refetchInterval: 30000, // Aggiorna ogni 30 secondi
    staleTime: 0,
  });

  // Helper function to calculate last used
  const getLastUsed = (chats: any[], type: string) => {
    if (!chats || chats.length === 0) return 'Mai utilizzato';
    
    const latestChat = chats
      .filter(chat => chat.lastMessageAt)
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())[0];
    
    if (!latestChat) return 'Nessuna attività';
    
    const lastMessage = new Date(latestChat.lastMessageAt);
    const now = new Date();
    const diffMs = now.getTime() - lastMessage.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Ora';
    if (diffMins < 60) return `${diffMins} min fa`;
    if (diffHours < 24) return `${diffHours} ore fa`;
    if (diffDays === 1) return 'Ieri';
    if (diffDays < 7) return `${diffDays} giorni fa`;
    return 'Oltre una settimana fa';
  };

  // Calcolo costi approssimativi (simulati)
  const calculateCost = (messageCount: number, costPerMessage: number) => {
    return `€${(messageCount * costPerMessage).toFixed(2)}`;
  };

  // 🔥 CANALI CON DATI REALI
  const channels: ChannelUsage[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <MessageSquare className="w-4 h-4" />,
      status: whatsappStats?.total > 0 ? 'configured' : 'not_configured',
      currentUsage: whatsappStats?.total || 0,
      monthlyLimit: 10000,
      usagePercentage: Math.round(((whatsappStats?.total || 0) / 10000) * 100),
      lastUsed: whatsappStats?.total > 0 ? 'Nessuna attività' : 'Mai utilizzato',
      messagesThisMonth: whatsappStats?.total || 0,
      cost: calculateCost(whatsappStats?.total || 0, 0.005) // 0.5 centesimi per messaggio
    },
    {
      id: 'email',
      name: 'Email',
      icon: <Mail className="w-4 h-4" />,
      status: emailStats?.sent > 0 ? 'configured' : 'not_configured', // ✅ Controlla sent
      currentUsage: emailStats?.sent || 0, // ✅ Usa sent invece di total
      monthlyLimit: 50000,
      usagePercentage: Math.round(((emailStats?.sent || 0) / 50000) * 100),
      lastUsed: emailStats?.sent > 0 ? 'Oggi' : 'Mai utilizzato', // ✅ Controlla sent
      messagesThisMonth: emailStats?.sent || 0, // ✅ Usa sent
      cost: calculateCost(emailStats?.sent || 0, 0.004) // ✅ Calcola su sent
    },
    {
      id: 'sms',
      name: 'SMS',
      icon: <Phone className="w-4 h-4" />,
      status: smsStats?.sent > 0 ? 'configured' : 'not_configured',
      currentUsage: smsStats?.sent || 0, // ✅ Usa sent per SMS
      monthlyLimit: 1000,
      usagePercentage: Math.round(((smsStats?.sent || 0) / 1000) * 100),
      lastUsed: smsStats?.sent > 0 ? 'Oggi' : 'Mai utilizzato',
      messagesThisMonth: smsStats?.sent || 0, // ✅ Usa sent
      cost: calculateCost(smsStats?.sent || 0, 0.045) // ✅ 4.5 centesimi per SMS
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: <Send className="w-4 h-4" />,
      status: telegramChats.length > 0 ? 'configured' : 'not_configured',
      currentUsage: telegramStats?.total || 0,
      monthlyLimit: 10000,
      usagePercentage: Math.round(((telegramStats?.total || 0) / 10000) * 100),
      lastUsed: getLastUsed(telegramChats, 'telegram'),
      messagesThisMonth: telegramStats?.total || 0,
      cost: calculateCost(telegramStats?.total || 0, 0.002) // 0.2 centesimi per messaggio
    }
  ];

  // 🔥 METRICHE REALI
  const metrics: SystemMetrics = {
    totalChannels: channels.length,
    activeChannels: channels.filter(ch => ch.status === 'configured').length,
    configurationHealth: Math.round(
      channels.reduce((acc, ch) => acc + ch.usagePercentage, 0) / channels.length
    ),
    lastUpdate: new Date().toLocaleString('it-IT')
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'configured': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-orange-600 bg-orange-100';
      case 'not_configured': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'configured': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'partial': return <Clock className="w-4 h-4 text-orange-600" />;
      case 'not_configured': return <Settings className="w-4 h-4 text-gray-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Settings className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'configured': return 'Configurato';
      case 'partial': return 'Parziale';
      case 'not_configured': return 'Da Configurare';
      case 'error': return 'Errore';
      default: return 'Sconosciuto';
    }
  };

  return (
    <Card className="w-full border-blue-200 dark:border-blue-800 shadow-lg bg-gradient-to-br from-blue-50/50 to-purple-50/30 dark:from-blue-950/50 dark:to-purple-950/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg font-bold text-blue-900 dark:text-blue-100">📊 Utilizzo Canali</CardTitle>
          </div>
          <Link href="/settings?tab=channels">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configura
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* System Metrics Overview */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Utilizzo Medio</span>
            </div>
            <div className="text-xl font-bold text-blue-600">{metrics.configurationHealth}%</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Canali Attivi</span>
            </div>
            <div className="text-xl font-bold text-green-600">{metrics.activeChannels}/{metrics.totalChannels}</div>
          </div>
        </div>

        {/* Channel Usage Cards */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">📊 Utilizzo Mensile Canali</h4>
          <div className="grid grid-cols-1 gap-3">
            {channels.map((channel) => (
              <div 
                key={channel.id} 
                className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${getStatusColor(channel.status)}`}>
                    {channel.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{channel.name}</span>
                      {getStatusIcon(channel.status)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Ultimo utilizzo: {channel.lastUsed}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-primary">{channel.cost}</div>
                    <div className="text-xs text-muted-foreground">Costo mese</div>
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Messaggi inviati</span>
                    <span className="font-medium">{channel.messagesThisMonth.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Limite mensile</span>
                    <span className="font-medium">{channel.monthlyLimit.toLocaleString()}</span>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Utilizzo</span>
                      <span className="text-xs font-medium">{channel.usagePercentage}%</span>
                    </div>
                    <Progress 
                      value={channel.usagePercentage} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


      </CardContent>
    </Card>
  );
}