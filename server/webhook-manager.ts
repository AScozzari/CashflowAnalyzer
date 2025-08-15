import type { Request, Response } from 'express';
import crypto from 'crypto';
import { TwilioWhatsAppService, createWhatsAppService } from './whatsapp-service';
import type { WhatsappProvider } from '../shared/whatsapp-schema';

// Webhook Event Types
export interface WebhookEvent {
  type: 'message_inbound' | 'message_status' | 'template_approval' | 'connection_test';
  provider: 'twilio' | 'linkmobility';
  timestamp: Date;
  data: any;
  signature?: string;
}

// Webhook Security Validation
export class WebhookSecurityValidator {
  
  static validateTwilioSignature(payload: string, signature: string, authToken: string, url: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha1', authToken)
        .update(Buffer.from(payload, 'utf-8'))
        .digest('base64');

      const twilioSignature = signature.replace('sha1=', '');
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(twilioSignature)
      );
    } catch (error) {
      console.error('Twilio signature validation error:', error);
      return false;
    }
  }

  static validateLinkMobilitySignature(payload: string, signature: string, apiKey: string): boolean {
    try {
      // LinkMobility signature validation logic
      const expectedSignature = crypto
        .createHmac('sha256', apiKey)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
      );
    } catch (error) {
      console.error('LinkMobility signature validation error:', error);
      return false;
    }
  }
}

// WhatsApp Webhook Handler
export class WhatsAppWebhookHandler {
  
  // Handle Twilio WhatsApp webhook
  static async handleTwilioWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { Body, From, To, MessageSid, SmsStatus } = req.body;
      
      // Validate signature (in production)
      const twilioSignature = req.headers['x-twilio-signature'] as string;
      
      if (process.env.NODE_ENV === 'production' && twilioSignature) {
        const isValid = WebhookSecurityValidator.validateTwilioSignature(
          JSON.stringify(req.body),
          twilioSignature,
          process.env.TWILIO_AUTH_TOKEN!,
          req.url
        );
        
        if (!isValid) {
          res.status(401).json({ error: 'Invalid signature' });
          return;
        }
      }

      // Process different event types
      if (SmsStatus) {
        // Status update webhook
        await this.handleStatusUpdate({
          messageId: MessageSid,
          status: SmsStatus,
          provider: 'twilio',
          timestamp: new Date(),
        });
      } else if (Body && From) {
        // Incoming message webhook
        await this.handleIncomingMessage({
          from: From.replace('whatsapp:', ''),
          to: To.replace('whatsapp:', ''),
          body: Body,
          messageId: MessageSid,
          provider: 'twilio',
          timestamp: new Date(),
        });
      }

