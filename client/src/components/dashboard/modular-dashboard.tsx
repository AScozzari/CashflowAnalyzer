import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Plus, 
  GripVertical, 
  Eye, 
  EyeOff, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Building,
  CreditCard,
  FileText,
  Target
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import StatsCards from "./stats-cards";
import AdvancedCashFlowChart from "./advanced-cash-flow-chart";
import MovementStatusChart from "./movement-status-chart";
import RecentMovements from "./recent-movements";

interface DashboardWidget {
  id: string;
  name: string;
  description: string;
  icon: any;
  component: React.ComponentType<any>;
  size: "small" | "medium" | "large" | "full";
  category: "analytics" | "data" | "overview";
  enabled: boolean;
  position: number;
}

// Versione FIXED senza drag&drop problematico
export default function ModularDashboard() {
  const availableWidgets: DashboardWidget[] = [
    {
      id: "stats-cards",
      name: "Cards Statistiche",
      description: "Panoramica finanziaria principale",
      icon: DollarSign,
      component: StatsCards,
      size: "full",
      category: "overview",
      enabled: true,
      position: 0
    },
    {
      id: "cash-flow-chart", 
      name: "Grafico Cash Flow",
      description: "Analisi tendenze finanziarie",
      icon: TrendingUp,
      component: AdvancedCashFlowChart,
      size: "large",
      category: "analytics",
      enabled: true,
      position: 1
    },
    {
      id: "status-chart",
      name: "Distribuzione Status",
      description: "Stati movimenti finanziari", 
      icon: PieChart,
      component: MovementStatusChart,
      size: "medium",
      category: "analytics",
      enabled: true,
      position: 2
    },
    {
      id: "recent-movements",
      name: "Movimenti Recenti",
      description: "Ultime transazioni",
      icon: FileText,
      component: RecentMovements,
      size: "large",
      category: "data",
      enabled: true,
      position: 3
    }
  ];

  const [widgets, setWidgets] = useState<DashboardWidget[]>(availableWidgets);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const enabledWidgets = widgets
    .filter(w => w.enabled)
    .sort((a, b) => a.position - b.position);

  const toggleWidget = (widgetId: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    ));
  };

  const getWidgetSizeClass = (size: string) => {
    switch (size) {
      case "small": return "col-span-1";
      case "medium": return "col-span-1 lg:col-span-1"; 
      case "large": return "col-span-1 lg:col-span-2";
      case "full": return "col-span-1 lg:col-span-2";
      default: return "col-span-1";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "analytics": return "bg-blue-100 text-blue-800";
      case "data": return "bg-green-100 text-green-800";
      case "overview": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con controlli */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Panoramica completa dei tuoi flussi finanziari
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Personalizza
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Personalizza Dashboard</DialogTitle>
              <DialogDescription>
                Scegli quali widget visualizzare nella tua dashboard
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {widgets.map((widget) => (
                <div key={widget.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <widget.icon className="w-6 h-6 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{widget.name}</h4>
                      <p className="text-sm text-muted-foreground">{widget.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={getCategoryColor(widget.category)}>
                          {widget.category}
                        </Badge>
                        <Badge variant="outline">{widget.size}</Badge>
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={widget.enabled}
                    onCheckedChange={() => toggleWidget(widget.id)}
                  />
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid Dashboard - FIXED senza drag&drop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {enabledWidgets.map((widget) => {
          const WidgetComponent = widget.component;
          return (
            <div 
              key={widget.id} 
              className={getWidgetSizeClass(widget.size)}
            >
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <widget.icon className="w-5 h-5" />
                    {widget.name}
                  </CardTitle>
                  <Badge variant="secondary" className={getCategoryColor(widget.category)}>
                    {widget.category}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <WidgetComponent />
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {enabledWidgets.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <Settings className="w-12 h-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">Nessun widget abilitato</h3>
                <p className="text-muted-foreground">
                  Usa il pulsante "Personalizza" per abilitare i widget che desideri visualizzare.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}