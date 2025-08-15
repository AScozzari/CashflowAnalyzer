import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, TestTube, CheckCircle, XCircle, Shield, Globe, Phone } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { WhatsappSettings, InsertWhatsappSettings } from '@shared/schema';
import { insertWhatsappSettingsSchema } from '@shared/schema';

export function WhatsappSettings() {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query per ottenere le impostazioni WhatsApp
  const { data: whatsappSettings, isLoading } = useQuery<WhatsappSettings>({
    queryKey: ['/api/whatsapp/settings'],
  });

  const form = useForm<InsertWhatsappSettings>({
    resolver: zodResolver(insertWhatsappSettingsSchema),
    defaultValues: {
      provider: 'twilio',
      whatsappNumber: '',
      accountSid: '',
      authToken: '',
      businessDisplayName: '',
      businessAbout: '',
      businessWebsite: '',
      webhookUrl: '',
      verifyToken: '',
      isActive: true
    },
  });

  // Precompila il form con le impostazioni esistenti
  React.useEffect(() => {
    if (whatsappSettings) {
      form.reset({
        provider: whatsappSettings.provider as any,
        whatsappNumber: whatsappSettings.whatsappNumber,
        accountSid: whatsappSettings.accountSid || '',
        authToken: whatsappSettings.authToken || '',
        businessDisplayName: whatsappSettings.businessDisplayName || '',
        businessAbout: whatsappSettings.businessAbout || '',
        businessWebsite: whatsappSettings.businessWebsite || '',
        webhookUrl: whatsappSettings.webhookUrl || '',
        verifyToken: whatsappSettings.verifyToken || '',
        isActive: whatsappSettings.isActive ?? true
      });
    }
  }, [whatsappSettings, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: InsertWhatsappSettings) => {
      return await apiRequest('/api/whatsapp/settings', {
        method: whatsappSettings ? 'PUT' : 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Impostazioni WhatsApp salvate con successo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nel salvataggio delle impostazioni",
        variant: "destructive",
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/whatsapp/test-connection', {
        method: 'POST',
      });
    },
    onSuccess: (data: any) => {
      setTestStatus(data.success ? 'success' : 'error');
      toast({
        title: data.success ? "Successo" : "Errore",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      setTestStatus('error');
      toast({
        title: "Errore",
        description: error.message || "Errore nel test della connessione",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertWhatsappSettings) => {
    saveMutation.mutate(data);
  };

  const handleTest = () => {
    setTestStatus('testing');
    testMutation.mutate();
  };

  if (isLoading) {
    return <div>Caricamento impostazioni WhatsApp...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Configurazione WhatsApp Business API
        </CardTitle>
        <CardDescription>
          Configura WhatsApp Business API per notifiche automatiche e messaggi template
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Provider Selection */}
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider WhatsApp Business API</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="twilio">
                        <div className="flex items-center gap-2">
                          <span>📞</span>
                          <div>
                            <div className="font-medium">Twilio</div>
                            <div className="text-xs text-gray-500">Prezzi trasparenti, documentazione eccellente</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="linkmobility">
                        <div className="flex items-center gap-2">
                          <span>🔗</span>
                          <div>
                            <div className="font-medium">LinkMobility</div>
                            <div className="text-xs text-gray-500">Provider europeo, compliant GDPR</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="meta">
                        <div className="flex items-center gap-2">
                          <span>🟢</span>
                          <div>
                            <div className="font-medium">Meta (WhatsApp Cloud API)</div>
                            <div className="text-xs text-gray-500">API ufficiale Meta, più economica</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* WhatsApp Number */}
            <FormField
              control={form.control}
              name="whatsappNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numero WhatsApp Business</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        {...field}
                        placeholder="+15551234567"
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Provider-specific fields for Twilio */}
            {form.watch('provider') === 'twilio' && (
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Configurazione Twilio</h4>
                
                <FormField
                  control={form.control}
                  name="accountSid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account SID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="authToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auth Token</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Your Twilio Auth Token" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Business Information */}
            <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Informazioni Business Profile
              </h4>
              
              <FormField
                control={form.control}
                name="businessDisplayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Display Business</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="EasyCashFlows" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessAbout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione Business</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Gestione finanziaria intelligente per PMI italiane"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessWebsite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sito Web Business</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://easycashflows.it" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Webhook Configuration */}
            <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <h4 className="font-medium text-purple-900 dark:text-purple-100 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Configurazione Webhook
              </h4>
              
              <FormField
                control={form.control}
                name="webhookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Webhook</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://your-domain.com/webhook/whatsapp" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="verifyToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token di Verifica</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="your-secure-verify-token" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvataggio..." : "Salva Configurazione"}
              </Button>

              {whatsappSettings && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleTest}
                  disabled={testMutation.isPending || testStatus === 'testing'}
                  className="flex items-center gap-2"
                >
                  {testStatus === 'testing' ? (
                    <TestTube className="h-4 w-4 animate-spin" />
                  ) : testStatus === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : testStatus === 'error' ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  {testStatus === 'testing' ? "Test in corso..." : "Testa Connessione"}
                </Button>
              )}
            </div>

            {/* Status Information */}
            {testStatus === 'success' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  ✅ Configurazione WhatsApp verificata con successo
                </p>
              </div>
            )}

            {testStatus === 'error' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  ❌ Errore nella configurazione WhatsApp. Verifica i parametri.
                </p>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default WhatsappSettings;