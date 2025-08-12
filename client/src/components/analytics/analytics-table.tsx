import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Eye, Download, FileText, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MovementWithRelations } from "@shared/schema";

interface AnalyticsTableProps {
  movements: MovementWithRelations[];
  isLoading?: boolean;
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onExportData?: () => void;
}

export default function AnalyticsTable({
  movements,
  isLoading = false,
  totalCount = 0,
  currentPage = 1,
  pageSize = 25,
  onPageChange = () => {},
  onPageSizeChange = () => {},
  onExportData
}: AnalyticsTableProps) {
  const [viewingMovement, setViewingMovement] = useState<MovementWithRelations | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

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

  const getAmountColor = (type: string) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  const formatAmount = (amount: string, type: string) => {
    const numAmount = parseFloat(amount);
    const formatted = new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(numAmount);
    return type === 'income' ? `+${formatted}` : `-${formatted}`;
  };

  const formatVatInfo = (vatAmount?: string, vatType?: string) => {
    if (!vatAmount || !vatType) return null;
    
    const amount = new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(parseFloat(vatAmount));
    
    const type = vatType.replace('iva_', 'IVA ').replace('_', '%').replace('art_74', 'Art 74');
    
    return { amount, type };
  };

  const handleViewMovement = (movement: MovementWithRelations) => {
    setViewingMovement(movement);
    setIsViewDialogOpen(true);
  };

  const handleDownloadFile = async (movementId: string, filename?: string) => {
    try {
      const response = await fetch(`/api/movements/${movementId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `movimento_${movementId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Errore nel download:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Caricamento dati...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Risultati Analisi</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Mostrando {startItem}-{endItem} di {totalCount} movimenti
              </p>
            </div>
            {onExportData && (
              <Button onClick={onExportData} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Esporta Dati
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {movements.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nessun movimento trovato con i filtri applicati</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data Flusso</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Ragione Sociale</TableHead>
                      <TableHead>Core</TableHead>
                      <TableHead>Risorsa</TableHead>
                      <TableHead>Causale</TableHead>
                      <TableHead>Fornitore</TableHead>
                      <TableHead>Importo</TableHead>
                      <TableHead>IVA</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Sede</TableHead>
                      <TableHead>IBAN</TableHead>
                      <TableHead>Data Inserimento</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => {
                      const vatInfo = formatVatInfo(movement.vatAmount, movement.vatType);
                      
                      return (
                        <TableRow key={movement.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {format(new Date(movement.flowDate), 'dd/MM/yyyy', { locale: it })}
                          </TableCell>
                          
                          <TableCell>
                            <Badge variant={movement.type === 'income' ? 'default' : 'secondary'}>
                              {movement.type === 'income' ? 'Entrata' : 'Uscita'}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            {movement.company?.name || '-'}
                          </TableCell>
                          
                          <TableCell>
                            {movement.core?.name || '-'}
                          </TableCell>
                          
                          <TableCell>
                            {movement.resource ? (
                              <div>
                                <div className="font-medium text-sm">
                                  {movement.resource.firstName} {movement.resource.lastName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {movement.resource.role}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">Non assegnata</span>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {movement.reason?.name || '-'}
                          </TableCell>
                          
                          <TableCell>
                            {movement.supplier ? (
                              <div>
                                <div className="font-medium text-sm">{movement.supplier.name}</div>
                                <div className="text-xs text-gray-500">{movement.supplier.vatNumber}</div>
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <span className={`font-medium ${getAmountColor(movement.type)}`}>
                              {formatAmount(movement.amount, movement.type)}
                            </span>
                          </TableCell>
                          
                          <TableCell>
                            {vatInfo ? (
                              <div>
                                <div className="font-medium text-sm">{vatInfo.amount}</div>
                                <div className="text-xs text-gray-500">{vatInfo.type}</div>
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {movement.status ? (
                              <Badge variant={getStatusBadge(movement.status.name)}>
                                {movement.status.name}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Nessuno stato</Badge>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {movement.office ? (
                              <div>
                                <div className="font-medium text-sm">{movement.office.name}</div>
                                <div className="text-xs text-gray-500">{movement.office.city}</div>
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {movement.iban ? (
                              <div>
                                <div className="font-medium text-sm">{movement.iban.bankName}</div>
                                <div className="text-xs text-gray-500">
                                  ****{movement.iban.iban.slice(-4)}
                                </div>
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(movement.createdAt), 'dd/MM/yyyy HH:mm', { locale: it })}
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewMovement(movement)}
                                title="Visualizza dettagli"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              {movement.fileName && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadFile(movement.id, movement.fileName)}
                                  title="Scarica allegato"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Elementi per pagina:</span>
                    <Select 
                      value={pageSize.toString()} 
                      onValueChange={(value) => onPageSizeChange(parseInt(value))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <span className="text-sm">
                      Pagina {currentPage} di {totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Movement Detail Dialog */}
      {viewingMovement && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Dettagli Movimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {/* Informazioni principali */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Informazioni Generali</h3>
                  <div className="space-y-2">
                    <div><strong>Tipo:</strong> {viewingMovement.type === 'income' ? 'Entrata' : 'Uscita'}</div>
                    <div><strong>Data Flusso:</strong> {format(new Date(viewingMovement.flowDate), 'dd/MM/yyyy', { locale: it })}</div>
                    <div><strong>Data Inserimento:</strong> {format(new Date(viewingMovement.createdAt), 'dd/MM/yyyy HH:mm', { locale: it })}</div>
                    <div><strong>Importo:</strong> <span className={`font-medium ${getAmountColor(viewingMovement.type)}`}>
                      {formatAmount(viewingMovement.amount, viewingMovement.type)}
                    </span></div>
                    <div><strong>Stato:</strong> 
                      <Badge variant={getStatusBadge(viewingMovement.status?.name || 'N/A')} className="ml-2">
                        {viewingMovement.status?.name || 'N/A'}
                      </Badge>
                    </div>
                    {viewingMovement.documentNumber && (
                      <div><strong>Numero Documento:</strong> {viewingMovement.documentNumber}</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Dettagli IVA</h3>
                  <div className="space-y-2">
                    {viewingMovement.vatAmount ? (
                      <>
                        <div><strong>Importo IVA:</strong> €{parseFloat(viewingMovement.vatAmount).toFixed(2)}</div>
                        <div><strong>Tipo IVA:</strong> {viewingMovement.vatType?.replace('iva_', 'IVA ').replace('_', '%').replace('art_74', 'Art 74')}</div>
                        {viewingMovement.netAmount && (
                          <div><strong>Importo Netto:</strong> €{parseFloat(viewingMovement.netAmount).toFixed(2)}</div>
                        )}
                      </>
                    ) : (
                      <div className="text-gray-500">Nessuna informazione IVA</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Associazioni */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Associazioni Aziendali</h3>
                  <div className="space-y-2">
                    <div><strong>Ragione Sociale:</strong> {viewingMovement.company?.name || 'N/A'}</div>
                    <div><strong>Core:</strong> {viewingMovement.core?.name || 'N/A'}</div>
                    <div><strong>Sede Operativa:</strong> {viewingMovement.office ? `${viewingMovement.office.name} - ${viewingMovement.office.city}` : 'N/A'}</div>
                    <div><strong>IBAN:</strong> {viewingMovement.iban ? `${viewingMovement.iban.bankName} - ****${viewingMovement.iban.iban.slice(-4)}` : 'N/A'}</div>
                    <div><strong>Risorsa:</strong> {viewingMovement.resource ? 
                      `${viewingMovement.resource.firstName} ${viewingMovement.resource.lastName} (${viewingMovement.resource.role})` : 
                      'Non assegnata'}
                    </div>
                    <div><strong>Causale:</strong> {viewingMovement.reason?.name || 'N/A'}</div>
                  </div>
                </div>

                {viewingMovement.supplier && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Fornitore</h3>
                    <div className="space-y-2">
                      <div><strong>Nome:</strong> {viewingMovement.supplier.name}</div>
                      <div><strong>P.IVA:</strong> {viewingMovement.supplier.vatNumber}</div>
                      {viewingMovement.supplier.address && (
                        <div><strong>Indirizzo:</strong> {viewingMovement.supplier.address}</div>
                      )}
                      {viewingMovement.supplier.city && (
                        <div><strong>Città:</strong> {viewingMovement.supplier.city}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Note */}
              {viewingMovement.notes && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Note</h3>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {viewingMovement.notes}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                {viewingMovement.fileName && (
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadFile(viewingMovement.id, viewingMovement.fileName)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Scarica Allegato
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setIsViewDialogOpen(false)}>
                  Chiudi
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}