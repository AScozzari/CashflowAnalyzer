import { useState } from "react";
import { Header } from "@/components/ui/header";
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
import { WhatsAppInterface } from "@/components/communications/whatsapp-interface";
import { SMSInterface } from "@/components/communications/sms-interface";
import { TelegramInterface } from "@/components/communications/telegram-interface";

interface CommunicationStats {
  email: { total: number; unread: number; today: number };
  whatsapp: { total: number; unread: number; today: number };
  sms: { total: number; unread: number; today: number };
  telegram: { total: number; unread: number; today: number };
}

export default function Communications() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Mock stats - da sostituire con dati reali dall'API
  const stats: CommunicationStats = {
    email: { total: 156, unread: 12, today: 8 },
    whatsapp: { total: 89, unread: 5, today: 15 },
    sms: { total: 34, unread: 2, today: 3 },
    telegram: { total: 67, unread: 8, today: 6 }
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
        action={null}
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

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Attività Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Mock recent activities */}
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="text-green-600">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Nuovo messaggio WhatsApp</p>
                    <p className="text-xs text-muted-foreground">da +39 xxx xxx xxxx - 5 minuti fa</p>
                  </div>
                  <Badge variant="outline">WhatsApp</Badge>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="text-blue-600">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Email ricevuta</p>
                    <p className="text-xs text-muted-foreground">da cliente@example.com - 15 minuti fa</p>
                  </div>
                  <Badge variant="outline">Email</Badge>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="text-purple-600">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">SMS inviato</p>
                    <p className="text-xs text-muted-foreground">a +39 xxx xxx xxxx - 1 ora fa</p>
                  </div>
                  <Badge variant="outline">SMS</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
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
          <TelegramInterface />
        </TabsContent>
      </Tabs>
    </div>
  );
}