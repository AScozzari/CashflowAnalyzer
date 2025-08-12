import sgMail from '@sendgrid/mail';
import { storage } from './storage';
import type { EmailSettings } from '@shared/schema';

export class EmailService {
  private static instance: EmailService;
  private settings: EmailSettings | null = null;

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async loadSettings(): Promise<void> {
    try {
      this.settings = await storage.getEmailSettings();
      if (this.settings?.provider === 'sendgrid' && this.settings.sendgridApiKey) {
        sgMail.setApiKey(this.settings.sendgridApiKey);
      }
    } catch (error) {
      console.error('Failed to load email settings:', error);
    }
  }

  async sendPasswordResetEmail(userEmail: string, resetToken: string, userName: string): Promise<boolean> {
    try {
      await this.loadSettings();
      
      if (!this.settings) {
        throw new Error('Email settings not configured');
      }

      const resetUrl = `${process.env.NODE_ENV === 'production' ? 'https://easycashflows.replit.app' : 'http://localhost:5000'}/reset-password?token=${resetToken}`;
      
      const msg = {
        to: userEmail,
        from: {
          email: this.settings.fromEmail,
          name: this.settings.fromName
        },
        replyTo: this.settings.replyToEmail || this.settings.fromEmail,
        subject: 'Reset Password - EasyCashFlows',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">EasyCashFlows</h1>
              <p style="color: #6b7280; margin: 5px 0;">Sistema di Gestione Flussi di Cassa</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 8px; border-left: 4px solid #2563eb;">
              <h2 style="color: #1f2937; margin-top: 0;">Richiesta Reset Password</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                Ciao <strong>${userName}</strong>,
              </p>
              <p style="color: #4b5563; line-height: 1.6;">
                Hai richiesto di reimpostare la password per il tuo account EasyCashFlows.
                Clicca sul pulsante qui sotto per creare una nuova password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                  Reimposta Password
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                Se non hai richiesto questa operazione, puoi ignorare questa email in tutta sicurezza.
                Il link scadrà tra 1 ora per motivi di sicurezza.
              </p>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                Se il pulsante non funziona, puoi copiare e incollare questo link nel tuo browser:<br>
                <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">
              <p>© 2025 EasyCashFlows - Sistema di Gestione Finanziaria</p>
              <p>Questa è una email automatica, non rispondere a questo messaggio.</p>
            </div>
          </div>
        `,
        text: `
          EasyCashFlows - Reset Password
          
          Ciao ${userName},
          
          Hai richiesto di reimpostare la password per il tuo account EasyCashFlows.
          
          Clicca su questo link per creare una nuova password:
          ${resetUrl}
          
          Se non hai richiesto questa operazione, puoi ignorare questa email.
          Il link scadrà tra 1 ora per motivi di sicurezza.
          
          © 2025 EasyCashFlows
        `
      };

      if (this.settings.provider === 'sendgrid') {
        await sgMail.send(msg);
      } else {
        // TODO: Implement SMTP sending if needed
        throw new Error('SMTP provider not implemented yet');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string, tempPassword: string): Promise<boolean> {
    try {
      await this.loadSettings();
      
      if (!this.settings) {
        throw new Error('Email settings not configured');
      }

      const loginUrl = `${process.env.NODE_ENV === 'production' ? 'https://easycashflows.replit.app' : 'http://localhost:5000'}/auth`;
      
      const msg = {
        to: userEmail,
        from: {
          email: this.settings.fromEmail,
          name: this.settings.fromName
        },
        replyTo: this.settings.replyToEmail || this.settings.fromEmail,
        subject: 'Benvenuto in EasyCashFlows - Credenziali di Accesso',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">EasyCashFlows</h1>
              <p style="color: #6b7280; margin: 5px 0;">Sistema di Gestione Flussi di Cassa</p>
            </div>
            
            <div style="background: #f0f9ff; padding: 30px; border-radius: 8px; border-left: 4px solid #10b981;">
              <h2 style="color: #1f2937; margin-top: 0;">Benvenuto nel sistema!</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                Ciao <strong>${userName}</strong>,
              </p>
              <p style="color: #4b5563; line-height: 1.6;">
                Il tuo account EasyCashFlows è stato creato con successo. Ecco le tue credenziali di accesso:
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #374151;"><strong>Username:</strong> ${userName}</p>
                <p style="margin: 10px 0 0 0; color: #374151;"><strong>Password temporanea:</strong> <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px;">${tempPassword}</code></p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" 
                   style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                  Accedi Ora
                </a>
              </div>
              
              <div style="background: #fef3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>Importante:</strong> Al primo accesso ti sarà richiesto di cambiare la password temporanea.
                  Scegli una password sicura che contenga almeno 6 caratteri.
                </p>
              </div>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px;">
              <p>© 2025 EasyCashFlows - Sistema di Gestione Finanziaria</p>
              <p>Questa è una email automatica, non rispondere a questo messaggio.</p>
            </div>
          </div>
        `,
        text: `
          EasyCashFlows - Credenziali di Accesso
          
          Ciao ${userName},
          
          Il tuo account EasyCashFlows è stato creato con successo.
          
          Credenziali di accesso:
          Username: ${userName}
          Password temporanea: ${tempPassword}
          
          Accedi qui: ${loginUrl}
          
          IMPORTANTE: Al primo accesso ti sarà richiesto di cambiare la password temporanea.
          
          © 2025 EasyCashFlows
        `
      };

      if (this.settings.provider === 'sendgrid') {
        await sgMail.send(msg);
      } else {
        throw new Error('SMTP provider not implemented yet');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.loadSettings();
      
      if (!this.settings) {
        return { success: false, message: 'Email settings not configured' };
      }

      if (this.settings.provider === 'sendgrid') {
        if (!this.settings.sendgridApiKey) {
          return { success: false, message: 'SendGrid API key not configured' };
        }
        
        // Test with a simple API call
        sgMail.setApiKey(this.settings.sendgridApiKey);
        
        // SendGrid doesn't have a dedicated test endpoint, but we can validate the API key format
        if (this.settings.sendgridApiKey.startsWith('SG.')) {
          return { success: true, message: 'SendGrid configuration appears valid' };
        } else {
          return { success: false, message: 'Invalid SendGrid API key format' };
        }
      }
      
      return { success: false, message: 'Unsupported email provider' };
    } catch (error) {
      return { success: false, message: `Connection test failed: ${error}` };
    }
  }
}

export const emailService = EmailService.getInstance();