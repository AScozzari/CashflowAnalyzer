import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, date, jsonb, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Core Business entities
export const cores = pgTable("cores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  validityDate: date("validity_date").notNull(),
  companyId: varchar("company_id").notNull(),
  isActive: boolean("is_active").notNull().default(true), // attivo = usabile per input, inattivo = solo ricerche
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ragioni Sociali (Companies)
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  legalForm: text("legal_form").notNull(), // srl, spa, srls, ditta individuale, etc.
  address: text("address").notNull(),
  zipCode: text("zip_code").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull().default('Italia'),
  email: text("email"),
  adminContact: text("admin_contact"), // nome e cognome referente
  taxCode: text("tax_code"), // codice fiscale
  vatNumber: text("vat_number"), // partita iva
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true), // attivo = usabile per input, inattivo = solo ricerche
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users (Sistema di autenticazione)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default('user'), // 'admin', 'finance', 'user'
  resourceId: varchar("resource_id"), // collegamento opzionale alla risorsa
  isFirstAccess: boolean("is_first_access").notNull().default(true),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Add anagrafica fields for system users (non-resources)
  firstName: text("first_name"), // solo per utenti sistema (non collegati a resource)
  lastName: text("last_name"),   // solo per utenti sistema (non collegati a resource)
  avatarUrl: text("avatar_url"), // solo per utenti sistema (non collegati a resource)
  
  // Security fields
  passwordExpiresAt: timestamp("password_expires_at"),
  isTwoFactorEnabled: boolean("is_two_factor_enabled").notNull().default(false),
  isLocked: boolean("is_locked").notNull().default(false),
  lockoutTime: timestamp("lockout_time"),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
});

// Risorse (Employees/Resources)
export const resources = pgTable("resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  taxCode: text("tax_code").notNull(),
  email: text("email"),
  phone: text("phone"), // Telefono fisso
  mobile: text("mobile"), // Cellulare/WhatsApp
  address: text("address"),
  zipCode: text("zip_code"),
  city: text("city"),
  country: text("country").notNull().default('Italia'),
  companyId: varchar("company_id").notNull(),
  officeIds: text("office_ids").array(), // Array di ID delle sedi operative
  role: text("role").notNull().default('user'), // 'admin', 'finance', 'user'
  avatar: text("avatar"), // Percorso dell'immagine avatar
  userId: varchar("user_id"), // For movements relation
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true), // attivo = usabile per input, inattivo = solo ricerche
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// IBAN accounts
export const ibans = pgTable("ibans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  iban: text("iban").notNull(),
  bankName: text("bank_name").notNull(),
  bankCode: text("bank_code"), // Codice ABI/CAB della banca per identificazione API
  description: text("description"),
  companyId: varchar("company_id").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true), // attivo = usabile per input, inattivo = solo ricerche
  // Campi per integrazione API bancarie
  apiProvider: text("api_provider"), // 'unicredit', 'intesa', 'cbi_globe', 'nexi', etc.
  apiCredentials: jsonb("api_credentials"), // Credenziali crittografate per API (client_id, etc.)
  autoSyncEnabled: boolean("auto_sync_enabled").notNull().default(false), // Sincronizzazione automatica attiva
  lastSyncDate: timestamp("last_sync_date"), // Ultima sincronizzazione movimenti
  syncFrequency: text("sync_frequency").default('daily'), // 'hourly', 'daily', 'weekly'
  sandboxMode: boolean("sandbox_mode").notNull().default(true), // Modalità sandbox per test
  lastSync: timestamp("last_sync"), // Ultimo sync effettuato
  createdAt: timestamp("created_at").defaultNow().notNull(),
});



