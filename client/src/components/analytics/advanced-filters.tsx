import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar, Filter, Download, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface AnalyticsFilters {
  // Date filters
  createdDateFrom?: string;
  createdDateTo?: string;
  flowDateFrom?: string;
  flowDateTo?: string;
  
  // Entity filters
  companyId?: string;
  officeId?: string;
  resourceId?: string;
  coreId?: string;
  ibanId?: string;
  statusId?: string;
  reasonId?: string;
  supplierId?: string;
  tagIds?: string[];
  
  // Type and amount filters
  type?: 'income' | 'expense';
  amountFrom?: number;
  amountTo?: number;
  
  // VAT filters
  vatType?: string;
  hasVat?: boolean;
}

interface AdvancedFiltersProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  isLoading?: boolean;
}

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
  isLoading = false
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Load entity data for selects
  const { data: companies } = useQuery({
    queryKey: ["/api/companies"],
  });

  const { data: offices } = useQuery({
    queryKey: ["/api/offices"],
  });

  const { data: resources } = useQuery({
    queryKey: ["/api/resources"],
  });

  const { data: cores } = useQuery({
    queryKey: ["/api/cores"],
  });

  const { data: ibans } = useQuery({
    queryKey: ["/api/ibans"],
  });

  const { data: statuses } = useQuery({
    queryKey: ["/api/movement-statuses"],
  });

  const { data: reasons } = useQuery({
    queryKey: ["/api/movement-reasons"],
  });

  const { data: suppliers } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const { data: tags } = useQuery({
    queryKey: ["/api/tags"],
  });

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

  const DatePicker = ({ 
    value, 
    onChange, 
    placeholder 
  }: { 
    value?: string; 
    onChange: (date: string) => void; 
    placeholder: string;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <Calendar className="mr-2 h-4 w-4" />
          {value ? format(new Date(value), 'dd/MM/yyyy', { locale: it }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <CalendarComponent
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => date && onChange(format(date, 'yyyy-MM-dd'))}
          locale={it}
        />
      </PopoverContent>
    </Popover>
  );

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Filtri Avanzati</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} filtri attivi
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              disabled={activeFiltersCount === 0}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              onClick={onApplyFilters}
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Filter className="h-4 w-4 mr-1" />
              )}
              Applica Filtri
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filtri Date Principali - Sempre visibili */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="createdDateFrom">Data Inserimento Dal</Label>
            <DatePicker
              value={filters.createdDateFrom}
              onChange={(date) => updateFilter('createdDateFrom', date)}
              placeholder="Seleziona data"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="createdDateTo">Data Inserimento Al</Label>
            <DatePicker
              value={filters.createdDateTo}
              onChange={(date) => updateFilter('createdDateTo', date)}
              placeholder="Seleziona data"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="flowDateFrom">Data Flusso Dal</Label>
            <DatePicker
              value={filters.flowDateFrom}
              onChange={(date) => updateFilter('flowDateFrom', date)}
              placeholder="Seleziona data"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="flowDateTo">Data Flusso Al</Label>
            <DatePicker
              value={filters.flowDateTo}
              onChange={(date) => updateFilter('flowDateTo', date)}
              placeholder="Seleziona data"
            />
          </div>
        </div>

        {/* Filtri Entità Principali */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Ragione Sociale</Label>
            <Select value={filters.companyId || ''} onValueChange={(value) => updateFilter('companyId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tutte le ragioni sociali" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le ragioni sociali</SelectItem>
                {(companies || []).map((company: any) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sede Operativa</Label>
            <Select value={filters.officeId || ''} onValueChange={(value) => updateFilter('officeId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tutte le sedi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le sedi</SelectItem>
                {(offices || []).map((office: any) => (
                  <SelectItem key={office.id} value={office.id}>
                    {office.name} - {office.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Risorsa</Label>
            <Select value={filters.resourceId || ''} onValueChange={(value) => updateFilter('resourceId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tutte le risorse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le risorse</SelectItem>
                {(resources || []).map((resource: any) => (
                  <SelectItem key={resource.id} value={resource.id}>
                    {resource.firstName} {resource.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Filtri Aggiuntivi - Collassabili */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <span className="font-medium">Filtri Aggiuntivi</span>
              <span className="text-sm text-gray-500">
                {isExpanded ? 'Nascondi' : 'Mostra'}
              </span>
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Filtri Business */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Core</Label>
                <Select value={filters.coreId || ''} onValueChange={(value) => updateFilter('coreId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti i core" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i core</SelectItem>
                    {(cores || []).map((core: any) => (
                      <SelectItem key={core.id} value={core.id}>
                        {core.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>IBAN</Label>
                <Select value={filters.ibanId || ''} onValueChange={(value) => updateFilter('ibanId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti gli IBAN" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli IBAN</SelectItem>
                    {(ibans || []).map((iban: any) => (
                      <SelectItem key={iban.id} value={iban.id}>
                        {iban.bankName} - {iban.iban.slice(-4)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Stato</Label>
                <Select value={filters.statusId || ''} onValueChange={(value) => updateFilter('statusId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti gli stati" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    {(statuses || []).map((status: any) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Causale</Label>
                <Select value={filters.reasonId || ''} onValueChange={(value) => updateFilter('reasonId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutte le causali" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le causali</SelectItem>
                    {(reasons || []).map((reason: any) => (
                      <SelectItem key={reason.id} value={reason.id}>
                        {reason.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtri Tipo e Importo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Tipo Movimento</Label>
                <Select value={filters.type || ''} onValueChange={(value) => updateFilter('type', value)}>
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
                />
              </div>

              <div className="space-y-2">
                <Label>Importo A (€)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={filters.amountTo || ''}
                  onChange={(e) => updateFilter('amountTo', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>

              <div className="space-y-2">
                <Label>Fornitore</Label>
                <Select value={filters.supplierId || ''} onValueChange={(value) => updateFilter('supplierId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti i fornitori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i fornitori</SelectItem>
                    {(suppliers || []).map((supplier: any) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtri IVA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo IVA</Label>
                <Select value={filters.vatType || ''} onValueChange={(value) => updateFilter('vatType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti i tipi IVA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i tipi IVA</SelectItem>
                    <SelectItem value="iva_22">IVA 22%</SelectItem>
                    <SelectItem value="iva_10">IVA 10%</SelectItem>
                    <SelectItem value="iva_4">IVA 4%</SelectItem>
                    <SelectItem value="iva_art_74">IVA Art 74</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Presenza IVA</Label>
                <Select 
                  value={filters.hasVat === undefined ? '' : filters.hasVat.toString()} 
                  onValueChange={(value) => updateFilter('hasVat', value === '' || value === 'all' ? undefined : value === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti i movimenti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i movimenti</SelectItem>
                    <SelectItem value="true">Solo con IVA</SelectItem>
                    <SelectItem value="false">Solo senza IVA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}