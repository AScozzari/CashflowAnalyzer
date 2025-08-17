import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Mail, Phone, Send, Settings, Webhook } from 'lucide-react';
import { EmailSettings } from './email-settings';
import { WhatsAppSettingsSimple } from './whatsapp-settings-simple';
import { WhatsAppTemplates } from './whatsapp-templates';

export function ChannelSettings() {
  const [activeTab, setActiveTab] = useState('whatsapp');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Channel Settings</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Configura i canali di comunicazione per notifiche automatiche
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Webhook className="w-3 h-3" />
            Webhook System
          </Badge>
        </div>
      </div>

      {/* Channel Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <span className="font-medium">WhatsApp Business</span>
              </div>
              <Badge variant="default" className="bg-green-600">Implementato</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              API Business + Template Pre-approvati
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Email</span>
              </div>
              <Badge variant="default">Migrato da System Settings</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              SendGrid configurato
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-purple-600" />
                <span className="font-medium">SMS</span>
              </div>
              <Badge variant="outline">Prossimamente</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Twilio SMS API
            </p>
          </CardContent>
        </Card>

        <Card className="border-sky-200 dark:border-sky-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-sky-600" />
                <span className="font-medium">Telegram</span>
              </div>
              <Badge variant="outline">Prossimamente</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Bot API gratuita
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Channel Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="telegram" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Telegram
          </TabsTrigger>
        </TabsList>

        {/* WhatsApp Channel */}
        <TabsContent value="whatsapp">
          <div className="space-y-6">
            <WhatsAppSettingsSimple />
            <Separator />
            <WhatsAppTemplates />
          </div>
        </TabsContent>

        {/* Email Channel */}
        <TabsContent value="email">
          <EmailSettings />
        </TabsContent>

        {/* SMS Channel */}
        <TabsContent value="sms">
          <Card>
            <CardContent className="p-6 text-center">
              <Phone className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">SMS Notifications</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Configura notifiche SMS tramite Twilio per alert urgenti
              </p>
              <Badge variant="secondary">Coming Soon</Badge>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Telegram Channel */}
        <TabsContent value="telegram">
          <Card>
            <CardContent className="p-6 text-center">
              <Send className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Telegram Bot</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Bot Telegram gratuito per notifiche e interazioni automatiche
              </p>
              <Badge variant="secondary">Coming Soon</Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}