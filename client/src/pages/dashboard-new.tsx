import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import FooterSignature from "@/components/layout/footer-signature";
import { InstallPrompt } from "@/components/ui/install-prompt";
import { useScreenSize } from "@/components/responsive/responsive-layout";
import InteractiveDashboard from "@/components/dashboard/interactive-dashboard";
import DashboardRecentMovements from "@/components/dashboard/recent-movements";
import StatusPieChart from "@/components/dashboard/status-pie-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Eye, 
  BarChart3, 
  RefreshCw, 
  Settings,
  TrendingUp,
  Target,
  Zap,
  Activity
} from "lucide-react";

// Widget Azioni Rapide migliorato
function QuickActionsWidget() {
  const [, setLocation] = useLocation();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <span>Azioni Rapide</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          className="w-full justify-start" 
          size="sm"
          onClick={() => setLocation('/movements')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Movimento
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-start" 
          size="sm"
          onClick={() => setLocation('/analytics')}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Visualizza Analytics
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-start" 
          size="sm"
          onClick={() => setLocation('/settings')}
        >
          <Settings className="w-4 h-4 mr-2" />
          Impostazioni
        </Button>
        
        <Button variant="outline" className="w-full justify-start" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Sincronizza Dati
        </Button>
      </CardContent>
    </Card>
  );
}

// Widget Indicatori di Performance
function PerformanceIndicators({ stats, isLoading }: { stats: any; isLoading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-green-600" />
          <span>Performance</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Obiettivo Mensile</span>
            <span className="font-medium">87%</span>
          </div>
          <Progress value={87} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">€45.2k di €52k</p>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Controllo Spese</span>
            <span className="font-medium">94%</span>
          </div>
          <Progress value={94} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">Entro budget</p>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Efficienza</span>
            <span className="font-medium">76%</span>
          </div>
          <Progress value={76} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">In miglioramento</p>
        </div>
        
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Trend Generale</span>
            <Badge variant="outline" className="text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              Positivo
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardNew() {
  const [location, navigate] = useLocation();
  const { isMobile } = useScreenSize();

  // Carica i movimenti per il widget recenti
  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ["/api/movements"],
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Elabora i movimenti per la visualizzazione
  const movements = useMemo(() => {
    if (!movementsData?.data) return [];
    return movementsData.data.slice(0, 8); // Più movimenti per una vista migliore
  }, [movementsData]);

  return (
    <div className="dashboard-container min-h-screen bg-background transition-colors">
      <Header 
        title="Dashboard Finanziaria" 
        subtitle="Centro di controllo avanzato per la gestione dei flussi di cassa"
      />
      
      <div className="space-y-8 bg-background">
        {/* Avviso di installazione PWA */}
        <div className="px-4 lg:px-6">
          <InstallPrompt />
        </div>
        
        {/* Dashboard Interattiva Completa */}
        <InteractiveDashboard />
        
        {/* Sezione Movimenti Recenti Migliorata */}
        <div className="px-4 lg:px-6 pb-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <DashboardRecentMovements 
                movements={movements} 
                isLoading={movementsLoading} 
              />
            </div>
            
            {/* Sidebar con informazioni aggiuntive */}
            <div className="space-y-6">
              {/* Grafico Stati Movimenti */}
              <StatusPieChart />
              
              {/* Widget Performance */}
              <PerformanceIndicators 
                stats={null} 
                isLoading={false}
              />
              
              {/* Widget Azioni Rapide */}
              <QuickActionsWidget />
            </div>
          </div>
        </div>
      </div>

      <FooterSignature />
    </div>
  );
}