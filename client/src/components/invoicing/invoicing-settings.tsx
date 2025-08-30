import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  FileText, 
  Building, 
  Euro, 
  Calendar, 
  CheckCircle,
  AlertCircle,
  Save,
  RefreshCw
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

// Schema per le impostazioni fatturazione
const invoicingSettingsSchema = z.object({
  defaultCompanyId: z.string().optional(),
  defaultInvoiceTypeId: z.string().optional(),
  defaultPaymentTermsId: z.string().optional(),
  defaultPaymentMethodId: z.string().optional(),
  defaultVatCodeId: z.string().optional(),
  autoNumbering: z.boolean().default(true),
  autoSendToSDI: z.boolean().default(false),
  enableNotifications: z.boolean().default(true),
  requireNotes: z.boolean().default(false),
});

type InvoicingSettingsData = z.infer<typeof invoicingSettingsSchema>;

export function InvoicingSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<InvoicingSettingsData>({
    resolver: zodResolver(invoicingSettingsSchema),
    defaultValues: {
      autoNumbering: true,
      autoSendToSDI: false,
      enableNotifications: true,
      requireNotes: false,
    },
  });

  // Fetch current settings
  const { data: settings, refetch } = useQuery({
    queryKey: ['/api/invoicing/settings'],
    onSuccess: (data) => {
      if (data) {
        form.reset(data);
      }
    },
  });

  // Fetch dropdown data
  const { data: companies } = useQuery({
    queryKey: ['/api/companies'],
  });

  const { data: invoiceTypes } = useQuery({
    queryKey: ['/api/invoicing/types'],
  });

  const { data: paymentTerms } = useQuery({
    queryKey: ['/api/invoicing/payment-terms'],
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['/api/invoicing/payment-methods'],
  });

  const { data: vatCodes } = useQuery({
    queryKey: ['/api/invoicing/vat-codes'],
  });

  // Mutation per salvare impostazioni
  const saveSettingsMutation = useMutation({
    mutationFn: (data: InvoicingSettingsData) => 
      apiRequest('/invoicing/settings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Impostazioni salvate",
        description: "Le impostazioni di fatturazione sono state aggiornate",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nel salvataggio delle impostazioni",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvoicingSettingsData) => {
    saveSettingsMutation.mutate(data);
  };

  const resetToDefaults = () => {
    form.reset({
      autoNumbering: true,
      autoSendToSDI: false,
      enableNotifications: true,
      requireNotes: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-500" />
            <span>Configurazione Fatturazione</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configura le impostazioni predefinite per la creazione e gestione delle fatture elettroniche.
          </p>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Valori Predefiniti */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Valori Predefiniti</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="defaultCompanyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ragione Sociale Predefinita</FormLabel>
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
                  name="defaultInvoiceTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Documento Predefinito</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {invoiceTypes?.map((type: any) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.code} - {type.name}
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
                  name="defaultPaymentTermsId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Termini di Pagamento Predefiniti</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona termini" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentTerms?.map((term: any) => (
                            <SelectItem key={term.id} value={term.id}>
                              {term.name} ({term.days} giorni)
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
                  name="defaultPaymentMethodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modalità di Pagamento Predefinita</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona modalità" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentMethods?.map((method: any) => (
                            <SelectItem key={method.id} value={method.id}>
                              {method.name}
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
                  name="defaultVatCodeId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Codice IVA Predefinito</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona IVA" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vatCodes?.map((vat: any) => (
                            <SelectItem key={vat.id} value={vat.id}>
                              {vat.percentage}% - {vat.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Automazioni */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <RefreshCw className="h-5 w-5" />
                <span>Automazioni</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="autoNumbering"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Numerazione Automatica</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Assegna automaticamente il numero progressivo alle fatture
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

              <FormField
                control={form.control}
                name="autoSendToSDI"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Invio Automatico al SDI</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Invia automaticamente le fatture al Sistema di Interscambio
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

              <FormField
                control={form.control}
                name="enableNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Notifiche Attive</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Ricevi notifiche per cambi di stato delle fatture
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

              <FormField
                control={form.control}
                name="requireNotes"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Note Obbligatorie</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Richiedi sempre l'inserimento di note nelle fatture
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
            </CardContent>
          </Card>

          {/* Stato Sistema */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Stato Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="font-medium text-green-900 dark:text-green-100">Sistema Attivo</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Fatturazione operativa</p>
                </div>
                
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="font-medium text-blue-900 dark:text-blue-100">Codici IVA</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{vatCodes?.length || 0} configurati</p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Building className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="font-medium text-purple-900 dark:text-purple-100">Ragioni Sociali</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">{companies?.length || 0} attive</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Azioni */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={resetToDefaults}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Ripristina Predefiniti
                </Button>
                
                <Button 
                  type="submit" 
                  disabled={saveSettingsMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveSettingsMutation.isPending ? "Salvando..." : "Salva Impostazioni"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}