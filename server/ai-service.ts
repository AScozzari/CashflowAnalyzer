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
    context?: any
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
      const response = await this.openai.chat.completions.create({
        model: aiSettings.defaultModel || 'gpt-4o',
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
          const movementsResult = await storage.getMovements({});
          const movements = movementsResult.data || movementsResult;
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
}

export const aiService = new AIService();