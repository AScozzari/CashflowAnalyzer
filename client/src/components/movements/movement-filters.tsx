import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Calendar } from "@/components/ui/calendar";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, X } from "lucide-react";

interface MovementFiltersProps {
  onFiltersChange: (filters: any) => void;
}

export default function MovementFilters({ onFiltersChange }: MovementFiltersProps) {
  const [filters, setFilters] = useState({
    companyId: "",
    coreId: "",
    type: "",
    statusId: "",
    customerId: "",
    supplierId: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });

  const { data: companies } = useQuery({
    queryKey: ["/api/companies"],
  });

  const { data: cores } = useQuery({
    queryKey: ["/api/cores"],
  });

  const { data: statuses } = useQuery({
    queryKey: ["/api/movement-statuses"],
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: suppliers } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      companyId: "",
      coreId: "",
      type: "",
      statusId: "",
      customerId: "",
      supplierId: "",
      startDate: undefined,
      endDate: undefined,
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value && value !== "");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtri
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Cancella Filtri
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
            <Label>Core Business</Label>
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
            <Label>Tipo Movimento</Label>
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

          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={filters.customerId} onValueChange={(value) => handleFilterChange("customerId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tutti i clienti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tutti i clienti</SelectItem>
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

          <div className="space-y-2">
            <Label>Fornitore</Label>
            <Select value={filters.supplierId} onValueChange={(value) => handleFilterChange("supplierId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tutti i fornitori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tutti i fornitori</SelectItem>
                {(suppliers as any[])?.map((supplier: any) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <Label>Data Inizio</Label>
            <Input
              type="date"
              value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange("startDate", e.target.value ? new Date(e.target.value) : undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label>Data Fine</Label>
            <Input
              type="date"
              value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange("endDate", e.target.value ? new Date(e.target.value) : undefined)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}