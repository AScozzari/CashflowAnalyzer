import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, FileText, Settings } from 'lucide-react';
import { WhatsAppSettingsSimple } from './whatsapp-settings-simple';
import { WhatsAppTemplates } from './whatsapp-templates';

export function WhatsAppSettingsWithTabs() {
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Impostazioni
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="variables" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Variabili
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <WhatsAppSettingsSimple />
        </TabsContent>

        <TabsContent value="templates">
          <WhatsAppTemplates />
        </TabsContent>

        <TabsContent value="variables">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Configurazione Variabili Template</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Configura e gestisci le variabili da utilizzare nei template WhatsApp
              </p>
            </div>
            <div>
              {/* WhatsAppVariableConfig component placeholder */}
              <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg border-2 border-dashed border-blue-200">
                <div className="text-center">
                  <Settings className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Sistema Variabili Configurabili
                  </h4>
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    • Definisci significato di {`{{1}}, {{2}}, {{3}}`} per ogni template<br />
                    • Personalizza esempi e descrizioni per ogni variabile<br />
                    • Copia/incolla variabili direttamente nei template<br />
                    • Validazione automatica variabili sequenziali
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}