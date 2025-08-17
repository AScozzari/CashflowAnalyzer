import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BarChart3, Home, TrendingUp, Settings, RefreshCw, Menu, X, Bot, MessageSquare, Brain, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface MobileNavigationProps {
  className?: string;
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Filtra la navigazione in base al ruolo utente
  const getNavigationItems = () => {
    const baseNavigation = [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Movimenti", href: "/movements", icon: RefreshCw },
      { name: "Analytics", href: "/analytics", icon: TrendingUp },
      { name: "Esplora Entità", href: "/entity-explorer", icon: Search },
      { name: "AI Tools", href: "/ai-tools", icon: Brain },
      { name: "AI Chat", href: "/ai-chat", icon: Bot },
      { name: "Comunicazioni", href: "/communications", icon: MessageSquare },
    ];

    // Solo Admin e Finance possono accedere alle impostazioni
    if (user && (user.role === "admin" || user.role === "finance")) {
      baseNavigation.push({ name: "Impostazioni", href: "/settings", icon: Settings });
    }

    return baseNavigation;
  };

  const navigation = getNavigationItems();

  return (
    <div className={cn("lg:hidden", className)}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Apri menu di navigazione</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="p-6 border-b border-sidebar-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                    <BarChart3 className="text-sidebar-primary-foreground text-sm" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-sidebar-foreground">CashFlow</h1>
                    <p className="text-xs text-sidebar-foreground/60">Management</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* AI Assistant Quick Access */}
            <div className="p-4 border-b border-sidebar-border">
              <Link href="/ai-chat" onClick={() => setIsOpen(false)}>
                <Button 
                  variant="outline" 
                  className="w-full justify-start space-x-2 hover:bg-primary/10 hover:text-primary"
                  data-testid="button-mobile-ai-assistant"
                >
                  <Bot className="h-4 w-4" />
                  <span>AI Assistant</span>
                </Button>
              </Link>
            </div>
            
            {/* Navigation */}
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
                          "flex items-center space-x-3 p-3 rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            
            {/* Footer */}
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-sidebar-accent/50">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-sidebar-accent-foreground font-medium">
                  {format(new Date(), 'dd MMM', { locale: it })}
                </span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Bottom Navigation for Mobile
export function BottomNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();

  const getNavigationItems = () => {
    const baseNavigation = [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Movimenti", href: "/movements", icon: RefreshCw },
      { name: "Analytics", href: "/analytics", icon: TrendingUp },
      { name: "Chat", href: "/communications", icon: MessageSquare },
    ];

    if (user && (user.role === "admin" || user.role === "finance")) {
      baseNavigation.push({ name: "Settings", href: "/settings", icon: Settings });
    }

    return baseNavigation;
  };

  const navigation = getNavigationItems();

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-sidebar border-t border-sidebar-border z-50">
      <nav className="flex items-center justify-around py-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors min-w-0",
                isActive
                  ? "text-sidebar-primary"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}