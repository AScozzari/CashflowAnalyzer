import sgMail from '@sendgrid/mail';
import type { EmailSettings } from '@shared/schema';

export class EmailResponseService {
  private static instance: EmailResponseService;
  private settings: EmailSettings | null = null;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): EmailResponseService {
    if (!EmailResponseService.instance) {
      EmailResponseService.instance = new EmailResponseService();
    }
    return EmailResponseService.instance;
  }

  async initialize(settings: EmailSettings): Promise<void> {
    try {
      this.settings = settings;
      
      if (settings.provider === 'sendgrid' && settings.sendgridApiKey) {
        sgMail.setApiKey(settings.sendgridApiKey);
        this.initialized = true;
        console.log('Email Response Service initialized with SendGrid');
      } else {
        throw new Error('Invalid email settings - SendGrid API key required');
      }
    } catch (error) {
      console.error('Failed to initialize Email Response Service:', error);
      throw new Error('Email service initialization failed');
    }
  }

  async sendEmailResponse(
    to: string,
    subject: string,
    text: string,
    inReplyTo?: string,
    references?: string
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!this.initialized || !this.settings) {
        throw new Error('Email service not initialized');
      }

      const msg: any = {
        to: to,
        from: {
          email: this.settings.fromEmail,
          name: this.settings.fromName
        },
        replyTo: this.settings.replyToEmail || this.settings.fromEmail,
        subject: subject,
        text: text,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px;">
              <h2 style="color: #2563eb; margin: 0;">EasyCashFlows</h2>
              <p style="color: #6b7280; margin: 5px 0;">Sistema di Gestione Flussi di Cassa</p>
            </div>
            
            <div style="line-height: 1.6; color: #374151;">
              ${text.replace(/\n/g, '<br>')}
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              <p>Questo è un messaggio automatico da EasyCashFlows.</p>
              <p>Per assistenza: support@easycashflows.com | Tel: +39 123 456 7890</p>
            </div>
          </div>
        `
      };

      // Add threading headers if this is a reply
      if (inReplyTo) {
        msg.headers = {
          'In-Reply-To': inReplyTo,
          'References': references || inReplyTo
        };
      }

      const response = await sgMail.send(msg);
      
      return {
        success: true,
        messageId: response[0].headers['x-message-id']
      };
      
    } catch (error) {
      console.error('Email Response Service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendAutoReply(
    to: string,
    originalSubject: string,
    originalMessageId?: string,
    references?: string
  ): Promise<boolean> {
    const subject = originalSubject.startsWith('Re: ') ? originalSubject : `Re: ${originalSubject}`;
    
    const message = `Grazie per la tua email.

Abbiamo ricevuto il tuo messaggio e ti risponderemo entro 24 ore durante gli orari lavorativi (Lunedì-Venerdì, 9:00-18:00).

Per richieste urgenti, puoi contattarci:
- Telefono: +39 123 456 7890
- WhatsApp: +39 123 456 7890
- Email: support@easycashflows.com

Questo è un messaggio automatico. Non rispondere a questa email.

Cordiali saluti,
Team EasyCashFlows`;

    const result = await this.sendEmailResponse(to, subject, message, originalMessageId, references);
    return result.success;
  }

  async sendBusinessHoursResponse(
    to: string,
    originalSubject: string,
    originalMessageId?: string,
    references?: string
  ): Promise<boolean> {
    const subject = originalSubject.startsWith('Re: ') ? originalSubject : `Re: ${originalSubject}`;
    
    const message = `Grazie per averci contattato.

Attualmente siamo fuori orario lavorativo (Lunedì-Venerdì, 9:00-18:00).

Il tuo messaggio è importante per noi e riceverai una risposta entro la prossima giornata lavorativa.

Per emergenze urgenti, puoi contattarci tramite:
- WhatsApp: +39 123 456 7890 (disponibile H24 per urgenze)

Cordiali saluti,
Team EasyCashFlows

---
Questo è un messaggio automatico inviato fuori orario lavorativo.`;

    const result = await this.sendEmailResponse(to, subject, message, originalMessageId, references);
    return result.success;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const emailResponseService = EmailResponseService.getInstance();