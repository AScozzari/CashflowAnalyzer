import { ReactNode } from "react";
import { LogOut, User, Shield, CreditCard } from "lucide-react";
import { NotificationsBell } from "./notifications-bell";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MobileNavigation } from "@/components/mobile/mobile-navigation";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case "admin": return Shield;
    case "finance": return CreditCard;
    case "user": return User;
    default: return User;
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case "admin": return "Amministratore";
    case "finance": return "Finanza";
    case "user": return "Utente";
    default: return "Utente";
  }
};

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "admin": return "destructive" as const;
    case "finance": return "default" as const;
    case "user": return "secondary" as const;
    default: return "secondary" as const;
  }
};

export default function Header({ title, subtitle, action }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  return (
    <header className="bg-background border-b border-border p-4 lg:p-6 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="min-w-0">
          <h2 className="text-xl lg:text-2xl font-bold text-foreground truncate">{title}</h2>
          {subtitle && <p className="text-muted-foreground text-sm lg:text-base truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center justify-end space-x-2 lg:space-x-4 shrink-0">
          <MobileNavigation />
          {action && <div className="hidden sm:block">{action}</div>}
          <ThemeToggle />
          <NotificationsBell />
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-white">
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <div className="pt-1">
                      <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Esci
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Mobile action button */}
          {action && (
            <div className="sm:hidden">
              {action}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
