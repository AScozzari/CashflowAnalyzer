import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Plus, Settings, MessageSquare, TestTube, CheckCircle, XCircle, Clock, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';

// Schema for provider configuration
const providerSchema = z.object({
  provider: z.enum(['twilio', 'linkmobility']),
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioPhoneNumber: z.string().optional(),
  linkmobilityApiKey: z.string().optional(),
  linkmobilityUsername: z.string().optional(),
  linkmobilityEndpoint: z.string().optional(),
  whatsappBusinessAccountId: z.string().optional(),
  whatsappPhoneNumberId: z.string().optional(),
  metaAccessToken: z.string().optional(),
});

// Schema for template creation
const templateSchema = z.object({
  name: z.string().min(1, 'Nome template richiesto'),
  category: z.enum(['marketing', 'utility', 'authentication']),
  language: z.string().default('it'),
  header: z.string().max(60, 'Header max 60 caratteri').optional(),
  body: z.string().min(1, 'Body richiesto').max(1024, 'Body max 1024 caratteri'),
  footer: z.string().max(60, 'Footer max 60 caratteri').optional(),
});

type ProviderFormData = z.infer<typeof providerSchema>;
type TemplateFormData = z.infer<typeof templateSchema>;

interface WhatsappProvider {
  id: string;
  provider: 'twilio' | 'linkmobility';
  isActive: boolean;
  twilioPhoneNumber?: string;
  linkmobilityUsername?: string;
  createdAt: string;
}

interface WhatsappTemplate {
  id: string;
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  status: 'pending' | 'approved' | 'rejected' | 'paused';
  language: string;
  header?: string;
  body: string;
  footer?: string;
  rejectionReason?: string;
  createdAt: string;
}

