import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EntityConfigHorizontal from "@/components/settings/entity-config-horizontal";
import { ConnectionStatus } from "@/components/debug/connection-status";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AiSettings from "@/components/settings/ai-settings";
import { WebSocketStatus } from "@/components/debug/websocket-status";
import { EmailSettings } from "@/components/settings/email-settings";

export default function Settings() {
  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="entities" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="entities">Entity Management</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
          <TabsTrigger value="debug">Connection Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="entities">
          <EntityConfigHorizontal />
        </TabsContent>

        <TabsContent value="ai">
          <AiSettings />
        </TabsContent>

        <TabsContent value="system">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  General system settings and configuration options.
                </p>
              </CardContent>
            </Card>
            
            <EmailSettings />
          </div>
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
