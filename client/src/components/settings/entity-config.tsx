import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Users, CreditCard, MapPin, Tags, Flag, Target, FileText, Truck, Mail, Pin, PinOff } from "lucide-react";
import CompanyManagement from "./company-management";
import CoreManagement from "./core-management";
import ResourceManagement from "./resource-management";
import MovementReasonManagement from "./movement-reason-management";
import IbanManagement from "./iban-management";
import OfficeManagement from "./office-management";
import TagManagement from "./tag-management";
import MovementStatusManagement from "./movement-status-management";
import SupplierManagement from "./supplier-management";
import EmailSettings from "./email-settings";

export default function EntityConfig() {
  const [activeTab, setActiveTab] = useState("companies");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const tabs = [
    { id: "companies", label: "Ragioni Sociali", icon: Building },
    { id: "suppliers", label: "Fornitori", icon: Truck },
    { id: "offices", label: "Sedi Operative", icon: MapPin },
    { id: "resources", label: "Risorse", icon: Users },
    { id: "cores", label: "Core Business", icon: Target },
    { id: "ibans", label: "IBAN", icon: CreditCard },
    { id: "tags", label: "Tags", icon: Tags },
    { id: "reasons", label: "Causali", icon: FileText },
    { id: "statuses", label: "Stati Movimento", icon: Flag },
    { id: "email", label: "Configurazione Email", icon: Mail },
  ];

  // Auto-collapse logic and mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768; // md breakpoint
      if (!isPinned || isMobile) {
        setIsCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [isPinned]);

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
      }, 300);
    }
  };

  const sidebarWidth = isCollapsed && !isHovered ? "w-16" : "w-64";
  const shouldShowText = !isCollapsed || isHovered;

  return (
    <div className="flex h-[600px] md:h-[600px] min-h-[400px]">
      {/* Sidebar Navigation */}
      <div 
        className={`${sidebarWidth} border-r border-border dark:border-border bg-card dark:bg-card rounded-l-xl transition-all duration-300 ease-in-out relative overflow-hidden z-10 md:static md:z-auto`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="p-4 h-full">
          {/* Pin/Unpin Button */}
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPinned(!isPinned)}
              className={`p-1 h-8 w-8 ${isCollapsed && !isHovered ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
              title={isPinned ? "Sgancia sidebar" : "Fissa sidebar"}
            >
              {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
          </div>
          
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-card-foreground dark:text-card-foreground hover:bg-muted dark:hover:bg-muted"
                  } ${isCollapsed && !isHovered ? 'justify-center' : 'space-x-3'}`}
                  title={isCollapsed && !isHovered ? tab.label : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span 
                    className={`text-sm transition-all duration-300 ${
                      shouldShowText
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 -translate-x-2'
                    }`}
                    style={{
                      display: shouldShowText ? 'block' : 'none'
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-card dark:bg-card rounded-r-xl transition-all duration-300 ease-in-out">
        <div className="p-6">
          {activeTab === "companies" && <CompanyManagement />}

          {activeTab === "suppliers" && <SupplierManagement />}

          {activeTab === "offices" && <OfficeManagement />}

          {activeTab === "resources" && <ResourceManagement />}

          {activeTab === "cores" && <CoreManagement />}

          {activeTab === "ibans" && <IbanManagement />}

          {activeTab === "tags" && <TagManagement />}

          {activeTab === "reasons" && <MovementReasonManagement />}

          {activeTab === "statuses" && <MovementStatusManagement />}
          
          {activeTab === "email" && <EmailSettings />}
        </div>
      </div>
    </div>
  );
}
