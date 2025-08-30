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
  ArrowRightLeft
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Invoice {
  id: string;
  number: string;
  issueDate: string;
  dueDate?: string;
  customerName: string;
  totalAmount: number;
  status: 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  sdiStatus?: 'pending' | 'accepted' | 'rejected' | 'error';
  direction: 'outgoing' | 'incoming';
}

export function InvoicesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch invoices from the backend
  const { data: invoicesResponse, isLoading, refetch } = useQuery<{invoices: Invoice[], total: number}>({
    queryKey: ['/api/invoicing/invoices', { search: searchTerm, status: statusFilter, direction: directionFilter }],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const currentInvoices = invoicesResponse?.invoices || [];

  // 🔥 MUTATION: Create Movement from Invoice
  const createMovementMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return apiRequest(`/api/invoicing/invoices/${invoiceId}/create-movement`, {
        method: 'POST',
        body: {
          // Options per il movimento
          coreId: null, // Usa il default della compagnia
          statusId: '1', // Status default
          additionalNotes: 'Movimento creato automaticamente da fattura'
        }
      });
    },
    onSuccess: (data, invoiceId) => {
      toast({
        title: "Movimento Creato!",
        description: `Movimento finanziario creato automaticamente dalla fattura. Importo: €${Math.abs(parseFloat(data.movement.amount)).toLocaleString('it-IT')}`,
      });
      // Refresh movements list if needed
      queryClient.invalidateQueries({ queryKey: ['/api/movements'] });
    },
    onError: (error: any, invoiceId) => {
      console.error('Errore creazione movimento:', error);
      
      // Gestisci errori specifici
      if (error.message?.includes('already exists')) {
        toast({
          title: "Movimento già esistente",
          description: "Questa fattura ha già un movimento associato.",
          variant: "destructive",
        });
      } else if (error.message?.includes('cannot generate movement')) {
        toast({
          title: "Movimento non generabile",
          description: "Questa tipologia di fattura non può generare movimenti automatici.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Errore",
          description: "Impossibile creare il movimento. Riprova.",
          variant: "destructive",
        });
      }
    }
  });

  const handleCreateMovement = (invoice: Invoice) => {
    // Verifica se la fattura può generare movimento
    if (invoice.status === 'cancelled') {
      toast({
        title: "Fattura annullata",
        description: "Le fatture annullate non possono generare movimenti.",
        variant: "destructive",
      });
      return;
    }

    if (invoice.status === 'draft') {
      toast({
        title: "Fattura in bozza",
        description: "Emetti prima la fattura per creare il movimento.",
        variant: "destructive",
      });
      return;
    }

    createMovementMutation.mutate(invoice.id);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, label: "Bozza", icon: Edit },
      issued: { variant: "default" as const, label: "Emessa", icon: FileText },
      sent: { variant: "default" as const, label: "Inviata", icon: Send },
      paid: { variant: "default" as const, label: "Pagata", icon: CheckCircle },
      overdue: { variant: "destructive" as const, label: "Scaduta", icon: AlertCircle },
      cancelled: { variant: "secondary" as const, label: "Annullata", icon: Trash2 }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getSdiStatusBadge = (sdiStatus?: string) => {
    if (!sdiStatus) return null;

    const statusConfig = {
      pending: { variant: "secondary" as const, label: "In Attesa" },
      accepted: { variant: "default" as const, label: "Accettata" },
      rejected: { variant: "destructive" as const, label: "Rifiutata" },
      error: { variant: "destructive" as const, label: "Errore" }
    };

    const config = statusConfig[sdiStatus as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const filteredInvoices = currentInvoices.filter(invoice => {
    const matchesSearch = 
      invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    const matchesDirection = directionFilter === "all" || invoice.direction === directionFilter;

    return matchesSearch && matchesStatus && matchesDirection;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con Filtri */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span>Gestione Fatture</span>
              <Badge variant="secondary">{filteredInvoices.length}</Badge>
            </CardTitle>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Fattura
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Cerca per numero fattura o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-invoices"
              />
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="status-filter">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="draft">Bozze</SelectItem>
                <SelectItem value="issued">Emesse</SelectItem>
                <SelectItem value="sent">Inviate</SelectItem>
                <SelectItem value="paid">Pagate</SelectItem>
                <SelectItem value="overdue">Scadute</SelectItem>
                <SelectItem value="cancelled">Annullate</SelectItem>
              </SelectContent>
            </Select>

            {/* Direction Filter */}
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="direction-filter">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                <SelectItem value="outgoing">In Uscita</SelectItem>
                <SelectItem value="incoming">In Entrata</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Esporta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista Fatture */}
      <Card>
        <CardContent className="p-0">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nessuna fattura trovata
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {searchTerm || statusFilter !== "all" || directionFilter !== "all" 
                  ? "Prova a modificare i filtri di ricerca"
                  : "Crea la tua prima fattura per iniziare"
                }
              </p>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Nuova Fattura
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                            <span>{invoice.number}</span>
                            {invoice.direction === 'incoming' && (
                              <Badge variant="outline" className="text-xs">Entrata</Badge>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {invoice.customerName}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(invoice.issueDate).toLocaleDateString('it-IT')}
                            </span>
                            {invoice.dueDate && (
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                Scad. {new Date(invoice.dueDate).toLocaleDateString('it-IT')}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            €{invoice.totalAmount.toLocaleString('it-IT')}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusBadge(invoice.status)}
                            {getSdiStatusBadge(invoice.sdiStatus)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`invoice-actions-${invoice.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizza
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Scarica PDF
                          </DropdownMenuItem>
                          {invoice.status === 'draft' && (
                            <DropdownMenuItem>
                              <Send className="h-4 w-4 mr-2" />
                              Invia
                            </DropdownMenuItem>
                          )}
                          
                          {/* 🔥 PULSANTE CRUCIALE: Crea Movimento da Fattura */}
                          {(invoice.status === 'issued' || invoice.status === 'sent' || invoice.status === 'paid') && (
                            <DropdownMenuItem 
                              onClick={() => handleCreateMovement(invoice)}
                              disabled={createMovementMutation.isPending}
                              className="text-green-600 font-medium"
                              data-testid={`create-movement-${invoice.id}`}
                            >
                              <ArrowRightLeft className="h-4 w-4 mr-2" />
                              {createMovementMutation.isPending ? 'Creando...' : 'Crea Movimento'}
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}