import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface VariableContext {
  companyId?: string;
  customerId?: string;
  supplierId?: string;
  movementId?: string;
  userId?: string;
}

export interface TemplateVariable {
  key: string;
  value: string;
  type: 'text' | 'currency' | 'date' | 'email' | 'phone';
  formatted?: string;
}

export interface TemplateResolutionResult {
  resolvedTemplate: string;
  variables: TemplateVariable[];
  errors?: string[];
}

export function useWhatsAppTemplateResolver() {
  return useMutation({
    mutationFn: async (data: { templateBody: string; context: VariableContext }) => {
      const response = await fetch('/api/whatsapp/template/resolve', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Errore nella risoluzione del template');
      }
      
      return response.json() as Promise<TemplateResolutionResult>;
    },
  });
}

export function useWhatsAppTemplatePreview() {
  return useMutation({
    mutationFn: async (data: { templateBody: string }) => {
      const response = await fetch('/api/whatsapp/template/preview', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Errore nella generazione anteprima');
      }
      
      return response.json() as Promise<{ previewTemplate: string }>;
    },
  });
}

// Hook per ottenere le entità disponibili per i contesti
export function useAvailableEntities() {
  const companiesQuery = useQuery({
    queryKey: ['/api/companies'],
    enabled: true
  });

  const customersQuery = useQuery({
    queryKey: ['/api/customers'],
    enabled: true
  });

  const suppliersQuery = useQuery({
    queryKey: ['/api/suppliers'],
    enabled: true
  });

  const movementsQuery = useQuery({
    queryKey: ['/api/movements'],
    enabled: true
  });

  return {
    companies: companiesQuery.data || [],
    customers: customersQuery.data || [],
    suppliers: suppliersQuery.data || [],
    movements: movementsQuery.data || [],
    isLoading: companiesQuery.isLoading || customersQuery.isLoading || 
               suppliersQuery.isLoading || movementsQuery.isLoading,
    refetch: () => {
      companiesQuery.refetch();
      customersQuery.refetch();
      suppliersQuery.refetch();
      movementsQuery.refetch();
    }
  };
}

// Variabili predefinite disponibili nel sistema
export const AVAILABLE_VARIABLES = {
  company: [
    { key: 'company.name', label: 'Nome Azienda', type: 'text' as const },
    { key: 'company.address', label: 'Indirizzo Azienda', type: 'text' as const },
    { key: 'company.phone', label: 'Telefono Azienda', type: 'phone' as const },
    { key: 'company.email', label: 'Email Azienda', type: 'email' as const },
    { key: 'company.vat', label: 'Partita IVA', type: 'text' as const },
    { key: 'company.fiscal_code', label: 'Codice Fiscale', type: 'text' as const }
  ],
  customer: [
    { key: 'customer.name', label: 'Nome Cliente', type: 'text' as const },
    { key: 'customer.email', label: 'Email Cliente', type: 'email' as const },
    { key: 'customer.phone', label: 'Telefono Cliente', type: 'phone' as const },
    { key: 'customer.address', label: 'Indirizzo Cliente', type: 'text' as const },
    { key: 'customer.vat', label: 'P.IVA Cliente', type: 'text' as const }
  ],
  supplier: [
    { key: 'supplier.name', label: 'Nome Fornitore', type: 'text' as const },
    { key: 'supplier.email', label: 'Email Fornitore', type: 'email' as const },
    { key: 'supplier.phone', label: 'Telefono Fornitore', type: 'phone' as const },
    { key: 'supplier.address', label: 'Indirizzo Fornitore', type: 'text' as const },
    { key: 'supplier.vat', label: 'P.IVA Fornitore', type: 'text' as const }
  ],
  movement: [
    { key: 'movement.amount', label: 'Importo', type: 'currency' as const },
    { key: 'movement.description', label: 'Descrizione', type: 'text' as const },
    { key: 'movement.date', label: 'Data Movimento', type: 'date' as const },
    { key: 'movement.type', label: 'Tipo Movimento', type: 'text' as const },
    { key: 'movement.category', label: 'Categoria', type: 'text' as const }
  ],
  system: [
    { key: 'system.current_date', label: 'Data Corrente', type: 'date' as const },
    { key: 'system.company_name', label: 'Nome Sistema', type: 'text' as const },
    { key: 'system.year', label: 'Anno Corrente', type: 'text' as const },
    { key: 'system.month', label: 'Mese Corrente', type: 'text' as const }
  ]
};

export function getVariablesByCategory(category: keyof typeof AVAILABLE_VARIABLES) {
  return AVAILABLE_VARIABLES[category] || [];
}

export function getAllVariables() {
  return Object.entries(AVAILABLE_VARIABLES).flatMap(([category, variables]) =>
    variables.map(v => ({ ...v, category }))
  );
}