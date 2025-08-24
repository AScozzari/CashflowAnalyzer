import { db } from '../storage';
import { 
  users, companies, operationalSites, resources, ibans, movements, 
  movementCategories, systemConfigs, securitySettings, whatsappSettings,
  smsSettings, emailSettings, telegramSettings, notifications
} from '../../shared/schema';

/**
 * REAL DATABASE BACKUP SERVICE
 * Implements actual backup functionality instead of mock/simulate functions
 */
export class RealBackupService {
  
  // REAL DATABASE BACKUP - Export all tables
  static async createFullDatabaseBackup(): Promise<any> {
    try {
      console.log('[BACKUP] Creating full database backup...');
      
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        tables: {} as any
      };
      
      // Export all main tables with real data
      backup.tables.users = await db.select().from(users);
      backup.tables.companies = await db.select().from(companies);
      backup.tables.operationalSites = await db.select().from(operationalSites);
      backup.tables.resources = await db.select().from(resources);
      backup.tables.ibans = await db.select().from(ibans);
      backup.tables.movements = await db.select().from(movements);
      backup.tables.movementCategories = await db.select().from(movementCategories);
      backup.tables.systemConfigs = await db.select().from(systemConfigs);
      backup.tables.securitySettings = await db.select().from(securitySettings);
      backup.tables.whatsappSettings = await db.select().from(whatsappSettings);
      backup.tables.smsSettings = await db.select().from(smsSettings);
      backup.tables.emailSettings = await db.select().from(emailSettings);
      backup.tables.telegramSettings = await db.select().from(telegramSettings);
      backup.tables.notifications = await db.select().from(notifications);
      
      const totalRecords = Object.values(backup.tables).reduce((sum: number, table: any) => sum + (table?.length || 0), 0);
      console.log(`[BACKUP] Exported ${totalRecords} total records from ${Object.keys(backup.tables).length} tables`);
      
      return backup;
    } catch (error) {
      console.error('[BACKUP] Error creating database backup:', error);
      throw error;
    }
  }

  // REAL DATABASE VERIFICATION - Check data integrity
  static async verifyDatabaseIntegrity(backupData: any): Promise<{ valid: boolean; errors: string[] }> {
    try {
      console.log('[VERIFICATION] Verifying database integrity...');
      
      const errors: string[] = [];
      
      // Check required tables exist
      const requiredTables = ['users', 'companies', 'movements', 'systemConfigs'];
      for (const table of requiredTables) {
        if (!backupData.tables || !backupData.tables[table]) {
          errors.push(`Missing required table: ${table}`);
        }
      }
      
      // Check data consistency
      if (backupData.tables?.users) {
        const adminUsers = backupData.tables.users.filter((u: any) => u.role === 'admin');
        if (adminUsers.length === 0) {
          errors.push('No admin users found - system would be inaccessible');
        }
      }
      
      // Check foreign key relationships
      if (backupData.tables?.movements && backupData.tables?.companies) {
        const companyIds = new Set(backupData.tables.companies.map((c: any) => c.id));
        const orphanMovements = backupData.tables.movements.filter((m: any) => 
          m.companyId && !companyIds.has(m.companyId)
        );
        if (orphanMovements.length > 0) {
          errors.push(`Found ${orphanMovements.length} movements with invalid company references`);
        }
      }
      
      const isValid = errors.length === 0;
      console.log(`[VERIFICATION] Database integrity check: ${isValid ? 'PASSED' : 'FAILED'} (${errors.length} errors)`);
      
      return { valid: isValid, errors };
    } catch (error) {
      console.error('[VERIFICATION] Error during integrity check:', error);
      return { valid: false, errors: [`Verification failed: ${error.message}`] };
    }
  }

  // File size formatter
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + sizes[i];
  }
}