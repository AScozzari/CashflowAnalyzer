import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  Filter, 
  RefreshCw, 
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  FileText,
  Tag,
  Search
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";

export interface MovementFilters {
  // Date filters (always visible)
  insertDateFrom?: string;
  insertDateTo?: string;
  flowDateFrom?: string;
  flowDateTo?: string;
  
  // Entity filters
  companyId?: string;
  coreId?: string;
  resourceId?: string;
  officeId?: string;
  
  // Movement type and financial
  type?: 'income' | 'expense';
  amountFrom?: number;
  amountTo?: number;
  statusId?: string;
  reasonId?: string;
  
  // External relations
  supplierId?: string;
  customerId?: string;
  ibanId?: string;
  
  // VAT and documents
  vatType?: string;
  hasVat?: boolean;
  hasDocument?: boolean;
  tagIds?: string[];
}

interface MovementFiltersAdvancedProps {
  filters: MovementFilters;
  onFiltersChange: (filters: MovementFilters) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  isLoading?: boolean;
}

export default function MovementFiltersAdvanced({
  filters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
  isLoading = false
}: MovementFiltersAdvancedProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch options for dropdowns
  const { data: companies } = useQuery({ queryKey: ["/api/companies"] });
  const { data: cores } = useQuery({ queryKey: ["/api/cores"] });
  const { data: resources } = useQuery({ queryKey: ["/api/resources"] });
  const { data: offices } = useQuery({ queryKey: ["/api/offices"] });
  const { data: statuses } = useQuery({ queryKey: ["/api/movement-statuses"] });
  const { data: reasons } = useQuery({ queryKey: ["/api/movement-reasons"] });
  const { data: suppliers } = useQuery({ queryKey: ["/api/suppliers"] });
  const { data: customers } = useQuery({ queryKey: ["/api/customers"] });
  const { data: ibans } = useQuery({ queryKey: ["/api/ibans"] });
  const { data: tags } = useQuery({ queryKey: ["/api/tags"] });

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return "";
    return format(new Date(dateString), 'yyyy-MM-dd');
  };

  const handleDateChange = (field: keyof MovementFilters, date: Date | undefined) => {
    if (date) {
      onFiltersChange({
        ...filters,
        [field]: format(date, 'yyyy-MM-dd')
      });
    } else {
      onFiltersChange({
        ...filters,
        [field]: undefined
      });
    }
  };

  const handleFieldChange = (field: keyof MovementFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value === "" || value === "all" ? undefined : value
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'tagIds') {
      return Array.isArray(value) && value.length > 0;
    }
    return value !== undefined && value !== '' && value !== null;
  });

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'tagIds') {
      return Array.isArray(value) && value.length > 0;
    }
    return value !== undefined && value !== '' && value !== null;
  }).length;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Filtri Movimenti</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {activeFiltersCount} attivi
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onApplyFilters}
              disabled={isLoading}
              className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Applica Filtri
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              disabled={!hasActiveFilters || isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Date Filters - Always Visible */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <CalendarIcon className="h-4 w-4 text-gray-600" />
            <Label className="text-sm font-medium text-gray-700">Filtri per Data</Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Data Inserimento Da */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Data Inserimento Da</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.insertDateFrom ? format(new Date(filters.insertDateFrom), 'dd/MM/yyyy', { locale: it }) : "Seleziona..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.insertDateFrom ? new Date(filters.insertDateFrom) : undefined}
                    onSelect={(date) => handleDateChange('insertDateFrom', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Inserimento A */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Data Inserimento A</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.insertDateTo ? format(new Date(filters.insertDateTo), 'dd/MM/yyyy', { locale: it }) : "Seleziona..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.insertDateTo ? new Date(filters.insertDateTo) : undefined}
                    onSelect={(date) => handleDateChange('insertDateTo', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Flusso Da */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Data Flusso Da</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.flowDateFrom ? format(new Date(filters.flowDateFrom), 'dd/MM/yyyy', { locale: it }) : "Seleziona..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.flowDateFrom ? new Date(filters.flowDateFrom) : undefined}
                    onSelect={(date) => handleDateChange('flowDateFrom', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Flusso A */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-600">Data Flusso A</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.flowDateTo ? format(new Date(filters.flowDateTo), 'dd/MM/yyyy', { locale: it }) : "Seleziona..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.flowDateTo ? new Date(filters.flowDateTo) : undefined}
                    onSelect={(date) => handleDateChange('flowDateTo', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <Separator />

        {/* Filtri Avanzati - Collapsible */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filtri Avanzati</span>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-6 pt-4">
            {/* Entità Aziendali */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <Building2 className="h-4 w-4 text-gray-600" />
                <Label className="text-sm font-medium text-gray-700">Entità Aziendali</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Ragione Sociale</Label>
                  <Select value={filters.companyId || "all"} onValueChange={(value) => handleFieldChange('companyId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutte le aziende" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte le aziende</SelectItem>
                      {companies?.map((company: any) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Core</Label>
                  <Select value={filters.coreId || "all"} onValueChange={(value) => handleFieldChange('coreId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti i core" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i core</SelectItem>
                      {cores?.map((core: any) => (
                        <SelectItem key={core.id} value={core.id}>
                          {core.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Sede</Label>
                  <Select value={filters.officeId || "all"} onValueChange={(value) => handleFieldChange('officeId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutte le sedi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte le sedi</SelectItem>
                      {offices?.map((office: any) => (
                        <SelectItem key={office.id} value={office.id}>
                          {office.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>


              </div>
            </div>

            <Separator />

            {/* Filtri Movimento */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="h-4 w-4 text-gray-600" />
                <Label className="text-sm font-medium text-gray-700">Dettagli Movimento</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Tipo</Label>
                  <Select value={filters.type || "all"} onValueChange={(value) => handleFieldChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti i tipi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i tipi</SelectItem>
                      <SelectItem value="income">Entrata</SelectItem>
                      <SelectItem value="expense">Uscita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Stato</Label>
                  <Select value={filters.statusId || "all"} onValueChange={(value) => handleFieldChange('statusId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti gli stati" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti gli stati</SelectItem>
                      {statuses?.map((status: any) => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Causale</Label>
                  <Select value={filters.reasonId || "all"} onValueChange={(value) => handleFieldChange('reasonId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutte le causali" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte le causali</SelectItem>
                      {reasons?.map((reason: any) => (
                        <SelectItem key={reason.id} value={reason.id}>
                          {reason.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">IBAN</Label>
                  <Select value={filters.ibanId || "all"} onValueChange={(value) => handleFieldChange('ibanId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti gli IBAN" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti gli IBAN</SelectItem>
                      {ibans?.map((iban: any) => (
                        <SelectItem key={iban.id} value={iban.id}>
                          {iban.bankName} - ****{iban.iban.slice(-4)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Filtri Importo */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <DollarSign className="h-4 w-4 text-gray-600" />
                <Label className="text-sm font-medium text-gray-700">Range Importo</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Importo Da (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={filters.amountFrom || ""}
                    onChange={(e) => handleFieldChange('amountFrom', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Importo A (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="99999.99"
                    value={filters.amountTo || ""}
                    onChange={(e) => handleFieldChange('amountTo', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Relazioni Esterne */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <Users className="h-4 w-4 text-gray-600" />
                <Label className="text-sm font-medium text-gray-700">Relazioni Esterne</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Cliente</Label>
                  <Select value={filters.customerId || "all"} onValueChange={(value) => handleFieldChange('customerId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti i clienti" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i clienti</SelectItem>
                      {customers?.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Fornitore</Label>
                  <Select value={filters.supplierId || "all"} onValueChange={(value) => handleFieldChange('supplierId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti i fornitori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i fornitori</SelectItem>
                      {suppliers?.map((supplier: any) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Risorsa</Label>
                  <Select value={filters.resourceId || "all"} onValueChange={(value) => handleFieldChange('resourceId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutte le risorse" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte le risorse</SelectItem>
                      {resources?.map((resource: any) => (
                        <SelectItem key={resource.id} value={resource.id}>
                          {resource.firstName} {resource.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}