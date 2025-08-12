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
        <div className="space-y-4">
          {movements.slice(0, 5).map((movement: any) => (
            <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                {movement.type === 'income' ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <p className="font-medium text-sm">
                    {movement.company?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(movement.flowDate), 'dd MMM yyyy', { locale: it })}
                  </p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className={`font-medium ${
                  movement.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {movement.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(parseFloat(movement.amount)))}
                </p>
                <Badge variant={getStatusBadgeVariant(movement.status?.name)} className="text-xs">
                  {movement.status?.name || 'N/A'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}