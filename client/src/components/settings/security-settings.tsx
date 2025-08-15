import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Clock, Key, Eye, Settings, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Security Settings Schema
const securitySettingsSchema = z.object({
  // Session Management
  sessionTimeout: z.number().min(300).max(86400),
  maxConcurrentSessions: z.number().min(1).max(10),
  enforceSessionTimeout: z.boolean(),
  
  // Password Policy
  passwordMinLength: z.number().min(6).max(128),
  passwordRequireUppercase: z.boolean(),
  passwordRequireLowercase: z.boolean(),
  passwordRequireNumbers: z.boolean(),
  passwordRequireSymbols: z.boolean(),
  passwordExpiryDays: z.number().min(0).max(365),
  passwordHistoryCount: z.number().min(0).max(20),
  
  // Two-Factor Authentication
  twoFactorEnabled: z.boolean(),
  twoFactorMandatoryForAdmin: z.boolean(),
  twoFactorMandatoryForFinance: z.boolean(),
  
  // Rate Limiting
  loginAttemptsLimit: z.number().min(3).max(20),
  loginBlockDuration: z.number().min(300).max(86400),
  apiRateLimit: z.number().min(10).max(1000),
  
  // Login Audit
  auditEnabled: z.boolean(),
  auditRetentionDays: z.number().min(30).max(365),
  trackFailedLogins: z.boolean(),
  trackIpChanges: z.boolean(),
  
  // API Security
  jwtExpirationHours: z.number().min(1).max(168),
  refreshTokenExpirationDays: z.number().min(1).max(30),
  apiKeyRotationDays: z.number().min(7).max(365),
});

type SecuritySettingsForm = z.infer<typeof securitySettingsSchema>;

export function SecuritySettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query per ottenere le impostazioni di sicurezza correnti
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/security/settings"],
    queryFn: () => apiRequest("/api/security/settings"),
  });

  // Query per statistiche di sicurezza
  const { data: securityStats } = useQuery({
    queryKey: ["/api/security/stats"],
    queryFn: () => apiRequest("/api/security/stats"),
  });

  const form = useForm<SecuritySettingsForm>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      sessionTimeout: 3600,
      maxConcurrentSessions: 3,
      enforceSessionTimeout: true,
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSymbols: false,
      passwordExpiryDays: 90,
      passwordHistoryCount: 5,
      twoFactorEnabled: false,
      twoFactorMandatoryForAdmin: false,
      twoFactorMandatoryForFinance: false,
      loginAttemptsLimit: 5,
      loginBlockDuration: 900,
      apiRateLimit: 100,
      auditEnabled: true,
      auditRetentionDays: 90,
      trackFailedLogins: true,
      trackIpChanges: true,
      jwtExpirationHours: 24,
      refreshTokenExpirationDays: 7,
      apiKeyRotationDays: 30,
    },
  });

  // Carica le impostazioni esistenti nel form
  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  // Mutation per salvare le impostazioni
  const updateMutation = useMutation({
    mutationFn: (data: SecuritySettingsForm) =>
      apiRequest("/api/security/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Impostazioni salvate",
        description: "Le impostazioni di sicurezza sono state aggiornate con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/security/settings"] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio delle impostazioni.",
        variant: "destructive",
      });
    },
  });

  // Helper per formattare i tempi
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`;
    }
    return `${minutes}m`;
  };

  const onSubmit = (data: SecuritySettingsForm) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="p-6">Caricamento impostazioni di sicurezza...</div>;
  }

  return (
    <div className="space-y-6" data-testid="security-settings">
      {/* Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Panoramica Sicurezza
          </CardTitle>
          <CardDescription>
            Stato generale della sicurezza del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {securityStats?.activeSessions || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Sessioni Attive</div>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {securityStats?.failedLogins24h || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Login Falliti (24h)</div>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {securityStats?.lockedUsers || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Utenti Bloccati</div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {securityStats?.twoFactorUsers || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Utenti con 2FA</div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Session Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Gestione Sessioni
              </CardTitle>
              <CardDescription>
                Configurazione timeout e sessioni concorrenti
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sessionTimeout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeout Sessione (secondi)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-session-timeout"
                        />
                      </FormControl>
                      <FormDescription>
                        Durata: {formatDuration(field.value)}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxConcurrentSessions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Sessioni Concorrenti</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-max-sessions"
                        />
                      </FormControl>
                      <FormDescription>
                        Numero massimo di sessioni per utente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="enforceSessionTimeout"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Timeout Automatico</FormLabel>
                      <FormDescription>
                        Disconnetti automaticamente utenti inattivi
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                        data-testid="switch-enforce-timeout"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Password Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Criteri Password
              </CardTitle>
              <CardDescription>
                Requisiti di sicurezza per le password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="passwordMinLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lunghezza Minima</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-password-length"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passwordExpiryDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scadenza Password (giorni)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-password-expiry"
                        />
                      </FormControl>
                      <FormDescription>
                        0 = mai scade
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="passwordRequireUppercase"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Maiuscole Richieste</FormLabel>
                        <FormDescription>Almeno una maiuscola</FormDescription>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                          data-testid="switch-uppercase"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passwordRequireNumbers"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Numeri Richiesti</FormLabel>
                        <FormDescription>Almeno un numero</FormDescription>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                          data-testid="switch-numbers"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Rate Limiting & Audit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Sicurezza e Audit
              </CardTitle>
              <CardDescription>
                Protezione da attacchi e monitoraggio accessi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="loginAttemptsLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tentativi Login Massimi</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-login-attempts"
                        />
                      </FormControl>
                      <FormDescription>
                        Prima del blocco temporaneo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="loginBlockDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durata Blocco (secondi)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-block-duration"
                        />
                      </FormControl>
                      <FormDescription>
                        Durata: {formatDuration(field.value)}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="auditEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Audit Log</FormLabel>
                        <FormDescription>Registra tutti gli accessi</FormDescription>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                          data-testid="switch-audit"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trackIpChanges"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Traccia IP</FormLabel>
                        <FormDescription>Monitora cambi di indirizzo IP</FormDescription>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                          data-testid="switch-track-ip"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              data-testid="button-save-security"
            >
              {updateMutation.isPending ? "Salvataggio..." : "Salva Impostazioni"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}