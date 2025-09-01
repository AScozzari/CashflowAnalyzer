import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Search, 
  User, 
  Building2, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  MessageSquare,
  Send,
  Activity,
  TrendingUp,
  TrendingDown,
  Eye,
  Filter,
  RotateCcw,
  Download,
  MoreHorizontal,
  Building,
  UserCheck,
  Briefcase,
  CreditCard,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Hash,
  Euro
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Company, Customer, Resource, MovementWithRelations } from '@shared/schema';

interface EntitySearchResult {
  id: string;
  name: string;
  type: 'supplier' | 'customer' | 'resource';
  subtitle: string;
  avatar?: string;
  status?: string;
}

interface EntityDetails {
  entity: Company | Customer | Resource;
  type: 'supplier' | 'customer' | 'resource';
  movements: MovementWithRelations[];
  communications: {
    whatsapp: any[];
    email: any[];
    sms: any[];
  };
  stats: {
    totalMovements: number;
    totalAmount: number;
    lastActivity: string;
    averageAmount: number;
  };
}

export default function EntityExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<EntitySearchResult | null>(null);
  const [searchResults, setSearchResults] = useState<EntitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showEntityModal, setShowEntityModal] = useState(false);

  // Real search function using API
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    console.log('[ENTITY SEARCH] Starting search for:', query);
    
    try {
      // Real API call to search entities
      const response = await fetch('/api/search/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ query })
      });
      
      console.log('[ENTITY SEARCH] Response status:', response.status);
      
      if (response.ok) {
        const results = await response.json();
        console.log('[ENTITY SEARCH] Results received:', results);
        
        // Apply client-side filters
        let filteredResults = results || [];
        
        if (typeFilter !== 'all') {
          filteredResults = filteredResults.filter(r => r.type === typeFilter);
        }
        
        if (statusFilter !== 'all') {
          filteredResults = filteredResults.filter(r => r.status === statusFilter);
        }
        
        setSearchResults(filteredResults);
      } else {
        console.error('[ENTITY SEARCH] API error:', response.status, response.statusText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('[ENTITY SEARCH] Network error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch entity details when selected
  const { data: entityDetails, isLoading: entityLoading } = useQuery({
    queryKey: ['/api/entities', selectedEntity?.id, selectedEntity?.type],
    enabled: !!selectedEntity,
    queryFn: async (): Promise<EntityDetails> => {
      // SOLO API REALI - No fallback mock data
      const response = await fetch(`/api/entities/${selectedEntity!.id}?type=${selectedEntity!.type}`);
      
      if (!response.ok) {
        throw new Error(`Entity API failed: ${response.status} ${response.statusText}`);
      }
      
      const entityData = await response.json();
      
      console.log('[ENTITY EXPLORER] ✅ Real entity data loaded:', entityData);
      return entityData;
    }
  });

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'supplier': return <Building2 className="w-5 h-5" />;
      case 'customer': return <User className="w-5 h-5" />;
      case 'resource': return <Users className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'supplier': return 'Fornitore';
      case 'customer': return 'Cliente';
      case 'resource': return 'Risorsa';
      default: return 'Entità';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/20">
      <Header 
        title="Esplora Entità"
        subtitle="Ricerca e analizza fornitori, clienti e risorse"
      />
      
      <div className="container mx-auto px-4 lg:px-6 py-6">
        {/* Search Section */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Cerca fornitori, clienti o risorse..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    performSearch(e.target.value);
                  }}
                  className="pl-10 pr-4 py-3 text-lg border-0 bg-muted/30 focus:bg-background transition-colors"
                />
              </div>
              <Button 
                variant="outline" 
                size="lg"
                className="px-6"
                disabled={isSearching}
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setSearchResults([]);
                  setSelectedEntity(null);
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Resetta
              </Button>
            </div>


            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Risultati ({searchResults.length})
                </h3>
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center space-x-4 p-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border"
                      onClick={() => setSelectedEntity(result)}
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getEntityIcon(result.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{result.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {getEntityTypeLabel(result.type)}
                          </Badge>
                          {result.status && (
                            <Badge variant="default" className="text-xs bg-green-600">
                              {result.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEntity(result);
                          setShowEntityModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Entity Details */}
        {selectedEntity && (
          <div className="space-y-6">
            {entityLoading || !entityDetails ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Caricamento dettagli entità...</p>
                </CardContent>
              </Card>
            ) : entityDetails ? (
              <>
                {/* Entity Header */}
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-16 h-16">
                          <AvatarFallback className="text-lg font-semibold bg-primary/10">
                            <AvatarInitials name={
                              (entityDetails.entity as any).name || 
                              `${(entityDetails.entity as any).firstName || ''} ${(entityDetails.entity as any).lastName || ''}`.trim()
                            } />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h1 className="text-2xl font-bold">
                              {(entityDetails.entity as any).name || 
                               `${(entityDetails.entity as any).firstName || ''} ${(entityDetails.entity as any).lastName || ''}`.trim()}
                            </h1>
                            <Badge className="bg-green-600">
                              {getEntityTypeLabel(entityDetails.type)}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {entityDetails.entity.email && (
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4" />
                                <span>{entityDetails.entity.email}</span>
                              </div>
                            )}
                            {((entityDetails.entity as any).phone || (entityDetails.entity as any).mobile) && (
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4" />
                                <span>{(entityDetails.entity as any).phone || (entityDetails.entity as any).mobile}</span>
                              </div>
                            )}
                            {entityDetails.entity.address && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4" />
                                <span>{entityDetails.entity.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Esporta
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{entityDetails.stats.totalMovements}</div>
                        <div className="text-sm text-muted-foreground">Movimenti</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(entityDetails.stats.totalAmount)}</div>
                        <div className="text-sm text-muted-foreground">Valore Totale</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(entityDetails.stats.averageAmount)}</div>
                        <div className="text-sm text-muted-foreground">Media</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">
                          {format(new Date(entityDetails.stats.lastActivity), 'dd/MM/yyyy', { locale: it })}
                        </div>
                        <div className="text-sm text-muted-foreground">Ultima Attività</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Tabs */}
                <Tabs defaultValue="movements" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="movements" className="flex items-center space-x-2">
                      <Activity className="w-4 h-4" />
                      <span>Movimenti</span>
                    </TabsTrigger>
                    <TabsTrigger value="communications" className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>Comunicazioni</span>
                    </TabsTrigger>
                    <TabsTrigger value="details" className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Dettagli</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Movements Tab */}
                  <TabsContent value="movements">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Activity className="w-5 h-5" />
                          <span>Storico Movimenti</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {entityDetails.movements.map((movement) => (
                            <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex items-center space-x-4">
                                <div className={`p-2 rounded-lg ${
                                  movement.type === 'income' 
                                    ? 'bg-green-100 text-green-600' 
                                    : 'bg-red-100 text-red-600'
                                }`}>
                                  {movement.type === 'income' ? (
                                    <ArrowUpRight className="w-4 h-4" />
                                  ) : (
                                    <ArrowDownLeft className="w-4 h-4" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold">{movement.reason?.name || 'Movimento'}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {format(new Date(movement.flowDate), 'dd/MM/yyyy', { locale: it })}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-semibold ${
                                  movement.type === 'income' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {movement.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(movement.amount))}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {movement.status?.name}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Communications Tab */}
                  <TabsContent value="communications">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* WhatsApp */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2 text-green-600">
                            <MessageSquare className="w-5 h-5" />
                            <span>WhatsApp</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {entityDetails.communications.whatsapp.map((msg: any) => (
                              <div key={msg.id} className={`p-3 rounded-lg ${
                                msg.direction === 'outbound' 
                                  ? 'bg-green-100 text-green-800 ml-4' 
                                  : 'bg-gray-100 text-gray-800 mr-4'
                              }`}>
                                <div className="text-sm">{msg.message}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(msg.date), 'dd/MM HH:mm', { locale: it })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Email */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2 text-blue-600">
                            <Mail className="w-5 h-5" />
                            <span>Email</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {entityDetails.communications.email.map((email: any) => (
                              <div key={email.id} className="p-3 border rounded-lg">
                                <div className="font-medium text-sm">{email.subject}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(email.date), 'dd/MM/yyyy HH:mm', { locale: it })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* SMS */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2 text-purple-600">
                            <Send className="w-5 h-5" />
                            <span>SMS</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8">
                            <Send className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Nessun SMS inviato</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Details Tab */}
                  <TabsContent value="details">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <FileText className="w-5 h-5" />
                          <span>Informazioni Anagrafiche</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Nome/Ragione Sociale</label>
                              <p className="text-lg font-semibold">
                                {(entityDetails.entity as any).name || 
                                 `${(entityDetails.entity as any).firstName || ''} ${(entityDetails.entity as any).lastName || ''}`.trim()}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Email</label>
                              <p>{entityDetails.entity.email || 'Non specificata'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Telefono</label>
                              <p>{(entityDetails.entity as any).phone || (entityDetails.entity as any).mobile || 'Non specificato'}</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Indirizzo</label>
                              <p>{entityDetails.entity.address || 'Non specificato'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">P.IVA</label>
                              <p>{(entityDetails.entity as any).vatNumber || (entityDetails.entity as any).taxCode || 'Non specificata'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Data Creazione</label>
                              <p>{format(new Date(entityDetails.entity.createdAt), 'dd/MM/yyyy', { locale: it })}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            ) : null}
          </div>
        )}

        {/* Empty State */}
        {!selectedEntity && searchQuery === '' && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 p-4 rounded-full bg-primary/10">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Inizia a cercare</h3>
              <p className="text-muted-foreground mb-6">
                Utilizza la barra di ricerca per trovare fornitori, clienti o risorse.<br />
                Vedrai una panoramica completa con movimenti e comunicazioni.
              </p>
              <div className="flex justify-center space-x-4">
                <Badge variant="outline" className="px-3 py-1">
                  <Building2 className="w-4 h-4 mr-2" />
                  Fornitori
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  <User className="w-4 h-4 mr-2" />
                  Clienti
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  <Users className="w-4 h-4 mr-2" />
                  Risorse
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entity Details Modal */}
        <Dialog open={showEntityModal} onOpenChange={setShowEntityModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  {selectedEntity && getEntityIcon(selectedEntity.type)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedEntity?.name}</h2>
                  <Badge className="mt-1">
                    {selectedEntity && getEntityTypeLabel(selectedEntity.type)}
                  </Badge>
                </div>
              </DialogTitle>
              <DialogDescription>
                Story telling completo dell'entità con anagrafica, movimenti e comunicazioni
              </DialogDescription>
            </DialogHeader>

            {/* Modal Content - Use the same entity details logic */}
            {selectedEntity && (
              <div className="mt-6">
                {entityLoading || !entityDetails ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Caricamento dettagli entità...</p>
                  </div>
                ) : entityDetails ? (
                  <>
                    {/* Entity Overview in Modal */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{entityDetails.stats.totalMovements}</div>
                        <div className="text-sm text-muted-foreground">Movimenti</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(entityDetails.stats.totalAmount)}</div>
                        <div className="text-sm text-muted-foreground">Valore Totale</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(entityDetails.stats.averageAmount)}</div>
                        <div className="text-sm text-muted-foreground">Media</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">
                          {format(new Date(entityDetails.stats.lastActivity), 'dd/MM/yyyy', { locale: it })}
                        </div>
                        <div className="text-sm text-muted-foreground">Ultima Attività</div>
                      </div>
                    </div>

                    {/* Detailed Tabs in Modal */}
                    <Tabs defaultValue="info" className="space-y-4">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="info">
                          <User className="w-4 h-4 mr-2" />
                          Anagrafica
                        </TabsTrigger>
                        <TabsTrigger value="movements">
                          <Activity className="w-4 h-4 mr-2" />
                          Movimenti
                        </TabsTrigger>
                        <TabsTrigger value="communications">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Comunicazioni
                        </TabsTrigger>
                        <TabsTrigger value="stats">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Analytics
                        </TabsTrigger>
                      </TabsList>

                      {/* Anagrafica Tab */}
                      <TabsContent value="info">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                              <User className="w-5 h-5" />
                              <span>Informazioni Anagrafiche</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Nome/Ragione Sociale</label>
                                  <p className="text-lg font-semibold">
                                    {(entityDetails.entity as any).name || 
                                     `${(entityDetails.entity as any).firstName || ''} ${(entityDetails.entity as any).lastName || ''}`.trim()}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                                  <p>{entityDetails.entity.email || 'Non specificata'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Telefono</label>
                                  <p>{(entityDetails.entity as any).phone || (entityDetails.entity as any).mobile || 'Non specificato'}</p>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Indirizzo</label>
                                  <p>{entityDetails.entity.address || 'Non specificato'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">P.IVA</label>
                                  <p>{(entityDetails.entity as any).vatNumber || (entityDetails.entity as any).taxCode || 'Non specificata'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Data Creazione</label>
                                  <p>{format(new Date(entityDetails.entity.createdAt), 'dd/MM/yyyy', { locale: it })}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      {/* Movements Tab (stesso contenuto del componente esistente) */}
                      <TabsContent value="movements">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                              <Activity className="w-5 h-5" />
                              <span>Storico Movimenti ({entityDetails.movements.length})</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                              {entityDetails.movements.map((movement) => (
                                <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center space-x-4">
                                    <div className={`p-2 rounded-lg ${
                                      movement.type === 'income' 
                                        ? 'bg-green-100 text-green-600' 
                                        : 'bg-red-100 text-red-600'
                                    }`}>
                                      {movement.type === 'income' ? (
                                        <ArrowUpRight className="w-4 h-4" />
                                      ) : (
                                        <ArrowDownLeft className="w-4 h-4" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-semibold">{movement.reason?.name || 'Movimento'}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {format(new Date(movement.flowDate), 'dd/MM/yyyy', { locale: it })}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className={`font-semibold ${
                                      movement.type === 'income' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {movement.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(movement.amount))}
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {movement.status?.name}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      {/* Communications Tab */}
                      <TabsContent value="communications">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {/* WhatsApp */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center space-x-2 text-green-600">
                                <MessageSquare className="w-5 h-5" />
                                <span>WhatsApp</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3 max-h-48 overflow-y-auto">
                                {entityDetails.communications.whatsapp.length > 0 ? (
                                  entityDetails.communications.whatsapp.map((msg: any) => (
                                    <div key={msg.id} className={`p-3 rounded-lg ${
                                      msg.direction === 'outbound' 
                                        ? 'bg-green-100 text-green-800 ml-4' 
                                        : 'bg-gray-100 text-gray-800 mr-4'
                                    }`}>
                                      <div className="text-sm">{msg.message}</div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {format(new Date(msg.date), 'dd/MM HH:mm', { locale: it })}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground text-center py-4">Nessun messaggio WhatsApp</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Email */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center space-x-2 text-blue-600">
                                <Mail className="w-5 h-5" />
                                <span>Email</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3 max-h-48 overflow-y-auto">
                                {entityDetails.communications.email.length > 0 ? (
                                  entityDetails.communications.email.map((email: any) => (
                                    <div key={email.id} className="p-3 border rounded-lg">
                                      <div className="font-medium text-sm">{email.subject}</div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {format(new Date(email.date), 'dd/MM/yyyy HH:mm', { locale: it })}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground text-center py-4">Nessuna email</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>

                          {/* SMS */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center space-x-2 text-purple-600">
                                <Send className="w-5 h-5" />
                                <span>SMS</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-center py-8">
                                <Send className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Nessun SMS inviato</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      {/* Analytics Tab */}
                      <TabsContent value="stats">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                              <TrendingUp className="w-5 h-5" />
                              <span>Analytics & Insights</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="text-center p-4 bg-green-50 rounded-lg">
                                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-green-600">{entityDetails.stats.totalMovements}</div>
                                <div className="text-sm text-muted-foreground">Movimenti Totali</div>
                              </div>
                              <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <Euro className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                <div className="text-xl font-bold text-blue-600">{formatCurrency(entityDetails.stats.averageAmount)}</div>
                                <div className="text-sm text-muted-foreground">Valore Medio</div>
                              </div>
                              <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                                <div className="text-lg font-bold text-purple-600">
                                  {format(new Date(entityDetails.stats.lastActivity), 'dd/MM/yyyy', { locale: it })}
                                </div>
                                <div className="text-sm text-muted-foreground">Ultima Attività</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </>
                ) : null}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}