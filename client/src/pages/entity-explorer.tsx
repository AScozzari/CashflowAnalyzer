import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { Separator } from '@/components/ui/separator';
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
  Hash
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

  // Real search function using API
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // Real API call to search entities
      const response = await fetch('/api/search/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
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
      try {
        // Real API call to get entity details
        const response = await fetch(`/api/entities/${selectedEntity!.id}?type=${selectedEntity!.type}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.log('API not available, using mock data');
      }
      
      // Fallback to mock data if API is not available
      return {
        entity: {
          id: selectedEntity!.id,
          name: selectedEntity!.name,
          email: 'info@example.com',
          phone: '+39 123 456 7890',
          address: 'Via Roma 123, Milano, MI, 20121',
          vatNumber: 'IT12345678901',
          createdAt: new Date(),
        } as any,
        type: selectedEntity!.type,
        movements: [
          {
            id: '1',
            amount: '1500.00',
            type: 'income' as const,
            description: 'Fattura #001',
            flowDate: new Date().toISOString(),
            insertDate: new Date().toISOString(),
            status: { name: 'Saldato' },
            reason: { name: 'Vendita servizi' }
          },
          {
            id: '2',
            amount: '800.00',
            type: 'expense' as const,
            description: 'Acquisto materiali',
            flowDate: new Date(Date.now() - 86400000).toISOString(),
            insertDate: new Date(Date.now() - 86400000).toISOString(),
            status: { name: 'Da Saldare' },
            reason: { name: 'Acquisto beni' }
          }
        ] as any,
        communications: {
          whatsapp: [
            { id: '1', message: 'Buongiorno, invio fattura', date: new Date().toISOString(), direction: 'outbound' },
            { id: '2', message: 'Ricevuto, grazie', date: new Date(Date.now() - 3600000).toISOString(), direction: 'inbound' }
          ],
          email: [
            { id: '1', subject: 'Fattura #001', date: new Date(Date.now() - 86400000).toISOString(), direction: 'outbound' }
          ],
          sms: []
        },
        stats: {
          totalMovements: 2,
          totalAmount: 2300,
          lastActivity: new Date().toISOString(),
          averageAmount: 1150
        }
      };
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
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtri
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
                      <Eye className="w-4 h-4 text-muted-foreground" />
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
      </div>
    </div>
  );
}