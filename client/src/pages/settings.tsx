import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EntityConfigHorizontal from "@/components/settings/entity-config-horizontal";
import SystemConfigHorizontal from "@/components/settings/system-config-horizontal";
import { ConnectionStatus } from "@/components/debug/connection-status";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AiSettings from "@/components/settings/ai-settings";
import { ChannelSettings } from "@/components/settings/channel-settings";
import { WebSocketStatus } from "@/components/debug/websocket-status";
import { OpenAIDiagnostic } from "@/components/debug/openai-diagnostic";
import { Download, User, Shield } from "lucide-react";

export default function Settings() {
  return (
    <div className="container mx-auto py-6">
      {/* Header Settings */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Configurazioni Sistema
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestisci entità, AI, canali di comunicazione, backup e configurazioni sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-primary/10 hover:text-primary transition-colors"
            title="Backup System"
          >
            <Download className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-primary/10 hover:text-primary transition-colors"
            title="Account Management"
          >
            <User className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-primary/10 hover:text-primary transition-colors"
            title="Security Settings"
          >
            <Shield className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="entities" className="space-y-6">
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
          <ChannelSettings />
        </TabsContent>

        <TabsContent value="system">
          <SystemConfigHorizontal />
        </TabsContent>

        <TabsContent value="debug">
          <div className="space-y-6">
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
