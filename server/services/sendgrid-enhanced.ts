// SendGrid Enhanced Service - 2024 Best Practices Implementation
import sgMail from '@sendgrid/mail';
import { storage } from '../storage';
import type { EmailSettings } from '@shared/schema';

export interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  trackingSettings?: {
    clickTracking: boolean;
    openTracking: boolean;
    subscriptionTracking: boolean;
  };
  sandboxMode?: boolean;
}

export interface EmailTemplate {
  templateId: string;
  category?: string;
  tags?: string[];
  customArgs?: Record<string, string>;
}

export interface EnhancedEmailData {
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  dynamicTemplateData?: Record<string, any>;
  categories?: string[];
  tags?: string[];
  customArgs?: Record<string, string>;
  sendAt?: number; // Unix timestamp for scheduled sending
  batchId?: string;
  ipPoolName?: string;
}

export interface SendGridMetrics {
  messageId: string;
  timestamp: Date;
  event: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'spam' | 'dropped';
  email: string;
  category?: string;
  reason?: string;
}

export class SendGridEnhancedService {
  private config: SendGridConfig;
  private initialized: boolean = false;
  private rateLimiter: Map<string, number> = new Map();
  private readonly MAX_REQUESTS_PER_SECOND = 10;
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor() {
    this.config = {
      apiKey: '',
      fromEmail: '',
      fromName: '',
      trackingSettings: {
        clickTracking: true,
        openTracking: true,
        subscriptionTracking: false
      }
    };
  }

