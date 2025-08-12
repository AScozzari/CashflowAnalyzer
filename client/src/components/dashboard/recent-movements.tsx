import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, TrendingDown } from "lucide-react";
import { Movement } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface RecentMovementsProps {
  movements: Movement[];
  isLoading: boolean;
}

export default function DashboardRecentMovements({ movements, isLoading }: RecentMovementsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusBadgeVariant = (statusName: string) => {
    switch (statusName) {
      case 'Saldato': return 'default';
      case 'Da Saldare': return 'secondary';
      case 'In Lavorazione': return 'outline';
      case 'Annullato': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <CardTitle>Movimenti Recenti</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
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
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <CardTitle>Movimenti Recenti</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nessun movimento trovato</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-gray-600" />
          <CardTitle>Movimenti Recenti</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {movements.slice(0, 5).map((movement: any) => (
            <div key={movement.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all duration-200 hover:shadow-md">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className={`p-2 rounded-full ${
                  movement.type === 'income' 
                    ? 'bg-green-50 dark:bg-green-900/20' 
                    : 'bg-red-50 dark:bg-red-900/20'
                }`}>
                  {movement.type === 'income' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {movement.company?.name || 'Azienda non specificata'}
                    </p>
                    <Badge variant={getStatusBadgeVariant(movement.status?.name)} className="text-xs shrink-0">
                      {movement.status?.name || 'N/A'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mb-1">
                    {movement.description || 'Nessuna descrizione'}
                  </p>
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <span>📅</span>
                      <span>{format(new Date(movement.flowDate), 'dd MMM yyyy', { locale: it })}</span>
                    </span>
                    {movement.documentNumber && (
                      <span className="flex items-center space-x-1">
                        <span>📄</span>
                        <span>#{movement.documentNumber}</span>
                      </span>
                    )}
                    {movement.core?.name && (
                      <span className="flex items-center space-x-1">
                        <span>🏢</span>
                        <span className="truncate">{movement.core.name}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right space-y-1 shrink-0 ml-4">
                <p className={`font-bold text-sm ${
                  movement.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {movement.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(parseFloat(movement.amount)))}
                </p>
                {movement.vatAmount && parseFloat(movement.vatAmount) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    IVA: {formatCurrency(parseFloat(movement.vatAmount))}
                  </p>
                )}
                {movement.resource?.name && (
                  <p className="text-xs text-muted-foreground">
                    👤 {movement.resource.name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}