// Sedi Operative (Operational Offices)
export const offices = pgTable("offices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: text("description"),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country").notNull().default('Italia'),
  email: text("email"),
  companyId: varchar("company_id").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true), // attivo = usabile per input, inattivo = solo ricerche
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tags
export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default('#3B82F6'), // Colore hex per visualizzazione
  isActive: boolean("is_active").notNull().default(true), // attivo = usabile per input, inattivo = solo ricerche
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Movement Status
export const movementStatuses = pgTable("movement_statuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true), // attivo = usabile per input, inattivo = solo ricerche
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Fornitori (Suppliers)
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  legalForm: text("legal_form"), // srl, spa, srls, ditta individuale, etc.
  address: text("address"),
  zipCode: text("zip_code"),
  city: text("city"),
  country: text("country").default('Italia'),
  email: text("email"),
  phone: text("phone"), // Telefono fisso
  mobile: text("mobile"), // Cellulare/WhatsApp
  website: text("website"),
  contactPerson: text("contact_person"), // referente
  taxCode: text("tax_code"), // codice fiscale
  vatNumber: text("vat_number").notNull(), // partita iva (campo chiave per matching XML)
  pec: text("pec"), // posta elettronica certificata
  sdi: text("sdi"), // codice SDI per fatturazione elettronica
  paymentTerms: text("payment_terms").default('pagamento a 30gg'), // modalità di pagamento standard
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Clienti (Customers)
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'private' or 'business'
  
  // Campi comuni
  email: text("email"),
  phone: text("phone"), // Telefono fisso
  mobile: text("mobile"), // Cellulare/WhatsApp
  address: text("address"),
  zipCode: text("zip_code"),
  city: text("city"),
  country: text("country").default('Italia'),
  notes: text("notes"),
  
  // Campi per persona fisica (type = 'private')
  firstName: text("first_name"), // Solo per privati
  lastName: text("last_name"), // Solo per privati
  taxCode: text("tax_code"), // Per privati è obbligatorio, per business opzionale
  
  // Campi per business (type = 'business')
  name: text("name"), // Ragione sociale per business
  legalForm: text("legal_form"), // Solo per business
  vatNumber: text("vat_number"), // Solo per business
  website: text("website"), // Solo per business
  contactPerson: text("contact_person"), // Solo per business
  pec: text("pec"), // Solo per business
  sdi: text("sdi"), // Solo per business
  iban: text("iban"), // Solo per business
  bankName: text("bank_name"), // Solo per business
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Causali dei movimenti
export const movementReasons = pgTable("movement_reasons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'income' or 'expense' or 'both'
  isActive: boolean("is_active").notNull().default(true), // attivo = usabile per input, inattivo = solo ricerche
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifiche per i movimenti
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // A chi è destinata la notifica
  
  // Reference fields (only one should be filled)
  movementId: varchar("movement_id"), // Movimento a cui si riferisce
  messageId: varchar("message_id"), // ID messaggio comunicazione
  
  // Notification categorization
  type: text("type").notNull(), // 'new_movement', 'movement_updated', 'movement_assigned', 'new_whatsapp', 'new_sms', 'new_email', 'new_messenger'
  category: text("category").notNull().default('movement'), // 'movement', 'whatsapp', 'sms', 'email', 'messenger'
  
  // Content
  title: text("title").notNull(),
  message: text("message").notNull(),
  
  // Communication metadata (for messages)
  from: text("from"), // Mittente del messaggio
  to: text("to"), // Destinatario del messaggio  
  channelProvider: text("channel_provider"), // 'twilio', 'linkmobility', 'skebby', 'sendgrid', 'facebook'
  originalContent: text("original_content"), // Contenuto originale del messaggio
  
  // Navigation metadata
  actionUrl: text("action_url"), // URL per andare al dettaglio
  priority: text("priority").default('normal'), // 'low', 'normal', 'high', 'critical'
  
  // Status
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Financial Movements
export const movements = pgTable("movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  insertDate: date("insert_date").notNull(),
  flowDate: date("flow_date").notNull(),
  type: text("type").notNull(), // 'income' or 'expense'
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  documentNumber: text("document_number"),
  documentPath: text("document_path"),
  fileName: text("file_name"), // Nome file originale del documento caricato
  notes: text("notes"),
  
  // Required relationships
  companyId: varchar("company_id").notNull(),
  coreId: varchar("core_id").notNull(),
  statusId: varchar("status_id").notNull(),
  
  // Required relationships
  reasonId: varchar("reason_id").notNull(),
  
  // Optional relationships
  resourceId: varchar("resource_id"),
  officeId: varchar("office_id"),
  ibanId: varchar("iban_id"),
  tagId: varchar("tag_id"),
  supplierId: varchar("supplier_id"), // Riferimento al fornitore (per le spese)
  customerId: varchar("customer_id"), // Riferimento al cliente (per le entrate)
  userId: varchar("user_id"), // User who created the movement
  
  // Campi per integrazione XML fatture
  xmlData: text("xml_data"), // Dati XML della fattura originale (se presente)
  invoiceNumber: text("invoice_number"), // Numero fattura estratto dall'XML
  vatAmount: decimal("vat_amount", { precision: 12, scale: 2 }), // Importo IVA estratto dall'XML
  vatType: text("vat_type", { enum: ["iva_22", "iva_10", "iva_4", "iva_art_74", "esente"] }), // Tipo di IVA applicata
  netAmount: decimal("net_amount", { precision: 12, scale: 2 }), // Importo netto estratto dall'XML
  
  // Campi per verifica automatica con API bancarie
  isVerified: boolean("is_verified").notNull().default(false), // Se il movimento è stato verificato con la banca
  verificationStatus: text("verification_status").default('pending'), // 'pending', 'matched', 'partial_match', 'no_match', 'error'
  bankTransactionId: varchar("bank_transaction_id"), // ID della transazione bancaria corrispondente
  matchScore: decimal("match_score", { precision: 3, scale: 2 }), // Punteggio di matching 0.00-1.00
  lastVerificationDate: timestamp("last_verification_date"), // Ultima verifica effettuata
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bank Transactions - Transazioni sincronizzate dalle API bancarie
export const bankTransactions = pgTable("bank_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ibanId: varchar("iban_id").notNull(), // IBAN di riferimento
  transactionId: text("transaction_id").notNull(), // ID univoco dalla banca
  transactionDate: date("transaction_date").notNull(), // Data operazione
  valueDate: date("value_date").notNull(), // Data valuta
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default('EUR'),
  description: text("description").notNull(), // Descrizione dalla banca
  balance: decimal("balance", { precision: 12, scale: 2 }), // Saldo dopo l'operazione
  
  // Dati aggiuntivi per matching
  creditorName: text("creditor_name"), // Nome beneficiario
  debtorName: text("debtor_name"), // Nome ordinante  
  remittanceInfo: text("remittance_info"), // Informazioni aggiuntive
  purposeCode: text("purpose_code"), // Codice causale
  
  // Status e matching
  isMatched: boolean("is_matched").notNull().default(false), // Se è stato fatto il match con un movimento
  movementId: varchar("movement_id"), // ID del movimento collegato
  matchedAt: timestamp("matched_at"), // Quando è stato fatto il match
  
  // Metadati tecnici
  rawData: jsonb("raw_data"), // Dati grezzi dall'API bancaria
  syncedAt: timestamp("synced_at").notNull().defaultNow(), // Quando è stato sincronizzato
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

// AI Settings per OpenAI integration
export const aiSettings = pgTable("ai_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Collegamento all'utente
  openaiApiKey: text("openai_api_key"), // Opzionale per override dell'environment key
  defaultModel: text("default_model").notNull().default('gpt-4o'), // gpt-4o, gpt-4-turbo, gpt-3.5-turbo
  chatEnabled: boolean("chat_enabled").notNull().default(true),
  documentProcessingEnabled: boolean("document_processing_enabled").notNull().default(true),
  analyticsEnabled: boolean("analytics_enabled").notNull().default(true),
  predictionsEnabled: boolean("predictions_enabled").notNull().default(true),
  maxTokens: integer("max_tokens").notNull().default(2000),
  temperature: decimal("temperature", { precision: 3, scale: 2 }).notNull().default('0.7'),
  privacyMode: text("privacy_mode").notNull().default('standard'), // 'strict', 'standard', 'relaxed'
  dataRetention: text("data_retention").notNull().default('none'), // 'none', '30days', '90days'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// AI Chat History per mantenere le conversazioni
export const aiChatHistory = pgTable("ai_chat_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  sessionId: varchar("session_id").notNull(), // Raggruppa messaggi della stessa conversazione
  role: text("role").notNull(), // 'user', 'assistant', 'system'
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON string per token usage, model used, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Document Processing Jobs
export const aiDocumentJobs = pgTable("ai_document_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(), // 'pdf', 'image', 'xml', etc.
  status: text("status").notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed'
  extractedData: text("extracted_data"), // JSON string with extracted information
  aiAnalysis: text("ai_analysis"), // AI interpretation and suggestions
  errorMessage: text("error_message"),
  tokensUsed: integer("tokens_used"),
  processingTimeMs: integer("processing_time_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  cores: many(cores),
  resources: many(resources),
  ibans: many(ibans),
  offices: many(offices),
  movements: many(movements),
}));

export const coresRelations = relations(cores, ({ one, many }) => ({
  company: one(companies, {
    fields: [cores.companyId],
    references: [companies.id],
  }),
  movements: many(movements),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  resource: one(resources, {
    fields: [users.resourceId],
    references: [resources.id],
  }),
  notifications: many(notifications),
  createdCalendarEvents: many(calendarEvents),
  assignedCalendarEvents: many(calendarEvents),
  calendarIntegrations: many(calendarIntegrations),
  calendarReminders: many(calendarReminders),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  movement: one(movements, {
    fields: [notifications.movementId],
    references: [movements.id],
  }),
}));

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  company: one(companies, {
    fields: [resources.companyId],
    references: [companies.id],
  }),
  movements: many(movements),
  user: one(users, {
    fields: [resources.id],
    references: [users.resourceId],
  }),
}));

export const ibansRelations = relations(ibans, ({ one, many }) => ({
  company: one(companies, {
    fields: [ibans.companyId],
    references: [companies.id],
  }),
  movements: many(movements),
  bankTransactions: many(bankTransactions),
}));

export const officesRelations = relations(offices, ({ one, many }) => ({
  company: one(companies, {
    fields: [offices.companyId],
    references: [companies.id],
  }),
  movements: many(movements),
}));

export const movementReasonsRelations = relations(movementReasons, ({ many }) => ({
  movements: many(movements),
}));

export const movementsRelations = relations(movements, ({ one, many }) => ({
  company: one(companies, {
    fields: [movements.companyId],
    references: [companies.id],
  }),
  core: one(cores, {
    fields: [movements.coreId],
    references: [cores.id],
  }),
  reason: one(movementReasons, {
    fields: [movements.reasonId],
    references: [movementReasons.id],
  }),
  resource: one(resources, {
    fields: [movements.resourceId],
    references: [resources.id],
  }),
  office: one(offices, {
    fields: [movements.officeId],
    references: [offices.id],
  }),
  iban: one(ibans, {
    fields: [movements.ibanId],
    references: [ibans.id],
  }),
  tag: one(tags, {
    fields: [movements.tagId],
    references: [tags.id],
  }),
  status: one(movementStatuses, {
    fields: [movements.statusId],
    references: [movementStatuses.id],
  }),
  supplier: one(suppliers, {
    fields: [movements.supplierId],
    references: [suppliers.id],
  }),
  customer: one(customers, {
    fields: [movements.customerId],
    references: [customers.id],
  }),
  bankTransaction: one(bankTransactions, {
    fields: [movements.bankTransactionId],
    references: [bankTransactions.id],
  }),
  // Calendar relations
  calendarEvents: many(calendarEvents),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  movements: many(movements),
}));

export const movementStatusesRelations = relations(movementStatuses, ({ many }) => ({
  movements: many(movements),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  movements: many(movements),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  movements: many(movements),
}));

export const aiSettingsRelations = relations(aiSettings, ({ one }) => ({
  user: one(users, {
    fields: [aiSettings.userId],
    references: [users.id],
  }),
}));

export const aiChatHistoryRelations = relations(aiChatHistory, ({ one }) => ({
  user: one(users, {
    fields: [aiChatHistory.userId],
    references: [users.id],
  }),
}));

export const aiDocumentJobsRelations = relations(aiDocumentJobs, ({ one }) => ({
  user: one(users, {
    fields: [aiDocumentJobs.userId],
    references: [users.id],
  }),
}));

export const bankTransactionsRelations = relations(bankTransactions, ({ one }) => ({
  iban: one(ibans, {
    fields: [bankTransactions.ibanId],
    references: [ibans.id],
  }),
  movement: one(movements, {
    fields: [bankTransactions.movementId],
    references: [movements.id],
  }),
}));

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
}).extend({
  legalForm: z.string().optional().default("SRL"),
  email: z.string().email().optional(),
  adminContact: z.string().optional(),
  taxCode: z.string().optional(),
  vatNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const insertCoreSchema = createInsertSchema(cores).omit({
  id: true,
  createdAt: true,
}).extend({
  validityDate: z.string().optional().default("2025-01-01"),
  companyId: z.string(),
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
}).extend({
  firstName: z.string().min(1, "Nome richiesto"),
  lastName: z.string().min(1, "Cognome richiesto"), 
  taxCode: z.string().min(1, "Codice fiscale richiesto"),
  companyId: z.string().min(1, "Azienda richiesta"),
  email: z.string().email("Email non valida").optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  zipCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional().default('Italia'),
  role: z.enum(['admin', 'finance', 'user']).default('user'), // Tutti i ruoli supportati
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const insertIbanSchema = createInsertSchema(ibans).omit({
  id: true,
  createdAt: true,
});

export const insertOfficeSchema = createInsertSchema(offices).omit({
  id: true,
  createdAt: true,
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
});

export const insertMovementStatusSchema = createInsertSchema(movementStatuses).omit({
  id: true,
  createdAt: true,
});

export const insertMovementReasonSchema = createInsertSchema(movementReasons).omit({
  id: true,
  createdAt: true,
});

export const insertMovementSchema = createInsertSchema(movements).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform(val => String(val)),
  vatAmount: z.union([z.string(), z.number(), z.null(), z.undefined()]).transform(val => 
    val === null || val === undefined || val === "" ? null : String(val)
  ).optional(),
  netAmount: z.union([z.string(), z.number(), z.null(), z.undefined()]).transform(val => 
    val === null || val === undefined || val === "" ? null : String(val)
  ).optional(),
  vatType: z.enum(["iva_22", "iva_10", "iva_4", "iva_art_74", "esente"]).optional(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
  resetToken: true,
  resetTokenExpiry: true,
}).extend({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "Password deve avere almeno 6 caratteri"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Nome richiesto"),
  vatNumber: z.string().min(11, "Partita IVA deve avere almeno 11 caratteri"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  legalForm: z.string().optional(),
  taxCode: z.string().optional(),
  pec: z.string().email().optional().or(z.literal("")),
  sdi: z.string().optional(),
  paymentTerms: z.string().optional().default("pagamento a 30gg"),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(["private", "business"]),
  // Campi comuni
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  zipCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional().default("Italia"),
  notes: z.string().optional(),
  // Campi condizionali - validati nel frontend
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  taxCode: z.string().optional(),
  name: z.string().optional(),
  legalForm: z.string().optional(),
  vatNumber: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  contactPerson: z.string().optional(),
  pec: z.string().email().optional().or(z.literal("")),
  sdi: z.string().optional(),
  iban: z.string().optional(),
  bankName: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const insertBankTransactionSchema = createInsertSchema(bankTransactions).omit({
  id: true,
  syncedAt: true,
  lastUpdated: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform(val => String(val)),
  balance: z.union([z.string(), z.number(), z.null(), z.undefined()]).transform(val => 
    val === null || val === undefined || val === "" ? null : String(val)
  ).optional(),
});

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Email Settings
export const emailSettings = pgTable("email_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name").notNull(),
  replyToEmail: text("reply_to_email"),
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpUsername: text("smtp_username"),
  smtpPassword: text("smtp_password"),
  sendgridApiKey: text("sendgrid_api_key"),
  provider: text("provider").notNull().default("sendgrid"), // sendgrid, smtp
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEmailSettingsSchema = createInsertSchema(emailSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  fromEmail: z.string().email("Email mittente non valida"),
  fromName: z.string().min(1, "Nome mittente richiesto"),
  replyToEmail: z.string().email("Email di risposta non valida").optional(),
  smtpPort: z.number().optional(),
  provider: z.enum(["sendgrid", "smtp"]).default("sendgrid"),
});

// SendGrid Email Templates Schema
export const sendgridTemplates = pgTable('sendgrid_templates', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  subject: text('subject').notNull(),
  category: text('category').notNull(), // password_reset, notification, invoice, welcome, etc.
  templateId: text('template_id').notNull(), // SendGrid template ID
  description: text('description'),
  variables: text('variables'), // JSON string of template variables
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const insertSendgridTemplateSchema = createInsertSchema(sendgridTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  name: z.string().min(1, "Nome template richiesto"),
  subject: z.string().min(1, "Oggetto richiesto"),
  category: z.enum([
    "password_reset", 
    "notification", 
    "invoice", 
    "welcome", 
    "alert", 
    "report", 
    "reminder",
    "verification"
  ]),
  templateId: z.string().min(1, "Template ID SendGrid richiesto"),
  variables: z.string().optional()
});

export type InsertSendgridTemplate = z.infer<typeof insertSendgridTemplateSchema>;
export type SendgridTemplate = typeof sendgridTemplates.$inferSelect;

// WhatsApp Business API Settings Schema - Compliant con Business Manager Meta
export const whatsappSettings = pgTable('whatsapp_settings', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  provider: text('provider').notNull().default('twilio'), // twilio, linkmobility
  
  // Twilio Configuration
  accountSid: text('account_sid'), // Twilio Account SID
  authToken: text('auth_token'), // Twilio Auth Token
  
  // LinkMobility Configuration  
  apiKey: text('api_key'), // LinkMobility API Key
  linkMobilityEndpoint: text('linkmobility_endpoint'), // EU endpoint
  
  // WhatsApp Business Number (Meta Business Manager Required)
  whatsappNumber: text('whatsapp_number').notNull(), // +393451234567
  numberDisplayName: text('number_display_name'), // Nome mostrato nei messaggi
  
  // Business Manager Meta Information (REQUIRED)
  businessManagerId: text('business_manager_id'), // Meta Business Manager ID
  whatsappBusinessAccountId: text('whatsapp_business_account_id'), // WABA ID
  businessVerificationStatus: text('business_verification_status').default('pending'), // pending, approved, rejected
  
  // Business Profile Information (per approvazione Meta)
  businessDisplayName: text('business_display_name'), // Nome business verificato
  businessAbout: text('business_about'), // Descrizione per approvazione
  businessWebsite: text('business_website'), // Sito verificato in Business Manager
  businessCategory: text('business_category'), // Categoria business Meta
  businessAddress: text('business_address'), // Indirizzo business per verifica
  
  // Template System (Pre-approvazione richiesta)
  templateApprovalStatus: text('template_approval_status').default('none'), // none, pending, approved
  approvedTemplates: text('approved_templates'), // JSON array of approved template names
  
  // Webhook Configuration
  webhookUrl: text('webhook_url'), // URL per ricevere messaggi
  verifyToken: text('verify_token'), // Token verifica webhook
  webhookSecret: text('webhook_secret'), // Secret per validazione firma
  
  // Status Flags
  isActive: boolean('is_active').default(true),
  isNumberVerified: boolean('is_number_verified').default(false), // Numero verificato Business Manager
  isApiConnected: boolean('is_api_connected').default(false), // Connessione API attiva
  
  // Audit Trail
  lastTestAt: timestamp('last_test_at'), // Ultimo test connessione
  lastMessageSentAt: timestamp('last_message_sent_at'), // Ultimo messaggio inviato
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// WhatsApp Templates Schema - 2024 Best Practices
export const whatsappTemplates = pgTable('whatsapp_templates', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  provider: text('provider').notNull(), // 'twilio' | 'linkmobility'
  category: text('category').notNull(), // 'AUTHENTICATION' | 'UTILITY' | 'MARKETING'
  language: text('language').default('it'),
  status: text('status').default('PENDING'), // 'PENDING' | 'APPROVED' | 'REJECTED'
  
  // Template Structure
  header: jsonb('header'), // { type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT', content: string, variables?: string[] }
  body: jsonb('body').notNull(), // { content: string, variables?: string[] }
  footer: jsonb('footer'), // { content?: string }
  buttons: jsonb('buttons'), // Array of button objects
  
  // Metadata
  tags: text('tags').array(),
  description: text('description'),
  qualityScore: text('quality_score'), // 'HIGH' | 'MEDIUM' | 'LOW'
  
  // Provider-Specific IDs
  providerTemplateId: text('provider_template_id'), // ID from Twilio/LinkMobility
  metaTemplateId: text('meta_template_id'), // ID from Meta WhatsApp
  
  // Twilio Specific Fields
  contentSid: text('content_sid'), // 🔥 Twilio: SID dopo approvazione (per invio)
  approvalRequestId: text('approval_request_id'), // 🔥 Twilio: ID richiesta approvazione
  
  // Meta Business Manager Fields  
  wabaTemplateId: text('waba_template_id'), // 🔥 Meta: WABA template ID
  
  // Tracking
  lastApprovalRequest: timestamp('last_approval_request'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const insertWhatsappSettingsSchema = createInsertSchema(whatsappSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastTestAt: true,
  lastMessageSentAt: true
}).extend({
  provider: z.enum(['twilio', 'linkmobility']).default('twilio'),
  whatsappNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, "Numero WhatsApp non valido (formato: +393451234567)"),
  businessDisplayName: z.string().min(1, "Nome business richiesto per approvazione Meta"),
  businessAbout: z.string().min(10, "Descrizione business minimo 10 caratteri"),
  businessWebsite: z.string().url("URL sito web non valido").optional().or(z.literal("")),
  accountSid: z.string().optional(), // Required se Twilio
  authToken: z.string().optional(), // Required se Twilio
  apiKey: z.string().optional(), // Required se LinkMobility
  businessVerificationStatus: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  templateApprovalStatus: z.enum(['none', 'pending', 'approved']).default('none')
});

export type InsertWhatsappSettings = z.infer<typeof insertWhatsappSettingsSchema>;

// WhatsApp Template Insert Schema
export const insertWhatsappTemplateSchema = createInsertSchema(whatsappTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  providerTemplateId: true,
  metaTemplateId: true,
  lastApprovalRequest: true
}).extend({
  name: z.string()
    .min(1, "Nome richiesto")
    .regex(/^[a-z0-9_]+$/, "Solo lettere minuscole, numeri e underscore")
    .max(512, "Massimo 512 caratteri"),
  provider: z.enum(['twilio', 'linkmobility']),
  category: z.enum(['AUTHENTICATION', 'UTILITY', 'MARKETING']),
  body: z.object({
    content: z.string().min(1, "Contenuto richiesto").max(1024, "Massimo 1024 caratteri"),
    variables: z.array(z.string()).optional()
  }),
  header: z.object({
    type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']).optional(),
    content: z.string().optional(),
    variables: z.array(z.string()).optional()
  }).optional(),
  footer: z.object({
    content: z.string().max(60, "Footer massimo 60 caratteri").optional()
  }).optional(),
  buttons: z.array(z.object({
    type: z.enum(['QUICK_REPLY', 'CALL_TO_ACTION', 'URL']),
    text: z.string().max(25, "Testo pulsante massimo 25 caratteri"),
    url: z.string().url().optional(),
    phoneNumber: z.string().optional()
  })).optional()
});

export type InsertWhatsappTemplate = z.infer<typeof insertWhatsappTemplateSchema>;
export type WhatsappSettings = typeof whatsappSettings.$inferSelect;
export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;

// WhatsApp Chat History (per tracciare conversazioni)
export const whatsappChats = pgTable("whatsapp_chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  whatsappNumber: text("whatsapp_number").notNull(), // Numero WhatsApp del contatto
  contactName: text("contact_name"), // Nome del contatto
  profileName: text("profile_name"), // Nome profilo WhatsApp
  
  // User Information
  phoneNumber: text("phone_number"),
  isBusinessAccount: boolean("is_business_account").default(false),
  
  // Chat Settings
  isBlocked: boolean("is_blocked").default(false),
  isMuted: boolean("is_muted").default(false),
  
  // Conversation Tracking
  lastMessageId: text("last_message_id"),
  lastMessageAt: timestamp("last_message_at"),
  lastMessageText: text("last_message_text"),
  messageCount: integer("message_count").default(0),
  
  // Business Integration
  linkedCustomerId: varchar("linked_customer_id").references(() => customers.id),
  linkedResourceId: varchar("linked_resource_id").references(() => resources.id),
  
  // Chat Status
  status: text("status").default("active"), // active, archived, deleted
  
  // Metadata
  notes: text("notes"),
  tags: jsonb("tags").default([]),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// WhatsApp Chat Insert Schema
export const insertWhatsappChatSchema = createInsertSchema(whatsappChats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  messageCount: true,
  lastMessageAt: true
}).extend({
  whatsappNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, "Numero WhatsApp non valido"),
  contactName: z.string().max(100, "Massimo 100 caratteri").optional(),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, "Formato telefono non valido").optional()
});

export type WhatsappChat = typeof whatsappChats.$inferSelect;
export type InsertWhatsappChat = z.infer<typeof insertWhatsappChatSchema>;

// WhatsApp Messages (per tracciare singoli messaggi)
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull().references(() => whatsappChats.id, { onDelete: 'cascade' }),
  
  // Message Details
  messageId: text("message_id"), // Twilio SID o ID specifico provider
  whatsappMessageId: text("whatsapp_message_id"), // ID messaggio WhatsApp ufficiale
  direction: text("direction").notNull(), // 'inbound', 'outbound'
  
  // Content
  messageType: text("message_type").default("text"), // text, image, audio, video, document, location
  messageText: text("message_text"), // Testo del messaggio
  mediaUrl: text("media_url"), // URL per media
  mediaType: text("media_type"), // image/jpeg, audio/ogg, etc.
  
  // Status & Delivery
  status: text("status").default("queued"), // queued, sending, sent, delivered, read, failed
  errorCode: text("error_code"), // Codice errore se failed
  errorMessage: text("error_message"), // Messaggio errore se failed
  
  // Sender/Recipient
  fromNumber: text("from_number").notNull(), // Numero mittente
  toNumber: text("to_number").notNull(), // Numero destinatario
  
  // Metadata
  providerResponse: jsonb("provider_response"), // Risposta completa del provider
  isTemplateMessage: boolean("is_template_message").default(false),
  templateName: text("template_name"), // Nome template se template message
  
  // Timestamps
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// WhatsApp Message Insert Schema
export const insertWhatsappMessageSchema = createInsertSchema(whatsappMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  chatId: z.string().uuid("ID chat non valido"),
  direction: z.enum(["inbound", "outbound"], { required_error: "Direzione richiesta" }),
  messageType: z.enum(["text", "image", "audio", "video", "document", "location"]).default("text"),
  fromNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, "Formato numero non valido"),
  toNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, "Formato numero non valido"),
  messageText: z.string().max(4096, "Messaggio troppo lungo").optional()
});

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = z.infer<typeof insertWhatsappMessageSchema>;

