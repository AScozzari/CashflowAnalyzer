import React from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText, 
  Building, 
  Users, 
  CreditCard,
  Calendar,
  TrendingUp,
  Eye,
  Edit,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { MovementWithRelations } from "@shared/schema";

interface DashboardRecentMovementsProps {
  movements: MovementWithRelations[];
  isLoading: boolean;
  className?: string;
}

export default function DashboardRecentMovements({ movements, isLoading, className }: DashboardRecentMovementsProps) {
  const [, setLocation] = useLocation();
  const formatCurrency = (amount: string | number, type: string) => {
    const formatted = new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
    
    return {
      amount: formatted,
      sign: type === 'income' ? '+' : '-',
      color: type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      bgColor: type === 'income' ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'
    };
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      "Saldato": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      "Da Saldare": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      "In Lavorazione": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "Saldato Parziale": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      "Annullato": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      "Sospeso": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };
    return variants[status] || variants["Da Saldare"];
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!movements || movements.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            <span>Movimenti Recenti</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Nessun movimento</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Non sono presenti movimenti recenti da visualizzare
            </p>
            <Button 
              variant="outline"
              onClick={() => setLocation('/movements')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Movimento
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>Movimenti Recenti</span>
            <Badge variant="secondary" className="text-xs">
              {movements.length} transazioni
            </Badge>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation('/movements')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Visualizza Tutti
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {movements.map((movement: any) => {
            const currency = formatCurrency(movement.amount, movement.type);
            const statusColor = getStatusBadge(movement.movementStatus?.name || "Da Saldare");
            
            return (
              <div
                key={movement.id}
                className="group flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer bg-card/50 hover:bg-card"
              >
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  {/* Movement Type Indicator */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${currency.bgColor}`}>
                    {movement.type === 'income' ? (
                      <ArrowUpRight className={`w-6 h-6 ${currency.color}`} />
                    ) : (
                      <ArrowDownRight className={`w-6 h-6 ${currency.color}`} />
                    )}
                  </div>
                  
                  {/* Movement Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-card-foreground truncate">
                        {movement.notes || movement.movementReason?.name || 'Movimento Finanziario'}
                      </h4>
                      {movement.documentNumber && (
                        <Badge variant="outline" className="text-xs">
                          <FileText className="w-3 h-3 mr-1" />
                          {movement.documentNumber}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(movement.flowDate), 'dd MMM yyyy', { locale: it })}</span>
                      </div>
                      
                      {movement.company && (
                        <div className="flex items-center space-x-1">
                          <Building className="w-3 h-3" />
                          <span className="truncate max-w-24">{movement.company.companyName}</span>
                        </div>
                      )}
                      
                      {movement.core && (
                        <div className="flex items-center space-x-1">
                          <CreditCard className="w-3 h-3" />
                          <span className="truncate max-w-20">{movement.core.name}</span>
                        </div>
                      )}
                      
                      {movement.resource && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span className="truncate max-w-20">
                            {movement.resource.firstName} {movement.resource.lastName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* VAT and additional info */}
                    {movement.vatAmount && parseFloat(movement.vatAmount) > 0 && (
                      <div className="mt-2 flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          IVA: {new Intl.NumberFormat('it-IT', { 
                            style: 'currency', 
                            currency: 'EUR' 
                          }).format(parseFloat(movement.vatAmount))}
                        </Badge>
                        {movement.vatType && (
                          <Badge variant="outline" className="text-xs">
                            {movement.vatType}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Amount and Status */}
                <div className="flex-shrink-0 text-right space-y-2">
                  <div className={`text-lg font-bold ${currency.color}`}>
                    {currency.sign}{currency.amount}
                  </div>
                  
                  <Badge 
                    variant="outline"
                    className={`text-xs ${statusColor}`}
                  >
                    {movement.movementStatus?.name || "Da Saldare"}
                  </Badge>
                  
                  {/* Action Buttons - Visible on hover */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/movements?view=${movement.id}`;
                      }}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/movements?edit=${movement.id}`;
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Summary Footer */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Ultimi {movements.length} movimenti registrati
            </span>
            <Button 
              variant="link" 
              size="sm"
              onClick={() => setLocation('/movements')}
              className="text-primary"
            >
              Gestisci Tutti i Movimenti →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}