export interface MessengerSettings {
  pageAccessToken: string;
  pageId: string;
  verifyToken: string;
  appSecret: string;
}

export class MessengerResponseService {
  private static instance: MessengerResponseService;
  private settings: MessengerSettings | null = null;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): MessengerResponseService {
    if (!MessengerResponseService.instance) {
      MessengerResponseService.instance = new MessengerResponseService();
    }
    return MessengerResponseService.instance;
  }

  async initialize(settings: MessengerSettings): Promise<void> {
    try {
      this.settings = settings;
      
      if (settings.pageAccessToken && settings.pageId) {
        this.initialized = true;
        console.log('Messenger Response Service initialized');
      } else {
        throw new Error('Invalid Messenger settings - Page Access Token and Page ID required');
      }
    } catch (error) {
      console.error('Failed to initialize Messenger Response Service:', error);
      throw new Error('Messenger service initialization failed');
    }
  }

  async sendMessengerResponse(recipientId: string, message: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!this.initialized || !this.settings) {
        throw new Error('Messenger service not initialized');
      }

      const messageData = {
        recipient: {
          id: recipientId
        },
        message: {
          text: message
        }
      };

      const response = await fetch(`https://graph.facebook.com/v18.0/me/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.settings.pageAccessToken}`
        },
        body: JSON.stringify(messageData)
      });

      const result = await response.json();

      if (response.ok && result.message_id) {
        return {
          success: true,
          messageId: result.message_id
        };
      } else {
        return {
          success: false,
          error: result.error?.message || 'Messenger send failed'
        };
      }
    } catch (error) {
      console.error('Messenger Response Service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendTypingIndicator(recipientId: string, action: 'typing_on' | 'typing_off' = 'typing_on'): Promise<boolean> {
    try {
      if (!this.initialized || !this.settings) {
        return false;
      }

      const response = await fetch(`https://graph.facebook.com/v18.0/me/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.settings.pageAccessToken}`
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          sender_action: action
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Messenger typing indicator error:', error);
      return false;
    }
  }

  async sendBusinessHoursResponse(recipientId: string): Promise<boolean> {
    await this.sendTypingIndicator(recipientId, 'typing_on');
    
    // Small delay to make typing indicator visible
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const message = `👋 Grazie per averci contattato su Messenger!

⏰ Siamo attualmente fuori orario lavorativo (Lun-Ven 9:00-18:00).

📞 Per urgenze immediate:
• WhatsApp: +39 123 456 7890
• Telefono: +39 123 456 7890
• Email: support@easycashflows.com

Risponderemo al tuo messaggio nella prossima giornata lavorativa.

EasyCashFlows Team 💼`;

    await this.sendTypingIndicator(recipientId, 'typing_off');
    const result = await this.sendMessengerResponse(recipientId, message);
    return result.success;
  }

  async sendAutoReply(recipientId: string, context: string): Promise<boolean> {
    await this.sendTypingIndicator(recipientId, 'typing_on');
    
    // Small delay to make typing indicator visible
    await new Promise(resolve => setTimeout(resolve, 800));

    const message = `✅ Messaggio ricevuto!

Stiamo elaborando la tua richiesta: "${context.substring(0, 50)}${context.length > 50 ? '...' : ''}"

Un membro del nostro team ti risponderà a breve.

🚨 Per urgenze immediate usa:
📱 WhatsApp: +39 123 456 7890

Grazie per aver scelto EasyCashFlows! 💼`;

    await this.sendTypingIndicator(recipientId, 'typing_off');
    const result = await this.sendMessengerResponse(recipientId, message);
    return result.success;
  }

  async sendWelcomeMessage(recipientId: string): Promise<boolean> {
    const message = `🎉 Benvenuto su EasyCashFlows!

Siamo qui per aiutarti con:
💰 Gestione flussi di cassa
📊 Analytics finanziari
📄 Fatturazione elettronica
🤖 Assistenza AI

Come possiamo aiutarti oggi? 😊`;

    const result = await this.sendMessengerResponse(recipientId, message);
    return result.success;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const messengerResponseService = MessengerResponseService.getInstance();