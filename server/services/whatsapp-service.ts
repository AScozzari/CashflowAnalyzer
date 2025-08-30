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

// Enhanced Message Interface - Full Twilio API Support
export interface WhatsAppMessage {
  to: string; // +393451234567 format
  type: 'text' | 'template' | 'media' | 'location' | 'contacts' | 'interactive';
  content: {
    // Text messages
    body?: string;
    
    // Template messages
    templateName?: string;
    templateLanguage?: string;
    templateVariables?: Record<string, string>;
    
    // Media messages
    mediaUrl?: string;
    mediaType?: 'image' | 'document' | 'audio' | 'video';
    caption?: string;
    filename?: string;
    
    // Location messages
    latitude?: number;
    longitude?: number;
    address?: string;
    name?: string;
    
    // Contact messages
    contacts?: ContactCard[];
    
    // Interactive messages (buttons, lists)
    interactive?: InteractiveMessage;
  };
  
  // Scheduling support
  scheduleTime?: Date;
  
  // Messaging Service options
  messagingServiceSid?: string;
  forceDelivery?: boolean;
  
  metadata?: {
    clientReference?: string;
    trackingId?: string;
    priority?: 'high' | 'normal';
    tags?: string[];
  };
}

// Contact Card Interface
export interface ContactCard {
  name: {
    formatted_name: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    suffix?: string;
    prefix?: string;
  };
  phones?: Array<{
    phone: string;
    type?: string;
    wa_id?: string;
  }>;
  emails?: Array<{
    email: string;
    type?: string;
  }>;
  urls?: Array<{
    url: string;
    type?: string;
  }>;
  addresses?: Array<{
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    country_code?: string;
    type?: string;
  }>;
  org?: {
    company?: string;
    department?: string;
    title?: string;
  };
  birthday?: string;
}

// Interactive Message Interface
export interface InteractiveMessage {
  type: 'button' | 'list';
  header?: {
    type: 'text' | 'image' | 'video' | 'document';
    text?: string;
    media?: {
      id?: string;
      link?: string;
      caption?: string;
      filename?: string;
    };
  };
  body: {
    text: string;
  };
  footer?: {
    text: string;
  };
  action: {
    buttons?: Array<{
      type: 'reply';
      reply: {
        id: string;
        title: string;
      };
    }>;
    button?: string;
    sections?: Array<{
      title?: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>;
  };
}

// Enhanced Message Response Interface
export interface MessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: number;
  provider: 'twilio' | 'linkmobility';
  
  // Pricing and analytics
  cost?: number;
  currency?: string;
  numSegments?: number;
  
  // Timing
  estimatedDelivery?: Date;
  scheduledFor?: Date;
  
  // Status tracking
  status?: 'queued' | 'sending' | 'sent' | 'failed' | 'delivered' | 'undelivered' | 'accepted' | 'scheduled';
  direction?: 'outbound-api' | 'outbound-call' | 'outbound-reply' | 'inbound';
  
  // Messaging Service info
  messagingServiceSid?: string;
  
  // Additional metadata
  uri?: string;
  subresourceUris?: Record<string, string>;
  dateCreated?: Date;
  dateSent?: Date;
  dateUpdated?: Date;
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

