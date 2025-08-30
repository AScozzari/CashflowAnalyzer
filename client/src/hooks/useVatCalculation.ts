import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Types for VAT calculation
interface VatCalculationRequest {
  amount: number;
  vatCodeId: string;
  calculationType: 'from_imponibile' | 'from_totale';
}

interface VatCalculationResult {
  imponibile: number;
  imposta: number;
  totale: number;
  percentuale: number;
  natura?: string;
  description: string;
}

interface VatCalculationResponse {
  success: boolean;
  calculation: VatCalculationResult;
  vatCode: {
    id: string;
    code: string;
    description: string;
    percentage: number;
    natura?: string;
  };
}

interface VatCode {
  id: string;
  code: string;
  description: string;
  percentage: number;
  natura?: string;
  isActive: boolean;
}

// Hook per ottenere tutti i codici IVA
export function useVatCodes() {
  return useQuery<VatCode[]>({
    queryKey: ['/api/invoicing/vat-codes'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Hook per i calcoli IVA
export function useVatCalculation() {
  const [lastCalculation, setLastCalculation] = useState<VatCalculationResult | null>(null);

  const calculateVatMutation = useMutation({
    mutationFn: async (request: VatCalculationRequest): Promise<VatCalculationResponse> => {
      return apiRequest('/api/vat/calculate', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    },
    onSuccess: (data) => {
      setLastCalculation(data.calculation);
    },
    onError: (error) => {
      console.error('VAT calculation error:', error);
      setLastCalculation(null);
    }
  });

  const calculateVat = useCallback((request: VatCalculationRequest) => {
    return calculateVatMutation.mutate(request);
  }, [calculateVatMutation]);

  const calculateFromImponibile = useCallback((amount: number, vatCodeId: string) => {
    return calculateVat({
      amount,
      vatCodeId,
      calculationType: 'from_imponibile'
    });
  }, [calculateVat]);

  const calculateFromTotale = useCallback((amount: number, vatCodeId: string) => {
    return calculateVat({
      amount,
      vatCodeId,
      calculationType: 'from_totale'
    });
  }, [calculateVat]);

  return {
    calculateVat,
    calculateFromImponibile,
    calculateFromTotale,
    lastCalculation,
    isCalculating: calculateVatMutation.isPending,
    error: calculateVatMutation.error,
    reset: () => {
      setLastCalculation(null);
      calculateVatMutation.reset();
    }
  };
}

// Hook combinato per gestione completa IVA
export function useVatManagement() {
  const vatCodesQuery = useVatCodes();
  const vatCalculation = useVatCalculation();

  const getVatCodeById = useCallback((id: string) => {
    return vatCodesQuery.data?.find(code => code.id === id);
  }, [vatCodesQuery.data]);

  const getVatCodesByType = useCallback((filterType?: 'standard' | 'exempt' | 'reverse_charge') => {
    if (!vatCodesQuery.data) return [];
    
    switch (filterType) {
      case 'standard':
        return vatCodesQuery.data.filter(code => code.percentage > 0 && !code.natura);
      case 'exempt':
        return vatCodesQuery.data.filter(code => 
          code.natura && (
            code.natura.startsWith('N1') || 
            code.natura.startsWith('N2') || 
            code.natura.startsWith('N3') || 
            code.natura.startsWith('N4') ||
            code.natura.startsWith('N5') ||
            code.natura === 'N7'
          )
        );
      case 'reverse_charge':
        return vatCodesQuery.data.filter(code => code.natura?.startsWith('N6'));
      default:
        return vatCodesQuery.data.filter(code => code.isActive);
    }
  }, [vatCodesQuery.data]);

  const getVatDescription = useCallback((vatCode?: VatCode) => {
    if (!vatCode) return '';
    
    if (vatCode.natura) {
      if (vatCode.natura.startsWith('N1')) return 'Operazione esclusa da IVA';
      if (vatCode.natura.startsWith('N2')) return 'Operazione non soggetta a IVA';
      if (vatCode.natura.startsWith('N3')) return 'Operazione non imponibile';
      if (vatCode.natura === 'N4') return 'Operazione esente da IVA';
      if (vatCode.natura === 'N5') return 'Regime del margine';
      if (vatCode.natura.startsWith('N6')) return 'Inversione contabile (Reverse Charge)';
      if (vatCode.natura === 'N7') return 'IVA assolta in altro stato UE';
    }
    
    if (vatCode.percentage > 0) {
      return `IVA ${vatCode.percentage}%`;
    }
    
    return 'IVA 0%';
  }, []);

  return {
    // VAT codes
    vatCodes: vatCodesQuery.data || [],
    isLoadingVatCodes: vatCodesQuery.isLoading,
    vatCodesError: vatCodesQuery.error,
    
    // VAT calculation
    ...vatCalculation,
    
    // Helper functions
    getVatCodeById,
    getVatCodesByType,
    getVatDescription,
    
    // Combined loading state
    isLoading: vatCodesQuery.isLoading || vatCalculation.isCalculating,
  };
}