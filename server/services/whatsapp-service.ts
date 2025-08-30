// WhatsApp Business Service - Unified Twilio 2024 & LinkMobility Implementation
import { storage } from '../storage';
import type { WhatsappSettings, WhatsappTemplate } from '../shared/schema';

// Twilio API Configuration
export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  apiVersion: '2010-04-01'; // 🔥 FIX: Twilio API version corretta
  baseUrl: 'https://api.twilio.com';
  messagingServiceSid?: string; // Twilio Messaging Service
}

// LinkMobility Configuration
export interface LinkMobilityConfig {
  apiKey: string;
  endpoint: string;
  platformId: string; // EU platform identifier
}

// Unified Message Interface
export interface WhatsAppMessage {
  to: string; // +393451234567 format
  type: 'text' | 'template' | 'media';
  content: {
    body?: string;
    templateName?: string;
    templateLanguage?: string;
    templateVariables?: Record<string, string>;
    mediaUrl?: string;
    mediaType?: 'image' | 'document' | 'audio' | 'video';
  };
  metadata?: {
    clientReference?: string;
    trackingId?: string;
    priority?: 'high' | 'normal';
  };
}

// Message Response Interface
export interface MessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'twilio' | 'linkmobility';
  cost?: number;
  estimatedDelivery?: Date;
}

// Template Status Check Interface  
export interface TemplateStatus {
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  language: string;
  category: string;
  rejectionReason?: string;
  approvedAt?: Date;
}

export class WhatsAppService {
  private storage: typeof storage;
  private settings: WhatsappSettings | null = null;

  constructor(storageInstance: typeof storage) {
    this.storage = storageInstance;
  }

  // Initialize service with current settings
  async initialize(): Promise<void> {
    const settingsData = await this.storage.getWhatsappSettings();
    if (settingsData.length > 0) {
      this.settings = settingsData[0];
    }
  }

  // Get current provider configuration
  private getProviderConfig(): TwilioConfig | LinkMobilityConfig | null {
    if (!this.settings) return null;

    if (this.settings.provider === 'twilio') {
      // Use environment variables if database credentials are empty
      const accountSid = this.settings.accountSid || process.env.TWILIO_ACCOUNT_SID;
      const authToken = this.settings.authToken || process.env.TWILIO_AUTH_TOKEN;
      
      if (!accountSid || !authToken) {
        return null; // No credentials available
      }
      
      const config: TwilioConfig = {
        accountSid,
        authToken,
        apiVersion: '2010-04-01', // 🔥 FIX: Versione API Twilio corretta
        baseUrl: 'https://api.twilio.com'
      };
      
      // Aggiungi MessagingServiceSid solo se effettivamente configurato
      const messagingServiceSid = (this.settings as any).messaging_service_sid || (this.settings as any).messagingServiceSid;
      if (messagingServiceSid && messagingServiceSid !== null && messagingServiceSid !== 'undefined') {
        config.messagingServiceSid = messagingServiceSid;
      }
      
      return config;
    }

    if (this.settings.provider === 'linkmobility') {
      return {
        apiKey: this.settings.apiKey!,
        endpoint: this.settings.linkMobilityEndpoint!,
        platformId: 'EU'
      } as LinkMobilityConfig;
    }

    return null;
  }

