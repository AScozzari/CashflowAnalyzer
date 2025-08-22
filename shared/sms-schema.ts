import { pgTable, text, boolean, timestamp, integer, serial } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// SMS Settings Table
export const smsSettings = pgTable('sms_settings', {
  id: serial('id').primaryKey(),
  providerName: text('provider_name').notNull().default('skebby'),
  apiUrl: text('api_url').notNull().default('https://api.skebby.it/API/v1.0/REST/'),
  username: text('username').notNull(),
  password: text('password').notNull(),
  
  // Skebby Authentication
  userKey: text('user_key'), // Ottenuto dal login
  sessionKey: text('session_key'), // Session key (scade dopo 5 min)
  accessToken: text('access_token'), // Token permanente (raccomandato)
  tokenExpiresAt: timestamp('token_expires_at'),
  
  // SMS Configuration
  defaultSender: text('default_sender'), // TPOA alias
  messageType: text('message_type').notNull().default('GP'), // GP = High Quality, TI = Medium, SI = Low
  
  // Webhook Configuration
  webhookUrl: text('webhook_url'),
  webhookMethod: text('webhook_method').default('POST'), // GET o POST
  webhookSecret: text('webhook_secret'),
  deliveryReceiptsEnabled: boolean('delivery_receipts_enabled').default(false),
  
  // App Settings
  isActive: boolean('is_active').notNull().default(true),
  testMode: boolean('test_mode').notNull().default(false),
  maxRetries: integer('max_retries').notNull().default(3),
  retryDelay: integer('retry_delay').notNull().default(5000), // milliseconds
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// SMS Templates Table
export const smsTemplates = pgTable('sms_templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull().default('notification'),
  subject: text('subject').notNull(),
  messageBody: text('message_body').notNull(),
  variables: text('variables'), // JSON string of available variables
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  priority: text('priority').notNull().default('normal'), // high, normal, low
  characterCount: integer('character_count'),
  maxLength: integer('max_length').notNull().default(160),
  encoding: text('encoding').notNull().default('GSM7'), // GSM7, UCS2
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// SMS Messages History Table
export const smsMessages = pgTable('sms_messages', {
  id: serial('id').primaryKey(),
  templateId: integer('template_id').references(() => smsTemplates.id),
  recipient: text('recipient').notNull(),
  sender: text('sender'),
  messageBody: text('message_body').notNull(),
  messageType: text('message_type').notNull().default('GP'),
  status: text('status').notNull().default('pending'), // pending, sent, delivered, failed, expired
  providerId: text('provider_id'), // Skebby order_id
  providerStatus: text('provider_status'),
  errorMessage: text('error_message'),
  credits: integer('credits').default(0),
  characterCount: integer('character_count'),
  encoding: text('encoding').notNull().default('GSM7'),
  scheduledAt: timestamp('scheduled_at'),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  failedAt: timestamp('failed_at'),
  webhook: text('webhook'), // JSON webhook data
  metadata: text('metadata'), // JSON additional data
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// SMS Blacklist Table
export const smsBlacklist = pgTable('sms_blacklist', {
  id: serial('id').primaryKey(),
  phoneNumber: text('phone_number').notNull().unique(),
  reason: text('reason').notNull().default('user_request'),
  source: text('source').notNull().default('manual'), // manual, stop_keyword, complaint
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// SMS Statistics Table
export const smsStatistics = pgTable('sms_statistics', {
  id: serial('id').primaryKey(),
  date: text('date').notNull(), // YYYY-MM-DD format
  totalSent: integer('total_sent').notNull().default(0),
  totalDelivered: integer('total_delivered').notNull().default(0),
  totalFailed: integer('total_failed').notNull().default(0),
  totalCreditsUsed: integer('total_credits_used').notNull().default(0),
  averageCharacters: integer('average_characters').notNull().default(0),
  highQualityCount: integer('high_quality_count').notNull().default(0),
  mediumQualityCount: integer('medium_quality_count').notNull().default(0),
  lowQualityCount: integer('low_quality_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Zod schemas for validation
export const insertSmsSettingsSchema = createInsertSchema(smsSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmsTemplateSchema = createInsertSchema(smsTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmsMessageSchema = createInsertSchema(smsMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmsBlacklistSchema = createInsertSchema(smsBlacklist).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmsStatisticsSchema = createInsertSchema(smsStatistics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// TypeScript types
export type SmsSettings = typeof smsSettings.$inferSelect;
export type InsertSmsSettings = z.infer<typeof insertSmsSettingsSchema>;

export type SmsTemplate = typeof smsTemplates.$inferSelect;
export type InsertSmsTemplate = z.infer<typeof insertSmsTemplateSchema>;

export type SmsMessage = typeof smsMessages.$inferSelect;
export type InsertSmsMessage = z.infer<typeof insertSmsMessageSchema>;

export type SmsBlacklist = typeof smsBlacklist.$inferSelect;
export type InsertSmsBlacklist = z.infer<typeof insertSmsBlacklistSchema>;

export type SmsStatistics = typeof smsStatistics.$inferSelect;
export type InsertSmsStatistics = z.infer<typeof insertSmsStatisticsSchema>;

// SMS message types constants
export const SMS_MESSAGE_TYPES = {
  HIGH_QUALITY: 'GP',
  MEDIUM_QUALITY: 'TI',
  LOW_QUALITY: 'SI',
} as const;

export const SMS_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  EXPIRED: 'expired',
} as const;

export const SMS_CATEGORIES = [
  { value: 'notification', label: 'Notifiche Generali', icon: '📱', color: 'bg-blue-100 text-blue-800' },
  { value: 'alert', label: 'Avvisi Urgenti', icon: '⚠️', color: 'bg-red-100 text-red-800' },
  { value: 'otp', label: 'Codici OTP', icon: '🔐', color: 'bg-green-100 text-green-800' },
  { value: 'reminder', label: 'Promemoria', icon: '⏰', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'marketing', label: 'Marketing', icon: '📢', color: 'bg-purple-100 text-purple-800' },
  { value: 'transaction', label: 'Transazioni', icon: '💳', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'system', label: 'Sistema', icon: '⚙️', color: 'bg-gray-100 text-gray-800' },
  { value: 'welcome', label: 'Benvenuto', icon: '👋', color: 'bg-teal-100 text-teal-800' },
] as const;