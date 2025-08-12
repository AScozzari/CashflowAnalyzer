import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  TrendingUp, 
  BarChart3, 
  Settings, 
  Plus,
  Menu,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavigationItem {
  path: string;
  icon: any;
  label: string;
  badge?: number;
  color: string;
}

const navigationItems: NavigationItem[] = [
  {
    path: "/",
    icon: Home,
    label: "Dashboard",
    color: "text-blue-600"
  },
  {
    path: "/movements",
    icon: TrendingUp,
    label: "Movimenti",
    color: "text-green-600"
  },
  {
    path: "/analytics",
    icon: BarChart3,
    label: "Analytics",
    color: "text-purple-600"
  },
  {
    path: "/settings",
    icon: Settings,
    label: "Impostazioni",
    color: "text-gray-600"
  }
];

interface BottomNavigationProps {
  className?: string;
}

export function BottomNavigation({ className }: BottomNavigationProps) {
  const [location, setLocation] = useLocation();
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    return path !== "/" && location.startsWith(path);
  };

  const quickActions = [
    {
      icon: Plus,
      label: "Nuovo Movimento",
      action: () => window.location.href = "/movements",
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      icon: Search,
      label: "Ricerca Rapida", 
      action: () => window.location.href = "/movements",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      icon: BarChart3,
      label: "Analytics Rapide",
      action: () => window.location.href = "/analytics",
      color: "bg-purple-500 hover:bg-purple-600"
    }
  ];

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50 md:hidden",
        className
      )}>
        <div className="flex items-center justify-around px-2 py-2">
          {navigationItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "relative flex flex-col items-center justify-center h-14 w-16 rounded-xl transition-all duration-200",
                    active 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                <Icon className={cn(
                  "h-5 w-5 mb-1 transition-transform duration-200",
                  active && "scale-110"
                )} />
                <span className={cn(
                  "text-xs font-medium transition-all duration-200",
                  active ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
                
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                  >
                    {item.badge}
                  </Badge>
                )}
                
                {active && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
                </Button>
              </Link>
            );
          })}
          
          {/* Quick Actions FAB */}
          <Sheet open={showQuickActions} onOpenChange={setShowQuickActions}>
            <SheetTrigger asChild>
              <Button
                size="sm"
                className={cn(
                  "relative flex flex-col items-center justify-center h-14 w-16 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200",
                  showQuickActions && "scale-95"
                )}
              >
                <Plus className={cn(
                  "h-5 w-5 mb-1 transition-transform duration-200",
                  showQuickActions && "rotate-45"
                )} />
                <span className="text-xs font-medium">Azioni</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[300px]">
              <SheetHeader>
                <SheetTitle>Azioni Rapide</SheetTitle>
                <SheetDescription>
                  Accedi velocemente alle funzioni più utilizzate
                </SheetDescription>
              </SheetHeader>
              
              <div className="grid grid-cols-1 gap-3 mt-6">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      onClick={() => {
                        action.action();
                        setShowQuickActions(false);
                      }}
                      className={cn(
                        "flex items-center justify-start gap-3 h-12 text-left",
                        action.color
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      
      {/* Bottom padding for content */}
      <div className="h-20 md:hidden" />
    </>
  );
}

// Mobile header with hamburger menu
export function MobileHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const [showMenu, setShowMenu] = useState(false);
  
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border md:hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        
        <Sheet open={showMenu} onOpenChange={setShowMenu}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="ml-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>
                Navigazione e impostazioni rapide
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6 space-y-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant="ghost"
                      onClick={() => setShowMenu(false)}
                      className="w-full justify-start gap-3 h-12"
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}