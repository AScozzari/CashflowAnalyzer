import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { RotateCcw, CheckCircle, AlertCircle, Clock, ArrowUpDown } from 'lucide-react';

interface BankingSyncButtonProps {
  ibanId?: string;
  showFullInterface?: boolean;
}

interface SyncResult {
  synced: number;
  matched: number;
  totalSynced?: number;
  totalMatched?: number;
  errors: string[];
}

interface VerificationStats {
  total: number;
  verified: number;
  pending: number;
  matched: number;
  partial: number;
  noMatch: number;
}

export function BankingSyncButton({ ibanId, showFullInterface = false }: BankingSyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const { toast } = useToast();

  const loadStats = React.useCallback(async () => {
    try {
      const response = await fetch('/api/banking/verification-stats');
      const statsResponse = await response.json();
      setStats(statsResponse);
    } catch (error: any) {
      console.error('Errore caricamento statistiche:', error);
    }
  }, []);

  const syncSingleIban = async () => {
    if (!ibanId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/banking/sync/${ibanId}`, {
        method: 'POST'
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Errore durante la sincronizzazione');
      }
      
      setLastResult(result);
      await loadStats();
      
      toast({
        title: "✅ Sincronizzazione completata",
        description: result.message
      });
    } catch (error: any) {
      console.error('Errore sincronizzazione:', error);
      toast({
        title: "❌ Errore sincronizzazione", 
        description: error.message || "Errore durante la sincronizzazione",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncAllIbans = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/banking/sync-all', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Errore durante la sincronizzazione globale');
      }
      
      setLastResult(result);
      await loadStats();
      
      toast({
        title: "✅ Sincronizzazione globale completata",
        description: result.message
      });
    } catch (error: any) {
      console.error('Errore sincronizzazione globale:', error);
      toast({
        title: "❌ Errore sincronizzazione globale",
        description: error.message || "Errore durante la sincronizzazione globale",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (showFullInterface) {
      loadStats();
    }
  }, [showFullInterface, loadStats]);

  if (!showFullInterface && ibanId) {
    // Versione compatta per singolo IBAN
    return (
      <Button
        onClick={syncSingleIban}
        disabled={isLoading}
        size="sm"
        variant="outline"
        data-testid="button-sync-iban"
      >
        <RotateCcw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
        Sincronizza
      </Button>
    );
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5 text-blue-600" />
          Sistema di Matching Automatico
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Sincronizza le transazioni bancarie e verifica automaticamente i movimenti
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Statistiche Verifiche */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Totale movimenti</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
              <div className="text-xs text-green-600 dark:text-green-400">Verificati</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">In attesa</div>
            </div>
          </div>
        )}

        {/* Risultato ultima sincronizzazione */}
        {lastResult && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Ultima sincronizzazione:</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{lastResult.synced || lastResult.totalSynced || 0} transazioni sincronizzate</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-blue-500" />
                <span>{lastResult.matched || lastResult.totalMatched || 0} movimenti matchati</span>
              </div>
            </div>
            {lastResult.errors.length > 0 && (
              <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                {lastResult.errors.length} errori riscontrati
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Pulsanti azione */}
        <div className="flex flex-col sm:flex-row gap-3">
          {ibanId && (
            <Button
              onClick={syncSingleIban}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
              data-testid="button-sync-single-iban"
            >
              <RotateCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Sincronizza questo IBAN
            </Button>
          )}
          
          <Button
            onClick={syncAllIbans}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            data-testid="button-sync-all-ibans"
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Sincronizzando...' : 'Sincronizza tutti gli IBAN'}
          </Button>
        </div>

        {/* Legenda stati */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
          <h5 className="font-medium mb-2">Legenda stati verifica:</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-500">✓</Badge>
              <span>Movimento verificato (match &gt;90%)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">~</Badge>
              <span>Match parziale (70-90%)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">⏳</Badge>
              <span>In attesa di verifica</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">✗</Badge>
              <span>Nessun match trovato</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}