import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: () => React.JSX.Element;
  allowedRoles?: string[];
}

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  console.log(`[PROTECTED ROUTE] Path: ${path}, User: ${user?.username || 'null'}, Loading: ${isLoading}`);

  return (
    <Route path={path}>
      {({ params }) => {
        if (isLoading) {
          console.log(`[PROTECTED ROUTE] Loading for path: ${path}`);
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }

        if (!user) {
          console.log(`[PROTECTED ROUTE] No user, redirecting to /auth from path: ${path}`);
          return <Redirect to="/auth" />;
        }

        // Controlla i ruoli se specificati
        if (allowedRoles && !allowedRoles.includes(user.role)) {
          console.log(`[PROTECTED ROUTE] User role '${user.role}' not in allowed roles:`, allowedRoles);
          return (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-destructive mb-2">
                  Accesso Negato
                </h1>
                <p className="text-muted-foreground">
                  Non hai i permessi necessari per accedere a questa pagina.
                </p>
              </div>
            </div>
          );
        }

        console.log(`[PROTECTED ROUTE] Access granted for path: ${path}`);
        return <Component />;
      }}
    </Route>
  );
}