// === TELEGRAM INTEGRATION ===

// Telegram Bot Settings
export const telegramSettings = pgTable("telegram_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botToken: text("bot_token").notNull(),
  botUsername: text("bot_username").notNull(), // @username del bot
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),
  allowedUpdates: jsonb("allowed_updates").default(['message', 'callback_query']), // tipi di update consentiti
  // Bot Configuration
  botDescription: text("bot_description"),
  botShortDescription: text("bot_short_description"),
  // Security & Permissions
  allowedChatTypes: jsonb("allowed_chat_types").default(['private', 'group']), // 'private', 'group', 'supergroup', 'channel'
  adminChatIds: jsonb("admin_chat_ids").default([]), // chat ID degli admin
  maxMessageLength: integer("max_message_length").default(4096),
  rateLimitPerMinute: integer("rate_limit_per_minute").default(30),
  // Business Hours
  enableBusinessHours: boolean("enable_business_hours").default(false),
  businessHoursStart: text("business_hours_start").default('09:00'),
  businessHoursEnd: text("business_hours_end").default('18:00'),
  businessDays: jsonb("business_days").default(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
  autoReplyOutsideHours: boolean("auto_reply_outside_hours").default(true),
  outOfHoursMessage: text("out_of_hours_message"),
  // Auto Reply & AI
  enableAutoReply: boolean("enable_auto_reply").default(false),
  enableAiResponses: boolean("enable_ai_responses").default(false),
  aiModel: text("ai_model").default('gpt-4o'),
  aiSystemPrompt: text("ai_system_prompt"),
  // Status
  isActive: boolean("is_active").notNull().default(false),
  lastTested: timestamp("last_tested"),
  lastMessageSent: timestamp("last_message_sent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Telegram Templates/Commands
export const telegramTemplates = pgTable("telegram_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull().default('message'), // 'message', 'command', 'inline_keyboard'
  command: text("command"), // Solo per type='command' es: '/start'
  category: text("category").notNull(), // 'welcome', 'support', 'info', 'marketing'
  language: text("language").default('it'),
  
  // Template Content
  content: text("content").notNull(),
  parseMode: text("parse_mode").default('HTML'), // 'HTML', 'Markdown', 'MarkdownV2'
  disableWebPagePreview: boolean("disable_web_page_preview").default(false),
  
  // Inline Keyboard (solo per messaggi interattivi)
  inlineKeyboard: jsonb("inline_keyboard"), // Array di righe di bottoni
  
  // Variables & Personalization
  variables: jsonb("variables").default([]), // Array di variabili tipo {{nome}}
  personalizationEnabled: boolean("personalization_enabled").default(false),
  
  // Metadata
  tags: text("tags").array(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Telegram Chat History (per tracciare conversazioni)
export const telegramChats = pgTable("telegram_chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: integer("chat_id").notNull(), // Changed to match bigint database type
  telegramChatId: text("telegram_chat_id").notNull().unique(),
  chatType: text("chat_type").notNull(), // 'private', 'group', 'supergroup', 'channel'
  title: text("title"), // Nome del gruppo/canale
  username: text("username"), // Username del chat (se esiste)
  firstName: text("first_name"), // Solo per private chats
  lastName: text("last_name"), // Solo per private chats
  
  // User Information
  phoneNumber: text("phone_number"),
  languageCode: text("language_code"),
  
  // Chat Settings
  isBlocked: boolean("is_blocked").default(false),
  isPremium: boolean("is_premium").default(false),
  isBot: boolean("is_bot").default(false),
  
  // Conversation Tracking
  lastMessageId: integer("last_message_id"),
  lastMessageAt: timestamp("last_message_at"),
  messageCount: integer("message_count").default(0),
  
  // Business Integration
  linkedCustomerId: varchar("linked_customer_id").references(() => customers.id),
  linkedResourceId: varchar("linked_resource_id").references(() => resources.id),
  
  // Metadata
  notes: text("notes"),
  tags: jsonb("tags").default([]),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastRealMessage: text("last_real_message"),
});

// Telegram Messages (per tracciare i messaggi)
export const telegramMessages = pgTable("telegram_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  chatId: varchar("chat_id").notNull(), // UUID riferimento interno
  telegramMessageId: integer("telegram_message_id"),
  content: text("content").notNull(),
  direction: text("direction").notNull().default('incoming'), // 'incoming' or 'outgoing'
  fromUser: text("from_user"),
  toUser: text("to_user"),
  messageType: text("message_type").notNull().default('text'),
  isAiGenerated: boolean("is_ai_generated").notNull().default(false),
  delivered: boolean("delivered").notNull().default(false),
  readStatus: text("read_status").notNull().default('unread'), // 'read', 'unread', 'delivered'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Telegram Schema Validazioni
export const insertTelegramSettingsSchema = createInsertSchema(telegramSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastTested: true,
  lastMessageSent: true
}).extend({
  botToken: z.string().regex(/^\d+:[A-Za-z0-9_-]+$/, "Token bot Telegram non valido"),
  botUsername: z.string().regex(/^@[A-Za-z0-9_]{5,32}$/, "Username bot deve iniziare con @ e essere 5-32 caratteri"),
  webhookUrl: z.string().url("URL webhook non valido").optional().or(z.literal("")),
  maxMessageLength: z.number().min(1).max(4096).default(4096),
  rateLimitPerMinute: z.number().min(1).max(300).default(30),
  businessHoursStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato ora non valido (HH:MM)").default('09:00'),
  businessHoursEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato ora non valido (HH:MM)").default('18:00'),
  aiModel: z.enum(['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo']).default('gpt-4o')
});

export const insertTelegramTemplateSchema = createInsertSchema(telegramTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  lastUsed: true
}).extend({
  name: z.string().min(1, "Nome richiesto").max(100, "Massimo 100 caratteri"),
  type: z.enum(['message', 'command', 'inline_keyboard']).default('message'),
  command: z.string().regex(/^\/[a-z_]+$/, "Comando deve iniziare con / e contenere solo lettere minuscole e _").optional(),
  category: z.enum(['welcome', 'support', 'info', 'marketing', 'automation']),
  content: z.string().min(1, "Contenuto richiesto").max(4096, "Massimo 4096 caratteri"),
  parseMode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).default('HTML')
});

export const insertTelegramChatSchema = createInsertSchema(telegramChats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  messageCount: true,
  lastMessageAt: true
}).extend({
  telegramChatId: z.string().min(1, "Chat ID richiesto"),
  chatType: z.enum(['private', 'group', 'supergroup', 'channel']),
  firstName: z.string().max(64, "Massimo 64 caratteri").optional(),
  lastName: z.string().max(64, "Massimo 64 caratteri").optional(),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, "Formato telefono non valido").optional()
});

