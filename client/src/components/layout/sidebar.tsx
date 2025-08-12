import { Link, useLocation } from "wouter";
import { BarChart3, Home, TrendingUp, Settings, RefreshCw, Calendar } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Filtra la navigazione in base al ruolo utente
  const getNavigationItems = () => {
    const baseNavigation = [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Movimenti", href: "/movements", icon: RefreshCw },
      { name: "Analytics", href: "/analytics", icon: TrendingUp },
    ];

    // Solo Admin e Finance possono accedere alle impostazioni
    if (user && (user.role === "admin" || user.role === "finance")) {
      baseNavigation.push({ name: "Impostazioni", href: "/settings", icon: Settings });
    }

    return baseNavigation;
  };

  const navigation = getNavigationItems();

  return (
    <aside className="w-64 bg-sidebar shadow-lg border-r border-sidebar-border flex flex-col dark:shadow-black/20">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="text-sidebar-primary-foreground text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">CashFlow</h1>
            <p className="text-sm text-sidebar-foreground/60">Management System</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 hover:scale-[1.02]",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-sidebar-accent/50">
          <Calendar className="h-4 w-4 text-sidebar-accent-foreground" />
          <span className="text-sm text-sidebar-accent-foreground font-medium">
            {format(new Date(), 'dd MMMM yyyy', { locale: it })}
          </span>
        </div>
      </div>
    </aside>
  );
}
