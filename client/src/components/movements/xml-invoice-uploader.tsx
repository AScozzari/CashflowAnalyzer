import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileX, FileCheck, AlertTriangle, CheckCircle, XCircle, Building, Truck, Euro, Calendar, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ParsedInvoiceData {
  supplier: {
    vatNumber: string;
    taxCode?: string;
    name: string;
    address?: string;
    zipCode?: string;
    city?: string;
    country?: string;
  };
  invoice: {
    documentType: string;
    documentNumber: string;
    documentDate: string;
    totalAmount: number;
    vatAmount: number;
    netAmount: number;
    currency: string;
    description: string;
  };
  customer: {
    vatNumber: string;
    taxCode?: string;
    name: string;
  };
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    vatRate: number;
    vatAmount: number;
  }>;
  payment?: {
    terms: string;
    dueDate?: string;
    amount: number;
    method?: string;
  };
}

interface MovementSuggestion {
  type: 'income' | 'expense';
  amount: string;
  flowDate: string;
  documentNumber: string;
  documentDate: string;
  description: string;
  notes: string;
  supplierId?: string;
  companyId?: string;
  vatAmount?: number;
  netAmount?: number;
}

interface SupplierInfo {
  exists: boolean;
  supplier?: any;
  suggested?: {
    name: string;
    vatNumber: string;
    taxCode?: string;
    address?: string;
    zipCode?: string;
    city?: string;
    country?: string;
  };
}

interface XMLParseResponse {
  success: boolean;
  fileName: string;
  parsedData: ParsedInvoiceData;
  movementSuggestions: MovementSuggestion[];
  supplierInfo: SupplierInfo | null;
  message: string;
}

