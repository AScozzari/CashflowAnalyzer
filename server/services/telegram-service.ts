// Telegram Bot Service - Professional Implementation
import { storage } from '../storage';

export interface TelegramSettings {
  botToken: string;
  botUsername: string;
  webhookUrl?: string;
  webhookSecret?: string;
  allowedUpdates: string[];
  enableBusinessHours: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  businessDays: string[];
  enableAutoReply: boolean;
  enableAiResponses: boolean;
  aiModel: string;
  aiSystemPrompt?: string;
}

interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
  chat: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    type: 'private' | 'group' | 'supergroup' | 'channel';
  };
  date: number;
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: any;
}

interface SendMessageOptions {
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_web_page_preview?: boolean;
  reply_markup?: any;
}

// Import services
import { notificationService } from './notification-service';

export class TelegramService {
  private static instance: TelegramService;
  private settings: TelegramSettings | null = null;
  private initialized: boolean = false;
  private botInfo: any = null;

  private constructor() {}

  static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  async initialize(settings: TelegramSettings): Promise<void> {
    try {
      this.settings = settings;
      
      if (!settings.botToken) {
        throw new Error('Bot token richiesto');
      }

      // Test bot token with getMe
      const botInfo = await this.getBotInfo();
      
      if (!botInfo.ok) {
        throw new Error('Token bot non valido');
      }

      this.botInfo = botInfo.result;
      this.initialized = true;
      
      console.log(`Telegram Bot Service initialized: @${this.botInfo.username}`);
      
      // Setup webhook if URL provided
      if (settings.webhookUrl) {
        await this.setWebhook(settings.webhookUrl, settings.webhookSecret);
      }
      
    } catch (error) {
      console.error('Failed to initialize Telegram Service:', error);
      this.initialized = false;
      throw new Error('Telegram service initialization failed');
    }
  }

