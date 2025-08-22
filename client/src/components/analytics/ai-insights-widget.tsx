import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, AlertTriangle, TrendingUp, Target, Lightbulb, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { MovementWithRelations } from "@shared/schema";

interface AIInsight {
  id: string;
  type: 'trend' | 'risk' | 'opportunity' | 'anomaly';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact: string;
  action: string;
  confidence: number;
  value?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface AIInsightsResponse {
  financial_health_score: number;
  key_insights: AIInsight[];
  summary: string;
  recommendations: string[];
  generated_at: string;
}

interface AIInsightsWidgetProps {
  movements: MovementWithRelations[];
  dateRange?: { from: string; to: string };
}

export function AIInsightsWidget({ movements, dateRange }: AIInsightsWidgetProps) {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const { data: insights, isLoading, error } = useQuery<AIInsightsResponse>({
    queryKey: ['ai-insights', movements?.length, dateRange],
    queryFn: async () => {
      return await apiRequest('/api/ai/financial-insights', {
        method: 'POST',
        body: JSON.stringify({
          movements: movements.slice(0, 100), // Limit per performance
          analysis_type: 'weekly_insights',
          date_range: dateRange
        })
      });
    },
    enabled: movements && movements.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity': return <Target className="h-4 w-4" />;
      case 'anomaly': return <Brain className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: AIInsight['severity']) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
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
      <Card data-testid="ai-insights-widget">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Financial Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-20 bg-muted rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !insights) {
    return (
      <Card data-testid="ai-insights-widget-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Financial Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Non è stato possibile generare gli insights AI. Riprova più tardi.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="ai-insights-widget">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          AI Financial Insights
          <Badge variant="secondary" className="ml-auto">
            {insights.key_insights.length} insights
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Financial Health Score */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Financial Health Score</h3>
            <div className={`text-2xl font-bold ${getHealthScoreColor(insights.financial_health_score)}`}>
              {insights.financial_health_score}/100
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                insights.financial_health_score >= 80 ? 'bg-green-500' :
                insights.financial_health_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${insights.financial_health_score}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {insights.summary}
          </p>
        </div>

        {/* Key Insights */}
        <div className="space-y-3">
          <h3 className="font-medium">Key Insights</h3>
          {insights.key_insights.map((insight) => (
            <div key={insight.id} className="border rounded-lg">
              <div 
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedInsight(
                  expandedInsight === insight.id ? null : insight.id
                )}
                data-testid={`insight-${insight.type}-${insight.id}`}
              >
                <div className={`p-2 rounded-full ${
                  insight.severity === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                  insight.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                  'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <Badge variant={getSeverityColor(insight.severity)} className="text-xs">
                      {insight.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {insight.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {insight.value && (
                    <span className="text-sm font-medium">
                      {insight.value > 0 ? formatCurrency(insight.value) : `${insight.value}%`}
                    </span>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {insight.confidence}% confidence
                  </Badge>
                  <ChevronRight className={`h-4 w-4 transition-transform ${
                    expandedInsight === insight.id ? 'rotate-90' : ''
                  }`} />
                </div>
              </div>
              
              {expandedInsight === insight.id && (
                <div className="px-3 pb-3">
                  <Separator className="mb-3" />
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Impact:</span>
                      <span className="text-muted-foreground ml-2">{insight.impact}</span>
                    </div>
                    <div>
                      <span className="font-medium">Recommended Action:</span>
                      <span className="text-muted-foreground ml-2">{insight.action}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="mt-3" data-testid={`action-${insight.id}`}>
                    Take Action
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AI Recommendations */}
        {insights.recommendations && insights.recommendations.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">AI Recommendations</h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <ul className="space-y-2">
                {insights.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Insights generated on {new Date(insights.generated_at).toLocaleString('it-IT')}
        </div>
      </CardContent>
    </Card>
  );
}