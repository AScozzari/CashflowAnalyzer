import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/header";
import EntityConfigHorizontal from "@/components/settings/entity-config-horizontal";
import SystemConfigHorizontal from "@/components/settings/system-config-horizontal";
import { GeneralSettings } from "@/components/settings/general-settings";
import { ConnectionStatus } from "@/components/debug/connection-status";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AiSettings from "@/components/settings/ai-settings";
import { ChannelSettingsDynamic } from "@/components/settings/channel-settings-dynamic";
import { WebSocketStatus } from "@/components/debug/websocket-status";
import { OpenAIDiagnostic } from "@/components/debug/openai-diagnostic";
import { WebhookDiagnostics } from "@/components/debug/webhook-diagnostics";
import { Download, User, Shield } from "lucide-react";

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="entities">Entity Management</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
          <TabsTrigger value="channels">Channel Settings</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
          <TabsTrigger value="debug">Connection Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="entities">
          <EntityConfigHorizontal />
        </TabsContent>

        <TabsContent value="ai">
          <AiSettings />
        </TabsContent>

        <TabsContent value="channels">
          <ChannelSettingsDynamic />
        </TabsContent>

        <TabsContent value="system">
          <SystemConfigHorizontal />
        </TabsContent>

        <TabsContent value="debug">
          <div className="space-y-6">
            <WebhookDiagnostics />
            
            <Card>
              <CardHeader>
                <CardTitle>Replit Connection Diagnostic</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Use this tool to diagnose "Connection Denied" and hot reload issues specific to the Replit environment.
                </p>
                <ConnectionStatus />
              </CardContent>
            </Card>
            
            <WebSocketStatus />
            
            <OpenAIDiagnostic />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
