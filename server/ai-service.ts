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

    // Build conversation context
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: this.buildSystemPrompt(aiSettings, context),
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

    if (context) {
      prompt += `\n\nCurrent Context:\n${JSON.stringify(context, null, 2)}`;
    }

    return prompt;
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