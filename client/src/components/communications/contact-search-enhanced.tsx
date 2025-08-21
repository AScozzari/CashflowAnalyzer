import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Users, 
  Building2, 
  Truck, 
  Phone, 
  Mail, 
  MessageSquare,
  Plus,
  Filter,
  X
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Resource, Customer, Supplier } from "@shared/schema";

interface Contact {
  id: string;
  name: string;
  type: 'resource' | 'customer' | 'supplier';
  phone?: string;
  email?: string;
  company?: string;
  avatar?: string;
  lastContact?: string;
  status: 'active' | 'inactive';
  tags?: string[];
}

interface ContactSearchProps {
  onContactSelect: (contact: Contact) => void;
  selectedContacts?: Contact[];
  multiSelect?: boolean;
  placeholder?: string;
  filterByType?: ('resource' | 'customer' | 'supplier')[];
}

export function ContactSearchEnhanced({
  onContactSelect,
  selectedContacts = [],
  multiSelect = false,
  placeholder = "Cerca tra risorse, clienti e fornitori...",
  filterByType
}: ContactSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch data from different endpoints
  const { data: resources = [], error: resourcesError } = useQuery<Resource[]>({ 
    queryKey: ["/api/resources"],
    refetchOnWindowFocus: false
  });
  
  const { data: customers = [], error: customersError } = useQuery<Customer[]>({ 
    queryKey: ["/api/customers"],
    refetchOnWindowFocus: false
  });
  
  const { data: suppliers = [], error: suppliersError } = useQuery<Supplier[]>({ 
    queryKey: ["/api/suppliers"],
    refetchOnWindowFocus: false
  });

  // Debug logging
  console.log('📊 Contact Search Debug:', {
    resources: resources.length,
    customers: customers.length, 
    suppliers: suppliers.length,
    resourcesError,
    customersError,
    suppliersError,
    sampleNames: [...resources.slice(0,2).map(r => `${r.firstName} ${r.lastName}`), 
                  ...customers.slice(0,2).map(c => c.name || `${c.firstName} ${c.lastName}`),
                  ...suppliers.slice(0,2).map(s => s.name)]
  });

  // Transform data into unified contact format
  const allContacts: Contact[] = useMemo(() => {
    const contacts: Contact[] = [];

    // Add resources (use mobile or phone number)
    if (!filterByType || filterByType.includes('resource')) {
      resources.forEach(resource => {
        const phoneNumber = resource.mobile || resource.phone; // Try mobile first, then phone
        if (phoneNumber) { // Only include if any phone number exists
          contacts.push({
            id: `resource-${resource.id}`,
            name: `${resource.firstName} ${resource.lastName}`,
            type: 'resource',
            phone: phoneNumber, // Use available phone number
            email: resource.email || undefined,
            status: resource.isActive ? 'active' : 'inactive',
            lastContact: resource.createdAt ? new Date(resource.createdAt).toISOString() : undefined
          });
        }
      });
    }

    // Add customers (use mobile or phone number)
    if (!filterByType || filterByType.includes('customer')) {
      customers.forEach(customer => {
        const name = customer.type === 'private' 
          ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
          : customer.name || '';
        
        const phoneNumber = customer.mobile || customer.phone; // Try mobile first, then phone
        if (name && phoneNumber) { // Only include if name and any phone number exists
          contacts.push({
            id: `customer-${customer.id}`,
            name: name,
            type: 'customer',
            phone: phoneNumber, // Use available phone number
            email: customer.email || undefined,
            status: customer.isActive ? 'active' : 'inactive',
            tags: customer.type ? [customer.type] : undefined,
            lastContact: customer.createdAt ? new Date(customer.createdAt).toISOString() : undefined
          });
        }
      });
    }

    // Add suppliers (use mobile or phone number)
    if (!filterByType || filterByType.includes('supplier')) {
      suppliers.forEach(supplier => {
        const phoneNumber = supplier.mobile || supplier.phone; // Try mobile first, then phone
        if (phoneNumber) { // Only include if any phone number exists
          contacts.push({
            id: `supplier-${supplier.id}`,
            name: supplier.name,
            type: 'supplier',
            phone: phoneNumber, // Use available phone number
            email: supplier.email || undefined,
            status: supplier.isActive ? 'active' : 'inactive',
            lastContact: supplier.createdAt ? new Date(supplier.createdAt).toISOString() : undefined
          });
        }
      });
    }

    return contacts;
  }, [resources, customers, suppliers, filterByType]);

  // Filter contacts based on search and filters with improved logic
  const filteredContacts = useMemo(() => {
    let filtered = [...allContacts];
    
    // Search filter - more robust and immediate
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(contact => {
        const nameMatch = contact.name.toLowerCase().includes(query);
        const phoneMatch = contact.phone?.replace(/\s+/g, '').includes(query.replace(/\s+/g, ''));
        const emailMatch = contact.email?.toLowerCase().includes(query);
        const companyMatch = contact.company?.toLowerCase().includes(query);
        
        return nameMatch || phoneMatch || emailMatch || companyMatch;
      });
    }

    // Type filter
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter(contact => contact.type === typeFilter);
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(contact => contact.status === statusFilter);
    }

    // Sort by relevance: active first, then alphabetically
    return filtered.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return a.name.localeCompare(b.name, 'it');
    });
  }, [allContacts, searchQuery, typeFilter, statusFilter]);

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'resource': return <Users className="h-4 w-4" />;
      case 'customer': return <Building2 className="h-4 w-4" />;
      case 'supplier': return <Truck className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getContactColor = (type: string) => {
    switch (type) {
      case 'resource': return 'bg-blue-500';
      case 'customer': return 'bg-green-500';
      case 'supplier': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const handleContactClick = (contact: Contact) => {
    onContactSelect(contact);
    if (!multiSelect) {
      setIsExpanded(false); // Close the search after selection for single select
    }
  };

  const removeSelectedContact = (contactId: string) => {
    // This would need to be handled by parent component
    console.log('Remove contact:', contactId);
  };

  return (
    <div className="w-full space-y-3 relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            const newValue = e.target.value;
            setSearchQuery(newValue);
            if (!isExpanded && newValue.trim() !== '') {
              setIsExpanded(true);
            }
            console.log('🔍 Ricerca contatti:', newValue, 'Contatti trovati:', filteredContacts.length, 
                       filteredContacts.length > 0 ? filteredContacts.map(c => c.name) : 'Nessun risultato');
          }}
          onFocus={() => setIsExpanded(true)}
          className="pl-10 w-full"
          data-testid="contact-search-input"
          autoComplete="off"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              setSearchQuery("");
              setIsExpanded(false);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Selected Contacts (for multi-select) */}
      {multiSelect && selectedContacts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedContacts.map(contact => (
            <Badge key={contact.id} variant="secondary" className="flex items-center gap-1">
              {getContactIcon(contact.type)}
              {contact.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeSelectedContact(contact.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Filters */}
      {isExpanded && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/20 rounded-lg border">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filtri:</span>
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 h-8">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tipi</SelectItem>
              <SelectItem value="resource">Risorse</SelectItem>
              <SelectItem value="customer">Clienti</SelectItem>
              <SelectItem value="supplier">Fornitori</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="active">Attivi</SelectItem>
              <SelectItem value="inactive">Inattivi</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3"
            onClick={() => {
              setSearchQuery("");
              setTypeFilter("all");
              setStatusFilter("all");
            }}
          >
            <X className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      )}

      {/* Results */}
      {isExpanded && (
        <Card className="max-h-80 relative z-10 mt-1 shadow-lg border">
          <ScrollArea className="h-full max-h-72">
            <CardContent className="p-3">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Nessun contatto trovato</p>
                  <p className="text-xs mt-1">Prova a modificare i filtri di ricerca</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredContacts.map(contact => (
                    <div
                      key={contact.id}
                      onClick={() => handleContactClick(contact)}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200 border border-transparent hover:border-border"
                      data-testid={`contact-option-${contact.id}`}
                    >
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback className={`text-white text-xs ${getContactColor(contact.type)}`}>
                          {getContactIcon(contact.type)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate max-w-[150px]">{contact.name}</span>
                          <Badge variant="outline" className="text-xs px-2 py-0.5 flex-shrink-0">
                            {contact.type === 'resource' ? 'Risorsa' : 
                             contact.type === 'customer' ? 'Cliente' : 'Fornitore'}
                          </Badge>
                          {contact.status === 'inactive' && (
                            <Badge variant="secondary" className="text-xs px-2 py-0.5 flex-shrink-0">
                              Inattivo
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          {contact.phone && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Phone className="h-3 w-3 text-green-600 flex-shrink-0" />
                              <span className="text-green-600 font-medium">{contact.phone}</span>
                            </div>
                          )}
                          {contact.email && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{contact.email}</span>
                            </div>
                          )}
                          {contact.company && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{contact.company}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-70 hover:opacity-100">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      )}

      {/* Quick Actions */}
      {isExpanded && (
        <div className="flex justify-between items-center text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
          <span className="font-medium">
            {filteredContacts.length} contatto{filteredContacts.length !== 1 ? 'i' : ''} trovat{filteredContacts.length !== 1 ? 'i' : 'o'}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs"
            onClick={() => setIsExpanded(false)}
          >
            Chiudi
          </Button>
        </div>
      )}
    </div>
  );
}