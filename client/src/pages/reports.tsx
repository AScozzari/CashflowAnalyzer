import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { FooterSignature } from "@/components/layout/footer-signature";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Eye, Calendar, Building2, Euro, Filter } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { MovementWithRelations } from "@shared/schema";

export default function Reports() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Fixed to 10 as requested
  const [selectedFilter, setSelectedFilter] = useState('current-month');

  // Calculate current month date range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Fetch movements with documents from current month
  const { data: movementsResponse, isLoading } = useQuery<{
    data: MovementWithRelations[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }>({
    queryKey: [`/api/movements/filtered?startDate=${startOfMonth.toISOString().split('T')[0]}&endDate=${endOfMonth.toISOString().split('T')[0]}&hasDocument=true&page=${currentPage}&pageSize=${itemsPerPage}`],
  });

  const movements = movementsResponse?.data || [];
  const pagination = movementsResponse?.pagination;

  // Calculate totals for current month documents
  const totals = useMemo(() => {
    const totalAmount = movements.reduce((sum, movement) => {
      const amount = parseFloat(movement.amount);
      return movement.type === 'income' ? sum + amount : sum - amount;
    }, 0);

    const incomeAmount = movements
      .filter(m => m.type === 'income')
      .reduce((sum, m) => sum + parseFloat(m.amount), 0);

    const expenseAmount = movements
      .filter(m => m.type === 'expense')
      .reduce((sum, m) => sum + parseFloat(m.amount), 0);

    return {
      totalAmount,
      incomeAmount,
      expenseAmount,
      totalDocuments: movements.length
    };
  }, [movements]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'completato':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
      case 'in attesa':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'cancelled':
      case 'annullato':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleDownload = async (movementId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/movements/${movementId}/document`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Report Documenti</h1>
              <p className="text-muted-foreground">
                Documenti allegati ai movimenti del mese corrente
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Mese Corrente
              </Badge>
              <Badge variant="default" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {totals.totalDocuments} Documenti
              </Badge>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documenti Totali</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totals.totalDocuments}</div>
                <p className="text-xs text-muted-foreground">Con allegato</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entrate</CardTitle>
                <Euro className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totals.incomeAmount)}
                </div>
                <p className="text-xs text-muted-foreground">Con documenti</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uscite</CardTitle>
                <Euro className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totals.expenseAmount)}
                </div>
                <p className="text-xs text-muted-foreground">Con documenti</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Netto</CardTitle>
                <Euro className={`h-4 w-4 ${totals.totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${totals.totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totals.totalAmount)}
                </div>
                <p className="text-xs text-muted-foreground">Differenza</p>
              </CardContent>
            </Card>
          </div>

          {/* Documents Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documenti Mese Corrente
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current-month">Mese Corrente</SelectItem>
                      <SelectItem value="all">Tutti i Documenti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : movements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Nessun documento trovato</h3>
                  <p className="text-sm">Non ci sono movimenti con documenti allegati per questo periodo.</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrizione</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Importo</TableHead>
                        <TableHead>Azienda</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell className="font-medium">
                            {format(new Date(movement.flowDate), 'dd/MM/yyyy', { locale: it })}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {movement.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant={movement.type === 'income' ? 'default' : 'secondary'}>
                              {movement.type === 'income' ? 'Entrata' : 'Uscita'}
                            </Badge>
                          </TableCell>
                          <TableCell className={`font-semibold ${movement.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {movement.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(parseFloat(movement.amount)))}
                          </TableCell>
                          <TableCell className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {movement.company?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(movement.status?.name || '')}>
                              {movement.status?.name || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {movement.documentPath && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Allegato
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {movement.documentPath && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleDownload(movement.id, `documento_${movement.id}.pdf`)}
                                    title="Scarica documento"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => window.open(`/api/movements/${movement.id}/document`, '_blank')}
                                    title="Visualizza documento"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} di {pagination.total} documenti
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          Precedente
                        </Button>
                        <span className="text-sm font-medium">
                          Pagina {currentPage} di {pagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                          disabled={currentPage === pagination.totalPages}
                        >
                          Successiva
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <FooterSignature />
    </div>
  );
}