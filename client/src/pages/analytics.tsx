import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";

import Header from "@/components/layout/header";
import { FooterSignature } from "@/components/layout/footer-signature";
import AdvancedFiltersNew, { type AnalyticsFilters } from "@/components/analytics/advanced-filters-new";
import AnalyticsTable from "@/components/analytics/analytics-table";
import AnalyticsChartsProfessional from "@/components/analytics/analytics-charts-professional";
import { AIInsightsWidget } from "@/components/analytics/ai-insights-widget";
import { AnomalyDetector } from "@/components/analytics/anomaly-detector";
import { FinancialHealthScore } from "@/components/analytics/financial-health-score";
import MovementFormNewFixed from "@/components/movements/movement-form-new-fixed";
import { useToast } from "@/hooks/use-toast";
import type { MovementWithRelations } from "@shared/schema";

export default function Analytics() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  // Stati per la modifica movimento in Analytics
  const [editingMovement, setEditingMovement] = useState<MovementWithRelations | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

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
    enabled: false, // Non caricare automaticamente - solo con "Applica Filtri"
  });

  const handleFiltersChange = useCallback((newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setCurrentPage(1); // Reset to first page when applying new filters
    refetch(); // Esegui la query solo quando l'utente clicca "Applica Filtri"
  }, [refetch]);

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
    // La query si aggiornerà automaticamente con i filtri vuoti
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

  // Gestione modifica movimento in Analytics
  const handleEditMovement = useCallback((movement: MovementWithRelations) => {
    setEditingMovement(movement);
    setIsFormOpen(true);
  }, []);

  const handleMovementUpdated = useCallback(() => {
    // Ricarica i dati dopo la modifica
    refetch();
    setIsFormOpen(false);
    setEditingMovement(null);
    toast({
      title: "Movimento aggiornato",
      description: "Le modifiche sono state salvate con successo",
    });
  }, [refetch, toast]);

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
    <div className="min-h-screen bg-background">
      <Header 
        title="Analytics" 
        subtitle="Analisi approfondite dei flussi finanziari con filtri avanzati"
      />
      
      <div className="p-4 lg:p-6 space-y-6">
        {/* Advanced Filters - Responsive */}
        <div>
          {(
            <AdvancedFiltersNew
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onApplyFilters={handleApplyFilters}
              onResetFilters={handleResetFilters}
              isLoading={isLoading}
            />
          ) as React.ReactNode}
        </div>

        {/* Results Section */}
        {movementsData && (
          <>
            {/* AI-Powered Analytics - Quick Wins Integration */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <FinancialHealthScore 
                movements={(movementsData as any)?.data || []}
              />
              <AIInsightsWidget 
                movements={(movementsData as any)?.data || []}
                dateRange={filters?.createdDateFrom && filters?.createdDateTo ? {
                  from: filters.createdDateFrom,
                  to: filters.createdDateTo
                } : undefined}
              />
              <AnomalyDetector 
                movements={(movementsData as any)?.data || []}
                autoRefresh={true}
              />
            </div>

            {/* Analytics Charts - Professional & Responsive */}
            <div className="bg-card rounded-lg shadow-sm border p-4 lg:p-6">
              <AnalyticsChartsProfessional 
                movements={(movementsData as any)?.data || []}
                isLoading={isLoading}
              />
            </div>

            {/* Data Table - Responsive */}
            <div className="bg-card rounded-lg shadow-sm border">
              <AnalyticsTable
                movements={(movementsData as any)?.data || []}
                isLoading={isLoading}
                totalCount={(movementsData as any)?.totalCount || 0}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onExportData={handleExportData}
                onEditMovement={handleEditMovement}
              />
            </div>
          </>
        )}

        {/* No data state - Responsive */}
        {!isLoading && !movementsData && hasActiveFilters && (
          <div className="text-center py-12 px-4">
            <p className="text-muted-foreground text-base lg:text-lg mb-4">
              Applica i filtri per visualizzare i risultati dell'analisi
            </p>
            <p className="text-muted-foreground/70 text-sm">
              Seleziona i criteri di filtro desiderati e clicca "Applica Filtri"
            </p>
          </div>
        )}

        {/* Initial state - Responsive */}
        {!hasActiveFilters && !movementsData && (
          <div className="text-center py-12 bg-card rounded-lg border-2 border-dashed border-border/50">
            <div className="max-w-md mx-auto px-4">
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
      
      {/* Form di modifica movimento integrato in Analytics */}
      {editingMovement && (
        <MovementFormNewFixed
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingMovement(null);
            handleMovementUpdated(); // Call the update function when closing
          }}
          movement={editingMovement}
        />
      )}
      
      <FooterSignature />
    </div>
  );
}
