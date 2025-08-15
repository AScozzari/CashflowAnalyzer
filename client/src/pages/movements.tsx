import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import FooterSignature from "@/components/layout/footer-signature";
import MovementFormNew from "@/components/movements/movement-form-new-fixed";
import MovementFilters from "@/components/movements/movement-filters";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Eye, Edit, Upload, Trash2, Download, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { MovementWithRelations } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { canCreateMovements, canEditMovements, canDeleteMovements } from "@/lib/permissions";

export default function Movements() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<MovementWithRelations | null>(null);
  const [viewingMovement, setViewingMovement] = useState<MovementWithRelations | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { data: movementsResponse, isLoading } = useQuery<{
    data: MovementWithRelations[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }>({
    queryKey: ["/api/movements"],
  });

  const movements = Array.isArray(movementsResponse?.data) ? movementsResponse.data : [];

  // Delete movement mutation
  const deleteMutation = useMutation({
    mutationFn: async (movementId: string) => {
      const response = await fetch(`/api/movements/${movementId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione del movimento');
      }
      // 204 No Content doesn't have a body to parse
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movements"] });
      toast({
        title: "Movimento eliminato",
        description: "Il movimento è stato eliminato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Gestisce i parametri URL per visualizzare o modificare movimento specifico
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewId = urlParams.get('view');
    const editId = urlParams.get('edit');
    
    if (movements.length > 0) {
      if (viewId) {
        const movementToView = movements.find((m: MovementWithRelations) => m.id === viewId);
        if (movementToView) {
          setViewingMovement(movementToView);
          setIsViewDialogOpen(true);
          // Pulisce il parametro URL
          window.history.replaceState({}, '', '/movements');
        }
      } else if (editId) {
        const movementToEdit = movements.find((m: MovementWithRelations) => m.id === editId);
        if (movementToEdit) {
          setEditingMovement(movementToEdit);
          setIsFormOpen(true);
          // Pulisce il parametro URL
          window.history.replaceState({}, '', '/movements');
        }
      }
    }
  }, [movements]);

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
    return type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Movimenti" 
        subtitle="Gestione dei flussi finanziari"
        action={
          canCreateMovements(user) ? (
            <Button 
              onClick={() => setIsFormOpen(true)}
              className="bg-primary hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Movimento
            </Button>
          ) : null
        }
      />
      
      {/* Professional Movement Form Modal */}
      <MovementFormNew
        movement={editingMovement || undefined}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingMovement(null);
        }}
      />
      
      <div className="p-4 md:p-6">
        <div className="bg-card dark:bg-card rounded-xl shadow-sm border border-border dark:border-border">
          <div className="p-4 md:p-6">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-muted-foreground">Caricamento movimenti...</div>
                </div>
              ) : movements.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-muted-foreground mb-2">Nessun movimento trovato</div>
                    {canCreateMovements(user) && (
                      <Button onClick={() => setIsFormOpen(true)} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Aggiungi il primo movimento
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Data Inserimento</TableHead>
                      <TableHead className="w-20">Data Flusso</TableHead>
                      <TableHead className="w-40">Ragione Sociale</TableHead>
                      <TableHead className="w-16">Tipo</TableHead>
                      <TableHead className="w-24">Core</TableHead>
                      <TableHead className="w-28">Risorsa</TableHead>
                      <TableHead className="w-28">Cliente</TableHead>
                      <TableHead className="w-28">Fornitore</TableHead>
                      <TableHead className="w-32">Causale</TableHead>
                      <TableHead className="w-24">Importo Totale</TableHead>
                      <TableHead className="w-20">Importo IVA</TableHead>
                      <TableHead className="w-20">Stato</TableHead>
                      <TableHead className="w-12">File</TableHead>
                      <TableHead className="w-16 text-center">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement: MovementWithRelations) => (
                      <TableRow key={movement.id}>
                        {/* Data Inserimento */}
                        <TableCell>
                          {format(new Date(movement.insertDate), 'dd/MM/yyyy', { locale: it })}
                        </TableCell>
                        
                        {/* Data Flusso */}
                        <TableCell>
                          {format(new Date(movement.flowDate), 'dd/MM/yyyy', { locale: it })}
                        </TableCell>
                        
                        {/* Ragione Sociale */}
                        <TableCell>
                          {movement.company ? (
                            <>
                              <div className="font-medium">{movement.company.name}</div>
                              <div className="text-sm text-gray-500">{movement.company.legalForm}</div>
                            </>
                          ) : (
                            <span className="text-gray-500">Nessuna ragione sociale</span>
                          )}
                        </TableCell>
                        
                        {/* Tipo */}
                        <TableCell>
                          <Badge variant={movement.type === 'income' ? 'default' : 'destructive'}>
                            {movement.type === 'income' ? 'Entrata' : 'Uscita'}
                          </Badge>
                        </TableCell>
                        
                        {/* Core */}
                        <TableCell>
                          {movement.core ? movement.core.name : <span className="text-gray-500">Nessun core</span>}
                        </TableCell>
                        
                        {/* Risorsa */}
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
                        
                        {/* Cliente */}
                        <TableCell>
                          {movement.customerId ? (
                            <div className="font-medium text-sm">Cliente (ID: {movement.customerId})</div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        
                        {/* Fornitore */}
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
                        
                        {/* Causale */}
                        <TableCell>
                          {movement.reason ? (
                            <div className="text-sm">{movement.reason.name}</div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        
                        {/* Importo Totale */}
                        <TableCell>
                          <span className={`font-medium ${getAmountColor(movement.type)}`}>
                            {formatAmount(movement.amount, movement.type)}
                          </span>
                        </TableCell>
                        
                        {/* Importo IVA */}
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
                        
                        {/* Stato */}
                        <TableCell>
                          {movement.status ? (
                            <Badge variant={getStatusBadge(movement.status.name)}>
                              {movement.status.name}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Nessuno stato</Badge>
                          )}
                        </TableCell>
                        
                        {/* File */}
                        <TableCell className="w-20">
                          {movement.fileName || movement.documentPath ? (
                            <div className="flex items-center justify-center">
                              {movement.documentPath ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  title={`Scarica: ${movement.fileName || 'documento'}`}
                                  onClick={() => {
                                    window.open(`/api/movements/${movement.id}/document`, '_blank');
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Paperclip className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-center block">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center w-24">
                          <div className="flex items-center justify-center space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              title="Visualizza dettagli"
                              onClick={() => {
                                setViewingMovement(movement);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canEditMovements(user) && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                title="Modifica movimento"
                                onClick={() => {
                                  setEditingMovement(movement);
                                  setIsFormOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteMovements(user) && (
                              <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  title="Elimina movimento"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Sei sicuro di voler eliminare questo movimento?
                                    <br />
                                    <strong>Tipo:</strong> {movement.type === 'income' ? 'Entrata' : 'Uscita'}
                                    <br />
                                    <strong>Importo:</strong> {new Intl.NumberFormat('it-IT', {
                                      style: 'currency',
                                      currency: 'EUR'
                                    }).format(parseFloat(movement.amount))}
                                    <br />
                                    <strong>Data:</strong> {format(new Date(movement.flowDate), 'dd/MM/yyyy', { locale: it })}
                                    <br />
                                    <br />
                                    Questa azione non può essere annullata.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(movement.id)}
                                    disabled={deleteMutation.isPending}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {deleteMutation.isPending ? 'Eliminando...' : 'Elimina'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Dialog per visualizzare i dettagli del movimento */}
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
                    <div><strong>Data:</strong> {format(new Date(viewingMovement.flowDate), 'dd/MM/yyyy', { locale: it })}</div>
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
                    {viewingMovement.documentPath && (
                      <div><strong>Documento Allegato:</strong> 
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="ml-2"
                          onClick={() => {
                            window.open(`/api/movements/${viewingMovement.id}/document`, '_blank');
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Scarica
                        </Button>
                      </div>
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
                  <h3 className="font-semibold text-lg mb-3">Associazioni</h3>
                  <div className="space-y-2">
                    <div><strong>Ragione Sociale:</strong> {viewingMovement.company?.name || 'N/A'}</div>
                    <div><strong>Core:</strong> {viewingMovement.core?.name || 'N/A'}</div>
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
                  <div className="space-y-2">
                    <div><strong>Note:</strong><br />
                      <div className="mt-1 p-2 bg-gray-50 rounded">{viewingMovement.notes}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Elimina
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
                      <AlertDialogDescription>
                        Sei sicuro di voler eliminare questo movimento?
                        <br />
                        <strong>Tipo:</strong> {viewingMovement.type === 'income' ? 'Entrata' : 'Uscita'}
                        <br />
                        <strong>Importo:</strong> {new Intl.NumberFormat('it-IT', {
                          style: 'currency',
                          currency: 'EUR'
                        }).format(parseFloat(viewingMovement.amount))}
                        <br />
                        <strong>Data:</strong> {format(new Date(viewingMovement.flowDate), 'dd/MM/yyyy', { locale: it })}
                        <br />
                        <br />
                        Questa azione non può essere annullata.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          deleteMutation.mutate(viewingMovement.id);
                          setIsViewDialogOpen(false);
                        }}
                        disabled={deleteMutation.isPending}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {deleteMutation.isPending ? 'Eliminando...' : 'Elimina'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      setEditingMovement(viewingMovement);
                      setIsFormOpen(true);
                    }}
                  >
                    Modifica
                  </Button>
                  <Button variant="secondary" onClick={() => setIsViewDialogOpen(false)}>
                    Chiudi
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      <FooterSignature />
    </div>
  );
}
