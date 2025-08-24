import type { Request, Response } from 'express';
import crypto from 'crypto';
import { TwilioWhatsAppService, createWhatsAppService } from './whatsapp-service';
import { AIWebhookHandler, BusinessHoursHandler } from './ai-webhook-handler';
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

// WhatsApp Webhook Handler with AI Integration
export class WhatsAppWebhookHandler {
  private static aiHandler: AIWebhookHandler | null = null;

  // Initialize AI handler with storage
  static initializeAI(storage: any): void {
    this.aiHandler = new AIWebhookHandler(storage);
  }
  
  // Handle Twilio WhatsApp webhook (2024 API Compatible)
  static async handleTwilioWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { Body, From, To, MessageSid, SmsStatus, AccountSid, MessagingServiceSid } = req.body;
      
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

  // Handle incoming messages with AI integration
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
        timestamp: data.timestamp
      });

      // 1. Try AI-powered response first
      if (this.aiHandler) {
        const aiResult = await this.aiHandler.analyzeAndRespond(data);
        
        if (aiResult.shouldRespond && aiResult.confidence > 0.7) {
          console.log('AI Response sent:', {
            confidence: aiResult.confidence,
            response: aiResult.response
          });
          return;
        }
      }

      // 2. Fallback to common scenario handling
      if (this.aiHandler) {
        const commonResponse = await this.aiHandler.handleCommonScenarios(data);
        if (commonResponse) {
          console.log('Common scenario response sent');
          return;
        }
      }

      // 3. Business hours auto-response
      if (!BusinessHoursHandler.isBusinessHours()) {
        const businessHoursMsg = BusinessHoursHandler.getBusinessHoursMessage();
        console.log('Business hours auto-response:', businessHoursMsg);
        
        // Send business hours response
        if (this.aiHandler) {
          await this.aiHandler.sendResponse(data, businessHoursMsg);
        }
      }

      // 4. Log message for manual handling
      console.log('Message logged for manual handling:', {
        messageId: data.messageId,
        needsResponse: !BusinessHoursHandler.isBusinessHours()
      });

      // 5. Create notification for incoming WhatsApp
      try {
        const { notificationService } = await import('../services/notification-service');
        const recipients = await notificationService.determineNotificationRecipients({
          userId: '', 
          type: 'new_whatsapp',
          category: 'whatsapp',
          from: data.from,
          originalContent: data.body,
          channelProvider: data.provider === 'twilio' ? 'twilio' : 'linkmobility',
          messageId: data.messageId
        });
        
        for (const userId of recipients) {
          await notificationService.createCommunicationNotification({
            userId,
            type: 'new_whatsapp',
            category: 'whatsapp',
            from: data.from,
            originalContent: data.body,
            channelProvider: data.provider === 'twilio' ? 'twilio' : 'linkmobility',
            messageId: data.messageId
          });
        }
      } catch (notificationError) {
        console.error('Error creating WhatsApp notification:', notificationError);
      }

    } catch (error) {
      console.error('Error handling incoming message:', error);
      
      // Send fallback error response
      try {
        if (this.aiHandler) {
          await this.aiHandler.sendResponse(data, 
            "Messaggio ricevuto. Ti ricontatteremo appena possibile. Grazie!"
          );
        }
      } catch (fallbackError) {
        console.error('Fallback response failed:', fallbackError);
      }
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

// SMS Webhook Handler
export class SMSWebhookHandler {
  private static aiHandler: AIWebhookHandler | null = null;

  static initializeAI(storage: any): void {
    this.aiHandler = new AIWebhookHandler(storage);
  }

  // Handle Skebby SMS webhook
  static async handleSkebbyWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { phone, message, timestamp, status, orderId } = req.body;
      
      if (status) {
        // Status update webhook
        await this.handleStatusUpdate({
          messageId: orderId,
          status: status,
          provider: 'skebby',
          timestamp: new Date(timestamp),
        });
      } else if (message && phone) {
        // Incoming SMS webhook
        await this.handleIncomingSMS({
          from: phone,
          body: message,
          messageId: orderId || crypto.randomUUID(),
          provider: 'skebby',
          timestamp: new Date(timestamp || Date.now()),
        });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Skebby SMS webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  private static async handleIncomingSMS(data: {
    from: string;
    body: string;
    messageId: string;
    provider: 'skebby';
    timestamp: Date;
  }): Promise<void> {
    try {
      console.log('Incoming SMS message:', {
        from: data.from,
        provider: data.provider,
        body: data.body.substring(0, 50) + '...',
        timestamp: data.timestamp
      });

      // AI-powered SMS response
      if (this.aiHandler) {
        const aiResult = await this.aiHandler.analyzeAndRespond({
          from: data.from,
          to: '', // SMS doesn't have "to" in the same way
          body: data.body,
          provider: 'twilio', // Use twilio as fallback for AI handler
          timestamp: data.timestamp
        });

        if (aiResult.shouldRespond && aiResult.confidence > 0.7) {
          console.log('SMS AI Response sent:', {
            confidence: aiResult.confidence,
            response: aiResult.response
          });
          
          // Send SMS response using SMS service
          const { smsResponseService } = await import('../services/sms-response-service');
          if (aiResult.response) {
            await smsResponseService.sendSMSResponse(data.from, aiResult.response);
            
            // Create notification for incoming SMS
            const { notificationService } = await import('../services/notification-service');
            const recipients = await notificationService.determineNotificationRecipients({
              userId: '', 
              type: 'new_sms',
              category: 'sms',
              from: data.from,
              originalContent: data.body,
              channelProvider: 'skebby',
              messageId: data.messageId
            });
            
            for (const userId of recipients) {
              await notificationService.createCommunicationNotification({
                userId,
                type: 'new_sms',
                category: 'sms',
                from: data.from,
                originalContent: data.body,
                channelProvider: 'skebby',
                messageId: data.messageId
              });
            }
          }
        } else {
          // Send business hours or auto-reply
          const { smsResponseService } = await import('../services/sms-response-service');
          const { BusinessHoursHandler } = await import('../ai-webhook-handler');
          
          if (!BusinessHoursHandler.isBusinessHours()) {
            await smsResponseService.sendBusinessHoursResponse(data.from);
          } else {
            await smsResponseService.sendAutoReply(data.from, data.body);
          }
        }
      }
    } catch (error) {
      console.error('Error handling incoming SMS:', error);
    }
  }

  private static async handleStatusUpdate(data: {
    messageId: string;
    status: string;
    provider: 'skebby';
    timestamp: Date;
  }): Promise<void> {
    try {
      console.log('SMS status update:', {
        messageId: data.messageId,
        status: data.status,
        provider: data.provider,
      });
    } catch (error) {
      console.error('Error handling SMS status update:', error);
    }
  }
}

// Email Webhook Handler
export class EmailWebhookHandler {
  private static aiHandler: AIWebhookHandler | null = null;

  static initializeAI(storage: any): void {
    this.aiHandler = new AIWebhookHandler(storage);
  }

  // Handle SendGrid Inbound Parse webhook
  static async handleSendGridWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { from, to, subject, text, html, timestamp, attachments } = req.body;
      
      await this.handleIncomingEmail({
        from: from,
        to: to,
        subject: subject,
        body: text || html,
        messageId: crypto.randomUUID(),
        provider: 'sendgrid',
        timestamp: new Date(timestamp || Date.now()),
        attachments: attachments
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('SendGrid email webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  private static async handleIncomingEmail(data: {
    from: string;
    to: string;
    subject: string;
    body: string;
    messageId: string;
    provider: 'sendgrid';
    timestamp: Date;
    attachments?: any[];
  }): Promise<void> {
    try {
      console.log('Incoming email:', {
        from: data.from,
        subject: data.subject,
        provider: data.provider,
        timestamp: data.timestamp
      });

      // AI-powered email response (could be implemented later)
      if (this.aiHandler) {
        const aiResult = await this.aiHandler.analyzeAndRespond({
          from: data.from,
          to: data.to,
          body: `Subject: ${data.subject}\n\n${data.body}`,
          provider: 'twilio', // Use twilio as fallback for AI handler
          timestamp: data.timestamp
        });

        if (aiResult.shouldRespond && aiResult.confidence > 0.7) {
          console.log('Email AI Response sent:', {
            confidence: aiResult.confidence,
            response: aiResult.response
          });
          
          // Send email response using Email service
          const { emailResponseService } = await import('../services/email-response-service');
          if (aiResult.response) {
            await emailResponseService.sendEmailResponse(
              data.from,
              `Re: ${data.subject}`,
              aiResult.response,
              data.messageId
            );
            
            // Create notification for incoming Email
            const { notificationService } = await import('../services/notification-service');
            const recipients = await notificationService.determineNotificationRecipients({
              userId: '', 
              type: 'new_email',
              category: 'email',
              from: data.from,
              originalContent: `${data.subject}\n\n${data.body}`,
              channelProvider: 'sendgrid',
              messageId: data.messageId
            });
            
            for (const userId of recipients) {
              await notificationService.createCommunicationNotification({
                userId,
                type: 'new_email',
                category: 'email',
                from: data.from,
                to: data.to,
                originalContent: `${data.subject}\n\n${data.body}`,
                channelProvider: 'sendgrid',
                messageId: data.messageId
              });
            }
          }
        } else {
          // Send business hours or auto-reply
          const { emailResponseService } = await import('../services/email-response-service');
          const { BusinessHoursHandler } = await import('../ai-webhook-handler');
          
          if (!BusinessHoursHandler.isBusinessHours()) {
            await emailResponseService.sendBusinessHoursResponse(
              data.from,
              data.subject,
              data.messageId
            );
          } else {
            await emailResponseService.sendAutoReply(
              data.from,
              data.subject,
              data.messageId
            );
          }
        }
      }
    } catch (error) {
      console.error('Error handling incoming email:', error);
    }
  }
}

// Messenger Webhook Handler
export class MessengerWebhookHandler {
  private static aiHandler: AIWebhookHandler | null = null;

  static initializeAI(storage: any): void {
    this.aiHandler = new AIWebhookHandler(storage);
  }

  // Handle Facebook Messenger webhook
  static async handleFacebookWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Facebook webhook verification
      if (req.query['hub.mode'] === 'subscribe' && req.query['hub.challenge']) {
        if (req.query['hub.verify_token'] === process.env.FACEBOOK_VERIFY_TOKEN) {
          res.status(200).send(req.query['hub.challenge']);
          return;
        } else {
          res.status(403).send('Forbidden');
          return;
        }
      }

      // Handle incoming message
      const { object, entry } = req.body;
      
      if (object === 'page') {
        for (const pageEntry of entry) {
          for (const messagingEvent of pageEntry.messaging || []) {
            if (messagingEvent.message) {
              await this.handleIncomingMessage({
                senderId: messagingEvent.sender.id,
                recipientId: messagingEvent.recipient.id,
                messageId: messagingEvent.message.mid,
                text: messagingEvent.message.text,
                timestamp: new Date(messagingEvent.timestamp),
                provider: 'facebook'
              });
            }
          }
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Facebook Messenger webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  private static async handleIncomingMessage(data: {
    senderId: string;
    recipientId: string;
    messageId: string;
    text: string;
    timestamp: Date;
    provider: 'facebook';
  }): Promise<void> {
    try {
      console.log('Incoming Messenger message:', {
        senderId: data.senderId,
        text: data.text.substring(0, 50) + '...',
        timestamp: data.timestamp
      });

      // AI-powered Messenger response
      if (this.aiHandler) {
        const aiResult = await this.aiHandler.analyzeAndRespond({
          from: data.senderId,
          to: data.recipientId,
          body: data.text,
          provider: 'twilio', // Use twilio as fallback for AI handler
          timestamp: data.timestamp
        });

        if (aiResult.shouldRespond && aiResult.confidence > 0.7) {
          console.log('Messenger AI Response sent:', {
            confidence: aiResult.confidence,
            response: aiResult.response
          });
          
          // Send Messenger response using Messenger service
          const { messengerResponseService } = await import('../services/messenger-response-service');
          if (aiResult.response) {
            await messengerResponseService.sendMessengerResponse(data.senderId, aiResult.response);
            
            // Create notification for incoming Messenger
            const { notificationService } = await import('../services/notification-service');
            const recipients = await notificationService.determineNotificationRecipients({
              userId: '', 
              type: 'new_messenger',
              category: 'messenger',
              from: data.senderId,
              originalContent: data.text,
              channelProvider: 'facebook',
              messageId: data.messageId
            });
            
            for (const userId of recipients) {
              await notificationService.createCommunicationNotification({
                userId,
                type: 'new_messenger',
                category: 'messenger',
                from: data.senderId,
                to: data.recipientId,
                originalContent: data.text,
                channelProvider: 'facebook',
                messageId: data.messageId
              });
            }
          }
        } else {
          // Send business hours or auto-reply
          const { messengerResponseService } = await import('../services/messenger-response-service');
          const { BusinessHoursHandler } = await import('../ai-webhook-handler');
          
          if (!BusinessHoursHandler.isBusinessHours()) {
            await messengerResponseService.sendBusinessHoursResponse(data.senderId);
          } else {
            await messengerResponseService.sendAutoReply(data.senderId, data.text);
          }
        }
      }
    } catch (error) {
      console.error('Error handling incoming Messenger message:', error);
    }
  }
}

// General Webhook Router
export class WebhookRouter {
  
  // Initialize AI handlers for all channels
  static initializeAI(storage: any): void {
    WhatsAppWebhookHandler.initializeAI(storage);
    SMSWebhookHandler.initializeAI(storage);
    EmailWebhookHandler.initializeAI(storage);
    MessengerWebhookHandler.initializeAI(storage);
  }
  
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

    // SMS Webhooks
    app.post('/api/webhooks/skebby/sms', (req: Request, res: Response) => {
      SMSWebhookHandler.handleSkebbyWebhook(req, res);
    });

    // Email Webhooks
    app.post('/api/webhooks/sendgrid/inbound', (req: Request, res: Response) => {
      EmailWebhookHandler.handleSendGridWebhook(req, res);
    });

    // Messenger Webhooks
    app.get('/api/webhooks/facebook/messenger', (req: Request, res: Response) => {
      MessengerWebhookHandler.handleFacebookWebhook(req, res);
    });

    app.post('/api/webhooks/facebook/messenger', (req: Request, res: Response) => {
      MessengerWebhookHandler.handleFacebookWebhook(req, res);
    });

    // Test webhook endpoint
    app.get('/api/webhooks/test', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Multi-Channel Webhook System Operational',
        timestamp: new Date().toISOString(),
        endpoints: {
          whatsapp: [
            '/api/webhooks/twilio/whatsapp',
            '/api/webhooks/linkmobility/whatsapp',
            '/api/webhooks/whatsapp/status'
          ],
          sms: [
            '/api/webhooks/skebby/sms'
          ],
          email: [
            '/api/webhooks/sendgrid/inbound'
          ],
          messenger: [
            '/api/webhooks/facebook/messenger'
          ]
        },
      });
    });

    // Multi-channel webhook configuration info
    app.get('/api/webhooks/info', (req: Request, res: Response) => {
      const baseUrl = `https://${req.headers.host}`;
      
      res.json({
        webhookUrls: {
          whatsapp: {
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
          sms: {
            skebby: {
              incoming: `${baseUrl}/api/webhooks/skebby/sms`,
              status: `${baseUrl}/api/webhooks/skebby/sms`,
              headers: { 'Content-Type': 'application/json' }
            }
          },
          email: {
            sendgrid: {
              inbound: `${baseUrl}/api/webhooks/sendgrid/inbound`,
              headers: { 'Content-Type': 'multipart/form-data' }
            }
          },
          messenger: {
            facebook: {
              webhook: `${baseUrl}/api/webhooks/facebook/messenger`,
              verification: `${baseUrl}/api/webhooks/facebook/messenger?hub.mode=subscribe&hub.challenge=CHALLENGE&hub.verify_token=${process.env.FACEBOOK_VERIFY_TOKEN}`,
              headers: { 'Content-Type': 'application/json' }
            }
          }
        },
        security: {
          production: process.env.NODE_ENV === 'production',
          signatureValidation: 'enabled',
          supportedMethods: ['GET', 'POST'],
          aiIntegration: 'enabled'
        },
        channels: {
          whatsapp: { status: 'active', providers: ['twilio', 'linkmobility'] },
          sms: { status: 'active', providers: ['skebby'] },
          email: { status: 'active', providers: ['sendgrid'] },
          messenger: { status: 'active', providers: ['facebook'] }
        }
      });
    });
  }
}

// WEBHOOK SIMULAZIONI RIMOSSE - SOLO API REALI
// Webhook testing utilities removed - use real webhook endpoints only