export default function XMLInvoiceUploader() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [parseResult, setParseResult] = useState<XMLParseResponse | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const parseXMLMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('xmlFile', file);
      
      const res = await apiRequest('POST', '/api/invoices/parse-xml', formData);
      return await res.json();
    },
    onSuccess: (data: XMLParseResponse) => {
      setParseResult(data);
      // Seleziona automaticamente il primo suggerimento
      if (data.movementSuggestions.length > 0) {
        setSelectedSuggestions([0]);
      }
      toast({
        title: "XML Analizzato",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore Parsing XML",
        description: error.message || "Errore nell'analisi del file XML",
        variant: "destructive",
      });
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (supplierData: any) => {
      const res = await apiRequest('POST', '/api/suppliers/create-from-xml', supplierData);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Fornitore Creato",
        description: data.message,
      });
      // Aggiorna i dati parsed per includere il nuovo supplier ID
      if (parseResult) {
        setParseResult({
          ...parseResult,
          supplierInfo: {
            exists: true,
            supplier: data.supplier
          },
          movementSuggestions: parseResult.movementSuggestions.map(suggestion => ({
            ...suggestion,
            supplierId: suggestion.type === 'expense' ? data.supplier.id : suggestion.supplierId
          }))
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Errore Creazione Fornitore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createMovementsMutation = useMutation({
    mutationFn: async (data: { suggestions: MovementSuggestion[], selectedSuggestions: number[] }) => {
      const res = await apiRequest('POST', '/api/movements/create-from-xml', data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/movements'] });
      toast({
        title: "Movimenti Creati",
        description: data.message,
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Errore Creazione Movimenti",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xml')) {
      toast({
        title: "File non valido",
        description: "Seleziona un file XML di fattura elettronica",
        variant: "destructive",
      });
      return;
    }
    parseXMLMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleCreateSupplier = () => {
    if (parseResult?.supplierInfo?.suggested) {
      createSupplierMutation.mutate(parseResult.supplierInfo.suggested);
    }
  };

  const handleCreateMovements = () => {
    if (parseResult && selectedSuggestions.length > 0) {
      createMovementsMutation.mutate({
        suggestions: parseResult.movementSuggestions,
        selectedSuggestions
      });
    }
  };

  const handleSuggestionToggle = (index: number) => {
    setSelectedSuggestions(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setParseResult(null);
    setSelectedSuggestions([]);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Carica Fattura XML
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importa Fattura Elettronica XML</DialogTitle>
          <DialogDescription>
            Carica una fattura elettronica in formato XML per generare automaticamente i movimenti
          </DialogDescription>
        </DialogHeader>

        {!parseResult ? (
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver ? 'border-primary bg-primary/5' : 'border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
          >
            {parseXMLMutation.isPending ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-gray-600">Analisi del file XML in corso...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <FileX className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium">Trascina qui il file XML</p>
                  <p className="text-sm text-gray-600">oppure clicca per selezionarlo</p>
                </div>
                <input
                  type="file"
                  accept=".xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                  id="xml-file-input"
                />
                <Button asChild variant="outline">
                  <label htmlFor="xml-file-input" className="cursor-pointer">
                    Seleziona File XML
                  </label>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header con info fattura */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-green-600" />
                  {parseResult.parsedData.invoice.description}
                </CardTitle>
                <CardDescription>
                  Fattura {parseResult.parsedData.invoice.documentNumber} del {parseResult.parsedData.invoice.documentDate}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Importo Totale</p>
                    <p className="text-lg font-bold text-green-600">
                      €{parseResult.parsedData.invoice.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Imponibile</p>
                    <p className="text-sm">€{parseResult.parsedData.invoice.netAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">IVA</p>
                    <p className="text-sm">€{parseResult.parsedData.invoice.vatAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tipo</p>
                    <Badge variant={parseResult.movementSuggestions[0]?.type === 'income' ? 'default' : 'destructive'}>
                      {parseResult.movementSuggestions[0]?.type === 'income' ? 'Entrata' : 'Uscita'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Fornitore/Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {parseResult.movementSuggestions[0]?.type === 'expense' ? 'Fornitore' : 'Cliente'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{parseResult.parsedData.supplier.name}</p>
                  <p className="text-sm text-gray-600">P.IVA: {parseResult.parsedData.supplier.vatNumber}</p>
                  {parseResult.parsedData.supplier.address && (
                    <p className="text-sm text-gray-600">
                      {parseResult.parsedData.supplier.address}, {parseResult.parsedData.supplier.zipCode} {parseResult.parsedData.supplier.city}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {parseResult.movementSuggestions[0]?.type === 'income' ? 'Cliente' : 'Azienda'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{parseResult.parsedData.customer.name}</p>
                  <p className="text-sm text-gray-600">P.IVA: {parseResult.parsedData.customer.vatNumber}</p>
                </CardContent>
              </Card>
            </div>

            {/* Gestione Fornitore */}
            {parseResult.supplierInfo && !parseResult.supplierInfo.exists && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex justify-between items-center">
                  <span>
                    Il fornitore <strong>{parseResult.supplierInfo.suggested?.name}</strong> non esiste nel sistema.
                  </span>
                  <Button 
                    size="sm" 
                    onClick={handleCreateSupplier}
                    disabled={createSupplierMutation.isPending}
                  >
                    {createSupplierMutation.isPending ? 'Creazione...' : 'Crea Fornitore'}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {parseResult.supplierInfo?.exists && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Fornitore <strong>{parseResult.supplierInfo.supplier?.name}</strong> trovato nel sistema.
                </AlertDescription>
              </Alert>
            )}

            {/* Suggerimenti Movimenti */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Suggerimenti Movimenti ({parseResult.movementSuggestions.length})
                </CardTitle>
                <CardDescription>
                  Seleziona i movimenti da creare automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-64">
                  <div className="space-y-3">
                    {parseResult.movementSuggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={selectedSuggestions.includes(index)}
                          onCheckedChange={() => handleSuggestionToggle(index)}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{suggestion.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant={suggestion.type === 'income' ? 'default' : 'destructive'}>
                                {suggestion.type === 'income' ? 'Entrata' : 'Uscita'}
                              </Badge>
                              <span className="font-bold text-lg">€{parseFloat(suggestion.amount).toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {suggestion.documentNumber}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {suggestion.documentDate}
                            </span>
                          </div>
                          {suggestion.notes && (
                            <p className="text-xs text-gray-500 line-clamp-2">{suggestion.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Azioni */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleCloseDialog}>
                Annulla
              </Button>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setParseResult(null)}
                  variant="outline"
                >
                  Carica Altro File
                </Button>
                <Button 
                  onClick={handleCreateMovements}
                  disabled={selectedSuggestions.length === 0 || createMovementsMutation.isPending}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {createMovementsMutation.isPending 
                    ? 'Creazione...' 
                    : `Crea ${selectedSuggestions.length} Movimento${selectedSuggestions.length > 1 ? 'i' : ''}`
                  }
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}