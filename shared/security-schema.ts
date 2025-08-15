import { pgTable, varchar, text, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Security Settings Table
export const securitySettings = pgTable("security_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Session Management
  sessionTimeout: integer("session_timeout").notNull().default(3600), // seconds
  maxConcurrentSessions: integer("max_concurrent_sessions").notNull().default(3),
  enforceSessionTimeout: boolean("enforce_session_timeout").notNull().default(true),
  
  // Password Policy
  passwordMinLength: integer("password_min_length").notNull().default(8),
  passwordRequireUppercase: boolean("password_require_uppercase").notNull().default(true),
  passwordRequireLowercase: boolean("password_require_lowercase").notNull().default(true),
  passwordRequireNumbers: boolean("password_require_numbers").notNull().default(true),
  passwordRequireSymbols: boolean("password_require_symbols").notNull().default(false),
  passwordExpiryDays: integer("password_expiry_days").notNull().default(90),
  passwordHistoryCount: integer("password_history_count").notNull().default(5),
  
  // Two-Factor Authentication
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorMandatoryForAdmin: boolean("two_factor_mandatory_admin").notNull().default(false),
  twoFactorMandatoryForFinance: boolean("two_factor_mandatory_finance").notNull().default(false),
  
  // Rate Limiting
  loginAttemptsLimit: integer("login_attempts_limit").notNull().default(5),
  loginBlockDuration: integer("login_block_duration").notNull().default(900), // seconds
  apiRateLimit: integer("api_rate_limit").notNull().default(100), // requests per minute
  
  // Login Audit
  auditEnabled: boolean("audit_enabled").notNull().default(true),
  auditRetentionDays: integer("audit_retention_days").notNull().default(90),
  trackFailedLogins: boolean("track_failed_logins").notNull().default(true),
  trackIpChanges: boolean("track_ip_changes").notNull().default(true),
  
  // API Security
  jwtExpirationHours: integer("jwt_expiration_hours").notNull().default(24),
  refreshTokenExpirationDays: integer("refresh_token_expiration_days").notNull().default(7),
  apiKeyRotationDays: integer("api_key_rotation_days").notNull().default(30),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Login Audit Log Table
export const loginAuditLog = pgTable("login_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  username: text("username").notNull(),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  loginTime: timestamp("login_time").defaultNow().notNull(),
  success: boolean("success").notNull(),
  failureReason: text("failure_reason"),
  sessionId: text("session_id"),
  location: text("location"), // Geolocation if available
  deviceInfo: json("device_info"), // Browser, OS, etc.
});

// Session Management Table
export const activeSessions = pgTable("active_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// Password History Table
export const passwordHistory = pgTable("password_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Two-Factor Authentication Table
export const twoFactorAuth = pgTable("two_factor_auth", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  secret: text("secret").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(false),
  backupCodes: json("backup_codes"), // Array of backup codes
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertSecuritySettingsSchema = createInsertSchema(securitySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  sessionTimeout: z.number().min(300).max(86400), // 5 min to 24 hours
  maxConcurrentSessions: z.number().min(1).max(10),
  passwordMinLength: z.number().min(6).max(128),
  passwordExpiryDays: z.number().min(0).max(365),
  passwordHistoryCount: z.number().min(0).max(20),
  loginAttemptsLimit: z.number().min(3).max(20),
  loginBlockDuration: z.number().min(300).max(86400), // 5 min to 24 hours
  apiRateLimit: z.number().min(10).max(1000),
  auditRetentionDays: z.number().min(30).max(365),
  jwtExpirationHours: z.number().min(1).max(168), // 1 hour to 7 days
  refreshTokenExpirationDays: z.number().min(1).max(30),
  apiKeyRotationDays: z.number().min(7).max(365),
});

export const insertLoginAuditSchema = createInsertSchema(loginAuditLog).omit({
  id: true,
  loginTime: true,
});

export const insertActiveSessionSchema = createInsertSchema(activeSessions).omit({
  id: true,
  createdAt: true,
  lastActivity: true,
});

export const insertPasswordHistorySchema = createInsertSchema(passwordHistory).omit({
  id: true,
  createdAt: true,
});

export const insertTwoFactorAuthSchema = createInsertSchema(twoFactorAuth).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
});

// Type exports
export type SecuritySettings = typeof securitySettings.$inferSelect;
export type InsertSecuritySettings = z.infer<typeof insertSecuritySettingsSchema>;
export type LoginAuditLog = typeof loginAuditLog.$inferSelect;
export type ActiveSession = typeof activeSessions.$inferSelect;
export type PasswordHistory = typeof passwordHistory.$inferSelect;
export type TwoFactorAuth = typeof twoFactorAuth.$inferSelect;

// Import users table reference
import { users } from "./schema";