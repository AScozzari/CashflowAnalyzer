import type { Express } from 'express';
// Simple auth middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.user || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};
// Async error handler middleware
function handleAsyncErrors(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
import { googleCalendarService } from '../services/google-calendar-service';
import { outlookCalendarService } from '../services/outlook-calendar-service';
import type { CalendarIntegration, InsertCalendarIntegration } from '../../shared/schema';

// Calendar Integrations API Routes - REAL IMPLEMENTATION
export function setupCalendarIntegrationRoutes(app: Express): void {

  // ==================== INTEGRATION MANAGEMENT ====================

  // Get user's calendar integrations
  app.get('/api/calendar/integrations', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { storage } = await import('../storage');
      const integrations = await storage.getCalendarIntegrationsByUser(req.user.id);
      
      // Hide sensitive data from response
      const sanitizedIntegrations = integrations.map(integration => ({
        ...integration,
        accessToken: undefined,
        refreshToken: undefined
      }));

      console.log(`[CALENDAR INTEGRATIONS] Retrieved ${integrations.length} integrations for user ${req.user.id}`);
      res.json(sanitizedIntegrations);
    } catch (error) {
      console.error('[CALENDAR INTEGRATIONS] Error fetching integrations:', error);
      res.status(500).json({ error: 'Failed to fetch calendar integrations' });
    }
  }));

  // Update integration settings
  app.put('/api/calendar/integrations/:id', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { syncEnabled, syncDirection } = req.body;
      const integrationId = req.params.id;

      const { storage } = await import('../storage');
      
      // Verify user owns this integration
      const integration = await storage.getCalendarIntegration(integrationId);
      if (!integration || integration.userId !== req.user.id) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      const updatedIntegration = await storage.updateCalendarIntegration(integrationId, {
        syncEnabled: syncEnabled !== undefined ? syncEnabled : integration.syncEnabled,
        syncDirection: syncDirection || integration.syncDirection,
        updatedAt: new Date()
      });

      console.log(`[CALENDAR INTEGRATIONS] Updated integration ${integrationId}: syncEnabled=${syncEnabled}, syncDirection=${syncDirection}`);
      
      // Hide sensitive data
      const sanitized = { ...updatedIntegration, accessToken: undefined, refreshToken: undefined };
      res.json(sanitized);
    } catch (error) {
      console.error('[CALENDAR INTEGRATIONS] Error updating integration:', error);
      res.status(500).json({ error: 'Failed to update integration settings' });
    }
  }));

  // Delete integration
  app.delete('/api/calendar/integrations/:id', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const integrationId = req.params.id;
      const { storage } = await import('../storage');
      
      // Verify user owns this integration
      const integration = await storage.getCalendarIntegration(integrationId);
      if (!integration || integration.userId !== req.user.id) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      await storage.deleteCalendarIntegration(integrationId);
      
      console.log(`[CALENDAR INTEGRATIONS] Deleted integration ${integrationId} for user ${req.user.id}`);
      res.json({ success: true, message: 'Integration deleted successfully' });
    } catch (error) {
      console.error('[CALENDAR INTEGRATIONS] Error deleting integration:', error);
      res.status(500).json({ error: 'Failed to delete integration' });
    }
  }));

  // ==================== GOOGLE CALENDAR OAUTH ====================

  // Initiate Google Calendar OAuth
  app.get('/api/auth/google/calendar', requireAuth, (req: any, res: any) => {
    try {
      const authUrl = googleCalendarService.generateAuthUrl();
      console.log(`[GOOGLE OAUTH] Redirecting user ${req.user.id} to Google OAuth: ${authUrl}`);
      res.redirect(authUrl);
    } catch (error) {
      console.error('[GOOGLE OAUTH] Error generating auth URL:', error);
      res.status(500).json({ error: 'Failed to initiate Google authorization' });
    }
  });

  // Google Calendar OAuth callback
  app.get('/api/auth/google/calendar/callback', handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { code, error } = req.query;

      if (error) {
        console.error('[GOOGLE OAUTH] Authorization error:', error);
        return res.redirect(`${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/settings?error=google_auth_failed`);
      }

      if (!code) {
        console.error('[GOOGLE OAUTH] No authorization code received');
        return res.redirect(`${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/settings?error=no_auth_code`);
      }

      // Exchange code for tokens
      const tokenData = await googleCalendarService.exchangeCodeForTokens(code as string);
      
      const { storage } = await import('../storage');
      
      // Check if integration already exists for this user/email
      const existingIntegrations = await storage.getCalendarIntegrationsByUser(req.user?.id || 'anonymous');
      const existingGoogle = existingIntegrations.find(i => i.provider === 'google' && i.email === tokenData.userEmail);

      if (existingGoogle) {
        // Update existing integration
        await storage.updateCalendarIntegration(existingGoogle.id, {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || existingGoogle.refreshToken,
          tokenType: tokenData.token_type,
          tokenExpiresAt: new Date(tokenData.expiry_date),
          scope: tokenData.scope,
          isActive: true,
          syncEnabled: true,
          lastSyncAt: null,
          lastError: null,
          updatedAt: new Date()
        });
        console.log(`[GOOGLE OAUTH] Updated existing Google integration for ${tokenData.userEmail}`);
      } else {
        // Create new integration
        const newIntegration: InsertCalendarIntegration = {
          userId: req.user?.id || 'anonymous',
          provider: 'google',
          providerAccountId: tokenData.userAccountId,
          email: tokenData.userEmail,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || null,
          tokenType: tokenData.token_type,
          tokenExpiresAt: new Date(tokenData.expiry_date),
          scope: tokenData.scope,
          isActive: true,
          syncEnabled: true,
          syncDirection: 'bidirectional',
          lastSyncAt: null,
          lastError: null,
        };

        await storage.createCalendarIntegration(newIntegration);
        console.log(`[GOOGLE OAUTH] Created new Google integration for ${tokenData.userEmail}`);
      }

      // Redirect to settings with success
      res.redirect(`${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/settings?success=google_calendar_connected`);
    } catch (error) {
      console.error('[GOOGLE OAUTH] Callback error:', error);
      res.redirect(`${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/settings?error=google_auth_failed`);
    }
  }));

  // ==================== MICROSOFT OUTLOOK OAUTH ====================

  // Initiate Outlook Calendar OAuth
  app.get('/api/auth/outlook/calendar', requireAuth, (req: any, res: any) => {
    try {
      const authUrl = outlookCalendarService.generateAuthUrl();
      console.log(`[OUTLOOK OAUTH] Redirecting user ${req.user.id} to Microsoft OAuth: ${authUrl}`);
      res.redirect(authUrl);
    } catch (error) {
      console.error('[OUTLOOK OAUTH] Error generating auth URL:', error);
      res.status(500).json({ error: 'Failed to initiate Outlook authorization' });
    }
  });

  // Outlook Calendar OAuth callback
  app.get('/api/auth/outlook/calendar/callback', handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { code, error } = req.query;

      if (error) {
        console.error('[OUTLOOK OAUTH] Authorization error:', error);
        return res.redirect(`${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/settings?error=outlook_auth_failed`);
      }

      if (!code) {
        console.error('[OUTLOOK OAUTH] No authorization code received');
        return res.redirect(`${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/settings?error=no_auth_code`);
      }

      // Exchange code for tokens
      const tokenData = await outlookCalendarService.exchangeCodeForTokens(code as string);
      
      const { storage } = await import('../storage');
      
      // Check if integration already exists
      const existingIntegrations = await storage.getCalendarIntegrationsByUser(req.user?.id || 'anonymous');
      const existingOutlook = existingIntegrations.find(i => i.provider === 'outlook' && i.email === tokenData.userEmail);

      if (existingOutlook) {
        // Update existing integration
        await storage.updateCalendarIntegration(existingOutlook.id, {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenType: tokenData.token_type,
          tokenExpiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
          scope: tokenData.scope,
          isActive: true,
          syncEnabled: true,
          lastSyncAt: null,
          lastError: null,
          updatedAt: new Date()
        });
        console.log(`[OUTLOOK OAUTH] Updated existing Outlook integration for ${tokenData.userEmail}`);
      } else {
        // Create new integration
        const newIntegration: InsertCalendarIntegration = {
          userId: req.user?.id || 'anonymous',
          provider: 'outlook',
          providerAccountId: tokenData.userAccountId,
          email: tokenData.userEmail,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenType: tokenData.token_type,
          tokenExpiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
          scope: tokenData.scope,
          isActive: true,
          syncEnabled: true,
          syncDirection: 'bidirectional',
          lastSyncAt: null,
          lastError: null,
        };

        await storage.createCalendarIntegration(newIntegration);
        console.log(`[OUTLOOK OAUTH] Created new Outlook integration for ${tokenData.userEmail}`);
      }

      // Redirect to settings with success
      res.redirect(`${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/settings?success=outlook_calendar_connected`);
    } catch (error) {
      console.error('[OUTLOOK OAUTH] Callback error:', error);
      res.redirect(`${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/settings?error=outlook_auth_failed`);
    }
  }));

  // ==================== SYNCHRONIZATION ====================

  // Manual sync for specific provider
  app.post('/api/calendar/sync/:provider', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const provider = req.params.provider;
      const { direction = 'bidirectional' } = req.body;

      if (!['google', 'outlook'].includes(provider)) {
        return res.status(400).json({ error: 'Invalid provider. Must be "google" or "outlook"' });
      }

      const { storage } = await import('../storage');
      const integrations = await storage.getCalendarIntegrationsByUser(req.user.id);
      const integration = integrations.find(i => i.provider === provider && i.isActive);

      if (!integration) {
        return res.status(404).json({ error: `No active ${provider} integration found` });
      }

      if (!integration.syncEnabled) {
        return res.status(400).json({ error: `${provider} synchronization is disabled` });
      }

      let syncResults: any = {};

      try {
        if (provider === 'google') {
          if (direction === 'inbound' || direction === 'bidirectional') {
            // Import from Google
            const importResults = await googleCalendarService.syncFromGoogle(integration);
            syncResults.imported = importResults;
          }

          if (direction === 'outbound' || direction === 'bidirectional') {
            // Export to Google
            const ecfEvents = await storage.getCalendarEventsByUser(req.user.id);
            const eventsToSync = ecfEvents.filter(e => !e.googleCalendarEventId); // Only new events
            const exportResults = await googleCalendarService.syncToGoogle(integration, eventsToSync);
            syncResults.exported = exportResults;
          }
        } else if (provider === 'outlook') {
          if (direction === 'inbound' || direction === 'bidirectional') {
            // Import from Outlook
            const importResults = await outlookCalendarService.syncFromOutlook(integration);
            syncResults.imported = importResults;
          }

          if (direction === 'outbound' || direction === 'bidirectional') {
            // Export to Outlook
            const ecfEvents = await storage.getCalendarEventsByUser(req.user.id);
            const eventsToSync = ecfEvents.filter(e => !e.outlookEventId); // Only new events
            const exportResults = await outlookCalendarService.syncToOutlook(integration, eventsToSync);
            syncResults.exported = exportResults;
          }
        }

        // Update integration sync status
        await storage.updateCalendarIntegration(integration.id, {
          lastSyncAt: new Date(),
          lastError: null,
          updatedAt: new Date()
        });

        const totalSynced = (syncResults.imported?.importedEvents || 0) + (syncResults.exported?.exportedEvents || 0);
        
        console.log(`[CALENDAR SYNC] Completed ${provider} sync for user ${req.user.id}: ${totalSynced} events`);
        
        res.json({
          success: true,
          provider,
          direction,
          syncedEvents: totalSynced,
          results: syncResults,
          timestamp: new Date().toISOString()
        });

      } catch (syncError: any) {
        // Update integration with error
        await storage.updateCalendarIntegration(integration.id, {
          lastError: syncError.message,
          updatedAt: new Date()
        });

        throw syncError;
      }

    } catch (error: any) {
      console.error(`[CALENDAR SYNC] Error syncing ${req.params.provider}:`, error);
      res.status(500).json({ 
        error: 'Synchronization failed', 
        details: error.message,
        provider: req.params.provider 
      });
    }
  }));

  // Test integration connection
  app.post('/api/calendar/integrations/:id/test', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const integrationId = req.params.id;
      const { storage } = await import('../storage');
      
      const integration = await storage.getCalendarIntegration(integrationId);
      if (!integration || integration.userId !== req.user.id) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      let testResults: any;

      if (integration.provider === 'google') {
        testResults = await googleCalendarService.testConnection(integration);
      } else if (integration.provider === 'outlook') {
        testResults = await outlookCalendarService.testConnection(integration);
      } else {
        return res.status(400).json({ error: 'Unsupported provider' });
      }

      console.log(`[CALENDAR TEST] Connection test for ${integration.provider}: ${testResults.success ? 'SUCCESS' : 'FAILED'}`);
      
      res.json({
        integration: {
          id: integration.id,
          provider: integration.provider,
          email: integration.email
        },
        test: testResults,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('[CALENDAR TEST] Connection test failed:', error);
      res.status(500).json({ 
        error: 'Connection test failed', 
        details: error.message 
      });
    }
  }));

  console.log('✅ Calendar Integration API routes setup complete');
}