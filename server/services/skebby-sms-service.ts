// Use native fetch (Node 18+) instead of node-fetch
import { 
  SmsSettings, 
  SmsMessage, 
  SMS_MESSAGE_TYPES, 
  SMS_STATUS,
  InsertSmsMessage 
} from '@shared/sms-schema';

interface SkebbyAuthResponse {
  userKey: string;
  sessionKey: string;
}

interface SkebbySendSMSRequest {
  message: string;
  message_type: string;
  returnCredits?: boolean;
  recipient: string[];
  sender?: string;
  scheduled_delivery_time?: string;
}

interface SkebbySendSMSResponse {
  result: string;
  order_id?: string;
  total_sent?: number;
  remaining_credits?: number;
  internal_order_id?: string;
  error?: string;
}

interface SkebbyDeliveryReport {
  orderId: string;
  status: string;
  deliveredAt?: string;
  failedReason?: string;
}

export class SkebbyService {
  private baseUrl: string;
  private userKey: string | null = null;
  private sessionKey: string | null = null;
  private settings: SmsSettings;

  constructor(settings: SmsSettings) {
    this.settings = settings;
    this.baseUrl = settings.apiUrl || 'https://api.skebby.it/API/v1.0/REST/';
  }

  /**
   * Authenticate with Skebby API
   */
  async authenticate(): Promise<SkebbyAuthResponse> {
    try {
      const url = `${this.baseUrl}login?username=${encodeURIComponent(this.settings.username)}&password=${encodeURIComponent(this.settings.password)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Errore autenticazione Skebby: ${response.status} ${response.statusText}`);
      }

      const authData = await response.text();
      const [userKey, sessionKey] = authData.split(';');

      if (!userKey || !sessionKey) {
        throw new Error('Formato risposta autenticazione non valido');
      }

      this.userKey = userKey;
      this.sessionKey = sessionKey;

