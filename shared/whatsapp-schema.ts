import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, varchar, text, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

// WhatsApp Provider Configuration
export const whatsappProviderEnum = pgEnum('whatsapp_provider', ['twilio', 'linkmobility']);
export const templateStatusEnum = pgEnum('template_status', ['pending', 'approved', 'rejected', 'paused']);
export const messageCategoryEnum = pgEnum('message_category', ['marketing', 'utility', 'authentication']);

// WhatsApp Provider Settings Table
export const whatsappProviders = pgTable('whatsapp_providers', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  provider: whatsappProviderEnum('provider').notNull(),
  isActive: boolean('is_active').default(false),
  
  // Twilio Configuration
  twilioAccountSid: varchar('twilio_account_sid', { length: 255 }),
  twilioAuthToken: varchar('twilio_auth_token', { length: 255 }),
  twilioPhoneNumber: varchar('twilio_phone_number', { length: 20 }),
  
  // LinkMobility Configuration  
  linkmobilityApiKey: varchar('linkmobility_api_key', { length: 255 }),
  linkmobilityUsername: varchar('linkmobility_username', { length: 100 }),
  linkmobilityEndpoint: varchar('linkmobility_endpoint', { length: 255 }),
  
  // Meta Business Configuration
  whatsappBusinessAccountId: varchar('whatsapp_business_account_id', { length: 100 }),
  whatsappPhoneNumberId: varchar('whatsapp_phone_number_id', { length: 100 }),
  metaAccessToken: varchar('meta_access_token', { length: 500 }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// WhatsApp Message Templates Table
export const whatsappTemplates = pgTable('whatsapp_templates', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  providerId: varchar('provider_id', { length: 36 }).notNull(),
  
  // Template Details
  name: varchar('name', { length: 100 }).notNull(),
  language: varchar('language', { length: 10 }).default('it'),
  category: messageCategoryEnum('category').notNull(),
  status: templateStatusEnum('status').default('pending'),
  
  // Template Content
  header: text('header'),
  body: text('body').notNull(),
  footer: text('footer'),
  buttons: jsonb('buttons'), // Array of button objects
  variables: jsonb('variables'), // Array of variable names
  
  // Meta Template Info
  metaTemplateId: varchar('meta_template_id', { length: 100 }),
  providerTemplateId: varchar('provider_template_id', { length: 100 }), // Provider-specific template ID
  rejectionReason: text('rejection_reason'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// WhatsApp Notification Rules Table
export const whatsappNotificationRules = pgTable('whatsapp_notification_rules', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  templateId: varchar('template_id', { length: 36 }).notNull(),
  
  // Rule Configuration
  triggerEvent: varchar('trigger_event', { length: 100 }).notNull(), // 'invoice_due', 'cash_flow_low', etc.
  enabled: boolean('enabled').default(true),
  priority: varchar('priority', { length: 20 }).default('medium'), // 'low', 'medium', 'high', 'critical'
  
  // Trigger Conditions
  conditions: jsonb('conditions'), // Flexible conditions object
  timing: jsonb('timing'), // When to send (immediate, delay, schedule)
  
  // Target Recipients
  recipientType: varchar('recipient_type', { length: 50 }).notNull(), // 'user', 'company_contacts', 'custom'
  customRecipients: jsonb('custom_recipients'), // Phone numbers array
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// WhatsApp Message Log Table
export const whatsappMessageLog = pgTable('whatsapp_message_log', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  providerId: varchar('provider_id', { length: 36 }).notNull(),
  templateId: varchar('template_id', { length: 36 }),
  ruleId: varchar('rule_id', { length: 36 }),
  
  // Message Details
  recipient: varchar('recipient', { length: 20 }).notNull(),
  messageId: varchar('message_id', { length: 100 }), // Provider message ID
  status: varchar('status', { length: 50 }).notNull(), // 'sent', 'delivered', 'read', 'failed'
  content: text('content').notNull(),
  
  // Costs and Analytics
  cost: varchar('cost', { length: 10 }), // Message cost in euros
  category: messageCategoryEnum('category'),
  
  // Error Details
  errorCode: varchar('error_code', { length: 50 }),
  errorMessage: text('error_message'),
  
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Zod Schemas for Validation
export const insertWhatsappProviderSchema = createInsertSchema(whatsappProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWhatsappTemplateSchema = createInsertSchema(whatsappTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  metaTemplateId: true,
  status: true,
});

export const insertWhatsappNotificationRuleSchema = createInsertSchema(whatsappNotificationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWhatsappMessageLogSchema = createInsertSchema(whatsappMessageLog).omit({
  id: true,
  createdAt: true,
});

// TypeScript Types
export type WhatsappProvider = typeof whatsappProviders.$inferSelect;
export type InsertWhatsappProvider = z.infer<typeof insertWhatsappProviderSchema>;

export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;
export type InsertWhatsappTemplate = z.infer<typeof insertWhatsappTemplateSchema>;

export type WhatsappNotificationRule = typeof whatsappNotificationRules.$inferSelect;
export type InsertWhatsappNotificationRule = z.infer<typeof insertWhatsappNotificationRuleSchema>;

export type WhatsappMessageLog = typeof whatsappMessageLog.$inferSelect;
export type InsertWhatsappMessageLog = z.infer<typeof insertWhatsappMessageLogSchema>;

// Template Button Types
export interface WhatsappButton {
  type: 'quick_reply' | 'call_to_action';
  text: string;
  url?: string;
  phone_number?: string;
}

// Notification Condition Types
export interface NotificationCondition {
  field: string; // 'cash_flow', 'invoice_amount', 'days_until_due'
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number | string;
}

// Timing Configuration
export interface NotificationTiming {
  type: 'immediate' | 'delay' | 'schedule';
  delay_minutes?: number;
  schedule_time?: string; // HH:MM format
  schedule_days?: number[]; // 0-6 (Sunday-Saturday)
}