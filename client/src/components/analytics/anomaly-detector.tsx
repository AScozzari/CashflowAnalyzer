import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Shield, Eye, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { MovementWithRelations } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Anomaly {
  id: string;
  movement_id: string;
  type: 'amount_outlier' | 'frequency_spike' | 'unusual_pattern' | 'duplicate_risk';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  risk_score: number;
  detected_at: string;
  movement_details: {
    amount: number;
    date: string;
    description?: string;
    company_name?: string;
  };
  recommendation: string;
}

interface AnomalyDetectionResponse {
  anomalies: Anomaly[];
  summary: {
    total_checked: number;
    anomalies_found: number;
    high_risk: number;
    medium_risk: number;
    low_risk: number;
  };
  last_scan: string;
}

interface AnomalyDetectorProps {
  movements: MovementWithRelations[];
  autoRefresh?: boolean;
}

export function AnomalyDetector({ movements, autoRefresh = true }: AnomalyDetectorProps) {
  const { data: anomalies, isLoading, error, refetch } = useQuery<AnomalyDetectionResponse>({
    queryKey: ['anomaly-detection', movements?.length],
    queryFn: async () => {
      const response = await fetch('/api/ai/detect-anomalies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movements: movements.slice(0, 200), // Limit for performance
          detection_sensitivity: 'medium',
          include_duplicates: true
        })
      });
      if (!response.ok) throw new Error('Failed to detect anomalies');
      return response.json();
    },
    enabled: movements && movements.length > 0,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchInterval: autoRefresh ? 30 * 60 * 1000 : false, // Auto-refresh every 30 minutes
  });

  const getAnomalyIcon = (type: Anomaly['type']) => {
    switch (type) {
      case 'amount_outlier': return <TrendingDown className="h-4 w-4" />;
      case 'frequency_spike': return <AlertTriangle className="h-4 w-4" />;
      case 'unusual_pattern': return <Eye className="h-4 w-4" />;
      case 'duplicate_risk': return <Shield className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: Anomaly['severity']) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default'; 
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 dark:text-red-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('it-IT', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);

  if (isLoading) {
    return (
      <Card data-testid="anomaly-detector">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            Anomaly Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="flex gap-4">
              <div className="h-16 w-16 bg-muted rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !anomalies) {
    return (
      <Card data-testid="anomaly-detector-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            Anomaly Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Non è stato possibile eseguire l'analisi delle anomalie. Riprova più tardi.
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            onClick={() => refetch()} 
            className="mt-3"
            data-testid="retry-anomaly-detection"
          >
            Riprova Scansione
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="anomaly-detector">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-600" />
          Anomaly Detection
          <Badge 
            variant={anomalies.anomalies.length > 0 ? "destructive" : "secondary"} 
            className="ml-auto"
          >
            {anomalies.anomalies.length} anomalie
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {anomalies.summary.total_checked}
            </div>
            <div className="text-xs text-muted-foreground">Transazioni Verificate</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600">
              {anomalies.summary.high_risk}
            </div>
            <div className="text-xs text-muted-foreground">Alto Rischio</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {anomalies.summary.medium_risk}
            </div>
            <div className="text-xs text-muted-foreground">Medio Rischio</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {anomalies.summary.low_risk}
            </div>
            <div className="text-xs text-muted-foreground">Basso Rischio</div>
          </div>
        </div>

        {/* Anomalies List */}
        {anomalies.anomalies.length === 0 ? (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
            <Shield className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium text-green-800 dark:text-green-200">
              Nessuna Anomalia Rilevata
            </h3>
            <p className="text-sm text-green-600 dark:text-green-300">
              Tutte le transazioni sembrano normali e coerenti con i pattern storici.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="font-medium">Anomalie Rilevate</h3>
            {anomalies.anomalies.map((anomaly) => (
              <div 
                key={anomaly.id} 
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                data-testid={`anomaly-${anomaly.type}-${anomaly.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    anomaly.severity === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                    anomaly.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                    'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    {getAnomalyIcon(anomaly.type)}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium">{anomaly.title}</h4>
                      <Badge variant={getSeverityColor(anomaly.severity)}>
                        {anomaly.severity}
                      </Badge>
                      <div className={`text-sm font-mono ${getRiskScoreColor(anomaly.risk_score)}`}>
                        Risk: {anomaly.risk_score}%
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {anomaly.description}
                    </p>
                    
                    {/* Movement Details */}
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium">Importo:</span>
                          <span className="ml-2">{formatCurrency(anomaly.movement_details.amount)}</span>
                        </div>
                        <div>
                          <span className="font-medium">Data:</span>
                          <span className="ml-2">
                            {format(new Date(anomaly.movement_details.date), 'dd MMM yyyy', { locale: it })}
                          </span>
                        </div>
                        {anomaly.movement_details.company_name && (
                          <div className="sm:col-span-2">
                            <span className="font-medium">Azienda:</span>
                            <span className="ml-2">{anomaly.movement_details.company_name}</span>
                          </div>
                        )}
                        {anomaly.movement_details.description && (
                          <div className="sm:col-span-2">
                            <span className="font-medium">Descrizione:</span>
                            <span className="ml-2 italic">{anomaly.movement_details.description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Recommendation */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Eye className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-sm text-blue-800 dark:text-blue-200">
                            Raccomandazione
                          </div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">
                            {anomaly.recommendation}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" data-testid={`investigate-${anomaly.id}`}>
                        Investiga
                      </Button>
                      <Button size="sm" variant="ghost" data-testid={`dismiss-${anomaly.id}`}>
                        Ignora
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Last Scan Info */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Ultima scansione: {format(new Date(anomalies.last_scan), 'dd MMM yyyy HH:mm', { locale: it })}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => refetch()} 
            className="ml-2 text-xs"
            data-testid="refresh-anomaly-scan"
          >
            Riscansiona
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}