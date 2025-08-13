import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, date } from "drizzle-orm/pg-core";
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
});

// Risorse (Employees/Resources)
export const resources = pgTable("resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  taxCode: text("tax_code").notNull(),
  email: text("email"),
  address: text("address"),
  zipCode: text("zip_code"),
  city: text("city"),
  country: text("country").notNull().default('Italia'),
  companyId: varchar("company_id").notNull(),
  officeIds: text("office_ids").array(), // Array di ID delle sedi operative
  role: text("role").notNull().default('user'), // 'admin', 'finance', 'user'
  avatar: text("avatar"), // Percorso dell'immagine avatar
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true), // attivo = usabile per input, inattivo = solo ricerche
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// IBAN accounts
export const ibans = pgTable("ibans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  iban: text("iban").notNull(),
  bankName: text("bank_name").notNull(),
  description: text("description"),
  companyId: varchar("company_id").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true), // attivo = usabile per input, inattivo = solo ricerche
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
  phone: text("phone"),
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
  phone: text("phone"),
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
  movementId: varchar("movement_id").notNull(), // Movimento a cui si riferisce
  type: text("type").notNull(), // 'new_movement', 'movement_updated', 'movement_assigned'
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
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
  
  // Campi per integrazione XML fatture
  xmlData: text("xml_data"), // Dati XML della fattura originale (se presente)
  invoiceNumber: text("invoice_number"), // Numero fattura estratto dall'XML
  vatAmount: decimal("vat_amount", { precision: 12, scale: 2 }), // Importo IVA estratto dall'XML
  vatType: text("vat_type", { enum: ["iva_22", "iva_10", "iva_4", "iva_art_74", "esente"] }), // Tipo di IVA applicata
  netAmount: decimal("net_amount", { precision: 12, scale: 2 }), // Importo netto estratto dall'XML
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

export const movementsRelations = relations(movements, ({ one }) => ({
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
  firstName: z.string(),
  lastName: z.string(), 
  taxCode: z.string(),
  companyId: z.string(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'finance', 'user']).default('user'),
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
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Nome richiesto"),
  vatNumber: z.string().min(11, "Partita IVA deve avere almeno 11 caratteri"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
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
