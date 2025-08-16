import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  Filter, 
  Download, 
  RefreshCw, 
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  FileText,
  Tag
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

export interface AnalyticsFilters {
  // Date filters (always visible) - Corretto con backend
  createdDateFrom?: string;
  createdDateTo?: string;
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

interface AdvancedFiltersProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  isLoading?: boolean;
}

export default function AdvancedFiltersNew({
  filters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
  isLoading = false
}: AdvancedFiltersProps) {
  // Section expansion states
  const [sectionsExpanded, setSectionsExpanded] = useState({
    organization: false,
    financial: false,
    external: false,
    advanced: false
  });

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Load entity data
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

  // Check if there are date filters to enable other filters
  const hasDateFilters = Boolean(
    filters.createdDateFrom || filters.createdDateTo || 
    filters.flowDateFrom || filters.flowDateTo
  );

  // Count active filters
  useEffect(() => {
    const count = Object.entries(filters).filter(([key, value]) => {
      if (key === 'tagIds') {
        return Array.isArray(value) && value.length > 0;
      }
      return value !== undefined && value !== '' && value !== null;
    }).length;
    setActiveFiltersCount(count);
  }, [filters]);

  const updateFilter = (key: keyof AnalyticsFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' || value === 'all' ? undefined : value
    });
  };

  const toggleSection = (section: keyof typeof sectionsExpanded) => {
    setSectionsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const DatePicker = ({ 
    value, 
    onChange, 
    placeholder 
  }: { 
    value?: string; 
    onChange: (date: string) => void; 
    placeholder: string 
  }) => {
    const [date, setDate] = useState<Date | undefined>(
      value ? new Date(value) : undefined
    );

    const handleDateSelect = (selectedDate: Date | undefined) => {
      setDate(selectedDate);
      if (selectedDate) {
        onChange(format(selectedDate, 'yyyy-MM-dd'));
      } else {
        onChange('');
      }
    };

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'dd/MM/yyyy', { locale: it }) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    );
  };

  const FilterSection = ({ 
    title, 
    icon: Icon, 
    isExpanded, 
    onToggle, 
    children, 
    activeCount = 0,
    disabled = false,
    disabledMessage = ""
  }: {
    title: string;
    icon: any;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    activeCount?: number;
    disabled?: boolean;
    disabledMessage?: string;
  }) => (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className={`w-full justify-between p-4 h-auto hover:bg-muted/50 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={disabled}
        >
          <div className="flex items-center gap-3">
            <Icon className={`h-5 w-5 ${disabled ? 'text-muted-foreground' : 'text-primary'}`} />
            <span className={`font-medium ${disabled ? 'text-muted-foreground' : ''}`}>
              {title} {disabled && disabledMessage && (
                <span className="text-xs text-muted-foreground ml-1">{disabledMessage}</span>
              )}
            </span>
            {activeCount > 0 && !disabled && (
              <Badge variant="secondary" className="ml-2">
                {activeCount}
              </Badge>
            )}
          </div>
          {!disabled && (isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          ))}
        </Button>
      </CollapsibleTrigger>
      {!disabled && (
        <CollapsibleContent className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {children}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );

  // Count active filters per section
  const organizationFilters = [filters.companyId, filters.coreId, filters.officeId].filter(Boolean).length;
  const financialFilters = [filters.type, filters.amountFrom, filters.amountTo, filters.ibanId].filter(Boolean).length;
  const externalFilters = [filters.supplierId, filters.resourceId, filters.customerId].filter(Boolean).length;
  const advancedFilters = [filters.statusId, filters.reasonId, filters.vatType, filters.hasVat, filters.hasDocument, ...(filters.tagIds || [])].filter(Boolean).length;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtri Analytics
            </CardTitle>
            {activeFiltersCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {activeFiltersCount} filtri attivi
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={onApplyFilters} 
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Filter className="h-4 w-4 mr-2" />
              )}
              Applica Filtri
            </Button>
            <Button 
              variant="outline" 
              onClick={onResetFilters}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Always visible: Date filters */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Intervalli Date
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Data Inserimento Da</Label>
              <DatePicker
                value={filters.createdDateFrom}
                onChange={(date) => updateFilter('createdDateFrom', date)}
                placeholder="Seleziona data"
              />
            </div>
            <div className="space-y-2">
              <Label>Data Inserimento A</Label>
              <DatePicker
                value={filters.createdDateTo}
                onChange={(date) => updateFilter('createdDateTo', date)}
                placeholder="Seleziona data"
              />
            </div>
            <div className="space-y-2">
              <Label>Data Flusso Da</Label>
              <DatePicker
                value={filters.flowDateFrom}
                onChange={(date) => updateFilter('flowDateFrom', date)}
                placeholder="Seleziona data"
              />
            </div>
            <div className="space-y-2">
              <Label>Data Flusso A</Label>
              <DatePicker
                value={filters.flowDateTo}
                onChange={(date) => updateFilter('flowDateTo', date)}
                placeholder="Seleziona data"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Collapsible sections */}
        <div className="space-y-2">
          {/* Organization Section */}
          <FilterSection
            title="Organizzazione"
            icon={Building2}
            isExpanded={sectionsExpanded.organization && hasDateFilters}
            onToggle={() => hasDateFilters && toggleSection('organization')}
            activeCount={organizationFilters}
            disabled={!hasDateFilters}
            disabledMessage="(richiede filtri data)"
          >
            <div className="space-y-2">
              <Label>Ragione Sociale</Label>
              <Select 
                value={filters.companyId || 'all'} 
                onValueChange={(value) => updateFilter('companyId', value)}
                disabled={!hasDateFilters}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tutte le aziende" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le aziende</SelectItem>
                  {(companies as any[])?.map((company: any) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Core</Label>
              <Select 
                value={filters.coreId || 'all'} 
                onValueChange={(value) => updateFilter('coreId', value)}
                disabled={!hasDateFilters}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tutti i core" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i core</SelectItem>
                  {(cores as any[])?.map((core: any) => (
                    <SelectItem key={core.id} value={core.id}>
                      {core.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>



            <div className="space-y-2">
              <Label>Sede Operativa</Label>
              <Select 
                value={filters.officeId || 'all'} 
                onValueChange={(value) => updateFilter('officeId', value)}
                disabled={!hasDateFilters}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tutte le sedi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le sedi</SelectItem>
                  {(offices as any[])?.map((office: any) => (
                    <SelectItem key={office.id} value={office.id}>
                      {office.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FilterSection>

          {/* Financial Section */}
          <FilterSection
            title="Dati Finanziari"
            icon={DollarSign}
            isExpanded={sectionsExpanded.financial && hasDateFilters}
            onToggle={() => hasDateFilters && toggleSection('financial')}
            activeCount={financialFilters}
            disabled={!hasDateFilters}
            disabledMessage="(richiede filtri data)"
          >
            <div className="space-y-2">
              <Label>Tipo Movimento</Label>
              <Select 
                value={filters.type || 'all'} 
                onValueChange={(value) => updateFilter('type', value)}
                disabled={!hasDateFilters}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tutti i tipi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i tipi</SelectItem>
                  <SelectItem value="income">Entrate</SelectItem>
                  <SelectItem value="expense">Uscite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Importo Da (€)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={filters.amountFrom || ''}
                onChange={(e) => updateFilter('amountFrom', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={!hasDateFilters}
              />
            </div>

            <div className="space-y-2">
              <Label>Importo A (€)</Label>
              <Input
                type="number"
                placeholder="999999.99"
                value={filters.amountTo || ''}
                onChange={(e) => updateFilter('amountTo', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={!hasDateFilters}
              />
            </div>

            <div className="space-y-2">
              <Label>IBAN</Label>
              <Select 
                value={filters.ibanId || 'all'} 
                onValueChange={(value) => updateFilter('ibanId', value)}
                disabled={!hasDateFilters}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tutti gli IBAN" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli IBAN</SelectItem>
                  {(ibans as any[])?.map((iban: any) => (
                    <SelectItem key={iban.id} value={iban.id}>
                      {iban.bankName} - {iban.iban.slice(-4)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FilterSection>

          {/* External Relations Section */}
          <FilterSection
            title="Relazioni Esterne"
            icon={Users}
            isExpanded={sectionsExpanded.external && hasDateFilters}
            onToggle={() => hasDateFilters && toggleSection('external')}
            activeCount={externalFilters}
            disabled={!hasDateFilters}
            disabledMessage="(richiede filtri data)"
          >
            <div className="space-y-2">
              <Label>Fornitore</Label>
              <Select 
                value={filters.supplierId || 'all'} 
                onValueChange={(value) => updateFilter('supplierId', value)}
                disabled={!hasDateFilters}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tutti i fornitori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i fornitori</SelectItem>
                  {(suppliers as any[])?.map((supplier: any) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Risorsa</Label>
              <Select 
                value={filters.resourceId || 'all'} 
                onValueChange={(value) => updateFilter('resourceId', value)}
                disabled={!hasDateFilters}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tutte le risorse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le risorse</SelectItem>
                  {(resources as any[])?.map((resource: any) => (
                    <SelectItem key={resource.id} value={resource.id}>
                      {resource.firstName} {resource.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select 
                value={filters.customerId || 'all'} 
                onValueChange={(value) => updateFilter('customerId', value)}
                disabled={!hasDateFilters}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tutti i clienti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i clienti</SelectItem>
                  {(customers as any[])?.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.type === 'private' 
                        ? `${customer.firstName} ${customer.lastName}`.trim()
                        : customer.name
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FilterSection>

          {/* Advanced Section */}
          <FilterSection
            title="Filtri Avanzati"
            icon={FileText}
            isExpanded={sectionsExpanded.advanced && hasDateFilters}
            onToggle={() => hasDateFilters && toggleSection('advanced')}
            activeCount={advancedFilters}
            disabled={!hasDateFilters}
            disabledMessage="(richiede filtri data)"
          >
            <div className="space-y-2">
              <Label>Stato</Label>
              <Select 
                value={filters.statusId || 'all'} 
                onValueChange={(value) => updateFilter('statusId', value)}
                disabled={!hasDateFilters}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tutti gli stati" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  {(statuses as any[])?.map((status: any) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Causale</Label>
              <Select 
                value={filters.reasonId || 'all'} 
                onValueChange={(value) => updateFilter('reasonId', value)}
                disabled={!hasDateFilters}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tutte le causali" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le causali</SelectItem>
                  {(reasons as any[])?.map((reason: any) => (
                    <SelectItem key={reason.id} value={reason.id}>
                      {reason.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo IVA</Label>
              <Select 
                value={filters.vatType || 'all'} 
                onValueChange={(value) => updateFilter('vatType', value)}
                disabled={!hasDateFilters}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tutti i tipi IVA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i tipi IVA</SelectItem>
                  <SelectItem value="iva_22">IVA 22%</SelectItem>
                  <SelectItem value="iva_10">IVA 10%</SelectItem>
                  <SelectItem value="iva_4">IVA 4%</SelectItem>
                  <SelectItem value="esente">Esente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Opzioni Documenti</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasVat"
                    checked={filters.hasVat || false}
                    onCheckedChange={(checked) => updateFilter('hasVat', checked)}
                    disabled={!hasDateFilters}
                  />
                  <Label htmlFor="hasVat" className="text-sm">Solo con IVA</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasDocument"
                    checked={filters.hasDocument || false}
                    onCheckedChange={(checked) => updateFilter('hasDocument', checked)}
                    disabled={!hasDateFilters}
                  />
                  <Label htmlFor="hasDocument" className="text-sm">Solo con documenti</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tag</Label>
              <Select 
                value={filters.tagIds?.join(',') || 'all'} 
                onValueChange={(value) => updateFilter('tagIds', value === 'all' ? [] : value.split(','))}
                disabled={!hasDateFilters}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tutti i tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i tag</SelectItem>
                  {(tags as any[])?.map((tag: any) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FilterSection>
        </div>
      </CardContent>
    </Card>
  );
}