import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, loginSchema, changePasswordSchema } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  changePasswordMutation: UseMutationResult<void, Error, ChangePasswordData>;
};

type LoginData = z.infer<typeof loginSchema>;
type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        const res = await apiRequest("POST", "/api/auth/login", credentials);
        const contentType = res.headers.get("content-type");
        
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(`Risposta non JSON dal server: ${text.slice(0, 100)}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error("Errore durante il login:", error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Errore sconosciuto durante il login");
      }
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Login effettuato",
        description: `Benvenuto, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login fallito",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      // Invalida tutte le query per pulire i dati
      queryClient.invalidateQueries();
      toast({
        title: "Logout effettuato",
        description: "Arrivederci!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore logout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      await apiRequest("POST", "/api/auth/change-password", data);
    },
    onSuccess: () => {
      toast({
        title: "Password aggiornata",
        description: "La password è stata modificata con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore cambio password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        changePasswordMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}