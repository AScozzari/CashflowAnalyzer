// Backup and recovery specific schemas and validations
import { z } from 'zod';

// Backup type enum
export const backupTypeSchema = z.enum(['database', 'files', 'full', 'incremental', 'differential']);

// Backup status enum
export const backupStatusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']);

// Storage provider enum
export const storageProviderSchema = z.enum(['gcs', 's3', 'azure', 'local', 'ftp', 'sftp']);

// Schedule type enum
export const scheduleTypeSchema = z.enum(['daily', 'weekly', 'monthly', 'custom']);

// Verification status enum
export const verificationStatusSchema = z.enum(['pending', 'verified', 'failed', 'skipped']);

// Snapshot type enum
export const snapshotTypeSchema = z.enum(['manual', 'scheduled', 'automatic', 'pre_update', 'pre_migration']);

// Audit action enum for backup operations
export const backupAuditActionSchema = z.enum([
  'configuration_created',
  'configuration_updated', 
  'configuration_deleted',
  'backup_started',
  'backup_completed',
  'backup_failed',
  'restore_point_created',
  'restore_started',
  'restore_completed',
  'restore_failed',
  'verification_started',
  'verification_completed',
  'cleanup_started',
  'cleanup_completed'
]);

// Helper function to create cron expressions
export function createCronExpression(
  type: 'daily' | 'weekly' | 'monthly',
  time?: string,
  dayOfWeek?: number,
  dayOfMonth?: number
): string {
  const [hour = "02", minute = "00"] = (time || "02:00").split(":");
  
  switch (type) {
    case 'daily':
      return `${minute} ${hour} * * *`;
    case 'weekly':
      return `${minute} ${hour} * * ${dayOfWeek || 0}`;
    case 'monthly':
      return `${minute} ${hour} ${dayOfMonth || 1} * *`;
    default:
      return `${minute} ${hour} * * *`;
  }
}

// Helper function to parse cron schedule for display
export function parseCronSchedule(cronExpression: string): string {
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) return cronExpression;
  
  const [minute, hour, day, month, dayOfWeek] = parts;
  
  if (day === '*' && month === '*' && dayOfWeek === '*') {
    return `Giornaliero alle ${hour}:${minute}`;
  } else if (day === '*' && month === '*' && dayOfWeek !== '*') {
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return `Settimanale ${days[parseInt(dayOfWeek)]} alle ${hour}:${minute}`;
  } else if (day !== '*' && month === '*' && dayOfWeek === '*') {
    return `Mensile il giorno ${day} alle ${hour}:${minute}`;
  }
  
  return cronExpression;
}

// Backup configuration form schema
export const backupConfigurationFormSchema = z.object({
  name: z.string().min(1, 'Nome richiesto').max(100, 'Nome troppo lungo'),
  description: z.string().max(500, 'Descrizione troppo lunga').optional(),
  type: backupTypeSchema,
  schedule_type: scheduleTypeSchema,
  schedule_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato ora non valido (HH:MM)').optional(),
  schedule_day: z.number().min(0).max(6).optional(), // 0 = Sunday
  schedule_date: z.number().min(1).max(31).optional(),
  schedule: z.string().optional(), // Custom cron expression
  enabled: z.boolean().default(true),
  retention_days: z.number().min(1).max(3650),
  storage_provider: storageProviderSchema,
  storage_path: z.string().optional(),
  storage_credentials: z.record(z.string()).optional(),
  encryption_enabled: z.boolean().default(true),
  encryption_key: z.string().optional(),
  compression_enabled: z.boolean().default(true),
  compression_algorithm: z.enum(['gzip', 'bzip2', 'xz', 'lz4']).default('gzip'),
  verification_enabled: z.boolean().default(true),
  notification_enabled: z.boolean().default(true),
  notification_email: z.string().email().optional(),
  max_parallel_jobs: z.number().min(1).max(10).default(1),
  timeout_minutes: z.number().min(5).max(1440).default(60),
});

