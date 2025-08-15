import sgMail from '@sendgrid/mail';

export interface SendGridTemplateEmail {
  to: string;
  templateId: string;
  dynamicTemplateData: Record<string, any>;
  subject?: string;
  from?: {
    email: string;
    name: string;
  };
}

export class SendGridTemplateService {
  private apiKey: string;
  private defaultFrom: { email: string; name: string };

  constructor(apiKey: string, defaultFrom: { email: string; name: string }) {
    this.apiKey = apiKey;
    this.defaultFrom = defaultFrom;
    sgMail.setApiKey(apiKey);
  }

  async sendTemplateEmail(emailData: SendGridTemplateEmail): Promise<boolean> {
    try {
      const msg = {
        to: emailData.to,
        from: emailData.from || this.defaultFrom,
        templateId: emailData.templateId,
        dynamicTemplateData: emailData.dynamicTemplateData,
      };

      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('SendGrid template email error:', error);
      return false;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(
    to: string, 
    resetToken: string, 
    userFirstName: string,
    templateId: string
  ): Promise<boolean> {
    return this.sendTemplateEmail({
      to,
      templateId,
      dynamicTemplateData: {
        first_name: userFirstName,
        reset_token: resetToken,
        reset_link: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
        expiry_hours: 24
      }
    });
  }

  // Send invoice notification
  async sendInvoiceNotification(
    to: string,
    invoiceNumber: string,
    amount: number,
    dueDate: string,
    templateId: string
  ): Promise<boolean> {
    return this.sendTemplateEmail({
      to,
      templateId,
      dynamicTemplateData: {
        invoice_number: invoiceNumber,
        amount: amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }),
        due_date: dueDate,
        company_name: 'EasyCashFlows'
      }
    });
  }

  // Send welcome email
  async sendWelcomeEmail(
    to: string,
    firstName: string,
    username: string,
    templateId: string
  ): Promise<boolean> {
    return this.sendTemplateEmail({
      to,
      templateId,
      dynamicTemplateData: {
        first_name: firstName,
        username: username,
        dashboard_link: `${process.env.FRONTEND_URL}/dashboard`,
        support_email: process.env.SUPPORT_EMAIL || 'support@easycashflows.com'
      }
    });
  }

  // Send financial alert
  async sendFinancialAlert(
    to: string,
    alertType: string,
    message: string,
    amount?: number,
    templateId?: string
  ): Promise<boolean> {
    return this.sendTemplateEmail({
      to,
      templateId: templateId || 'default-alert-template',
      dynamicTemplateData: {
        alert_type: alertType,
        message: message,
        amount: amount ? amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }) : null,
        timestamp: new Date().toLocaleString('it-IT'),
        dashboard_link: `${process.env.FRONTEND_URL}/dashboard`
      }
    });
  }

  // Test template email
  async testTemplate(templateId: string, testEmail: string): Promise<boolean> {
    return this.sendTemplateEmail({
      to: testEmail,
      templateId,
      dynamicTemplateData: {
        test_mode: true,
        timestamp: new Date().toLocaleString('it-IT'),
        message: 'Questo è un test del template SendGrid'
      }
    });
  }
}