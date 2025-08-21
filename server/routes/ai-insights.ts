import { Router } from "express";
import OpenAI from "openai";
// Import auth middleware - find the correct import name
import { Request, Response, NextFunction } from "express";

// Simple auth middleware - replace with correct import from auth.ts
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};
import type { MovementWithRelations } from "@shared/schema";

const router = Router();

// Initialize OpenAI
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface AIInsightRequest {
  movements: MovementWithRelations[];
  analysis_type: 'weekly_insights' | 'monthly_insights' | 'quarterly_insights';
  date_range?: { from: string; to: string };
}

// AI Financial Insights endpoint
router.post('/financial-insights', requireAuth, async (req, res) => {
  try {
    const { movements, analysis_type, date_range }: AIInsightRequest = req.body;

    if (!movements || movements.length === 0) {
      return res.status(400).json({ error: 'No movement data provided' });
    }

    // Calculate basic financial metrics
    const totalIncome = movements
      .filter(m => m.type === 'income')
      .reduce((sum, m) => sum + parseFloat(m.amount.toString()), 0);
    
    const totalExpenses = movements
      .filter(m => m.type === 'expense')
      .reduce((sum, m) => sum + parseFloat(m.amount.toString()), 0);

    const netCashFlow = totalIncome - totalExpenses;
    const incomeCount = movements.filter(m => m.type === 'income').length;
    const expenseCount = movements.filter(m => m.type === 'expense').length;

    // Group by company for concentration analysis
    const companyDistribution = movements.reduce((acc, movement) => {
      const companyId = movement.companyId || 'unknown';
      acc[companyId] = (acc[companyId] || 0) + parseFloat(movement.amount.toString());
      return acc;
    }, {} as Record<string, number>);

    const topCompanies = Object.entries(companyDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    // Create analysis context for AI
    const analysisContext = {
      period: date_range || { from: 'last_month', to: 'current' },
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_cash_flow: netCashFlow,
      income_transactions: incomeCount,
      expense_transactions: expenseCount,
      top_companies: topCompanies,
      transaction_count: movements.length,
      average_transaction: movements.length > 0 ? (totalIncome + totalExpenses) / movements.length : 0
    };

    // AI Analysis Prompt
    const analysisPrompt = `
Sei un consulente finanziario esperto per PMI italiane. Analizza questi dati finanziari e fornisci insights strategici.

DATI FINANZIARI:
- Entrate totali: €${totalIncome.toLocaleString('it-IT')}
- Spese totali: €${totalExpenses.toLocaleString('it-IT')}  
- Cash Flow netto: €${netCashFlow.toLocaleString('it-IT')}
- Transazioni entrate: ${incomeCount}
- Transazioni uscite: ${expenseCount}
- Top 3 aziende per volume: ${topCompanies.map(([id, amount]) => `${id}: €${amount.toLocaleString('it-IT')}`).join(', ')}

COMPITI:
1. Calcola un Financial Health Score (0-100) basato su: cash flow, diversificazione clienti, frequenza transazioni
2. Identifica 3-5 insights chiave con tipo (trend/risk/opportunity/anomaly), severità e confidence
3. Fornisci raccomandazioni actionable specifiche
4. Scrivi summary in italiano business-friendly

Rispondi in JSON con questa struttura:
{
  "financial_health_score": number,
  "summary": "string",
  "key_insights": [
    {
      "id": "insight_1",
      "type": "trend|risk|opportunity|anomaly",
      "severity": "low|medium|high", 
      "title": "Titolo insight",
      "description": "Descrizione breve",
      "impact": "Impatto sul business",
      "action": "Azione consigliata",
      "confidence": number,
      "value": number|null,
      "trend": "up|down|stable|null"
    }
  ],
  "recommendations": ["raccomandazione 1", "raccomandazione 2"],
  "generated_at": "ISO timestamp"
}

Focus su: concentrazione clienti, volatilità cash flow, trend spese, opportunità ottimizzazione.
`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Sei un esperto consulente finanziario per PMI italiane. Fornisci analisi precise, actionable e in italiano business-friendly."
        },
        {
          role: "user", 
          content: analysisPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2000
    });

    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(response.choices[0].message.content || '{}');
      
      // Add generated timestamp if missing
      if (!aiAnalysis.generated_at) {
        aiAnalysis.generated_at = new Date().toISOString();
      }

      // Validate and sanitize response
      if (!aiAnalysis.financial_health_score) {
        aiAnalysis.financial_health_score = Math.min(100, Math.max(0, 
          netCashFlow > 0 ? 75 : 45
        ));
      }

      if (!aiAnalysis.key_insights) {
        aiAnalysis.key_insights = [];
      }

      if (!aiAnalysis.recommendations) {
        aiAnalysis.recommendations = [];
      }

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      
      // Fallback analysis if AI parsing fails
      aiAnalysis = createFallbackAnalysis(analysisContext);
    }

    res.json(aiAnalysis);

  } catch (error) {
    console.error('AI Insights Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate financial insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Fallback analysis function
function createFallbackAnalysis(context: any) {
  const healthScore = context.net_cash_flow > 0 ? 
    Math.min(100, 60 + (context.net_cash_flow / Math.max(context.total_income, 1)) * 40) : 
    Math.max(0, 50 - Math.abs(context.net_cash_flow / Math.max(context.total_expenses, 1)) * 50);

  const insights = [];

  // Cash flow insight
  if (context.net_cash_flow > 0) {
    insights.push({
      id: "cash_flow_positive",
      type: "trend",
      severity: "low",
      title: "Cash Flow Positivo",
      description: `Il cash flow netto è positivo (€${context.net_cash_flow.toLocaleString('it-IT')})`,
      impact: "Liquidità disponibile per investimenti",
      action: "Valuta opportunità di crescita o accantonamenti",
      confidence: 95,
      value: context.net_cash_flow,
      trend: "up"
    });
  } else {
    insights.push({
      id: "cash_flow_negative", 
      type: "risk",
      severity: "high",
      title: "Cash Flow Negativo",
      description: `Il cash flow è negativo (€${context.net_cash_flow.toLocaleString('it-IT')})`,
      impact: "Rischio liquidità a breve termine",
      action: "Rivedi spese non essenziali e sollecita incassi",
      confidence: 95,
      value: context.net_cash_flow,
      trend: "down"
    });
  }

  // Transaction frequency insight
  const avgTransaction = context.average_transaction;
  insights.push({
    id: "transaction_analysis",
    type: "opportunity",
    severity: "medium", 
    title: "Analisi Transazioni",
    description: `Media transazione: €${avgTransaction.toLocaleString('it-IT')}`,
    impact: "Ottimizzazione gestione finanziaria",
    action: "Considera automatizzazione piccoli pagamenti",
    confidence: 80,
    value: avgTransaction,
    trend: "stable"
  });

  return {
    financial_health_score: Math.round(healthScore),
    summary: `Situazione finanziaria ${healthScore > 70 ? 'buona' : healthScore > 50 ? 'stabile' : 'da monitorare'} con ${context.transaction_count} transazioni analizzate.`,
    key_insights: insights,
    recommendations: [
      "Monitora regolarmente il cash flow settimanale",
      "Diversifica i canali di entrata quando possibile", 
      "Mantieni una riserva di liquidità del 10-15%"
    ],
    generated_at: new Date().toISOString()
  };
}

export default router;