// Manual restore point form schema
export const manualRestorePointFormSchema = z.object({
  name: z.string().min(1, 'Nome richiesto').max(100, 'Nome troppo lungo'),
  description: z.string().max(500, 'Descrizione troppo lunga').optional(),
  include_database: z.boolean().default(true),
  include_files: z.boolean().default(true),
  include_config: z.boolean().default(false),
  include_logs: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

// Restore form schema
export const restoreFormSchema = z.object({
  restore_point_id: z.string().min(1, 'Restore point richiesto'),
  restore_database: z.boolean().default(true),
  restore_files: z.boolean().default(true),
  restore_config: z.boolean().default(false),
  target_location: z.string().optional(),
  confirm_restore: z.boolean().refine(val => val === true, {
    message: 'Conferma restore richiesta'
  }),
  backup_before_restore: z.boolean().default(true),
  stop_services: z.boolean().default(true),
});

// Backup job insert schema
export const backupJobInsertSchema = z.object({
  configurationId: z.string().min(1),
  status: backupStatusSchema.default('pending'),
  type: backupTypeSchema,
  priority: z.number().min(1).max(10).default(5),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  durationSeconds: z.number().min(0).optional(),
  backupSizeBytes: z.number().min(0).optional(),
  backupPath: z.string().optional(),
  checksum: z.string().optional(),
  compressionRatio: z.number().min(0).max(1).optional(),
  fileCount: z.number().min(0).optional(),
  errorMessage: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Restore point insert schema
export const restorePointInsertSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  backupJobId: z.string().min(1),
  snapshotType: snapshotTypeSchema,
  verificationStatus: verificationStatusSchema.default('pending'),
  verificationDate: z.date().optional(),
  totalSizeBytes: z.number().min(0).optional(),
  isArchived: z.boolean().default(false),
  expiresAt: z.date().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

// Backup audit log insert schema
export const backupAuditLogInsertSchema = z.object({
  action: backupAuditActionSchema,
  resourceType: z.string().min(1),
  resourceId: z.string().min(1),
  userId: z.string().min(1),
  ipAddress: z.string(),
  userAgent: z.string().optional(),
  details: z.record(z.any()).optional(),
  success: z.boolean().default(true),
  errorMessage: z.string().optional(),
});

// Configuration validation schema
export const backupConfigurationInsertSchema = backupConfigurationFormSchema.extend({
  userId: z.string().min(1),
  lastRunAt: z.date().optional(),
  nextRunAt: z.date().optional(),
  totalRuns: z.number().min(0).default(0),
  successfulRuns: z.number().min(0).default(0),
  failedRuns: z.number().min(0).default(0),
  averageDurationSeconds: z.number().min(0).optional(),
  lastBackupSize: z.number().min(0).optional(),
});

// Export validation schemas for API use
export const createBackupConfigurationSchema = backupConfigurationFormSchema;
export const updateBackupConfigurationSchema = backupConfigurationFormSchema.partial();
export const createRestorePointSchema = manualRestorePointFormSchema;
export const restoreSystemSchema = restoreFormSchema;

// Export backup statistics schema
export const backupStatsSchema = z.object({
  totalConfigurations: z.number(),
  activeConfigurations: z.number(),
  totalJobs: z.number(),
  successfulJobs: z.number(),
  failedJobs: z.number(),
  totalRestorePoints: z.number(),
  totalBackupSize: z.number(),
  averageBackupTime: z.number().optional(),
  lastBackupDate: z.date().optional(),
  nextScheduledBackup: z.date().optional(),
});

// Export backup health check schema
export const backupHealthSchema = z.object({
  status: z.enum(['healthy', 'warning', 'critical']),
  lastSuccessfulBackup: z.date().optional(),
  failedJobsLast24h: z.number(),
  diskSpaceUsage: z.number().min(0).max(100),
  configurationIssues: z.array(z.string()),
  recommendations: z.array(z.string()),
});

// Export all type definitions
export type BackupType = z.infer<typeof backupTypeSchema>;
export type BackupStatus = z.infer<typeof backupStatusSchema>;
export type StorageProvider = z.infer<typeof storageProviderSchema>;
export type ScheduleType = z.infer<typeof scheduleTypeSchema>;
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;
export type SnapshotType = z.infer<typeof snapshotTypeSchema>;
export type BackupAuditAction = z.infer<typeof backupAuditActionSchema>;

export type BackupConfigurationForm = z.infer<typeof backupConfigurationFormSchema>;
export type ManualRestorePointForm = z.infer<typeof manualRestorePointFormSchema>;
export type RestoreForm = z.infer<typeof restoreFormSchema>;
export type BackupJobInsert = z.infer<typeof backupJobInsertSchema>;
export type RestorePointInsert = z.infer<typeof restorePointInsertSchema>;
export type BackupAuditLogInsert = z.infer<typeof backupAuditLogInsertSchema>;
export type BackupConfigurationInsert = z.infer<typeof backupConfigurationInsertSchema>;

export type BackupStats = z.infer<typeof backupStatsSchema>;
export type BackupHealth = z.infer<typeof backupHealthSchema>;

// Derived types for database schema
export type BackupConfiguration = BackupConfigurationInsert & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type BackupJob = BackupJobInsert & {
  id: string;
  createdAt: Date;
};

export type RestorePoint = RestorePointInsert & {
  id: string;
  createdAt: Date;
};

export type BackupAuditLog = BackupAuditLogInsert & {
  id: string;
  createdAt: Date;
};