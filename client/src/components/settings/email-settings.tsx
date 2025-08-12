import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmailSettingsSchema, type InsertEmailSettings } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, TestTube, Settings, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface EmailSettingsData {
  fromEmail?: string;
  fromName?: string;
  replyToEmail?: string;
  provider?: string;
  sendgridApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
}

export function EmailSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const { data: emailSettings, isLoading } = useQuery<EmailSettingsData>({
    queryKey: ['/api/email-settings'],
  });

  const form = useForm<InsertEmailSettings>({
    resolver: zodResolver(insertEmailSettingsSchema),
    defaultValues: {
      fromEmail: "",
      fromName: "",
      replyToEmail: "",
      provider: "sendgrid",
      sendgridApiKey: "",
      smtpHost: "",
      smtpPort: 587,
      smtpUsername: "",
      smtpPassword: "",
    },
  });

  // Update form when data loads
  React.useEffect(() => {
    if (emailSettings) {
      form.reset({
        fromEmail: emailSettings.fromEmail || "",
        fromName: emailSettings.fromName || "",
        replyToEmail: emailSettings.replyToEmail || "",
        provider: (emailSettings.provider as "sendgrid" | "smtp") || "sendgrid",
        sendgridApiKey: emailSettings.sendgridApiKey === '***CONFIGURED***' ? '' : emailSettings.sendgridApiKey || "",
        smtpHost: emailSettings.smtpHost || "",
        smtpPort: emailSettings.smtpPort || 587,
        smtpUsername: emailSettings.smtpUsername || "",
        smtpPassword: emailSettings.smtpPassword === '***CONFIGURED***' ? '' : emailSettings.smtpPassword || "",
      });
    }
  }, [emailSettings, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: InsertEmailSettings) => {
      const response = await apiRequest("POST", "/api/email-settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-settings'] });
      toast({
        title: "Successo",
        description: "Impostazioni email salvate con successo",
      });
      setTestStatus('idle');
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/email-settings/test");
      return response.json();
    },
    onSuccess: (data) => {
      setTestStatus(data.success ? 'success' : 'error');
      toast({
        title: data.success ? "Test riuscito" : "Test fallito",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      setTestStatus('error');
      toast({
        title: "Errore nel test",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEmailSettings) => {
    // Se i campi password/API key sono vuoti ma c'erano configurazioni precedenti, mantieni quelle esistenti
    const finalData = { ...data };
    if (emailSettings) {
      if (!data.sendgridApiKey && emailSettings.sendgridApiKey === '***CONFIGURED***') {
        delete finalData.sendgridApiKey;
      }
      if (!data.smtpPassword && emailSettings.smtpPassword === '***CONFIGURED***') {
        delete finalData.smtpPassword;
      }
    }
    saveMutation.mutate(finalData);
  };

  const handleTest = () => {
    setTestStatus('testing');
    testMutation.mutate();
  };

  const provider = form.watch("provider");

  if (isLoading) {
    return <div>Caricamento impostazioni email...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Configurazione Email
        </CardTitle>
        <CardDescription>
          Configura le impostazioni per l'invio di email (recupero password, notifiche, ecc.)
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
                  <FormLabel>Provider Email</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="smtp">SMTP Generico</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Basic Email Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Mittente</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="noreply@tuodominio.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fromName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Mittente</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="EasyCashFlows" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="replyToEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email di Risposta (opzionale)</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="support@tuodominio.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SendGrid Settings */}
            {provider === "sendgrid" && (
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
                <h4 className="font-medium text-blue-900">Configurazione SendGrid</h4>
                <FormField
                  control={form.control}
                  name="sendgridApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key SendGrid</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password" 
                          value={field.value || ""}
                          placeholder={emailSettings?.sendgridApiKey === '***CONFIGURED***' ? "••••••••••••••••" : "SG.xxxxxxxxxxxxxxxx"} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* SMTP Settings */}
            {provider === "smtp" && (
              <div className="space-y-4 p-4 border rounded-lg bg-green-50/50">
                <h4 className="font-medium text-green-900">Configurazione SMTP</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="smtpHost"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Host SMTP</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="smtp.gmail.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smtpPort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porta</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            placeholder="587" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="smtpUsername"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username SMTP</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="username@gmail.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smtpPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password SMTP</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="password" 
                            value={field.value || ""}
                            placeholder={emailSettings?.smtpPassword === '***CONFIGURED***' ? "••••••••••••••••" : "password"} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={saveMutation.isPending}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {saveMutation.isPending ? "Salvataggio..." : "Salva Configurazione"}
              </Button>

              {emailSettings && (
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
                  ✅ Configurazione email verificata con successo
                </p>
              </div>
            )}

            {testStatus === 'error' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  ❌ Errore nella configurazione email. Verifica i parametri.
                </p>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default EmailSettings;