  // Enhanced Twilio 2024 API Implementation - Full Feature Support
  private async sendViaTwilio(message: WhatsAppMessage, config: TwilioConfig): Promise<MessageResponse> {
    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
    const whatsappNumber = this.settings!.whatsappNumber || '+15558237341';
    
    let requestBody: any = {
      To: `whatsapp:${message.to}`,
      From: `whatsapp:${whatsappNumber}`
    };
    
    // Add Messaging Service if configured
    const messagingServiceSid = message.messagingServiceSid || config.messagingServiceSid;
    if (messagingServiceSid) {
      requestBody.MessagingServiceSid = messagingServiceSid;
    }
    
    // Handle different message types
    switch (message.type) {
      case 'template':
        const templateResult = await this.handleTemplateMessage(message, requestBody);
        if (!templateResult.success) return templateResult;
        break;
        
      case 'media':
        this.handleMediaMessage(message, requestBody);
        break;
        
      case 'location':
        this.handleLocationMessage(message, requestBody);
        break;
        
      case 'contacts':
        this.handleContactsMessage(message, requestBody);
        break;
        
      case 'interactive':
        this.handleInteractiveMessage(message, requestBody);
        break;
        
      case 'text':
      default:
        requestBody.Body = message.content.body;
        break;
    }
    
    // Add scheduling if specified
    if (message.scheduleTime) {
      requestBody.SendAt = message.scheduleTime.toISOString();
    }
    
    // Add metadata
    if (message.metadata?.clientReference) {
      requestBody.ProvideFeedback = 'true';
    }

    try {
      const response = await fetch(`${config.baseUrl}/${config.apiVersion}/Accounts/${config.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams(requestBody)
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.message || `Twilio error: ${response.status}`,
          errorCode: data.code,
          provider: 'twilio'
        };
      }

      // Enhanced response with full Twilio data
      return {
        success: true,
        messageId: data.sid,
        provider: 'twilio',
        
        // Pricing info
        cost: parseFloat(data.price || '0'),
        currency: data.price_unit || 'USD',
        numSegments: parseInt(data.num_segments || '1'),
        
        // Status info
        status: data.status as any,
        direction: data.direction as any,
        
        // Timing
        dateCreated: data.date_created ? new Date(data.date_created) : new Date(),
        dateSent: data.date_sent ? new Date(data.date_sent) : undefined,
        dateUpdated: data.date_updated ? new Date(data.date_updated) : undefined,
        estimatedDelivery: new Date(Date.now() + 30000),
        scheduledFor: message.scheduleTime,
        
        // Additional metadata
        messagingServiceSid: data.messaging_service_sid,
        uri: data.uri,
        subresourceUris: data.subresource_uris
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        provider: 'twilio'
      };
    }
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

  // Helper methods for different message types
  private async handleTemplateMessage(message: WhatsAppMessage, requestBody: any): Promise<MessageResponse | { success: true }> {
    const templates = await this.storage.getWhatsappTemplates();
    const template = templates.find(t => t.name === message.content.templateName);
    
    if (!template || !template.contentSid) {
      return {
        success: false,
        error: `Template "${message.content.templateName}" not found or not approved`,
        provider: 'twilio'
      };
    }
    
    requestBody.ContentSid = template.contentSid;
    if (message.content.templateVariables && Object.keys(message.content.templateVariables).length > 0) {
      requestBody.ContentVariables = JSON.stringify(message.content.templateVariables);
    }
    
    return { success: true };
  }

  private handleMediaMessage(message: WhatsAppMessage, requestBody: any): void {
    if (message.content.mediaUrl) {
      requestBody.MediaUrl = message.content.mediaUrl;
    }
    if (message.content.body || message.content.caption) {
      requestBody.Body = message.content.body || message.content.caption;
    }
  }

  private handleLocationMessage(message: WhatsAppMessage, requestBody: any): void {
    if (message.content.latitude && message.content.longitude) {
      requestBody.Body = `📍 ${message.content.name || 'Location'}\n${message.content.address || ''}`;
      requestBody.PersistentAction = JSON.stringify([
        {
          type: 'location',
          latitude: message.content.latitude,
          longitude: message.content.longitude,
          name: message.content.name,
          address: message.content.address
        }
      ]);
    }
  }

  private handleContactsMessage(message: WhatsAppMessage, requestBody: any): void {
    if (message.content.contacts && message.content.contacts.length > 0) {
      const vcards = message.content.contacts.map(contact => this.formatVCard(contact));
      requestBody.Body = vcards.join('\n\n');
      requestBody.MediaUrl = 'data:text/vcard;base64,' + Buffer.from(vcards.join('\n\n')).toString('base64');
    }
  }

  private handleInteractiveMessage(message: WhatsAppMessage, requestBody: any): void {
    if (message.content.interactive) {
      requestBody.Body = message.content.interactive.body.text;
      if (message.content.interactive.footer) {
        requestBody.Body += '\n\n' + message.content.interactive.footer.text;
      }
    }
  }

  private formatVCard(contact: ContactCard): string {
    let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
    
    vcard += `FN:${contact.name.formatted_name}\n`;
    if (contact.name.first_name || contact.name.last_name) {
      vcard += `N:${contact.name.last_name || ''};${contact.name.first_name || ''};;;\n`;
    }
    
    if (contact.phones) {
      contact.phones.forEach(phone => {
        vcard += `TEL;TYPE=${phone.type || 'CELL'}:${phone.phone}\n`;
      });
    }
    
    if (contact.emails) {
      contact.emails.forEach(email => {
        vcard += `EMAIL;TYPE=${email.type || 'INTERNET'}:${email.email}\n`;
      });
    }
    
    if (contact.org) {
      vcard += `ORG:${contact.org.company || ''}\n`;
      if (contact.org.title) {
        vcard += `TITLE:${contact.org.title}\n`;
      }
    }
    
    vcard += 'END:VCARD';
    return vcard;
  }

  // ===== CONTENT API METHODS =====
  
  // Fetch message by SID
  async fetchMessage(messageSid: string): Promise<any> {
    const config = this.getProviderConfig() as TwilioConfig;
    if (!config) throw new Error('Twilio not configured');
    
    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
    
    const response = await fetch(`${config.baseUrl}/${config.apiVersion}/Accounts/${config.accountSid}/Messages/${messageSid}.json`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch message: ${response.status}`);
    }
    
    return response.json();
  }

