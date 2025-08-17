import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
  Filter,
  PieChart
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { MovementWithRelations } from "@shared/schema";
import { ConfigPreviewMini } from "@/components/dashboard/config-preview-mini";
import MovementFormNew from "@/components/movements/movement-form-new-fixed";
import { useAuth } from "@/hooks/use-auth";

// Colors for charts
const CHART_COLORS = {
  "Saldato": "#10B981",
  "Da Saldare": "#F59E0B", 
  "In Lavorazione": "#2563EB",
  "Saldato Parziale": "#8B5CF6",
  "Annullato": "#EF4444",
  "Sospeso": "#6B7280",
};

// Dashboard Chart Component
function DashboardChart({ title, subtitle, movements, isLoading, type }: {
  title: string;
  subtitle: string;
  movements: MovementWithRelations[];
  isLoading: boolean;
  type: 'cashflow' | 'status';
}) {
  const chartData = useMemo(() => {
    // Safety check: ensure movements is an array
    if (!Array.isArray(movements) || movements.length === 0) return [];
    
    try {
      if (type === 'cashflow') {
        // Group by date for cash flow chart with error handling
        const groupedByDate = movements.reduce((acc, movement) => {
          if (!movement || !movement.flowDate) return acc;
          
          try {
            const date = format(new Date(movement.flowDate), 'dd/MM', { locale: it });
            if (!acc[date]) {
              acc[date] = { date, entrate: 0, uscite: 0 };
            }
            
            const amount = parseFloat(movement.amount || '0');
            if (isNaN(amount)) return acc;
            
            if (movement.type === 'income') {
              acc[date].entrate += amount;
            } else if (movement.type === 'expense') {
              acc[date].uscite += amount;
            }
            
            return acc;
          } catch (error) {
            console.warn('Error processing movement for chart:', error);
            return acc;
          }
        }, {} as Record<string, any>);
        
        return Object.values(groupedByDate).slice(-7); // Last 7 days
      } else {
        // Group by status for pie chart with error handling
        const statusCount = movements.reduce((acc, movement) => {
          if (!movement) return acc;
          
          const status = movement.status?.name || 'Da Saldare';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(statusCount).map(([name, value]) => ({
          name,
          value,
          fill: CHART_COLORS[name as keyof typeof CHART_COLORS] || '#6B7280'
        }));
      }
    } catch (error) {
      console.error('Error generating chart data:', error);
      return [];
    }
  }, [movements, type]);

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5" />
            <span>{title}</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="space-y-3 w-full">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {type === 'cashflow' ? <BarChart3 className="h-5 w-5" /> : <PieChart className="h-5 w-5" />}
          <span>{title}</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'cashflow' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [
                    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value),
                    ''
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="entrate" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  name="Entrate"
                />
                <Line 
                  type="monotone" 
                  dataKey="uscite" 
                  stroke="#EF4444" 
                  strokeWidth={3}
                  name="Uscite"
                />
              </LineChart>
            ) : (
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced Stats Cards with gradients and animations
function EnhancedStatsGrid({ data, isLoading, movements }: { data: any; isLoading: boolean; movements: MovementWithRelations[] }) {
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

  // Calculate current month stats from filtered movements with safety checks
  const currentMonthStats = useMemo(() => {
    // Safety check: ensure movements is an array
    if (!Array.isArray(movements) || movements.length === 0) {
      return { income: 0, expenses: 0, netFlow: 0, movementCount: 0 };
    }
    
    try {
      const income = movements
        .filter(m => m && m.type === 'income' && m.amount)
        .reduce((sum, m) => {
          const amount = parseFloat(m.amount);
          return isNaN(amount) ? sum : sum + amount;
        }, 0);
        
      const expenses = movements
        .filter(m => m && m.type === 'expense' && m.amount)
        .reduce((sum, m) => {
          const amount = parseFloat(m.amount);
          return isNaN(amount) ? sum : sum + amount;
        }, 0);
        
      const netFlow = income - expenses;
      const movementCount = movements.length;
      
      return { income, expenses, netFlow, movementCount };
    } catch (error) {
      console.error('Error calculating current month stats:', error);
      return { income: 0, expenses: 0, netFlow: 0, movementCount: 0 };
    }
  }, [movements]);

  const stats = [
    {
      title: "Entrate Mese Corrente",
      value: currentMonthStats.income,
      icon: TrendingUp,
      change: "+12.5%",
      changeType: "positive",
      gradient: "from-emerald-500/20 via-green-500/10 to-teal-500/5",
      iconColor: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-50/80 to-green-50/40 dark:from-emerald-950/50 dark:to-green-950/20",
      progress: 85
    },
    {
      title: "Uscite Mese Corrente", 
      value: currentMonthStats.expenses,
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
      value: currentMonthStats.netFlow,
      icon: DollarSign,
      change: "+8.1%",
      changeType: "positive",
      gradient: "from-violet-500/20 via-purple-500/10 to-indigo-500/5",
      iconColor: "text-violet-600",
      bgColor: "bg-gradient-to-br from-violet-50/80 to-purple-50/40 dark:from-violet-950/50 dark:to-purple-950/20",
      progress: 92
    },
    {
      title: "Movimenti del Mese",
      value: currentMonthStats.movementCount,
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
      </CardHeader>
      <CardContent>
        {!Array.isArray(movements) || movements.length === 0 ? (
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
function QuickActionsWidget({ onOpenNewMovement }: { onOpenNewMovement: () => void }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Base actions array
  let actions = [
    {
      title: "Esplora Entità",
      description: "Gestione entità aziendali",
      icon: PieChart,
      color: "from-purple-500 to-indigo-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      action: () => setLocation('/entity-explorer')
    },
    {
      title: "Analytics",
      description: "Visualizza report e grafici",
      icon: BarChart3,
      color: "from-green-500 to-emerald-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      action: () => setLocation('/analytics')
    }
  ];

  // Aggiungi "Nuovo Movimento" solo per admin e finance
  if (user && (user.role === "admin" || user.role === "finance")) {
    actions.unshift({
      title: "Nuovo Movimento",
      description: "Registra entrata o uscita",
      icon: Plus,
      color: "from-blue-500 to-cyan-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      action: onOpenNewMovement
    });
  }

  // Aggiungi impostazioni solo per admin e finance
  if (user && (user.role === "admin" || user.role === "finance")) {
    actions.push({
      title: "Impostazioni",
      description: "Configura sistema",
      icon: Settings,
      color: "from-orange-500 to-amber-500",
      textColor: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      action: () => setLocation('/settings')
    });
  }

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
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`group relative p-4 rounded-xl border-2 border-transparent hover:border-primary/20 ${action.bgColor} hover:shadow-md transition-all duration-200 text-left w-full`}
              data-testid={`action-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center space-x-4 w-full">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} shadow-sm group-hover:shadow-md transition-shadow`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className={`font-semibold text-base ${action.textColor} group-hover:text-opacity-80 transition-colors`}>
                    {action.title}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 group-hover:text-muted-foreground/80 transition-colors">
                    {action.description}
                  </div>
                </div>
                <div className={`p-2 rounded-lg ${action.bgColor} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <ArrowUpRight className={`w-4 h-4 ${action.textColor}`} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardProfessional() {
  const [, setLocation] = useLocation();
  const [isNewMovementModalOpen, setIsNewMovementModalOpen] = useState(false);
  
  // Get current month and year for filtering
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
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

  // Process movements for display - filter by current month with safety checks
  const movements = useMemo(() => {
    // Safety check: ensure movementsData exists and has proper structure
    if (!movementsData || typeof movementsData !== 'object') {
      return [];
    }
    
    // Safety check: ensure data property exists and is an array
    if (!movementsData.data || !Array.isArray(movementsData.data)) {
      return [];
    }
    
    try {
      // Filter movements to show only current month with error handling
      const currentMonthMovements = movementsData.data.filter((movement: MovementWithRelations) => {
        if (!movement || !movement.flowDate) return false;
        
        try {
          const movementDate = new Date(movement.flowDate);
          // Validate date is valid
          if (isNaN(movementDate.getTime())) return false;
          
          return movementDate.getMonth() === currentMonth && movementDate.getFullYear() === currentYear;
        } catch (error) {
          console.warn('Error processing movement date:', error);
          return false;
        }
      });
      
      return currentMonthMovements.slice(0, 10); // Show top 10 current month movements
    } catch (error) {
      console.error('Error filtering movements:', error);
      return [];
    }
  }, [movementsData, currentMonth, currentYear]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/20">
      <Header 
        title={`Dashboard Professionale - ${format(currentDate, 'MMMM yyyy', { locale: it })}`}
        subtitle={`Centro di controllo per i movimenti finanziari del mese corrente (${movements.length} movimenti)`}
      />
      
      <div className="container mx-auto px-4 lg:px-6 py-6 space-y-8">
        {/* PWA Install Prompt */}
        <InstallPrompt />
        
        {/* Enhanced Stats Grid - Current Month Only */}
        <EnhancedStatsGrid data={statsData} isLoading={statsLoading} movements={movements} />
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cash Flow Chart */}
          <DashboardChart
            title="Andamento Cash Flow"
            subtitle="Entrate e uscite degli ultimi 30 giorni"
            movements={movements}
            isLoading={movementsLoading}
            type="cashflow"
          />
          
          {/* Status Distribution Chart */}
          <DashboardChart
            title="Distribuzione per Stato"
            subtitle="Ripartizione movimenti per stato"
            movements={movements}
            isLoading={movementsLoading}
            type="status"
          />
        </div>

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
            <QuickActionsWidget onOpenNewMovement={() => setIsNewMovementModalOpen(true)} />
            
            {/* Configuration Preview Mini-Dashboard */}
            <ConfigPreviewMini />
            
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
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                  <div className="flex items-center space-x-2">
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Entrate Mensili</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">+8.3%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
                  <div className="flex items-center space-x-2">
                    <ArrowDownLeft className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium">Uscite Mensili</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">+2.1%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">EBITDA Mese Corrente</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">+15.7%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Modal per Nuovo Movimento */}
      <MovementFormNew
        isOpen={isNewMovementModalOpen}
        onClose={() => setIsNewMovementModalOpen(false)}
      />
    </div>
  );
}