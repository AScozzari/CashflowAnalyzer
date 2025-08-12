import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, ArrowRight, Download } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import type { MovementWithRelations } from "@shared/schema";

interface RecentMovementsProps {
  movements?: MovementWithRelations[];
  isLoading: boolean;
}

export default function RecentMovements({ movements, isLoading }: RecentMovementsProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Saldato": "default",
      "Da Saldare": "secondary", 
      "In Lavorazione": "outline",
      "Saldato Parziale": "secondary",
      "Annullato": "destructive",
      "Sospeso": "outline",
    };
    return variants[status] || "default";
  };

  const formatAmount = (amount: string, type: string) => {
    const formatted = new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(parseFloat(amount));
    
    return type === 'income' ? `+ ${formatted}` : `- ${formatted}`;
  };

  const getAmountColor = (type: string) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Movimenti Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Movimenti Recenti</CardTitle>
          <Link href="/movements">
            <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700">
              Vedi tutti
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {!movements || movements.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="text-gray-500 mb-2">Nessun movimento recente</div>
              <Link href="/movements">
                <Button variant="outline" size="sm">
                  Aggiungi il primo movimento
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Ragione Sociale</TableHead>
                  <TableHead>Core</TableHead>
                  <TableHead>Risorsa</TableHead>
                  <TableHead>Causale</TableHead>
                  <TableHead>Fornitore</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>IVA</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements?.slice(0, 5).map((movement) => {
                  if (!movement) return null;
                  
                  return (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {format(new Date(movement.flowDate), 'dd/MM/yyyy', { locale: it })}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{movement.company?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{movement.company?.legalForm || ''}</div>
                      </TableCell>
                      <TableCell>{movement.core?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {movement.resource ? (
                          <div>
                            <div className="font-medium text-sm">{movement.resource.firstName} {movement.resource.lastName}</div>
                            <div className="text-xs text-gray-500">{movement.resource.role}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Non assegnata</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {movement.reason ? (
                          <div className="text-sm">{movement.reason.name}</div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {movement.supplier?.name ? (
                          <div>
                            <div className="font-medium text-sm">{movement.supplier.name}</div>
                            <div className="text-xs text-gray-500">{movement.supplier.vatNumber}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getAmountColor(movement.type)}`}>
                          {formatAmount(movement.amount, movement.type)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {movement.vatAmount && movement.vatType ? (
                          <div>
                            <div className="font-medium text-sm">
                              {new Intl.NumberFormat('it-IT', {
                                style: 'currency',
                                currency: 'EUR'
                              }).format(parseFloat(movement.vatAmount))}
                            </div>
                            <div className="text-xs text-gray-500">
                              {movement.vatType.replace('iva_', 'IVA ').replace('_', '%').replace('art_74', 'Art 74')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(movement.status?.name || 'N/A')}>
                          {movement.status?.name || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {movement.documentPath && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              title="Scarica documento allegato"
                              onClick={() => {
                                window.open(`/api/movements/${movement.id}/document`, '_blank');
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Link href={`/movements?view=${movement.id}`}>
                            <Button variant="ghost" size="sm" title="Visualizza dettagli movimento">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/movements?edit=${movement.id}`}>
                            <Button variant="ghost" size="sm" title="Modifica movimento">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
