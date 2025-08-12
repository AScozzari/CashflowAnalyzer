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
import { Loader2, LogIn, Lock, Building2, Shield, Eye, EyeOff } from "lucide-react";

type LoginFormData = z.infer<typeof loginSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, changePasswordMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);

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

  // Gestione blocco temporaneo
  useEffect(() => {
    if (blockTimeLeft > 0) {
      const timer = setInterval(() => {
        setBlockTimeLeft((prev) => {
          if (prev <= 1) {
            setIsBlocked(false);
            setLoginAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [blockTimeLeft]);

  const handleLogin = async (data: LoginFormData) => {
    if (isBlocked) {
      return;
    }

    try {
      await loginMutation.mutateAsync(data);
      setLoginAttempts(0);
    } catch (error: any) {
      if (error.status === 202) {
        // First access - password change required
        setRequirePasswordChange(true);
        setActiveTab("change-password");
      } else {
        // Incrementa tentativi falliti
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        // Blocco temporaneo dopo 5 tentativi
        if (newAttempts >= 5) {
          setIsBlocked(true);
          setBlockTimeLeft(900); // 15 minuti in secondi
        }
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
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Inserisci la tua password"
                            {...loginForm.register("password")}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-destructive">
                            {loginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending || isBlocked}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Accesso in corso...
                          </>
                        ) : isBlocked ? (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Bloccato ({Math.floor(blockTimeLeft / 60)}:{(blockTimeLeft % 60).toString().padStart(2, '0')})
                          </>
                        ) : (
                          <>
                            <LogIn className="mr-2 h-4 w-4" />
                            Accedi
                          </>
                        )}
                      </Button>
                      
                      {loginAttempts > 0 && !isBlocked && (
                        <div className="text-center mt-2">
                          <p className="text-sm text-yellow-600">
                            Tentativo {loginAttempts}/5. Attenzione: dopo 5 tentativi falliti l'account verrà temporaneamente bloccato.
                          </p>
                        </div>
                      )}
                      
                      <div className="text-center mt-4">
                        <Link href="/forgot-password">
                          <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-primary">
                            Password dimenticata?
                          </Button>
                        </Link>
                      </div>
                    </form>

                    {loginMutation.isError && (
                      <Alert className="mt-4" variant={isBlocked ? "destructive" : "default"}>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          {isBlocked 
                            ? `Account temporaneamente bloccato per sicurezza. Riprova tra ${Math.floor(blockTimeLeft / 60)} minuti e ${blockTimeLeft % 60} secondi.`
                            : "Credenziali non valide. Verifica username e password."
                          }
                        </AlertDescription>
                      </Alert>
                    )}
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