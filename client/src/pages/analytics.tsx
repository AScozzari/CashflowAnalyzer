import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";

import Header from "@/components/layout/header";
import FooterSignature from "@/components/layout/footer-signature";
import AdvancedFilters, { type AnalyticsFilters } from "@/components/analytics/advanced-filters";
import AnalyticsTable from "@/components/analytics/analytics-table";
import AnalyticsCharts from "@/components/analytics/analytics-charts";
import { useToast } from "@/hooks/use-toast";

export default function Analytics() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Create query key based on filters and pagination
  const queryKey = useMemo(() => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params.append(key, value.join(','));
          }
        } else {
          params.append(key, String(value));
        }
      }
    });
    
    params.append('page', String(currentPage));
    params.append('pageSize', String(pageSize));
    
    return [`/api/analytics/filtered-movements?${params.toString()}`];
  }, [filters, currentPage, pageSize]);

  // Fetch filtered movements
  const { 
    data: movementsData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey,
    enabled: false, // Don't auto-fetch until user applies filters
  });

  const handleFiltersChange = useCallback((newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setCurrentPage(1); // Reset to first page when applying new filters
    refetch();
  }, [refetch]);

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
    toast({
      title: "Filtri azzerati",
      description: "Tutti i filtri sono stati rimossi",
    });
  }, [toast]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handleExportData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              params.append(key, value.join(','));
            }
          } else {
            params.append(key, String(value));
          }
        }
      });
      
      params.append('format', 'csv');
      
      const response = await fetch(`/api/analytics/export?${params.toString()}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${format(new Date(), 'dd-MM-yyyy_HH-mm', { locale: it })}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Export completato",
          description: "I dati sono stati scaricati con successo",
        });
      } else {
        throw new Error('Failed to export data');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Errore nell'export",
        description: "Non è stato possibile scaricare i dati",
        variant: "destructive",
      });
    }
  }, [filters, toast]);

  // Calculate if there are active filters
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'tagIds') {
        return Array.isArray(value) && value.length > 0;
      }
      return value !== undefined && value !== '' && value !== null;
    });
  }, [filters]);

  // Show error message if query failed (use useEffect to avoid infinite renders)
  useEffect(() => {
    if (error) {
      toast({
        title: "Errore nel caricamento dati",
        description: "Non è stato possibile caricare i movimenti",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Analytics" 
        subtitle="Analisi approfondite dei flussi finanziari con filtri avanzati"
      />
      
      <div className="p-6 space-y-6">
        {/* Advanced Filters */}
        <AdvancedFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
          isLoading={isLoading}
        />

        {/* Results Section */}
        {movementsData && (
          <>
            {/* Analytics Charts */}
            <AnalyticsCharts 
              movements={movementsData.data || []}
              isLoading={isLoading}
            />

            {/* Data Table */}
            <AnalyticsTable
              movements={movementsData.data || []}
              isLoading={isLoading}
              totalCount={movementsData.totalCount || 0}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onExportData={handleExportData}
            />
          </>
        )}

        {/* No data state */}
        {!isLoading && !movementsData && hasActiveFilters && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">
              Applica i filtri per visualizzare i risultati dell'analisi
            </p>
            <p className="text-gray-400 text-sm">
              Seleziona i criteri di filtro desiderati e clicca "Applica Filtri"
            </p>
          </div>
        )}

        {/* Initial state */}
        {!hasActiveFilters && !movementsData && (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Benvenuto nelle Analytics Avanzate
              </h3>
              <p className="text-gray-500 mb-4">
                Utilizza i filtri avanzati per analizzare i tuoi movimenti finanziari.
                Potrai visualizzare grafici dettagliati, tabelle complete e scaricare i dati.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
                <strong>Suggerimento:</strong> Inizia selezionando un intervallo di date per ottenere una panoramica dei movimenti.
              </div>
            </div>
          </div>
        )}
      </div>
      
      <FooterSignature />
    </div>
  );
}
