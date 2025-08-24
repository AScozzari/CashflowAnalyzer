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

interface AnomalyDetectionRequest {
  movements: MovementWithRelations[];
  detection_sensitivity: 'low' | 'medium' | 'high';
  include_duplicates?: boolean;
}

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

// AI Anomaly Detection endpoint
router.post('/detect-anomalies', requireAuth, async (req, res) => {
  try {
    const { movements, detection_sensitivity, include_duplicates }: AnomalyDetectionRequest = req.body;

    if (!movements || movements.length === 0) {
      return res.status(400).json({ error: 'No movement data provided' });
    }

    // Statistical analysis for baseline
    const amounts = movements.map(m => parseFloat(m.amount.toString()));
    const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const medianAmount = amounts.sort((a, b) => a - b)[Math.floor(amounts.length / 2)];
    
    // Standard deviation for outlier detection
    const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    // Frequency analysis
    const dailyTransactions = movements.reduce((acc, movement) => {
      const date = movement.flowDate || movement.insertDate;
      const dayKey = date ? new Date(date).toISOString().split('T')[0] : 'unknown';
      acc[dayKey] = (acc[dayKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgDailyTransactions = Object.values(dailyTransactions).reduce((sum, count) => sum + count, 0) / 
                                Object.keys(dailyTransactions).length;

    // Company frequency analysis
    const companyFrequency = movements.reduce((acc, movement) => {
      const companyId = movement.companyId || 'unknown';
      acc[companyId] = (acc[companyId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Create analysis context for AI
    const analysisContext = {
      total_movements: movements.length,
      avg_amount: avgAmount,
      median_amount: medianAmount,
      std_deviation: stdDev,
      avg_daily_transactions: avgDailyTransactions,
      sensitivity: detection_sensitivity,
      date_range: {
        from: movements[0]?.flowDate || movements[0]?.insertDate,
        to: movements[movements.length - 1]?.flowDate || movements[movements.length - 1]?.insertDate
      }
    };

    // Prepare suspicious movements for AI analysis
    const suspiciousMovements = movements.filter((movement, index) => {
      const amount = parseFloat(movement.amount.toString());
      
      // Amount outliers (outside 2-3 std devs based on sensitivity)
      const outlierThreshold = detection_sensitivity === 'high' ? 2 : 
                               detection_sensitivity === 'medium' ? 2.5 : 3;
      const isAmountOutlier = Math.abs(amount - avgAmount) > outlierThreshold * stdDev;
      
      // Unusual patterns (very large or very small compared to median)
      const isUnusualPattern = amount > medianAmount * 5 || (amount < medianAmount * 0.1 && amount > 0);
      
      return isAmountOutlier || isUnusualPattern;
    }).slice(0, 20); // Limit for AI processing

    // AI Analysis Prompt for anomaly detection
    const anomalyPrompt = `
Sei un esperto in fraud detection e anomaly detection per transazioni finanziarie di PMI italiane.

ANALIZZA QUESTI DATI:
- Transazioni totali: ${movements.length}
- Importo medio: €${avgAmount.toFixed(2)}
- Mediana importi: €${medianAmount.toFixed(2)}
- Deviazione standard: €${stdDev.toFixed(2)}
- Sensibilità rilevamento: ${detection_sensitivity}

MOVIMENTI SOSPETTI DA ANALIZZARE:
${suspiciousMovements.map((m, i) => `
${i + 1}. ID: ${m.id}
   - Importo: €${m.amount}
   - Tipo: ${m.type}
   - Data: ${m.flowDate || m.insertDate}
   - Descrizione: ${(m as any).description || 'N/A'}
   - Azienda: ${m.companyId || 'N/A'}
`).join('\n')}

COMPITI:
1. Identifica anomalie reali (non falsi positivi)
2. Classifica per tipo: amount_outlier, frequency_spike, unusual_pattern, duplicate_risk
3. Assegna severity: low/medium/high e risk_score (0-100)
4. Fornisci raccomandazioni specifiche e actionable

Rispondi in JSON:
{
  "anomalies": [
    {
      "id": "anomaly_unique_id",
      "movement_id": "movement_id_from_input",
      "type": "amount_outlier|frequency_spike|unusual_pattern|duplicate_risk",
      "severity": "low|medium|high",
      "title": "Titolo breve anomalia",
      "description": "Descrizione del problema rilevato",
      "risk_score": number_0_to_100,
      "detected_at": "ISO_timestamp",
      "movement_details": {
        "amount": number,
        "date": "ISO_date",
        "description": "string_or_null",
        "company_name": "string_or_null"
      },
      "recommendation": "Azione specifica consigliata"
    }
  ],
  "summary": {
    "total_checked": number,
    "anomalies_found": number,
    "high_risk": number,
    "medium_risk": number,
    "low_risk": number
  },
  "last_scan": "ISO_timestamp"
}

Priorità: Precision over Recall. Meglio poche anomalie vere che tanti falsi allarmi.
Considera: importi molto diversi dalla norma, pattern temporali strani, possibili duplicati.
`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system", 
          content: "Sei un esperto in financial fraud detection e anomaly detection. Fornisci analisi precise evitando falsi positivi."
        },
        {
          role: "user",
          content: anomalyPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Low temperature for consistent detection
      max_tokens: 3000
    });

    let anomalyAnalysis;
    try {
      const content = response.choices[0].message.content;
      if (!content || content.trim() === '') {
        throw new Error('Empty AI response');
      }
      anomalyAnalysis = JSON.parse(content);
      
      // Add timestamp if missing
      if (!anomalyAnalysis.last_scan) {
        anomalyAnalysis.last_scan = new Date().toISOString();
      }

      // Validate and sanitize response
      if (!anomalyAnalysis.anomalies) {
        anomalyAnalysis.anomalies = [];
      }

      if (!anomalyAnalysis.summary) {
        anomalyAnalysis.summary = createSummaryFromAnomalies(anomalyAnalysis.anomalies, movements.length);
      }

    } catch (parseError) {
      console.error('Error parsing AI anomaly response:', parseError);
      throw new Error('AI anomaly detection failed - no fallback available');
    }

    res.json(anomalyAnalysis);

  } catch (error) {
    console.error('AI Anomaly Detection Error:', error);
    res.status(500).json({ 
      error: 'AI anomaly detection service temporarily unavailable',
      details: error instanceof Error ? error.message : 'Unknown error',
      message: 'Real AI analysis required - no mock data available'
    });
  }
});

// Helper function to create summary from anomalies
function createSummaryFromAnomalies(anomalies: Anomaly[], totalChecked: number) {
  const highRisk = anomalies.filter(a => a.severity === 'high').length;
  const mediumRisk = anomalies.filter(a => a.severity === 'medium').length;
  const lowRisk = anomalies.filter(a => a.severity === 'low').length;

  return {
    total_checked: totalChecked,
    anomalies_found: anomalies.length,
    high_risk: highRisk,
    medium_risk: mediumRisk,
    low_risk: lowRisk
  };
}

// REMOVED: createFallbackAnomalyDetection function eliminated - only real AI analysis allowed

export default router;