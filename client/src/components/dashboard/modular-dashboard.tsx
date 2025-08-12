import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
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
  visible: boolean;
  order: number;
  props?: any;
}

interface ModularDashboardProps {
  stats?: any;
  cashFlowData?: any;
  statusDistribution?: any;
  recentMovements?: any;
  isLoading?: boolean;
}

const defaultWidgets: DashboardWidget[] = [
  {
    id: "stats-overview",
    name: "Statistiche Generali",
    description: "Panoramica delle metriche principali",
    icon: BarChart3,
    component: StatsCards,
    size: "full",
    category: "overview",
    visible: true,
    order: 0
  },
  {
    id: "cash-flow-chart",
    name: "Analisi Flussi di Cassa",
    description: "Grafico interattivo dei flussi finanziari",
    icon: TrendingUp,
    component: AdvancedCashFlowChart,
    size: "large",
    category: "analytics",
    visible: true,
    order: 1
  },
  {
    id: "status-distribution",
    name: "Distribuzione Stati",
    description: "Grafico a torta degli stati dei movimenti",
    icon: PieChart,
    component: MovementStatusChart,
    size: "medium",
    category: "analytics",
    visible: true,
    order: 2
  },
  {
    id: "recent-movements",
    name: "Movimenti Recenti",
    description: "Lista degli ultimi movimenti registrati",
    icon: FileText,
    component: RecentMovements,
    size: "large",
    category: "data",
    visible: true,
    order: 3
  },
  {
    id: "budget-tracker",
    name: "Tracker Budget",
    description: "Monitoraggio budget vs reale",
    icon: Target,
    component: ({ data }: any) => (
      <div className="p-4 text-center text-muted-foreground">
        <Target className="h-8 w-8 mx-auto mb-2" />
        <p>Widget Budget Tracker</p>
        <p className="text-sm">Coming Soon</p>
      </div>
    ),
    size: "medium",
    category: "analytics",
    visible: false,
    order: 4
  },
  {
    id: "cash-forecast",
    name: "Previsioni di Cassa",
    description: "Previsioni AI sui flussi futuri",
    icon: TrendingUp,
    component: ({ data }: any) => (
      <div className="p-4 text-center text-muted-foreground">
        <TrendingUp className="h-8 w-8 mx-auto mb-2" />
        <p>Widget Previsioni AI</p>
        <p className="text-sm">Coming Soon</p>
      </div>
    ),
    size: "large",
    category: "analytics",
    visible: false,
    order: 5
  }
];

export default function ModularDashboard({ 
  stats, 
  cashFlowData, 
  statusDistribution, 
  recentMovements, 
  isLoading 
}: ModularDashboardProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    const saved = localStorage.getItem("dashboard-layout");
    return saved ? JSON.parse(saved) : defaultWidgets;
  });
  
  const [editMode, setEditMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem("dashboard-layout", JSON.stringify(widgets));
  }, [widgets]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedWidgets = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setWidgets(updatedWidgets);
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, visible: !widget.visible }
        : widget
    ));
  };

  const resetToDefault = () => {
    setWidgets(defaultWidgets);
    localStorage.removeItem("dashboard-layout");
  };

  const visibleWidgets = widgets
    .filter(widget => widget.visible)
    .sort((a, b) => a.order - b.order);

  const getGridClasses = (size: string) => {
    switch (size) {
      case "small": return "col-span-1";
      case "medium": return "col-span-1 lg:col-span-1";
      case "large": return "col-span-1 lg:col-span-2";
      case "full": return "col-span-1 lg:col-span-3";
      default: return "col-span-1";
    }
  };

  const getWidgetProps = (widget: DashboardWidget) => {
    switch (widget.id) {
      case "stats-overview":
        return {
          totalIncome: stats?.totalIncome || 0,
          totalExpenses: stats?.totalExpenses || 0,
          netCashFlow: stats?.netBalance || 0,
          movementCount: stats?.totalMovements || 0,
        };
      case "cash-flow-chart":
        return { data: cashFlowData, isLoading };
      case "status-distribution":
        return { data: statusDistribution, isLoading };
      case "recent-movements":
        return { movements: recentMovements, isLoading };
      default:
        return {};
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Personalizzata</h2>
          <p className="text-muted-foreground">
            Trascina e personalizza i widget secondo le tue esigenze
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode(!editMode)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {editMode ? "Fine Modifica" : "Modifica Layout"}
          </Button>
          
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Gestisci Widget
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Gestione Widget</DialogTitle>
                <DialogDescription>
                  Attiva o disattiva i widget del tuo dashboard
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {widgets.map(widget => (
                  <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <widget.icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">{widget.name}</Label>
                          <Badge variant="outline" className="text-xs">
                            {widget.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {widget.description}
                        </p>
                      </div>
                    </div>
                    
                    <Switch
                      checked={widget.visible}
                      onCheckedChange={() => toggleWidgetVisibility(widget.id)}
                    />
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetToDefault}
                    className="w-full"
                  >
                    Ripristina Layout Predefinito
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Dashboard Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard" direction="vertical">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {visibleWidgets.map((widget, index) => (
                <Draggable
                  key={widget.id}
                  draggableId={widget.id}
                  index={index}
                  isDragDisabled={!editMode}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`${getGridClasses(widget.size)} ${
                        snapshot.isDragging ? "opacity-75 rotate-2" : ""
                      } ${editMode ? "ring-2 ring-blue-200 dark:ring-blue-800" : ""}`}
                    >
                      <Card className={`h-full ${editMode ? "cursor-move" : ""}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {editMode && (
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                </div>
                              )}
                              <widget.icon className="h-4 w-4" />
                              <CardTitle className="text-lg">{widget.name}</CardTitle>
                            </div>
                            
                            {editMode && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleWidgetVisibility(widget.id)}
                              >
                                {widget.visible ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <widget.component {...getWidgetProps(widget)} />
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Empty State */}
      {visibleWidgets.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nessun widget attivo</h3>
            <p className="text-muted-foreground mb-4">
              Attiva alcuni widget per visualizzare i tuoi dati finanziari
            </p>
            <Button onClick={() => setShowSettings(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Widget
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}