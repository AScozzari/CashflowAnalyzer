import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import type { CalendarIntegration, CalendarEvent } from '../../shared/schema';

// Custom Authentication Provider for Microsoft Graph
class OutlookAuthProvider implements AuthenticationProvider {
  private accessToken: string;
  
  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getAccessToken(): Promise<string> {
    return this.accessToken;
  }
}

// Microsoft Outlook Calendar Service - REAL API Integration
export class OutlookCalendarService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private graphClient: Client | null = null;

  constructor() {
    this.clientId = process.env.MICROSOFT_CALENDAR_CLIENT_ID || '';
    this.clientSecret = process.env.MICROSOFT_CALENDAR_CLIENT_SECRET || '';
    this.redirectUri = process.env.MICROSOFT_REDIRECT_URI || 
      `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/api/auth/outlook/calendar/callback`;
  }

  // Verifica se il servizio è configurato con le credenziali OAuth
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  // Genera URL di autorizzazione OAuth Microsoft
  generateAuthUrl(): string {
    const scopes = [
      'https://graph.microsoft.com/Calendars.ReadWrite',
      'https://graph.microsoft.com/User.Read'
    ].join(' ');

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${this.clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `response_mode=query&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `state=outlook_calendar`;

    return authUrl;
  }

  // Scambia codice autorizzazione con tokens
  async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    userEmail: string;
    userAccountId: string;
  }> {
    try {
      const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      
      const formData = new URLSearchParams();
      formData.append('client_id', this.clientId);
      formData.append('client_secret', this.clientSecret);
      formData.append('code', code);
      formData.append('grant_type', 'authorization_code');
      formData.append('redirect_uri', this.redirectUri);

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token exchange failed: ${response.status} ${errorData}`);
      }

      const tokens = await response.json();

      // Ottieni info utente
      const userInfo = await this.getUserInfo(tokens.access_token);

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type || 'Bearer',
        expires_in: tokens.expires_in,
        scope: tokens.scope,
        userEmail: userInfo.mail || userInfo.userPrincipalName,
        userAccountId: userInfo.id
      };
    } catch (error) {
      console.error('[OUTLOOK CALENDAR] Error exchanging code for tokens:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }> {
    try {
      const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      
      const formData = new URLSearchParams();
      formData.append('client_id', this.clientId);
      formData.append('client_secret', this.clientSecret);
      formData.append('grant_type', 'refresh_token');
      formData.append('refresh_token', refreshToken);

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token refresh failed: ${response.status} ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[OUTLOOK CALENDAR] Token refresh failed:', error);
      throw error;
    }
  }

  // Configura Graph client con integration
  private async setCredentials(integration: CalendarIntegration): Promise<void> {
    if (!integration.accessToken) {
      throw new Error('No access token available for Outlook integration');
    }

    // Check if token is expired and refresh if needed
    const tokenExpiry = integration.tokenExpiresAt ? new Date(integration.tokenExpiresAt) : null;
    const now = new Date();

    if (tokenExpiry && now >= tokenExpiry && integration.refreshToken) {
      console.log('[OUTLOOK CALENDAR] Access token expired, refreshing...');
      try {
        const refreshedTokens = await this.refreshToken(integration.refreshToken);
        
        // TODO: Update integration in database with new tokens
        console.log('[OUTLOOK CALENDAR] Token refreshed successfully');
        
        // Use new token for this session
        const authProvider = new OutlookAuthProvider(refreshedTokens.access_token);
        this.graphClient = Client.initWithMiddleware({ authProvider });
      } catch (refreshError) {
        console.error('[OUTLOOK CALENDAR] Token refresh failed:', refreshError);
        throw new Error('Access token expired and refresh failed');
      }
    } else {
      // Use existing token
      const authProvider = new OutlookAuthProvider(integration.accessToken);
      this.graphClient = Client.initWithMiddleware({ authProvider });
    }
  }

  // Ottieni info utente
  private async getUserInfo(accessToken: string): Promise<any> {
    const authProvider = new OutlookAuthProvider(accessToken);
    const client = Client.initWithMiddleware({ authProvider });
    
    return await client.api('/me').get();
  }

  // Sincronizza eventi da Outlook a EasyCashFlows
  async syncFromOutlook(integration: CalendarIntegration, limit: number = 250): Promise<{
    importedEvents: number;
    skippedEvents: number;
    errors: string[];
  }> {
    try {
      await this.setCredentials(integration);
      
      if (!this.graphClient) {
        throw new Error('Graph client not initialized');
      }

      // Data range: ultimi 30 giorni e prossimi 90 giorni
      const startDateTime = new Date();
      startDateTime.setDate(startDateTime.getDate() - 30);
      const endDateTime = new Date();
      endDateTime.setDate(endDateTime.getDate() + 90);

      console.log(`[OUTLOOK CALENDAR] Fetching events from ${startDateTime.toISOString()} to ${endDateTime.toISOString()}`);

      // Query Outlook events
      const events = await this.graphClient
        .api('/me/events')
        .filter(`start/dateTime ge '${startDateTime.toISOString()}' and end/dateTime le '${endDateTime.toISOString()}'`)
        .top(limit)
        .orderby('start/dateTime')
        .get();

      const outlookEvents = events.value || [];
      let importedEvents = 0;
      let skippedEvents = 0;
      const errors: string[] = [];

      console.log(`[OUTLOOK CALENDAR] Found ${outlookEvents.length} events to process`);

      for (const outlookEvent of outlookEvents) {
        try {
          // Skip events already synced
          if (outlookEvent.id && await this.isEventAlreadySynced(outlookEvent.id)) {
            skippedEvents++;
            continue;
          }

          // Convert Outlook event to EasyCashFlows format
          const easyCashEvent = this.convertOutlookEventToECF(outlookEvent, integration.userId);
          
          // Import event to database
          await this.importEventToDatabase(easyCashEvent);
          importedEvents++;

          console.log(`[OUTLOOK CALENDAR] Imported event: ${outlookEvent.subject || 'Untitled'}`);
        } catch (eventError: any) {
          console.error(`[OUTLOOK CALENDAR] Error processing event ${outlookEvent.id}:`, eventError);
          errors.push(`Event "${outlookEvent.subject || outlookEvent.id}": ${eventError.message}`);
        }
      }

      return { importedEvents, skippedEvents, errors };
    } catch (error: any) {
      console.error('[OUTLOOK CALENDAR] Sync from Outlook failed:', error);
      throw new Error(`Outlook Calendar sync failed: ${error.message}`);
    }
  }

  // Sincronizza eventi da EasyCashFlows a Outlook
  async syncToOutlook(integration: CalendarIntegration, events: CalendarEvent[]): Promise<{
    exportedEvents: number;
    updatedEvents: number;
    errors: string[];
  }> {
    try {
      await this.setCredentials(integration);
      
      if (!this.graphClient) {
        throw new Error('Graph client not initialized');
      }

      let exportedEvents = 0;
      let updatedEvents = 0;
      const errors: string[] = [];

      console.log(`[OUTLOOK CALENDAR] Exporting ${events.length} events to Outlook`);

      for (const ecfEvent of events) {
        try {
          const outlookEvent = this.convertECFEventToOutlook(ecfEvent);

          if (ecfEvent.outlookEventId) {
            // Update existing event
            await this.graphClient
              .api(`/me/events/${ecfEvent.outlookEventId}`)
              .patch(outlookEvent);
            
            updatedEvents++;
            console.log(`[OUTLOOK CALENDAR] Updated event: ${ecfEvent.title}`);
          } else {
            // Create new event
            const response = await this.graphClient
              .api('/me/events')
              .post(outlookEvent);
            
            // Update ECF event with Outlook ID
            await this.updateECFEventWithOutlookId(ecfEvent.id, response.id);
            exportedEvents++;
            console.log(`[OUTLOOK CALENDAR] Created event: ${ecfEvent.title} (ID: ${response.id})`);
          }
        } catch (eventError: any) {
          console.error(`[OUTLOOK CALENDAR] Error syncing event ${ecfEvent.id}:`, eventError);
          errors.push(`Event "${ecfEvent.title}": ${eventError.message}`);
        }
      }

      return { exportedEvents, updatedEvents, errors };
    } catch (error: any) {
      console.error('[OUTLOOK CALENDAR] Sync to Outlook failed:', error);
      throw new Error(`Outlook Calendar export failed: ${error.message}`);
    }
  }

  // Elimina evento da Outlook
  async deleteFromOutlook(integration: CalendarIntegration, outlookEventId: string): Promise<void> {
    try {
      await this.setCredentials(integration);
      
      if (!this.graphClient) {
        throw new Error('Graph client not initialized');
      }
      
      await this.graphClient.api(`/me/events/${outlookEventId}`).delete();

      console.log(`[OUTLOOK CALENDAR] Deleted event ID: ${outlookEventId}`);
    } catch (error: any) {
      console.error(`[OUTLOOK CALENDAR] Error deleting event ${outlookEventId}:`, error);
      throw new Error(`Failed to delete Outlook event: ${error.message}`);
    }
  }

  // Test connessione API
  async testConnection(integration: CalendarIntegration): Promise<{
    success: boolean;
    userEmail: string;
    calendarName: string;
    eventsCount: number;
  }> {
    try {
      await this.setCredentials(integration);
      
      if (!this.graphClient) {
        throw new Error('Graph client not initialized');
      }

      // Test basic API access
      const userInfo = await this.graphClient.api('/me').get();
      
      // Count recent events
      const eventsResponse = await this.graphClient
        .api('/me/events')
        .filter(`start/dateTime ge '${new Date().toISOString()}'`)
        .top(10)
        .get();

      return {
        success: true,
        userEmail: userInfo.mail || userInfo.userPrincipalName,
        calendarName: userInfo.displayName || 'Outlook Calendar',
        eventsCount: eventsResponse.value?.length || 0
      };
    } catch (error: any) {
      console.error('[OUTLOOK CALENDAR] Connection test failed:', error);
      return {
        success: false,
        userEmail: integration.email,
        calendarName: '',
        eventsCount: 0
      };
    }
  }

  // Helper methods
  private convertOutlookEventToECF(outlookEvent: any, userId: string): Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> {
    const startDate = new Date(outlookEvent.start.dateTime + 'Z'); // Outlook gives UTC time
    const endDate = new Date(outlookEvent.end.dateTime + 'Z');

    return {
      title: `[Outlook] ${outlookEvent.subject || 'Untitled Event'}`,
      description: outlookEvent.body?.content || null,
      startDate,
      endDate,
      isAllDay: outlookEvent.isAllDay || false,
      location: outlookEvent.location?.displayName || null,
      createdByUserId: userId,
      assignedToUserId: userId,
      googleCalendarEventId: null,
      outlookEventId: outlookEvent.id,
      isActive: true,
      eventType: 'meeting',
      priority: 'normal',
      status: outlookEvent.responseStatus?.response === 'accepted' ? 'confirmed' : 'tentative'
    };
  }

  private convertECFEventToOutlook(ecfEvent: CalendarEvent): any {
    const outlookEvent: any = {
      subject: ecfEvent.title.replace('[ECF] ', ''),
      body: {
        contentType: 'text',
        content: `[EasyCashFlows] ${ecfEvent.description || ''}`
      },
      start: {
        dateTime: ecfEvent.startDate.toISOString(),
        timeZone: 'Europe/Rome'
      },
      end: {
        dateTime: ecfEvent.endDate.toISOString(),
        timeZone: 'Europe/Rome'
      },
      isAllDay: ecfEvent.isAllDay
    };

    if (ecfEvent.location) {
      outlookEvent.location = {
        displayName: ecfEvent.location
      };
    }

    return outlookEvent;
  }

  private async isEventAlreadySynced(outlookEventId: string): Promise<boolean> {
    try {
      const { storage } = await import('../storage');
      const existingEvents = await storage.getCalendarEvents();
      return existingEvents.some(event => event.outlookEventId === outlookEventId);
    } catch (error) {
      console.error('[OUTLOOK CALENDAR] Error checking event sync status:', error);
      return false;
    }
  }

  private async importEventToDatabase(event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const { storage } = await import('../storage');
      await storage.createCalendarEvent(event);
    } catch (error) {
      console.error('[OUTLOOK CALENDAR] Error importing event to database:', error);
      throw error;
    }
  }

  private async updateECFEventWithOutlookId(ecfEventId: string, outlookEventId: string): Promise<void> {
    try {
      const { storage } = await import('../storage');
      await storage.updateCalendarEvent(ecfEventId, { outlookEventId: outlookEventId });
    } catch (error) {
      console.error('[OUTLOOK CALENDAR] Error updating ECF event with Outlook ID:', error);
      throw error;
    }
  }
}

export const outlookCalendarService = new OutlookCalendarService();