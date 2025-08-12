import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, changePasswordSchema } from "@shared/schema";
import { z } from "zod";
import { Loader2, LogIn, Lock, Building2 } from "lucide-react";

type LoginFormData = z.infer<typeof loginSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, changePasswordMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);

  // Se l'utente è già autenticato, redirect alla home
  useEffect(() => {
    if (user && !user.isFirstAccess) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const changePasswordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data);
    } catch (error: any) {
      if (error.status === 202) {
        // First access - password change required
        setRequirePasswordChange(true);
        setActiveTab("change-password");
      }
    }
  };

  const handleChangePassword = async (data: ChangePasswordFormData) => {
    try {
      await changePasswordMutation.mutateAsync(data);
      setRequirePasswordChange(false);
      setLocation("/");
    } catch (error) {
      console.error("Password change failed:", error);
    }
  };

  // Se è richiesto il cambio password per primo accesso
  if (user && (user.isFirstAccess || requirePasswordChange)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Primo Accesso</CardTitle>
              <CardDescription>
                È necessario cambiare la password prima di continuare
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={changePasswordForm.handleSubmit(handleChangePassword)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Password Attuale</Label>
                  <Input
                    id="current-password"
                    type="password"
                    {...changePasswordForm.register("currentPassword")}
                  />
                  {changePasswordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-destructive">
                      {changePasswordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Nuova Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    {...changePasswordForm.register("newPassword")}
                  />
                  {changePasswordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">
                      {changePasswordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Conferma Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    {...changePasswordForm.register("confirmPassword")}
                  />
                  {changePasswordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {changePasswordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Aggiornamento...
                    </>
                  ) : (
                    "Aggiorna Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Form Section */}
        <div className="flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">CashFlow Management</h1>
              <p className="text-muted-foreground mt-2">
                Sistema di gestione flussi finanziari aziendali
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="login">Accedi</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LogIn className="h-5 w-5" />
                      Accesso
                    </CardTitle>
                    <CardDescription>
                      Inserisci le tue credenziali per accedere al sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Inserisci il tuo username"
                          {...loginForm.register("username")}
                        />
                        {loginForm.formState.errors.username && (
                          <p className="text-sm text-destructive">
                            {loginForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Inserisci la tua password"
                          {...loginForm.register("password")}
                        />
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-destructive">
                            {loginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Accesso in corso...
                          </>
                        ) : (
                          <>
                            <LogIn className="mr-2 h-4 w-4" />
                            Accedi
                          </>
                        )}
                      </Button>
                      
                      <div className="text-center mt-4">
                        <Link href="/forgot-password">
                          <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-primary">
                            Password dimenticata?
                          </Button>
                        </Link>
                      </div>
                    </form>

                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Credenziali Demo:</h4>
                      <p className="text-sm text-muted-foreground">
                        <strong>Username:</strong> admin<br />
                        <strong>Password:</strong> admin123<br />
                        <strong>Ruolo:</strong> Amministratore
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-primary/5 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h2 className="text-3xl font-bold text-primary mb-4">
              Gestione Flussi di Cassa Avanzata
            </h2>
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div>
                  <h3 className="font-semibold">Controllo Completo</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitora tutti i movimenti finanziari aziendali in tempo reale
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div>
                  <h3 className="font-semibold">Analytics Avanzate</h3>
                  <p className="text-sm text-muted-foreground">
                    Dashboard e report dettagliati per decisioni strategiche
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div>
                  <h3 className="font-semibold">Sicurezza Aziendale</h3>
                  <p className="text-sm text-muted-foreground">
                    Sistema di ruoli e permessi per controllo accessi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}