  async initialize(): Promise<void> {
    try {
      const emailSettings = await storage.getEmailSettings();
      if (!emailSettings?.sendgridApiKey) {
        throw new Error('SendGrid API key not configured');
      }

      this.config = {
        apiKey: emailSettings.sendgridApiKey,
        fromEmail: emailSettings.fromEmail,
        fromName: emailSettings.fromName,
        replyTo: emailSettings.replyToEmail || undefined,
        trackingSettings: {
          clickTracking: true,
          openTracking: true,
          subscriptionTracking: false
        },
        sandboxMode: process.env.NODE_ENV === 'development'
      };

      // Validate API key format
      if (!this.config.apiKey.startsWith('SG.')) {
        throw new Error('Invalid SendGrid API key format');
      }

      // Validate from email
      if (!this.isValidEmail(this.config.fromEmail)) {
        throw new Error('Invalid from email address');
      }

      sgMail.setApiKey(this.config.apiKey);
      
      // Test connection
      await this.testConnection();
      
      this.initialized = true;
      console.log('[SendGrid] ✅ Enhanced service initialized successfully');
    } catch (error) {
      console.error('[SendGrid] ❌ Initialization failed:', error);
      throw error;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async rateLimitCheck(key: string = 'default'): Promise<void> {
    const now = Date.now();
    const lastRequest = this.rateLimiter.get(key) || 0;
    const timeDiff = now - lastRequest;
    const minInterval = 1000 / this.MAX_REQUESTS_PER_SECOND;

    if (timeDiff < minInterval) {
      const delay = minInterval - timeDiff;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.rateLimiter.set(key, Date.now());
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt >= this.RETRY_ATTEMPTS) {
        throw error;
      }

      // Only retry on transient errors
      if (this.isRetryableError(error)) {
        const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`[SendGrid] Retrying in ${delay}ms (attempt ${attempt + 1}/${this.RETRY_ATTEMPTS})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryWithBackoff(operation, attempt + 1);
      }

      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on rate limits, timeouts, and temporary server errors
    const retryableStatusCodes = [429, 500, 502, 503, 504];
    return error.code && retryableStatusCodes.includes(error.code);
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.initialized && this.config.apiKey) {
        sgMail.setApiKey(this.config.apiKey);
      }

      // SendGrid doesn't have a ping endpoint, so we validate the key format and settings
      if (!this.config.apiKey.startsWith('SG.')) {
        return { success: false, message: 'Invalid SendGrid API key format' };
      }

      if (!this.isValidEmail(this.config.fromEmail)) {
        return { success: false, message: 'Invalid from email address configured' };
      }

      return { 
        success: true, 
        message: `SendGrid configuration valid. Ready to send from ${this.config.fromEmail}` 
      };
    } catch (error: any) {
      return { 
        success: false, 
        message: `SendGrid configuration error: ${error.message}` 
      };
    }
  }

  async sendTemplateEmail(
    template: EmailTemplate,
    data: EnhancedEmailData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      await this.rateLimitCheck();

      // Validate recipients
      const recipients = Array.isArray(data.to) ? data.to : [data.to];
      for (const email of recipients) {
        if (!this.isValidEmail(email)) {
          throw new Error(`Invalid recipient email: ${email}`);
        }
      }

      const msg: any = {
        to: data.to,
        cc: data.cc,
        bcc: data.bcc,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        replyTo: this.config.replyTo,
        templateId: template.templateId,
        dynamicTemplateData: data.dynamicTemplateData || {},
        categories: [...(template.category ? [template.category] : []), ...(data.categories || [])],
        customArgs: {
          ...template.customArgs,
          ...data.customArgs,
          environment: process.env.NODE_ENV || 'development',
          service: 'easycashflows'
        },
        trackingSettings: {
          clickTracking: { enable: this.config.trackingSettings?.clickTracking || false },
          openTracking: { enable: this.config.trackingSettings?.openTracking || false },
          subscriptionTracking: { enable: this.config.trackingSettings?.subscriptionTracking || false }
        }
      };

      // Add scheduling if provided
      if (data.sendAt) {
        msg.sendAt = data.sendAt;
      }

      // Add batch ID for bulk operations
      if (data.batchId) {
        msg.batchId = data.batchId;
      }

      // Add IP pool for reputation management
      if (data.ipPoolName) {
        msg.ipPoolName = data.ipPoolName;
      }

      // Sandbox mode for development
      if (this.config.sandboxMode) {
        msg.mailSettings = {
          sandboxMode: { enable: true }
        };
      }

      const result = await this.retryWithBackoff(async () => {
        return await sgMail.send(msg);
      });

      const response = result[0];
      return {
        success: true,
        messageId: response.headers['x-message-id']
      };

    } catch (error: any) {
      console.error('[SendGrid] Email send failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  // Business-specific email methods with enhanced templates
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    userName: string,
    templateId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://easycashflows.replit.app'}/reset-password?token=${resetToken}`;
    
    return await this.sendTemplateEmail(
      {
        templateId: templateId || 'password_reset_2024',
        category: 'authentication',
        tags: ['password-reset', 'security'],
        customArgs: { flow: 'password_reset' }
      },
      {
        to,
        dynamicTemplateData: {
          user_name: userName,
          reset_url: resetUrl,
          reset_token: resetToken,
          expiry_minutes: 60,
          timestamp: new Date().toISOString(),
          support_email: process.env.SUPPORT_EMAIL || 'support@easycashflows.com',
          company_name: 'EasyCashFlows'
        },
        categories: ['authentication'],
        customArgs: { user_action: 'password_reset_request' }
      }
    );
  }

  async sendWelcomeEmail(
    to: string,
    userName: string,
    firstName: string,
    templateId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return await this.sendTemplateEmail(
      {
        templateId: templateId || 'welcome_2024',
        category: 'onboarding',
        tags: ['welcome', 'onboarding'],
        customArgs: { flow: 'user_onboarding' }
      },
      {
        to,
        dynamicTemplateData: {
          user_name: userName,
          first_name: firstName,
          dashboard_url: `${process.env.FRONTEND_URL || 'https://easycashflows.replit.app'}/dashboard`,
          getting_started_url: `${process.env.FRONTEND_URL || 'https://easycashflows.replit.app'}/getting-started`,
          support_email: process.env.SUPPORT_EMAIL || 'support@easycashflows.com',
          company_name: 'EasyCashFlows',
          current_year: new Date().getFullYear()
        },
        categories: ['onboarding'],
        customArgs: { user_action: 'account_created' }
      }
    );
  }

  async sendFinancialAlert(
    to: string,
    alertType: 'cash_flow_low' | 'invoice_overdue' | 'expense_high' | 'custom',
    alertData: {
      title: string;
      message: string;
      amount?: number;
      dueDate?: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
    },
    templateId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return await this.sendTemplateEmail(
      {
        templateId: templateId || 'financial_alert_2024',
        category: 'alerts',
        tags: ['financial-alert', alertType],
        customArgs: { 
          flow: 'financial_monitoring',
          alert_type: alertType,
          priority: alertData.priority
        }
      },
      {
        to,
        dynamicTemplateData: {
          alert_type: alertType,
          alert_title: alertData.title,
          alert_message: alertData.message,
          amount: alertData.amount ? alertData.amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }) : null,
          due_date: alertData.dueDate,
          priority: alertData.priority,
          priority_color: this.getPriorityColor(alertData.priority),
          dashboard_url: `${process.env.FRONTEND_URL || 'https://easycashflows.replit.app'}/dashboard`,
          timestamp: new Date().toLocaleString('it-IT'),
          company_name: 'EasyCashFlows'
        },
        categories: ['alerts', alertType],
        customArgs: { 
          user_action: 'alert_triggered',
          alert_priority: alertData.priority
        }
      }
    );
  }

  async sendInvoiceNotification(
    to: string,
    invoiceData: {
      invoiceNumber: string;
      amount: number;
      dueDate: string;
      customerName: string;
      status: 'sent' | 'overdue' | 'paid';
    },
    templateId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return await this.sendTemplateEmail(
      {
        templateId: templateId || 'invoice_notification_2024',
        category: 'invoices',
        tags: ['invoice', invoiceData.status],
        customArgs: { 
          flow: 'invoice_management',
          invoice_status: invoiceData.status
        }
      },
      {
        to,
        dynamicTemplateData: {
          invoice_number: invoiceData.invoiceNumber,
          customer_name: invoiceData.customerName,
          amount: invoiceData.amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }),
          due_date: invoiceData.dueDate,
          status: invoiceData.status,
          status_color: this.getStatusColor(invoiceData.status),
          payment_url: `${process.env.FRONTEND_URL || 'https://easycashflows.replit.app'}/invoices/${invoiceData.invoiceNumber}`,
          company_name: 'EasyCashFlows'
        },
        categories: ['invoices'],
        customArgs: { 
          user_action: 'invoice_notification',
          invoice_id: invoiceData.invoiceNumber
        }
      }
    );
  }

  private getPriorityColor(priority: string): string {
    const colors = {
      low: '#10b981',      // green
      medium: '#f59e0b',   // yellow
      high: '#ef4444',     // red  
      critical: '#dc2626'  // dark red
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  }

  private getStatusColor(status: string): string {
    const colors = {
      sent: '#3b82f6',     // blue
      overdue: '#ef4444',  // red
      paid: '#10b981'      // green
    };
    return colors[status as keyof typeof colors] || colors.sent;
  }

  // Bulk operations with batch management
  async sendBulkEmails(
    template: EmailTemplate,
    recipients: Array<{ email: string; data: Record<string, any> }>
  ): Promise<{ success: boolean; results: Array<{ email: string; success: boolean; messageId?: string; error?: string }> }> {
    const results: Array<{ email: string; success: boolean; messageId?: string; error?: string }> = [];
    const batchSize = 100; // SendGrid batch limit
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchId = `batch_${Date.now()}_${i}`;
      
      for (const recipient of batch) {
        const result = await this.sendTemplateEmail(template, {
          to: recipient.email,
          dynamicTemplateData: recipient.data,
          batchId
        });
        
        results.push({
          email: recipient.email,
          success: result.success,
          messageId: result.messageId,
          error: result.error
        });

        // Rate limiting between emails
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const successCount = results.filter(r => r.success).length;
    return {
      success: successCount === recipients.length,
      results
    };
  }

  // Analytics and monitoring
  async getDeliveryStats(category?: string): Promise<{
    delivered: number;
    bounced: number;
    dropped: number;
    spam: number;
    opened: number;
    clicked: number;
  }> {
    // Note: This would typically integrate with SendGrid's Event Webhook or Stats API
    // For now, we return a placeholder structure
    return {
      delivered: 0,
      bounced: 0,
      dropped: 0,
      spam: 0,
      opened: 0,
      clicked: 0
    };
  }

  // Template validation
  async validateTemplate(templateId: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Test with minimal data
      const testResult = await this.sendTemplateEmail(
        { templateId },
        {
          to: 'test@example.com',
          dynamicTemplateData: { test: true },
          customArgs: { validation: 'true' }
        }
      );

      return { valid: testResult.success, error: testResult.error };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }
}

// Singleton instance
export const sendGridService = new SendGridEnhancedService();