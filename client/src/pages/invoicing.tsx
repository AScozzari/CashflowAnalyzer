import { useState } from "react";
import Header from "@/components/layout/header";
import { FooterSignature } from "@/components/layout/footer-signature";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Plus, 
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  BarChart3,
  Euro,
  Clock,
  CheckCircle,
  AlertCircle,
  Building,
  Users,
  FileX,
  Eye
} from "lucide-react";
import { InvoiceCreation } from "@/components/invoicing/invoice-creation";
import { InvoicesList } from "@/components/invoicing/invoices-list";
import { InvoicingDashboard } from "@/components/invoicing/invoicing-dashboard";
import { InvoicingSettings } from "@/components/invoicing/invoicing-settings";

export default function Invoicing() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const invoicingAction = (
    <div className="flex items-center space-x-2">
      <Button size="sm" variant="outline" className="hidden sm:flex">
        <Download className="h-4 w-4 mr-2" />
        Esporta
      </Button>
      <Button 
        size="sm" 
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
        onClick={() => setActiveTab("new-invoice")}
        data-testid="new-invoice-button"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nuova Fattura
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        title="Amministrazione Fatturazione"
        subtitle="Sistema completo per fatturazione elettronica italiana (FatturaPA)"
        action={invoicingAction}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5 bg-white dark:bg-gray-800 border shadow-sm">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center space-x-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20"
              data-testid="dashboard-tab"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="invoices" 
              className="flex items-center space-x-2 data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-900/20"
              data-testid="invoices-tab"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Fatture</span>
            </TabsTrigger>
            <TabsTrigger 
              value="new-invoice" 
              className="flex items-center space-x-2 data-[state=active]:bg-purple-50 dark:data-[state=active]:bg-purple-900/20"
              data-testid="new-invoice-tab"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuova</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center space-x-2 data-[state=active]:bg-orange-50 dark:data-[state=active]:bg-orange-900/20"
              data-testid="settings-tab"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="hidden lg:flex items-center space-x-2 data-[state=active]:bg-indigo-50 dark:data-[state=active]:bg-indigo-900/20"
              data-testid="analytics-tab"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <InvoicingDashboard />
          </TabsContent>

          {/* Invoices List Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <InvoicesList />
          </TabsContent>

          {/* New Invoice Tab */}
          <TabsContent value="new-invoice" className="space-y-6">
            <InvoiceCreation />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <InvoicingSettings />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                  <span>Analytics Avanzate</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-8 max-w-md mx-auto">
                    <BarChart3 className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Analytics Fatturazione
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Analisi dettagliate dei ricavi, trend mensili, performance clienti e previsioni cash flow
                    </p>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Sezione in sviluppo - verrà implementata nelle prossime versioni
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <FooterSignature />
    </div>
  );
}