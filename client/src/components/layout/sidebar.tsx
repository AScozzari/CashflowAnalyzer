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
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">CashFlow</h1>
            <p className="text-sm text-gray-500">Management System</p>
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
                    "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {format(new Date(), 'dd MMMM yyyy', { locale: it })}
          </span>
        </div>
      </div>
    </aside>
  );
}
