import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Shield, Database, Bell, Globe, Palette, FileText, Settings2, Users2, Lock } from "lucide-react";
import { EmailSettings } from "./email-settings";
import SystemUsersManagement from "./system-users-management";

export default function SystemConfigHorizontal() {
  const [activeTab, setActiveTab] = useState("email");

  const tabs = [
    { id: "email", label: "Configurazione Mail", icon: Mail, color: "bg-blue-500" },
    { id: "security", label: "Sicurezza", icon: Shield, color: "bg-red-500" },
    { id: "database", label: "Database", icon: Database, color: "bg-green-500" },
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
              {activeTab === "email" && <EmailSettings />}
              {activeTab === "security" && (
                <PlaceholderSection 
                  title="Configurazione Sicurezza"
                  description="Gestione autenticazione, sessioni, CSRF protection, rate limiting e controlli di accesso"
                />
              )}
              {activeTab === "database" && (
                <PlaceholderSection 
                  title="Configurazione Database"
                  description="Impostazioni connessione, backup automatico, ottimizzazioni performance e monitoring"
                />
              )}
              {activeTab === "notifications" && (
                <PlaceholderSection 
                  title="Sistema Notifiche"
                  description="Configurazione WebSocket, email alerts, notifiche push e template personalizzati"
                />
              )}
              {activeTab === "localization" && (
                <PlaceholderSection 
                  title="Localizzazione"
                  description="Impostazioni lingua, formato date, valute, fuso orario e adattamenti regionali"
                />
              )}
              {activeTab === "themes" && (
                <PlaceholderSection 
                  title="Temi e Interfaccia"
                  description="Personalizzazione colori, layout, modalità scura/chiara e branding aziendale"
                />
              )}
              {activeTab === "documents" && (
                <PlaceholderSection 
                  title="Gestione Documenti"
                  description="Configurazione upload, storage cloud, processing PDF/XML e template FatturaPA"
                />
              )}
              {activeTab === "general" && (
                <PlaceholderSection 
                  title="Impostazioni Generali"
                  description="Configurazioni globali, parametri sistema, logging e diagnostics avanzati"
                />
              )}
              {activeTab === "users" && <SystemUsersManagement />}
              {activeTab === "backup" && (
                <PlaceholderSection 
                  title="Backup e Recovery"
                  description="Backup automatico, restore procedure, export dati e disaster recovery"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}