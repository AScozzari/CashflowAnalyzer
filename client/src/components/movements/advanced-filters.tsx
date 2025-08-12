import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface AdvancedFiltersProps {
  onFiltersChange: (filters: any) => void;
  initialFilters?: any;
}

export default function AdvancedFilters({ onFiltersChange, initialFilters = {} }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    companyId: "",
    coreId: "",
    resourceId: "",
    officeId: "",
    statusId: "",
    reasonId: "",
    tagId: "",
    ibanId: "",
    type: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    minAmount: "",
    maxAmount: "",
    documentNumber: "",
    notes: "",
    ...initialFilters,
  });

  // Fetch data for dropdowns
  const { data: companies } = useQuery({ queryKey: ["/api/companies"] });
  const { data: cores } = useQuery({ queryKey: ["/api/cores"] });
  const { data: resources } = useQuery({ queryKey: ["/api/resources"] });
  const { data: offices } = useQuery({ queryKey: ["/api/offices"] });
  const { data: statuses } = useQuery({ queryKey: ["/api/movement-statuses"] });
  const { data: reasons } = useQuery({ queryKey: ["/api/movement-reasons"] });
  const { data: tags } = useQuery({ queryKey: ["/api/tags"] });
  const { data: ibans } = useQuery({ queryKey: ["/api/ibans"] });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    // Remove empty filters
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value && value !== "")
    );
    onFiltersChange(cleanedFilters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = {
      companyId: "",
      coreId: "",
      resourceId: "",
      officeId: "",
      statusId: "",
      reasonId: "",
      tagId: "",
      ibanId: "",
      type: "",
      startDate: undefined,
      endDate: undefined,
      minAmount: "",
      maxAmount: "",
      documentNumber: "",
      notes: "",
    };
    setFilters(emptyFilters);
    onFiltersChange({});
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value && value !== "").length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filtri Avanzati
          {getActiveFiltersCount() > 0 && (
            <Badge className="ml-2 h-5 w-5 p-0 text-xs" variant="secondary">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filtri Avanzati</DialogTitle>
          <DialogDescription>
            Configura filtri dettagliati per la ricerca dei movimenti finanziari
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Date Range */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Periodo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Inizio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.startDate ? format(filters.startDate, "PPP", { locale: it }) : "Seleziona data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.startDate}
                        onSelect={(date) => handleFilterChange("startDate", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>Data Fine</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.endDate ? format(filters.endDate, "PPP", { locale: it }) : "Seleziona data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.endDate}
                        onSelect={(date) => handleFilterChange("endDate", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Entities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entità Aziendali</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ragione Sociale</Label>
                  <Select value={filters.companyId} onValueChange={(value) => handleFilterChange("companyId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutte le aziende" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tutte le aziende</SelectItem>
                      {(companies as any[])?.map((company: any) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Business Core</Label>
                  <Select value={filters.coreId} onValueChange={(value) => handleFilterChange("coreId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti i core" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tutti i core</SelectItem>
                      {(cores as any[])?.map((core: any) => (
                        <SelectItem key={core.id} value={core.id}>
                          {core.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Risorsa</Label>
                  <Select value={filters.resourceId} onValueChange={(value) => handleFilterChange("resourceId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutte le risorse" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tutte le risorse</SelectItem>
                      {(resources as any[])?.map((resource: any) => (
                        <SelectItem key={resource.id} value={resource.id}>
                          {resource.firstName} {resource.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sede Operativa</Label>
                  <Select value={filters.officeId} onValueChange={(value) => handleFilterChange("officeId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutte le sedi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tutte le sedi</SelectItem>
                      {(offices as any[])?.map((office: any) => (
                        <SelectItem key={office.id} value={office.id}>
                          {office.description} - {office.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movement Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dettagli Movimento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stato</Label>
                  <Select value={filters.statusId} onValueChange={(value) => handleFilterChange("statusId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti gli stati" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tutti gli stati</SelectItem>
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
                  <Select value={filters.reasonId} onValueChange={(value) => handleFilterChange("reasonId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutte le causali" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tutte le causali</SelectItem>
                      {(reasons as any[])?.map((reason: any) => (
                        <SelectItem key={reason.id} value={reason.id}>
                          {reason.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tag</Label>
                  <Select value={filters.tagId} onValueChange={(value) => handleFilterChange("tagId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti i tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tutti i tag</SelectItem>
                      {(tags as any[])?.map((tag: any) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          {tag.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>IBAN</Label>
                  <Select value={filters.ibanId} onValueChange={(value) => handleFilterChange("ibanId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti gli IBAN" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tutti gli IBAN</SelectItem>
                      {(ibans as any[])?.map((iban: any) => (
                        <SelectItem key={iban.id} value={iban.id}>
                          {iban.bankName} - {iban.iban.slice(-8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti i tipi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tutti i tipi</SelectItem>
                      <SelectItem value="income">Entrata</SelectItem>
                      <SelectItem value="expense">Uscita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amount Range */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Importo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Importo Minimo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={filters.minAmount}
                    onChange={(e) => handleFilterChange("minAmount", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Importo Massimo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="999999.99"
                    value={filters.maxAmount}
                    onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ricerca Testuale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Numero Documento</Label>
                  <Input
                    placeholder="Cerca per numero documento"
                    value={filters.documentNumber}
                    onChange={(e) => handleFilterChange("documentNumber", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Note</Label>
                  <Input
                    placeholder="Cerca nelle note"
                    value={filters.notes}
                    onChange={(e) => handleFilterChange("notes", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Cancella Filtri
          </Button>
          <Button onClick={applyFilters}>
            <Search className="h-4 w-4 mr-2" />
            Applica Filtri
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}