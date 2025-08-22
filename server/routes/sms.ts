import { Express } from 'express';
import { z } from 'zod';
import { insertSmsSettingsSchema } from '@shared/schema';
import type { DatabaseStorage } from '../storage';

export function setupSmsRoutes(app: Express) {
  console.log('🔧 [SMS ROUTES] Setting up SMS routes...');
  
  // Get SMS settings
  app.get('/api/sms/settings', async (req, res) => {
    try {
      console.log('[SMS API] Getting SMS settings...');
      const { storage } = await import('../storage');
      const settings = await storage.getSmsSettings();
      console.log('[SMS API] SMS settings found:', !!settings);
      res.json(settings || {});
    } catch (error) {
      console.error('Error fetching SMS settings:', error);
      res.status(500).json({ error: 'Failed to fetch SMS settings' });
    }
  });

  // Update SMS settings  
  app.post('/api/sms/settings', async (req, res) => {
    try {
      console.log('[SMS API] Updating SMS settings...');
      console.log('[SMS API] Request body:', req.body);
      
      const { storage } = await import('../storage');
      
      // Validate data with Zod schema
      const validatedData = insertSmsSettingsSchema.parse(req.body);
      console.log('[SMS API] Validated data:', validatedData);
      
      // Check if settings exist
      const existingSettings = await storage.getSmsSettings();
      let result;
      
      if (existingSettings) {
        console.log('[SMS API] Updating existing settings...');
        result = await storage.updateSmsSettings(existingSettings.id, validatedData);
      } else {
        console.log('[SMS API] Creating new settings...');
        result = await storage.createSmsSettings(validatedData);
      }
      
      console.log('[SMS API] Settings saved successfully:', result.id);
      res.json(result);
    } catch (error) {
      console.error('🔴 [SMS API] Error saving settings:', error);
      
      if (error instanceof z.ZodError) {
        console.error('🔴 SMS VALIDATION ERROR:', error.errors);
        res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      } else {
        console.error('🔴 SMS SETTINGS ERROR:', error);
        res.status(500).json({ 
          error: 'Failed to save SMS settings',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Test SMS connection
  app.post('/api/sms/test', async (req, res) => {
    try {
      console.log('[SMS API] Testing SMS connection...');
      const { storage } = await import('../storage');
      const settings = await storage.getSmsSettings();
      
      if (!settings) {
        return res.status(400).json({ 
          error: 'No SMS settings found. Please configure SMS settings first.' 
        });
      }

      if (!settings.username || !settings.password) {
        return res.status(400).json({ 
          error: 'SMS credentials not configured. Please add username and password.' 
        });
      }

      // ✅ TEST REALE CON API SKEBBY - Autenticazione corretta
      console.log('[SMS API] Executing Skebby login and credit check...');
      
      try {
        // STEP 1: Login per ottenere user_key e session_key
        const loginUrl = `${settings.apiUrl}login?username=${encodeURIComponent(settings.username)}&password=${encodeURIComponent(settings.password)}`;
        console.log('[SMS API] Skebby login URL:', loginUrl);
        
        const loginResponse = await fetch(loginUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('[SMS API] Skebby login response status:', loginResponse.status);
        
        if (!loginResponse.ok) {
          const loginError = await loginResponse.text();
          console.log('[SMS API] ❌ Skebby login failed:', loginResponse.status, loginError);
          
          return res.status(400).json({
            success: false,
            error: 'Skebby login failed',
            message: `Login HTTP ${loginResponse.status}: ${loginError}`,
            provider: settings.providerName
          });
        }

        // STEP 2: Parse user_key;session_key dalla risposta
        const loginData = await loginResponse.text();
        console.log('[SMS API] Skebby login data:', loginData);
        
        const [userKey, sessionKey] = loginData.split(';');
        if (!userKey || !sessionKey) {
          return res.status(400).json({
            success: false,
            error: 'Invalid Skebby login response',
            message: 'Login response format incorrect',
            provider: settings.providerName
          });
        }

        // STEP 3: Login riuscito = connessione verificata
        console.log('[SMS API] ✅ Skebby connection successful! Login OK, user_key:', userKey);
        
        // Il login riuscito è sufficiente per confermare che le credenziali e la connessione funzionano
        res.json({
          success: true,
          message: 'Skebby connection successful! Credentials verified.',
          provider: settings.providerName,
          isActive: settings.isActive,
          userKey: userKey,
          loginStatus: 'OK'
        });
      } catch (apiError) {
        console.error('[SMS API] ❌ Skebby API call failed:', apiError);
        
        res.status(500).json({
          success: false,
          error: 'Failed to connect to Skebby API',
          message: apiError instanceof Error ? apiError.message : 'Network error',
          provider: settings.providerName
        });
      }
      
    } catch (error) {
      console.error('Error testing SMS connection:', error);
      res.status(500).json({ 
        error: 'Failed to test SMS connection',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Test connection endpoint (alias per compatibilità frontend)
  app.post('/api/sms/test-connection', async (req, res) => {
    // Reindirizza alla stessa logica del test principale
    return app._router.handle({ ...req, url: '/api/sms/test', method: 'POST' }, res);
  });

  // Send SMS endpoint
  app.post('/api/sms/send', async (req, res) => {
    try {
      console.log('[SMS API] Sending SMS...');
      const { to, message } = req.body;
      
      if (!to || !message) {
        return res.status(400).json({
          error: 'Missing required fields: to and message'
        });
      }

      const { storage } = await import('../storage');
      const settings = await storage.getSmsSettings();
      
      if (!settings) {
        return res.status(400).json({ 
          error: 'No SMS settings configured. Please configure SMS settings first.' 
        });
      }

      if (!settings.username || !settings.password) {
        return res.status(400).json({ 
          error: 'SMS credentials not configured. Please add username and password.' 
        });
      }

      console.log('[SMS API] Sending SMS to:', to, 'Message:', message);

      // STEP 1: Login per ottenere user_key e session_key
      const loginUrl = `${settings.apiUrl}login?username=${encodeURIComponent(settings.username)}&password=${encodeURIComponent(settings.password)}`;
      console.log('[SMS API] Skebby login for SMS send...');
      
      const loginResponse = await fetch(loginUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!loginResponse.ok) {
        const loginError = await loginResponse.text();
        console.log('[SMS API] ❌ Skebby login failed:', loginResponse.status, loginError);
        
        return res.status(400).json({
          success: false,
          error: 'Skebby login failed',
          message: `Login failed: HTTP ${loginResponse.status}`
        });
      }

      // STEP 2: Parse user_key;session_key dalla risposta
      const loginData = await loginResponse.text();
      console.log('[SMS API] Skebby login successful for SMS send');
      
      const [userKey, sessionKey] = loginData.split(';');
      if (!userKey || !sessionKey) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Skebby login response',
          message: 'Login response format incorrect'
        });
      }

      // STEP 3: Invia SMS usando l'API Skebby
      const smsPayload = {
        message: message,
        recipient: [`+39${to.replace(/^\+39/, '')}`], // Assicura formato +39
        message_type: settings.messageType || 'GP',
        sender: settings.defaultSender || 'EasyDigital'
      };

      console.log('[SMS API] Sending SMS with payload:', JSON.stringify(smsPayload));

      const smsResponse = await fetch(`${settings.apiUrl}sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_key': userKey,
          'Session_key': sessionKey
        },
        body: JSON.stringify(smsPayload)
      });

      console.log('[SMS API] Skebby SMS response status:', smsResponse.status);

      if (smsResponse.ok) {
        const smsResult = await smsResponse.json();
        console.log('[SMS API] ✅ SMS sent successfully:', smsResult);
        
        // Create anonymous customer if phone not registered
        const cleanPhoneNumber = `+39${to.replace(/^\+39/, '')}`;
        try {
          const customers = await storage.getCustomers();
          const resources = await storage.getResources();
          
          const existingCustomer = customers.find(c => 
            c.phone === cleanPhoneNumber || 
            c.phone === to || 
            c.phone === to.replace('+39', '') ||
            c.phone === `+39${to.replace('+39', '')}`
          );
          
          const existingResource = resources.find(r => 
            r.phone === cleanPhoneNumber ||
            r.phone === to ||
            r.phone === to.replace('+39', '') ||
            r.phone === `+39${to.replace('+39', '')}`
          );
          
          if (!existingCustomer && !existingResource) {
            console.log('[SMS API] Creating anonymous customer for:', cleanPhoneNumber);
            await storage.createCustomer({
              name: `Cliente Anonimo ${cleanPhoneNumber.slice(-4)}`,
              type: 'individual',
              email: `anonimo${cleanPhoneNumber.slice(-4).replace('+', '')}@sms-contact.local`,
              phone: cleanPhoneNumber,
              address: 'Non specificato',
              city: 'Non specificato', 
              province: 'Non specificato',
              postalCode: '00000',
              country: 'Italia',
              taxCode: '',
              vatNumber: '',
              isActive: true,
              notes: `Cliente creato automaticamente da SMS al numero ${cleanPhoneNumber}`
            });
            console.log('[SMS API] ✅ Anonymous customer created');
          }
        } catch (customerError) {
          console.error('[SMS API] ❌ Error managing contacts:', customerError);
        }

        // Save message to database
        try {
          await storage.createSmsMessage({
            recipient: cleanPhoneNumber,
            sender: 'EasyCashFlows',
            messageBody: message,
            messageType: 'GP',
            status: 'sent',
            providerId: smsResult.order_id,
            providerStatus: 'OK',
            characterCount: message.length,
            sentAt: new Date()
          });
          console.log('[SMS API] ✅ Message saved to database');
        } catch (dbError) {
          console.error('[SMS API] ❌ Database save error:', dbError);
        }
        
        res.json({
          success: true,
          message: 'SMS sent successfully!',
          to: cleanPhoneNumber,
          messageId: smsResult.order_id || 'unknown',
          provider: 'skebby',
          result: smsResult
        });
      } else {
        const smsError = await smsResponse.text();
        console.log('[SMS API] ❌ SMS send failed:', smsResponse.status, smsError);
        
        res.status(400).json({
          success: false,
          error: 'SMS send failed',
          message: `SMS API HTTP ${smsResponse.status}: ${smsError}`,
          to: to
        });
      }
      
    } catch (error) {
      console.error('Error sending SMS:', error);
      res.status(500).json({ 
        error: 'Failed to send SMS',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get SMS statistics
  app.get('/api/sms/stats', async (req, res) => {
    try {
      console.log('[SMS API] Getting SMS statistics...');
      const { storage } = await import('../storage');
      
      const settings = await storage.getSmsSettings();
      const stats = {
        isConfigured: !!settings,
        isActive: settings?.isActive || false,
        provider: settings?.providerName || 'none',
        lastTest: settings?.updatedAt || null,
        deliveryReceiptsEnabled: settings?.deliveryReceiptsEnabled || false
      };
      
      console.log('[SMS API] SMS stats:', stats);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching SMS stats:', error);
      res.status(500).json({ error: 'Failed to fetch SMS statistics' });
    }
  });
  
  // Get SMS conversations/contacts
  app.get('/api/sms/conversations', async (req, res) => {
    try {
      console.log('[SMS API] Getting SMS conversations...');
      const { storage } = await import('../storage');
      
      // Get all SMS messages grouped by recipient
      const messages = await storage.getSmsMessages(1000); // Get recent messages
      
      // Group by recipient and get contact info
      const conversationMap = new Map<string, any>();
      
      for (const message of messages) {
        const phone = message.recipient;
        
        if (!conversationMap.has(phone)) {
          // Try to find existing customer/resource with this phone
          const customers = await storage.getCustomers();
          const resources = await storage.getResources();
          
          const customer = customers.find(c => c.phone === phone || c.phone === `+39${phone}` || c.phone === phone.replace('+39', ''));
          const resource = resources.find(r => r.phone === phone || r.phone === `+39${phone}` || r.phone === phone.replace('+39', ''));
          
          const name = customer?.name || resource?.name || `Cliente Anonimo ${phone.slice(-4)}`;
          
          conversationMap.set(phone, {
            id: phone,
            name,
            phone,
            lastMessage: message.messageBody,
            lastSeen: message.createdAt,
            messageCount: 1,
            contactType: customer ? 'customer' : resource ? 'resource' : 'anonymous'
          });
        } else {
          // Update existing conversation
          const conv = conversationMap.get(phone);
          conv.messageCount++;
          if (new Date(message.createdAt!) > new Date(conv.lastSeen)) {
            conv.lastMessage = message.messageBody;
            conv.lastSeen = message.createdAt;
          }
        }
      }
      
      const conversations = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
      
      console.log('[SMS API] Found', conversations.length, 'SMS conversations');
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching SMS conversations:', error);
      res.status(500).json({ error: 'Failed to fetch SMS conversations' });
    }
  });

  // Get SMS messages for a specific recipient
  app.get('/api/sms/messages/:phone', async (req, res) => {
    try {
      const { phone } = req.params;
      console.log('[SMS API] Getting SMS messages for:', phone);
      const { storage } = await import('../storage');
      
      const messages = await storage.getSmsMessages(500);
      const phoneMessages = messages
        .filter(m => m.recipient === phone || m.recipient === `+39${phone}` || m.recipient === phone.replace('+39', ''))
        .map(m => ({
          id: m.id.toString(),
          from: 'EasyCashFlows',
          to: m.recipient,
          content: m.messageBody,
          timestamp: m.createdAt,
          isOutgoing: true,
          status: m.status as 'pending' | 'sent' | 'delivered' | 'failed',
          cost: 0.10
        }))
        .sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());
      
      console.log('[SMS API] Found', phoneMessages.length, 'messages for phone:', phone);
      res.json(phoneMessages);
    } catch (error) {
      console.error('Error fetching SMS messages:', error);
      res.status(500).json({ error: 'Failed to fetch SMS messages' });
    }
  });

  // Get SMS templates  
  app.get('/api/sms/templates', async (req, res) => {
    try {
      console.log('[SMS API] Getting SMS templates...');
      const { storage } = await import('../storage');
      const templates = await storage.getSmsTemplates();
      
      const formattedTemplates = templates.map(t => ({
        id: t.id.toString(),
        name: t.name,
        content: t.messageBody,
        category: t.category,
        variables: t.variables ? JSON.parse(t.variables) : [],
        characterCount: t.characterCount || t.messageBody.length
      }));
      
      console.log('[SMS API] Found', formattedTemplates.length, 'SMS templates');
      res.json(formattedTemplates);
    } catch (error) {
      console.error('Error fetching SMS templates:', error);
      res.status(500).json({ error: 'Failed to fetch SMS templates' });
    }
  });

  console.log('✅ [SMS ROUTES] SMS routes setup completed');
}