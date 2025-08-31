import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Send, 
  Trash2,
  Plus,
  Calendar,
  Euro,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  ArrowRightLeft,
  Code,
  RefreshCw,
  X,
  Grid3X3,
  List,
  SortAsc,
  SortDesc
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  customerName: string;
  totalAmount: string;
  status: 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  sdiStatus?: 'pending' | 'accepted' | 'rejected' | 'error' | 'draft';
  direction?: 'outgoing' | 'incoming';
  xmlContent?: string;
  notes?: string;
  subtotal?: string;
  vatAmount?: string;
}

type ViewMode = 'grid' | 'list';
type SortField = 'date' | 'amount' | 'number' | 'customer';
type SortDirection = 'asc' | 'desc';

export function InvoicesListProfessional() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showXmlModal, setShowXmlModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch invoices from the backend
  const { data: invoicesResponse, isLoading, refetch } = useQuery<{invoices: Invoice[], total: number}>({
    queryKey: ['/api/invoicing/invoices'],
    refetchInterval: 30000,
  });

  const currentInvoices = invoicesResponse?.invoices || [];

  // Filter and sort invoices
  const filteredAndSortedInvoices = currentInvoices
    .filter(invoice => {
      const matchesSearch = 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.totalAmount.includes(searchTerm);
      
      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
      const matchesDirection = directionFilter === "all" || (invoice.direction || 'outgoing') === directionFilter;

      return matchesSearch && matchesStatus && matchesDirection;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'date':
          aValue = new Date(a.invoiceDate).getTime();
          bValue = new Date(b.invoiceDate).getTime();
          break;
        case 'amount':
          aValue = parseFloat(a.totalAmount);
          bValue = parseFloat(b.totalAmount);
          break;
        case 'number':
          aValue = a.invoiceNumber;
          bValue = b.invoiceNumber;
          break;
        case 'customer':
          aValue = a.customerName.toLowerCase();
          bValue = b.customerName.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, label: "Bozza", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
      issued: { variant: "default" as const, label: "Emessa", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      sent: { variant: "default" as const, label: "Inviata", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
      paid: { variant: "default" as const, label: "Pagata", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      overdue: { variant: "destructive" as const, label: "Scaduta", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
      cancelled: { variant: "outline" as const, label: "Annullata", className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <Badge variant={config.variant} className={`text-xs font-medium ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  // SDI Status badge helper
  const getSdiStatusBadge = (sdiStatus?: string) => {
    if (!sdiStatus) return null;
    
    const statusConfig = {
      pending: { icon: Clock, className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", label: "In attesa" },
      accepted: { icon: CheckCircle, className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "Accettata" },
      rejected: { icon: AlertCircle, className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Rifiutata" },
      error: { icon: AlertCircle, className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Errore" }
    };
    
    const config = statusConfig[sdiStatus as keyof typeof statusConfig];
    if (!config) return null;
    
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Action handlers (usando fetch per ora, senza problemi TypeScript)
  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/invoicing/invoices/${invoice.id}/pdf`);
      if (!response.ok) throw new Error('Errore download PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fattura_${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF Scaricato!",
        description: `Fattura ${invoice.invoiceNumber} scaricata con successo.`,
      });
    } catch (error) {
      toast({
        title: "Errore Download",
        description: "Impossibile scaricare il PDF della fattura.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadXml = async (invoice: Invoice) => {
    try {
      if (!invoice.xmlContent) {
        toast({
          title: "XML non disponibile",
          description: "Questa fattura non ha contenuto XML associato.",
          variant: "destructive",
        });
        return;
      }

      const blob = new Blob([invoice.xmlContent], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fattura_${invoice.invoiceNumber}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "XML Scaricato!",
        description: `XML fattura ${invoice.invoiceNumber} scaricato con successo.`,
      });
    } catch (error) {
      toast({
        title: "Errore Download",
        description: "Impossibile scaricare l'XML della fattura.",
        variant: "destructive",
      });
    }
  };

  const handleViewXml = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowXmlModal(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🔥 NUOVO HEADER PROFESSIONALE */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              Gestione Fatture Elettroniche
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
              Sistema completo per fatturazione elettronica italiana (FatturaPA)
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border-2">
              {filteredAndSortedInvoices.length} di {currentInvoices.length} fatture
            </Badge>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => refetch()}
              className="hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-white dark:bg-gray-800 border-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Aggiorna
            </Button>
          </div>
        </div>

        {/* 🔥 BARRA STRUMENTI AVANZATA */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca fatture..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                data-testid="search-invoices"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="draft">Bozze</SelectItem>
              <SelectItem value="sent">Inviate</SelectItem>
              <SelectItem value="paid">Pagate</SelectItem>
              <SelectItem value="overdue">Scadute</SelectItem>
            </SelectContent>
          </Select>

          {/* Direction Filter */}
          <Select value={directionFilter} onValueChange={setDirectionFilter}>
            <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tipi</SelectItem>
              <SelectItem value="outgoing">Emesse</SelectItem>
              <SelectItem value="incoming">Ricevute</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={`${sortField}-${sortDirection}`} onValueChange={(value) => {
            const [field, direction] = value.split('-');
            setSortField(field as SortField);
            setSortDirection(direction as SortDirection);
          }}>
            <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Ordina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Data (nuove)</SelectItem>
              <SelectItem value="date-asc">Data (vecchie)</SelectItem>
              <SelectItem value="amount-desc">Importo (alto)</SelectItem>
              <SelectItem value="amount-asc">Importo (basso)</SelectItem>
              <SelectItem value="number-asc">Numero</SelectItem>
              <SelectItem value="customer-asc">Cliente</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode & Actions */}
          <div className="flex items-center space-x-2">
            <div className="flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none border-l"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            <Button variant="outline" size="sm" className="bg-white dark:bg-gray-900">
              <Download className="h-4 w-4 mr-1" />
              Esporta
            </Button>
          </div>
        </div>
      </div>

      {/* 🔥 LISTA FATTURE RIDISEGNATA */}
      {filteredAndSortedInvoices.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
          <CardContent className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nessuna fattura trovata
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter !== "all" || directionFilter !== "all" 
                ? "Prova a modificare i filtri di ricerca per trovare le fatture desiderate"
                : "Inizia creando la tua prima fattura elettronica"
              }
            </p>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Fattura
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {filteredAndSortedInvoices.map((invoice) => (
            <Card 
              key={invoice.id} 
              className="group hover:shadow-sm transition-all duration-200 border hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 flex items-center space-x-4">
                    {/* Numero e Tipo */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {invoice.invoiceNumber}
                        </h3>
                        <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
                          {(invoice.direction || 'outgoing') === 'outgoing' ? 'EMESSA' : 'RICEVUTA'}
                        </Badge>
                      </div>
                    </div>

                    {/* Cliente */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {invoice.customerName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(invoice.invoiceDate).toLocaleDateString('it-IT')}
                      </p>
                    </div>

                    {/* Importo */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        €{parseFloat(invoice.totalAmount).toLocaleString('it-IT')}
                      </p>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(invoice.status)}
                        {getSdiStatusBadge(invoice.sdiStatus)}
                      </div>
                    </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDownloadPdf(invoice)}>
                            <Download className="h-4 w-4 mr-2" />
                            Scarica PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadXml(invoice)}>
                            <Download className="h-4 w-4 mr-2" />
                            Scarica XML
                          </DropdownMenuItem>
                          {invoice.xmlContent && (
                            <DropdownMenuItem onClick={() => handleViewXml(invoice)}>
                              <Code className="h-4 w-4 mr-2" />
                              Visualizza XML
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Send className="h-4 w-4 mr-2" />
                            Invia
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 🔥 XML VIEWER MODAL */}
      <Dialog open={showXmlModal} onOpenChange={setShowXmlModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>XML Fattura {selectedInvoice?.invoiceNumber}</span>
            </DialogTitle>
            <DialogDescription>
              Contenuto XML della fattura elettronica
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96 w-full">
            <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
              <code>{selectedInvoice?.xmlContent || 'Nessun contenuto XML disponibile'}</code>
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}