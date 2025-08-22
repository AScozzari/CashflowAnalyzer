// Telegram Bot API Routes
import type { Express } from 'express';
import { telegramService } from '../services/telegram-service';
import { storage } from '../storage';
import { insertTelegramSettingsSchema, insertTelegramTemplateSchema } from '@shared/schema';
import { z } from 'zod';
import { randomUUID } from 'crypto';

export function setupTelegramRoutes(app: Express): void {
  console.log('🔧 [TELEGRAM ROUTES] Setting up Telegram routes...');

  // Auto-initialize Telegram service on startup
  setTimeout(async () => {
    try {
      console.log('[TELEGRAM STARTUP] Auto-initializing Telegram service...');
      const settings = await storage.getTelegramSettings();
      
      if (settings.length > 0 && settings[0].isActive) {
        const config = settings[0];
        
        await telegramService.initialize({
          botToken: config.botToken,
          botUsername: config.botUsername,
          webhookUrl: config.webhookUrl || undefined,
          webhookSecret: config.webhookSecret || undefined,
          allowedUpdates: config.allowedUpdates as string[],
          enableBusinessHours: config.enableBusinessHours || false,
          businessHoursStart: config.businessHoursStart || '09:00',
          businessHoursEnd: config.businessHoursEnd || '18:00',
          businessDays: config.businessDays as string[],
          enableAutoReply: config.enableAutoReply || false,
          enableAiResponses: config.enableAiResponses || false,
          aiModel: config.aiModel || 'gpt-4o',
          aiSystemPrompt: config.aiSystemPrompt || undefined
        });

        // Start polling to receive messages
        await telegramService.startPolling(15000);
        console.log('[TELEGRAM STARTUP] ✅ Telegram service auto-initialized with polling');
      } else {
        console.log('[TELEGRAM STARTUP] No active Telegram settings found, skipping auto-initialization');
      }
    } catch (error) {
      console.error('[TELEGRAM STARTUP] ❌ Error auto-initializing Telegram:', error);
    }
  }, 5000); // Wait 5 seconds for server to be ready
  
  // Test route
  app.get('/api/telegram/test-route', (req, res) => {
    console.log('🔧 [TELEGRAM TEST] Test route called');
    res.json({ message: 'Telegram routes loaded successfully' });
  });
  
  // Get Telegram conversations
  app.get('/api/telegram/conversations', async (req, res) => {
    try {
      console.log('[TELEGRAM API] Getting conversations...');
      
      // Get all chats and messages
      const chats = await storage.getTelegramChats();
      const messages = await storage.getTelegramMessages();

      // Group messages by chat
      const conversations = chats.map(chat => {
        const chatMessages = messages.filter(msg => msg.chatId === chat.telegramChatId);
        const lastMessage = chatMessages.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];

        const displayName = chat.firstName 
          ? `${chat.firstName} ${chat.lastName || ''}`.trim()
          : chat.username || `Chat ${chat.telegramChatId}`;

        return {
          id: chat.id,
          chatId: chat.telegramChatId,
          name: displayName,
          username: chat.username,
          lastMessage: lastMessage ? {
            text: lastMessage.content || '',
            timestamp: lastMessage.createdAt,
            isRead: lastMessage.readStatus === 'read'
          } : null,
          messageCount: chatMessages.length,
          unreadCount: chatMessages.filter(msg => msg.readStatus !== 'read').length
        };
      });

      console.log(`[TELEGRAM API] Found ${conversations.length} conversations`);
      res.json(conversations);
    } catch (error) {
      console.error('[TELEGRAM API] Error getting conversations:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });

  // Get Telegram stats
  app.get('/api/telegram/stats', async (req, res) => {
    try {
      const settings = await storage.getTelegramSettings();
      const chats = await storage.getTelegramChats();
      
      const botInfo = telegramService.isInitialized() ? await telegramService.getBotInfo() : null;
      
      res.json({
        configured: settings.length > 0,
        isActive: settings.length > 0 && settings[0].isActive,
        username: botInfo?.username || settings[0]?.botUsername,
        webhook: botInfo && telegramService.isInitialized(),
        totalChats: chats.length,
        unreadMessages: 0, // Placeholder
        todayMessages: 0 // Placeholder
      });
    } catch (error) {
      console.error('Error fetching Telegram stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

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
        console.log('[TELEGRAM SEND] ✅ Messaggio inviato con successo, messageId:', result.messageId);
        
        try {
          // Trova la chat tramite telegramChatId
          const allChats = await storage.getTelegramChats();
          const existingChat = allChats.find(chat => chat.telegramChatId === chatId);
          
          if (existingChat) {
            console.log('[TELEGRAM SEND] ✅ Chat trovata, salvo messaggio nel database');
            
            // ✅ SALVA MESSAGGIO REALE nella tabella telegram_messages usando Drizzle ORM
            try {
              const { telegramMessages } = await import('../../shared/schema');
              const { db } = await import('../db');
              
              await db.insert(telegramMessages).values({
                chatId: existingChat.id,
                telegramMessageId: result.messageId || Math.floor(Math.random() * 1000000),
                content: message,
                direction: 'outbound',
                fromUser: 'EasyCashFlows Bot',
                toUser: existingChat.firstName || existingChat.username || 'User',
                messageType: 'text',
                isAiGenerated: false
              });
              console.log('[TELEGRAM SEND] ✅ Messaggio salvato nel database con Drizzle ORM');
            } catch (dbError) {
              console.error('[TELEGRAM SEND] ❌ ERRORE salvataggio database:', dbError);
              throw dbError;
            }
            
            // Aggiorna chat con ultimo messaggio
            await storage.updateTelegramChat(existingChat.id, {
              lastMessageId: result.messageId || Math.floor(Math.random() * 1000000)
            });
            
            // Aggiorna lastRealMessage con SQL diretto per compatibilità
            await storage.executeRawQuery(
              'UPDATE telegram_chats SET last_real_message = $1, message_count = message_count + 1, last_message_at = NOW() WHERE id = $2',
              [message.length > 100 ? message.substring(0, 100) + '...' : message, existingChat.id]
            );
            console.log('[TELEGRAM SEND] ✅ Chat aggiornata con nuovo messaggio');
            
            // ✅ CREA NOTIFICA PER MESSAGGIO INVIATO (per tutti gli admin/finance)
            const users = await storage.getUsers();
            const targetName = existingChat.firstName && existingChat.lastName 
              ? `${existingChat.firstName} ${existingChat.lastName}`
              : existingChat.firstName || existingChat.username || `Chat ${chatId}`;
            
            for (const user of users.filter(u => ['admin', 'finance'].includes(u.role))) {
              await storage.createNotification({
                userId: user.id,
                type: 'telegram_sent',
                title: 'Messaggio Telegram Inviato',
                message: `Messaggio inviato a ${targetName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
                priority: 'normal',
                category: 'telegram',
                actionUrl: '/communications?tab=telegram',
                isRead: false
              });
            }
            console.log('[TELEGRAM SEND] ✅ Notifica creata per messaggio inviato');
          }
        } catch (updateError) {
          console.error('[TELEGRAM SEND] ❌ Errore aggiornamento chat:', updateError);
        }
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Webhook endpoint for receiving Telegram updates
  app.post('/api/telegram/webhook', async (req, res) => {
    try {
      const update = req.body;
      console.log('[TELEGRAM WEBHOOK] Messaggio ricevuto:', JSON.stringify(update, null, 2));
      
      // Get settings and initialize service if needed
      const settings = await storage.getTelegramSettings();
      if (settings.length === 0) {
        console.log('[TELEGRAM WEBHOOK] Nessuna configurazione Telegram trovata');
        return res.status(200).json({ ok: true, message: 'No Telegram settings configured' });
      }
      
      const telegramConfig = settings[0];
      
      // Initialize service if not already done
      if (!telegramService.isInitialized()) {
        console.log('[TELEGRAM WEBHOOK] Inizializzazione TelegramService...');
        await telegramService.initialize({
          botToken: telegramConfig.botToken,
          botUsername: telegramConfig.botUsername,
          webhookUrl: telegramConfig.webhookUrl || undefined,
          webhookSecret: telegramConfig.webhookSecret || undefined,
          allowedUpdates: telegramConfig.allowedUpdates as string[],
          enableBusinessHours: telegramConfig.enableBusinessHours || false,
          businessHoursStart: telegramConfig.businessHoursStart || '09:00',
          businessHoursEnd: telegramConfig.businessHoursEnd || '18:00',
          businessDays: telegramConfig.businessDays as string[],
          enableAutoReply: telegramConfig.enableAutoReply || false,
          enableAiResponses: telegramConfig.enableAiResponses || false,
          aiModel: telegramConfig.aiModel || 'gpt-4o',
          aiSystemPrompt: telegramConfig.aiSystemPrompt || undefined
        });
        console.log('[TELEGRAM WEBHOOK] ✅ TelegramService inizializzato');
      }
      
      // Validate webhook secret if configured
      if (telegramConfig.webhookSecret) {
        const secretToken = req.headers['x-telegram-bot-api-secret-token'];
        if (secretToken !== telegramConfig.webhookSecret) {
          console.log('[TELEGRAM WEBHOOK] Token segreto non valido');
          return res.status(401).json({ error: 'Invalid secret token' });
        }
      }
      
      // Process the update
      console.log('[TELEGRAM WEBHOOK] Elaborazione messaggio in corso...');
      await telegramService.processUpdate(update);
      console.log('[TELEGRAM WEBHOOK] ✅ Messaggio elaborato con successo');
      
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('[TELEGRAM WEBHOOK] Errore durante l\'elaborazione:', error);
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

  // Get Telegram chats with real last messages
  app.get('/api/telegram/chats', async (req, res) => {
    try {
      console.log('[TELEGRAM API] Getting chats...');
      const chats = await storage.getTelegramChats();
      console.log('[TELEGRAM API] Found', chats.length, 'chats');
      
      // ✅ NESSUNA TRASFORMAZIONE: Restituisci dati diretti dal database
      console.log('[TELEGRAM API] ✅ Restituisco dati diretti dal database senza trasformazioni');
      res.json(chats);
    } catch (error) {
      console.error('[TELEGRAM API] Error fetching Telegram chats:', error);
      res.status(500).json({ error: 'Failed to fetch chats' });
    }
  });

  // Get messages for a specific Telegram chat
  app.get('/api/telegram/messages/:chatId', async (req, res) => {
    try {
      const { chatId } = req.params;
      console.log('[TELEGRAM API] Getting messages for chat:', chatId);
      
      // ✅ IMPLEMENTAZIONE TEMPORANEA: Restituisci messaggi fake + reali dal database 
      const realMessages = [];
      
      try {
        // Prima trova l'UUID interno della chat tramite telegramChatId
        console.log('[TELEGRAM API] Finding internal UUID for chatId:', chatId);
        const allChats = await storage.getTelegramChats();
        const targetChat = allChats.find(chat => chat.telegramChatId === chatId);
        
        if (targetChat) {
          console.log('[TELEGRAM API] Found internal UUID:', targetChat.id);
          // Ora cerca i messaggi usando l'UUID interno
          console.log('[TELEGRAM API] Trying database query with UUID using Drizzle ORM...');
          const { telegramMessages } = await import('../../shared/schema');
          const { db } = await import('../db');
          const { eq, asc } = await import('drizzle-orm');
          
          const messages = await db.select().from(telegramMessages)
            .where(eq(telegramMessages.chatId, targetChat.id))
            .orderBy(asc(telegramMessages.createdAt));
          console.log('[TELEGRAM API] Messages found:', messages);
        
          if (Array.isArray(messages) && messages.length > 0) {
            for (const msg of messages) {
              realMessages.push({
                id: msg.id?.toString() || Math.random().toString(),
                chatId: chatId,
                from: msg.direction === 'outbound' ? 'bot' : 'user',
                to: msg.direction === 'outbound' ? 'user' : 'bot',
                content: msg.content || 'Test message',
                timestamp: msg.created_at || new Date().toISOString(),
                messageType: 'text',
                isOutgoing: msg.direction === 'outbound',
                delivered: true,
                read: true,
                aiGenerated: msg.is_ai_generated || false
              });
            }
          }
        }
      } catch (dbError) {
        console.log('[TELEGRAM API] Database query failed, using fallback:', dbError);
      }
      
      // Fallback: Se non ci sono messaggi dal database, usa il vecchio sistema
      if (realMessages.length === 0) {
        const allChats = await storage.getTelegramChats();
        const chat = allChats.find(c => c.id === chatId);
        
        if (chat && chat.lastRealMessage) {
          realMessages.push({
            id: '1',
            chatId: chatId,
            from: 'user',
            to: 'bot',
            content: chat.lastRealMessage,
            timestamp: chat.lastMessageAt || new Date().toISOString(),
            messageType: 'text',
            isOutgoing: false,
            delivered: true,
            read: true,
            aiGenerated: false
          });
        }
      }
      
      console.log('[TELEGRAM API] Returning', realMessages.length, 'messages for chat:', chatId);
      res.json(realMessages);
    } catch (error) {
      console.error('[TELEGRAM API] Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
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