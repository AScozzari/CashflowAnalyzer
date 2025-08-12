import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import { InstallPrompt } from "@/components/ui/install-prompt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarInitials } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Eye, 
  BarChart3, 
  Settings,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Calendar,
  FileText,
  Building2,
  User,
  Tag,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  MoreHorizontal,
  Download,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { MovementWithRelations } from "@shared/schema";

// Enhanced Stats Cards with gradients and animations
function EnhancedStatsGrid({ data, isLoading }: { data: any; isLoading: boolean }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden border-0 shadow-lg">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-16 mb-3" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Entrate Totali",
      value: data?.totalIncome || 0,
      icon: TrendingUp,
      change: "+12.5%",
      changeType: "positive",
      gradient: "from-emerald-500/20 via-green-500/10 to-teal-500/5",
      iconColor: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-50/80 to-green-50/40 dark:from-emerald-950/50 dark:to-green-950/20",
      progress: 85
    },
    {
      title: "Uscite Totali", 
      value: data?.totalExpenses || 0,
      icon: TrendingDown,
      change: "-3.2%",
      changeType: "positive",
      gradient: "from-blue-500/20 via-indigo-500/10 to-purple-500/5",
      iconColor: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50/80 to-indigo-50/40 dark:from-blue-950/50 dark:to-indigo-950/20",
      progress: 65
    },
    {
      title: "Cash Flow Netto",
      value: (data?.totalIncome || 0) - (data?.totalExpenses || 0),
      icon: DollarSign,
      change: "+8.1%",
      changeType: "positive",
      gradient: "from-violet-500/20 via-purple-500/10 to-indigo-500/5",
      iconColor: "text-violet-600",
      bgColor: "bg-gradient-to-br from-violet-50/80 to-purple-50/40 dark:from-violet-950/50 dark:to-purple-950/20",
      progress: 92
    },
    {
      title: "Transazioni",
      value: data?.movementCount || 0,
      icon: Activity,
      change: "+15.3%",
      changeType: "positive",
      gradient: "from-orange-500/20 via-amber-500/10 to-yellow-500/5",
      iconColor: "text-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50/80 to-amber-50/40 dark:from-orange-950/50 dark:to-amber-950/20",
      progress: 78,
      suffix: " operazioni"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className={`overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${stat.bgColor}`}>
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.gradient} backdrop-blur-sm`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <Badge variant="secondary" className={`text-xs font-medium ${
                stat.changeType === 'positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {stat.change}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
              <div className="text-2xl xl:text-3xl font-bold text-foreground">
                {typeof stat.value === 'number' && stat.value > 1000 ? 
                  formatCurrency(stat.value) : 
                  `${stat.value}${stat.suffix || ''}`
                }
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                <span>Progresso</span>
                <span>{stat.progress}%</span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full bg-gradient-to-r ${stat.gradient} transition-all duration-700`}
                  style={{ width: `${stat.progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Professional Recent Movements with complete information
function ProfessionalRecentMovements({ movements, isLoading }: { movements: MovementWithRelations[]; isLoading: boolean }) {
  const [, setLocation] = useLocation();
  
  const formatCurrency = (amount: string | number, type: string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const formatted = new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(numAmount));
    
    return {
      amount: formatted,
      sign: type === 'income' ? '+' : '−',
      color: type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
      bgColor: type === 'income' ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-rose-50 dark:bg-rose-950/30',
      iconBg: type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'
    };
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string; dot: string }> = {
      "Saldato": { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
      "Da Saldare": { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
      "In Lavorazione": { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
      "Saldato Parziale": { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-300", dot: "bg-orange-500" },
      "Annullato": { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-300", dot: "bg-red-500" },
      "Sospeso": { bg: "bg-gray-50 dark:bg-gray-950/30", text: "text-gray-700 dark:text-gray-300", dot: "bg-gray-500" },
    };
    return variants[status] || variants["Da Saldare"];
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/5">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Movimenti Recenti</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Ultime transazioni finanziarie</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="w-4 h-4 mr-2" />
              Filtra
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setLocation('/movements')}
              className="h-9 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Eye className="w-4 h-4 mr-2" />
              Vedi Tutti
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {movements.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 rounded-full bg-muted/30 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nessun movimento recente</h3>
            <p className="text-muted-foreground mb-4">Inizia aggiungendo il tuo primo movimento finanziario</p>
            <Button onClick={() => setLocation('/movements')} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Movimento
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {movements.slice(0, 6).map((movement) => {
              const amountInfo = formatCurrency(movement.amount, movement.type);
              const statusInfo = getStatusBadge(movement.status?.name || 'Da Saldare');
              
              return (
                <div key={movement.id} className="group relative p-4 rounded-xl border hover:shadow-md transition-all duration-200 hover:border-primary/20 bg-card/50">
                  <div className="flex items-start justify-between">
                    {/* Left side - Movement info */}
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Movement type icon */}
                      <div className={`p-3 rounded-xl ${amountInfo.iconBg} flex-shrink-0`}>
                        {movement.type === 'income' ? (
                          <ArrowUpRight className={`w-5 h-5 ${amountInfo.color}`} />
                        ) : (
                          <ArrowDownLeft className={`w-5 h-5 ${amountInfo.color}`} />
                        )}
                      </div>
                      
                      {/* Movement details */}
                      <div className="flex-1 min-w-0">
                        {/* Primary info */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm md:text-base truncate">
                              {movement.reason?.name || 'Movimento senza causale'}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              #{movement.documentNumber || movement.id.slice(-8)}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <div className={`text-lg font-bold ${amountInfo.color}`}>
                              {amountInfo.sign}{amountInfo.amount}
                            </div>
                            {movement.vatAmount && (
                              <div className="text-xs text-muted-foreground">
                                IVA: {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(parseFloat(movement.vatAmount))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Secondary info row */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            {/* Company */}
                            {movement.company && (
                              <div className="flex items-center space-x-1">
                                <Building2 className="w-3 h-3" />
                                <span className="truncate max-w-24 md:max-w-32">{movement.company.name}</span>
                              </div>
                            )}
                            
                            {/* Resource */}
                            {movement.resource && (
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span className="truncate max-w-20 md:max-w-28">
                                  {movement.resource.firstName} {movement.resource.lastName}
                                </span>
                              </div>
                            )}
                            
                            {/* Supplier */}
                            {movement.supplier && (
                              <div className="flex items-center space-x-1">
                                <Tag className="w-3 h-3" />
                                <span className="truncate max-w-20 md:max-w-28">{movement.supplier.name}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Date */}
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {(() => {
                                try {
                                  const date = movement.flowDate || movement.insertDate;
                                  return date ? format(new Date(date), 'dd/MM/yy', { locale: it }) : 'N/A';
                                } catch {
                                  return 'N/A';
                                }
                              })()}
                            </span>
                          </div>
                        </div>

                        {/* Status and actions row */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${statusInfo.dot}`}></div>
                              {movement.status?.name || 'Da Saldare'}
                            </div>
                            
                            {movement.core && (
                              <Badge variant="outline" className="text-xs">
                                {movement.core.name}
                              </Badge>
                            )}
                          </div>
                          
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* View all button */}
            <div className="pt-4 border-t border-border/50">
              <Button 
                variant="ghost" 
                className="w-full h-12 text-sm font-medium hover:bg-muted/50" 
                onClick={() => setLocation('/movements')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Visualizza tutti i {movements.length} movimenti
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Quick Actions Widget
function QuickActionsWidget() {
  const [, setLocation] = useLocation();
  
  const actions = [
    {
      title: "Nuovo Movimento",
      description: "Registra entrata o uscita",
      icon: Plus,
      color: "from-blue-500 to-cyan-500",
      textColor: "text-blue-600",
      action: () => setLocation('/movements')
    },
    {
      title: "Analytics",
      description: "Visualizza report",
      icon: BarChart3,
      color: "from-purple-500 to-indigo-500",
      textColor: "text-purple-600",
      action: () => setLocation('/analytics')
    },
    {
      title: "Impostazioni",
      description: "Configura sistema",
      icon: Settings,
      color: "from-orange-500 to-amber-500",
      textColor: "text-orange-600",
      action: () => setLocation('/settings')
    },
    {
      title: "Esporta Dati",
      description: "Download report",
      icon: Download,
      color: "from-green-500 to-emerald-500",
      textColor: "text-green-600",
      action: () => {}
    }
  ];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/5">
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">Azioni Rapide</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Operazioni frequenti</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className="h-auto p-4 justify-start text-left hover:bg-muted/50 group"
              onClick={action.action}
            >
              <div className="flex items-start space-x-3 w-full">
                <div className={`p-2.5 rounded-lg bg-gradient-to-r ${action.color} opacity-10 group-hover:opacity-20 transition-opacity`}>
                  <action.icon className={`w-5 h-5 ${action.textColor}`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{action.description}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardProfessional() {
  const [, setLocation] = useLocation();
  
  // Fetch analytics data
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
  });

  // Fetch movements data with proper typing
  const { data: movementsData, isLoading: movementsLoading } = useQuery<{
    data: MovementWithRelations[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }>({
    queryKey: ["/api/movements"],
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Process movements for display
  const movements = useMemo(() => {
    if (!movementsData || !Array.isArray(movementsData.data)) return [];
    return movementsData.data.slice(0, 10); // Show more movements
  }, [movementsData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/20">
      <Header 
        title="Dashboard Professionale" 
        subtitle="Centro di controllo avanzato per la gestione finanziaria aziendale"
      />
      
      <div className="container mx-auto px-4 lg:px-6 py-6 space-y-8">
        {/* PWA Install Prompt */}
        <InstallPrompt />
        
        {/* Enhanced Stats Grid */}
        <EnhancedStatsGrid data={statsData} isLoading={statsLoading} />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Movements - Takes 2 columns on XL screens */}
          <div className="xl:col-span-2">
            <ProfessionalRecentMovements 
              movements={movements} 
              isLoading={movementsLoading} 
            />
          </div>
          
          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            <QuickActionsWidget />
            
            {/* Additional metrics card */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/5">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold">Performance</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Indicatori chiave</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-sm font-medium">Crescita Mensile</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">+12.5%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium">Efficienza Costi</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">94%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-sm font-medium">ROI Trimestrale</span>
                  </div>
                  <span className="text-sm font-bold text-purple-600">+18.3%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}