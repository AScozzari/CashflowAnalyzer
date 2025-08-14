import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EntityConfigHorizontal from "@/components/settings/entity-config-horizontal";
import { ConnectionStatus } from "@/components/debug/connection-status";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Settings() {
  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="entities" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="entities">Entity Management</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
          <TabsTrigger value="debug">Connection Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="entities">
          <EntityConfigHorizontal />
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                System settings and configuration options will be available here.
              </p>
            </CardContent>
          </Card>
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