  // Send message via active provider
  async sendMessage(message: WhatsAppMessage): Promise<MessageResponse> {
    const config = this.getProviderConfig();
    if (!config || !this.settings) {
      return {
        success: false,
        error: 'WhatsApp service not configured',
        provider: this.settings?.provider || 'twilio'
      };
    }

    try {
      if (this.settings.provider === 'twilio') {
        return await this.sendViaTwilio(message, config as TwilioConfig);
      } else {
        return await this.sendViaLinkMobility(message, config as LinkMobilityConfig);
      }
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.settings.provider
      };
    }
  }

  // Twilio 2024 API Implementation
  private async sendViaTwilio(message: WhatsAppMessage, config: TwilioConfig): Promise<MessageResponse> {
    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
    
    // Use new Twilio Content API for templates (2024)
    let requestBody: any;
    
    if (message.type === 'template') {
      // Get template from database to find ContentSid
      const templates = await this.storage.getWhatsappTemplates();
      const template = templates.find(t => t.name === message.content.templateName);
      
      if (!template || !template.contentSid) {
        return {
          success: false,
          error: `Template "${message.content.templateName}" not found or not approved`,
          provider: 'twilio'
        };
      }
      
      // Get WhatsApp number (use configured number or fallback)
      const whatsappNumber = this.settings!.whatsappNumber || '+15558237341'; // Twilio sandbox
      
      // New Template API format (2024)
      requestBody = {
        To: `whatsapp:${message.to}`,
        From: `whatsapp:${whatsappNumber}`,
        ContentSid: template.contentSid, // Use actual ContentSid from database
        ContentVariables: JSON.stringify(message.content.templateVariables || {})
      };
      // Aggiungi MessagingServiceSid solo se configurato
      if (config.messagingServiceSid) {
        requestBody.MessagingServiceSid = config.messagingServiceSid;
      }
    } else if (message.type === 'media') {
      requestBody = {
        To: `whatsapp:${message.to}`,
        From: `whatsapp:${this.settings!.whatsappNumber}`,
        MediaUrl: message.content.mediaUrl,
        Body: message.content.body || ''
      };
      // Aggiungi MessagingServiceSid solo se configurato
      if (config.messagingServiceSid) {
        requestBody.MessagingServiceSid = config.messagingServiceSid;
      }
    } else {
      // Text message (MessagingServiceSid opzionale per messaggi semplici)
      requestBody = {
        To: `whatsapp:${message.to}`,
        From: `whatsapp:${this.settings!.whatsappNumber}`,
        Body: message.content.body
      };
      
      // Aggiungi MessagingServiceSid solo se configurato
      if (config.messagingServiceSid) {
        requestBody.MessagingServiceSid = config.messagingServiceSid;
      }
    }

    const response = await fetch(`${config.baseUrl}/${config.apiVersion}/Accounts/${config.accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || `Twilio error: ${response.status}`,
        provider: 'twilio'
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.sid,
      provider: 'twilio',
      cost: parseFloat(data.price || '0'),
      estimatedDelivery: new Date(Date.now() + 30000) // 30s estimate
    };
  }

  // LinkMobility Implementation
  private async sendViaLinkMobility(message: WhatsAppMessage, config: LinkMobilityConfig): Promise<MessageResponse> {
    const requestBody = {
      platformId: config.platformId,
      platformPartnerId: this.settings!.whatsappBusinessAccountId,
      source: this.settings!.whatsappNumber,
      destination: message.to,
      userData: message.metadata?.clientReference || '',
      
      // Message content based on type
      ...(message.type === 'template' ? {
        useTemplate: true,
        templateName: message.content.templateName,
        templateLanguage: message.content.templateLanguage || 'it',
        templateData: message.content.templateVariables || {}
      } : {
        message: message.content.body || '',
        mediaUrl: message.content.mediaUrl
      })
    };

    const response = await fetch(`${config.endpoint}/whatsapp/v1/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || `LinkMobility error: ${response.status}`,
        provider: 'linkmobility'
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messageId,
      provider: 'linkmobility',
      cost: data.cost,
      estimatedDelivery: new Date(data.estimatedDeliveryTime)
    };
  }

  // Get template status from provider
  async getTemplateStatus(templateName: string): Promise<TemplateStatus | null> {
    const config = this.getProviderConfig();
    if (!config || !this.settings) return null;

    try {
      if (this.settings.provider === 'twilio') {
        return await this.getTwilioTemplateStatus(templateName, config as TwilioConfig);
      } else {
        return await this.getLinkMobilityTemplateStatus(templateName, config as LinkMobilityConfig);
      }
    } catch (error) {
      console.error('Template status check error:', error);
      return null;
    }
  }

  // Twilio Template Status (2024 Content API)
  private async getTwilioTemplateStatus(templateName: string, config: TwilioConfig): Promise<TemplateStatus | null> {
    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
    
    const response = await fetch(`${config.baseUrl}/${config.apiVersion}/Accounts/${config.accountSid}/Content.json`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    const template = data.contents.find((t: any) => t.friendly_name === templateName);
    
    if (!template) return null;

    return {
      name: template.friendly_name,
      status: template.approval_requests?.[0]?.status || 'pending',
      language: template.language,
      category: template.content_type,
      rejectionReason: template.approval_requests?.[0]?.rejection_reason,
      approvedAt: template.approval_requests?.[0]?.date_approved ? 
        new Date(template.approval_requests[0].date_approved) : undefined
    };
  }

  // LinkMobility Template Status
  private async getLinkMobilityTemplateStatus(templateName: string, config: LinkMobilityConfig): Promise<TemplateStatus | null> {
    const response = await fetch(`${config.endpoint}/whatsapp/v1/templates/${templateName}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return null;

    const template = await response.json();
    return {
      name: template.name,
      status: template.status,
      language: template.language,
      category: template.category,
      rejectionReason: template.rejectionReason,
      approvedAt: template.approvedAt ? new Date(template.approvedAt) : undefined
    };
  }

  // Test connection to provider
  async testConnection(): Promise<{ success: boolean; error?: string; latency?: number }> {
    const startTime = Date.now();
    const config = this.getProviderConfig();
    
    if (!config || !this.settings) {
      return { success: false, error: 'Service not configured' };
    }

    try {
      if (this.settings.provider === 'twilio') {
        const auth = Buffer.from(`${(config as TwilioConfig).accountSid}:${(config as TwilioConfig).authToken}`).toString('base64');
        const response = await fetch(`${(config as TwilioConfig).baseUrl}/${(config as TwilioConfig).apiVersion}/Accounts/${(config as TwilioConfig).accountSid}.json`, {
          headers: { 'Authorization': `Basic ${auth}` }
        });
        
        return {
          success: response.ok,
          error: response.ok ? undefined : `HTTP ${response.status}`,
          latency: Date.now() - startTime
        };
      } else {
        const response = await fetch(`${(config as LinkMobilityConfig).endpoint}/health`, {
          headers: { 'Authorization': `Bearer ${(config as LinkMobilityConfig).apiKey}` }
        });
        
        return {
          success: response.ok,
          error: response.ok ? undefined : `HTTP ${response.status}`,
          latency: Date.now() - startTime
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
        latency: Date.now() - startTime
      };
    }
  }

  // Update last test timestamp
  async updateLastTest(): Promise<void> {
    if (this.settings) {
      await this.storage.updateWhatsappSettings(this.settings.id, {
        updatedAt: new Date()
      });
    }
  }

  // Get service statistics
  async getStats(): Promise<{
    provider: string;
    isActive: boolean;
    lastTest?: Date;
    lastMessage?: Date;
    approvedTemplates: number;
    pendingTemplates: number;
  }> {
    if (!this.settings) {
      return {
        provider: 'none',
        isActive: false,
        approvedTemplates: 0,
        pendingTemplates: 0
      };
    }

    const templates = await this.storage.getWhatsappTemplates();
    const approved = templates.filter((t: any) => t.status === 'approved').length;
    const pending = templates.filter((t: any) => t.status === 'pending').length;

    return {
      provider: this.settings.provider,
      isActive: this.settings.isActive,
      lastTest: this.settings.updatedAt || undefined,
      lastMessage: this.settings.updatedAt || undefined,
      approvedTemplates: approved,
      pendingTemplates: pending
    };
  }
}

// Export singleton instance
// Export singleton instance will be initialized in routes
export const whatsappService = new WhatsAppService(storage);