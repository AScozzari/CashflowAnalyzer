import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import type { CalendarIntegration, CalendarEvent } from '../../shared/schema';

// Google Calendar Service - REAL API Integration
export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/api/auth/google/calendar/callback`
    );
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  // Genera URL di autorizzazione OAuth
  generateAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      include_granted_scopes: true,
    });
  }

  // Scambia codice autorizzazione con tokens
  async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    token_type: string;
    expiry_date: number;
    scope: string;
    userEmail: string;
    userAccountId: string;
  }> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Ottieni info utente per email e account ID
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data: userInfo } = await oauth2.userinfo.get();

      return {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type || 'Bearer',
        expiry_date: tokens.expiry_date!,
        scope: tokens.scope!,
        userEmail: userInfo.email!,
        userAccountId: userInfo.id!
      };
    } catch (error) {
      console.error('[GOOGLE CALENDAR] Error exchanging code for tokens:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  // Configura client con integration esistente
  async setCredentials(integration: CalendarIntegration): Promise<void> {
    const credentials = {
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
      token_type: integration.tokenType || 'Bearer',
      expiry_date: integration.tokenExpiresAt ? new Date(integration.tokenExpiresAt).getTime() : undefined
    };

    this.oauth2Client.setCredentials(credentials);

    // Auto-refresh token se necessario
    this.oauth2Client.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        console.log('[GOOGLE CALENDAR] New refresh token received');
        // TODO: Update integration in database with new tokens
      }
    });
  }

  // Sincronizza eventi da Google Calendar a EasyCashFlows
  async syncFromGoogle(integration: CalendarIntegration, limit: number = 250): Promise<{
    importedEvents: number;
    skippedEvents: number;
    errors: string[];
  }> {
    try {
      await this.setCredentials(integration);

      // Data range: ultimi 30 giorni e prossimi 90 giorni
      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - 30);
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 90);

      console.log(`[GOOGLE CALENDAR] Fetching events from ${timeMin.toISOString()} to ${timeMax.toISOString()}`);

      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults: limit,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      let importedEvents = 0;
      let skippedEvents = 0;
      const errors: string[] = [];

      console.log(`[GOOGLE CALENDAR] Found ${events.length} events to process`);

      for (const googleEvent of events) {
        try {
          // Skip events already synced (check by Google ID)
          if (googleEvent.id && await this.isEventAlreadySynced(googleEvent.id)) {
            skippedEvents++;
            continue;
          }

          // Convert Google event to EasyCashFlows format
          const easyCashEvent = this.convertGoogleEventToECF(googleEvent, integration.userId);
          
          // Import event to database
          await this.importEventToDatabase(easyCashEvent);
          importedEvents++;

          console.log(`[GOOGLE CALENDAR] Imported event: ${googleEvent.summary || 'Untitled'}`);
        } catch (eventError: any) {
          console.error(`[GOOGLE CALENDAR] Error processing event ${googleEvent.id}:`, eventError);
          errors.push(`Event "${googleEvent.summary || googleEvent.id}": ${eventError.message}`);
        }
      }

      return { importedEvents, skippedEvents, errors };
    } catch (error: any) {
      console.error('[GOOGLE CALENDAR] Sync from Google failed:', error);
      throw new Error(`Google Calendar sync failed: ${error.message}`);
    }
  }

  // Sincronizza eventi da EasyCashFlows a Google Calendar  
  async syncToGoogle(integration: CalendarIntegration, events: CalendarEvent[]): Promise<{
    exportedEvents: number;
    updatedEvents: number;
    errors: string[];
  }> {
    try {
      await this.setCredentials(integration);

      let exportedEvents = 0;
      let updatedEvents = 0;
      const errors: string[] = [];

      console.log(`[GOOGLE CALENDAR] Exporting ${events.length} events to Google`);

      for (const ecfEvent of events) {
        try {
          const googleEvent = this.convertECFEventToGoogle(ecfEvent);

          if (ecfEvent.googleCalendarEventId) {
            // Update existing event
            await this.calendar.events.update({
              calendarId: 'primary',
              eventId: ecfEvent.googleCalendarEventId,
              resource: googleEvent,
            });
            updatedEvents++;
            console.log(`[GOOGLE CALENDAR] Updated event: ${ecfEvent.title}`);
          } else {
            // Create new event
            const response = await this.calendar.events.insert({
              calendarId: 'primary',
              resource: googleEvent,
            });
            
            // Update ECF event with Google ID
            await this.updateECFEventWithGoogleId(ecfEvent.id, response.data.id);
            exportedEvents++;
            console.log(`[GOOGLE CALENDAR] Created event: ${ecfEvent.title} (ID: ${response.data.id})`);
          }
        } catch (eventError: any) {
          console.error(`[GOOGLE CALENDAR] Error syncing event ${ecfEvent.id}:`, eventError);
          errors.push(`Event "${ecfEvent.title}": ${eventError.message}`);
        }
      }

      return { exportedEvents, updatedEvents, errors };
    } catch (error: any) {
      console.error('[GOOGLE CALENDAR] Sync to Google failed:', error);
      throw new Error(`Google Calendar export failed: ${error.message}`);
    }
  }

  // Elimina evento da Google Calendar
  async deleteFromGoogle(integration: CalendarIntegration, googleEventId: string): Promise<void> {
    try {
      await this.setCredentials(integration);
      
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: googleEventId,
      });

      console.log(`[GOOGLE CALENDAR] Deleted event ID: ${googleEventId}`);
    } catch (error: any) {
      console.error(`[GOOGLE CALENDAR] Error deleting event ${googleEventId}:`, error);
      throw new Error(`Failed to delete Google Calendar event: ${error.message}`);
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

      // Test basic API access
      const calendarResponse = await this.calendar.calendars.get({
        calendarId: 'primary'
      });

      // Count recent events
      const eventsResponse = await this.calendar.events.list({
        calendarId: 'primary',
        maxResults: 10,
        timeMin: new Date().toISOString(),
      });

      return {
        success: true,
        userEmail: integration.email,
        calendarName: calendarResponse.data.summary || 'Primary Calendar',
        eventsCount: eventsResponse.data.items?.length || 0
      };
    } catch (error: any) {
      console.error('[GOOGLE CALENDAR] Connection test failed:', error);
      return {
        success: false,
        userEmail: integration.email,
        calendarName: '',
        eventsCount: 0
      };
    }
  }

  // Helper methods
  private convertGoogleEventToECF(googleEvent: any, userId: string): Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> {
    const startDate = googleEvent.start?.dateTime 
      ? new Date(googleEvent.start.dateTime)
      : new Date(googleEvent.start?.date || new Date());
      
    const endDate = googleEvent.end?.dateTime 
      ? new Date(googleEvent.end.dateTime)
      : new Date(googleEvent.end?.date || startDate);

    return {
      title: `[Google] ${googleEvent.summary || 'Untitled Event'}`,
      description: googleEvent.description || null,
      startDate,
      endDate,
      isAllDay: !googleEvent.start?.dateTime, // All-day if no time specified
      location: googleEvent.location || null,
      createdByUserId: userId,
      assignedToUserId: userId,
      googleCalendarEventId: googleEvent.id,
      outlookEventId: null,
      isActive: true,
      eventType: 'meeting',
      priority: 'normal',
      status: 'confirmed'
    };
  }

  private convertECFEventToGoogle(ecfEvent: CalendarEvent): any {
    const googleEvent: any = {
      summary: ecfEvent.title.replace('[ECF] ', ''),
      description: `[EasyCashFlows] ${ecfEvent.description || ''}`,
      location: ecfEvent.location,
      status: ecfEvent.status === 'confirmed' ? 'confirmed' : 'tentative',
    };

    if (ecfEvent.isAllDay) {
      // All-day event
      googleEvent.start = {
        date: ecfEvent.startDate.toISOString().split('T')[0],
        timeZone: 'Europe/Rome',
      };
      googleEvent.end = {
        date: ecfEvent.endDate.toISOString().split('T')[0],
        timeZone: 'Europe/Rome',
      };
    } else {
      // Timed event
      googleEvent.start = {
        dateTime: ecfEvent.startDate.toISOString(),
        timeZone: 'Europe/Rome',
      };
      googleEvent.end = {
        dateTime: ecfEvent.endDate.toISOString(),
        timeZone: 'Europe/Rome',
      };
    }

    return googleEvent;
  }

  private async isEventAlreadySynced(googleEventId: string): Promise<boolean> {
    try {
      // TODO: Check database for existing event with this Google ID
      const { storage } = await import('../storage');
      const existingEvents = await storage.getCalendarEvents();
      return existingEvents.some(event => event.googleCalendarEventId === googleEventId);
    } catch (error) {
      console.error('[GOOGLE CALENDAR] Error checking event sync status:', error);
      return false;
    }
  }

  private async importEventToDatabase(event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const { storage } = await import('../storage');
      await storage.createCalendarEvent(event);
    } catch (error) {
      console.error('[GOOGLE CALENDAR] Error importing event to database:', error);
      throw error;
    }
  }

  private async updateECFEventWithGoogleId(ecfEventId: string, googleEventId: string): Promise<void> {
    try {
      const { storage } = await import('../storage');
      await storage.updateCalendarEvent(ecfEventId, { googleCalendarEventId: googleEventId });
    } catch (error) {
      console.error('[GOOGLE CALENDAR] Error updating ECF event with Google ID:', error);
      throw error;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();