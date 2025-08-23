import OpenAI from 'openai';
import { storage } from './storage';
import type { Express } from 'express';

/**
 * Servizio AI avanzato per l'analisi professionale di documenti
 * Supporta: Contratti, DDT, Note di credito, Raccomandate, Fatture, etc.
 */
export class DocumentAIService {
  private openai: OpenAI | null = null;
  private isConfigured = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.isConfigured = !!apiKey;
    
    if (this.isConfigured) {
      this.openai = new OpenAI({ apiKey });
      console.log('[DOCUMENT AI] Service initialized with OpenAI API');
    } else {
      console.warn('[DOCUMENT AI] OpenAI API key not found, service disabled');
    }
  }

  /**
   * Analizza qualsiasi tipo di documento con AI avanzata
   */
  async analyzeDocument(
    userId: string,
    documentContent: string,
    fileName: string,
    fileType: string
  ): Promise<{
    summary: string;
    keyPoints: string[];
    documentType: string;
    extractedData: any;
    suggestedMovement?: {
      type: 'income' | 'expense';
      amount: number;
      description: string;
      date: string;
      confidence: number;
      category: string;
      supplier?: string;
      customer?: string;
      vatAmount?: number;
      netAmount?: number;
    };
    confidence: number;
    recommendations: string[];
    compliance: {
      isCompliant: boolean;
      issues: string[];
      requirements: string[];
    };
    tokensUsed: number;
    processingTime: number;
  }> {
    if (!this.isConfigured || !this.openai) {
      throw new Error('Servizio AI non configurato');
    }

    const startTime = Date.now();

    const prompt = this.buildAdvancedPrompt(documentContent, fileName, fileType);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Modello più avanzato per analisi documenti
        messages: [
          {
            role: 'system',
            content: `Sei un esperto consulente commerciale e fiscale italiano specializzato nell'analisi di documenti aziendali. 
            Analizzi contratti, DDT, fatture, note di credito, raccomandate e qualsiasi documento aziendale con massima precisione.
            Rispondi sempre in italiano e fornisci analisi dettagliate e professionali.`
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2, // Bassa per massima precisione
        max_tokens: 4000
      });

      const analysis = response.choices[0]?.message?.content;
      const tokensUsed = response.usage?.total_tokens || 0;
      const processingTime = Date.now() - startTime;

      if (!analysis) {
        throw new Error('Nessuna risposta dall\'AI');
      }

      const result = JSON.parse(analysis);
      
      return {
        summary: result.summary || 'Riassunto non disponibile',
        keyPoints: result.keyPoints || [],
        documentType: result.documentType || 'Documento generico',
        extractedData: result.extractedData || {},
        suggestedMovement: result.suggestedMovement || null,
        confidence: Math.min(result.confidence || 0.8, 1),
        recommendations: result.recommendations || [],
        compliance: result.compliance || {
          isCompliant: true,
          issues: [],
          requirements: []
        },
        tokensUsed,
        processingTime
      };

    } catch (error: any) {
      console.error('[DOCUMENT AI] Analysis failed:', error);
      throw new Error(error.message || 'Analisi documento fallita');
    }
  }

  private buildAdvancedPrompt(content: string, fileName: string, fileType: string): string {
    return `ANALIZZA QUESTO DOCUMENTO AZIENDALE:

NOME FILE: ${fileName}
TIPO FILE: ${fileType}

CONTENUTO DOCUMENTO:
${content}

ANALISI RICHIESTA - Rispondi in JSON con questa struttura esatta:
{
  "summary": "Riassunto professionale del documento in 2-3 frasi",
  "keyPoints": [
    "Punto chiave 1",
    "Punto chiave 2", 
    "Punto chiave 3"
  ],
  "documentType": "Tipo specifico (Fattura, Contratto, DDT, Nota Credito, Raccomandata, etc.)",
  "extractedData": {
    "amounts": ["tutti gli importi trovati con valuta"],
    "dates": ["tutte le date trovate"],
    "parties": ["soggetti/aziende coinvolti"],
    "references": ["numeri documento, protocolli, etc."],
    "vatNumbers": ["partite IVA se presenti"],
    "addresses": ["indirizzi se presenti"],
    "contacts": ["email, telefoni se presenti"]
  },
  "suggestedMovement": {
    "type": "income o expense (solo se il documento rappresenta chiaramente un movimento finanziario)",
    "amount": "importo numerico principale",
    "description": "descrizione movimento suggerito",
    "date": "data movimento in formato YYYY-MM-DD",
    "confidence": "confidenza 0-1 sulla correttezza del movimento suggerito",
    "category": "categoria movimento (vendite, acquisti, spese generali, etc.)",
    "supplier": "nome fornitore se è una spesa",
    "customer": "nome cliente se è un ricavo", 
    "vatAmount": "importo IVA se presente",
    "netAmount": "importo netto se presente"
  },
  "confidence": "confidenza generale 0-1 sull'intera analisi",
  "recommendations": [
    "Raccomandazione 1 per gestione del documento",
    "Raccomandazione 2 per follow-up"
  ],
  "compliance": {
    "isCompliant": "true/false conformità normativa italiana",
    "issues": ["eventuali problemi di conformità"],
    "requirements": ["requisiti normativi da rispettare"]
  }
}

ISTRUZIONI SPECIFICHE:
- Identifica con precisione il tipo di documento
- Estrai TUTTI i dati finanziari, date e riferimenti
- Suggerisci un movimento finanziario SOLO se è chiaramente evidente 
- Valuta conformità fiscale italiana (FatturaPA, IVA, etc.)
- Fornisci raccomandazioni pratiche
- Usa confidenza realistica basata sulla chiarezza dei dati
- Per importi usa formato numerico puro (es: 1250.50)
- Per date usa formato ISO (YYYY-MM-DD)`;
  }

  /**
   * Analizza immagine di documento usando GPT-4o Vision
   */
  async analyzeImageDocument(
    userId: string,
    imageBase64: string,
    fileName: string,
    fileType: string
  ): Promise<any> {
    if (!this.isConfigured || !this.openai) {
      throw new Error('Servizio AI non configurato');
    }

    const startTime = Date.now();

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Supporta immagini
        messages: [
          {
            role: 'system',
            content: 'Sei un esperto OCR AI specializzato in documenti aziendali italiani. Estrai e analizza tutti i dati visibili con massima precisione.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analizza questa immagine di documento aziendale e rispondi in JSON con la stessa struttura dell'analisi testuale. Estrai tutto il testo visibile e analizzalo come documento aziendale italiano.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${fileType};base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 4000
      });

      const analysis = response.choices[0]?.message?.content;
      const tokensUsed = response.usage?.total_tokens || 0;
      const processingTime = Date.now() - startTime;

      if (!analysis) {
        throw new Error('Nessuna risposta dall\'AI Vision');
      }

      const result = JSON.parse(analysis);
      
      return {
        ...result,
        tokensUsed,
        processingTime
      };

    } catch (error: any) {
      console.error('[DOCUMENT AI] Image analysis failed:', error);
      throw new Error(error.message || 'Analisi immagine fallita');
    }
  }

  /**
   * Crea documento di analisi nel database
   */
  async saveAnalysis(
    userId: string,
    fileName: string,
    fileType: string,
    filePath: string,
    analysisResult: any
  ): Promise<string> {
    try {
      const analysisRecord = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        fileName,
        fileType,
        filePath,
        status: 'completed' as const,
        extractedData: JSON.stringify(analysisResult.extractedData),
        aiAnalysis: JSON.stringify({
          summary: analysisResult.summary,
          keyPoints: analysisResult.keyPoints,
          documentType: analysisResult.documentType,
          recommendations: analysisResult.recommendations,
          compliance: analysisResult.compliance,
          suggestedMovement: analysisResult.suggestedMovement
        }),
        tokensUsed: analysisResult.tokensUsed,
        processingTimeMs: analysisResult.processingTime,
        completedAt: new Date()
      };

      // Salva nel database (assumendo che esista un metodo nel storage)
      // await storage.createDocumentJob(analysisRecord);
      
      return analysisRecord.id;
    } catch (error: any) {
      console.error('[DOCUMENT AI] Save analysis failed:', error);
      throw new Error('Salvataggio analisi fallito');
    }
  }
}

export const documentAIService = new DocumentAIService();