export function WhatsAppSettings() {
  const [activeTab, setActiveTab] = useState('providers');
  const [editingTemplate, setEditingTemplate] = useState<WhatsappTemplate | null>(null);
  const { toast } = useToast();

  // Queries
  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ['/api/whatsapp/providers'],
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/whatsapp/templates'],
  });

  // Provider Form
  const providerForm = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      provider: 'twilio',
      language: 'it',
    },
  });

  // Template Form
  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      category: 'utility',
      language: 'it',
    },
  });

  // Mutations
  const createProviderMutation = useMutation({
    mutationFn: (data: ProviderFormData) => apiRequest('/api/whatsapp/providers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({ title: 'Provider configurato con successo' });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/providers'] });
      providerForm.reset();
    },
    onError: (error) => {
      toast({ 
        title: 'Errore configurazione provider', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const testProviderMutation = useMutation({
    mutationFn: (providerId: string) => apiRequest(`/api/whatsapp/providers/${providerId}/test`, {
      method: 'POST',
    }),
    onSuccess: (data) => {
      toast({ 
        title: data.success ? 'Connessione riuscita' : 'Connessione fallita',
        description: data.error || 'Provider configurato correttamente',
        variant: data.success ? 'default' : 'destructive'
      });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data: TemplateFormData) => apiRequest('/api/whatsapp/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({ title: 'Template creato e inviato per approvazione' });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/templates'] });
      templateForm.reset();
      setEditingTemplate(null);
    },
    onError: (error) => {
      toast({ 
        title: 'Errore creazione template', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => apiRequest(`/api/whatsapp/templates/${templateId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      toast({ title: 'Template eliminato' });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/templates'] });
    },
  });

  // Handlers
  const onSubmitProvider = (data: ProviderFormData) => {
    createProviderMutation.mutate(data);
  };

  const onSubmitTemplate = (data: TemplateFormData) => {
    createTemplateMutation.mutate(data);
  };

  const handleEditTemplate = (template: WhatsappTemplate) => {
    setEditingTemplate(template);
    templateForm.reset({
      name: template.name,
      category: template.category,
      language: template.language,
      header: template.header || '',
      body: template.body,
      footer: template.footer || '',
    });
    setActiveTab('templates');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'In attesa' },
      approved: { variant: 'default' as const, icon: CheckCircle, label: 'Approvato' },
      rejected: { variant: 'destructive' as const, icon: XCircle, label: 'Rifiutato' },
      paused: { variant: 'outline' as const, icon: Clock, label: 'Sospeso' },
    };
    
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      marketing: 'Marketing',
      utility: 'Utility',
      authentication: 'Autenticazione',
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp Business</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Configura provider e template per notifiche WhatsApp
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Provider
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Template
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Regole Notifica
          </TabsTrigger>
        </TabsList>

        {/* Provider Configuration */}
        <TabsContent value="providers" className="space-y-6">
          {/* Existing Providers */}
          {providers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Provider Configurati</h3>
              <div className="grid gap-4">
                {providers.map((provider: WhatsappProvider) => (
                  <Card key={provider.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <div>
                            <p className="font-medium capitalize">
                              {provider.provider}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {provider.provider === 'twilio' 
                                ? provider.twilioPhoneNumber 
                                : provider.linkmobilityUsername}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={provider.isActive ? 'default' : 'secondary'}>
                            {provider.isActive ? 'Attivo' : 'Inattivo'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testProviderMutation.mutate(provider.id)}
                            disabled={testProviderMutation.isPending}
                            data-testid={`button-test-provider-${provider.id}`}
                          >
                            <TestTube className="w-4 h-4 mr-2" />
                            Test
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Add New Provider */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Nuovo Provider WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...providerForm}>
                <form onSubmit={providerForm.handleSubmit(onSubmitProvider)} className="space-y-4">
                  <FormField
                    control={providerForm.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provider</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-provider">
                              <SelectValue placeholder="Seleziona provider" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="twilio">Twilio (Consigliato)</SelectItem>
                            <SelectItem value="linkmobility">LinkMobility</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Twilio è consigliato per pricing trasparente e volume discounts
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Twilio Configuration */}
                  {providerForm.watch('provider') === 'twilio' && (
                    <>
                      <FormField
                        control={providerForm.control}
                        name="twilioAccountSid"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Twilio Account SID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" data-testid="input-twilio-sid" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={providerForm.control}
                        name="twilioAuthToken"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Twilio Auth Token</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" placeholder="Auth Token" data-testid="input-twilio-token" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={providerForm.control}
                        name="twilioPhoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Numero WhatsApp Business</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+1234567890" data-testid="input-twilio-phone" />
                            </FormControl>
                            <FormDescription>
                              Numero WhatsApp Business approvato da Twilio
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {/* LinkMobility Configuration */}
                  {providerForm.watch('provider') === 'linkmobility' && (
                    <>
                      <FormField
                        control={providerForm.control}
                        name="linkmobilityApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkMobility API Key</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" placeholder="API Key" data-testid="input-link-api-key" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={providerForm.control}
                        name="linkmobilityUsername"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Username" data-testid="input-link-username" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={providerForm.control}
                        name="linkmobilityEndpoint"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endpoint</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://api.linkmobility.com" data-testid="input-link-endpoint" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <Button 
                    type="submit" 
                    disabled={createProviderMutation.isPending}
                    data-testid="button-save-provider"
                  >
                    {createProviderMutation.isPending ? 'Salvando...' : 'Salva Provider'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Template Management */}
        <TabsContent value="templates" className="space-y-6">
          {/* Existing Templates */}
          {templates.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Template Esistenti</h3>
              <div className="grid gap-4">
                {templates.map((template: WhatsappTemplate) => (
                  <Card key={template.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{template.name}</h4>
                            {getStatusBadge(template.status)}
                            <Badge variant="outline">{getCategoryLabel(template.category)}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {template.body}
                          </p>
                          {template.rejectionReason && (
                            <Alert>
                              <XCircle className="w-4 h-4" />
                              <AlertDescription>{template.rejectionReason}</AlertDescription>
                            </Alert>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                            data-testid={`button-edit-template-${template.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTemplateMutation.mutate(template.id)}
                            disabled={deleteTemplateMutation.isPending}
                            data-testid={`button-delete-template-${template.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Create/Edit Template */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {editingTemplate ? 'Modifica Template' : 'Nuovo Template'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertDescription>
                  <strong>GDPR & WhatsApp Policy:</strong> Template devono essere transazionali 
                  (conferme ordini, promemoria appuntamenti). Marketing e sondaggi non sono permessi.
                </AlertDescription>
              </Alert>

              <Form {...templateForm}>
                <form onSubmit={templateForm.handleSubmit(onSubmitTemplate)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={templateForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Template</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="invoice_due_reminder" data-testid="input-template-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={templateForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-template-category">
                                <SelectValue placeholder="Seleziona categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="utility">Utility (Consigliato)</SelectItem>
                              <SelectItem value="authentication">Autenticazione</SelectItem>
                              <SelectItem value="marketing">Marketing</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={templateForm.control}
                    name="header"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Header (Opzionale)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Promemoria Fattura" maxLength={60} data-testid="input-template-header" />
                        </FormControl>
                        <FormDescription>Max 60 caratteri</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={templateForm.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Corpo Messaggio</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Gentile {{customer_name}}, la fattura n. {{invoice_number}} scade il {{due_date}}."
                            className="min-h-[100px]"
                            maxLength={1024}
                            data-testid="textarea-template-body"
                          />
                        </FormControl>
                        <FormDescription>
                          Max 1024 caratteri. Usa {{variabile}} per contenuto dinamico.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={templateForm.control}
                    name="footer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Footer (Opzionale)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="EasyCashFlows" maxLength={60} data-testid="input-template-footer" />
                        </FormControl>
                        <FormDescription>Max 60 caratteri</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={createTemplateMutation.isPending}
                      data-testid="button-save-template"
                    >
                      {createTemplateMutation.isPending ? 'Salvando...' : 'Salva Template'}
                    </Button>
                    {editingTemplate && (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setEditingTemplate(null);
                          templateForm.reset();
                        }}
                        data-testid="button-cancel-edit"
                      >
                        Annulla
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Rules */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Regole Notifica</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Configura quando e come inviare notifiche WhatsApp automatiche
              </p>
              <Badge variant="secondary">Coming Soon</Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}