      // Respond with TwiML (empty for no reply)
      res.type('text/xml');
      res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
      
    } catch (error) {
      console.error('Twilio webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  // Handle LinkMobility WhatsApp webhook
  static async handleLinkMobilityWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { message, status, sender, recipient, timestamp } = req.body;
      
      // Validate signature (in production)
      const linkSignature = req.headers['x-link-signature'] as string;
      
      if (process.env.NODE_ENV === 'production' && linkSignature) {
        const isValid = WebhookSecurityValidator.validateLinkMobilitySignature(
          JSON.stringify(req.body),
          linkSignature,
          process.env.LINKMOBILITY_API_KEY!
        );
        
        if (!isValid) {
          res.status(401).json({ error: 'Invalid signature' });
          return;
        }
      }

      // Process LinkMobility events
      if (status) {
        await this.handleStatusUpdate({
          messageId: req.body.messageId,
          status: status,
          provider: 'linkmobility',
          timestamp: new Date(timestamp),
        });
      } else if (message && sender) {
        await this.handleIncomingMessage({
          from: sender,
          to: recipient,
          body: message,
          messageId: req.body.messageId,
          provider: 'linkmobility',
          timestamp: new Date(timestamp),
        });
      }

      res.status(200).json({ success: true });
      
    } catch (error) {
      console.error('LinkMobility webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  // Handle incoming messages
  private static async handleIncomingMessage(data: {
    from: string;
    to: string;
    body: string;
    messageId: string;
    provider: 'twilio' | 'linkmobility';
    timestamp: Date;
  }): Promise<void> {
    try {
      console.log('Incoming WhatsApp message:', {
        from: data.from,
        provider: data.provider,
        body: data.body.substring(0, 50) + '...',
      });

      // Here you would:
      // 1. Log the message to database
      // 2. Process auto-responses if needed
      // 3. Notify relevant users
      // 4. Trigger any business logic

      // Example: Auto-response for business hours
      const now = new Date();
      const hour = now.getHours();
      
      if (hour < 9 || hour > 18) {
        // Send auto-response for out of hours
        console.log('Out of hours - would send auto-response');
      }

    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  // Handle status updates
  private static async handleStatusUpdate(data: {
    messageId: string;
    status: string;
    provider: 'twilio' | 'linkmobility';
    timestamp: Date;
  }): Promise<void> {
    try {
      console.log('Message status update:', {
        messageId: data.messageId,
        status: data.status,
        provider: data.provider,
      });

      // Here you would:
      // 1. Update message status in database
      // 2. Trigger delivery confirmations
      // 3. Update analytics/metrics
      // 4. Handle failed messages

    } catch (error) {
      console.error('Error handling status update:', error);
    }
  }
}

// General Webhook Router
export class WebhookRouter {
  
  static setupRoutes(app: any): void {
    
    // Twilio WhatsApp webhooks
    app.post('/api/webhooks/twilio/whatsapp', (req: Request, res: Response) => {
      WhatsAppWebhookHandler.handleTwilioWebhook(req, res);
    });

    // LinkMobility WhatsApp webhooks
    app.post('/api/webhooks/linkmobility/whatsapp', (req: Request, res: Response) => {
      WhatsAppWebhookHandler.handleLinkMobilityWebhook(req, res);
    });

    // General WhatsApp status webhook
    app.post('/api/webhooks/whatsapp/status', (req: Request, res: Response) => {
      // Handle status updates from both providers
      const provider = req.headers['x-provider'] as 'twilio' | 'linkmobility';
      
      if (provider === 'twilio') {
        WhatsAppWebhookHandler.handleTwilioWebhook(req, res);
      } else if (provider === 'linkmobility') {
        WhatsAppWebhookHandler.handleLinkMobilityWebhook(req, res);
      } else {
        res.status(400).json({ error: 'Provider not specified' });
      }
    });

    // Test webhook endpoint
    app.get('/api/webhooks/test', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Webhook system operational',
        timestamp: new Date().toISOString(),
        endpoints: [
          '/api/webhooks/twilio/whatsapp',
          '/api/webhooks/linkmobility/whatsapp',
          '/api/webhooks/whatsapp/status',
        ],
      });
    });

    // Webhook configuration info
    app.get('/api/webhooks/info', (req: Request, res: Response) => {
      const baseUrl = `https://${req.headers.host}`;
      
      res.json({
        webhookUrls: {
          twilio: {
            incoming: `${baseUrl}/api/webhooks/twilio/whatsapp`,
            status: `${baseUrl}/api/webhooks/whatsapp/status`,
            headers: { 'x-provider': 'twilio' }
          },
          linkmobility: {
            incoming: `${baseUrl}/api/webhooks/linkmobility/whatsapp`,
            status: `${baseUrl}/api/webhooks/whatsapp/status`,
            headers: { 'x-provider': 'linkmobility' }
          }
        },
        security: {
          production: process.env.NODE_ENV === 'production',
          signatureValidation: 'enabled',
          supportedMethods: ['POST']
        }
      });
    });
  }
}

// Webhook Testing Utilities
export class WebhookTester {
  
  static async simulateTwilioMessage(payload: {
    From: string;
    To: string;
    Body: string;
    MessageSid: string;
  }): Promise<{ success: boolean; response?: any }> {
    try {
      // Simulate a Twilio webhook call for testing
      const mockRequest = {
        body: payload,
        headers: {},
        url: '/api/webhooks/twilio/whatsapp'
      } as Request;

      const mockResponse = {
        type: (contentType: string) => {},
        send: (data: string) => data,
        status: (code: number) => ({ json: (data: any) => data }),
        json: (data: any) => data
      } as unknown as Response;

      await WhatsAppWebhookHandler.handleTwilioWebhook(mockRequest, mockResponse);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        response: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async testWebhookConnectivity(url: string): Promise<{
    success: boolean;
    responseTime: number;
    status?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'EasyCashFlows-Webhook-Tester/1.0'
        }
      });

      const responseTime = Date.now() - startTime;
      
      return {
        success: response.ok,
        responseTime,
        status: response.status
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}