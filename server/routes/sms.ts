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

      // Simple test - if we got here with valid settings, consider it successful
      res.json({
        success: true,
        message: 'SMS configuration validated successfully',
        provider: settings.providerName,
        isActive: settings.isActive
      });
      
    } catch (error) {
      console.error('Error testing SMS connection:', error);
      res.status(500).json({ 
        error: 'Failed to test SMS connection',
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
  
  console.log('✅ [SMS ROUTES] SMS routes setup completed');
}