import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, FileText } from 'lucide-react';
import { WhatsAppSettingsSimple } from './whatsapp-settings-simple';
import { WhatsAppTemplates } from './whatsapp-templates';

export function WhatsAppSettingsWithTabs() {
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Impostazioni
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <WhatsAppSettingsSimple />
        </TabsContent>

        <TabsContent value="templates">
          <WhatsAppTemplates />
        </TabsContent>
      </Tabs>
    </div>
  );
}