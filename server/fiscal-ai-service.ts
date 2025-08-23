import OpenAI from 'openai';
import { storage } from './storage';

/**
 * Servizio AI specializzato per consulenza fiscale italiana
 * Con knowledge base aggiornata alle normative 2025
 */
export class FiscalAIService {
  private openai: OpenAI | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeOpenAI();
  }

  private async initializeOpenAI() {
    try {
      // Usa le impostazioni AI dell'admin per il servizio fiscale
      const settings = await storage.getAiSettings('admin');
      if (settings?.openaiApiKey) {
        this.openai = new OpenAI({ apiKey: settings.openaiApiKey });
        this.isConfigured = true;
        console.log('[FISCAL AI] Initialized with OpenAI API');
      }
    } catch (error) {
      console.warn('[FISCAL AI] OpenAI not configured, service disabled');
    }
  }

  /**
   * Knowledge Base delle Normative Fiscali Italiane 2025
   */
  private getFiscalKnowledgeBase(): string {
    return `
# KNOWLEDGE BASE FISCALE ITALIANA 2025

## RIFORMA IRPEF 2025
- **Nuovi scaglioni**: 23% (0-28.000€), 35% (28-50.000€), 43% (oltre 50.000€)
- **Riduzione aliquota premi produttività**: dal 10% al 5%
- **Detrazioni lavoro dipendente**: maggiorate per redditi fino 28.000€

## IRES PREMIALE 2025
- **Riduzione 4 punti** (dal 24% al 20%) per investimenti
- **Requisiti**: 80% utili accantonati, 30% per beni strumentali nuovi
- **Beneficio**: solo su investimenti in beni strumentali o crescita organico

## CLASSIFICAZIONE PMI 2025
- **Micro**: <10 occupati, fatturato/bilancio ≤2M€
- **Piccole**: <50 occupati, fatturato/bilancio ≤10M€ 
- **Medie**: <250 occupati, fatturato ≤50M€ o bilancio ≤43M€

## AGEVOLAZIONI PMI 2025
- **Startup innovative**: Detrazione IRPEF 40% investimenti
- **Credito Imposta Transizione 5.0**: confermato 2025
- **ZES**: proroga credito d'imposta
- **Fondo Garanzia PMI**: accesso gratuito
- **Nuova Sabatini**: finanziamenti agevolati

## SCADENZE FISCALI 2025
- **16/01**: IVA dicembre 2024
- **28/02**: Comunicazione dati fatture (Lipe)
- **31/03**: Assicurazione calamità naturali
- **30/04**: Dichiarazione IVA annuale
- **30/09**: Dichiarazione redditi
- **16/12**: Saldo imposte sui redditi

## DEDUZIONI E DETRAZIONI
- **Spese rappresentanza**: deducibili entro limiti
- **Formazione 4.0**: credito imposta 50%
- **Investimenti Sud**: varie aliquote
- **Ricerca sviluppo**: credito imposta fino 20%
- **Beni strumentali**: super/iper ammortamento

## COMPLIANCE OBBLIGATORIA
- **Fatturazione elettronica**: sempre obbligatoria
- **Pagamenti tracciabili**: per deducibilità spese
- **Conservazione digitale**: obbligatoria
- **Controlli automatizzati**: AdE sempre più avanzati

## RISCHI E SANZIONI
- **Omessa fatturazione**: 90-180% imposta
- **Ritardati versamenti**: 30% + interessi
- **Errori dichiarazione**: 120-240% maggiore imposta
- **Mancata conservazione**: €258-€2.065
`;
  }

  /**
   * Ottieni consigli fiscali veloci basati su una domanda
   */
  async getFiscalAdvice(
    userId: string,
    question: string
  ): Promise<{
    answer: string;
    suggestions: Array<{
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      impact: string;
      actionRequired: string;
    }>;
    references: string[];
    confidence: number;
  }> {
    if (!this.isConfigured) {
      throw new Error('Servizio AI non configurato');
    }

    try {
      // Ottieni context finanziario dell'utente
      const movements = await storage.getMovements();
      const userMovements = movements.filter((m: any) => m.userId === userId);
      const financialContext = this.prepareFiscalContext(userMovements);
      const knowledgeBase = this.getFiscalKnowledgeBase();

      const prompt = `DOMANDA FISCALE: ${question}

SITUAZIONE FINANZIARIA:
${financialContext}

NORMATIVE 2025:
${knowledgeBase}

Fornisci risposta professionale in JSON:
{
  "answer": "Risposta completa e professionale",
  "suggestions": [
    {
      "title": "Azione consigliata",
      "description": "Dettagli specifici",
      "priority": "high",
      "impact": "€500 risparmio",
      "actionRequired": "Cosa fare concretamente"
    }
  ],
  "references": ["Art. 109 TUIR", "Circolare AdE"],
  "confidence": 0.95
}`;

      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Sei un commercialista esperto specializzato in PMI italiane. Rispondi in modo professionale e preciso.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return result;

    } catch (error: any) {
      console.error('[FISCAL AI] Errore nel consiglio:', error);
      throw new Error(`Errore nel consiglio fiscale: ${error.message}`);
    }
  }

  /**
   * Analizza la situazione fiscale dell'utente
   */
  async analyzeFiscalSituation(userId: string): Promise<{
    summary: string;
    optimizations: Array<{
      type: string;
      description: string;
      potentialSaving: number;
      requirements: string[];
    }>;
    deadlines: Array<{
      date: string;
      description: string;
      amount?: number;
    }>;
    riskLevel: 'low' | 'medium' | 'high';
    compliance: 'compliant' | 'warning' | 'critical';
  }> {
    if (!this.isConfigured) {
      throw new Error('Servizio AI non configurato');
    }

    try {
      const movements = await storage.getMovements();
      const userMovements = movements.filter((m: any) => m.userId === userId);
      const financialContext = this.prepareFiscalContext(userMovements);
      const knowledgeBase = this.getFiscalKnowledgeBase();

      const prompt = `Analizza situazione fiscale PMI italiana:

${financialContext}

NORMATIVE 2025:
${knowledgeBase}

Fornisci analisi completa in JSON:
{
  "summary": "Riassunto situazione fiscale",
  "optimizations": [
    {
      "type": "IRES Premiale",
      "description": "Spiegazione",
      "potentialSaving": 1500,
      "requirements": ["Requisito 1", "Requisito 2"]
    }
  ],
  "deadlines": [
    {
      "date": "2025-01-16",
      "description": "IVA dicembre 2024",
      "amount": 1200
    }
  ],
  "riskLevel": "low",
  "compliance": "compliant"
}`;

      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Sei un commercialista senior specializzato in PMI italiane. Fornisci analisi professionali.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 3000
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return analysis;

    } catch (error: any) {
      console.error('[FISCAL AI] Errore nell\'analisi:', error);
      throw new Error(`Errore nell'analisi fiscale: ${error.message}`);
    }
  }

  /**
   * Prepara il context finanziario per l'AI
   */
  private prepareFiscalContext(movements: any[]): string {
    const currentYear = new Date().getFullYear();
    
    const totalIncome = movements
      .filter((m: any) => m.type === 'income')
      .reduce((sum: number, m: any) => sum + parseFloat(m.amount || '0'), 0);
      
    const totalExpenses = movements
      .filter((m: any) => m.type === 'expense')
      .reduce((sum: number, m: any) => sum + parseFloat(m.amount || '0'), 0);

    const margin = totalIncome - totalExpenses;

    return `
SITUAZIONE FINANZIARIA ${currentYear}:
- Ricavi totali: €${totalIncome.toLocaleString('it-IT')}
- Costi totali: €${totalExpenses.toLocaleString('it-IT')}
- Margine operativo: €${margin.toLocaleString('it-IT')}
- Numero movimenti: ${movements.length}

ANDAMENTO:
- Media mensile ricavi: €${Math.round(totalIncome / 12).toLocaleString('it-IT')}
- Media mensile costi: €${Math.round(totalExpenses / 12).toLocaleString('it-IT')}
- Trend: ${margin > 0 ? 'Positivo' : 'Da ottimizzare'}
`;
  }
}

export const fiscalAIService = new FiscalAIService();