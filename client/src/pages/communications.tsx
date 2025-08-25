import { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import { FooterSignature } from "@/components/layout/footer-signature";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Send,
  Phone,
  Users,
  Calendar,
  Search,
  Filter,
  MoreHorizontal
} from "lucide-react";

// Import delle interfacce specifiche per canale
import { EmailInterface } from "@/components/communications/email-interface";
import { WhatsAppInterfaceImproved as WhatsAppInterface } from "@/components/communications/whatsapp-interface-improved";
import { SMSInterface } from "@/components/communications/sms-interface";
import { TelegramInterfaceNew as TelegramInterface } from "@/components/communications/telegram-interface-new";
import RecentActivitiesModal from "@/components/communications/recent-activities-modal";
import { useQuery } from "@tanstack/react-query";

interface CommunicationStats {
  email: { total: number; unread: number; today: number };
  whatsapp: { total: number; unread: number; today: number };
  sms: { total: number; unread: number; today: number };
  telegram: { total: number; unread: number; today: number };
}

export default function Communications() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTelegramChatId, setSelectedTelegramChatId] = useState<string | null>(null);
  
  const communicationsAction = null;

  // Gestione parametri URL per aprire chat specifiche
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const messageId = urlParams.get('messageId');
    
    if (messageId) {
      // Se c'è un messageId, estrai il chat ID e apri telegram
      const chatIdMatch = messageId.match(/telegram_\d+_(.+)/);
      if (chatIdMatch) {
        const telegramChatId = chatIdMatch[1];
        setSelectedTelegramChatId(telegramChatId);
        setActiveTab("telegram");
        // Pulisce il parametro URL
        window.history.replaceState({}, '', '/communications');
      }
    }
  }, []);

  // 🔥 DATI REALI - Fetch delle statistiche WhatsApp
  const { data: whatsappStats } = useQuery<{total: number; unread: number; today: number}>({
    queryKey: ['/api/whatsapp/stats'],
    select: (data: any) => ({
      total: data?.totalChats || 0,
      unread: data?.unreadMessages || 0,
      today: data?.todayMessages || 0
    }),
    retry: false,
  });

  const { data: whatsappChats = [] } = useQuery<any[]>({
    queryKey: ['/api/whatsapp/chats'],
    retry: false,
  });

  const { data: telegramChats = [] } = useQuery<any[]>({
    queryKey: ['/api/telegram/chats'],
    retry: false,
  });

  const { data: telegramStats } = useQuery<{total: number; unread: number; today: number}>({
    queryKey: ['/api/telegram/stats'],
    select: (data: any) => ({
      total: data?.totalChats || 0,
      unread: data?.unreadMessages || 0, 
      today: data?.todayMessages || 0
    }),
    retry: false,
  });

  // Query per Email stats (usa l'API che abbiamo già implementato)
  const { data: emailStats } = useQuery<{totalEmails: number; unreadEmails: number; todayEmails: number}>({
    queryKey: ['/api/email/stats'],
    select: (data: any) => ({
      totalEmails: data?.total || 0,
      unreadEmails: data?.failed || 0, // failed emails come proxy per unread
      todayEmails: data?.sent || 0
    }),
    retry: false,
  });

  // Query per SMS stats (usa l'API che abbiamo già implementato)
  const { data: smsStats } = useQuery<{totalSms: number; unreadSms: number; todaySms: number}>({
    queryKey: ['/api/sms/stats'],
    select: (data: any) => ({
      totalSms: data?.totalSms || 0,
      unreadSms: data?.failedSms || 0, // failed SMS come proxy per unread  
      todaySms: data?.sentSms || 0
    }),
    retry: false,
  });

  // STATISTICHE REALI - Tutte caricate da API
  const stats: CommunicationStats = {
    email: {
      total: emailStats?.totalEmails || 0,
      unread: emailStats?.unreadEmails || 0, 
      today: emailStats?.todayEmails || 0
    },
    whatsapp: {
      total: whatsappChats.length || 0,
      unread: whatsappChats.filter(chat => chat.unreadCount && chat.unreadCount > 0).length || 0,
      today: whatsappChats.filter(chat => {
        // Conteggio basato su se la chat è stata attiva oggi
        if (chat.lastSeen && (chat.lastSeen === 'Online' || chat.lastSeen.includes('min fa') || chat.lastSeen.includes('ora fa'))) {
          return true;
        }
        return false;
      }).length || 0 // Nessun fallback fake - solo dati reali
    },
    sms: {
      total: smsStats?.totalSms || 0,
      unread: smsStats?.unreadSms || 0,
      today: smsStats?.todaySms || 0
    },
    telegram: {
      total: telegramChats.length || 0,
      unread: telegramChats.filter(chat => chat.messageCount && chat.messageCount > 0).length || 0,
      today: telegramChats.filter(chat => {
        // Conteggio basato su attività recente
        if (chat.lastMessageAt) {
          const lastMessage = new Date(chat.lastMessageAt);
          const today = new Date();
          return lastMessage.toDateString() === today.toDateString();
        }
        return false;
      }).length || 0 // Nessun fallback fake - solo dati reali
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-5 w-5" />;
      case 'whatsapp': return <MessageSquare className="h-5 w-5" />;
      case 'sms': return <Smartphone className="h-5 w-5" />;
      case 'telegram': return <Send className="h-5 w-5" />;
      default: return <Mail className="h-5 w-5" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email': return 'text-blue-600';
      case 'whatsapp': return 'text-green-600';
      case 'sms': return 'text-purple-600';
      case 'telegram': return 'text-cyan-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Header 
        title="Centro Comunicazioni" 
        subtitle="Gestione multi-canale per Email, WhatsApp, SMS e Telegram"
        action={communicationsAction}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="telegram" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Telegram
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(stats).map(([channel, data]) => (
              <Card key={channel} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {channel}
                  </CardTitle>
                  <div className={getChannelColor(channel)}>
                    {getChannelIcon(channel)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{data.total}</span>
                      {data.unread > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {data.unread} non letti
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      +{data.today} oggi
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Azioni Rapide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={() => setActiveTab("email")}
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-20"
                >
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span>Nuova Email</span>
                </Button>
                <Button
                  onClick={() => setActiveTab("whatsapp")}
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-20"
                >
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <span>Chat WhatsApp</span>
                </Button>
                <Button
                  onClick={() => setActiveTab("sms")}
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-20"
                >
                  <Smartphone className="h-5 w-5 text-purple-600" />
                  <span>Invia SMS</span>
                </Button>
                <Button
                  onClick={() => setActiveTab("telegram")}
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-20"
                >
                  <Send className="h-5 w-5 text-cyan-600" />
                  <span>Messaggio Telegram</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities - DATI REALI */}
          <RecentActivitiesModal />
        </TabsContent>

        {/* Email Interface */}
        <TabsContent value="email">
          <EmailInterface />
        </TabsContent>

        {/* WhatsApp Interface */}
        <TabsContent value="whatsapp">
          <WhatsAppInterface />
        </TabsContent>

        {/* SMS Interface */}
        <TabsContent value="sms">
          <SMSInterface />
        </TabsContent>

        {/* Telegram Interface */}
        <TabsContent value="telegram">
          <TelegramInterface 
            selectedChatIdFromUrl={selectedTelegramChatId}
            onChatSelect={setSelectedTelegramChatId}
          />
        </TabsContent>
      </Tabs>
      
      <FooterSignature />
    </div>
  );
}