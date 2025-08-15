import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, TestTube, CheckCircle, XCircle, Shield, Globe, Phone, AlertTriangle, ExternalLink, Clock } from 'lucide-react';
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
            
            {/* Provider Selection con Raccomandazioni */}
            <div className="space-y-4">
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
                            <Phone className="w-4 h-4 text-blue-600" />
                            <div>
                              <div className="font-medium">Twilio <Badge variant="outline" className="ml-1">Raccomandato</Badge></div>
                              <div className="text-xs text-gray-500">Prezzi trasparenti da $0.005/msg, API stabile, supporto eccellente</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="linkmobility">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-green-600" />
                            <div>
                              <div className="font-medium">LinkMobility <Badge variant="outline" className="ml-1">GDPR EU</Badge></div>
                              <div className="text-xs text-gray-500">Provider europeo, server UE, compliance GDPR nativa</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Provider Info Alert */}
              {form.watch('provider') === 'twilio' && (
                <Alert>
                  <Phone className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Twilio WhatsApp Business API:</strong> Richiede approvazione Business Profile da Meta. 
                    Tempi: 1-3 giorni lavorativi. Template messaggi necessitano pre-approvazione (24-48h).
                    <a href="https://console.twilio.com" target="_blank" className="text-blue-600 hover:underline ml-2">
                      Console Twilio <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </AlertDescription>
                </Alert>
              )}
              
              {form.watch('provider') === 'linkmobility' && (
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    <strong>LinkMobility WhatsApp Business:</strong> Provider europeo con server in UE. 
                    Processo approvazione Business Profile: 2-5 giorni. Compliance GDPR garantita.
                    <a href="https://www.linkmobility.com" target="_blank" className="text-green-600 hover:underline ml-2">
                      Portal LinkMobility <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </AlertDescription>
                </Alert>
              )}
            </div>

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

            {/* Business Manager Setup - Parte Critica */}
            <div className="space-y-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg border-2 border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Business Manager & Numero WhatsApp Business
                </h4>
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Setup Critico
                </Badge>
              </div>
              
              <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>IMPORTANTE:</strong> Il numero WhatsApp deve essere collegato a Business Manager Meta.
                  Senza Business Manager verificato, l'API non funziona. Processo: Business Manager → WhatsApp Business API → Numero verificato.
                </AlertDescription>
              </Alert>

              <FormField
                control={form.control}
                name="businessDisplayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Business (Business Manager)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="EasyCashFlows S.r.l." />
                    </FormControl>
                    <p className="text-xs text-gray-600">Deve corrispondere al nome registrato in Business Manager Meta</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessAbout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione Business (per Approvazione)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Software gestione finanziaria per PMI italiane. Analisi cashflow, fatturazione elettronica, compliance fiscale."
                        rows={3}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-600">Descrizione chiara per approvazione Meta/Twilio</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessWebsite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sito Web Business (Verificato)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://easycashflows.com" />
                    </FormControl>
                    <p className="text-xs text-gray-600">Dominio deve essere verificato in Business Manager</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <h5 className="font-medium text-sm mb-2">Checklist Business Manager:</h5>
                <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-300">
                  <li>• Account Business Manager Meta creato e verificato</li>
                  <li>• Documento azienda (Visura camerale/Partita IVA) caricato</li>
                  <li>• Sito web dominio verificato in Business Manager</li>
                  <li>• Numero telefono business registrato e verificato</li>
                  <li>• WhatsApp Business API app creata nel Business Manager</li>
                </ul>
              </div>
            </div>

            {/* Numero WhatsApp Business - Processo Dettagliato */}
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Numero WhatsApp Business (Processo Completo)
              </h4>

              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Processo Numero WhatsApp:</strong><br/>
                  1. Registra numero su WhatsApp Business (app mobile)<br/>
                  2. Aggiungi numero al Business Manager Meta<br/>
                  3. Richiedi migrazione a WhatsApp Business API<br/>
                  4. Configura numero su Twilio/LinkMobility<br/>
                  <strong>Tempo totale: 3-7 giorni lavorativi</strong>
                </AlertDescription>
              </Alert>

              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero WhatsApp Business API</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          {...field}
                          placeholder="+393451234567"
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <p className="text-xs text-gray-600">
                      Numero deve essere: registrato su WhatsApp Business → Business Manager → migrato a API
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <h5 className="font-medium text-sm mb-2">Status Numero Business:</h5>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">Da Verificare</Badge>
                  <span className="text-gray-600">• Business Manager: Non collegato</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <Badge variant="outline">Da Verificare</Badge>
                  <span className="text-gray-600">• API Migration: Non completata</span>
                </div>
              </div>
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