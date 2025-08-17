import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, Mail, Send, TestTube, Zap, TrendingUp, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const testEmailSchema = z.object({
  templateId: z.string().min(1, "Template ID richiesto"),
  testEmail: z.string().email("Email non valida")
});

const passwordResetSchema = z.object({
  email: z.string().email("Email non valida"),
  userName: z.string().min(1, "Nome utente richiesto"),
  resetToken: z.string().min(1, "Token richiesto"),
  templateId: z.string().optional()
});

const welcomeEmailSchema = z.object({
  email: z.string().email("Email non valida"),
  userName: z.string().min(1, "Username richiesto"),
  firstName: z.string().min(1, "Nome richiesto"),
  templateId: z.string().optional()
});

const financialAlertSchema = z.object({
  email: z.string().email("Email non valida"),
  alertType: z.enum(['cash_flow_low', 'invoice_overdue', 'expense_high', 'custom']),
  title: z.string().min(1, "Titolo richiesto"),
  message: z.string().min(1, "Messaggio richiesto"),
  amount: z.number().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  templateId: z.string().optional()
});

export function SendGridEnhancedSettings() {
  const [activeTab, setActiveTab] = useState("overview");
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form configurations
  const testEmailForm = useForm({
    resolver: zodResolver(testEmailSchema),
    defaultValues: { templateId: "", testEmail: "" }
  });

  const passwordResetForm = useForm({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { email: "", userName: "", resetToken: "", templateId: "" }
  });

  const welcomeEmailForm = useForm({
    resolver: zodResolver(welcomeEmailSchema),
    defaultValues: { email: "", userName: "", firstName: "", templateId: "" }
  });

  const financialAlertForm = useForm({
    resolver: zodResolver(financialAlertSchema),
    defaultValues: { 
      email: "", 
      alertType: "custom" as const, 
      title: "", 
      message: "", 
      amount: undefined, 
      priority: "medium" as const,
      templateId: ""
    }
  });

  // Fetch email settings
  const { data: emailSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/email/settings'],
    refetchOnWindowFocus: false
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: () => apiRequest('/api/sendgrid/enhanced/test-connection', 'POST', {}),
    onSuccess: (data) => {
      setConnectionStatus(data);
      toast({
        title: data.success ? "✅ Connessione riuscita" : "❌ Errore connessione",
        description: data.message
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore",
        description: error?.message || "Errore nel test connessione",
        variant: "destructive"
      });
    }
  });

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: (data: z.infer<typeof testEmailSchema>) => 
      apiRequest('/api/sendgrid/templates/test', 'POST', data),
    onSuccess: (data) => {
      toast({
        title: data.success ? "✅ Test inviato" : "❌ Errore invio",
        description: data.message
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore",
        description: error?.message || "Errore nell'invio del test",
        variant: "destructive"
      });
    }
  });

  // Password reset mutation
  const passwordResetMutation = useMutation({
    mutationFn: (data: z.infer<typeof passwordResetSchema>) => 
      apiRequest('/api/sendgrid/enhanced/send-password-reset', 'POST', data),
    onSuccess: (data) => {
      toast({
        title: data.success ? "✅ Email inviata" : "❌ Errore invio",
        description: data.message
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore",
        description: error?.message || "Errore invio email reset",
        variant: "destructive"
      });
    }
  });

  // Welcome email mutation
  const welcomeEmailMutation = useMutation({
    mutationFn: (data: z.infer<typeof welcomeEmailSchema>) => 
      apiRequest('/api/sendgrid/enhanced/send-welcome', 'POST', data),
    onSuccess: (data) => {
      toast({
        title: data.success ? "✅ Email inviata" : "❌ Errore invio",
        description: data.message
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore",
        description: error?.message || "Errore invio email welcome",
        variant: "destructive"
      });
    }
  });

  // Financial alert mutation
  const financialAlertMutation = useMutation({
    mutationFn: (data: z.infer<typeof financialAlertSchema>) => {
      const { title, message, amount, dueDate, priority, ...rest } = data;
      return apiRequest('/api/sendgrid/enhanced/send-financial-alert', 'POST', {
        ...rest,
        alertData: { title, message, amount, dueDate, priority }
      });
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "✅ Alert inviato" : "❌ Errore invio",
        description: data.message
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore",
        description: error?.message || "Errore invio alert finanziario",
        variant: "destructive"
      });
    }
  });

  const onTestEmail = (data: z.infer<typeof testEmailSchema>) => {
    testEmailMutation.mutate(data);
  };

  const onPasswordReset = (data: z.infer<typeof passwordResetSchema>) => {
    passwordResetMutation.mutate(data);
  };

  const onWelcomeEmail = (data: z.infer<typeof welcomeEmailSchema>) => {
    welcomeEmailMutation.mutate(data);
  };

  const onFinancialAlert = (data: z.infer<typeof financialAlertSchema>) => {
    financialAlertMutation.mutate(data);
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-green-100 text-green-800 border-green-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      critical: "bg-red-100 text-red-800 border-red-200"
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  return (
    <div className="space-y-6" data-testid="sendgrid-enhanced-settings">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">SendGrid Enhanced</h2>
          <p className="text-muted-foreground">
            Gestione avanzata email con best practices 2024
          </p>
        </div>
        <Button
          onClick={() => testConnectionMutation.mutate()}
          disabled={testConnectionMutation.isPending}
          variant="outline"
          data-testid="button-test-connection"
        >
          <Shield className="w-4 h-4 mr-2" />
          {testConnectionMutation.isPending ? "Testing..." : "Test Connessione"}
        </Button>
      </div>

      {connectionStatus && (
        <Alert className={connectionStatus.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {connectionStatus.success ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription>
            {connectionStatus.message}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <TrendingUp className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="test" data-testid="tab-test">
            <TestTube className="w-4 h-4 mr-2" />
            Test Email
          </TabsTrigger>
          <TabsTrigger value="business" data-testid="tab-business">
            <Mail className="w-4 h-4 mr-2" />
            Email Business
          </TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            <Zap className="w-4 h-4 mr-2" />
            Alert Finanziari
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Configurazione</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {emailSettings?.sendgridApiKey ? "✅" : "❌"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {emailSettings?.sendgridApiKey ? "API Key configurata" : "API Key mancante"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rate Limiting</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">10/sec</div>
                <p className="text-xs text-muted-foreground">
                  Limite richieste implementato
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retry Logic</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3x</div>
                <p className="text-xs text-muted-foreground">
                  Tentativi automatici con backoff
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Funzionalità Enhanced</CardTitle>
              <CardDescription>
                Best practices implementate per SendGrid 2024
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">✅ Sicurezza e Validazione</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Validazione formato API key</li>
                    <li>• Controllo email recipients</li>
                    <li>• Sandbox mode per sviluppo</li>
                    <li>• Custom args per tracking</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">⚡ Performance e Affidabilità</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Rate limiting intelligente</li>
                    <li>• Retry con exponential backoff</li>
                    <li>• Batch operations support</li>
                    <li>• Message ID tracking</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Template Email</CardTitle>
              <CardDescription>
                Testa un template SendGrid con il servizio enhanced
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...testEmailForm}>
                <form onSubmit={testEmailForm.handleSubmit(onTestEmail)} className="space-y-4">
                  <FormField
                    control={testEmailForm.control}
                    name="templateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template ID</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="d-1234567890abcdef..." 
                            {...field} 
                            data-testid="input-template-id"
                          />
                        </FormControl>
                        <FormDescription>
                          ID del template SendGrid da testare
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={testEmailForm.control}
                    name="testEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Test</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="test@example.com" 
                            {...field} 
                            data-testid="input-test-email"
                          />
                        </FormControl>
                        <FormDescription>
                          Email dove inviare il test
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={testEmailMutation.isPending}
                    data-testid="button-send-test"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {testEmailMutation.isPending ? "Invio..." : "Invia Test"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Password Reset Email</CardTitle>
                <CardDescription>
                  Invia email di reset password con template avanzato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordResetForm}>
                  <form onSubmit={passwordResetForm.handleSubmit(onPasswordReset)} className="space-y-4">
                    <FormField
                      control={passwordResetForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Utente</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} data-testid="input-reset-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordResetForm.control}
                      name="userName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Utente</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-reset-username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordResetForm.control}
                      name="resetToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reset Token</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-reset-token" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={passwordResetMutation.isPending}
                      className="w-full"
                      data-testid="button-send-reset"
                    >
                      {passwordResetMutation.isPending ? "Invio..." : "Invia Reset Password"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Welcome Email</CardTitle>
                <CardDescription>
                  Invia email di benvenuto per nuovi utenti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...welcomeEmailForm}>
                  <form onSubmit={welcomeEmailForm.handleSubmit(onWelcomeEmail)} className="space-y-4">
                    <FormField
                      control={welcomeEmailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Utente</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} data-testid="input-welcome-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={welcomeEmailForm.control}
                      name="userName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-welcome-username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={welcomeEmailForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-welcome-firstname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={welcomeEmailMutation.isPending}
                      className="w-full"
                      data-testid="button-send-welcome"
                    >
                      {welcomeEmailMutation.isPending ? "Invio..." : "Invia Welcome Email"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Finanziario</CardTitle>
              <CardDescription>
                Invia notifiche per eventi finanziari critici
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...financialAlertForm}>
                <form onSubmit={financialAlertForm.handleSubmit(onFinancialAlert)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={financialAlertForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Destinatario</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} data-testid="input-alert-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={financialAlertForm.control}
                      name="alertType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo Alert</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-alert-type">
                                <SelectValue placeholder="Seleziona tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash_flow_low">Cash Flow Basso</SelectItem>
                              <SelectItem value="invoice_overdue">Fattura Scaduta</SelectItem>
                              <SelectItem value="expense_high">Spesa Elevata</SelectItem>
                              <SelectItem value="custom">Personalizzato</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={financialAlertForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titolo Alert</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-alert-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={financialAlertForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Messaggio</FormLabel>
                        <FormControl>
                          <Textarea {...field} data-testid="textarea-alert-message" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={financialAlertForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Importo (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              data-testid="input-alert-amount"
                            />
                          </FormControl>
                          <FormDescription>Opzionale</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={financialAlertForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priorità</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-alert-priority">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">
                                <Badge variant="outline" className="bg-green-100 text-green-800">
                                  Bassa
                                </Badge>
                              </SelectItem>
                              <SelectItem value="medium">
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                  Media
                                </Badge>
                              </SelectItem>
                              <SelectItem value="high">
                                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                  Alta
                                </Badge>
                              </SelectItem>
                              <SelectItem value="critical">
                                <Badge variant="outline" className="bg-red-100 text-red-800">
                                  Critica
                                </Badge>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={financialAlertMutation.isPending}
                    className="w-full"
                    data-testid="button-send-alert"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {financialAlertMutation.isPending ? "Invio..." : "Invia Alert Finanziario"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}