// Telegram Types
export type TelegramSettings = typeof telegramSettings.$inferSelect;
export type InsertTelegramSettings = z.infer<typeof insertTelegramSettingsSchema>;

export type TelegramTemplate = typeof telegramTemplates.$inferSelect;
export type InsertTelegramTemplate = z.infer<typeof insertTelegramTemplateSchema>;

export type TelegramChat = typeof telegramChats.$inferSelect;
export type InsertTelegramChat = z.infer<typeof insertTelegramChatSchema>;

export type TelegramMessage = typeof telegramMessages.$inferSelect;
export type InsertTelegramMessage = typeof telegramMessages.$inferInsert;

export const passwordResetSchema = z.object({
  email: z.string().email("Email non valida"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token richiesto"),
  password: z.string().min(6, "Password deve avere almeno 6 caratteri"),
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username richiesto"),
  password: z.string().min(1, "Password richiesta"),
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password attuale richiesta"),
  newPassword: z.string().min(6, "La nuova password deve avere almeno 6 caratteri"),
  confirmPassword: z.string().min(1, "Conferma password richiesta"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

// AI Insert Schemas
export const insertAiSettingsSchema = createInsertSchema(aiSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  userId: z.string(),
  defaultModel: z.enum(['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo']).default('gpt-4o'),
  maxTokens: z.number().min(100).max(4000).default(2000),
  temperature: z.number().min(0).max(2).default(0.7),
  privacyMode: z.enum(['strict', 'standard', 'relaxed']).default('standard'),
  dataRetention: z.enum(['none', '30days', '90days']).default('none'),
});

export const insertAiChatHistorySchema = createInsertSchema(aiChatHistory).omit({
  id: true,
  createdAt: true,
}).extend({
  userId: z.string(),
  sessionId: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
});

export const insertAiDocumentJobSchema = createInsertSchema(aiDocumentJobs).omit({
  id: true,
  createdAt: true,
  completedAt: true,
}).extend({
  userId: z.string(),
  fileName: z.string().min(1),
  filePath: z.string().min(1),
  fileType: z.string().min(1),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
});

// AI Types per TypeScript
export type AiSettings = typeof aiSettings.$inferSelect;
export type InsertAiSettings = z.infer<typeof insertAiSettingsSchema>;

export type AiChatHistory = typeof aiChatHistory.$inferSelect;
export type InsertAiChatHistory = z.infer<typeof insertAiChatHistorySchema>;

export type AiDocumentJob = typeof aiDocumentJobs.$inferSelect;
export type InsertAiDocumentJob = z.infer<typeof insertAiDocumentJobSchema>;

// === SECURITY TABLES ===

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
  deviceInfo: text("device_info"), // Browser, OS, etc.
});

// Active Sessions Table
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
  backupCodes: text("backup_codes"), // JSON string of backup codes
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Security Schemas
export const insertSecuritySettingsSchema = createInsertSchema(securitySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

// Security Types
export type SecuritySettings = typeof securitySettings.$inferSelect;
export type InsertSecuritySettings = z.infer<typeof insertSecuritySettingsSchema>;
export type LoginAuditLog = typeof loginAuditLog.$inferSelect;
export type ActiveSession = typeof activeSessions.$inferSelect;
export type PasswordHistory = typeof passwordHistory.$inferSelect;
export type TwoFactorAuth = typeof twoFactorAuth.$inferSelect;

// ==========================================
// CALENDAR SYSTEM TABLES
// ==========================================

// Calendar Events - Eventi del calendario
export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isAllDay: boolean("is_all_day").notNull().default(false),
  location: text("location"),
  type: text("type").notNull().default('task'), // 'task', 'meeting', 'reminder', 'deadline'
  priority: text("priority").notNull().default('medium'), // 'low', 'medium', 'high', 'urgent'
  status: text("status").notNull().default('planned'), // 'planned', 'in_progress', 'completed', 'cancelled'
  
  // Recurring events
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrencePattern: text("recurrence_pattern"), // 'daily', 'weekly', 'monthly', 'yearly'
  recurrenceInterval: integer("recurrence_interval").default(1), // ogni X giorni/settimane/mesi/anni
  recurrenceEndDate: timestamp("recurrence_end_date"),
  recurrenceCount: integer("recurrence_count"), // numero massimo di occorrenze
  parentEventId: varchar("parent_event_id"), // riferimento all'evento ricorrente padre
  
  // Links to other entities
  linkedMovementId: varchar("linked_movement_id"), // collegamento a movimento finanziario
  linkedResourceId: varchar("linked_resource_id"), // collegamento a risorsa
  linkedCompanyId: varchar("linked_company_id"), // collegamento a azienda
  linkedSupplierId: varchar("linked_supplier_id"), // collegamento a fornitore
  linkedCustomerId: varchar("linked_customer_id"), // collegamento a cliente
  
  // External sync
  googleCalendarEventId: text("google_calendar_event_id"), // ID evento su Google Calendar
  outlookEventId: text("outlook_event_id"), // ID evento su Outlook
  lastSyncedAt: timestamp("last_synced_at"),
  syncStatus: text("sync_status").default('pending'), // 'pending', 'synced', 'error'
  syncError: text("sync_error"),
  
  // User and metadata
  createdByUserId: varchar("created_by_user_id").notNull(),
  assignedToUserId: varchar("assigned_to_user_id"), // chi deve completare il task
  tags: text("tags").array(), // array di tag per categorizzazione
  color: text("color").default('#3B82F6'), // colore per visualizzazione
  metadata: jsonb("metadata"), // dati aggiuntivi flessibili
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Calendar Integrations - Configurazioni API esterne
// Calendar OAuth Configurations - Stores OAuth app settings
export const calendarConfigs = pgTable("calendar_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // utente proprietario della configurazione
  provider: text("provider").notNull(), // 'google', 'outlook'
  
  // OAuth App Configuration
  clientId: text("client_id").notNull(), // Client ID dall'app OAuth
  clientSecret: text("client_secret").notNull(), // Client Secret dall'app OAuth (crittografato)
  redirectUri: text("redirect_uri").notNull(), // URI di callback configurato nell'app
  
  // Status and metadata
  isActive: boolean("is_active").notNull().default(true),
  lastTestedAt: timestamp("last_tested_at"), // Ultimo test configurazione
  testResult: jsonb("test_result"), // Risultato ultimo test
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const calendarIntegrations = pgTable("calendar_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // utente proprietario dell'integrazione
  provider: text("provider").notNull(), // 'google', 'outlook'
  providerAccountId: text("provider_account_id").notNull(), // ID account sul provider
  email: text("email").notNull(), // email account collegato
  
  // OAuth tokens
  accessToken: text("access_token"), // crittografato
  refreshToken: text("refresh_token"), // crittografato  
  tokenType: text("token_type").default('Bearer'),
  expiresAt: timestamp("expires_at"),
  scope: text("scope"), // permessi concessi
  
  // Calendar settings
  defaultCalendarId: text("default_calendar_id"), // calendario predefinito per sync
  syncEnabled: boolean("sync_enabled").notNull().default(true),
  syncDirection: text("sync_direction").notNull().default('outbound'), // 'outbound', 'inbound', 'bidirectional'
  syncFrequency: text("sync_frequency").default('immediate'), // 'immediate', 'hourly', 'daily'
  lastSyncAt: timestamp("last_sync_at"),
  
  // Event filtering
  syncAllEvents: boolean("sync_all_events").notNull().default(true),
  eventPrefix: text("event_prefix").default('[ECF]'), // prefisso per eventi sincronizzati
  
  // Status and metadata
  isActive: boolean("is_active").notNull().default(true),
  lastError: text("last_error"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Calendar Reminders - Sistema di promemoria
export const calendarReminders = pgTable("calendar_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull(),
  reminderType: text("reminder_type").notNull(), // 'notification', 'email', 'sms', 'whatsapp'
  reminderTime: integer("reminder_time").notNull(), // minuti prima dell'evento
  reminderUnit: text("reminder_unit").notNull().default('minutes'), // 'minutes', 'hours', 'days'
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  isSent: boolean("is_sent").notNull().default(false),
  sentAt: timestamp("sent_at"),
  scheduledFor: timestamp("scheduled_for").notNull(), // quando inviare il reminder
  
  // Delivery details
  recipientUserId: varchar("recipient_user_id").notNull(),
  recipientEmail: text("recipient_email"),
  recipientPhone: text("recipient_phone"),
  deliveryStatus: text("delivery_status").default('pending'), // 'pending', 'sent', 'delivered', 'failed'
  deliveryError: text("delivery_error"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Calendar schema validations
export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCalendarConfigSchema = createInsertSchema(calendarConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastTestedAt: true
}).extend({
  provider: z.enum(['google', 'outlook']),
  clientId: z.string().min(1, "Client ID richiesto"),
  clientSecret: z.string().min(1, "Client Secret richiesto"),
  redirectUri: z.string().url("Redirect URI deve essere un URL valido")
});

export const insertCalendarIntegrationSchema = createInsertSchema(calendarIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCalendarReminderSchema = createInsertSchema(calendarReminders).omit({
  id: true,
  createdAt: true,
});

// ==========================================
// CALENDAR RELATIONS
// ==========================================

// Calendar Events Relations
export const calendarEventsRelations = relations(calendarEvents, ({ one, many }) => ({
  // User relations
  createdByUser: one(users, {
    fields: [calendarEvents.createdByUserId],
    references: [users.id],
  }),
  assignedToUser: one(users, {
    fields: [calendarEvents.assignedToUserId],
    references: [users.id],
  }),
  
  // Linked entities relations
  linkedMovement: one(movements, {
    fields: [calendarEvents.linkedMovementId],
    references: [movements.id],
  }),
  linkedResource: one(resources, {
    fields: [calendarEvents.linkedResourceId],
    references: [resources.id],
  }),
  linkedCompany: one(companies, {
    fields: [calendarEvents.linkedCompanyId],
    references: [companies.id],
  }),
  linkedSupplier: one(suppliers, {
    fields: [calendarEvents.linkedSupplierId],
    references: [suppliers.id],
  }),
  linkedCustomer: one(customers, {
    fields: [calendarEvents.linkedCustomerId],
    references: [customers.id],
  }),
  
  // Parent-child for recurring events
  parentEvent: one(calendarEvents, {
    fields: [calendarEvents.parentEventId],
    references: [calendarEvents.id],
  }),
  childEvents: many(calendarEvents),
  
  // Reminders
  reminders: many(calendarReminders),
}));

// Calendar Configs Relations
export const calendarConfigsRelations = relations(calendarConfigs, ({ one }) => ({
  user: one(users, {
    fields: [calendarConfigs.userId],
    references: [users.id],
  }),
}));

// Calendar Integrations Relations
export const calendarIntegrationsRelations = relations(calendarIntegrations, ({ one }) => ({
  user: one(users, {
    fields: [calendarIntegrations.userId],
    references: [users.id],
  }),
}));

// Calendar Reminders Relations
export const calendarRemindersRelations = relations(calendarReminders, ({ one }) => ({
  event: one(calendarEvents, {
    fields: [calendarReminders.eventId],
    references: [calendarEvents.id],
  }),
  recipientUser: one(users, {
    fields: [calendarReminders.recipientUserId],
    references: [users.id],
  }),
}));

// Note: Calendar relations are integrated in existing entity relations above



// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Core = typeof cores.$inferSelect;
export type InsertCore = z.infer<typeof insertCoreSchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type Iban = typeof ibans.$inferSelect;
export type InsertIban = z.infer<typeof insertIbanSchema>;

export type Office = typeof offices.$inferSelect;
export type InsertOffice = z.infer<typeof insertOfficeSchema>;

export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;

export type MovementStatus = typeof movementStatuses.$inferSelect;
export type InsertMovementStatus = z.infer<typeof insertMovementStatusSchema>;

export type MovementReason = typeof movementReasons.$inferSelect;
export type InsertMovementReason = z.infer<typeof insertMovementReasonSchema>;

export type Movement = typeof movements.$inferSelect;
export type InsertMovement = z.infer<typeof insertMovementSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type EmailSettings = typeof emailSettings.$inferSelect;
export type InsertEmailSettings = z.infer<typeof insertEmailSettingsSchema>;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Calendar Types
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;

export type CalendarConfig = typeof calendarConfigs.$inferSelect;
export type InsertCalendarConfig = z.infer<typeof insertCalendarConfigSchema>;

export type CalendarIntegration = typeof calendarIntegrations.$inferSelect;
export type InsertCalendarIntegration = z.infer<typeof insertCalendarIntegrationSchema>;

export type CalendarReminder = typeof calendarReminders.$inferSelect;
export type InsertCalendarReminder = z.infer<typeof insertCalendarReminderSchema>;

// Document Analysis - Archivio analisi documenti AI
export const documentAnalysis = pgTable("document_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size"),
  documentType: text("document_type"), // Fattura, Contratto, DDT, etc
  summary: text("summary"),
  keyPoints: jsonb("key_points"), // Array di punti chiave
  extractedData: jsonb("extracted_data"), // Dati estratti (importi, date, etc)
  suggestedMovement: jsonb("suggested_movement"), // Movimento suggerito se presente
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0.00-1.00
  recommendations: jsonb("recommendations"), // Array raccomandazioni  
  compliance: jsonb("compliance"), // Stato conformità
  tokensUsed: integer("tokens_used").default(0),
  processingTimeMs: integer("processing_time_ms").default(0),
  status: text("status").notNull().default('completed'), // 'processing', 'completed', 'failed'
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documentAnalysisRelations = relations(documentAnalysis, ({ one }) => ({
  user: one(users, {
    fields: [documentAnalysis.userId],
    references: [users.id],
  }),
}));

export const insertDocumentAnalysisSchema = createInsertSchema(documentAnalysis);
export type InsertDocumentAnalysis = z.infer<typeof insertDocumentAnalysisSchema>;
export type DocumentAnalysis = typeof documentAnalysis.$inferSelect;

// === FISCAL AI CONVERSATIONS ===

export const fiscalAiConversations = pgTable("fiscal_ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  
  // Conversation metadata
  messageCount: integer("message_count").default(0),
  lastMessageAt: timestamp("last_message_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fiscalAiMessages = pgTable("fiscal_ai_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => fiscalAiConversations.id, { onDelete: 'cascade' }),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  
  // AI Response metadata  
  confidence: real("confidence"),
  tokensUsed: integer("tokens_used"),
  
  // Suggestions and references
  suggestions: jsonb("suggestions").default([]),
  references: jsonb("references").default([]),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Fiscal AI Relations
export const fiscalAiConversationRelations = relations(fiscalAiConversations, ({ many, one }) => ({
  messages: many(fiscalAiMessages),
  user: one(users, {
    fields: [fiscalAiConversations.userId],
    references: [users.id],
  }),
}));

export const fiscalAiMessageRelations = relations(fiscalAiMessages, ({ one }) => ({
  conversation: one(fiscalAiConversations, {
    fields: [fiscalAiMessages.conversationId],
    references: [fiscalAiConversations.id],
  }),
}));

// Fiscal AI Types
export const insertFiscalAiConversationSchema = createInsertSchema(fiscalAiConversations);
export const insertFiscalAiMessageSchema = createInsertSchema(fiscalAiMessages);

export type FiscalAiConversation = typeof fiscalAiConversations.$inferSelect;
export type InsertFiscalAiConversation = z.infer<typeof insertFiscalAiConversationSchema>;
export type FiscalAiMessage = typeof fiscalAiMessages.$inferSelect;
export type InsertFiscalAiMessage = z.infer<typeof insertFiscalAiMessageSchema>;

// === DATABASE CONFIGURATION SCHEMA ===
export const databaseSettings = pgTable("database_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Connection settings
  maxConnections: integer("max_connections").notNull().default(10),
  connectionTimeout: integer("connection_timeout").notNull().default(5000), // milliseconds
  queryTimeout: integer("query_timeout").notNull().default(30000), // milliseconds
  
  // Performance settings
  autoVacuumEnabled: boolean("auto_vacuum_enabled").notNull().default(true),
  logSlowQueries: boolean("log_slow_queries").notNull().default(true),
  slowQueryThreshold: integer("slow_query_threshold").notNull().default(1000), // milliseconds
  
  // Backup settings
  autoBackupEnabled: boolean("auto_backup_enabled").notNull().default(true),
  backupRetentionDays: integer("backup_retention_days").notNull().default(30),
  backupInterval: integer("backup_interval").notNull().default(86400), // seconds (24h)
  
  // Monitoring settings
  enableQueryLogging: boolean("enable_query_logging").notNull().default(false),
  enableConnectionMetrics: boolean("enable_connection_metrics").notNull().default(true),
  enablePerformanceMetrics: boolean("enable_performance_metrics").notNull().default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// === BACKUP SYSTEM TABLES ===

// Backup configurations table
export const backupConfigurations = pgTable("backup_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'database', 'files', 'full', 'incremental', 'differential'
  scheduleType: text("schedule_type").notNull(), // 'daily', 'weekly', 'monthly', 'custom'
  scheduleTime: text("schedule_time"), // HH:MM format
  scheduleDay: integer("schedule_day"), // 0-6, 0 = Sunday
  scheduleDate: integer("schedule_date"), // 1-31
  schedule: text("schedule"), // Custom cron expression
  enabled: boolean("enabled").notNull().default(true),
  retentionDays: integer("retention_days").notNull(),
  storageProvider: text("storage_provider").notNull(), // 'gcs', 's3', 'azure', 'local', 'ftp', 'sftp'
  storagePath: text("storage_path"),
  storageCredentials: jsonb("storage_credentials"),
  encryptionEnabled: boolean("encryption_enabled").notNull().default(true),
  encryptionKey: text("encryption_key"),
  compressionEnabled: boolean("compression_enabled").notNull().default(true),
  compressionAlgorithm: text("compression_algorithm").notNull().default('gzip'),
  verificationEnabled: boolean("verification_enabled").notNull().default(true),
  notificationEnabled: boolean("notification_enabled").notNull().default(true),
  notificationEmail: text("notification_email"),
  maxParallelJobs: integer("max_parallel_jobs").notNull().default(1),
  timeoutMinutes: integer("timeout_minutes").notNull().default(60),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  totalRuns: integer("total_runs").notNull().default(0),
  successfulRuns: integer("successful_runs").notNull().default(0),
  failedRuns: integer("failed_runs").notNull().default(0),
  averageDurationSeconds: integer("average_duration_seconds"),
  lastBackupSize: integer("last_backup_size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Backup jobs table
export const backupJobs = pgTable("backup_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  configurationId: varchar("configuration_id").notNull(),
  status: text("status").notNull().default('pending'), // 'pending', 'running', 'completed', 'failed', 'cancelled'
  type: text("type").notNull(), // 'database', 'files', 'full', 'incremental', 'differential'
  priority: integer("priority").notNull().default(5),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  durationSeconds: integer("duration_seconds"),
  backupSizeBytes: integer("backup_size_bytes"),
  backupPath: text("backup_path"),
  checksum: text("checksum"),
  compressionRatio: real("compression_ratio"),
  fileCount: integer("file_count"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Restore points table
export const restorePoints = pgTable("restore_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  backupJobId: varchar("backup_job_id").notNull(),
  snapshotType: text("snapshot_type").notNull(), // 'manual', 'scheduled', 'automatic', 'pre_update', 'pre_migration'
  verificationStatus: text("verification_status").notNull().default('pending'), // 'pending', 'verified', 'failed', 'skipped'
  verificationDate: timestamp("verification_date"),
  totalSizeBytes: integer("total_size_bytes"),
  isArchived: boolean("is_archived").notNull().default(false),
  expiresAt: timestamp("expires_at"),
  tags: text("tags").array(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Backup audit log table
export const backupAuditLog = pgTable("backup_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: text("action").notNull(), // 'configuration_created', 'backup_started', etc.
  resourceType: text("resource_type").notNull(),
  resourceId: varchar("resource_id").notNull(),
  userId: varchar("user_id").notNull(),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  details: jsonb("details"),
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === LOCALIZATION CONFIGURATION SCHEMA ===
export const localizationSettings = pgTable("localization_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Language settings
  defaultLanguage: text("default_language").notNull().default("it"),
  availableLanguages: text("available_languages").array().notNull().default(sql`ARRAY['it', 'en', 'fr', 'de', 'es']`),
  autoDetectLanguage: boolean("auto_detect_language").notNull().default(false),
  
  // Regional settings
  country: text("country").notNull().default("IT"),
  region: text("region").notNull().default("Europe/Rome"),
  timezone: text("timezone").notNull().default("Europe/Rome"),
  
  // Format settings
  dateFormat: text("date_format").notNull().default("DD/MM/YYYY"),
  timeFormat: text("time_format").notNull().default("24h"),
  numberFormat: text("number_format").notNull().default("comma"), // comma, dot, space
  currency: text("currency").notNull().default("EUR"),
  currencySymbol: text("currency_symbol").notNull().default("€"),
  currencyPosition: text("currency_position").notNull().default("after"), // before, after
  
  // Business settings
  fiscalYearStart: text("fiscal_year_start").notNull().default("01-01"), // MM-DD format
  weekStart: text("week_start").notNull().default("monday"), // sunday, monday
  workingDays: text("working_days").array().notNull().default(sql`ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']`),
  workingHoursStart: text("working_hours_start").notNull().default("09:00"),
  workingHoursEnd: text("working_hours_end").notNull().default("18:00"),
  
  // UI preferences
  rtlLayout: boolean("rtl_layout").notNull().default(false),
  compactNumbers: boolean("compact_numbers").notNull().default(true),
  localizedIcons: boolean("localized_icons").notNull().default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// === DOCUMENTS CONFIGURATION SCHEMA ===
export const documentsSettings = pgTable("documents_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Storage configuration
  maxFileSize: integer("max_file_size").notNull().default(10), // MB
  allowedFormats: text("allowed_formats").array().notNull().default(sql`ARRAY['pdf', 'xml', 'xlsx', 'docx', 'jpg', 'png']`),
  storageProvider: text("storage_provider").notNull().default("gcp"), // local, gcp, s3, azure
  autoBackup: boolean("auto_backup").notNull().default(true),
  
  // Processing settings
  autoProcessXML: boolean("auto_process_xml").notNull().default(true),
  validateFatturaPA: boolean("validate_fattura_pa").notNull().default(true),
  extractMetadata: boolean("extract_metadata").notNull().default(true),
  generateThumbnails: boolean("generate_thumbnails").notNull().default(true),
  
  // Security settings
  encryptFiles: boolean("encrypt_files").notNull().default(true),
  requireApproval: boolean("require_approval").notNull().default(false),
  accessLogging: boolean("access_logging").notNull().default(true),
  virusScan: boolean("virus_scan").notNull().default(false),
  
  // Retention policy
  retentionDays: integer("retention_days").notNull().default(2555), // 7 years
  autoArchive: boolean("auto_archive").notNull().default(true),
  archiveAfterDays: integer("archive_after_days").notNull().default(365),
  
  // Templates
  fatturapaTemplate: text("fattura_pa_template"),
  invoiceTemplate: text("invoice_template"),
  reportTemplate: text("report_template"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// === THEMES CONFIGURATION SCHEMA ===
export const themesSettings = pgTable("themes_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Theme settings
  defaultTheme: text("default_theme").notNull().default("light"), // light, dark, auto
  allowUserThemeChange: boolean("allow_user_theme_change").notNull().default(true),
  primaryColor: text("primary_color").notNull().default("#3b82f6"), // blue
  accentColor: text("accent_color").notNull().default("#10b981"), // emerald
  
  // Layout settings
  sidebarPosition: text("sidebar_position").notNull().default("left"), // left, right
  compactMode: boolean("compact_mode").notNull().default(false),
  showBreadcrumbs: boolean("show_breadcrumbs").notNull().default(true),
  animationsEnabled: boolean("animations_enabled").notNull().default(true),
  
  // Branding
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  appName: text("app_name").notNull().default("EasyCashFlows"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// === NOTIFICATION SETTINGS SCHEMA ===
export const notificationSettings = pgTable("notification_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").unique().notNull(),
  
  // General settings
  enableNotifications: boolean("enable_notifications").notNull().default(true),
  enableSounds: boolean("enable_sounds").notNull().default(true),
  enableDesktopNotifications: boolean("enable_desktop_notifications").notNull().default(true),
  
  // Email notifications
  emailEnabled: boolean("email_enabled").notNull().default(true),
  emailDigestEnabled: boolean("email_digest_enabled").notNull().default(false),
  emailDigestFrequency: text("email_digest_frequency").notNull().default("daily"), // 'immediate' | 'hourly' | 'daily' | 'weekly'
  
  // Push notifications  
  pushEnabled: boolean("push_enabled").notNull().default(true),
  pushOnMovements: boolean("push_on_movements").notNull().default(true),
  pushOnMessages: boolean("push_on_messages").notNull().default(true),
  pushOnAlerts: boolean("push_on_alerts").notNull().default(true),
  
  // SMS notifications
  smsEnabled: boolean("sms_enabled").notNull().default(false),
  smsOnUrgent: boolean("sms_on_urgent").notNull().default(true),
  smsQuietHours: boolean("sms_quiet_hours").notNull().default(false),
  smsQuietStart: text("sms_quiet_start").notNull().default("22:00"),
  smsQuietEnd: text("sms_quiet_end").notNull().default("08:00"),
  
  // WhatsApp notifications
  whatsappEnabled: boolean("whatsapp_enabled").notNull().default(false),
  whatsappTemplateId: text("whatsapp_template_id"),
  
  // Webhook notifications
  webhookEnabled: boolean("webhook_enabled").notNull().default(false),
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),
  webhookEvents: text("webhook_events").array(), // Array of event types
  
  // Filtering
  categoriesEnabled: text("categories_enabled").array(), // Array of category IDs
  priorityThreshold: text("priority_threshold").notNull().default("all"), // 'all' | 'normal' | 'high' | 'urgent'
  
  // Advanced
  retryAttempts: integer("retry_attempts").notNull().default(3),
  retryDelay: integer("retry_delay").notNull().default(30), // seconds
  maxQueueSize: integer("max_queue_size").notNull().default(1000),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Extended types with relations
export type MovementWithRelations = Movement & {
  company: Company;
  core: Core;
  reason: MovementReason;
  resource?: Resource;
  office?: Office;
  iban?: Iban;
  tag?: Tag;
  status: MovementStatus;
  supplier?: Supplier;
};

export type CompanyWithRelations = Company & {
  cores: Core[];
  resources: Resource[];
  ibans: Iban[];
  offices: Office[];
};

// Extended User type with Resource relation for authentication
export type UserWithResource = User & {
  resource?: Resource;
  firstName?: string;  // Derived from resource
  lastName?: string;   // Derived from resource
};

// Aliases for backward compatibility
export const operationalSites = offices;
export const movementCategories = movementReasons;
export const systemConfigs = securitySettings;

// === NEW SETTINGS TYPES ===
export type DatabaseSettings = typeof databaseSettings.$inferSelect;
export type InsertDatabaseSettings = typeof databaseSettings.$inferInsert;
export type LocalizationSettings = typeof localizationSettings.$inferSelect;
export type InsertLocalizationSettings = typeof localizationSettings.$inferInsert;
export type DocumentsSettings = typeof documentsSettings.$inferSelect;
export type InsertDocumentsSettings = typeof documentsSettings.$inferInsert;
export type ThemesSettings = typeof themesSettings.$inferSelect;
export type InsertThemesSettings = typeof themesSettings.$inferInsert;
export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = typeof notificationSettings.$inferInsert;

// === NEON DATABASE CONFIGURATION ===
export const neonSettings = pgTable("neon_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // API Configuration
  apiKey: text("api_key"), // Neon API Key (encrypted)
  projectId: text("project_id"), // Neon Project ID
  
  // Project Information
  projectName: text("project_name"),
  region: text("region"),
  branchName: text("branch_name").default("main"),
  databaseName: text("database_name"),
  
  // Connection Details
  hostEndpoint: text("host_endpoint"),
  connectionPooling: boolean("connection_pooling").default(true),
  
  // Monitoring Settings
  enableMetrics: boolean("enable_metrics").default(true),
  enableAlerts: boolean("enable_alerts").default(false),
  alertThresholds: jsonb("alert_thresholds").default({}),
  
  // Backup Configuration
  autoBackup: boolean("auto_backup").default(false),
  backupRetention: integer("backup_retention").default(7), // days
  
  // Advanced Settings
  computeSettings: jsonb("compute_settings").default({}),
  extensions: text("extensions").array().default([]),
  
  // Status & Metadata
  isActive: boolean("is_active").default(true),
  lastSync: timestamp("last_sync"),
  syncStatus: text("sync_status").default("pending"), // 'pending', 'synced', 'error'
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Neon Settings Insert Schema
export const insertNeonSettingsSchema = createInsertSchema(neonSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSync: true
}).extend({
  apiKey: z.string().min(1, "API Key richiesta").optional(),
  projectId: z.string().min(1, "Project ID richiesto").optional(),
  projectName: z.string().max(100, "Nome progetto troppo lungo").optional(),
  region: z.string().max(50, "Regione troppo lunga").optional()
});

export type NeonSettings = typeof neonSettings.$inferSelect;
export type InsertNeonSettings = z.infer<typeof insertNeonSettingsSchema>;

// === BACKUP SYSTEM TYPES ===
export type BackupConfiguration = typeof backupConfigurations.$inferSelect;
export type InsertBackupConfiguration = typeof backupConfigurations.$inferInsert;
export type BackupJob = typeof backupJobs.$inferSelect;
export type InsertBackupJob = typeof backupJobs.$inferInsert;
export type RestorePoint = typeof restorePoints.$inferSelect;
export type InsertRestorePoint = typeof restorePoints.$inferInsert;
export type BackupAuditLog = typeof backupAuditLog.$inferSelect;
export type InsertBackupAuditLog = typeof backupAuditLog.$inferInsert;

// === INSERT SCHEMAS FOR VALIDATION ===
export const insertDatabaseSettingsSchema = createInsertSchema(databaseSettings);
export const insertLocalizationSettingsSchema = createInsertSchema(localizationSettings);
export const insertDocumentsSettingsSchema = createInsertSchema(documentsSettings);
export const insertThemesSettingsSchema = createInsertSchema(themesSettings);
export const insertBackupConfigurationSchema = createInsertSchema(backupConfigurations);
export const insertBackupJobSchema = createInsertSchema(backupJobs);
export const insertRestorePointSchema = createInsertSchema(restorePoints);
export const insertBackupAuditLogSchema = createInsertSchema(backupAuditLog);
export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings);

// === FATTURAZIONE ELETTRONICA ITALIANA ===

// Tipi documento per fatturazione elettronica
export const invoiceTypes = pgTable("invoice_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // TD01, TD02, TD03, etc.
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Codici IVA italiani
export const vatCodes = pgTable("vat_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // 22, 10, 4, 0, etc.
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  description: text("description").notNull(),
  natura: text("natura"), // N1, N2, N3, etc. per esenzioni/esclusioni
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Unità di misura
export const measureUnits = pgTable("measure_units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // PZ, KG, MT, etc.
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Condizioni di pagamento
export const paymentTerms = pgTable("payment_terms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // TP01, TP02, TP03
  name: text("name").notNull(),
  description: text("description"),
  days: integer("days").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Modalità di pagamento
export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // MP01, MP02, MP05, etc.
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Fatture elettroniche
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Numerazione progressiva
  number: text("number").notNull(),
  year: integer("year").notNull(),
  series: text("series").default(""),
  
  // Date
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date"),
  
  // Riferimenti
  companyId: varchar("company_id").notNull(), // Ragione sociale emittente
  customerId: varchar("customer_id"), // Cliente (se null = autofattura)
  supplierId: varchar("supplier_id"), // Fornitore (per fatture passive)
  
  // Tipologia documento
  invoiceTypeId: varchar("invoice_type_id").notNull(),
  direction: text("direction").notNull(), // 'outgoing', 'incoming'
  
  // Importi
  totalTaxableAmount: decimal("total_taxable_amount", { precision: 15, scale: 2 }).notNull().default("0.00"),
  totalTaxAmount: decimal("total_tax_amount", { precision: 15, scale: 2 }).notNull().default("0.00"),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull().default("0.00"),
  totalDiscount: decimal("total_discount", { precision: 15, scale: 2 }).notNull().default("0.00"),
  
  // Pagamento
  paymentTermsId: varchar("payment_terms_id"),
  paymentMethodId: varchar("payment_method_id"),
  
  // Riferimenti esterni
  orderReference: text("order_reference"),
  contractReference: text("contract_reference"),
  
  // Status FatturaPA
  xmlGenerated: boolean("xml_generated").notNull().default(false),
  xmlContent: text("xml_content"), // XML FatturaPA
  sdiStatus: text("sdi_status").default("draft"), // draft, sent, accepted, rejected, error
  sdiReference: text("sdi_reference"), // Identificativo SDI
  sdiMessage: text("sdi_message"), // Messaggi dal SDI
  sdiSentAt: timestamp("sdi_sent_at"),
  sdiAcceptedAt: timestamp("sdi_accepted_at"),
  
  // Note
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  
  // Stato
  status: text("status").notNull().default("draft"), // draft, issued, paid, cancelled
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Righe fattura
export const invoiceLines = pgTable("invoice_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull(),
  lineNumber: integer("line_number").notNull(),
  
  // Descrizione articolo/servizio
  description: text("description").notNull(),
  productCode: text("product_code"),
  
  // Quantità e unità
  quantity: decimal("quantity", { precision: 15, scale: 4 }).notNull().default("1.0000"),
  measureUnitId: varchar("measure_unit_id"),
  
  // Prezzi
  unitPrice: decimal("unit_price", { precision: 15, scale: 4 }).notNull().default("0.0000"),
  totalPrice: decimal("total_price", { precision: 15, scale: 2 }).notNull().default("0.00"),
  
  // Sconti
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).notNull().default("0.00"),
  discountAmount: decimal("discount_amount", { precision: 15, scale: 2 }).notNull().default("0.00"),
  
  // IVA
  vatCodeId: varchar("vat_code_id").notNull(),
  taxableAmount: decimal("taxable_amount", { precision: 15, scale: 2 }).notNull().default("0.00"),
  taxAmount: decimal("tax_amount", { precision: 15, scale: 2 }).notNull().default("0.00"),
  
  // Ritenute e altre imposte
  withholdingTaxPercentage: decimal("withholding_tax_percentage", { precision: 5, scale: 2 }).notNull().default("0.00"),
  withholdingTaxAmount: decimal("withholding_tax_amount", { precision: 15, scale: 2 }).notNull().default("0.00"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Riepiloghi IVA per fattura
export const invoiceTaxSummary = pgTable("invoice_tax_summary", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull(),
  vatCodeId: varchar("vat_code_id").notNull(),
  
  taxableAmount: decimal("taxable_amount", { precision: 15, scale: 2 }).notNull().default("0.00"),
  taxAmount: decimal("tax_amount", { precision: 15, scale: 2 }).notNull().default("0.00"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Serie numerazioni
export const invoiceNumberSeries = pgTable("invoice_number_series", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  series: text("series").notNull(),
  year: integer("year").notNull(),
  lastNumber: integer("last_number").notNull().default(0),
  format: text("format").notNull().default("{series}{year}/{number}"), // es: "FAT2024/001"
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relazioni per fatturazione
export const invoiceRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, {
    fields: [invoices.companyId],
    references: [companies.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  supplier: one(suppliers, {
    fields: [invoices.supplierId],
    references: [suppliers.id],
  }),
  invoiceType: one(invoiceTypes, {
    fields: [invoices.invoiceTypeId],
    references: [invoiceTypes.id],
  }),
  paymentTerms: one(paymentTerms, {
    fields: [invoices.paymentTermsId],
    references: [paymentTerms.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [invoices.paymentMethodId],
    references: [paymentMethods.id],
  }),
  lines: many(invoiceLines),
  taxSummary: many(invoiceTaxSummary),
}));

export const invoiceLineRelations = relations(invoiceLines, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLines.invoiceId],
    references: [invoices.id],
  }),
  measureUnit: one(measureUnits, {
    fields: [invoiceLines.measureUnitId],
    references: [measureUnits.id],
  }),
  vatCode: one(vatCodes, {
    fields: [invoiceLines.vatCodeId],
    references: [vatCodes.id],
  }),
}));

// Tipi per TypeScript
export type InvoiceType = typeof invoiceTypes.$inferSelect;
export type InsertInvoiceType = typeof invoiceTypes.$inferInsert;
export type VatCode = typeof vatCodes.$inferSelect;
export type InsertVatCode = typeof vatCodes.$inferInsert;
export type MeasureUnit = typeof measureUnits.$inferSelect;
export type InsertMeasureUnit = typeof measureUnits.$inferInsert;
export type PaymentTerms = typeof paymentTerms.$inferSelect;
export type InsertPaymentTerms = typeof paymentTerms.$inferInsert;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
export type InvoiceLine = typeof invoiceLines.$inferSelect;
export type InsertInvoiceLine = typeof invoiceLines.$inferInsert;
export type InvoiceTaxSummary = typeof invoiceTaxSummary.$inferSelect;
export type InsertInvoiceTaxSummary = typeof invoiceTaxSummary.$inferInsert;
export type InvoiceNumberSeries = typeof invoiceNumberSeries.$inferSelect;
export type InsertInvoiceNumberSeries = typeof invoiceNumberSeries.$inferInsert;

// Provider di fatturazione elettronica
export const invoiceProviders = pgTable("invoice_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Informazioni provider
  name: text("name").notNull(), // "Fatture in Cloud", "ACube"
  type: text("type").notNull(), // "fattureincloud", "acube"
  description: text("description"),
  
  // Configurazione API
  apiUrl: text("api_url").notNull(),
  apiVersion: text("api_version").default("v1"),
  
  // Stato e attivazione
  isActive: boolean("is_active").notNull().default(false),
  isPrimary: boolean("is_primary").notNull().default(false), // Provider principale
  
  // Configurazioni specifiche
  settings: jsonb("settings").default({}), // Configurazioni specifiche del provider
  
  // Rate limiting e monitoring
  requestsPerMinute: integer("requests_per_minute").default(60),
  maxRetries: integer("max_retries").default(3),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Configurazioni per ragione sociale e provider
export const companyProviderSettings = pgTable("company_provider_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Riferimenti
  companyId: varchar("company_id").notNull(),
  providerId: varchar("provider_id").notNull(),
  
  // Credenziali e configurazione
  apiKey: text("api_key"), // Encrypted
  apiSecret: text("api_secret"), // Encrypted
  clientId: text("client_id"),
  accessToken: text("access_token"), // OAuth token
  refreshToken: text("refresh_token"), // OAuth refresh
  tokenExpiresAt: timestamp("token_expires_at"),
  
  // Configurazioni specifiche per ragione sociale
  companyIdExternal: text("company_id_external"), // ID azienda nel provider esterno
  settings: jsonb("settings").default({}),
  
  // Sincronizzazione
  lastSync: timestamp("last_sync"),
  syncStatus: text("sync_status").default("pending"), // pending, synced, error
  syncErrors: jsonb("sync_errors").default([]),
  
  // Stato
  isActive: boolean("is_active").notNull().default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Log delle sincronizzazioni e operazioni
export const invoiceProviderLogs = pgTable("invoice_provider_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Riferimenti
  providerId: varchar("provider_id").notNull(),
  companyId: varchar("company_id"),
  invoiceId: varchar("invoice_id"),
  
  // Operazione
  operation: text("operation").notNull(), // "sync", "send", "status_check", etc.
  status: text("status").notNull(), // "success", "error", "pending"
  
  // Dati dell'operazione
  requestData: jsonb("request_data"),
  responseData: jsonb("response_data"),
  errorMessage: text("error_message"),
  
  // Timing
  duration: integer("duration"), // in milliseconds
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relazioni per i provider
export const invoiceProviderRelations = relations(invoiceProviders, ({ many }) => ({
  companySettings: many(companyProviderSettings),
  logs: many(invoiceProviderLogs),
}));

export const companyProviderSettingsRelations = relations(companyProviderSettings, ({ one }) => ({
  company: one(companies, {
    fields: [companyProviderSettings.companyId],
    references: [companies.id],
  }),
  provider: one(invoiceProviders, {
    fields: [companyProviderSettings.providerId],
    references: [invoiceProviders.id],
  }),
}));

// Tipi per TypeScript
export type InvoiceProvider = typeof invoiceProviders.$inferSelect;
export type InsertInvoiceProvider = typeof invoiceProviders.$inferInsert;
export type CompanyProviderSettings = typeof companyProviderSettings.$inferSelect;
export type InsertCompanyProviderSettings = typeof companyProviderSettings.$inferInsert;
export type InvoiceProviderLog = typeof invoiceProviderLogs.$inferSelect;
export type InsertInvoiceProviderLog = typeof invoiceProviderLogs.$inferInsert;

// Schemi di validazione Zod
export const insertInvoiceTypeSchema = createInsertSchema(invoiceTypes);
export const insertVatCodeSchema = createInsertSchema(vatCodes);
export const insertMeasureUnitSchema = createInsertSchema(measureUnits);
export const insertPaymentTermsSchema = createInsertSchema(paymentTerms);
export const insertPaymentMethodSchema = createInsertSchema(paymentMethods);
export const insertInvoiceSchema = createInsertSchema(invoices);
export const insertInvoiceLineSchema = createInsertSchema(invoiceLines);
export const insertInvoiceTaxSummarySchema = createInsertSchema(invoiceTaxSummary);
export const insertInvoiceNumberSeriesSchema = createInsertSchema(invoiceNumberSeries);
export const insertInvoiceProviderSchema = createInsertSchema(invoiceProviders);
export const insertCompanyProviderSettingsSchema = createInsertSchema(companyProviderSettings);

// Re-export all specialized schemas
export * from "./user-schema";
export * from "./security-schema";
export * from "./backup-schema";
export * from "./sms-schema";
export * from "./whatsapp-schema";

