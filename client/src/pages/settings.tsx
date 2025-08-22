import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/header";
import EntityConfigHorizontal from "@/components/settings/entity-config-horizontal";
import SystemConfigHorizontal from "@/components/settings/system-config-horizontal";
import { GeneralSettings } from "@/components/settings/general-settings";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AiSettings from "@/components/settings/ai-settings";
import { ChannelSettingsCompact } from "@/components/settings/channel-settings-compact";
import { Download, User, Shield } from "lucide-react";
import { FooterSignature } from "@/components/layout/footer-signature";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("entities");

  const settingsAction = null;

  return (
    <div className="container mx-auto py-6">
      <Header 
        title="Configurazioni Sistema"
        subtitle="Gestisci entità, AI, canali di comunicazione, backup e configurazioni sistema"
        action={settingsAction}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="entities">Entity Management</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
          <TabsTrigger value="channels">Channel Settings</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="entities">
          <EntityConfigHorizontal />
        </TabsContent>

        <TabsContent value="ai">
          <AiSettings />
        </TabsContent>

        <TabsContent value="channels">
          <ChannelSettingsCompact />
        </TabsContent>

        <TabsContent value="system">
          <SystemConfigHorizontal />
        </TabsContent>

      </Tabs>
      <FooterSignature />
    </div>
  );
}
