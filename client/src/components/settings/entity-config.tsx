import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Users, CreditCard, MapPin, Tags, Flag, Target, FileText, Truck, Mail } from "lucide-react";
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

  return (
    <div className="flex h-[600px]">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-border dark:border-border bg-card dark:bg-card rounded-l-xl">
        <div className="p-4">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-card-foreground dark:text-card-foreground hover:bg-muted dark:hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-card dark:bg-card rounded-r-xl">
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
