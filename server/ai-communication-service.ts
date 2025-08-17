import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY must be set for AI communication features");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface MessageAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high';
  category: 'payment' | 'support' | 'inquiry' | 'complaint' | 'other';
  intent: string;
  entities: { type: string; value: string }[];
  confidence: number;
  suggestedResponse?: string;
  autoResponse?: boolean;
}

export interface AutoResponseConfig {
  enabled: boolean;
  categories: string[];
  confidenceThreshold: number;
  businessContext: string;
  templates: { [key: string]: string };
}

export class AICommunicationService {
  
  /**
   * Analizza un messaggio ricevuto per estrarre sentiment, urgenza, categoria e intent
   */
  async analyzeMessage(
    message: string, 
    channel: 'whatsapp' | 'email' | 'sms' | 'telegram',
    senderInfo?: { name?: string; phone?: string; email?: string }
  ): Promise<MessageAnalysis> {
    try {
      const prompt = `
        Analizza questo messaggio ricevuto via ${channel} e fornisci un'analisi completa:
        
        Messaggio: "${message}"
        ${senderInfo ? `Mittente: ${senderInfo.name || senderInfo.phone || senderInfo.email}` : ''}
        
        Fornisci l'analisi in formato JSON con:
        - sentiment: 'positive', 'neutral', 'negative'
        - urgency: 'low', 'medium', 'high' 
        - category: 'payment', 'support', 'inquiry', 'complaint', 'other'
        - intent: descrizione breve dell'intento del messaggio
        - entities: array di entità estratte (es: [{type: "amount", value: "€150"}, {type: "date", value: "domani"}])
        - confidence: percentuale di confidenza nell'analisi (0-1)
        - autoResponse: true se il messaggio può essere gestito automaticamente
        
        Considera il contesto di un'azienda italiana che gestisce fatturazione e cash flow.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "Sei un assistente AI specializzato nell'analisi di messaggi aziendali per un'azienda italiana. Rispondi sempre in formato JSON valido."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      // Generate suggested response if confidence is high
      if (analysis.confidence > 0.7) {
        analysis.suggestedResponse = await this.generateResponse(message, analysis, channel);
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing message:', error);
      return {
        sentiment: 'neutral',
        urgency: 'medium',
        category: 'other',
        intent: 'Messaggio da analizzare manualmente',
        entities: [],
        confidence: 0.1,
        autoResponse: false
      };
    }
  }

  /**
   * Genera una risposta automatica basata sull'analisi del messaggio
   */
  async generateResponse(
    originalMessage: string,
    analysis: MessageAnalysis,
    channel: 'whatsapp' | 'email' | 'sms' | 'telegram',
    context?: { customerName?: string; businessName?: string }
  ): Promise<string> {
    try {
      const businessName = context?.businessName || "EasyCashFlows";
      const customerName = context?.customerName || "";

      const prompt = `
        Genera una risposta professionale e cordiale per questo messaggio ricevuto via ${channel}:
        
        Messaggio originale: "${originalMessage}"
        Categoria: ${analysis.category}
        Sentiment: ${analysis.sentiment}
        Urgenza: ${analysis.urgency}
        Intent: ${analysis.intent}
        
        Contesto azienda: ${businessName} - software gestionale per PMI italiane, fatturazione elettronica, analisi cash flow
        ${customerName ? `Nome cliente: ${customerName}` : ''}
        
        Genera una risposta che:
        - Sia professionale ma cordiale
        - Riferisca specificamente al contenuto del messaggio
        - Offra assistenza concreta se richiesta
        - Sia appropriata per il canale ${channel}
        - Rispetti il tono italiano formale ma accessibile
        - Sia lunga massimo 160 caratteri per SMS, più lunga per altri canali
        
        Rispondi SOLO con il testo della risposta, senza virgolette o formatting.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system", 
            content: "Sei un assistente virtuale professionale di EasyCashFlows. Rispondi sempre in italiano con tono cordiale e professionale."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: channel === 'sms' ? 160 : 500
      });

      return response.choices[0].message.content?.trim() || "Grazie per il messaggio. Ti risponderemo al più presto.";
    } catch (error) {
      console.error('Error generating response:', error);
      return "Grazie per il messaggio. Ti risponderemo al più presto.";
    }
  }

  /**
   * Analizza un insieme di messaggi per estrarre insights di business
   */
  async analyzeConversationInsights(
    messages: Array<{
      content: string;
      timestamp: string;
      isOutgoing: boolean;
      channel: string;
    }>
  ): Promise<{
    overallSentiment: 'positive' | 'neutral' | 'negative';
    customerSatisfaction: number;
    keyTopics: string[];
    actionItems: string[];
    riskLevel: 'low' | 'medium' | 'high';
    summary: string;
  }> {
    try {
      const conversation = messages
        .map(m => `[${m.timestamp}] ${m.isOutgoing ? 'Noi' : 'Cliente'}: ${m.content}`)
        .join('\n');

      const prompt = `
        Analizza questa conversazione e fornisci insights di business:
        
        ${conversation}
        
        Fornisci l'analisi in formato JSON con:
        - overallSentiment: sentiment generale della conversazione
        - customerSatisfaction: punteggio 0-10 di soddisfazione cliente
        - keyTopics: array dei 3-5 topic principali discussi
        - actionItems: array di azioni da intraprendere
        - riskLevel: livello di rischio di perdita cliente
        - summary: riassunto della conversazione in 2-3 frasi
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "Sei un analista di customer experience per un'azienda italiana. Analizza le conversazioni per fornire insights utili."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      return {
        overallSentiment: 'neutral',
        customerSatisfaction: 5,
        keyTopics: [],
        actionItems: [],
        riskLevel: 'low',
        summary: 'Analisi non disponibile'
      };
    }
  }

  /**
   * Suggerisce template personalizzati basati sui messaggi ricevuti
   */
  async suggestTemplates(
    messageHistory: string[],
    channel: 'whatsapp' | 'email' | 'sms' | 'telegram'
  ): Promise<Array<{
    name: string;
    content: string;
    category: string;
    variables: string[];
    useCase: string;
  }>> {
    try {
      const prompt = `
        Basandoti sui messaggi ricevuti, suggerisci 3-5 template utili per ${channel}:
        
        Messaggi campione:
        ${messageHistory.slice(0, 10).join('\n- ')}
        
        Genera template che:
        - Rispondano ai casi d'uso più comuni
        - Includano variabili dinamiche con {{}}
        - Siano ottimizzati per il canale ${channel}
        - Rispettino il tono professionale italiano
        
        Formato JSON con array di oggetti:
        {
          "templates": [
            {
              "name": "Nome template",
              "content": "Testo con {{variabile}}",
              "category": "categoria",
              "variables": ["variabile1", "variabile2"],
              "useCase": "Quando usare questo template"
            }
          ]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "Sei un esperto di comunicazione aziendale che crea template professionali per PMI italiane."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6
      });

      const result = JSON.parse(response.choices[0].message.content || '{"templates": []}');
      return result.templates || [];
    } catch (error) {
      console.error('Error suggesting templates:', error);
      return [];
    }
  }
}

export const aiCommunicationService = new AICommunicationService();