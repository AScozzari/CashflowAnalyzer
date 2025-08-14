import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EntityConfigHorizontal from "@/components/settings/entity-config-horizontal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AiSettings from "@/components/settings/ai-settings";
import { EmailSettings } from "@/components/settings/email-settings";
// Debug components removed
// Cache debug component removed

export default function Settings() {
  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="entities" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="entities">Entity Management</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
          <TabsTrigger value="cache">Cache Manager</TabsTrigger>
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

        <TabsContent value="cache">
          <Card>
            <CardHeader>
              <CardTitle>Cache Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Cache management tools have been integrated into the main application flow.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug">
          <Card>
            <CardHeader>
              <CardTitle>Connection Debug</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Debug components have been removed after resolving connection issues.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
