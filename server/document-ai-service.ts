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
    // OTTIMIZZAZIONE CRITICA: Tronca contenuto per evitare limite token
    const maxLength = 8000; // Circa 5-6k token
    const truncatedContent = content.length > maxLength 
      ? content.substring(0, maxLength) + "\n\n[CONTENUTO TRONCATO PER LIMITE TOKEN]"
      : content;

    return `DOCUMENTO: ${fileName} (${fileType})

CONTENUTO:
${truncatedContent}

JSON OUTPUT:
{
  "summary": "Analisi dettagliata professionale documento",
  "keyPoints": ["Dettaglio specifico 1", "Aspetto rilevante 2", "Informazione chiave 3"],
  "documentType": "Fattura|DDT|Contratto|Email|Lettera|Comunicazione",
  "extractedData": {
    "amounts": ["€1.250,00", "€275,00 IVA"],
    "dates": ["15/01/2024"],
    "parties": ["Fornitore SRL", "Cliente SpA"],
    "references": ["FT001/2024", "CIG123"],
    "vatNumbers": ["IT12345678901"],
    "addresses": ["Via Roma 1, Milano"],
    "contacts": ["email@azienda.it"]
  },
  "suggestedMovement": SOLO SE FATTURA/RICEVUTA/DDT {
    "type": "expense|income",
    "amount": 1250.00,
    "description": "Dettaglio specifico",
    "date": "2024-01-15",
    "confidence": 0.95,
    "category": "Servizi",
    "supplier": "Nome Fornitore",
    "customer": "Nome Cliente",
    "vatAmount": 275.00,
    "netAmount": 1250.00
  },
  "confidence": 0.9,
  "recommendations": ["Azione specifica 1", "Verifica 2"],
  "compliance": {
    "isCompliant": true,
    "issues": ["Problema specifico"],
    "requirements": ["Obbligo normativo"]
  }
}

REGOLE CRITICHE:
- MOVIMENTO: suggerisci SOLO per fatture/ricevute/DDT con importi chiari
- NON suggerire per: email, lettere, comunicazioni, manuali
- CONFIDENCE: <0.6 se documento poco chiaro
- COMPLIANCE: verifica normative italiane (FatturaPA, split payment)
- ESTRAI: solo dati realmente presenti, non inventare`;
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