import OpenAI from 'openai';
import { storage } from './storage';
import type { AiSettings, InsertAiChatHistory } from '@shared/schema';

export class AIService {
  private openai!: OpenAI;
  private isConfigured: boolean = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.isConfigured = true;
    } else {
      console.warn('[AI] OpenAI API key not found in environment variables');
    }
  }

  async testConnection(): Promise<{ success: boolean; model?: string; error?: string }> {
    if (!this.isConfigured) {
      return { success: false, error: 'OpenAI API key not configured' };
    }

    try {
      // First try to list models (lightweight test)
      const models = await this.openai.models.list();
      console.log(`[AI] Available models: ${models.data.length} found`);
      
      // Then try a minimal completion test
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 3,
        temperature: 0,
      });

      return { 
        success: true, 
        model: response.model,
      };
    } catch (error: any) {
      console.error('[AI] Connection test failed:', error);
      
      // Provide more specific error information
      let errorMessage = error.message || 'Connection test failed';
      if (error.status === 429) {
        errorMessage = `Quota exceeded (${error.status}). Check billing at https://platform.openai.com/account/billing`;
      } else if (error.status === 401) {
        errorMessage = `Invalid API key (${error.status}). Check key at https://platform.openai.com/api-keys`;
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  async chatCompletion(
    userId: string,
    message: string,
    sessionId: string,
    context?: any,
    model?: string
  ): Promise<{ response: string; tokensUsed: number }> {
    if (!this.isConfigured) {
      throw new Error('OpenAI API key not configured');
    }

    // Get user AI settings
    const aiSettings = await storage.getAiSettings(userId);
    if (!aiSettings?.chatEnabled) {
      throw new Error('Chat AI is disabled for this user');
    }

    // Get financial data for context (with privacy filtering)
    const financialContext = await this.getFinancialContext(userId, aiSettings, message);

    // Build conversation context
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: this.buildSystemPrompt(aiSettings, { ...context, financialData: financialContext }),
      },
    ];

    // Add conversation history
    const chatHistory = await storage.getAiChatHistory(userId, sessionId);
    const recentHistory = chatHistory.slice(0, 10); // Last 10 messages
    
    recentHistory.reverse().forEach(msg => {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    });

    // Add current message
    messages.push({ role: 'user', content: message });

    try {
      // Use provided model or fall back to settings default
      const selectedModel = model || aiSettings.defaultModel || 'gpt-4o';
      
      const response = await this.openai.chat.completions.create({
        model: selectedModel,
        messages,
        max_tokens: aiSettings.maxTokens || 2000,
        temperature: Number(aiSettings.temperature) || 0.7,
      });

      const assistantMessage = response.choices[0]?.message?.content || 'No response';
      const tokensUsed = response.usage?.total_tokens || 0;

      // Save messages to history
      await storage.createAiChatMessage({
        userId,
        sessionId,
        role: 'user',
        content: message,
        metadata: JSON.stringify({ tokensUsed: response.usage?.prompt_tokens || 0 }),
      });

      await storage.createAiChatMessage({
        userId,
        sessionId,
        role: 'assistant',
        content: assistantMessage,
        metadata: JSON.stringify({ 
          tokensUsed: response.usage?.completion_tokens || 0,
          model: response.model,
        }),
      });

      return { response: assistantMessage, tokensUsed };
    } catch (error: any) {
      console.error('[AI] Chat completion failed:', error);
      throw new Error(error.message || 'Chat completion failed');
    }
  }

  private buildSystemPrompt(aiSettings: AiSettings, context?: any): string {
    let prompt = `You are an AI assistant specialized in financial management for Italian small and medium enterprises (SMEs). 

You help with:
- Cash flow analysis and predictions
- Financial data interpretation
- Italian tax and accounting compliance (especially FatturaPA)
- Business insights and recommendations
- Document analysis and data extraction

Guidelines:
- Always respond in Italian unless asked otherwise
- Be precise and professional in financial contexts
- Provide actionable insights when possible
- Reference Italian business regulations when relevant
- If you're uncertain about specific tax/legal matters, recommend consulting a professional

Privacy Mode: ${aiSettings.privacyMode}`;

    if (aiSettings.privacyMode === 'strict') {
      prompt += `
- IMPORTANT: All financial data has been anonymized. Do not attempt to identify specific companies or individuals.
- Focus on patterns and general analysis rather than specific details.`;
    }

    if (context?.financialData) {
      prompt += `\n\nDati Finanziari Disponibili:`;
      
      if (context.financialData.analytics) {
        prompt += `\n- Entrate Totali: €${context.financialData.analytics.totalIncome || 0}`;
        prompt += `\n- Uscite Totali: €${context.financialData.analytics.totalExpenses || 0}`;
        prompt += `\n- Saldo Netto: €${context.financialData.analytics.netBalance || 0}`;
        prompt += `\n- Totale Movimenti: ${context.financialData.analytics.totalMovements || 0}`;
        if (context.financialData.analytics.pendingMovements !== undefined) {
          prompt += `\n- Movimenti Pendenti: ${context.financialData.analytics.pendingMovements}`;
        }
      }
      
      if (context.financialData.recentMovements && context.financialData.recentMovements?.length > 0) {
        prompt += `\n\nMovimenti Recenti (ultimi ${context.financialData.recentMovements.length}):`;
        context.financialData.recentMovements.forEach((mov: any, idx: number) => {
          prompt += `\n${idx + 1}. ${mov.type === 'income' ? 'Entrata' : 'Uscita'}: €${mov.amount} - ${mov.description} (${mov.insertDate})`;
        });
      }
      
      if (context.financialData.companies && context.financialData.companies?.length > 0) {
        prompt += `\n\nAziende Principali:`;
        context.financialData.companies.forEach((comp: any, idx: number) => {
          prompt += `\n${idx + 1}. ${comp.name} (${comp.legalForm}) - ${comp.city}`;
        });
      }
      
      prompt += `\n\nData Corrente: ${context.financialData.currentDate}`;
      prompt += `\n\nNOTA: Usa questi dati per fornire analisi specifiche e actionable. Puoi fare riferimenti diretti ai numeri e trend che vedi.`;
    }

    return prompt;
  }

  private async getFinancialContext(userId: string, aiSettings: AiSettings, userMessage: string): Promise<any> {
    try {
      // Analyze user query to determine what data is needed
      const queryType = this.analyzeQueryType(userMessage.toLowerCase());
      
      const context: any = {};

      // Always get basic stats for context
      if (queryType.includes('general') || queryType.includes('analytics') || queryType.includes('summary')) {
        try {
          const analytics = await storage.getMovementStats();
          context.analytics = analytics;
        } catch (error) {
          console.warn('[AI] Could not fetch analytics data:', error);
        }
      }

      // Get recent movements if requested
      if (queryType.includes('movements') || queryType.includes('recent') || queryType.includes('transazioni')) {
        try {
          const movements = await storage.getMovements({});
          const recentMovements = movements.slice(0, 10).map((m: any) => ({
            type: m.type,
            amount: m.amount,
            description: m.description,
            insertDate: m.insertDate,
            company: aiSettings.privacyMode === 'strict' ? '[ANONIMO]' : m.company?.name,
            status: m.status?.name
          }));
          context.recentMovements = recentMovements;
        } catch (error) {
          console.warn('[AI] Could not fetch movements data:', error);
        }
      }

      // Get companies data if requested  
      if (queryType.includes('companies') || queryType.includes('aziende') || queryType.includes('clienti')) {
        try {
          const companies = await storage.getCompanies();
          context.companies = companies.slice(0, 5).map(c => ({
            name: aiSettings.privacyMode === 'strict' ? '[ANONIMO]' : c.name,
            legalForm: c.legalForm,
            city: aiSettings.privacyMode === 'strict' ? '[CITTÀ]' : c.city
          }));
        } catch (error) {
          console.warn('[AI] Could not fetch companies data:', error);
        }
      }

      // Add current date context
      context.currentDate = new Date().toISOString().split('T')[0];
      context.privacyMode = aiSettings.privacyMode;

      return context;
    } catch (error) {
      console.error('[AI] Error building financial context:', error);
      return { error: 'Could not access financial data', currentDate: new Date().toISOString().split('T')[0] };
    }
  }

  private analyzeQueryType(message: string): string[] {
    const types: string[] = [];
    
    // General queries
    if (message.includes('riassunto') || message.includes('overview') || message.includes('situazione') || 
        message.includes('generale') || message.includes('stato')) {
      types.push('general', 'analytics');
    }
    
    // Movements/transactions queries
    if (message.includes('movimenti') || message.includes('transazioni') || message.includes('ultimi') ||
        message.includes('recenti') || message.includes('entrate') || message.includes('uscite')) {
      types.push('movements', 'recent');
    }
    
    // Analytics queries
    if (message.includes('analisi') || message.includes('trend') || message.includes('performance') ||
        message.includes('crescita') || message.includes('andamento') || message.includes('previsioni')) {
      types.push('analytics');
    }
    
    // Companies queries
    if (message.includes('aziende') || message.includes('clienti') || message.includes('fornitori') ||
        message.includes('companies') || message.includes('business')) {
      types.push('companies');
    }

    // If no specific type detected, assume general query
    if (types.length === 0) {
      types.push('general');
    }
    
    return types;
  }

  async analyzeDocument(
    userId: string,
    documentContent: string,
    fileType: string
  ): Promise<{ analysis: string; extractedData: any; tokensUsed: number }> {
    if (!this.isConfigured) {
      throw new Error('OpenAI API key not configured');
    }

    const aiSettings = await storage.getAiSettings(userId);
    if (!aiSettings?.documentProcessingEnabled) {
      throw new Error('Document processing is disabled for this user');
    }

    const prompt = `Analyze this ${fileType} document and extract financial information. 
Focus on:
- Invoice details (amounts, dates, VAT, suppliers/customers)
- Payment terms
- Banking information
- Any compliance issues with Italian regulations

Document content:
${documentContent}

Please provide:
1. A structured analysis in Italian
2. Extracted key data in JSON format
3. Any recommendations or flags`;

    try {
      const response = await this.openai.chat.completions.create({
        model: aiSettings.defaultModel || 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: aiSettings.maxTokens || 2000,
        temperature: 0.3, // Lower temperature for document analysis
      });

      const analysis = response.choices[0]?.message?.content || 'No analysis available';
      const tokensUsed = response.usage?.total_tokens || 0;

      // Try to extract JSON data from response
      let extractedData = {};
      try {
        const jsonMatch = analysis.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[1]);
        }
      } catch (e) {
        console.warn('[AI] Could not extract JSON from document analysis');
      }

      return { analysis, extractedData, tokensUsed };
    } catch (error: any) {
      console.error('[AI] Document analysis failed:', error);
      throw new Error(error.message || 'Document analysis failed');
    }
  }

  async extractMovementData(
    userId: string,
    documentContent: string,
    fileType: string,
    analysisType: 'movement_extraction' = 'movement_extraction',
    model?: string
  ): Promise<{ extractedData: any; processingNotes: string[]; tokensUsed: number }> {
    if (!this.isConfigured) {
      throw new Error('OpenAI API key not configured');
    }

    const aiSettings = await storage.getAiSettings(userId);
    if (!aiSettings?.documentProcessingEnabled) {
      throw new Error('Document processing is disabled for this user');
    }

    // Get existing suppliers and customers for matching
    let suppliers: any[] = [];
    let customers: any[] = [];
    try {
      suppliers = await storage.getSuppliers();
      customers = await storage.getCustomers();
    } catch (error) {
      console.warn('[AI] Could not fetch suppliers/customers for matching:', error);
    }

    const suppliersInfo = suppliers.slice(0, 10).map(s => ({
      name: s.name,
      vatNumber: s.vatNumber,
      email: s.email
    }));

    const customersInfo = customers.slice(0, 10).map(c => ({
      name: c.name,
      vatNumber: c.vatNumber,
      email: c.email
    }));

    const prompt = `Analizza questo documento ${fileType} ed estrai SOLO i dati finanziari utili per creare un movimento contabile. Rispondi esclusivamente in JSON valido.

DOCUMENTO DA ANALIZZARE:
${documentContent}

FORNITORI ESISTENTI NEL SISTEMA (per il matching):
${JSON.stringify(suppliersInfo, null, 2)}

CLIENTI ESISTENTI NEL SISTEMA (per il matching):
${JSON.stringify(customersInfo, null, 2)}

INSTRUZIONI:
1. Identifica automaticamente se è un ENTRATA (income) o USCITA (expense)
2. Estrai l'importo totale (con IVA inclusa se presente)
3. Trova data del documento o transazione
4. Identifica fornitore/cliente e fai matching con quelli esistenti
5. Estrai numero documento se presente
6. Calcola importo IVA se specificato
7. Estrai descrizione/causale

Rispondi SOLO con questo JSON (senza markdown):
{
  "movementType": "income" | "expense",
  "confidence": 0.0-1.0,
  "amount": "123.45",
  "date": "YYYY-MM-DD",
  "description": "Descrizione del movimento",
  "documentNumber": "numero documento se presente",
  "vatAmount": "importo IVA se specificato",
  "netAmount": "importo netto senza IVA",
  "vatRate": "22%" | "10%" | "4%" | "0%",
  "supplierInfo": {
    "name": "Nome fornitore se identificato",
    "vatNumber": "P.IVA se presente", 
    "matchingId": "ID se corrisponde a fornitore esistente"
  },
  "customerInfo": {
    "name": "Nome cliente se identificato",
    "vatNumber": "P.IVA se presente",
    "matchingId": "ID se corrisponde a cliente esistente"
  },
  "processingNotes": ["nota1", "nota2"]
}

IMPORTANTE: Se non riesci a determinare un campo, omettilo dal JSON. Mantieni alta precisione e confidenza per i dati estratti.`;

    try {
      // Use provided model or default to best model for extraction
      const selectedModel = model || aiSettings.defaultModel || 'gpt-4o';
      
      const response = await this.openai.chat.completions.create({
        model: selectedModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.1, // Very low temperature for precise extraction
        response_format: { type: "json_object" }
      });

      const tokensUsed = response.usage?.total_tokens || 0;
      let extractedData = {};
      let processingNotes: string[] = [];

      try {
        const content = response.choices[0]?.message?.content || '{}';
        extractedData = JSON.parse(content);
        processingNotes = (extractedData as any).processingNotes || [];
        
        // Clean up the response
        delete (extractedData as any).processingNotes;
        
        console.log('[AI] Movement extraction successful:', extractedData);
      } catch (e) {
        console.error('[AI] Failed to parse movement extraction JSON:', e);
        throw new Error('Impossibile interpretare la risposta AI. Documento non riconosciuto.');
      }

      return { extractedData, processingNotes, tokensUsed };
    } catch (error: any) {
      console.error('[AI] Movement extraction failed:', error);
      throw new Error(error.message || 'Estrazione dati movimento fallita');
    }
  }

  async generateFinancialInsights(
    userId: string,
    financialData: any
  ): Promise<{ insights: string; tokensUsed: number }> {
    if (!this.isConfigured) {
      throw new Error('OpenAI API key not configured');
    }

    const aiSettings = await storage.getAiSettings(userId);
    if (!aiSettings?.analyticsEnabled) {
      throw new Error('Analytics is disabled for this user');
    }

    const prompt = `Analyze this financial data and provide insights for an Italian SME:

${JSON.stringify(financialData, null, 2)}

Please provide:
1. Key financial trends and patterns
2. Cash flow observations
3. Potential risks or opportunities
4. Actionable recommendations
5. Compliance considerations for Italian businesses

Respond in Italian and be specific and actionable.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: aiSettings.defaultModel || 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: aiSettings.maxTokens || 2000,
        temperature: Number(aiSettings.temperature) || 0.7,
      });

      const insights = response.choices[0]?.message?.content || 'No insights available';
      const tokensUsed = response.usage?.total_tokens || 0;

      return { insights, tokensUsed };
    } catch (error: any) {
      console.error('[AI] Financial insights generation failed:', error);
      throw new Error(error.message || 'Financial insights generation failed');
    }
  }
  // New enhanced AI methods for comprehensive functionality
  async executeNaturalLanguageQuery(
    userId: string,
    query: string,
    options?: { maxResults?: number; includeMetadata?: boolean }
  ): Promise<{
    id: string;
    query: string;
    sqlQuery: string;
    results: any[];
    executionTime: number;
    resultCount: number;
    confidence: number;
    suggestions: string[];
    createdAt: string;
  }> {
    if (!this.isConfigured) {
      throw new Error('OpenAI API key not configured');
    }

    const startTime = Date.now();
    const aiSettings = await storage.getAiSettings(userId);

    try {
      // Get database schema for context
      const schemaInfo = this.getDatabaseSchema();
      
      const prompt = `Converti questa domanda in linguaggio naturale in una query SQL per il database finanziario:

Domanda: "${query}"

Schema del database:
${schemaInfo}

Regole:
1. Usa SOLO tabelle e colonne esistenti nello schema
2. Limita risultati a ${options?.maxResults || 100}
3. Usa filtri appropriati per userId = '${userId}'
4. Ottimizza per performance
5. Gestisci date in formato italiano

Rispondi in JSON:
{
  "sqlQuery": "SELECT ... FROM ... WHERE ...",
  "confidence": 0.9,
  "explanation": "spiegazione della query",
  "suggestions": ["suggerimento1", "suggerimento2"]
}`;

      const response = await this.openai.chat.completions.create({
        model: aiSettings?.defaultModel || 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'Sei un esperto SQL per database PostgreSQL di sistemi finanziari italiani. Genera query sicure e ottimizzate.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: aiSettings?.maxTokens || 1000,
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const sqlQuery = result.sqlQuery || '';
      
      if (!sqlQuery) {
        throw new Error('Impossibile generare query SQL dalla domanda');
      }

      // For now, return mock data since we need storage.executeRawQuery implementation
      const mockResults = [
        { id: 1, descrizione: "Esempio movimento", importo: 1000, dataOperazione: "2025-01-15" },
        { id: 2, descrizione: "Altro movimento", importo: -500, dataOperazione: "2025-01-10" }
      ];

      const executionTime = Date.now() - startTime;

      return {
        id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        query,
        sqlQuery,
        results: mockResults,
        executionTime,
        resultCount: mockResults.length,
        confidence: result.confidence || 0.8,
        suggestions: result.suggestions || [],
        createdAt: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('[AI] Error executing natural language query:', error);
      throw new Error(`Errore nell'esecuzione della query: ${error.message}`);
    }
  }

  async generateChart(
    userId: string,
    query: string,
    options?: { 
      chartType?: string; 
      dataSource?: string; 
      includeInsights?: boolean 
    }
  ): Promise<{
    id: string;
    title: string;
    type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    data: any[];
    config: {
      xKey: string;
      yKeys: string[];
      colors: string[];
    };
    description: string;
    insights: string[];
    confidence: number;
    createdAt: string;
  }> {
    if (!this.isConfigured) {
      throw new Error('OpenAI API key not configured');
    }

    const aiSettings = await storage.getAiSettings(userId);

    try {
      // Generate mock data for chart based on query analysis
      const mockData = this.generateMockChartData(query);

      // Generate chart configuration using AI
      const prompt = `Genera una configurazione grafico per questi dati finanziari:

Query originale: "${query}"
Tipo richiesto: ${options?.chartType || 'automatico'}

Dati disponibili:
${JSON.stringify(mockData.slice(0, 3), null, 2)}

Genera configurazione in JSON:
{
  "title": "Titolo del grafico",
  "type": "line|bar|pie|area|scatter",
  "description": "Descrizione del grafico",
  "config": {
    "xKey": "chiave per asse X",
    "yKeys": ["chiave1", "chiave2"],
    "colors": ["#3b82f6", "#ef4444"]
  },
  "insights": ["insight1", "insight2", "insight3"],
  "confidence": 0.9
}`;

      const response = await this.openai.chat.completions.create({
        model: aiSettings?.defaultModel || 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'Sei un esperto in data visualization per dashboard finanziari. Crea configurazioni ottimali per Chart.js.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: aiSettings?.maxTokens || 1000,
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      const config = JSON.parse(response.choices[0].message.content || '{}');

      return {
        id: `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: config.title || 'Grafico Generato AI',
        type: config.type || 'bar',
        data: mockData,
        config: {
          xKey: config.config?.xKey || Object.keys(mockData[0])[0],
          yKeys: config.config?.yKeys || [Object.keys(mockData[0])[1]],
          colors: config.config?.colors || ['#3b82f6', '#ef4444', '#10b981']
        },
        description: config.description || 'Grafico generato automaticamente dall\'AI',
        insights: config.insights || [],
        confidence: config.confidence || 0.8,
        createdAt: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('[AI] Error generating chart:', error);
      throw new Error(`Errore nella generazione del grafico: ${error.message}`);
    }
  }

  private generateMockChartData(query: string): any[] {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('entrate') || lowerQuery.includes('ricavi')) {
      return [
        { periodo: 'Gen 2025', entrate: 15000, uscite: 8000 },
        { periodo: 'Feb 2025', entrate: 18000, uscite: 9500 },
        { periodo: 'Mar 2025', entrate: 22000, uscite: 11000 },
        { periodo: 'Apr 2025', entrate: 19000, uscite: 10200 },
        { periodo: 'Mag 2025', entrate: 25000, uscite: 12500 }
      ];
    }
    
    if (lowerQuery.includes('categoria') || lowerQuery.includes('ripartizione')) {
      return [
        { categoria: 'Consulenze', valore: 35000, percentuale: 40 },
        { categoria: 'Prodotti', valore: 28000, percentuale: 32 },
        { categoria: 'Servizi', valore: 15000, percentuale: 17 },
        { categoria: 'Altri', valore: 9500, percentuale: 11 }
      ];
    }
    
    // Default financial trend data
    return [
      { mese: 'Gennaio', importo: 12500, numero: 45 },
      { mese: 'Febbraio', importo: 15800, numero: 52 },
      { mese: 'Marzo', importo: 18200, numero: 61 },
      { mese: 'Aprile', importo: 14600, numero: 48 },
      { mese: 'Maggio', importo: 21300, numero: 67 }
    ];
  }

  private getDatabaseSchema(): string {
    return `
    Tabelle principali:
    
    movements (movimenti finanziari):
    - id, userId, dataOperazione, importo, descrizione, categoria
    - iban, coreBusiness, verificato, createdAt
    
    companies (aziende):
    - id, nome, tipologia, codiceFiscale, partitaIva
    - indirizzo, telefono, email, createdAt
    
    users (utenti):
    - id, username, email, role (admin|finance|user)
    - createdAt, lastLoginAt
    
    ibans (conti bancari):
    - id, iban, nome, banca, saldo, tipo
    - createdAt, isActive
    
    Note: Tutti i filtri devono includere userId per sicurezza.
    `;
  }

  // WhatsApp AI Communication Methods
  async analyzeMessage(params: {
    content: string;
    channel: string;
    sender?: string;
  }): Promise<{
    sentiment: string;
    urgency: string;
    category: string;
    suggestedResponse?: string;
    confidence: number;
  }> {
    if (!this.isConfigured) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const prompt = `Analizza questo messaggio WhatsApp e fornisci informazioni strutturate:

Messaggio: "${params.content}"
Canale: ${params.channel}
${params.sender ? `Mittente: ${params.sender}` : ''}

Fornisci la tua analisi in formato JSON con i seguenti campi:
{
  "sentiment": "positivo|neutro|negativo",
  "urgency": "bassa|media|alta",
  "category": "informazione|richiesta|reclamo|vendita|supporto|altro",
  "suggestedResponse": "breve risposta suggerita (opzionale)",
  "confidence": 0.85
}

Considera il contesto business italiano e le comunicazioni WhatsApp aziendali.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Sei un assistente AI specializzato nell\'analisi di messaggi WhatsApp Business per aziende italiane. Rispondi sempre in formato JSON valido.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        sentiment: analysis.sentiment || 'neutro',
        urgency: analysis.urgency || 'media',
        category: analysis.category || 'altro',
        suggestedResponse: analysis.suggestedResponse,
        confidence: analysis.confidence || 0.7
      };
    } catch (error: any) {
      console.error('[AI] Error analyzing message:', error);
      throw new Error(`Errore nell'analisi del messaggio: ${error.message}`);
    }
  }

  async generateResponse(params: {
    originalMessage: string;
    channel: string;
    context?: any;
  }): Promise<{
    response: string;
    tone: string;
    confidence: number;
    alternatives?: string[];
  }> {
    if (!this.isConfigured) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const prompt = `Genera una risposta professionale per questo messaggio WhatsApp Business:

Messaggio originale: "${params.originalMessage}"
Canale: ${params.channel}
${params.context ? `Contesto: ${JSON.stringify(params.context)}` : ''}

Linee guida per la risposta:
- Tono professionale ma cordiale
- Linguaggio italiano aziendale appropriato
- Risposta concisa e utile
- Considera che è un canale WhatsApp Business

Fornisci la risposta in formato JSON:
{
  "response": "tua risposta principale",
  "tone": "professionale|cordiale|formale",
  "confidence": 0.85,
  "alternatives": ["risposta alternativa 1", "risposta alternativa 2"]
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Sei un assistente AI per il customer service WhatsApp Business di aziende italiane. Genera sempre risposte professionali e appropriate al contesto aziendale.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.4,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        response: result.response || 'Grazie per il suo messaggio. La ricontatteremo presto.',
        tone: result.tone || 'professionale',
        confidence: result.confidence || 0.7,
        alternatives: result.alternatives || []
      };
    } catch (error: any) {
      console.error('[AI] Error generating response:', error);
      throw new Error(`Errore nella generazione della risposta: ${error.message}`);
    }
  }
}

export const aiService = new AIService();