  async getBotInfo(): Promise<any> {
    if (!this.settings?.botToken) {
      throw new Error('Bot token not configured');
    }

    const response = await fetch(`https://api.telegram.org/bot${this.settings.botToken}/getMe`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return await response.json();
  }

  async setWebhook(url: string, secret?: string): Promise<any> {
    if (!this.settings?.botToken) {
      throw new Error('Bot token not configured');
    }

    const params: any = {
      url: url,
      allowed_updates: this.settings.allowedUpdates
    };

    if (secret) {
      params.secret_token = secret;
    }

    const response = await fetch(`https://api.telegram.org/bot${this.settings.botToken}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    return await response.json();
  }

  async sendMessage(chatId: number | string, text: string, options: SendMessageOptions = {}): Promise<{
    success: boolean;
    messageId?: number;
    error?: string;
  }> {
    try {
      if (!this.initialized || !this.settings) {
        throw new Error('Telegram service not initialized');
      }

      const messageData = {
        chat_id: chatId,
        text: text,
        ...options
      };

      const response = await fetch(`https://api.telegram.org/bot${this.settings.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      const result = await response.json();

      if (result.ok) {
        return {
          success: true,
          messageId: result.result.message_id
        };
      } else {
        return {
          success: false,
          error: result.description || 'Send message failed'
        };
      }
    } catch (error) {
      console.error('Telegram send message error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendTemplateMessage(chatId: number | string, template: {
    content: string;
    parseMode?: string;
    disableWebPagePreview?: boolean;
    inlineKeyboard?: any;
    variables?: Record<string, string>;
  }): Promise<{ success: boolean; messageId?: number; error?: string }> {
    try {
      let content = template.content;
      
      // Replace variables
      if (template.variables) {
        Object.entries(template.variables).forEach(([key, value]) => {
          content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
      }

      const options: SendMessageOptions = {
        parse_mode: (template.parseMode as any) || 'HTML',
        disable_web_page_preview: template.disableWebPagePreview
      };

      if (template.inlineKeyboard) {
        options.reply_markup = {
          inline_keyboard: template.inlineKeyboard
        };
      }

      return await this.sendMessage(chatId, content, options);
    } catch (error) {
      console.error('Send template message error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async processUpdate(update: TelegramUpdate): Promise<void> {
    try {
      console.log('[TELEGRAM SERVICE] processUpdate chiamato');
      
      if (!this.initialized || !this.settings) {
        console.error('[TELEGRAM SERVICE] ❌ TelegramService non inizializzato');
        return;
      }

      console.log('[TELEGRAM SERVICE] ✅ TelegramService inizializzato, processing update');

      if (update.message) {
        console.log('[TELEGRAM SERVICE] 📝 Messaggio trovato, chiamando handleMessage...');
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        console.log('[TELEGRAM SERVICE] 🔘 Callback query trovato, handling...');
        await this.handleCallbackQuery(update.callback_query);
      } else {
        console.log('[TELEGRAM SERVICE] ⚠️ Nessun messaggio o callback nell\'update');
      }

      console.log('[TELEGRAM SERVICE] ✅ processUpdate completato');
    } catch (error) {
      console.error('[TELEGRAM SERVICE] ❌ Errore in processUpdate:', error);
    }
  }

  private async handleMessage(message: TelegramMessage): Promise<void> {
    const chatId = message.chat.id;
    const text = message.text || '';
    
    console.log(`[TELEGRAM SERVICE] 📨 Messaggio ricevuto dalla chat ${chatId}: "${text}"`);

    // Save or update chat information FIRST
    await this.saveOrUpdateChat(message);

    // Create notification for incoming message (non-command messages only)
    if (!text.startsWith('/') && text.trim() !== '') {
      console.log('[TELEGRAM SERVICE] 📝 Creando notifica per messaggio...');
      await this.createNotificationForMessage(message);
      console.log('[TELEGRAM SERVICE] ✅ Notifica creata');
    } else if (text.startsWith('/')) {
      console.log('[TELEGRAM SERVICE] 🤖 Messaggio è un comando, nessuna notifica creata');
    } else {
      console.log('[TELEGRAM SERVICE] ⚠️ Messaggio vuoto, nessuna notifica creata');
    }

    // Check if it's a command
    if (text.startsWith('/')) {
      await this.handleCommand(message);
      return;
    }

    // Check business hours
    if (this.settings?.enableBusinessHours && !this.isBusinessHours()) {
      await this.sendAutoReply(chatId, 'out_of_hours');
      return;
    }

    // Auto-reply logic
    if (this.settings?.enableAutoReply) {
      await this.sendAutoReply(chatId, 'general');
    }

    // AI Response (if enabled)
    if (this.settings?.enableAiResponses) {
      // TODO: Implement AI response using OpenAI service
      console.log('AI responses not yet implemented');
    }
  }

  private async handleCommand(message: TelegramMessage): Promise<void> {
    const command = message.text?.split(' ')[0] || '';
    const chatId = message.chat.id;

    switch (command) {
      case '/start':
        await this.sendWelcomeMessage(chatId, message.from.first_name);
        break;
      case '/help':
        await this.sendHelpMessage(chatId);
        break;
      case '/info':
        await this.sendInfoMessage(chatId);
        break;
      default:
        await this.sendMessage(chatId, 'Comando non riconosciuto. Usa /help per vedere i comandi disponibili.');
    }
  }

  private async handleCallbackQuery(callbackQuery: any): Promise<void> {
    console.log('Handling callback query:', callbackQuery);
    // TODO: Implement callback query handling
  }

  private async sendWelcomeMessage(chatId: number, firstName: string): Promise<void> {
    const welcomeMessage = `Ciao ${firstName}! 👋

Benvenuto nel supporto di EasyCashFlows!

Sono il tuo assistente digitale e sono qui per aiutarti con:
💰 Gestione flussi di cassa
📊 Analytics finanziari  
📄 Fatturazione elettronica
🤖 Assistenza AI

Usa /help per vedere tutti i comandi disponibili.

Come posso aiutarti oggi?`;

    await this.sendMessage(chatId, welcomeMessage, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💰 Flussi di Cassa', callback_data: 'cashflow' },
            { text: '📊 Analytics', callback_data: 'analytics' }
          ],
          [
            { text: '📄 Fatturazione', callback_data: 'invoicing' },
            { text: '🆘 Supporto', callback_data: 'support' }
          ]
        ]
      }
    });
  }

  private async sendHelpMessage(chatId: number): Promise<void> {
    const helpMessage = `<b>📋 Comandi Disponibili</b>

<b>Generali:</b>
/start - Inizia conversazione
/help - Mostra questo messaggio
/info - Informazioni sul bot

<b>Supporto:</b>
/support - Contatta il supporto
/status - Stato del sistema

<b>Funzionalità:</b>
/cashflow - Info sui flussi di cassa
/analytics - Dashboard analytics
/invoicing - Fatturazione elettronica

Puoi anche scrivere direttamente la tua domanda e ti aiuterò! 😊`;

    await this.sendMessage(chatId, helpMessage, { parse_mode: 'HTML' });
  }

  private async sendInfoMessage(chatId: number): Promise<void> {
    const infoMessage = `<b>ℹ️ EasyCashFlows Bot</b>

<b>Versione:</b> 1.0.0
<b>Developed by:</b> EasyCashFlows Team
<b>Tipo:</b> Business Assistant Bot

<b>🎯 Funzionalità Principali:</b>
• Gestione Cash Flow in tempo reale
• Analytics e reporting automatizzati
• Integrazione FatturaPA
• Supporto multi-canale
• Assistenza AI personalizzata

<b>📞 Supporto:</b>
Per assistenza tecnica contattaci attraverso questo bot o visita il nostro portale.

<b>🔒 Privacy:</b>
I tuoi dati sono protetti secondo GDPR.`;

    await this.sendMessage(chatId, infoMessage, { parse_mode: 'HTML' });
  }

  private async sendAutoReply(chatId: number, type: 'general' | 'out_of_hours'): Promise<void> {
    let message = '';

    if (type === 'out_of_hours') {
      message = `🕐 Siamo attualmente fuori orario.

<b>Orari di assistenza:</b>
${this.settings?.businessHoursStart} - ${this.settings?.businessHoursEnd}
${this.settings?.businessDays?.join(', ')}

Ti risponderemo appena possibile! 
Nel frattempo puoi usare i comandi disponibili o descrivere il tuo problema.`;
    } else {
      message = `Ciao! 👋 Grazie per averci contattato.

Riceverai una risposta al più presto dal nostro team.

Nel frattempo puoi:
• Usare /help per vedere i comandi
• Descrivere il tuo problema in dettaglio
• Consultare le nostre FAQ`;
    }

    await this.sendMessage(chatId, message, { parse_mode: 'HTML' });
  }

  private isBusinessHours(): boolean {
    if (!this.settings?.enableBusinessHours) return true;

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    const isBusinessDay = this.settings.businessDays.includes(currentDay);
    const isBusinessTime = currentTime >= this.settings.businessHoursStart && 
                          currentTime <= this.settings.businessHoursEnd;

    return isBusinessDay && isBusinessTime;
  }

  async testConnection(): Promise<{ success: boolean; error?: string; botInfo?: any }> {
    try {
      const result = await this.getBotInfo();
      
      if (result.ok) {
        return {
          success: true,
          botInfo: result.result
        };
      } else {
        return {
          success: false,
          error: result.description || 'Test connection failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async createNotificationForMessage(message: TelegramMessage): Promise<void> {
    try {
      console.log('[TELEGRAM NOTIFICATION] Inizio creazione notifica...');
      
      const chatId = message.chat.id.toString();
      const text = message.text || '';
      const senderName = message.from.first_name + (message.from.last_name ? ` ${message.from.last_name}` : '');
      const senderUsername = message.from.username ? `@${message.from.username}` : senderName;

      console.log(`[TELEGRAM NOTIFICATION] Dettagli messaggio - Chat: ${chatId}, Mittente: ${senderUsername}, Testo: "${text}"`);

      // Get all admin and finance users for notifications
      console.log('[TELEGRAM NOTIFICATION] Recupero utenti admin e finance...');
      const users = await storage.getUsers();
      const notificationRecipients = users
        .filter(user => ['admin', 'finance'].includes(user.role))
        .map(user => user.id);

      console.log(`[TELEGRAM NOTIFICATION] Trovati ${notificationRecipients.length} destinatari:`, notificationRecipients);

      if (notificationRecipients.length === 0) {
        console.warn('[TELEGRAM NOTIFICATION] ⚠️ Nessun destinatario trovato (admin/finance)');
        return;
      }

      // Create notification for each recipient
      for (const userId of notificationRecipients) {
        console.log(`[TELEGRAM NOTIFICATION] Creando notifica per utente ${userId}...`);
        await notificationService.createCommunicationNotification({
          userId,
          type: 'new_telegram',
          category: 'telegram',
          from: senderUsername,
          to: 'EasyCashFlows Bot',
          originalContent: text,
          channelProvider: 'telegram',
          messageId: `telegram_${message.message_id}_${chatId}`,
          priority: 'normal'
        });
        console.log(`[TELEGRAM NOTIFICATION] ✅ Notifica creata per utente ${userId}`);
      }

      console.log(`[TELEGRAM NOTIFICATION] ✅ Tutte le notifiche create per messaggio da ${senderUsername}`);
    } catch (error) {
      console.error('[TELEGRAM NOTIFICATION] ❌ Errore durante creazione notifica:', error);
    }
  }

  private async saveOrUpdateChat(message: TelegramMessage): Promise<void> {
    try {
      console.log('[TELEGRAM SERVICE] 💾 Salvando/aggiornando chat...');
      
      const chatId = message.chat.id.toString();
      
      // Check if chat exists
      const existingChats = await storage.getTelegramChats();
      const existingChat = existingChats.find((chat: any) => chat.telegramChatId === chatId);
      
      if (existingChat) {
        console.log(`[TELEGRAM SERVICE] 🔄 Aggiornando chat esistente: ${chatId}`);
        // Update existing chat
        await storage.updateTelegramChat(existingChat.id, {
          lastMessageId: message.message_id,
          firstName: message.from.first_name,
          lastName: message.from.last_name,
          username: message.from.username,
          languageCode: message.from.language_code
        });
        console.log(`[TELEGRAM SERVICE] ✅ Chat aggiornata: ${chatId}`);
      } else {
        console.log(`[TELEGRAM SERVICE] 🆕 Creando nuova chat: ${chatId}`);
        // Create new chat
        await storage.createTelegramChat({
          telegramChatId: chatId,
          chatId: parseInt(chatId), // Telegram chat ID as number
          chatType: message.chat.type,
          firstName: message.from.first_name,
          lastName: message.from.last_name,
          username: message.from.username,
          // title: message.chat.title || `Chat ${chatId}`,
          languageCode: message.from.language_code,
          lastMessageId: message.message_id,
          isBot: message.from.is_bot || false,
          isPremium: false // message.from.is_premium not available
        });
        console.log(`[TELEGRAM SERVICE] ✅ Nuova chat creata: ${chatId}`);
      }
    } catch (error) {
      console.error('[TELEGRAM SERVICE] ❌ Errore nel salvare chat:', error);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getBotUsername(): string {
    return this.botInfo?.username || 'Unknown';
  }

  getSettings(): TelegramSettings | null {
    return this.settings;
  }
}

export const telegramService = TelegramService.getInstance();