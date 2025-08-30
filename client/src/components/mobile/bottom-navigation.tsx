import { Link, useLocation } from "wouter";
import { Home, RefreshCw, BarChart3, Settings, Bell, User, LogOut, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useEffect, useRef } from "react";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
}

export function MobileHeader({ title, subtitle }: MobileHeaderProps) {
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "finance": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "user": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Home className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            
            {/* User Info */}
            {user && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {getInitials(user.username?.substring(0,1), user.email?.substring(0,1))}
                  </span>
                </div>
                <Badge className={cn("text-xs px-2 py-1", getRoleColor(user.role))}>
                  {user.role.toUpperCase()}
                </Badge>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Date indicator */}
        <div className="mt-2 text-xs text-muted-foreground">
          {format(new Date(), 'EEEE dd MMMM yyyy', { locale: it })}
        </div>
      </div>
    </header>
  );
}

export function BottomNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const navRef = useRef<HTMLElement>(null);

  // Update background color based on theme
  useEffect(() => {
    const updateBackgroundColor = () => {
      if (navRef.current) {
        const isDark = document.documentElement.classList.contains('dark');
        navRef.current.style.backgroundColor = isDark ? 'rgb(2, 8, 23)' : 'rgb(255, 255, 255)';
        navRef.current.style.background = isDark ? 'rgb(2, 8, 23)' : 'rgb(255, 255, 255)';
        navRef.current.style.opacity = '1';
      }
    };

    // Initial update
    updateBackgroundColor();

    // Listen for theme changes
    const observer = new MutationObserver(updateBackgroundColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const getNavItems = () => {
    const baseItems = [
      { 
        name: "Dashboard", 
        href: "/dashboard", 
        icon: Home,
        isActive: location === "/dashboard" || location === "/"
      },
      { 
        name: "Movimenti", 
        href: "/movements", 
        icon: RefreshCw,
        isActive: location === "/movements"
      },
      { 
        name: "Analytics", 
        href: "/analytics", 
        icon: BarChart3,
        isActive: location === "/analytics"
      },
    ];

    // Add invoicing for admin and finance users
    if (user && (user.role === "admin" || user.role === "finance")) {
      baseItems.push({
        name: "Fatture",
        href: "/invoicing",
        icon: FileText,
        isActive: location === "/invoicing"
      });
    }

    // Add settings for admin users only
    if (user && user.role === "admin") {
      baseItems.push({
        name: "Settings",
        href: "/settings",
        icon: Settings,
        isActive: location === "/settings"
      });
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Spacer for fixed bottom navigation */}
      <div className="h-20" />
      
      {/* Fixed bottom navigation */}
      <nav 
        ref={navRef}
        className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-border shadow-lg dark:border-slate-800" 
        style={{ 
          backgroundColor: 'rgb(255, 255, 255)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          opacity: '1',
          background: 'rgb(255, 255, 255)'
        }}
      >
        <div className="grid grid-cols-3 lg:grid-cols-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-3 px-2 text-xs transition-colors relative",
                  item.isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {item.isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
                
                <Icon className={cn(
                  "w-5 h-5 mb-1",
                  item.isActive ? "text-primary" : "text-muted-foreground"
                )} />
                
                <span className={cn(
                  "font-medium",
                  item.isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}