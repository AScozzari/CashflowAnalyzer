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
            content: `Sei un ESPERTO FISCALE ITALIANO per PMI. Analizzi SOLO documenti finanziari (fatture, DDT, contratti, ricevute).
            
            REGOLE ASSOLUTE:
            - Se documento NON contiene importi/dati finanziari → confidence <0.5 e NO movimento
            - Se documento illeggibile/generico → "Documento non finanziario" 
            - Suggerisci movimento SOLO con importi chiari e certi
            - Risposta sempre in italiano, JSON valido, dati reali
            
            Sei SEVERO: respingi documenti non finanziari.`
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1, // Massima precisione
        max_tokens: 2000
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
    // OTTIMIZZAZIONE: Tronca contenuto per evitare limite token
    const maxLength = 6000; // Ridotto per prompt più specifico
    const truncatedContent = content.length > maxLength 
      ? content.substring(0, maxLength) + "\n[TRONCATO]"
      : content;

    return `ANALISI DOCUMENTO FINANZIARIO ITALIANO

FILE: ${fileName}
CONTENT: ${truncatedContent}

ISTRUZIONI CRITICHE:
1. SE NON È FATTURA/DDT/RICEVUTA/CONTRATTO → documentType: "Documento non finanziario"
2. SE NON HAI IMPORTI CHIARI → suggestedMovement: null
3. CONFIDENCE <0.5 se documento generico/illeggibile
4. ESTRAI SOLO dati realmente visibili

RISPOSTA JSON:
{
  "documentType": "Fattura Elettronica|DDT|Ricevuta|Contratto|Documento non finanziario",
  "summary": "Breve descrizione del documento e contenuto principale",
  "keyPoints": ["Dato importante 1", "Info rilevante 2", "Aspetto chiave 3"],
  "extractedData": {
    "amounts": ["1.250,00", "IVA 275,00"],
    "dates": ["15/01/2024"],
    "parties": ["Fornitore ABC", "Cliente XYZ"],
    "references": ["Fattura n. 123"],
    "vatNumbers": ["IT01234567890"],
    "addresses": ["Via Roma 1"],
    "contacts": ["abc@email.it"]
  },
  "suggestedMovement": SOLO SE DOCUMENTO FINANZIARIO CON IMPORTI {
    "type": "income|expense",
    "amount": 1250.00,
    "description": "Descrizione servizio/prodotto",
    "date": "2024-01-15",
    "confidence": 0.9,
    "category": "Categoria appropriata",
    "supplier": "Nome fornitore",
    "netAmount": 1250.00,
    "vatAmount": 275.00
  },
  "confidence": NUMERO_0_1_BASATO_SU_CHIAREZZA_DOCUMENTO,
  "recommendations": ["Azione da fare", "Verifica necessaria"],
  "compliance": {
    "isCompliant": true,
    "issues": ["Problema trovato"],
    "requirements": ["Norma da rispettare"]
  }
}

REGOLE FERREE:
❌ NON inventare dati
❌ NON suggerire movimento per documenti generici
❌ Confidence <0.5 se documento poco chiaro
✅ Analizza solo documenti finanziari italiani`;
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
   * Salva analisi documento nel database
   */
  async saveAnalysis(
    userId: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    analysisResult: any,
    storage: any
  ): Promise<string> {
    try {
      const analysisRecord = {
        userId,
        fileName,
        fileType,
        fileSize,
        documentType: analysisResult.documentType,
        summary: analysisResult.summary,
        keyPoints: analysisResult.keyPoints,
        extractedData: analysisResult.extractedData,
        suggestedMovement: analysisResult.suggestedMovement,
        confidence: analysisResult.confidence?.toString() || '0.8',
        recommendations: analysisResult.recommendations,
        compliance: analysisResult.compliance,
        tokensUsed: analysisResult.tokensUsed,
        processingTimeMs: analysisResult.processingTime,
        status: 'completed' as const
      };

      const savedAnalysis = await storage.saveDocumentAnalysis(analysisRecord);
      return savedAnalysis.id;
    } catch (error: any) {
      console.error('[DOCUMENT AI] Save analysis failed:', error);
      throw new Error('Salvataggio analisi fallito');
    }
  }
}

export const documentAIService = new DocumentAIService();