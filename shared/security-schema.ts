// Security-specific schemas and validations
import { z } from 'zod';

// Security level enum
export const securityLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);

// Authentication method enum
export const authMethodSchema = z.enum(['password', 'totp', 'sms', 'email', 'hardware_key']);

// Session type enum
export const sessionTypeSchema = z.enum(['web', 'mobile', 'api', 'system']);

// Audit action enum
export const auditActionSchema = z.enum([
  'login_success',
  'login_failure', 
  'logout',
  'password_change',
  'password_reset',
  'account_locked',
  'account_unlocked',
  'role_changed',
  'permission_granted',
  'permission_revoked',
  'data_access',
  'data_modification',
  'system_config_change',
  'backup_created',
  'backup_restored',
  'security_violation'
]);

// Security policy validation
export const securityPolicySchema = z.object({
  // Password Policy
  passwordMinLength: z.number().min(6).max(128).default(8),
  passwordRequireUppercase: z.boolean().default(true),
  passwordRequireLowercase: z.boolean().default(true),
  passwordRequireNumbers: z.boolean().default(true),
  passwordRequireSymbols: z.boolean().default(false),
  passwordExpiryDays: z.number().min(0).max(365).default(90),
  passwordHistoryCount: z.number().min(0).max(24).default(5),
  
  // Session Management
  sessionTimeout: z.number().min(300).max(86400).default(3600), // 5 min to 24 hours
  maxConcurrentSessions: z.number().min(1).max(10).default(3),
  enforceSessionTimeout: z.boolean().default(true),
  
  // Two-Factor Authentication
  twoFactorEnabled: z.boolean().default(false),
  twoFactorMandatoryForAdmin: z.boolean().default(false),
  twoFactorMandatoryForFinance: z.boolean().default(false),
  
  // Rate Limiting
  loginAttemptsLimit: z.number().min(3).max(10).default(5),
  loginBlockDuration: z.number().min(300).max(7200).default(900), // 5 min to 2 hours
  apiRateLimit: z.number().min(10).max(1000).default(100),
  
  // Audit Settings
  auditEnabled: z.boolean().default(true),
  auditRetentionDays: z.number().min(30).max(2555).default(90), // 30 days to 7 years
  trackFailedLogins: z.boolean().default(true),
  trackIpChanges: z.boolean().default(true),
  
  // API Security
  jwtExpirationHours: z.number().min(1).max(168).default(24), // 1 hour to 7 days
  refreshTokenExpirationDays: z.number().min(1).max(30).default(7),
  apiKeyRotationDays: z.number().min(1).max(365).default(30),
});

// Login attempt validation
export const loginAttemptSchema = z.object({
  username: z.string().min(1),
  ipAddress: z.string(),
  userAgent: z.string().optional(),
  success: z.boolean(),
  failureReason: z.string().optional(),
  location: z.string().optional(),
  deviceInfo: z.string().optional(),
});

// Session validation
export const sessionSchema = z.object({
  userId: z.string(),
  sessionToken: z.string(),
  ipAddress: z.string(),
  userAgent: z.string().optional(),
  type: sessionTypeSchema.default('web'),
  expiresAt: z.date(),
});

// Two-factor setup validation
export const twoFactorSetupSchema = z.object({
  secret: z.string().min(1),
  verificationCode: z.string().length(6).regex(/^\d{6}$/, 'Codice deve essere 6 cifre'),
  backupCodes: z.array(z.string()).optional(),
});

// Two-factor verification
export const twoFactorVerificationSchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/, 'Codice deve essere 6 cifre'),
  backupCode: z.string().optional(),
});

// Audit log entry validation
export const auditLogSchema = z.object({
  userId: z.string().optional(),
  action: auditActionSchema,
  resource: z.string().optional(),
  resourceId: z.string().optional(),
  ipAddress: z.string(),
  userAgent: z.string().optional(),
  details: z.record(z.any()).optional(),
  securityLevel: securityLevelSchema.default('medium'),
  success: z.boolean().default(true),
  errorMessage: z.string().optional(),
});

// Security alert validation
export const securityAlertSchema = z.object({
  type: z.enum(['suspicious_login', 'multiple_failures', 'permission_escalation', 'data_breach', 'system_compromise']),
  severity: securityLevelSchema,
  title: z.string().min(1),
  description: z.string(),
  userId: z.string().optional(),
  ipAddress: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  acknowledged: z.boolean().default(false),
  acknowledgedBy: z.string().optional(),
  acknowledgedAt: z.date().optional(),
});

// Permission validation
export const permissionSchema = z.object({
  resource: z.string().min(1),
  action: z.enum(['create', 'read', 'update', 'delete', 'manage', 'execute', 'approve']),
  conditions: z.record(z.any()).optional(),
});

// Role definition validation
export const roleDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(permissionSchema),
  inheritsFrom: z.array(z.string()).optional(),
  isSystem: z.boolean().default(false),
});

// Access control validation
export const accessControlSchema = z.object({
  userId: z.string(),
  resource: z.string(),
  action: z.string(),
  context: z.record(z.any()).optional(),
});

// Password strength validation
export const passwordStrengthSchema = z.object({
  password: z.string(),
  minLength: z.number().default(8),
  requireUppercase: z.boolean().default(true),
  requireLowercase: z.boolean().default(true),
  requireNumbers: z.boolean().default(true),
  requireSymbols: z.boolean().default(false),
  checkCommonPasswords: z.boolean().default(true),
  checkPersonalInfo: z.boolean().default(true),
});

// IP whitelist validation
export const ipWhitelistSchema = z.object({
  label: z.string().min(1),
  ipAddress: z.string().ip(),
  cidrRange: z.string().optional(),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  expiresAt: z.date().optional(),
});

// Security report validation
export const securityReportSchema = z.object({
  type: z.enum(['daily', 'weekly', 'monthly', 'incident', 'compliance']),
  period: z.object({
    from: z.date(),
    to: z.date(),
  }),
  includeDetails: z.boolean().default(false),
  filterBy: z.object({
    users: z.array(z.string()).optional(),
    actions: z.array(auditActionSchema).optional(),
    severity: z.array(securityLevelSchema).optional(),
  }).optional(),
});

// Export all types
export type SecurityLevel = z.infer<typeof securityLevelSchema>;
export type AuthMethod = z.infer<typeof authMethodSchema>;
export type SessionType = z.infer<typeof sessionTypeSchema>;
export type AuditAction = z.infer<typeof auditActionSchema>;
export type SecurityPolicy = z.infer<typeof securityPolicySchema>;
export type LoginAttempt = z.infer<typeof loginAttemptSchema>;
export type SessionData = z.infer<typeof sessionSchema>;
export type TwoFactorSetup = z.infer<typeof twoFactorSetupSchema>;
export type TwoFactorVerification = z.infer<typeof twoFactorVerificationSchema>;
export type AuditLog = z.infer<typeof auditLogSchema>;
export type SecurityAlert = z.infer<typeof securityAlertSchema>;
export type Permission = z.infer<typeof permissionSchema>;
export type RoleDefinition = z.infer<typeof roleDefinitionSchema>;
export type AccessControl = z.infer<typeof accessControlSchema>;
export type PasswordStrength = z.infer<typeof passwordStrengthSchema>;
export type IpWhitelist = z.infer<typeof ipWhitelistSchema>;
export type SecurityReport = z.infer<typeof securityReportSchema>;