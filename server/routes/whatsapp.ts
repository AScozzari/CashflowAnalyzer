// WhatsApp Business API Routes - Unified Twilio 2024 & LinkMobility Support
import type { Express } from 'express';
import { whatsappService, WhatsAppMessage } from '../services/whatsapp-service';
import { storage } from '../storage';
import { insertWhatsappSettingsSchema, insertWhatsappTemplateSchema } from '@shared/schema';
import { z } from 'zod';

// Storage instance is imported

export function setupWhatsAppRoutes(app: Express): void {
  
  // Initialize WhatsApp service
  app.post('/api/whatsapp/initialize', async (req, res) => {
    try {
      await whatsappService.initialize();
      const stats = await whatsappService.getStats();
      res.json({ success: true, stats });
    } catch (error) {
      console.error('WhatsApp initialization error:', error);
      res.status(500).json({ error: 'Failed to initialize WhatsApp service' });
    }
  });

  // Get WhatsApp settings
  app.get('/api/whatsapp/settings', async (req, res) => {
    try {
      const settings = await storage.getWhatsappSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching WhatsApp settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  // Update WhatsApp settings
  app.post('/api/whatsapp/settings', async (req, res) => {
    try {
      const validatedData = insertWhatsappSettingsSchema.parse(req.body);
      
      const existingSettings = await storage.getWhatsappSettings();
      let result;
      
      if (existingSettings.length > 0) {
        result = await storage.updateWhatsappSettings(existingSettings[0].id, validatedData);
      } else {
        result = await storage.createWhatsappSettings(validatedData);
      }
      
      // Reinitialize service with new settings
      await whatsappService.initialize();
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        console.error('Error updating WhatsApp settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
      }
    }
  });

  // Test WhatsApp connection
  app.post('/api/whatsapp/test', async (req, res) => {
    try {
      await whatsappService.initialize();
      const testResult = await whatsappService.testConnection();
      
      if (testResult.success) {
        await whatsappService.updateLastTest();
      }
      
      res.json(testResult);
    } catch (error) {
      console.error('WhatsApp connection test error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to test connection' 
      });
    }
  });

  // Send WhatsApp message
  app.post('/api/whatsapp/send', async (req, res) => {
    try {
      const messageSchema = z.object({
        to: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format'),
        type: z.enum(['text', 'template', 'media']),
        content: z.object({
          body: z.string().optional(),
          templateName: z.string().optional(),
          templateLanguage: z.string().default('it'),
          templateVariables: z.record(z.string()).optional(),
          mediaUrl: z.string().url().optional(),
          mediaType: z.enum(['image', 'document', 'audio', 'video']).optional()
        }),
        metadata: z.object({
          clientReference: z.string().optional(),
          trackingId: z.string().optional(),
          priority: z.enum(['high', 'normal']).default('normal')
        }).optional()
      });

      const message: WhatsAppMessage = messageSchema.parse(req.body);
      
      await whatsappService.initialize();
      const result = await whatsappService.sendMessage(message);
      
      if (result.success) {
        // Update last message sent timestamp
        const settings = await storage.getWhatsappSettings();
        if (settings.length > 0) {
          await storage.updateWhatsappSettings(settings[0].id, {
            // Remove this field as it doesn't exist in the schema
            // lastMessageSentAt: new Date()
          });
        }
      }
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid message format', details: error.errors });
      } else {
        console.error('WhatsApp send error:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to send message' 
        });
      }
    }
  });

  // Get WhatsApp templates
  app.get('/api/whatsapp/templates', async (req, res) => {
    try {
      const templates = await storage.getWhatsappTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching WhatsApp templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  });

  // Create WhatsApp template
  app.post('/api/whatsapp/templates', async (req, res) => {
    try {
      const templateData = insertWhatsappTemplateSchema.parse(req.body);
      const template = await storage.createWhatsappTemplate(templateData);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        console.error('Error creating WhatsApp template:', error);
        res.status(500).json({ error: 'Failed to create template' });
      }
    }
  });

  // Update WhatsApp template
  app.put('/api/whatsapp/templates/:id', async (req, res) => {
    try {
      const templateData = insertWhatsappTemplateSchema.partial().parse(req.body);
      const template = await storage.updateWhatsappTemplate(req.params.id, templateData);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        console.error('Error updating WhatsApp template:', error);
        res.status(500).json({ error: 'Failed to update template' });
      }
    }
  });

  // Delete WhatsApp template
  app.delete('/api/whatsapp/templates/:id', async (req, res) => {
    try {
      await storage.deleteWhatsappTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting WhatsApp template:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  });

  // Import templates from Twilio Content API
  app.post('/api/whatsapp/templates/import', async (req, res) => {
    try {
      const settingsList = await storage.getWhatsappSettings();
      const settings = settingsList.length > 0 ? settingsList[0] : null;
      
      if (!settings || settings.provider !== 'twilio' || !settings.accountSid || !settings.authToken) {
        res.status(400).json({ 
          error: 'Twilio settings not configured or provider is not Twilio'
        });
        return;
      }

      const auth = Buffer.from(`${settings.accountSid}:${settings.authToken}`).toString('base64');
      
      // Fetch templates from Twilio Content API
      const response = await fetch('https://content.twilio.com/v1/ContentAndApprovals', {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Twilio API error: ${response.status}`);
      }

      const data = await response.json();
      const importedTemplates = [];
      const existingTemplates = await storage.getWhatsappTemplates();
      let updatedCount = 0;

      for (const twilioTemplate of data.contents || []) {
        try {
          // Extract content based on template type
          let bodyContent = '';
          let headerContent = null;
          let buttons = [];

          if (twilioTemplate.types?.['twilio/text']) {
            bodyContent = twilioTemplate.types['twilio/text'].body;
          } else if (twilioTemplate.types?.['twilio/call-to-action']) {
            bodyContent = twilioTemplate.types['twilio/call-to-action'].body;
            const actions = twilioTemplate.types['twilio/call-to-action'].actions || [];
            buttons = actions.map(action => ({
              type: 'URL',
              text: action.title,
              url: action.url
            }));
          } else if (twilioTemplate.types?.['twilio/quick-reply']) {
            bodyContent = twilioTemplate.types['twilio/quick-reply'].body;
            const actions = twilioTemplate.types['twilio/quick-reply'].actions || [];
            buttons = actions.map(action => ({
              type: 'QUICK_REPLY',
              text: action.title
            }));
          } else if (twilioTemplate.types?.['twilio/media']) {
            bodyContent = twilioTemplate.types['twilio/media'].body;
            const media = twilioTemplate.types['twilio/media'].media;
            if (media && media.length > 0) {
              headerContent = {
                type: 'IMAGE',
                content: media[0]
              };
            }
          } else if (twilioTemplate.types?.['twilio/list-picker']) {
            bodyContent = twilioTemplate.types['twilio/list-picker'].body;
            const items = twilioTemplate.types['twilio/list-picker'].items || [];
            buttons = items.map(item => ({
              type: 'QUICK_REPLY',
              text: item.item
            }));
          }

          // Map Twilio template to our schema
          const templateData = {
            name: twilioTemplate.friendly_name?.replace(/[^a-z0-9_]/g, '_').toLowerCase() || twilioTemplate.sid,
            provider: 'twilio' as const,
            category: 'UTILITY' as const,
            language: twilioTemplate.language || 'it',
            status: 'PENDING' as const,
            
            body: {
              content: bodyContent || 'Template content not available'
            },
            
            header: headerContent,
            buttons: buttons.length > 0 ? buttons : undefined,

            // Provider-specific IDs
            providerTemplateId: twilioTemplate.sid,
            description: `Imported from Twilio: ${twilioTemplate.friendly_name}`,
            tags: ['imported', 'twilio']
          };

          // Check if template already exists
          const existingTemplate = existingTemplates.find(t => 
            t.providerTemplateId === twilioTemplate.sid || t.name === templateData.name
          );

          if (!existingTemplate) {
            const created = await storage.createWhatsappTemplate(templateData);
            importedTemplates.push(created);
          } else {
            // Update existing template status and metadata
            const updatedTemplate = await storage.updateWhatsappTemplate(existingTemplate.id, {
              status: templateData.status,
              body: templateData.body,
              header: templateData.header,
              buttons: templateData.buttons,
              description: templateData.description,
              tags: templateData.tags
            });
            updatedCount++;
            console.log(`Template ${templateData.name} updated with latest Twilio data`);
          }
          
        } catch (templateError) {
          console.error(`Error processing template ${twilioTemplate.sid}:`, templateError);
          continue;
        }
      }

      res.json({
        success: true,
        message: `Sincronizzazione completata: ${importedTemplates.length} nuovi template, ${updatedCount} aggiornati`,
        imported: importedTemplates,
        totalFound: data.contents?.length || 0,
        updated: updatedCount
      });

    } catch (error) {
      console.error('Error importing templates from Twilio:', error);
      res.status(500).json({ 
        error: 'Failed to import templates from Twilio',
        details: error.message 
      });
    }
  });

  // Check template status with provider
  app.get('/api/whatsapp/templates/:name/status', async (req, res) => {
    try {
      await whatsappService.initialize();
      const status = await whatsappService.getTemplateStatus(req.params.name);
      
      if (!status) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }
      
      // Update local template status if different
      const templates = await storage.getWhatsappTemplates();
      const localTemplate = templates.find(t => t.name === req.params.name);
      if (localTemplate && localTemplate.status !== status.status) {
        await storage.updateWhatsappTemplate(localTemplate.id, {
          status: status.status,
          // Remove fields that don't exist in schema
          // rejectionReason: status.rejectionReason,
          // approvedAt: status.approvedAt
        });
      }
      
      res.json(status);
    } catch (error) {
      console.error('Template status check error:', error);
      res.status(500).json({ error: 'Failed to check template status' });
    }
  });

  // Get WhatsApp service statistics
  app.get('/api/whatsapp/stats', async (req, res) => {
    try {
      // Get real settings from database
      const settingsList = await storage.getWhatsappSettings();
      
      if (settingsList.length === 0) {
        res.json({
          provider: 'none',
          isActive: false,
          configured: false,
          lastTest: null,
          lastMessage: null,
          approvedTemplates: 0,
          pendingTemplates: 0
        });
        return;
      }

      const settings = settingsList[0];
      const templates = await storage.getWhatsappTemplates();
      const approved = templates.filter(t => t.status === 'approved').length;
      const pending = templates.filter(t => t.status === 'pending').length;

      res.json({
        provider: settings.provider,
        isActive: settings.isActive,
        configured: true,
        lastTest: settings.updatedAt,
        lastMessage: settings.updatedAt,
        approvedTemplates: approved,
        pendingTemplates: pending
      });
    } catch (error) {
      console.error('WhatsApp stats error:', error);
      res.json({
        provider: 'none',
        isActive: false,
        configured: false,
        lastTest: null,
        lastMessage: null,
        approvedTemplates: 0,
        pendingTemplates: 0
      });
    }
  });

  // Bulk message sending (for campaigns)
  app.post('/api/whatsapp/bulk-send', async (req, res) => {
    try {
      const bulkSchema = z.object({
        recipients: z.array(z.string().regex(/^\+[1-9]\d{1,14}$/)).min(1).max(1000),
        template: z.string().min(1),
        variables: z.record(z.string()).optional(),
        priority: z.enum(['high', 'normal']).default('normal'),
        batchSize: z.number().min(1).max(100).default(10),
        delayMs: z.number().min(1000).max(60000).default(5000)
      });

      const { recipients, template, variables, priority, batchSize, delayMs } = bulkSchema.parse(req.body);
      
      await whatsappService.initialize();
      
      const results = {
        total: recipients.length,
        sent: 0,
        failed: 0,
        errors: [] as string[]
      };

      // Process in batches to respect rate limits
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (recipient) => {
          try {
            const message: WhatsAppMessage = {
              to: recipient,
              type: 'template',
              content: {
                templateName: template,
                templateLanguage: 'it',
                templateVariables: variables
              },
              metadata: {
                priority,
                trackingId: `bulk-${Date.now()}-${recipient}`
              }
            };
            
            const result = await whatsappService.sendMessage(message);
            if (result.success) {
              results.sent++;
            } else {
              results.failed++;
              results.errors.push(`${recipient}: ${result.error}`);
            }
          } catch (error) {
            results.failed++;
            results.errors.push(`${recipient}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });

        await Promise.all(batchPromises);
        
        // Delay between batches
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      res.json(results);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid bulk send request', details: error.errors });
      } else {
        console.error('Bulk send error:', error);
        res.status(500).json({ error: 'Failed to send bulk messages' });
      }
    }
  });

  // Get WhatsApp chats/conversations
  app.get('/api/whatsapp/chats', async (req, res) => {
    try {
      // Get all contacts with phone numbers from different entity types
      const [resources, customers, suppliers] = await Promise.all([
        storage.getResources(),
        storage.getCustomers(), 
        storage.getSuppliers()
      ]);

      // Combine all contacts and filter those with phone numbers
      const allContacts = [
        ...resources.map((r: any) => ({ ...r, type: 'resource' })),
        ...customers.map((c: any) => ({ ...c, type: 'customer' })),
        ...suppliers.map((s: any) => ({ ...s, type: 'supplier' }))
      ];

      // Add demo chats with interesting messages
      let whatsappChats = allContacts
        .filter(contact => contact.mobile || contact.phone)
        .slice(0, 20) // Limit to 20 most recent chats for performance
        .map((contact, index) => {
          // Demo messages per rendere le chat più interessanti
          const demoMessages = [
            'Ciao! Quando possiamo organizzare la riunione? 📅',
            'Perfetto, confermo la consegna per domani mattina ✅',
            'Grazie per il preventivo, molto competitivo! 💰',
            'Ho bisogno di chiarimenti sui pagamenti 🤔',
            'Tutto ok per la fatturazione elettronica? 📄',
            'Buongiorno! Come stai? Senti, per il progetto...',
            'Ti mando la documentazione via email 📧',
            'Quando ci sentiamo per definire i dettagli? 📞'
          ];
          
          const demoTimes = ['5 min fa', '1 ora fa', '2 ore fa', 'Ieri', 'Online', '10 min fa', '30 min fa', '3 ore fa'];
          const demoUnread = [0, 1, 2, 0, 3, 0, 1, 0];
          const demoOnline = [false, true, false, true, false, true, false, false];
          
          return {
            id: contact.id,
            name: contact.name || `Contatto ${contact.type}`,
            phone: contact.mobile || contact.phone,
            avatar: null,
            lastMessage: demoMessages[index % demoMessages.length],
            lastSeen: demoTimes[index % demoTimes.length],
            unreadCount: demoUnread[index % demoUnread.length],
            online: demoOnline[index % demoOnline.length],
            type: contact.type,
            company: contact.company || null
          };
        });

      // If no WhatsApp chats, add demo data for testing
      if (whatsappChats.length === 0) {
        whatsappChats = [
          {
            id: 'demo-1',
            name: 'Demo Cliente',
            phone: '+39 123 456 7890',
            avatar: null,
            lastMessage: 'Chat demo per testing',
            lastSeen: 'Online',
            unreadCount: 2,
            online: true,
            type: 'customer',
            company: 'Demo SRL'
          },
          {
            id: 'demo-2',
            name: 'Demo Fornitore',
            phone: '+39 098 765 4321',
            avatar: null,
            lastMessage: 'Fornitore demo',
            lastSeen: '5 min fa',
            unreadCount: 0,
            online: false,
            type: 'supplier',
            company: 'Demo Suppliers SpA'
          }
        ];
      }

      res.json(whatsappChats);
    } catch (error) {
      console.error('Error fetching WhatsApp chats:', error);
      res.status(500).json({ error: 'Failed to fetch chats' });
    }
  });

  // Get WhatsApp messages for a specific contact
  app.get('/api/whatsapp/messages/:contactId', async (req, res) => {
    try {
      const contactId = req.params.contactId;
      
      // For now, return empty messages array until we implement message storage
      const messages: any[] = [];

      res.json(messages);
    } catch (error) {
      console.error('Error fetching WhatsApp messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // ===== ADVANCED TWILIO API ENDPOINTS =====

  // Get message analytics
  app.get('/api/whatsapp/analytics/:period?', async (req, res) => {
    try {
      await whatsappService.initialize();
      const period = req.params.period as '24h' | '7d' | '30d' || '24h';
      const analytics = await whatsappService.getMessageAnalytics(period);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching WhatsApp analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Fetch specific message by SID
  app.get('/api/whatsapp/messages/:messageSid', async (req, res) => {
    try {
      await whatsappService.initialize();
      const message = await whatsappService.fetchMessage(req.params.messageSid);
      res.json(message);
    } catch (error) {
      console.error('Error fetching message:', error);
      res.status(500).json({ error: 'Failed to fetch message' });
    }
  });

  // List all messages with filters
  app.get('/api/whatsapp/messages', async (req, res) => {
    try {
      await whatsappService.initialize();
      const filters = {
        to: req.query.to as string,
        from: req.query.from as string,
        dateSent: req.query.dateSent as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };
      const messages = await whatsappService.listMessages(filters);
      res.json(messages);
    } catch (error) {
      console.error('Error listing messages:', error);
      res.status(500).json({ error: 'Failed to list messages' });
    }
  });

  // Schedule message
  app.post('/api/whatsapp/schedule', async (req, res) => {
    try {
      const messageSchema = z.object({
        to: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format'),
        scheduleTime: z.string().transform(str => new Date(str)),
        type: z.enum(['text', 'template', 'media', 'location', 'contacts', 'interactive']),
        content: z.object({
          body: z.string().optional(),
          templateName: z.string().optional(),
          templateLanguage: z.string().default('it'),
          templateVariables: z.record(z.string()).optional(),
          mediaUrl: z.string().url().optional(),
          mediaType: z.enum(['image', 'document', 'audio', 'video']).optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          address: z.string().optional(),
          name: z.string().optional()
        })
      });

      const message = messageSchema.parse(req.body);
      
      await whatsappService.initialize();
      const result = await whatsappService.scheduleMessage(message as any);
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid message format', details: error.errors });
      } else {
        console.error('WhatsApp schedule error:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to schedule message' 
        });
      }
    }
  });

  // ===== CONTENT API ENDPOINTS =====

  // Create Content API template
  app.post('/api/whatsapp/content/templates', async (req, res) => {
    try {
      await whatsappService.initialize();
      const template = await whatsappService.createContentTemplate(req.body);
      res.json(template);
    } catch (error) {
      console.error('Error creating Content API template:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  });

  // Get Content API template
  app.get('/api/whatsapp/content/templates/:contentSid', async (req, res) => {
    try {
      await whatsappService.initialize();
      const template = await whatsappService.getContentTemplate(req.params.contentSid);
      res.json(template);
    } catch (error) {
      console.error('Error fetching Content API template:', error);
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  });

  // List Content API templates
  app.get('/api/whatsapp/content/templates', async (req, res) => {
    try {
      await whatsappService.initialize();
      const templates = await whatsappService.listContentTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error listing Content API templates:', error);
      res.status(500).json({ error: 'Failed to list templates' });
    }
  });

  // Submit template for approval
  app.post('/api/whatsapp/content/templates/:contentSid/approve', async (req, res) => {
    try {
      await whatsappService.initialize();
      const result = await whatsappService.submitForApproval(req.params.contentSid);
      res.json(result);
    } catch (error) {
      console.error('Error submitting template for approval:', error);
      res.status(500).json({ error: 'Failed to submit for approval' });
    }
  });

  // ===== MESSAGING SERVICES ENDPOINTS =====

  // Create Messaging Service
  app.post('/api/whatsapp/messaging-services', async (req, res) => {
    try {
      await whatsappService.initialize();
      const service = await whatsappService.createMessagingService(req.body);
      res.json(service);
    } catch (error) {
      console.error('Error creating Messaging Service:', error);
      res.status(500).json({ error: 'Failed to create messaging service' });
    }
  });

  // Add phone number to Messaging Service
  app.post('/api/whatsapp/messaging-services/:serviceSid/phone-numbers', async (req, res) => {
    try {
      const { phoneNumberSid } = req.body;
      if (!phoneNumberSid) {
        res.status(400).json({ error: 'phoneNumberSid is required' });
        return;
      }

      await whatsappService.initialize();
      const result = await whatsappService.addPhoneNumberToService(
        req.params.serviceSid, 
        phoneNumberSid
      );
      res.json(result);
    } catch (error) {
      console.error('Error adding phone number to service:', error);
      res.status(500).json({ error: 'Failed to add phone number to service' });
    }
  });

  // ===== WEBHOOK ENDPOINTS =====

  // Webhook for incoming WhatsApp messages
  app.post('/api/whatsapp/webhook', async (req, res) => {
    try {
      console.log('📨 WhatsApp webhook received:', JSON.stringify(req.body, null, 2));
      
      // Process the webhook
      const { Body, From, To, MessageSid, MessageStatus, SmsSid } = req.body;
      
      if (MessageStatus) {
        // Status update webhook
        console.log(`📊 Message ${MessageSid || SmsSid} status: ${MessageStatus}`);
      } else if (Body && From) {
        // Incoming message webhook
        console.log(`📩 Incoming message from ${From}: ${Body}`);
      }

      // Always respond with 200 to acknowledge receipt
      res.status(200).send('OK');
    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // Webhook verification endpoint
  app.get('/api/whatsapp/webhook', (req, res) => {
    console.log('🔍 WhatsApp webhook verification request:', req.query);
    res.status(200).send('Webhook endpoint verified');
  });
}

export default setupWhatsAppRoutes;