import { SendGridEnhancedService } from './services/sendgrid-enhanced';

export class EmailService {
  private static instance: EmailService;
  private sendGridService: SendGridEnhancedService;

  private constructor() {
    this.sendGridService = new SendGridEnhancedService();
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.sendGridService.initialize();
      console.log('[EmailService] ✅ Initialized with SendGrid Enhanced service');
    } catch (error) {
      console.error('[EmailService] ❌ Initialization failed:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(userEmail: string, resetToken: string, userName: string): Promise<boolean> {
    try {
      await this.initialize();
      
      const result = await this.sendGridService.sendPasswordResetEmail(
        userEmail,
        resetToken,
        userName
      );
      
      return result.success;
    } catch (error) {
      console.error('[EmailService] Failed to send password reset email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string, firstName: string): Promise<boolean> {
    try {
      await this.initialize();
      
      const result = await this.sendGridService.sendWelcomeEmail(
        userEmail,
        userName,
        firstName
      );
      
      return result.success;
    } catch (error) {
      console.error('[EmailService] Failed to send welcome email:', error);
      return false;
    }
  }

  async sendFinancialAlert(
    userEmail: string,
    alertType: 'cash_flow_low' | 'invoice_overdue' | 'expense_high' | 'custom',
    alertData: {
      title: string;
      message: string;
      amount?: number;
      dueDate?: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
    }
  ): Promise<boolean> {
    try {
      await this.initialize();
      
      const result = await this.sendGridService.sendFinancialAlert(
        userEmail,
        alertType,
        alertData
      );
      
      return result.success;
    } catch (error) {
      console.error('[EmailService] Failed to send financial alert:', error);
      return false;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.initialize();
      return await this.sendGridService.testConnection();
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to initialize email service'
      };
    }
  }

  // Delegate other methods to SendGridEnhancedService
  async getDeliveryStats(category?: string) {
    await this.initialize();
    return await this.sendGridService.getDeliveryStats(category);
  }

  async sendBulkEmails(emails: any[]) {
    await this.initialize();
    return await this.sendGridService.sendBulkEmails(emails);
  }
}