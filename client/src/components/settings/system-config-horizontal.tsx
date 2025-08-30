import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Database, Bell, Globe, Palette, FileText, Settings2, Users2, Lock, Calendar, Receipt } from "lucide-react";
import SystemUsersManagement from "./system-users-management";
import { SecuritySettings } from "./security-settings";
import { BackupSettings } from "./backup-settings-fixed";
import { LocalizationSettings } from "./localization-settings";
import { GeneralSettings } from "./general-settings";
import CalendarIntegrations from "./calendar-integrations";
import DatabaseSettings from "./database-settings";
import NotificationsSettings from "./notifications-settings";
import ThemesSettings from "./themes-settings";
import DocumentsSettings from "./documents-settings";
import { InvoicingProvidersSettings } from "./invoicing-providers-settings";

export default function SystemConfigHorizontal() {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "security", label: "Sicurezza", icon: Shield, color: "bg-red-500" },
    { id: "calendar", label: "Calendario", icon: Calendar, color: "bg-blue-500" },
    { id: "database", label: "Database", icon: Database, color: "bg-green-500" },
    { id: "invoicing", label: "Fatture", icon: Receipt, color: "bg-emerald-500" },
    { id: "notifications", label: "Notifiche", icon: Bell, color: "bg-yellow-500" },
    { id: "localization", label: "Localizzazione", icon: Globe, color: "bg-purple-500" },
    { id: "themes", label: "Temi & UI", icon: Palette, color: "bg-pink-500" },
    { id: "documents", label: "Documenti", icon: FileText, color: "bg-indigo-500" },
    { id: "general", label: "Generale", icon: Settings2, color: "bg-gray-500" },
    { id: "users", label: "Utenti Sistema", icon: Users2, color: "bg-cyan-500" },
    { id: "backup", label: "Backup", icon: Lock, color: "bg-orange-500" },
  ];

  // Componente placeholder per le sezioni future
  const PlaceholderSection = ({ title, description }: { title: string, description: string }) => (
    <div className="text-center py-12">
      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 max-w-md mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {description}
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Sezione in sviluppo - verrà implementata nelle prossime versioni
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Configurazione Sistema
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Gestisci le impostazioni generali del sistema e dei servizi
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
                  data-testid={`tab-system-${tab.id}`}
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
              {activeTab === "security" && <SecuritySettings />}
              {activeTab === "calendar" && <CalendarIntegrations />}
              {activeTab === "database" && <DatabaseSettings />}
              {activeTab === "invoicing" && <InvoicingProvidersSettings />}
              {activeTab === "notifications" && <NotificationsSettings />}
              {activeTab === "localization" && <LocalizationSettings />}
              {activeTab === "themes" && <ThemesSettings />}
              {activeTab === "documents" && <DocumentsSettings />}
              {activeTab === "general" && <GeneralSettings />}
              {activeTab === "users" && <SystemUsersManagement />}
              {activeTab === "backup" && <BackupSettings />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}