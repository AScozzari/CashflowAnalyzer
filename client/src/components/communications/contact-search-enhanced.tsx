import { useState, useEffect, useMemo } from "react";
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
  const { data: resources = [] } = useQuery<Resource[]>({ 
    queryKey: ["/api/resources"],
    refetchOnWindowFocus: false
  });
  
  const { data: customers = [] } = useQuery<Customer[]>({ 
    queryKey: ["/api/customers"],
    refetchOnWindowFocus: false
  });
  
  const { data: suppliers = [] } = useQuery<Supplier[]>({ 
    queryKey: ["/api/suppliers"],
    refetchOnWindowFocus: false
  });

  // Transform data into unified contact format
  const allContacts: Contact[] = useMemo(() => {
    const contacts: Contact[] = [];

    // Add resources
    if (!filterByType || filterByType.includes('resource')) {
      resources.forEach(resource => {
        contacts.push({
          id: `resource-${resource.id}`,
          name: `${resource.firstName} ${resource.lastName}`,
          type: 'resource',
          phone: resource.mobile || resource.phone || undefined,
          email: resource.email || undefined,
          status: resource.isActive ? 'active' : 'inactive',
          lastContact: resource.createdAt
        });
      });
    }

    // Add customers
    if (!filterByType || filterByType.includes('customer')) {
      customers.forEach(customer => {
        const name = customer.type === 'private' 
          ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
          : customer.name || '';
        
        if (name) {
          contacts.push({
            id: `customer-${customer.id}`,
            name: name,
            type: 'customer',
            phone: customer.mobile || customer.phone || undefined,
            email: customer.email || undefined,
            status: customer.isActive ? 'active' : 'inactive',
            tags: customer.type ? [customer.type] : undefined,
            lastContact: customer.createdAt
          });
        }
      });
    }

    // Add suppliers
    if (!filterByType || filterByType.includes('supplier')) {
      suppliers.forEach(supplier => {
        contacts.push({
          id: `supplier-${supplier.id}`,
          name: supplier.name,
          type: 'supplier',
          phone: supplier.mobile || supplier.phone || undefined,
          email: supplier.email || undefined,
          status: supplier.isActive ? 'active' : 'inactive',
          lastContact: supplier.createdAt
        });
      });
    }

    return contacts;
  }, [resources, customers, suppliers, filterByType]);

  // Filter contacts based on search and filters
  const filteredContacts = useMemo(() => {
    return allContacts.filter(contact => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        contact.name.toLowerCase().includes(searchLower) ||
        (contact.phone && contact.phone.includes(searchQuery)) ||
        (contact.email && contact.email.toLowerCase().includes(searchLower)) ||
        (contact.company && contact.company.toLowerCase().includes(searchLower));

      // Type filter
      const matchesType = typeFilter === 'all' || contact.type === typeFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
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
    if (!multiSelect) {
      onContactSelect(contact);
      setIsExpanded(false);
    } else {
      onContactSelect(contact);
    }
  };

  const removeSelectedContact = (contactId: string) => {
    // This would need to be handled by parent component
    console.log('Remove contact:', contactId);
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          className="pl-10"
          data-testid="contact-search-input"
        />
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
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
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
            <SelectTrigger className="w-32">
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
            onClick={() => {
              setSearchQuery("");
              setTypeFilter("all");
              setStatusFilter("all");
            }}
          >
            Reset
          </Button>
        </div>
      )}

      {/* Results */}
      {isExpanded && (
        <Card className="max-h-80">
          <ScrollArea className="h-full">
            <CardContent className="p-2">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2" />
                  <p>Nessun contatto trovato</p>
                  <p className="text-sm">Prova a modificare i filtri di ricerca</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredContacts.map(contact => (
                    <div
                      key={contact.id}
                      onClick={() => handleContactClick(contact)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                      data-testid={`contact-option-${contact.id}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback className={`text-white text-xs ${getContactColor(contact.type)}`}>
                          {getContactIcon(contact.type)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">{contact.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {contact.type === 'resource' ? 'Risorsa' : 
                             contact.type === 'customer' ? 'Cliente' : 'Fornitore'}
                          </Badge>
                          {contact.status === 'inactive' && (
                            <Badge variant="secondary" className="text-xs">Inattivo</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {contact.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </div>
                          )}
                          {contact.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </div>
                          )}
                          {contact.company && (
                            <div className="flex items-center gap-1 truncate">
                              <Building2 className="h-3 w-3" />
                              {contact.company}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
        <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
          <span>{filteredContacts.length} contatti trovati</span>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
            Chiudi
          </Button>
        </div>
      )}
    </div>
  );
}