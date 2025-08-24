CREATE TYPE "public"."message_category" AS ENUM('marketing', 'utility', 'authentication');--> statement-breakpoint
CREATE TYPE "public"."template_status" AS ENUM('pending', 'approved', 'rejected', 'paused');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_provider" AS ENUM('twilio', 'linkmobility');--> statement-breakpoint
CREATE TABLE "active_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"session_token" text NOT NULL,
	"ip_address" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_activity" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "active_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "ai_chat_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"session_id" varchar NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_document_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"extracted_data" text,
	"ai_analysis" text,
	"error_message" text,
	"tokens_used" integer,
	"processing_time_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ai_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"openai_api_key" text,
	"default_model" text DEFAULT 'gpt-4o' NOT NULL,
	"chat_enabled" boolean DEFAULT true NOT NULL,
	"document_processing_enabled" boolean DEFAULT true NOT NULL,
	"analytics_enabled" boolean DEFAULT true NOT NULL,
	"predictions_enabled" boolean DEFAULT true NOT NULL,
	"max_tokens" integer DEFAULT 2000 NOT NULL,
	"temperature" numeric(3, 2) DEFAULT '0.7' NOT NULL,
	"privacy_mode" text DEFAULT 'standard' NOT NULL,
	"data_retention" text DEFAULT 'none' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"iban_id" varchar NOT NULL,
	"transaction_id" text NOT NULL,
	"transaction_date" date NOT NULL,
	"value_date" date NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"description" text NOT NULL,
	"balance" numeric(12, 2),
	"creditor_name" text,
	"debtor_name" text,
	"remittance_info" text,
	"purpose_code" text,
	"is_matched" boolean DEFAULT false NOT NULL,
	"movement_id" varchar,
	"matched_at" timestamp,
	"raw_data" jsonb,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"location" text,
	"type" text DEFAULT 'task' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurrence_pattern" text,
	"recurrence_interval" integer DEFAULT 1,
	"recurrence_end_date" timestamp,
	"recurrence_count" integer,
	"parent_event_id" varchar,
	"linked_movement_id" varchar,
	"linked_resource_id" varchar,
	"linked_company_id" varchar,
	"linked_supplier_id" varchar,
	"linked_customer_id" varchar,
	"google_calendar_event_id" text,
	"outlook_event_id" text,
	"last_synced_at" timestamp,
	"sync_status" text DEFAULT 'pending',
	"sync_error" text,
	"created_by_user_id" varchar NOT NULL,
	"assigned_to_user_id" varchar,
	"tags" text[],
	"color" text DEFAULT '#3B82F6',
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_integrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"email" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"token_type" text DEFAULT 'Bearer',
	"expires_at" timestamp,
	"scope" text,
	"default_calendar_id" text,
	"sync_enabled" boolean DEFAULT true NOT NULL,
	"sync_direction" text DEFAULT 'outbound' NOT NULL,
	"sync_frequency" text DEFAULT 'immediate',
	"last_sync_at" timestamp,
	"sync_all_events" boolean DEFAULT true NOT NULL,
	"event_prefix" text DEFAULT '[ECF]',
	"is_active" boolean DEFAULT true NOT NULL,
	"last_error" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_reminders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"reminder_type" text NOT NULL,
	"reminder_time" integer NOT NULL,
	"reminder_unit" text DEFAULT 'minutes' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_sent" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp,
	"scheduled_for" timestamp NOT NULL,
	"recipient_user_id" varchar NOT NULL,
	"recipient_email" text,
	"recipient_phone" text,
	"delivery_status" text DEFAULT 'pending',
	"delivery_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"legal_form" text NOT NULL,
	"address" text NOT NULL,
	"zip_code" text NOT NULL,
	"city" text NOT NULL,
	"country" text DEFAULT 'Italia' NOT NULL,
	"email" text,
	"admin_contact" text,
	"tax_code" text,
	"vat_number" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"validity_date" date NOT NULL,
	"company_id" varchar NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"email" text,
	"phone" text,
	"mobile" text,
	"address" text,
	"zip_code" text,
	"city" text,
	"country" text DEFAULT 'Italia',
	"notes" text,
	"first_name" text,
	"last_name" text,
	"tax_code" text,
	"name" text,
	"legal_form" text,
	"vat_number" text,
	"website" text,
	"contact_person" text,
	"pec" text,
	"sdi" text,
	"iban" text,
	"bank_name" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "database_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"max_connections" integer DEFAULT 10 NOT NULL,
	"connection_timeout" integer DEFAULT 5000 NOT NULL,
	"query_timeout" integer DEFAULT 30000 NOT NULL,
	"auto_vacuum_enabled" boolean DEFAULT true NOT NULL,
	"log_slow_queries" boolean DEFAULT true NOT NULL,
	"slow_query_threshold" integer DEFAULT 1000 NOT NULL,
	"auto_backup_enabled" boolean DEFAULT true NOT NULL,
	"backup_retention_days" integer DEFAULT 30 NOT NULL,
	"backup_interval" integer DEFAULT 86400 NOT NULL,
	"enable_query_logging" boolean DEFAULT false NOT NULL,
	"enable_connection_metrics" boolean DEFAULT true NOT NULL,
	"enable_performance_metrics" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_analysis" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer,
	"document_type" text,
	"summary" text,
	"key_points" jsonb,
	"extracted_data" jsonb,
	"suggested_movement" jsonb,
	"confidence" numeric(3, 2),
	"recommendations" jsonb,
	"compliance" jsonb,
	"tokens_used" integer DEFAULT 0,
	"processing_time_ms" integer DEFAULT 0,
	"status" text DEFAULT 'completed' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"max_file_size" integer DEFAULT 10 NOT NULL,
	"allowed_formats" text[] DEFAULT ARRAY['pdf', 'xml', 'xlsx', 'docx', 'jpg', 'png'] NOT NULL,
	"storage_provider" text DEFAULT 'gcp' NOT NULL,
	"auto_backup" boolean DEFAULT true NOT NULL,
	"auto_process_xml" boolean DEFAULT true NOT NULL,
	"validate_fattura_pa" boolean DEFAULT true NOT NULL,
	"extract_metadata" boolean DEFAULT true NOT NULL,
	"generate_thumbnails" boolean DEFAULT true NOT NULL,
	"encrypt_files" boolean DEFAULT true NOT NULL,
	"require_approval" boolean DEFAULT false NOT NULL,
	"access_logging" boolean DEFAULT true NOT NULL,
	"virus_scan" boolean DEFAULT false NOT NULL,
	"retention_days" integer DEFAULT 2555 NOT NULL,
	"auto_archive" boolean DEFAULT true NOT NULL,
	"archive_after_days" integer DEFAULT 365 NOT NULL,
	"fattura_pa_template" text,
	"invoice_template" text,
	"report_template" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_email" text NOT NULL,
	"from_name" text NOT NULL,
	"reply_to_email" text,
	"smtp_host" text,
	"smtp_port" integer,
	"smtp_username" text,
	"smtp_password" text,
	"sendgrid_api_key" text,
	"provider" text DEFAULT 'sendgrid' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fiscal_ai_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"message_count" integer DEFAULT 0,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fiscal_ai_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"confidence" real,
	"tokens_used" integer,
	"suggestions" jsonb DEFAULT '[]'::jsonb,
	"references" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ibans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"iban" text NOT NULL,
	"bank_name" text NOT NULL,
	"bank_code" text,
	"description" text,
	"company_id" varchar NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"api_provider" text,
	"api_credentials" jsonb,
	"auto_sync_enabled" boolean DEFAULT false NOT NULL,
	"last_sync_date" timestamp,
	"sync_frequency" text DEFAULT 'daily',
	"sandbox_mode" boolean DEFAULT true NOT NULL,
	"last_sync" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "localization_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"default_language" text DEFAULT 'it' NOT NULL,
	"available_languages" text[] DEFAULT ARRAY['it', 'en', 'fr', 'de', 'es'] NOT NULL,
	"auto_detect_language" boolean DEFAULT false NOT NULL,
	"country" text DEFAULT 'IT' NOT NULL,
	"region" text DEFAULT 'Europe/Rome' NOT NULL,
	"timezone" text DEFAULT 'Europe/Rome' NOT NULL,
	"date_format" text DEFAULT 'DD/MM/YYYY' NOT NULL,
	"time_format" text DEFAULT '24h' NOT NULL,
	"number_format" text DEFAULT 'comma' NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"currency_symbol" text DEFAULT '€' NOT NULL,
	"currency_position" text DEFAULT 'after' NOT NULL,
	"fiscal_year_start" text DEFAULT '01-01' NOT NULL,
	"week_start" text DEFAULT 'monday' NOT NULL,
	"working_days" text[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] NOT NULL,
	"working_hours_start" text DEFAULT '09:00' NOT NULL,
	"working_hours_end" text DEFAULT '18:00' NOT NULL,
	"rtl_layout" boolean DEFAULT false NOT NULL,
	"compact_numbers" boolean DEFAULT true NOT NULL,
	"localized_icons" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_audit_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"username" text NOT NULL,
	"ip_address" text NOT NULL,
	"user_agent" text,
	"login_time" timestamp DEFAULT now() NOT NULL,
	"success" boolean NOT NULL,
	"failure_reason" text,
	"session_id" text,
	"location" text,
	"device_info" text
);
--> statement-breakpoint
CREATE TABLE "movement_reasons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movement_statuses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"insert_date" date NOT NULL,
	"flow_date" date NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"document_number" text,
	"document_path" text,
	"file_name" text,
	"notes" text,
	"company_id" varchar NOT NULL,
	"core_id" varchar NOT NULL,
	"status_id" varchar NOT NULL,
	"reason_id" varchar NOT NULL,
	"resource_id" varchar,
	"office_id" varchar,
	"iban_id" varchar,
	"tag_id" varchar,
	"supplier_id" varchar,
	"customer_id" varchar,
	"user_id" varchar,
	"xml_data" text,
	"invoice_number" text,
	"vat_amount" numeric(12, 2),
	"vat_type" text,
	"net_amount" numeric(12, 2),
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_status" text DEFAULT 'pending',
	"bank_transaction_id" varchar,
	"match_score" numeric(3, 2),
	"last_verification_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"movement_id" varchar,
	"message_id" varchar,
	"type" text NOT NULL,
	"category" text DEFAULT 'movement' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"from" text,
	"to" text,
	"channel_provider" text,
	"original_content" text,
	"action_url" text,
	"priority" text DEFAULT 'normal',
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" text,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"zip_code" text NOT NULL,
	"country" text DEFAULT 'Italia' NOT NULL,
	"email" text,
	"company_id" varchar NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"tax_code" text NOT NULL,
	"email" text,
	"phone" text,
	"mobile" text,
	"address" text,
	"zip_code" text,
	"city" text,
	"country" text DEFAULT 'Italia' NOT NULL,
	"company_id" varchar NOT NULL,
	"office_ids" text[],
	"role" text DEFAULT 'user' NOT NULL,
	"avatar" text,
	"user_id" varchar,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_timeout" integer DEFAULT 3600 NOT NULL,
	"max_concurrent_sessions" integer DEFAULT 3 NOT NULL,
	"enforce_session_timeout" boolean DEFAULT true NOT NULL,
	"password_min_length" integer DEFAULT 8 NOT NULL,
	"password_require_uppercase" boolean DEFAULT true NOT NULL,
	"password_require_lowercase" boolean DEFAULT true NOT NULL,
	"password_require_numbers" boolean DEFAULT true NOT NULL,
	"password_require_symbols" boolean DEFAULT false NOT NULL,
	"password_expiry_days" integer DEFAULT 90 NOT NULL,
	"password_history_count" integer DEFAULT 5 NOT NULL,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_mandatory_admin" boolean DEFAULT false NOT NULL,
	"two_factor_mandatory_finance" boolean DEFAULT false NOT NULL,
	"login_attempts_limit" integer DEFAULT 5 NOT NULL,
	"login_block_duration" integer DEFAULT 900 NOT NULL,
	"api_rate_limit" integer DEFAULT 100 NOT NULL,
	"audit_enabled" boolean DEFAULT true NOT NULL,
	"audit_retention_days" integer DEFAULT 90 NOT NULL,
	"track_failed_logins" boolean DEFAULT true NOT NULL,
	"track_ip_changes" boolean DEFAULT true NOT NULL,
	"jwt_expiration_hours" integer DEFAULT 24 NOT NULL,
	"refresh_token_expiration_days" integer DEFAULT 7 NOT NULL,
	"api_key_rotation_days" integer DEFAULT 30 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sendgrid_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"category" text NOT NULL,
	"template_id" text NOT NULL,
	"description" text,
	"variables" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"legal_form" text,
	"address" text,
	"zip_code" text,
	"city" text,
	"country" text DEFAULT 'Italia',
	"email" text,
	"phone" text,
	"mobile" text,
	"website" text,
	"contact_person" text,
	"tax_code" text,
	"vat_number" text NOT NULL,
	"pec" text,
	"sdi" text,
	"payment_terms" text DEFAULT 'pagamento a 30gg',
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3B82F6' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_chats" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" integer NOT NULL,
	"telegram_chat_id" text NOT NULL,
	"chat_type" text NOT NULL,
	"title" text,
	"username" text,
	"first_name" text,
	"last_name" text,
	"phone_number" text,
	"language_code" text,
	"is_blocked" boolean DEFAULT false,
	"is_premium" boolean DEFAULT false,
	"is_bot" boolean DEFAULT false,
	"last_message_id" integer,
	"last_message_at" timestamp,
	"message_count" integer DEFAULT 0,
	"linked_customer_id" varchar,
	"linked_resource_id" varchar,
	"notes" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_real_message" text,
	CONSTRAINT "telegram_chats_telegram_chat_id_unique" UNIQUE("telegram_chat_id")
);
--> statement-breakpoint
CREATE TABLE "telegram_messages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "telegram_messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"chat_id" varchar NOT NULL,
	"telegram_message_id" integer,
	"content" text NOT NULL,
	"direction" text DEFAULT 'incoming' NOT NULL,
	"from_user" text,
	"to_user" text,
	"message_type" text DEFAULT 'text' NOT NULL,
	"is_ai_generated" boolean DEFAULT false NOT NULL,
	"delivered" boolean DEFAULT false NOT NULL,
	"read_status" text DEFAULT 'unread' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bot_token" text NOT NULL,
	"bot_username" text NOT NULL,
	"webhook_url" text,
	"webhook_secret" text,
	"allowed_updates" jsonb DEFAULT '["message","callback_query"]'::jsonb,
	"bot_description" text,
	"bot_short_description" text,
	"allowed_chat_types" jsonb DEFAULT '["private","group"]'::jsonb,
	"admin_chat_ids" jsonb DEFAULT '[]'::jsonb,
	"max_message_length" integer DEFAULT 4096,
	"rate_limit_per_minute" integer DEFAULT 30,
	"enable_business_hours" boolean DEFAULT false,
	"business_hours_start" text DEFAULT '09:00',
	"business_hours_end" text DEFAULT '18:00',
	"business_days" jsonb DEFAULT '["monday","tuesday","wednesday","thursday","friday"]'::jsonb,
	"auto_reply_outside_hours" boolean DEFAULT true,
	"out_of_hours_message" text,
	"enable_auto_reply" boolean DEFAULT false,
	"enable_ai_responses" boolean DEFAULT false,
	"ai_model" text DEFAULT 'gpt-4o',
	"ai_system_prompt" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"last_tested" timestamp,
	"last_message_sent" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'message' NOT NULL,
	"command" text,
	"category" text NOT NULL,
	"language" text DEFAULT 'it',
	"content" text NOT NULL,
	"parse_mode" text DEFAULT 'HTML',
	"disable_web_page_preview" boolean DEFAULT false,
	"inline_keyboard" jsonb,
	"variables" jsonb DEFAULT '[]'::jsonb,
	"personalization_enabled" boolean DEFAULT false,
	"tags" text[],
	"description" text,
	"is_active" boolean DEFAULT true,
	"usage_count" integer DEFAULT 0,
	"last_used" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "themes_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"default_theme" text DEFAULT 'light' NOT NULL,
	"allow_user_theme_change" boolean DEFAULT true NOT NULL,
	"primary_color" text DEFAULT '#3b82f6' NOT NULL,
	"accent_color" text DEFAULT '#10b981' NOT NULL,
	"sidebar_position" text DEFAULT 'left' NOT NULL,
	"compact_mode" boolean DEFAULT false NOT NULL,
	"show_breadcrumbs" boolean DEFAULT true NOT NULL,
	"animations_enabled" boolean DEFAULT true NOT NULL,
	"logo_url" text,
	"favicon_url" text,
	"app_name" text DEFAULT 'EasyCashFlows' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "two_factor_auth" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"secret" text NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"backup_codes" text,
	"last_used" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"resource_id" varchar,
	"is_first_access" boolean DEFAULT true NOT NULL,
	"reset_token" text,
	"reset_token_expiry" timestamp,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"first_name" text,
	"last_name" text,
	"avatar_url" text,
	"password_expires_at" timestamp,
	"is_two_factor_enabled" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"lockout_time" timestamp,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_chats" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"whatsapp_number" text NOT NULL,
	"contact_name" text,
	"profile_name" text,
	"phone_number" text,
	"is_business_account" boolean DEFAULT false,
	"is_blocked" boolean DEFAULT false,
	"is_muted" boolean DEFAULT false,
	"last_message_id" text,
	"last_message_at" timestamp,
	"last_message_text" text,
	"message_count" integer DEFAULT 0,
	"linked_customer_id" varchar,
	"linked_resource_id" varchar,
	"status" text DEFAULT 'active',
	"notes" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text DEFAULT 'twilio' NOT NULL,
	"account_sid" text,
	"auth_token" text,
	"api_key" text,
	"linkmobility_endpoint" text,
	"whatsapp_number" text NOT NULL,
	"number_display_name" text,
	"business_manager_id" text,
	"whatsapp_business_account_id" text,
	"business_verification_status" text DEFAULT 'pending',
	"business_display_name" text,
	"business_about" text,
	"business_website" text,
	"business_category" text,
	"business_address" text,
	"template_approval_status" text DEFAULT 'none',
	"approved_templates" text,
	"webhook_url" text,
	"verify_token" text,
	"webhook_secret" text,
	"is_active" boolean DEFAULT true,
	"is_number_verified" boolean DEFAULT false,
	"is_api_connected" boolean DEFAULT false,
	"last_test_at" timestamp,
	"last_message_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"category" text NOT NULL,
	"language" text DEFAULT 'it',
	"status" text DEFAULT 'PENDING',
	"header" jsonb,
	"body" jsonb NOT NULL,
	"footer" jsonb,
	"buttons" jsonb,
	"tags" text[],
	"description" text,
	"quality_score" text,
	"provider_template_id" text,
	"meta_template_id" text,
	"last_approval_request" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_blacklist" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone_number" text NOT NULL,
	"reason" text DEFAULT 'user_request' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sms_blacklist_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "sms_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer,
	"recipient" text NOT NULL,
	"sender" text,
	"message_body" text NOT NULL,
	"message_type" text DEFAULT 'GP' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider_id" text,
	"provider_status" text,
	"error_message" text,
	"credits" integer DEFAULT 0,
	"character_count" integer,
	"encoding" text DEFAULT 'GSM7' NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"failed_at" timestamp,
	"webhook" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sms_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_name" text DEFAULT 'skebby' NOT NULL,
	"api_url" text DEFAULT 'https://api.skebby.it/API/v1.0/REST/' NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"user_key" text,
	"session_key" text,
	"access_token" text,
	"token_expires_at" timestamp,
	"default_sender" text,
	"message_type" text DEFAULT 'GP' NOT NULL,
	"webhook_url" text,
	"webhook_method" text DEFAULT 'POST',
	"webhook_secret" text,
	"delivery_receipts_enabled" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"test_mode" boolean DEFAULT false NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"retry_delay" integer DEFAULT 5000 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sms_statistics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"total_sent" integer DEFAULT 0 NOT NULL,
	"total_delivered" integer DEFAULT 0 NOT NULL,
	"total_failed" integer DEFAULT 0 NOT NULL,
	"total_credits_used" integer DEFAULT 0 NOT NULL,
	"average_characters" integer DEFAULT 0 NOT NULL,
	"high_quality_count" integer DEFAULT 0 NOT NULL,
	"medium_quality_count" integer DEFAULT 0 NOT NULL,
	"low_quality_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sms_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'notification' NOT NULL,
	"subject" text NOT NULL,
	"message_body" text NOT NULL,
	"variables" text,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"character_count" integer,
	"max_length" integer DEFAULT 160 NOT NULL,
	"encoding" text DEFAULT 'GSM7' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "whatsapp_message_log" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"provider_id" varchar(36) NOT NULL,
	"template_id" varchar(36),
	"rule_id" varchar(36),
	"recipient" varchar(20) NOT NULL,
	"message_id" varchar(100),
	"status" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"cost" varchar(10),
	"category" "message_category",
	"error_code" varchar(50),
	"error_message" text,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "whatsapp_notification_rules" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"template_id" varchar(36) NOT NULL,
	"trigger_event" varchar(100) NOT NULL,
	"enabled" boolean DEFAULT true,
	"priority" varchar(20) DEFAULT 'medium',
	"conditions" jsonb,
	"timing" jsonb,
	"recipient_type" varchar(50) NOT NULL,
	"custom_recipients" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "whatsapp_providers" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"provider" "whatsapp_provider" NOT NULL,
	"is_active" boolean DEFAULT false,
	"twilio_account_sid" varchar(255),
	"twilio_auth_token" varchar(255),
	"twilio_phone_number" varchar(20),
	"linkmobility_api_key" varchar(255),
	"linkmobility_username" varchar(100),
	"linkmobility_endpoint" varchar(255),
	"whatsapp_business_account_id" varchar(100),
	"whatsapp_phone_number_id" varchar(100),
	"meta_access_token" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "active_sessions" ADD CONSTRAINT "active_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_ai_conversations" ADD CONSTRAINT "fiscal_ai_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_ai_messages" ADD CONSTRAINT "fiscal_ai_messages_conversation_id_fiscal_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."fiscal_ai_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_audit_log" ADD CONSTRAINT "login_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_chats" ADD CONSTRAINT "telegram_chats_linked_customer_id_customers_id_fk" FOREIGN KEY ("linked_customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_chats" ADD CONSTRAINT "telegram_chats_linked_resource_id_resources_id_fk" FOREIGN KEY ("linked_resource_id") REFERENCES "public"."resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor_auth" ADD CONSTRAINT "two_factor_auth_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_chats" ADD CONSTRAINT "whatsapp_chats_linked_customer_id_customers_id_fk" FOREIGN KEY ("linked_customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_chats" ADD CONSTRAINT "whatsapp_chats_linked_resource_id_resources_id_fk" FOREIGN KEY ("linked_resource_id") REFERENCES "public"."resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_template_id_sms_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."sms_templates"("id") ON DELETE no action ON UPDATE no action;