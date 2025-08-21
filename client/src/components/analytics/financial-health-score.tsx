import { useMemo } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { MovementWithRelations } from "@shared/schema";

interface FinancialHealthScoreProps {
  movements: MovementWithRelations[];
  className?: string;
}

interface HealthMetrics {
  score: number;
  cashFlowHealth: number;
  diversificationHealth: number;
  activityHealth: number;
  riskLevel: 'low' | 'medium' | 'high';
  insights: string[];
}

export function FinancialHealthScore({ movements, className }: FinancialHealthScoreProps) {
  const healthMetrics = useMemo<HealthMetrics>(() => {
    if (!movements || movements.length === 0) {
      return {
        score: 0,
        cashFlowHealth: 0,
        diversificationHealth: 0,
        activityHealth: 0,
        riskLevel: 'high',
        insights: ['Nessun dato disponibile per il calcolo']
      };
    }

    const totalIncome = movements
      .filter(m => m.type === 'income')
      .reduce((sum, m) => sum + parseFloat(m.amount.toString()), 0);
    
    const totalExpenses = movements
      .filter(m => m.type === 'expense')
      .reduce((sum, m) => sum + parseFloat(m.amount.toString()), 0);
    
    const netCashFlow = totalIncome - totalExpenses;
    const incomeTransactions = movements.filter(m => m.type === 'income').length;
    const expenseTransactions = movements.filter(m => m.type === 'expense').length;

    // Cash Flow Health (40% weight)
    let cashFlowHealth = 50; // Base score
    if (netCashFlow > 0) {
      const profitMargin = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0;
      cashFlowHealth = Math.min(100, 60 + profitMargin * 2);
    } else {
      const lossRatio = totalExpenses > 0 ? Math.abs(netCashFlow) / totalExpenses : 100;
      cashFlowHealth = Math.max(0, 50 - lossRatio * 100);
    }

    // Diversification Health (30% weight) - Company distribution
    const companyDistribution = movements.reduce((acc, movement) => {
      const companyId = movement.companyId || 'unknown';
      acc[companyId] = (acc[companyId] || 0) + parseFloat(movement.amount.toString());
      return acc;
    }, {} as Record<string, number>);
    
    const companies = Object.keys(companyDistribution);
    const topCompanyShare = companies.length > 0 ? 
      Math.max(...Object.values(companyDistribution)) / (totalIncome + totalExpenses) : 1;
    
    let diversificationHealth = 100;
    if (topCompanyShare > 0.7) diversificationHealth = 30;
    else if (topCompanyShare > 0.5) diversificationHealth = 60;
    else if (topCompanyShare > 0.3) diversificationHealth = 85;

    // Activity Health (30% weight) - Transaction frequency and consistency
    const avgTransactionsPerDay = movements.length / 30; // Assume 30-day period
    let activityHealth = Math.min(100, avgTransactionsPerDay * 20);
    
    // Balance between income and expense transactions
    const transactionBalance = Math.min(incomeTransactions, expenseTransactions) / 
                               Math.max(incomeTransactions, expenseTransactions, 1);
    activityHealth = activityHealth * (0.7 + 0.3 * transactionBalance);

    // Calculate overall score
    const overallScore = Math.round(
      cashFlowHealth * 0.4 + 
      diversificationHealth * 0.3 + 
      activityHealth * 0.3
    );

    // Risk Level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (overallScore < 40) riskLevel = 'high';
    else if (overallScore < 70) riskLevel = 'medium';

    // Generate insights
    const insights = [];
    if (netCashFlow > 0) {
      insights.push(`Cash flow positivo di €${netCashFlow.toLocaleString('it-IT')}`);
    } else {
      insights.push(`Cash flow negativo: €${netCashFlow.toLocaleString('it-IT')}`);
    }
    
    if (topCompanyShare > 0.5) {
      insights.push(`Alta concentrazione: ${Math.round(topCompanyShare * 100)}% su una singola azienda`);
    }
    
    if (companies.length > 5) {
      insights.push(`Buona diversificazione con ${companies.length} aziende`);
    }
    
    if (avgTransactionsPerDay < 1) {
      insights.push('Attività transazionale limitata');
    } else if (avgTransactionsPerDay > 3) {
      insights.push('Alto volume di attività finanziaria');
    }

    return {
      score: overallScore,
      cashFlowHealth: Math.round(cashFlowHealth),
      diversificationHealth: Math.round(diversificationHealth),
      activityHealth: Math.round(activityHealth),
      riskLevel,
      insights
    };
  }, [movements]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <TrendingUp className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  return (
    <Card className={className} data-testid="financial-health-score">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getHealthIcon(healthMetrics.score)}
          Financial Health Score
          <Badge variant={getRiskBadgeVariant(healthMetrics.riskLevel)} className="ml-auto">
            {healthMetrics.riskLevel.toUpperCase()} RISK
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor(healthMetrics.score)}`}>
            {healthMetrics.score}/100
          </div>
          <div className="w-full mt-3">
            <Progress 
              value={healthMetrics.score} 
              className="h-3"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Punteggio complessivo salute finanziaria
          </p>
        </div>

        {/* Component Scores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Cash Flow</span>
            </div>
            <div className={`text-lg font-bold ${getScoreColor(healthMetrics.cashFlowHealth)}`}>
              {healthMetrics.cashFlowHealth}
            </div>
            <Progress 
              value={healthMetrics.cashFlowHealth} 
              className="h-1 mt-1"
            />
          </div>

          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-2">
              <TrendingDown className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Diversificazione</span>
            </div>
            <div className={`text-lg font-bold ${getScoreColor(healthMetrics.diversificationHealth)}`}>
              {healthMetrics.diversificationHealth}
            </div>
            <Progress 
              value={healthMetrics.diversificationHealth} 
              className="h-1 mt-1"
            />
          </div>

          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Attività</span>
            </div>
            <div className={`text-lg font-bold ${getScoreColor(healthMetrics.activityHealth)}`}>
              {healthMetrics.activityHealth}
            </div>
            <Progress 
              value={healthMetrics.activityHealth} 
              className="h-1 mt-1"
            />
          </div>
        </div>

        {/* Key Insights */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Key Insights:</h4>
          <div className="space-y-2">
            {healthMetrics.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span className="text-muted-foreground">{insight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {healthMetrics.riskLevel === 'high' && (
              <div className="col-span-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-800 dark:text-red-200">
                ⚠️ Attenzione: Situazione finanziaria critica. Rivedi le spese prioritarie.
              </div>
            )}
            {healthMetrics.riskLevel === 'medium' && (
              <div className="col-span-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-yellow-800 dark:text-yellow-200">
                ⚡ Situazione stabile ma migliorabile. Considera strategie di ottimizzazione.
              </div>
            )}
            {healthMetrics.riskLevel === 'low' && (
              <div className="col-span-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-green-800 dark:text-green-200">
                ✅ Ottima salute finanziaria. Mantieni le attuali strategie.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}