  // List all messages with filters
  async listMessages(filters?: {
    to?: string;
    from?: string;
    dateSent?: string;
    limit?: number;
  }): Promise<any[]> {
    const config = this.getProviderConfig() as TwilioConfig;
    if (!config) throw new Error('Twilio not configured');
    
    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
    const params = new URLSearchParams();
    
    if (filters?.to) params.append('To', filters.to);
    if (filters?.from) params.append('From', filters.from);
    if (filters?.dateSent) params.append('DateSent', filters.dateSent);
    if (filters?.limit) params.append('PageSize', filters.limit.toString());
    
    const response = await fetch(`${config.baseUrl}/${config.apiVersion}/Accounts/${config.accountSid}/Messages.json?${params}`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to list messages: ${response.status}`);
    }
    
    const data = await response.json();
    return data.messages || [];
  }

  // Create Content API template
  async createContentTemplate(template: {
    friendlyName: string;
    language: string;
    variables?: Record<string, string>;
    types: {
      'twilio/text'?: { body: string };
      'twilio/media'?: { body: string; media?: string[] };
      'twilio/location'?: { latitude: number; longitude: number; label?: string };
      'twilio/quick-reply'?: { body: string; actions: Array<{ title: string; id: string }> };
      'twilio/call-to-action'?: { body: string; actions: Array<{ title: string; url: string }> };
    };
  }): Promise<any> {
    const config = this.getProviderConfig() as TwilioConfig;
    if (!config) throw new Error('Twilio not configured');
    
    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
    
    const response = await fetch('https://content.twilio.com/v1/Content', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(template)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create template: ${response.status}`);
    }
    