      return { userKey, sessionKey };
    } catch (error: any) {
      console.error('Errore autenticazione Skebby:', error);
      throw new Error(`Autenticazione fallita: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Send SMS via Skebby API
   */
  async sendSMS(params: {
    recipient: string;
    message: string;
    sender?: string;
    messageType?: string;
    scheduledTime?: Date;
    templateId?: number;
  }): Promise<SkebbySendSMSResponse> {
    try {
      // Authenticate if needed
      if (!this.userKey || !this.sessionKey) {
        await this.authenticate();
      }

      // Validate phone number format
      const cleanRecipient = this.formatPhoneNumber(params.recipient);
      
      // Prepare SMS request
      const smsRequest: SkebbySendSMSRequest = {
        message: params.message,
        message_type: params.messageType || this.settings.messageType || SMS_MESSAGE_TYPES.HIGH_QUALITY,
        returnCredits: true,
        recipient: [cleanRecipient],
        sender: params.sender || this.settings.defaultSender || undefined,
      };

      // Add scheduled delivery if specified
      if (params.scheduledTime) {
        smsRequest.scheduled_delivery_time = this.formatScheduledTime(params.scheduledTime);
      }

      const response = await fetch(`${this.baseUrl}sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_key': this.userKey!,
          'Session_key': this.sessionKey!,
          'Accept': 'application/json',
        },
        body: JSON.stringify(smsRequest),
      });

      if (!response.ok) {
        throw new Error(`Errore invio SMS: ${response.status} ${response.statusText}`);
      }

      const result: SkebbySendSMSResponse = await response.json();

      if (result.result !== 'OK') {
        throw new Error(`Skebby API error: ${result.error || 'Unknown error'}`);
      }

      return result;
    } catch (error: any) {
      console.error('Errore invio SMS Skebby:', error);
      throw new Error(`Invio SMS fallito: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get SMS delivery status
   */
  async getDeliveryStatus(orderId: string): Promise<SkebbyDeliveryReport> {
    try {
      if (!this.userKey || !this.sessionKey) {
        await this.authenticate();
      }

      const response = await fetch(`${this.baseUrl}sms/${orderId}/status`, {
        method: 'GET',
        headers: {
          'user_key': this.userKey!,
          'Session_key': this.sessionKey!,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Errore status SMS: ${response.status} ${response.statusText}`);
      }

      const status = await response.json();
      return this.mapSkebbyStatusToDeliveryReport(orderId, status);
    } catch (error: any) {
      console.error('Errore recupero status SMS:', error);
      throw new Error(`Recupero status fallito: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get account credits and status
   */
  async getAccountStatus(): Promise<{ credits: number; status: string }> {
    try {
      if (!this.userKey || !this.sessionKey) {
        await this.authenticate();
      }

      const response = await fetch(`${this.baseUrl}user/credits`, {
        method: 'GET',
        headers: {
          'user_key': this.userKey!,
          'Session_key': this.sessionKey!,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Errore recupero crediti: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        credits: data.sms_credits || 0,
        status: data.status || 'unknown',
      };
    } catch (error: any) {
      console.error('Errore recupero status account:', error);
      throw new Error(`Recupero status fallito: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Test connection and credentials
   */
  async testConnection(): Promise<{ success: boolean; message: string; credits?: number }> {
    try {
      await this.authenticate();
      const accountStatus = await this.getAccountStatus();
      
      return {
        success: true,
        message: 'Connessione Skebby riuscita',
        credits: accountStatus.credits,
      };
    } catch (error) {
      return {
        success: false,
        message: `Test connessione fallito: ${(error as any)?.message || 'Unknown error'}`,
      };
    }
  }

  /**
   * Add number to SMS blacklist
   */
  async addToBlacklist(phoneNumber: string): Promise<boolean> {
    try {
      if (!this.userKey || !this.sessionKey) {
        await this.authenticate();
      }

      const cleanNumber = this.formatPhoneNumber(phoneNumber);

      const response = await fetch(`${this.baseUrl}blacklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_key': this.userKey!,
          'Session_key': this.sessionKey!,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ numbers: [cleanNumber] }),
      });

      return response.ok;
    } catch (error: any) {
      console.error('Errore aggiunta blacklist:', error);
      return false;
    }
  }

  /**
   * Format phone number for Skebby API
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add + if not present and number doesn't start with 00
    if (!cleaned.startsWith('00') && !phoneNumber.startsWith('+')) {
      // For Italian numbers, add +39 if needed
      if (cleaned.length === 10 && cleaned.startsWith('3')) {
        cleaned = '+39' + cleaned;
      } else if (cleaned.length === 12 && cleaned.startsWith('39')) {
        cleaned = '+' + cleaned;
      } else if (!cleaned.startsWith('39')) {
        cleaned = '+' + cleaned;
      }
    }
    
    return cleaned;
  }

  /**
   * Format scheduled time for Skebby API (YmdHi format)
   */
  private formatScheduledTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}${hour}${minute}`;
  }

  /**
   * Map Skebby status to delivery report
   */
  private mapSkebbyStatusToDeliveryReport(orderId: string, skebbyStatus: any): SkebbyDeliveryReport {
    const report: SkebbyDeliveryReport = {
      orderId,
      status: SMS_STATUS.PENDING,
    };

    // Map Skebby specific statuses to our standard statuses
    switch (skebbyStatus.status?.toLowerCase()) {
      case 'delivered':
        report.status = SMS_STATUS.DELIVERED;
        report.deliveredAt = skebbyStatus.delivered_at;
        break;
      case 'failed':
      case 'error':
        report.status = SMS_STATUS.FAILED;
        report.failedReason = skebbyStatus.error_message || 'Unknown error';
        break;
      case 'sent':
      case 'buffered':
        report.status = SMS_STATUS.SENT;
        break;
      case 'expired':
        report.status = SMS_STATUS.EXPIRED;
        break;
      default:
        report.status = SMS_STATUS.PENDING;
    }

    return report;
  }

  /**
   * Calculate message character count and encoding
   */
  static calculateMessageInfo(message: string): { 
    characterCount: number; 
    encoding: 'GSM7' | 'UCS2'; 
    parts: number;
    creditsEstimate: number;
  } {
    // GSM 7-bit character set
    const gsm7Chars = /^[@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà\r\n\f\^{}\\~|€]*$/;
    
    const isGSM7 = gsm7Chars.test(message);
    const encoding = isGSM7 ? 'GSM7' : 'UCS2';
    const characterCount = message.length;
    
    // Calculate SMS parts based on encoding
    let maxLength: number;
    let parts: number;
    
    if (encoding === 'GSM7') {
      maxLength = characterCount <= 160 ? 160 : 153; // Single vs concatenated SMS
      parts = Math.ceil(characterCount / maxLength);
    } else {
      maxLength = characterCount <= 70 ? 70 : 67; // UCS2 limits
      parts = Math.ceil(characterCount / maxLength);
    }
    
    // Estimate credits (typically 1 credit per part for high quality)
    const creditsEstimate = parts;
    
    return {
      characterCount,
      encoding,
      parts,
      creditsEstimate,
    };
  }
}