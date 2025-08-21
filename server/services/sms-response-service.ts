import { SkebbyService } from './skebby-sms-service';
import type { SmsSettings } from '@shared/sms-schema';

export class SMSResponseService {
  private static instance: SMSResponseService;
  private skebbyService: SkebbyService | null = null;

  private constructor() {}

  static getInstance(): SMSResponseService {
    if (!SMSResponseService.instance) {
      SMSResponseService.instance = new SMSResponseService();
    }
    return SMSResponseService.instance;
  }

  async initialize(settings: SmsSettings): Promise<void> {
    try {
      if (settings.provider === 'skebby' && settings.username && settings.password) {
        this.skebbyService = new SkebbyService(settings);
        await this.skebbyService.authenticate();
        console.log('SMS Response Service initialized with Skebby');
      }
    } catch (error) {
      console.error('Failed to initialize SMS Response Service:', error);
      throw new Error('SMS service initialization failed');
    }
  }

  async sendSMSResponse(to: string, message: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!this.skebbyService) {
        throw new Error('SMS service not initialized');
      }

      // Clean phone number (remove whatsapp: prefix if present)
      const cleanPhone = to.replace('whatsapp:', '').replace('+', '');
      
      const result = await this.skebbyService.sendSMS({
        message,
        messageType: 'GP', // Tipo messaggio Skebby
        recipient: [cleanPhone],
        sender: 'EasyCashFlows' // Mittente personalizzato
      });

      if (result.result === 'OK') {
        return {
          success: true,
          messageId: result.order_id || result.internal_order_id
        };
      } else {
        return {
          success: false,
          error: result.error || 'SMS send failed'
        };
      }
    } catch (error) {
      console.error('SMS Response Service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendBusinessHoursResponse(to: string): Promise<boolean> {
    const message = `Grazie per il tuo messaggio! Siamo attualmente fuori orario lavorativo (Lun-Ven 9:00-18:00). Ti ricontatteremo appena possibile. - EasyCashFlows`;
    
    const result = await this.sendSMSResponse(to, message);
    return result.success;
  }

  async sendAutoReply(to: string, context: string): Promise<boolean> {
    const message = `Messaggio ricevuto: "${context.substring(0, 50)}...". Ti risponderemo al più presto. Per urgenze: +39 123 456 7890 - EasyCashFlows`;
    
    const result = await this.sendSMSResponse(to, message);
    return result.success;
  }

  isInitialized(): boolean {
    return this.skebbyService !== null;
  }
}

export const smsResponseService = SMSResponseService.getInstance();