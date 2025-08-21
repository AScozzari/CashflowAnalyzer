// Telegram Bot API Routes
import type { Express } from 'express';
import { telegramService } from '../services/telegram-service';
import { storage } from '../storage';
import { insertTelegramSettingsSchema, insertTelegramTemplateSchema } from '@shared/schema';
import { z } from 'zod';

export function setupTelegramRoutes(app: Express): void {
  
  // Get Telegram settings
  app.get('/api/telegram/settings', async (req, res) => {
    try {
      const settings = await storage.getTelegramSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching Telegram settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  // Update Telegram settings
  app.post('/api/telegram/settings', async (req, res) => {
    try {
      const validatedData = insertTelegramSettingsSchema.parse(req.body);
      
      const existingSettings = await storage.getTelegramSettings();
      let result;
      
      if (existingSettings.length > 0) {
        result = await storage.updateTelegramSettings(existingSettings[0].id, validatedData);
      } else {
        result = await storage.createTelegramSettings(validatedData);
      }
      
      // Reinitialize service with new settings
      await telegramService.initialize({
        botToken: validatedData.botToken,
        botUsername: validatedData.botUsername,
        webhookUrl: validatedData.webhookUrl || undefined,
        webhookSecret: validatedData.webhookSecret || undefined,
        allowedUpdates: validatedData.allowedUpdates as string[],
        enableBusinessHours: validatedData.enableBusinessHours || false,
        businessHoursStart: validatedData.businessHoursStart,
        businessHoursEnd: validatedData.businessHoursEnd,
        businessDays: validatedData.businessDays as string[],
        enableAutoReply: validatedData.enableAutoReply || false,
        enableAiResponses: validatedData.enableAiResponses || false,
        aiModel: validatedData.aiModel,
        aiSystemPrompt: validatedData.aiSystemPrompt || undefined
      });
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('🔴 TELEGRAM VALIDATION ERROR:', error.errors);
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        console.error('🔴 TELEGRAM SETTINGS ERROR:', error);
        res.status(500).json({ error: 'Failed to update settings' });
      }
    }
  });

  // Test Telegram connection
  app.post('/api/telegram/test', async (req, res) => {
    try {
      const testResult = await telegramService.testConnection();
      
      if (testResult.success) {
        // Update last test timestamp
        const settings = await storage.getTelegramSettings();
        if (settings.length > 0) {
          await storage.updateTelegramSettings(settings[0].id, {});
        }
      }
      
      res.json(testResult);
    } catch (error) {
      console.error('Error testing Telegram connection:', error);
      res.status(500).json({ error: 'Test failed' });
    }
  });

  // Initialize Telegram service
  app.post('/api/telegram/initialize', async (req, res) => {
    try {
      const settings = await storage.getTelegramSettings();
      
      if (settings.length === 0) {
        return res.status(400).json({ error: 'No Telegram settings configured' });
      }
      
      const setting = settings[0];
      await telegramService.initialize({
        botToken: setting.botToken,
        botUsername: setting.botUsername,
        webhookUrl: setting.webhookUrl || undefined,
        webhookSecret: setting.webhookSecret || undefined,
        allowedUpdates: setting.allowedUpdates as string[],
        enableBusinessHours: setting.enableBusinessHours || false,
        businessHoursStart: setting.businessHoursStart || '09:00',
        businessHoursEnd: setting.businessHoursEnd || '18:00',
        businessDays: setting.businessDays as string[],
        enableAutoReply: setting.enableAutoReply || false,
        enableAiResponses: setting.enableAiResponses || false,
        aiModel: setting.aiModel || 'gpt-4o',
        aiSystemPrompt: setting.aiSystemPrompt || undefined
      });
      
      res.json({ success: true, message: 'Telegram service initialized' });
    } catch (error) {
      console.error('Telegram initialization error:', error);
      res.status(500).json({ error: 'Failed to initialize Telegram service' });
    }
  });

  // Send Telegram message
  app.post('/api/telegram/send', async (req, res) => {
    try {
      const { chatId, message, parseMode, disableWebPagePreview, replyMarkup } = req.body;
      
      if (!chatId || !message) {
        return res.status(400).json({ error: 'chatId and message are required' });
      }
      
      const result = await telegramService.sendMessage(chatId, message, {
        parse_mode: parseMode,
        disable_web_page_preview: disableWebPagePreview,
        reply_markup: replyMarkup
      });
      
      if (result.success) {
        // Update last message sent timestamp
        const settings = await storage.getTelegramSettings();
        if (settings.length > 0) {
          await storage.updateTelegramSettings(settings[0].id, {});
        }
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Webhook endpoint for receiving Telegram updates
  app.post('/webhook/telegram', async (req, res) => {
    try {
      const update = req.body;
      
      // Validate webhook secret if configured
      const settings = await storage.getTelegramSettings();
      if (settings.length > 0 && settings[0].webhookSecret) {
        const secretToken = req.headers['x-telegram-bot-api-secret-token'];
        if (secretToken !== settings[0].webhookSecret) {
          return res.status(401).json({ error: 'Invalid secret token' });
        }
      }
      
      // Process the update
      await telegramService.processUpdate(update);
      
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Error processing Telegram webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Get Telegram templates
  app.get('/api/telegram/templates', async (req, res) => {
    try {
      const templates = await storage.getTelegramTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching Telegram templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  });

  // Create Telegram template
  app.post('/api/telegram/templates', async (req, res) => {
    try {
      const validatedData = insertTelegramTemplateSchema.parse(req.body);
      const template = await storage.createTelegramTemplate(validatedData);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        console.error('Error creating Telegram template:', error);
        res.status(500).json({ error: 'Failed to create template' });
      }
    }
  });

  // Update Telegram template
  app.put('/api/telegram/templates/:id', async (req, res) => {
    try {
      const validatedData = insertTelegramTemplateSchema.parse(req.body);
      const template = await storage.updateTelegramTemplate(req.params.id, validatedData);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        console.error('Error updating Telegram template:', error);
        res.status(500).json({ error: 'Failed to update template' });
      }
    }
  });

  // Delete Telegram template
  app.delete('/api/telegram/templates/:id', async (req, res) => {
    try {
      const success = await storage.deleteTelegramTemplate(req.params.id);
      
      // The delete method returns void, so we don't check success
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting Telegram template:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  });

  // Send template message
  app.post('/api/telegram/send-template', async (req, res) => {
    try {
      const { chatId, templateId, variables } = req.body;
      
      if (!chatId || !templateId) {
        return res.status(400).json({ error: 'chatId and templateId are required' });
      }
      
      const template = await storage.getTelegramTemplate(templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      const result = await telegramService.sendTemplateMessage(chatId, {
        content: template.content,
        parseMode: template.parseMode || undefined,
        disableWebPagePreview: template.disableWebPagePreview || undefined,
        inlineKeyboard: template.inlineKeyboard as any,
        variables: variables || {}
      });
      
      if (result.success) {
        // Note: template usage tracking would need usageCount and lastUsed fields in schema
        
        // Note: last message tracking would need lastMessageSent field in schema
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error sending Telegram template:', error);
      res.status(500).json({ error: 'Failed to send template' });
    }
  });

  // Get Telegram chats
  app.get('/api/telegram/chats', async (req, res) => {
    try {
      const chats = await storage.getTelegramChats();
      res.json(chats);
    } catch (error) {
      console.error('Error fetching Telegram chats:', error);
      res.status(500).json({ error: 'Failed to fetch chats' });
    }
  });

  // Get bot stats
  app.get('/api/telegram/stats', async (req, res) => {
    try {
      const stats = {
        isInitialized: telegramService.isInitialized(),
        botUsername: telegramService.getBotUsername(),
        totalChats: (await storage.getTelegramChats()).length,
        totalTemplates: (await storage.getTelegramTemplates()).length,
        settings: telegramService.getSettings()
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching Telegram stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });
}