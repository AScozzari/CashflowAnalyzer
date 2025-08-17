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
  // Dati di esempio per la demo del sistema di variabili dinamiche
  const mockData = {
    companies: [
      { id: '1', name: 'EasyFlows S.r.l.', email: 'info@easyflows.it', phone: '+39 02 1234567', address: 'Via Roma 123, Milano', vat: 'IT12345678901', fiscal_code: 'EFLSRL89H01F205Z' },
      { id: '2', name: 'Tech Innovation S.p.A.', email: 'contact@techinnovation.it', phone: '+39 06 9876543', address: 'Via Nazionale 456, Roma', vat: 'IT98765432109', fiscal_code: 'TCNVSP92B15H501A' }
    ],
    customers: [
      { id: '1', name: 'Mario Rossi', email: 'mario.rossi@email.it', phone: '+39 333 1234567', address: 'Via Verdi 78, Torino', vat: 'IT11223344556' },
      { id: '2', name: 'Giulia Bianchi', email: 'giulia.bianchi@email.it', phone: '+39 347 7654321', address: 'Corso Italia 90, Napoli', vat: 'IT66778899001' },
      { id: '3', name: 'Francesco Verde S.r.l.', email: 'info@francescoverde.it', phone: '+39 011 5556789', address: 'Via Milano 45, Firenze', vat: 'IT44556677889' }
    ],
    suppliers: [
      { id: '1', name: 'Fornitore TechCorp', email: 'orders@techcorp.it', phone: '+39 02 8887766', address: 'Via Industria 12, Milano', vat: 'IT77889900112' },
      { id: '2', name: 'Servizi Professionali S.r.l.', email: 'info@servizipro.it', phone: '+39 06 4445556', address: 'Via Commercio 67, Roma', vat: 'IT33445566778' }
    ],
    movements: [
      { id: '1', amount: 1250.00, description: 'Fattura servizi consulenza', date: '2024-03-15', type: 'Entrata', category: 'Servizi' },
      { id: '2', amount: 850.50, description: 'Pagamento fornitore materiali', date: '2024-03-12', type: 'Uscita', category: 'Acquisti' },
      { id: '3', amount: 2100.00, description: 'Incasso vendita prodotti', date: '2024-03-10', type: 'Entrata', category: 'Vendite' },
      { id: '4', amount: 450.75, description: 'Spese marketing digitale', date: '2024-03-08', type: 'Uscita', category: 'Marketing' }
    ]
  };

  return {
    companies: mockData.companies,
    customers: mockData.customers,
    suppliers: mockData.suppliers,
    movements: mockData.movements,
    isLoading: false,
    refetch: () => {
      // Simula il refresh dei dati
      console.log('Refreshing mock data for WhatsApp variables demo');
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