    return response.json();
  }

  // Get Content API template
  async getContentTemplate(contentSid: string): Promise<any> {
    const config = this.getProviderConfig() as TwilioConfig;
    if (!config) throw new Error('Twilio not configured');
    
    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
    
    const response = await fetch(`https://content.twilio.com/v1/Content/${contentSid}`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.status}`);
    }
    
    return response.json();
  }

  // List all Content API templates
  async listContentTemplates(): Promise<any[]> {
    const config = this.getProviderConfig() as TwilioConfig;
    if (!config) throw new Error('Twilio not configured');
    
    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
    
    const response = await fetch('https://content.twilio.com/v1/Content', {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to list templates: ${response.status}`);
    }
    
    const data = await response.json();
    return data.contents || [];
  }

  // Submit template for WhatsApp approval
  async submitForApproval(contentSid: string): Promise<any> {
    const config = this.getProviderConfig() as TwilioConfig;
    if (!config) throw new Error('Twilio not configured');
    
    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
    
    const response = await fetch(`https://content.twilio.com/v1/Content/${contentSid}/ApprovalRequests/whatsapp`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit for approval: ${response.status}`);
    }
    
    return response.json();
  }

  // ===== MESSAGING SERVICES METHODS =====
  
  // Create Messaging Service
  async createMessagingService(options: {
    friendlyName: string;
    inboundRequestUrl?: string;
    inboundMethod?: 'GET' | 'POST';
    fallbackUrl?: string;
    statusCallback?: string;
    useInboundWebhookOnNumber?: boolean;
  }): Promise<any> {
    const config = this.getProviderConfig() as TwilioConfig;
    if (!config) throw new Error('Twilio not configured');
    
    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
    
    const response = await fetch(`${config.baseUrl}/${config.apiVersion}/Accounts/${config.accountSid}/Services.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(options as any)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create messaging service: ${response.status}`);
    }
    
    return response.json();
  }

  // Add phone number to Messaging Service
  async addPhoneNumberToService(serviceSid: string, phoneNumberSid: string): Promise<any> {
    const config = this.getProviderConfig() as TwilioConfig;
    if (!config) throw new Error('Twilio not configured');
    
    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
    
    const response = await fetch(`${config.baseUrl}/${config.apiVersion}/Accounts/${config.accountSid}/Services/${serviceSid}/PhoneNumbers.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ PhoneNumberSid: phoneNumberSid })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add phone number to service: ${response.status}`);
    }
    
    return response.json();
  }

  // Schedule message using Messaging Service
  async scheduleMessage(message: WhatsAppMessage & { scheduleTime: Date }): Promise<MessageResponse> {
    // Override the message type to add scheduling
    const enhancedMessage = {
      ...message,
      scheduleTime: message.scheduleTime
    };
    
    return this.sendMessage(enhancedMessage);
  }

  // ===== ANALYTICS & MONITORING =====
  
  // Get message analytics
  async getMessageAnalytics(period: '24h' | '7d' | '30d' = '24h'): Promise<{
    totalMessages: number;
    sentMessages: number;
    deliveredMessages: number;
    failedMessages: number;
    totalCost: number;
    averageDeliveryTime: number;
    topDestinations: Array<{ country: string; count: number }>;
  }> {
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
    }
    
    const messages = await this.listMessages({
      dateSent: startDate.toISOString().split('T')[0],
      limit: 1000
    });
    
    // Analyze messages
    const totalMessages = messages.length;
    const sentMessages = messages.filter(m => ['sent', 'delivered'].includes(m.status)).length;
    const deliveredMessages = messages.filter(m => m.status === 'delivered').length;
    const failedMessages = messages.filter(m => m.status === 'failed').length;
    const totalCost = messages.reduce((sum, m) => sum + parseFloat(m.price || '0'), 0);
    
    // Calculate average delivery time (simplified)
    const averageDeliveryTime = 30; // seconds, would be calculated from actual timestamps
    
    // Top destinations analysis
    const destinationCounts: Record<string, number> = {};
    messages.forEach(m => {
      const country = m.to?.startsWith('+39') ? 'Italy' : 'Other';
      destinationCounts[country] = (destinationCounts[country] || 0) + 1;
    });
    
    const topDestinations = Object.entries(destinationCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      totalMessages,
      sentMessages,
      deliveredMessages,
      failedMessages,
      totalCost,
      averageDeliveryTime,
      topDestinations
    };
  }

  // Enhanced error handling with detailed Twilio error codes
  private handleTwilioError(error: any): MessageResponse {
    const errorMappings: Record<number, string> = {
      20003: 'Insufficient permissions to send message',
      21211: 'Invalid phone number format',
      21408: 'Permission to send an SMS has not been enabled',
      21610: 'Attempt to send to unsubscribed recipient',
      30001: 'Message queue is full',
      30002: 'Account suspended',
      30003: 'Unreachable destination handset',
      30004: 'Message blocked by carrier',
      30005: 'Unknown destination handset',
      30006: 'Landline or unreachable carrier',
      30007: 'Carrier violation',
      30008: 'Unknown error',
      63016: 'Failed to send freeform message because you are outside the allowed window. Please use a Message Template.'
    };
    
    return {
      success: false,
      error: errorMappings[error.code] || error.message || 'Unknown error',
      errorCode: error.code,
      provider: 'twilio'
    };
  }
}

// Export singleton instance
// Export singleton instance will be initialized in routes
export const whatsappService = new WhatsAppService(storage);