import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, 
  BarChart3, 
  FileText, 
  Settings, 
  Calendar,
  Send,
  Download,
  Upload,
  Webhook
} from 'lucide-react';

interface Analytics {
  totalMessages: number;
  sentMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  totalCost: number;
  averageDeliveryTime: number;
  topDestinations: Array<{ country: string; count: number }>;
}

export default function AdvancedWhatsAppTest() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageResponse, setMessageResponse] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // Test analytics endpoint
  const testAnalytics = async (period: '24h' | '7d' | '30d' = '24h') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/whatsapp/analytics/${period}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
        addTestResult(`✅ Analytics (${period}) loaded successfully`);
      } else {
        addTestResult(`❌ Analytics failed: ${response.status}`);
      }
    } catch (error) {
      addTestResult(`❌ Analytics error: ${error}`);
    }
    setLoading(false);
  };

  // Test Content API templates
  const testTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/content/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
        addTestResult(`✅ Content templates loaded: ${data.length} templates`);
      } else {
        addTestResult(`❌ Templates failed: ${response.status}`);
      }
    } catch (error) {
      addTestResult(`❌ Templates error: ${error}`);
    }
    setLoading(false);
  };

  // Test message scheduling
  const testScheduleMessage = async () => {
    setLoading(true);
    const testMessage = {
      to: '+15558237341', // Test number
      scheduleTime: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      type: 'template',
      content: {
        templateName: 'testwap',
        templateLanguage: 'it',
        templateVariables: {}
      }
    };

    try {
      const response = await fetch('/api/whatsapp/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMessage)
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessageResponse(data);
        addTestResult(`✅ Message scheduled successfully`);
      } else {
        const error = await response.json();
        addTestResult(`❌ Schedule failed: ${error.error}`);
      }
    } catch (error) {
      addTestResult(`❌ Schedule error: ${error}`);
    }
    setLoading(false);
  };

  // Test webhook endpoint
  const testWebhook = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/webhook', {
        method: 'GET'
      });
      
      if (response.ok) {
        const text = await response.text();
        addTestResult(`✅ Webhook endpoint verified: ${text}`);
      } else {
        addTestResult(`❌ Webhook failed: ${response.status}`);
      }
    } catch (error) {
      addTestResult(`❌ Webhook error: ${error}`);
    }
    setLoading(false);
  };

  // Test messaging service creation
  const testMessagingService = async () => {
    setLoading(true);
    const serviceData = {
      friendlyName: 'EasyCashFlows Service',
      inboundRequestUrl: 'https://your-domain.replit.app/api/whatsapp/webhook',
      statusCallback: 'https://your-domain.replit.app/api/whatsapp/webhook'
    };

    try {
      const response = await fetch('/api/whatsapp/messaging-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });
      
      if (response.ok) {
        const data = await response.json();
        addTestResult(`✅ Messaging Service created: ${data.sid}`);
      } else {
        const error = await response.json();
        addTestResult(`❌ Messaging Service failed: ${error.error}`);
      }
    } catch (error) {
      addTestResult(`❌ Messaging Service error: ${error}`);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Advanced WhatsApp API Test Suite</h1>
        <p className="text-muted-foreground">
          Comprehensive testing of all Twilio WhatsApp Professional features
        </p>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content API
          </TabsTrigger>
          <TabsTrigger value="messaging" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Messaging Services
          </TabsTrigger>
          <TabsTrigger value="scheduling" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduling
          </TabsTrigger>
          <TabsTrigger value="webhook" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Message Analytics & Monitoring</CardTitle>
              <CardDescription>
                Real-time analytics and insights from Twilio API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={() => testAnalytics('24h')} disabled={loading}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  24 Hours
                </Button>
                <Button onClick={() => testAnalytics('7d')} disabled={loading}>
                  7 Days
                </Button>
                <Button onClick={() => testAnalytics('30d')} disabled={loading}>
                  30 Days
                </Button>
              </div>

              {analytics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{analytics.totalMessages}</div>
                      <div className="text-sm text-muted-foreground">Total Messages</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">{analytics.deliveredMessages}</div>
                      <div className="text-sm text-muted-foreground">Delivered</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-red-600">{analytics.failedMessages}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">${analytics.totalCost.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Total Cost</div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content API Templates</CardTitle>
              <CardDescription>
                Manage WhatsApp message templates via Twilio Content API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testTemplates} disabled={loading}>
                <Download className="h-4 w-4 mr-2" />
                Load Templates
              </Button>

              {templates.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Available Templates:</h4>
                  {templates.map((template, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{template.friendly_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Language: {template.language} | SID: {template.sid}
                        </div>
                      </div>
                      <Badge variant={template.status === 'approved' ? 'default' : 'secondary'}>
                        {template.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messaging">
          <Card>
            <CardHeader>
              <CardTitle>Messaging Services</CardTitle>
              <CardDescription>
                Advanced features like sender pools and link shortening
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testMessagingService} disabled={loading}>
                <Settings className="h-4 w-4 mr-2" />
                Create Messaging Service
              </Button>
              
              <div className="text-sm text-muted-foreground">
                This will create a new Messaging Service with webhook configuration
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduling">
          <Card>
            <CardHeader>
              <CardTitle>Message Scheduling</CardTitle>
              <CardDescription>
                Schedule messages for future delivery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testScheduleMessage} disabled={loading}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Test Message
              </Button>

              {messageResponse && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="font-medium text-green-800">Message Scheduled Successfully</div>
                  <div className="text-sm text-green-600">
                    Message ID: {messageResponse.messageId}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Management</CardTitle>
              <CardDescription>
                Test webhook endpoints for delivery receipts and incoming messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testWebhook} disabled={loading}>
                <Webhook className="h-4 w-4 mr-2" />
                Test Webhook Endpoint
              </Button>

              <div className="text-sm text-muted-foreground">
                Webhook URL: <code>/api/whatsapp/webhook</code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Results Log */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results Log</CardTitle>
          <CardDescription>Real-time test execution results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40 overflow-y-auto bg-gray-50 p-3 rounded border">
            {testResults.length > 0 ? (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {result}
                </div>
              ))
            ) : (
              <div className="text-muted-foreground text-sm">
                Test results will appear here...
              </div>
            )}
          </div>
          <Button 
            onClick={() => setTestResults([])} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Clear Log
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}