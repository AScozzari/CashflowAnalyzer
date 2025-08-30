import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Receipt, 
  Cloud, 
  Settings, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Building,
  Key,
  Globe,
  Activity,
  Zap,
  Shield,
  Link as LinkIcon,
  Trash2,
  RefreshCw
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

// Schema per la configurazione provider
const providerSchema = z.object({
  companyId: z.string().min(1, "Seleziona una ragione sociale"),
  providerId: z.string().min(1, "Seleziona un provider"),
  apiKey: z.string().min(1, "API Key richiesta"),
  apiSecret: z.string().optional(),
  clientId: z.string().optional(),
  companyIdExternal: z.string().optional(),
  isActive: z.boolean().default(false),
});

type ProviderFormData = z.infer<typeof providerSchema>;

export function InvoicingProvidersSettings() {
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      isActive: false,
    },
  });

  // Fetch providers disponibili
  const { data: availableProviders } = useQuery({
    queryKey: ['/api/invoicing/providers'],
  });

  // Fetch companies
  const { data: companies } = useQuery({
    queryKey: ['/api/companies'],
  });

  // Fetch configurazioni esistenti
  const { data: configurations, refetch } = useQuery({
    queryKey: ['/api/invoicing/provider-settings'],
  });

  // Mutation per salvare configurazione
  const saveConfigMutation = useMutation({
    mutationFn: (data: ProviderFormData) => 
      apiRequest('/invoicing/provider-settings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Configurazione salvata",
        description: "Provider configurato con successo",
      });
      refetch();
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nel salvataggio della configurazione",
        variant: "destructive",
      });
    },
  });

  // Mutation per test connessione
  const testConnectionMutation = useMutation({
    mutationFn: (configId: string) => 
      apiRequest(`/invoicing/provider-settings/${configId}/test`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      toast({
        title: "Test connessione",
        description: data.success ? "Connessione riuscita" : "Connessione fallita",
        variant: data.success ? "default" : "destructive",
      });
    },
  });

  const onSubmit = (data: ProviderFormData) => {
    saveConfigMutation.mutate(data);
  };

  const toggleCredentialsVisibility = (configId: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [configId]: !prev[configId]
    }));
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'fattureincloud':
        return <Cloud className="h-6 w-6 text-blue-500" />;
      case 'acube':
        return <Receipt className="h-6 w-6 text-emerald-500" />;
      default:
        return <Settings className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusBadge = (isActive: boolean, lastSync?: string) => {
    if (!isActive) {
      return <Badge variant="secondary">Inattivo</Badge>;
    }
    
    if (lastSync) {
      const syncDate = new Date(lastSync);
      const now = new Date();
      const diffHours = (now.getTime() - syncDate.getTime()) / (1000 * 60 * 60);
      
      if (diffHours < 1) {
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Attivo</Badge>;
      } else if (diffHours < 24) {
        return <Badge variant="secondary"><Activity className="h-3 w-3 mr-1" />Sincronizzato</Badge>;
      }
    }
    
    return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Errore</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-emerald-500" />
              <span>Provider Fatturazione Elettronica</span>
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Provider
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Configura Provider Fatturazione</DialogTitle>
                  <DialogDescription>
                    Aggiungi un nuovo provider per la fatturazione elettronica
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="companyId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ragione Sociale *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleziona azienda" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {companies?.map((company: any) => (
                                  <SelectItem key={company.id} value={company.id}>
                                    {company.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="providerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Provider *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleziona provider" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableProviders?.map((provider: any) => (
                                  <SelectItem key={provider.id} value={provider.id}>
                                    <div className="flex items-center space-x-2">
                                      {getProviderIcon(provider.type)}
                                      <span>{provider.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key *</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              {...field} 
                              placeholder="Inserisci la tua API Key"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="apiSecret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Secret</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                {...field} 
                                placeholder="API Secret (se richiesto)"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client ID</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Client ID (se richiesto)"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="companyIdExternal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Azienda Esterno</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="ID azienda nel sistema esterno"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Attivare Provider</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Attiva questo provider per la fatturazione elettronica
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Annulla
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={saveConfigMutation.isPending}
                        className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                      >
                        {saveConfigMutation.isPending ? "Salvando..." : "Salva Configurazione"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configura i provider per l'invio automatico delle fatture elettroniche. 
            Supporto multi-ragione sociale con failover automatico.
          </p>
        </CardContent>
      </Card>

      {/* Provider Disponibili */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-blue-500" />
            <span>Provider Disponibili</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fatture in Cloud */}
            <Card className="border-2 hover:border-blue-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Cloud className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Fatture in Cloud</h3>
                    <p className="text-sm text-muted-foreground">
                      Piattaforma completa per fatturazione elettronica con 580k+ utenti
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary">OAuth 2.0</Badge>
                      <Badge variant="secondary">Multi-Company</Badge>
                      <Badge variant="secondary">API v2</Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Sincronizzazione automatica</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Gestione clienti/fornitori</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Invio SDI automatico</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Controllo stato fatture</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ACube */}
            <Card className="border-2 hover:border-emerald-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <Receipt className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">ACube</h3>
                    <p className="text-sm text-muted-foreground">
                      Servizio certificato per fatturazione elettronica governativa
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary">API Key</Badge>
                      <Badge variant="secondary">Certificato AgID</Badge>
                      <Badge variant="secondary">Gov IT</Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Certificazione AgID</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Conservazione digitale</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Validazione XML</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Backup automatico</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Configurazioni Attive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-purple-500" />
            <span>Configurazioni Attive</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {configurations?.length > 0 ? (
            <div className="space-y-4">
              {configurations.map((config: any) => (
                <Card key={config.id} className="border-l-4 border-l-emerald-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          {getProviderIcon(config.provider?.type)}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold">{config.provider?.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {config.company?.name}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            {getStatusBadge(config.isActive, config.lastSync)}
                            {config.companyIdExternal && (
                              <Badge variant="outline">ID: {config.companyIdExternal}</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testConnectionMutation.mutate(config.id)}
                          disabled={testConnectionMutation.isPending}
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          Test
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleCredentialsVisibility(config.id)}
                        >
                          {showCredentials[config.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>

                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {showCredentials[config.id] && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-xs text-muted-foreground">API Key</Label>
                            <p className="font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              {config.apiKey ? '••••••••••••' + config.apiKey.slice(-4) : 'Non configurata'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Ultima Sincronizzazione</Label>
                            <p className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              {config.lastSync 
                                ? new Date(config.lastSync).toLocaleString('it-IT')
                                : 'Mai sincronizzato'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nessun Provider Configurato
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Configura un provider per iniziare a inviare fatture elettroniche
              </p>
              <Button 
                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Configura Provider
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}