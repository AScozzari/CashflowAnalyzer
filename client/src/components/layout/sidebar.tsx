import { Link, useLocation } from "wouter";
import { BarChart3, Home, TrendingUp, Settings, RefreshCw, Calendar, Pin, PinOff, ChevronLeft, Bot, MessageSquare, Search, Brain, FileText } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';

interface SidebarProps {
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export default function Sidebar({ isCollapsed: externalCollapsed, onCollapsedChange }: SidebarProps = {}) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch theme settings for branding
  const { data: themeSettings } = useQuery({
    queryKey: ['/api/themes/settings'],
    queryFn: async () => {
      const response = await fetch('/api/themes/settings');
      if (!response.ok) throw new Error('Failed to fetch theme settings');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Use external state if provided, otherwise use internal state
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const setIsCollapsed = onCollapsedChange || setInternalCollapsed;

  // Filtra la navigazione in base al ruolo utente
  const getNavigationItems = () => {
    const baseNavigation = [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Movimenti", href: "/movements", icon: RefreshCw },
      { name: "Analytics", href: "/analytics", icon: TrendingUp },
      { name: "Esplora Entità", href: "/entity-explorer", icon: Search },
      { name: "AI Tools", href: "/ai-tools", icon: Brain },
      { name: "Comunicazioni", href: "/communications", icon: MessageSquare },
    ];

    // Admin e Finance possono accedere alla fatturazione (cashflow NO)
    if (user && (user.role === "admin" || user.role === "finance")) {
      baseNavigation.push({ name: "Fatture", href: "/invoicing", icon: FileText });
    }

    // Solo Admin può accedere alle impostazioni (finance no)
    if (user && user.role === "admin") {
      baseNavigation.push({ name: "Impostazioni", href: "/settings", icon: Settings });
    }

    return baseNavigation;
  };

  const navigation = getNavigationItems();

  // Auto-collapse logic
  useEffect(() => {
    if (!isPinned) {
      setIsCollapsed(true);
    }
  }, [isPinned, setIsCollapsed]);

  // Handle hover expand/collapse
  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsHovered(true);
      setIsCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsHovered(false);
      // Small delay before collapsing to prevent flickering
      setTimeout(() => {
        if (!isPinned) {
          setIsCollapsed(true);
        }
      }, 200);
    }
  };

  const sidebarWidth = isCollapsed && !isHovered ? "w-16" : "w-64";
  const shouldShowText = !isCollapsed || isHovered;

  return (
    <aside 
      className={`${sidebarWidth} h-screen bg-sidebar shadow-lg border-r border-sidebar-border flex flex-col dark:shadow-black/20 transition-all duration-300 ease-in-out relative overflow-hidden sticky top-0`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0">
              {themeSettings?.logoUrl ? (
                <img 
                  src={themeSettings.logoUrl} 
                  alt="Logo" 
                  className="w-8 h-8 object-contain rounded"
                />
              ) : (
                <BarChart3 className="text-sidebar-primary-foreground text-lg" />
              )}
            </div>
            <div className={`transition-all duration-300 ${shouldShowText ? 'opacity-100' : 'opacity-0'}`} 
                 style={{ display: shouldShowText ? 'block' : 'none' }}>
              <h1 className="text-xl font-bold text-sidebar-foreground">
                {themeSettings?.companyName || 'EasyCashFlows'}
              </h1>
              <p className="text-sm text-sidebar-foreground/60">Management System</p>
            </div>
          </div>
          
          {/* Pin/Unpin Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPinned(!isPinned)}
            className={`p-2 h-8 w-8 ${shouldShowText ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
            title={isPinned ? "Sgancia sidebar" : "Fissa sidebar"}
          >
            {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </Button>
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
                    "flex items-center p-3 rounded-lg transition-all duration-200 hover:scale-[1.02]",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isCollapsed && !isHovered ? 'justify-center' : 'space-x-3'
                  )}
                  title={isCollapsed && !isHovered ? item.name : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span 
                    className={`font-medium transition-all duration-300 ${
                      shouldShowText ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                    }`}
                    style={{ display: shouldShowText ? 'block' : 'none' }}
                  >
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center px-3 py-2 rounded-lg bg-sidebar-accent/50 transition-all duration-200",
          isCollapsed && !isHovered ? 'justify-center' : 'space-x-2'
        )}>
          <Calendar className="h-4 w-4 text-sidebar-accent-foreground flex-shrink-0" />
          <span 
            className={`text-sm text-sidebar-accent-foreground font-medium transition-all duration-300 ${
              shouldShowText ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ display: shouldShowText ? 'block' : 'none' }}
          >
            {format(new Date(), 'dd MMMM yyyy', { locale: it })}
          </span>
        </div>
      </div>
    </aside>
  );
}
