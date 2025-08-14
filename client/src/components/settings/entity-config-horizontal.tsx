import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Users, CreditCard, MapPin, Tags, Flag, Target, FileText, Truck, UserCheck } from "lucide-react";
import CompanyManagement from "./company-management";
import CoreManagement from "./core-management";
import ResourceManagement from "./resource-management";
import MovementReasonManagement from "./movement-reason-management";
import IbanManagement from "./iban-management";
import OfficeManagement from "./office-management";
import TagManagement from "./tag-management";
import MovementStatusManagement from "./movement-status-management";
import SupplierManagement from "./supplier-management";
import { CustomerManagement } from "./customer-management";

export default function EntityConfigHorizontal() {
  const [activeTab, setActiveTab] = useState("companies");

  const tabs = [
    { id: "companies", label: "Ragioni Sociali", icon: Building, color: "bg-blue-500" },
    { id: "suppliers", label: "Fornitori", icon: Truck, color: "bg-orange-500" },
    { id: "customers", label: "Clienti", icon: UserCheck, color: "bg-green-500" },
    { id: "offices", label: "Sedi Operative", icon: MapPin, color: "bg-purple-500" },
    { id: "resources", label: "Risorse", icon: Users, color: "bg-cyan-500" },
    { id: "cores", label: "Core Business", icon: Target, color: "bg-red-500" },
    { id: "ibans", label: "IBAN", icon: CreditCard, color: "bg-emerald-500" },
    { id: "tags", label: "Tags", icon: Tags, color: "bg-pink-500" },
    { id: "reasons", label: "Causali", icon: FileText, color: "bg-indigo-500" },
    { id: "statuses", label: "Stati Movimento", icon: Flag, color: "bg-amber-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Configurazione Entità
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Gestisci tutte le entità del sistema per ottimizzare il flusso di lavoro
              </p>
            </div>
          </div>
        </div>

        {/* Horizontal Navigation */}
        <div className="px-6">
          <nav className="flex space-x-1 overflow-x-auto scrollbar-hide pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200 whitespace-nowrap min-w-fit
                    ${isActive
                      ? 'border-primary text-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                  data-testid={`tab-${tab.id}`}
                >
                  <div className={`
                    p-1.5 rounded-md transition-colors duration-200
                    ${isActive 
                      ? `${tab.color} text-white shadow-sm` 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                    }
                  `}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
            <CardContent className="p-8">
              {activeTab === "companies" && <CompanyManagement />}
              {activeTab === "suppliers" && <SupplierManagement />}
              {activeTab === "customers" && <CustomerManagement />}
              {activeTab === "offices" && <OfficeManagement />}
              {activeTab === "resources" && <ResourceManagement />}
              {activeTab === "cores" && <CoreManagement />}
              {activeTab === "ibans" && <IbanManagement />}
              {activeTab === "tags" && <TagManagement />}
              {activeTab === "reasons" && <MovementReasonManagement />}
              {activeTab === "statuses" && <MovementStatusManagement />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}