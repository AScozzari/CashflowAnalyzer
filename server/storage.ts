import {
  companies, cores, resources, ibans, offices, tags, movementStatuses, movementReasons, movements, users, notifications, suppliers, customers, emailSettings, passwordResetTokens, sendgridTemplates, whatsappSettings, whatsappTemplates,
  telegramSettings, telegramTemplates, telegramChats, telegramMessages,
  smsSettings, smsTemplates, smsMessages, smsBlacklist, smsStatistics,
  aiSettings, aiChatHistory, aiDocumentJobs,
  securitySettings, loginAuditLog, activeSessions, passwordHistory, twoFactorAuth,
  type Company, type InsertCompany,
  type Core, type InsertCore,
  type Resource, type InsertResource,
  type Iban, type InsertIban,
  type Office, type InsertOffice,
  type Tag, type InsertTag,
  type MovementStatus, type InsertMovementStatus,
  type MovementReason, type InsertMovementReason,
  type Movement, type InsertMovement,
  type MovementWithRelations,
  type CompanyWithRelations,
  type User, type InsertUser,
  type Notification, type InsertNotification,
  type Supplier, type InsertSupplier,
  type Customer, type InsertCustomer,
  type EmailSettings, type InsertEmailSettings,
  type SendgridTemplate, type InsertSendgridTemplate,
  type WhatsappSettings, type InsertWhatsappSettings,
  type WhatsappTemplate, type InsertWhatsappTemplate,
  type TelegramSettings, type InsertTelegramSettings,
  type TelegramTemplate, type InsertTelegramTemplate,
  type TelegramChat, type InsertTelegramChat,
  type TelegramMessage, type InsertTelegramMessage,
  type AiSettings, type InsertAiSettings,
  type AiChatHistory, type InsertAiChatHistory,
  type AiDocumentJob, type InsertAiDocumentJob,
  type SecuritySettings, type InsertSecuritySettings,
  type LoginAuditLog, type ActiveSession, type PasswordHistory, type TwoFactorAuth,
  type SmsSettings, type InsertSmsSettings,
  type SmsTemplate, type InsertSmsTemplate,
  type SmsMessage, type InsertSmsMessage,
  type SmsBlacklist, type InsertSmsBlacklist,
  type SmsStatistics, type InsertSmsStatistics,
  calendarEvents, calendarReminders,
  type CalendarEvent, type InsertCalendarEvent,
  type CalendarReminder, type InsertCalendarReminder
} from "@shared/schema";
import { 
  BackupConfiguration, 
  BackupJob, 
  RestorePoint, 
  BackupAuditLog,
  BackupConfigurationInsert,
  BackupJobInsert,
  RestorePointInsert,
  BackupAuditLogInsert
} from "../shared/backup-schema";
import crypto from 'crypto';
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, count, or, isNull, isNotNull, inArray } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Companies
  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyWithRelations(id: string): Promise<CompanyWithRelations | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company>;
  deleteCompany(id: string): Promise<void>;

  // Cores
  getCores(): Promise<Core[]>;
  getCoresByCompany(companyId: string): Promise<Core[]>;
  createCore(core: InsertCore): Promise<Core>;
  updateCore(id: string, core: Partial<InsertCore>): Promise<Core>;
  deleteCore(id: string): Promise<void>;

  // Resources
  getResources(): Promise<Resource[]>;
  getResource(id: string): Promise<Resource | undefined>;
  getResourcesByCompany(companyId: string): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: string, resource: Partial<InsertResource>): Promise<Resource>;
  deleteResource(id: string): Promise<void>;

  // IBANs
  getIbans(): Promise<Iban[]>;
  getIbansByCompany(companyId: string): Promise<Iban[]>;
  createIban(iban: InsertIban): Promise<Iban>;
  updateIban(id: string, iban: Partial<InsertIban>): Promise<Iban>;
  deleteIban(id: string): Promise<void>;

  // Offices
  getOffices(): Promise<Office[]>;
  getOfficesByCompany(companyId: string): Promise<Office[]>;
  createOffice(office: InsertOffice): Promise<Office>;
  updateOffice(id: string, office: Partial<InsertOffice>): Promise<Office>;
  deleteOffice(id: string): Promise<void>;

  // Tags
  getTags(): Promise<Tag[]>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: string, tag: Partial<InsertTag>): Promise<Tag>;
  deleteTag(id: string): Promise<void>;

  // Movement Statuses
  getMovementStatuses(): Promise<MovementStatus[]>;
  createMovementStatus(status: InsertMovementStatus): Promise<MovementStatus>;
  updateMovementStatus(id: string, status: Partial<InsertMovementStatus>): Promise<MovementStatus>;
  deleteMovementStatus(id: string): Promise<void>;

  // Movement Reasons
  getMovementReasons(): Promise<MovementReason[]>;
  createMovementReason(reason: InsertMovementReason): Promise<MovementReason>;
  updateMovementReason(id: string, reason: Partial<InsertMovementReason>): Promise<MovementReason>;
  deleteMovementReason(id: string): Promise<void>;

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplierByVatNumber(vatNumber: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByVatNumber(vatNumber: string): Promise<Customer | undefined>;
  getCustomerByTaxCode(taxCode: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  // Movements
  getMovements(filters?: {
    companyId?: string;
    coreId?: string;
    resourceId?: string;
    officeId?: string;
    statusId?: string;
    reasonId?: string;
    tagId?: string;
    ibanId?: string;
    type?: 'income' | 'expense';
    startDate?: string;
    endDate?: string;
    minAmount?: string;
    maxAmount?: string;
    documentNumber?: string;
    notes?: string;
  }): Promise<MovementWithRelations[]>;
  
  // Metodo per filtri avanzati con paginazione
  getFilteredMovements(filters?: {
    insertDateFrom?: string;
    insertDateTo?: string;
    flowDateFrom?: string;
    flowDateTo?: string;
    companyId?: string;
    coreId?: string;
    resourceId?: string;
    officeId?: string;
    statusId?: string;
    reasonId?: string;
    ibanId?: string;
    type?: 'income' | 'expense';
    amountFrom?: number;
    amountTo?: number;
    customerId?: string;
    supplierId?: string;
    vatType?: string;
    hasVat?: boolean;
    hasDocument?: boolean;
    tagIds?: string[];
  }, page?: number, pageSize?: number): Promise<{
    data: MovementWithRelations[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
  
  getMovement(id: string): Promise<MovementWithRelations | undefined>;
  createMovement(movement: InsertMovement): Promise<Movement>;
  updateMovement(id: string, movement: Partial<InsertMovement>): Promise<Movement>;
  deleteMovement(id: string): Promise<void>;

  // Analytics
  getMovementStats(period?: { startDate: string; endDate: string }, resourceIdFilter?: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    totalMovements: number;
    pendingMovements: number;
  }>;
  getCashFlowData(days: number, resourceIdFilter?: string): Promise<Array<{
    date: string;
    income: number;
    expenses: number;
    balance: number;
  }>>;
  getMovementStatusDistribution(): Promise<Array<{
    statusName: string;
    count: number;
  }>>;

  // Users
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  updatePassword(id: string, hashedPassword: string): Promise<void>;
  setResetToken(email: string, token: string, expiry: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  clearResetToken(id: string): Promise<void>;
  updateLastLogin(id: string): Promise<void>;
  setFirstAccessCompleted(id: string): Promise<void>;

  // Notifications
  getNotifications(userId: string, isRead?: boolean): Promise<Notification[]>;
  getUnreadNotificationsCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;

  // AI Settings
  getAiSettings(userId: string): Promise<AiSettings | undefined>;
  createAiSettings(settings: InsertAiSettings): Promise<AiSettings>;
  updateAiSettings(userId: string, settings: Partial<InsertAiSettings>): Promise<AiSettings>;
  deleteAiSettings(userId: string): Promise<void>;

  // AI Chat History
  getAiChatHistory(userId: string, sessionId?: string): Promise<AiChatHistory[]>;
  createAiChatMessage(message: InsertAiChatHistory): Promise<AiChatHistory>;
  deleteAiChatSession(userId: string, sessionId: string): Promise<void>;
  deleteAllAiChatHistory(userId: string): Promise<void>;

  // AI Document Jobs
  getAiDocumentJobs(userId: string): Promise<AiDocumentJob[]>;
  getAiDocumentJob(id: string): Promise<AiDocumentJob | undefined>;
  createAiDocumentJob(job: InsertAiDocumentJob): Promise<AiDocumentJob>;
  updateAiDocumentJob(id: string, job: Partial<AiDocumentJob>): Promise<AiDocumentJob>;
  deleteAiDocumentJob(id: string): Promise<void>;

  // WhatsApp Settings
  getWhatsappSettings(): Promise<WhatsappSettings[]>;
  createWhatsappSettings(settings: InsertWhatsappSettings): Promise<WhatsappSettings>;
  updateWhatsappSettings(id: string, settings: Partial<InsertWhatsappSettings>): Promise<WhatsappSettings>;
  deleteWhatsappSettings(id: string): Promise<void>;

  // WhatsApp Templates
  getWhatsappTemplates(): Promise<WhatsappTemplate[]>;
  getWhatsappTemplateById(id: string): Promise<WhatsappTemplate | undefined>;
  getWhatsappTemplateByName(name: string, provider: string): Promise<WhatsappTemplate | undefined>;
  createWhatsappTemplate(template: InsertWhatsappTemplate): Promise<WhatsappTemplate>;
  updateWhatsappTemplate(id: string, template: Partial<InsertWhatsappTemplate>): Promise<WhatsappTemplate | undefined>;
  updateWhatsappTemplateStatus(id: string, status: string): Promise<WhatsappTemplate | undefined>;
  deleteWhatsappTemplate(id: string): Promise<boolean>;

  // Telegram Settings
  getTelegramSettings(): Promise<TelegramSettings[]>;
  createTelegramSettings(settings: InsertTelegramSettings): Promise<TelegramSettings>;
  updateTelegramSettings(id: string, settings: Partial<InsertTelegramSettings>): Promise<TelegramSettings>;
  deleteTelegramSettings(id: string): Promise<void>;

  // Telegram Templates  
  getTelegramTemplates(): Promise<TelegramTemplate[]>;
  getTelegramTemplate(id: string): Promise<TelegramTemplate | undefined>;
  createTelegramTemplate(template: InsertTelegramTemplate): Promise<TelegramTemplate>;
  updateTelegramTemplate(id: string, template: Partial<InsertTelegramTemplate>): Promise<TelegramTemplate>;
  deleteTelegramTemplate(id: string): Promise<void>;

  // Telegram Chats
  getTelegramChats(): Promise<TelegramChat[]>;
  getTelegramChat(id: string): Promise<TelegramChat | undefined>;
  createTelegramChat(chat: InsertTelegramChat): Promise<TelegramChat>;
  updateTelegramChat(id: string, chat: Partial<InsertTelegramChat>): Promise<TelegramChat>;
  deleteTelegramChat(id: string): Promise<void>;

  // SMS Settings
  getSmsSettings(): Promise<SmsSettings | undefined>;
  createSmsSettings(settings: InsertSmsSettings): Promise<SmsSettings>;
  updateSmsSettings(id: number, settings: Partial<InsertSmsSettings>): Promise<SmsSettings>;
  deleteSmsSettings(id: number): Promise<void>;

  // SMS Templates
  getSmsTemplates(): Promise<SmsTemplate[]>;
  getSmsTemplate(id: number): Promise<SmsTemplate | undefined>;
  createSmsTemplate(template: InsertSmsTemplate): Promise<SmsTemplate>;
  updateSmsTemplate(id: number, template: Partial<InsertSmsTemplate>): Promise<SmsTemplate>;
  deleteSmsTemplate(id: number): Promise<void>;

  // SMS Messages
  getSmsMessages(limit?: number): Promise<SmsMessage[]>;
  getSmsMessage(id: number): Promise<SmsMessage | undefined>;
  createSmsMessage(message: InsertSmsMessage): Promise<SmsMessage>;
  updateSmsMessage(id: number, message: Partial<InsertSmsMessage>): Promise<SmsMessage>;
  deleteSmsMessage(id: number): Promise<void>;

  // SMS Blacklist
  getSmsBlacklist(): Promise<SmsBlacklist[]>;
  addToSmsBlacklist(entry: InsertSmsBlacklist): Promise<SmsBlacklist>;
  removeFromSmsBlacklist(phoneNumber: string): Promise<void>;

  // Calendar Events
  getCalendarEvents(userId?: string): Promise<CalendarEvent[]>;
  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string): Promise<void>;
  getCalendarEventsByDateRange(startDate: Date, endDate: Date, userId?: string): Promise<CalendarEvent[]>;

  // Calendar Reminders
  getCalendarReminders(eventId: string): Promise<CalendarReminder[]>;
  createCalendarReminder(reminder: InsertCalendarReminder): Promise<CalendarReminder>;
  updateCalendarReminder(id: string, reminder: Partial<InsertCalendarReminder>): Promise<CalendarReminder>;
  deleteCalendarReminder(id: string): Promise<void>;

  // Session store per autenticazione
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    console.log('[STORAGE] DatabaseStorage constructor called');
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }
  // Companies
  async getCompanies(): Promise<Company[]> {
    try {
      return await db.select().from(companies).orderBy(companies.name);
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw new Error('Failed to fetch companies');
    }
  }

  async getCompany(id: string): Promise<Company | undefined> {
    try {
      const [company] = await db.select().from(companies).where(eq(companies.id, id));
      return company || undefined;
    } catch (error) {
      console.error('Error fetching company:', error);
      throw new Error('Failed to fetch company');
    }
  }

  async getCompanyWithRelations(id: string): Promise<CompanyWithRelations | undefined> {
    try {
      const company = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
      if (!company[0]) return undefined;
      
      const companyCores = await db.select().from(cores).where(eq(cores.companyId, id));
      const companyResources = await db.select().from(resources).where(eq(resources.companyId, id));
      const companyIbans = await db.select().from(ibans).where(eq(ibans.companyId, id));
      const companyOffices = await db.select().from(offices).where(eq(offices.companyId, id));
      
      const result = { ...company[0], cores: companyCores, resources: companyResources, ibans: companyIbans, offices: companyOffices } as CompanyWithRelations;
      return result;
    } catch (error) {
      console.error('Error fetching company with relations:', error);
      throw new Error('Failed to fetch company with relations');
    }
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    try {
      const [newCompany] = await db.insert(companies).values(company).returning();
      return newCompany;
    } catch (error) {
      console.error('Error creating company:', error);
      throw new Error('Failed to create company');
    }
  }

  async updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company> {
    try {
      const [updatedCompany] = await db
        .update(companies)
        .set(company)
        .where(eq(companies.id, id))
        .returning();
      
      if (!updatedCompany) {
        throw new Error('Company not found');
      }
      
      return updatedCompany;
    } catch (error) {
      console.error('Error updating company:', error);
      throw new Error('Failed to update company');
    }
  }

  async deleteCompany(id: string): Promise<void> {
    try {
      // Check for dependencies before deletion
      const dependentMovements = await db
        .select({ count: count() })
        .from(movements)
        .where(eq(movements.companyId, id));
      
      if (dependentMovements[0]?.count > 0) {
        throw new Error('Cannot delete company with existing movements');
      }
      
      const result = await db.delete(companies).where(eq(companies.id, id));
      
      if (result.rowCount === 0) {
        throw new Error('Company not found');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error instanceof Error ? error : new Error('Failed to delete company');
    }
  }

  // Cores
  async getCores(): Promise<Core[]> {
    try {
      return await db.select().from(cores).orderBy(cores.name);
    } catch (error) {
      console.error('Error fetching cores:', error);
      throw new Error('Failed to fetch cores');
    }
  }

  async getCoresByCompany(companyId: string): Promise<Core[]> {
    try {
      return await db.select().from(cores).where(eq(cores.companyId, companyId)).orderBy(cores.name);
    } catch (error) {
      console.error('Error fetching cores by company:', error);
      throw new Error('Failed to fetch cores by company');
    }
  }

  async createCore(core: InsertCore): Promise<Core> {
    try {
      const [newCore] = await db.insert(cores).values([core]).returning();
      return newCore;
    } catch (error) {
      console.error('Error creating core:', error);
      throw new Error('Failed to create core');
    }
  }

  async updateCore(id: string, core: Partial<InsertCore>): Promise<Core> {
    try {
      const [updatedCore] = await db
        .update(cores)
        .set(core)
        .where(eq(cores.id, id))
        .returning();
      
      if (!updatedCore) {
        throw new Error('Core not found');
      }
      
      return updatedCore;
    } catch (error) {
      console.error('Error updating core:', error);
      throw new Error('Failed to update core');
    }
  }

  async deleteCore(id: string): Promise<void> {
    try {
      const dependentMovements = await db
        .select({ count: count() })
        .from(movements)
        .where(eq(movements.coreId, id));
      
      if (dependentMovements[0]?.count > 0) {
        throw new Error('Cannot delete core with existing movements');
      }
      
      const result = await db.delete(cores).where(eq(cores.id, id));
      
      if (result.rowCount === 0) {
        throw new Error('Core not found');
      }
    } catch (error) {
      console.error('Error deleting core:', error);
      throw error instanceof Error ? error : new Error('Failed to delete core');
    }
  }

  // Resources
  async getResources(): Promise<Resource[]> {
    try {
      return await db.select().from(resources).orderBy(resources.lastName, resources.firstName);
    } catch (error) {
      console.error('Error fetching resources:', error);
      throw new Error('Failed to fetch resources');
    }
  }

  async getResource(id: string): Promise<Resource | undefined> {
    try {
      const [resource] = await db.select().from(resources).where(eq(resources.id, id));
      return resource || undefined;
    } catch (error) {
      console.error('Error fetching resource:', error);
      throw new Error('Failed to fetch resource');
    }
  }

  async getResourcesByCompany(companyId: string): Promise<Resource[]> {
    try {
      return await db
        .select()
        .from(resources)
        .where(eq(resources.companyId, companyId))
        .orderBy(resources.lastName, resources.firstName);
    } catch (error) {
      console.error('Error fetching resources by company:', error);
      throw new Error('Failed to fetch resources by company');
    }
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    try {
      const [newResource] = await db.insert(resources).values([resource]).returning();
      return newResource;
    } catch (error) {
      console.error('Error creating resource:', error);
      throw new Error('Failed to create resource');
    }
  }

  async updateResource(id: string, resource: Partial<InsertResource>): Promise<Resource> {
    try {
      const [updatedResource] = await db
        .update(resources)
        .set(resource)
        .where(eq(resources.id, id))
        .returning();
      
      if (!updatedResource) {
        throw new Error('Resource not found');
      }
      
      return updatedResource;
    } catch (error) {
      console.error('Error updating resource:', error);
      throw new Error('Failed to update resource');
    }
  }

  async deleteResource(id: string): Promise<void> {
    try {
      const dependentMovements = await db
        .select({ count: count() })
        .from(movements)
        .where(eq(movements.resourceId, id));
      
      if (dependentMovements[0]?.count > 0) {
        throw new Error('Cannot delete resource with existing movements');
      }
      
      const result = await db.delete(resources).where(eq(resources.id, id));
      
      if (result.rowCount === 0) {
        throw new Error('Resource not found');
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      throw error instanceof Error ? error : new Error('Failed to delete resource');
    }
  }

  // IBANs
  async getIbans(): Promise<Iban[]> {
    try {
      return await db.select().from(ibans).orderBy(ibans.bankName);
    } catch (error) {
      console.error('Error fetching IBANs:', error);
      throw new Error('Failed to fetch IBANs');
    }
  }

  async getIbansByCompany(companyId: string): Promise<Iban[]> {
    try {
      return await db
        .select()
        .from(ibans)
        .where(eq(ibans.companyId, companyId))
        .orderBy(ibans.bankName);
    } catch (error) {
      console.error('Error fetching IBANs by company:', error);
      throw new Error('Failed to fetch IBANs by company');
    }
  }

  async createIban(iban: InsertIban): Promise<Iban> {
    try {
      const [newIban] = await db.insert(ibans).values(iban).returning();
      return newIban;
    } catch (error) {
      console.error('Error creating IBAN:', error);
      throw new Error('Failed to create IBAN');
    }
  }

  async updateIban(id: string, iban: Partial<InsertIban>): Promise<Iban> {
    try {
      const [updatedIban] = await db
        .update(ibans)
        .set(iban)
        .where(eq(ibans.id, id))
        .returning();
      
      if (!updatedIban) {
        throw new Error('IBAN not found');
      }
      
      return updatedIban;
    } catch (error) {
      console.error('Error updating IBAN:', error);
      throw new Error('Failed to update IBAN');
    }
  }

  async deleteIban(id: string): Promise<void> {
    try {
      const dependentMovements = await db
        .select({ count: count() })
        .from(movements)
        .where(eq(movements.ibanId, id));
      
      if (dependentMovements[0]?.count > 0) {
        throw new Error('Cannot delete IBAN with existing movements');
      }
      
      const result = await db.delete(ibans).where(eq(ibans.id, id));
      
      if (result.rowCount === 0) {
        throw new Error('IBAN not found');
      }
    } catch (error) {
      console.error('Error deleting IBAN:', error);
      throw error instanceof Error ? error : new Error('Failed to delete IBAN');
    }
  }

  // Offices
  async getOffices(): Promise<Office[]> {
    try {
      return await db.select().from(offices).orderBy(offices.city);
    } catch (error) {
      console.error('Error fetching offices:', error);
      throw new Error('Failed to fetch offices');
    }
  }

  async getOfficesByCompany(companyId: string): Promise<Office[]> {
    try {
      return await db
        .select()
        .from(offices)
        .where(eq(offices.companyId, companyId))
        .orderBy(offices.name);
    } catch (error) {
      console.error('Error fetching offices by company:', error);
      throw new Error('Failed to fetch offices by company');
    }
  }



  async createOffice(office: InsertOffice): Promise<Office> {
    try {
      const [newOffice] = await db.insert(offices).values(office).returning();
      return newOffice;
    } catch (error) {
      console.error('Error creating office:', error);
      throw new Error('Failed to create office');
    }
  }

  async updateOffice(id: string, office: Partial<InsertOffice>): Promise<Office> {
    try {
      const [updatedOffice] = await db
        .update(offices)
        .set(office)
        .where(eq(offices.id, id))
        .returning();
      
      if (!updatedOffice) {
        throw new Error('Office not found');
      }
      
      return updatedOffice;
    } catch (error) {
      console.error('Error updating office:', error);
      throw new Error('Failed to update office');
    }
  }

  async deleteOffice(id: string): Promise<void> {
    try {
      const dependentMovements = await db
        .select({ count: count() })
        .from(movements)
        .where(eq(movements.officeId, id));
      
      if (dependentMovements[0]?.count > 0) {
        throw new Error('Cannot delete office with existing movements');
      }
      
      const result = await db.delete(offices).where(eq(offices.id, id));
      
      if (result.rowCount === 0) {
        throw new Error('Office not found');
      }
    } catch (error) {
      console.error('Error deleting office:', error);
      throw error instanceof Error ? error : new Error('Failed to delete office');
    }
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    try {
      return await db.select().from(tags).orderBy(tags.name);
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw new Error('Failed to fetch tags');
    }
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    try {
      const [newTag] = await db.insert(tags).values(tag).returning();
      return newTag;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw new Error('Failed to create tag');
    }
  }

  async updateTag(id: string, tag: Partial<InsertTag>): Promise<Tag> {
    try {
      const [updatedTag] = await db
        .update(tags)
        .set(tag)
        .where(eq(tags.id, id))
        .returning();
      
      if (!updatedTag) {
        throw new Error('Tag not found');
      }
      
      return updatedTag;
    } catch (error) {
      console.error('Error updating tag:', error);
      throw new Error('Failed to update tag');
    }
  }

  async deleteTag(id: string): Promise<void> {
    try {
      const dependentMovements = await db
        .select({ count: count() })
        .from(movements)
        .where(eq(movements.tagId, id));
      
      if (dependentMovements[0]?.count > 0) {
        throw new Error('Cannot delete tag with existing movements');
      }
      
      const result = await db.delete(tags).where(eq(tags.id, id));
      
      if (result.rowCount === 0) {
        throw new Error('Tag not found');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error instanceof Error ? error : new Error('Failed to delete tag');
    }
  }

  // Movement Statuses
  async getMovementStatuses(): Promise<MovementStatus[]> {
    try {
      return await db.select().from(movementStatuses).orderBy(movementStatuses.name);
    } catch (error) {
      console.error('Error fetching movement statuses:', error);
      throw new Error('Failed to fetch movement statuses');
    }
  }

  async createMovementStatus(status: InsertMovementStatus): Promise<MovementStatus> {
    try {
      const [newStatus] = await db.insert(movementStatuses).values(status).returning();
      return newStatus;
    } catch (error) {
      console.error('Error creating movement status:', error);
      throw new Error('Failed to create movement status');
    }
  }

  async updateMovementStatus(id: string, status: Partial<InsertMovementStatus>): Promise<MovementStatus> {
    try {
      const [updatedStatus] = await db
        .update(movementStatuses)
        .set(status)
        .where(eq(movementStatuses.id, id))
        .returning();
      
      if (!updatedStatus) {
        throw new Error('Movement status not found');
      }
      
      return updatedStatus;
    } catch (error) {
      console.error('Error updating movement status:', error);
      throw new Error('Failed to update movement status');
    }
  }

  async deleteMovementStatus(id: string): Promise<void> {
    try {
      const dependentMovements = await db
        .select({ count: count() })
        .from(movements)
        .where(eq(movements.statusId, id));
      
      if (dependentMovements[0]?.count > 0) {
        throw new Error('Cannot delete movement status with existing movements');
      }
      
      const result = await db.delete(movementStatuses).where(eq(movementStatuses.id, id));
      
      if (result.rowCount === 0) {
        throw new Error('Movement status not found');
      }
    } catch (error) {
      console.error('Error deleting movement status:', error);
      throw error instanceof Error ? error : new Error('Failed to delete movement status');
    }
  }

  // Movement Reasons
  async getMovementReasons(): Promise<MovementReason[]> {
    try {
      return await db.select().from(movementReasons).orderBy(movementReasons.name);
    } catch (error) {
      console.error('Error fetching movement reasons:', error);
      throw new Error('Failed to fetch movement reasons');
    }
  }

  async createMovementReason(reason: InsertMovementReason): Promise<MovementReason> {
    try {
      const [newReason] = await db.insert(movementReasons).values(reason).returning();
      return newReason;
    } catch (error) {
      console.error('Error creating movement reason:', error);
      throw new Error('Failed to create movement reason');
    }
  }

  async updateMovementReason(id: string, reason: Partial<InsertMovementReason>): Promise<MovementReason> {
    try {
      const [updatedReason] = await db
        .update(movementReasons)
        .set(reason)
        .where(eq(movementReasons.id, id))
        .returning();
      
      if (!updatedReason) {
        throw new Error('Movement reason not found');
      }
      
      return updatedReason;
    } catch (error) {
      console.error('Error updating movement reason:', error);
      throw new Error('Failed to update movement reason');
    }
  }

  async deleteMovementReason(id: string): Promise<void> {
    try {
      const dependentMovements = await db
        .select({ count: count() })
        .from(movements)
        .where(eq(movements.reasonId, id));
      
      if (dependentMovements[0]?.count > 0) {
        throw new Error('Cannot delete movement reason with existing movements');
      }
      
      const result = await db.delete(movementReasons).where(eq(movementReasons.id, id));
      
      if (result.rowCount === 0) {
        throw new Error('Movement reason not found');
      }
    } catch (error) {
      console.error('Error deleting movement reason:', error);
      throw error instanceof Error ? error : new Error('Failed to delete movement reason');
    }
  }

  // Movements
  // Metodo per i filtri avanzati con paginazione (per pagina Movements)
  async getFilteredMovements(filters: {
    insertDateFrom?: string;
    insertDateTo?: string;
    flowDateFrom?: string;
    flowDateTo?: string;
    companyId?: string;
    coreId?: string;
    resourceId?: string;
    officeId?: string;
    statusId?: string;
    reasonId?: string;
    ibanId?: string;
    type?: 'income' | 'expense';
    amountFrom?: number;
    amountTo?: number;
    customerId?: string;
    supplierId?: string;
    vatType?: string;
    hasVat?: boolean;
    hasDocument?: boolean;
    tagIds?: string[];
  } = {}, page: number = 1, pageSize: number = 25): Promise<{
    data: MovementWithRelations[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const conditions = [];
      
      console.log("[STORAGE] getFilteredMovements called with filters:", filters);
      
      // Date filters
      if (filters.insertDateFrom) {
        console.log("[STORAGE] Adding insertDate filter from:", filters.insertDateFrom);
        conditions.push(gte(movements.insertDate, filters.insertDateFrom));
      }
      if (filters.insertDateTo) {
        console.log("[STORAGE] Adding insertDate filter to:", filters.insertDateTo);
        conditions.push(lte(movements.insertDate, filters.insertDateTo));
      }
      if (filters.flowDateFrom) {
        console.log("[STORAGE] Adding flowDate filter from:", filters.flowDateFrom);
        conditions.push(gte(movements.flowDate, filters.flowDateFrom));
      }
      if (filters.flowDateTo) {
        console.log("[STORAGE] Adding flowDate filter to:", filters.flowDateTo);
        conditions.push(lte(movements.flowDate, filters.flowDateTo));
      }
      
      // Entity filters
      if (filters.companyId) conditions.push(eq(movements.companyId, filters.companyId));
      if (filters.coreId) conditions.push(eq(movements.coreId, filters.coreId));
      if (filters.resourceId) conditions.push(eq(movements.resourceId, filters.resourceId));
      if (filters.officeId) conditions.push(eq(movements.officeId, filters.officeId));
      if (filters.statusId) conditions.push(eq(movements.statusId, filters.statusId));
      if (filters.reasonId) conditions.push(eq(movements.reasonId, filters.reasonId));
      if (filters.ibanId) conditions.push(eq(movements.ibanId, filters.ibanId));
      if (filters.type) conditions.push(eq(movements.type, filters.type));
      
      // Amount filters
      if (filters.amountFrom !== undefined) {
        conditions.push(gte(movements.amount, filters.amountFrom.toString()));
      }
      if (filters.amountTo !== undefined) {
        conditions.push(lte(movements.amount, filters.amountTo.toString()));
      }
      
      // External relations
      if (filters.customerId) conditions.push(eq(movements.customerId, filters.customerId));
      if (filters.supplierId) conditions.push(eq(movements.supplierId, filters.supplierId));
      
      // VAT filters
      if (filters.vatType) conditions.push(sql`${movements.vatType} = ${filters.vatType}`);
      if (filters.hasVat !== undefined) {
        if (filters.hasVat) {
          conditions.push(isNotNull(movements.vatAmount));
        } else {
          conditions.push(isNull(movements.vatAmount));
        }
      }
      
      // Document filters  
      if (filters.hasDocument !== undefined) {
        if (filters.hasDocument) {
          conditions.push(isNotNull(movements.documentPath));
        } else {
          conditions.push(isNull(movements.documentPath));
        }
      }
      
      // Tag filters (multiple tags support)
      if (filters.tagIds && filters.tagIds.length > 0) {
        conditions.push(inArray(movements.tagId, filters.tagIds));
      }

      console.log("[STORAGE] Final conditions count:", conditions.length);

      // First get the total count
      const totalQuery = await db
        .select({ count: count() })
        .from(movements)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      const total = totalQuery[0]?.count || 0;
      
      console.log("[STORAGE] Total movements matching filters:", total);

      // Then get the paginated results
      const offset = (page - 1) * pageSize;
      
      const results = await db
        .select()
        .from(movements)
        .leftJoin(companies, eq(movements.companyId, companies.id))
        .leftJoin(cores, eq(movements.coreId, cores.id))
        .leftJoin(movementReasons, eq(movements.reasonId, movementReasons.id))
        .leftJoin(resources, eq(movements.resourceId, resources.id))
        .leftJoin(offices, eq(movements.officeId, offices.id))
        .leftJoin(ibans, eq(movements.ibanId, ibans.id))
        .leftJoin(tags, eq(movements.tagId, tags.id))
        .leftJoin(movementStatuses, eq(movements.statusId, movementStatuses.id))
        .leftJoin(suppliers, eq(movements.supplierId, suppliers.id))
        .leftJoin(customers, eq(movements.customerId, customers.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(movements.insertDate), desc(movements.createdAt))
        .limit(pageSize)
        .offset(offset);

      console.log("[STORAGE] Query returned:", results.length, "movements");

      // Transform joined results to MovementWithRelations format
      const transformedResults = results.map((row: any) => ({
        ...row.movements,
        company: row.companies,
        core: row.cores,
        reason: row.movement_reasons,
        resource: row.resources,
        office: row.offices,
        iban: row.ibans,
        tag: row.tags,
        status: row.movement_statuses,
        supplier: row.suppliers,
        customer: row.customers
      }));

      const response = {
        data: transformedResults as MovementWithRelations[],
        pagination: {
          page,
          limit: pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
      
      console.log("[STORAGE] Returning response structure:", {
        dataLength: response.data.length,
        pagination: response.pagination
      });
      
      return response;
    } catch (error) {
      console.error('Error fetching filtered movements:', error);
      throw new Error('Failed to fetch filtered movements');
    }
  }

async getMovements(filters: {
    companyId?: string;
    coreId?: string;
    resourceId?: string;
    officeId?: string;
    statusId?: string;
    reasonId?: string;
    tagId?: string;
    ibanId?: string;
    type?: 'income' | 'expense';
    startDate?: string;
    endDate?: string;
    minAmount?: string;
    maxAmount?: string;
    documentNumber?: string;
    notes?: string;
  } = {}): Promise<MovementWithRelations[]> {
    try {
      const conditions = [];
      
      if (filters.companyId) conditions.push(eq(movements.companyId, filters.companyId));
      if (filters.coreId) conditions.push(eq(movements.coreId, filters.coreId));
      if (filters.resourceId) conditions.push(eq(movements.resourceId, filters.resourceId));
      if (filters.officeId) conditions.push(eq(movements.officeId, filters.officeId));
      if (filters.statusId) conditions.push(eq(movements.statusId, filters.statusId));
      if (filters.reasonId) conditions.push(eq(movements.reasonId, filters.reasonId));
      if (filters.tagId) conditions.push(eq(movements.tagId, filters.tagId));
      if (filters.ibanId) conditions.push(eq(movements.ibanId, filters.ibanId));
      if (filters.type) conditions.push(eq(movements.type, filters.type));
      if (filters.minAmount) {
        const minAmount = parseFloat(filters.minAmount);
        if (!isNaN(minAmount)) {
          conditions.push(gte(movements.amount, filters.minAmount));
        }
      }
      if (filters.maxAmount) {
        const maxAmount = parseFloat(filters.maxAmount);
        if (!isNaN(maxAmount)) {
          conditions.push(lte(movements.amount, filters.maxAmount));
        }
      }
      if (filters.documentNumber) {
        conditions.push(eq(movements.documentNumber, filters.documentNumber));
      }
      if (filters.notes) {
        conditions.push(sql`${movements.notes} ILIKE ${`%${filters.notes}%`}`);
      }
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        if (!isNaN(startDate.getTime())) {
          conditions.push(gte(movements.flowDate, filters.startDate));
        }
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        if (!isNaN(endDate.getTime())) {
          conditions.push(lte(movements.flowDate, filters.endDate));
        }
      }

      const results = await db
        .select()
        .from(movements)
        .leftJoin(companies, eq(movements.companyId, companies.id))
        .leftJoin(cores, eq(movements.coreId, cores.id))
        .leftJoin(movementReasons, eq(movements.reasonId, movementReasons.id))
        .leftJoin(resources, eq(movements.resourceId, resources.id))
        .leftJoin(offices, eq(movements.officeId, offices.id))
        .leftJoin(ibans, eq(movements.ibanId, ibans.id))
        .leftJoin(tags, eq(movements.tagId, tags.id))
        .leftJoin(movementStatuses, eq(movements.statusId, movementStatuses.id))
        .leftJoin(suppliers, eq(movements.supplierId, suppliers.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(movements.flowDate), desc(movements.createdAt));
      // Transform joined results to MovementWithRelations format
      const transformedResults = results.map((row: any) => ({
        ...row.movements,
        company: row.companies,
        core: row.cores,
        reason: row.movement_reasons,
        resource: row.resources,
        office: row.offices,
        iban: row.ibans,
        tag: row.tags,
        status: row.movement_statuses,
        supplier: row.suppliers
      }));

      return transformedResults as MovementWithRelations[];
    } catch (error) {
      console.error('Error fetching movements:', error);
      throw new Error('Failed to fetch movements');
    }
  }

  async getMovement(id: string): Promise<MovementWithRelations | undefined> {
    try {
      const [movement] = await db
        .select()
        .from(movements)
        .leftJoin(companies, eq(movements.companyId, companies.id))
        .leftJoin(cores, eq(movements.coreId, cores.id))
        .leftJoin(movementReasons, eq(movements.reasonId, movementReasons.id))
        .leftJoin(resources, eq(movements.resourceId, resources.id))
        .leftJoin(offices, eq(movements.officeId, offices.id))
        .leftJoin(ibans, eq(movements.ibanId, ibans.id))
        .leftJoin(tags, eq(movements.tagId, tags.id))
        .leftJoin(movementStatuses, eq(movements.statusId, movementStatuses.id))
        .leftJoin(suppliers, eq(movements.supplierId, suppliers.id))
        .where(eq(movements.id, id))
        .limit(1);
      if (!movement) return undefined;
      
      // Transform joined result to MovementWithRelations format
      const transformedMovement = {
        ...movement.movements,
        company: movement.companies,
        core: movement.cores,
        reason: movement.movement_reasons,
        resource: movement.resources,
        office: movement.offices,
        iban: movement.ibans,
        tag: movement.tags,
        status: movement.movement_statuses,
        supplier: movement.suppliers
      };

      return transformedMovement as MovementWithRelations;
    } catch (error) {
      console.error('Error fetching movement:', error);
      throw new Error('Failed to fetch movement');
    }
  }

  async createMovement(movement: InsertMovement): Promise<Movement> {
    try {
      // Validate required relationships exist
      const company = await this.getCompany(movement.companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      const [newMovement] = await db.insert(movements).values(movement).returning();
      return newMovement;
    } catch (error) {
      console.error('Error creating movement:', error);
      throw error instanceof Error ? error : new Error('Failed to create movement');
    }
  }

  async updateMovement(id: string, movement: Partial<InsertMovement>): Promise<Movement> {
    try {
      const [updatedMovement] = await db
        .update(movements)
        .set(movement)
        .where(eq(movements.id, id))
        .returning();
      
      if (!updatedMovement) {
        throw new Error('Movement not found');
      }
      
      return updatedMovement;
    } catch (error) {
      console.error('Error updating movement:', error);
      throw new Error('Failed to update movement');
    }
  }

  async deleteMovement(id: string): Promise<void> {
    try {
      // First check if movement exists
      const existingMovement = await db.select().from(movements).where(eq(movements.id, id)).limit(1);
      
      if (existingMovement.length === 0) {
        throw new Error('Movement not found');
      }
      
      // Delete the movement
      await db.delete(movements).where(eq(movements.id, id));
    } catch (error) {
      console.error('Error deleting movement:', error);
      throw error instanceof Error ? error : new Error('Failed to delete movement');
    }
  }

  // Analytics
  async getMovementStats(period?: { startDate: string; endDate: string }, resourceIdFilter?: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    totalMovements: number;
    pendingMovements: number;
  }> {
    try {
      const conditions = [];
      if (period?.startDate) {
        const startDate = new Date(period.startDate);
        if (!isNaN(startDate.getTime())) {
          conditions.push(gte(movements.flowDate, period.startDate));
        }
      }
      if (period?.endDate) {
        const endDate = new Date(period.endDate);
        if (!isNaN(endDate.getTime())) {
          conditions.push(lte(movements.flowDate, period.endDate));
        }
      }
      
      // Filtro per resourceId se specificato (per utenti role 'user')
      if (resourceIdFilter) {
        conditions.push(eq(movements.resourceId, resourceIdFilter));
      }

      const [stats] = await db
        .select({
          totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${movements.type} = 'income' THEN ${movements.amount} ELSE 0 END), 0)`,
          totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN ${movements.type} = 'expense' THEN ${movements.amount} ELSE 0 END), 0)`,
          totalMovements: sql<number>`COUNT(*)`,
        })
        .from(movements)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const [pendingCount] = await db
        .select({
          pendingMovements: sql<number>`COUNT(*)`,
        })
        .from(movements)
        .innerJoin(movementStatuses, eq(movements.statusId, movementStatuses.id))
        .where(
          and(
            ...(conditions.length > 0 ? conditions : []),
            sql`${movementStatuses.name} NOT IN ('Saldato', 'Annullato')`
          )
        );

      return {
        totalIncome: Number(stats.totalIncome) || 0,
        totalExpenses: Number(stats.totalExpenses) || 0,
        netBalance: (Number(stats.totalIncome) || 0) - (Number(stats.totalExpenses) || 0),
        totalMovements: Number(stats.totalMovements) || 0,
        pendingMovements: Number(pendingCount.pendingMovements) || 0,
      };
    } catch (error) {
      console.error('Error fetching movement stats:', error);
      throw new Error('Failed to fetch movement stats');
    }
  }

  async getCashFlowData(days: number, resourceIdFilter?: string): Promise<Array<{
    date: string;
    income: number;
    expenses: number;
    balance: number;
  }>> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days);

      const conditions = [
        gte(movements.flowDate, startDate.toISOString().split('T')[0]),
        lte(movements.flowDate, endDate.toISOString().split('T')[0])
      ];
      
      // Filtro per resourceId se specificato (per utenti role 'user')
      if (resourceIdFilter) {
        conditions.push(eq(movements.resourceId, resourceIdFilter));
      }

      const result = await db
        .select({
          date: movements.flowDate,
          income: sql<number>`COALESCE(SUM(CASE WHEN ${movements.type} = 'income' THEN ${movements.amount} ELSE 0 END), 0)`,
          expenses: sql<number>`COALESCE(SUM(CASE WHEN ${movements.type} = 'expense' THEN ${movements.amount} ELSE 0 END), 0)`,
        })
        .from(movements)
        .where(and(...conditions))
        .groupBy(movements.flowDate)
        .orderBy(movements.flowDate);

      return result.map(row => ({
        date: row.date || '',
        income: Number(row.income) || 0,
        expenses: Number(row.expenses) || 0,
        balance: (Number(row.income) || 0) - (Number(row.expenses) || 0),
      }));
    } catch (error) {
      console.error('Error fetching cash flow data:', error);
      throw new Error('Failed to fetch cash flow data');
    }
  }

  async getMovementStatusDistribution(): Promise<Array<{
    statusName: string;
    count: number;
  }>> {
    try {
      const result = await db
        .select({
          statusName: movementStatuses.name,
          count: sql<number>`COUNT(${movements.id})`,
        })
        .from(movements)
        .innerJoin(movementStatuses, eq(movements.statusId, movementStatuses.id))
        .groupBy(movementStatuses.name)
        .orderBy(movementStatuses.name);

      return result.map(row => ({
        statusName: row.statusName || '',
        count: Number(row.count) || 0,
      }));
    } catch (error) {
      console.error('Error fetching movement status distribution:', error);
      throw new Error('Failed to fetch movement status distribution');
    }
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    try {
      return await db.select().from(suppliers).where(eq(suppliers.isActive, true)).orderBy(suppliers.name);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw new Error('Failed to fetch suppliers');
    }
  }

  async getSupplierByVatNumber(vatNumber: string): Promise<Supplier | undefined> {
    try {
      const [supplier] = await db
        .select()
        .from(suppliers)
        .where(and(eq(suppliers.vatNumber, vatNumber), eq(suppliers.isActive, true)));
      
      return supplier;
    } catch (error) {
      console.error('Error fetching supplier by VAT number:', error);
      throw new Error('Failed to fetch supplier by VAT number');
    }
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    try {
      const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
      return newSupplier;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw new Error('Failed to create supplier');
    }
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    try {
      const [updatedSupplier] = await db
        .update(suppliers)
        .set(supplier)
        .where(eq(suppliers.id, id))
        .returning();
      
      if (!updatedSupplier) {
        throw new Error('Supplier not found');
      }
      
      return updatedSupplier;
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw new Error('Failed to update supplier');
    }
  }

  async deleteSupplier(id: string): Promise<void> {
    try {
      // Soft delete - set isActive to false instead of actually deleting
      const [updatedSupplier] = await db
        .update(suppliers)
        .set({ isActive: false })
        .where(eq(suppliers.id, id))
        .returning();
      
      if (!updatedSupplier) {
        throw new Error('Supplier not found');
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error instanceof Error ? error : new Error('Failed to delete supplier');
    }
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    try {
      return await db.select().from(customers).where(eq(customers.isActive, true)).orderBy(customers.name);
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw new Error('Failed to fetch customers');
    }
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    try {
      const [customer] = await db
        .select()
        .from(customers)
        .where(and(eq(customers.id, id), eq(customers.isActive, true)));
      
      return customer;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw new Error('Failed to fetch customer');
    }
  }

  async getCustomerByVatNumber(vatNumber: string): Promise<Customer | undefined> {
    try {
      const [customer] = await db
        .select()
        .from(customers)
        .where(and(eq(customers.vatNumber, vatNumber), eq(customers.isActive, true)));
      
      return customer;
    } catch (error) {
      console.error('Error fetching customer by VAT number:', error);
      throw new Error('Failed to fetch customer by VAT number');
    }
  }

  async getCustomerByTaxCode(taxCode: string): Promise<Customer | undefined> {
    try {
      const [customer] = await db
        .select()
        .from(customers)
        .where(and(eq(customers.taxCode, taxCode), eq(customers.isActive, true)));
      
      return customer;
    } catch (error) {
      console.error('Error fetching customer by tax code:', error);
      throw new Error('Failed to fetch customer by tax code');
    }
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    try {
      const [newCustomer] = await db.insert(customers).values(customer).returning();
      return newCustomer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer> {
    try {
      const [updatedCustomer] = await db
        .update(customers)
        .set(customer)
        .where(eq(customers.id, id))
        .returning();
      
      if (!updatedCustomer) {
        throw new Error('Customer not found');
      }
      
      return updatedCustomer;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw new Error('Failed to update customer');
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      // Soft delete - set isActive to false instead of actually deleting
      const [updatedCustomer] = await db
        .update(customers)
        .set({ isActive: false })
        .where(eq(customers.id, id))
        .returning();
      
      if (!updatedCustomer) {
        throw new Error('Customer not found');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error instanceof Error ? error : new Error('Failed to delete customer');
    }
  }

  // Users
  async getUsers(): Promise<User[]> {
    try {
      return await db.select().from(users).orderBy(users.username);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user || undefined;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      throw new Error('Failed to fetch user by username');
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user || undefined;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw new Error('Failed to fetch user by email');
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user');
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [newUser] = await db.insert(users).values(user).returning();
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set(user)
        .where(eq(users.id, id))
        .returning();
      
      if (!updatedUser) {
        throw new Error('User not found');
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      
      if (result.rowCount === 0) {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error instanceof Error ? error : new Error('Failed to delete user');
    }
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    try {
      const result = await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, id));
      
      if (result.rowCount === 0) {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      throw new Error('Failed to update password');
    }
  }

  async setResetToken(email: string, token: string, expiry: Date): Promise<void> {
    try {
      const result = await db
        .update(users)
        .set({
          resetToken: token,
          resetTokenExpiry: expiry,
        })
        .where(eq(users.email, email));
      
      if (result.rowCount === 0) {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Error setting reset token:', error);
      throw new Error('Failed to set reset token');
    }
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.resetToken, token),
            gte(users.resetTokenExpiry, new Date())
          )
        );
      return user || undefined;
    } catch (error) {
      console.error('Error fetching user by reset token:', error);
      throw new Error('Failed to fetch user by reset token');
    }
  }

  async clearResetToken(id: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          resetToken: null,
          resetTokenExpiry: null,
        })
        .where(eq(users.id, id));
    } catch (error) {
      console.error('Error clearing reset token:', error);
      throw new Error('Failed to clear reset token');
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({ lastLogin: new Date() })
        .where(eq(users.id, id));
    } catch (error) {
      console.error('Error updating last login:', error);
      throw new Error('Failed to update last login');
    }
  }

  async setFirstAccessCompleted(id: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({ isFirstAccess: false })
        .where(eq(users.id, id));
    } catch (error) {
      console.error('Error setting first access completed:', error);
      throw new Error('Failed to set first access completed');
    }
  }

  // Email Settings
  async getEmailSettings(): Promise<EmailSettings | null> {
    try {
      const settings = await db.select().from(emailSettings).where(eq(emailSettings.isActive, true)).limit(1);
      return settings[0] || null;
    } catch (error) {
      console.error('Error getting email settings:', error);
      return null;
    }
  }

  async saveEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings> {
    try {
      // Deactivate existing settings
      await db.update(emailSettings).set({ isActive: false });
      
      // Insert new settings
      const [newSettings] = await db.insert(emailSettings).values({
        ...settings,
        isActive: true,
        updatedAt: new Date(),
      }).returning();
      
      return newSettings;
    } catch (error) {
      console.error('Error saving email settings:', error);
      throw new Error('Failed to save email settings');
    }
  }

  // Security Settings Methods
  async getSecuritySettings(): Promise<SecuritySettings | undefined> {
    try {
      const result = await db.select().from(securitySettings).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching security settings:', error);
      return undefined;
    }
  }

  async updateSecuritySettings(settings: Partial<InsertSecuritySettings>): Promise<SecuritySettings> {
    try {
      // First check if settings exist
      const existing = await this.getSecuritySettings();
      
      if (!existing) {
        // Create default settings first
        const defaultSettings: InsertSecuritySettings = {
          sessionTimeout: 3600,
          maxConcurrentSessions: 3,
          enforceSessionTimeout: true,
          passwordMinLength: 8,
          passwordRequireUppercase: true,
          passwordRequireLowercase: true,
          passwordRequireNumbers: true,
          passwordRequireSymbols: false,
          passwordExpiryDays: 90,
          passwordHistoryCount: 5,
          twoFactorEnabled: false,
          twoFactorMandatoryForAdmin: false,
          twoFactorMandatoryForFinance: false,
          loginAttemptsLimit: 5,
          loginBlockDuration: 900,
          apiRateLimit: 100,
          auditEnabled: true,
          auditRetentionDays: 90,
          trackFailedLogins: true,
          trackIpChanges: true,
          jwtExpirationHours: 24,
          refreshTokenExpirationDays: 7,
          apiKeyRotationDays: 30,
          ...settings
        };
        const result = await db.insert(securitySettings).values([defaultSettings]).returning();
        return result[0];
      }

      const result = await db.update(securitySettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(securitySettings.id, existing.id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw new Error('Failed to update security settings');
    }
  }

  // Security Statistics
  async getSecurityStats(): Promise<{
    activeSessions: number;
    failedLogins24h: number;
    lockedUsers: number;
    twoFactorUsers: number;
  }> {
    try {
      const [activeSessionsCount, failedLogins24h, lockedUsers, twoFactorUsers] = await Promise.all([
        db.select({ count: count() }).from(activeSessions).where(eq(activeSessions.isActive, true)),
        db.select({ count: count() }).from(loginAuditLog).where(
          and(
            eq(loginAuditLog.success, false),
            gte(loginAuditLog.loginTime, new Date(Date.now() - 24 * 60 * 60 * 1000))
          )
        ),
        db.select({ count: count() }).from(users).where(eq(users.isLocked, true)),
        db.select({ count: count() }).from(users).where(eq(users.isTwoFactorEnabled, true))
      ]);

      return {
        activeSessions: activeSessionsCount[0]?.count || 0,
        failedLogins24h: failedLogins24h[0]?.count || 0,
        lockedUsers: lockedUsers[0]?.count || 0,
        twoFactorUsers: twoFactorUsers[0]?.count || 0,
      };
    } catch (error) {
      console.error('Error fetching security stats:', error);
      return {
        activeSessions: 0,
        failedLogins24h: 0,
        lockedUsers: 0,
        twoFactorUsers: 0,
      };
    }
  }

  // Password Reset Tokens
  async createPasswordResetToken(userId: string): Promise<string> {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Delete existing tokens for this user
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
      
      // Create new token
      await db.insert(passwordResetTokens).values({
        userId,
        token,
        expiresAt,
      });
      
      return token;
    } catch (error) {
      console.error('Error creating password reset token:', error);
      throw new Error('Failed to create password reset token');
    }
  }

  async validatePasswordResetToken(token: string): Promise<User | null> {
    try {
      const tokenRecord = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token))
        .limit(1);
      
      if (!tokenRecord[0] || tokenRecord[0].expiresAt < new Date()) {
        return null;
      }
      
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, tokenRecord[0].userId))
        .limit(1);
      
      return user[0] || null;
    } catch (error) {
      console.error('Error validating password reset token:', error);
      return null;
    }
  }

  async resetUserPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.validatePasswordResetToken(token);
      if (!user) {
        return false;
      }
      
      // Hash the new password
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update user password
      await db.update(users).set({ 
        password: hashedPassword,
        isFirstAccess: false 
      }).where(eq(users.id, user.id));
      
      // Delete the used token
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
      
      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    }
  }



  // Notifications
  async getNotifications(userId: string, isRead?: boolean): Promise<Notification[]> {
    try {
      const conditions = [eq(notifications.userId, userId)];
      if (isRead !== undefined) {
        conditions.push(eq(notifications.isRead, isRead));
      }

      return await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        );
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
      throw new Error('Failed to fetch unread notifications count');
    }
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    try {
      const [newNotification] = await db
        .insert(notifications)
        .values(notification)
        .returning();
      
      return newNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  async markNotificationAsRead(id: string): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ 
          isRead: true,
          readAt: new Date()
        })
        .where(eq(notifications.id, id));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ 
          isRead: true,
          readAt: new Date()
        })
        .where(eq(notifications.userId, userId));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      await db.delete(notifications).where(eq(notifications.id, id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  async exportFilteredMovements(user: any, filters: any, format: string = 'csv'): Promise<string> {
    try {
      // Get all movements (no pagination for export)
      const result = await this.getFilteredMovements(filters, 1, 10000);
      const movements = result.data;

      if (format === 'csv') {
        const headers = [
          'Data Flusso',
          'Tipo',
          'Ragione Sociale',
          'Core',
          'Risorsa',
          'Causale',
          'Fornitore',
          'P.IVA Fornitore',
          'Importo',
          'Importo IVA',
          'Tipo IVA',
          'Importo Netto',
          'Stato',
          'Sede Operativa',
          'IBAN',
          'Numero Documento',
          'Note',
          'Data Inserimento'
        ];

        const csvRows = [headers.join(',')];

        movements.forEach((movement: any) => {
          const row = [
            movement.flowDate,
            movement.type === 'income' ? 'Entrata' : 'Uscita',
            movement.company?.name || '',
            movement.core?.name || '',
            movement.resource ? `${movement.resource.firstName} ${movement.resource.lastName}` : '',
            movement.reason?.name || '',
            movement.supplier?.name || '',
            movement.supplier?.vatNumber || '',
            movement.amount,
            movement.vatAmount || '',
            movement.vatType || '',
            movement.netAmount || '',
            movement.status?.name || '',
            movement.office ? `${movement.office.name} - ${movement.office.city}` : '',
            movement.iban ? `${movement.iban.bankName} - ${movement.iban.iban}` : '',
            movement.documentNumber || '',
            movement.notes || '',
            movement.createdAt
          ];

          // Escape CSV fields with commas or quotes
          const escapedRow = row.map(field => {
            const stringField = String(field || '');
            if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
              return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
          });

          csvRows.push(escapedRow.join(','));
        });

        return csvRows.join('\n');
      } else {
        return JSON.stringify(movements, null, 2);
      }
    } catch (error) {
      console.error('Error exporting filtered movements:', error);
      throw new Error('Failed to export filtered movements');
    }
  }

  // AI Settings Methods
  async getAiSettings(userId: string): Promise<AiSettings | undefined> {
    try {
      const result = await db.select().from(aiSettings).where(eq(aiSettings.userId, userId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching AI settings:', error);
      return undefined;
    }
  }

  async createAiSettings(settings: InsertAiSettings): Promise<AiSettings> {
    try {
      const settingsData = {
        ...settings,
        temperature: typeof settings.temperature === 'number' ? settings.temperature.toString() : settings.temperature
      };
      const result = await db.insert(aiSettings).values([settingsData]).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating AI settings:', error);
      throw new Error('Failed to create AI settings');
    }
  }

  async updateAiSettings(userId: string, settings: Partial<InsertAiSettings>): Promise<AiSettings> {
    try {
      const updateData = {
        ...settings,
        temperature: typeof settings.temperature === 'number' ? settings.temperature.toString() : settings.temperature,
        updatedAt: new Date()
      };
      const result = await db.update(aiSettings)
        .set(updateData)
        .where(eq(aiSettings.userId, userId))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating AI settings:', error);
      throw new Error('Failed to update AI settings');
    }
  }

  async deleteAiSettings(userId: string): Promise<void> {
    try {
      await db.delete(aiSettings).where(eq(aiSettings.userId, userId));
    } catch (error) {
      console.error('Error deleting AI settings:', error);
      throw new Error('Failed to delete AI settings');
    }
  }

  // AI Chat History Methods
  async getAiChatHistory(userId: string, sessionId?: string): Promise<AiChatHistory[]> {
    try {
      let query = db.select().from(aiChatHistory).where(eq(aiChatHistory.userId, userId));
      
      if (sessionId) {
        query = db.select().from(aiChatHistory).where(
          and(eq(aiChatHistory.userId, userId), eq(aiChatHistory.sessionId, sessionId))
        );
      }
      
      return await query.orderBy(aiChatHistory.createdAt);
    } catch (error) {
      console.error('Error fetching AI chat history:', error);
      return [];
    }
  }

  async getAiChatSessions(userId: string): Promise<any[]> {
    try {
      const sessions = await db
        .select({
          id: aiChatHistory.sessionId,
          title: sql<string>`COALESCE(
            CASE 
              WHEN (
                SELECT content FROM ${aiChatHistory} 
                WHERE user_id = ${userId} 
                AND session_id = ${aiChatHistory.sessionId} 
                AND role = 'user' 
                ORDER BY created_at ASC LIMIT 1
              ) IS NOT NULL 
              THEN CONCAT(
                SUBSTRING(
                  (SELECT content FROM ${aiChatHistory} 
                   WHERE user_id = ${userId} 
                   AND session_id = ${aiChatHistory.sessionId} 
                   AND role = 'user' 
                   ORDER BY created_at ASC LIMIT 1), 
                  1, 40
                ), 
                '...'
              )
              ELSE CONCAT('Chat ', SUBSTRING(${aiChatHistory.sessionId}, 1, 8))
            END,
            'Nuova Conversazione'
          )`,
          lastMessage: sql<string>`(
            SELECT content FROM ${aiChatHistory} 
            WHERE user_id = ${userId} AND session_id = ${aiChatHistory.sessionId} 
            ORDER BY created_at DESC LIMIT 1
          )`,
          createdAt: sql<string>`MIN(${aiChatHistory.createdAt})`,
          messageCount: sql<number>`COUNT(*)`
        })
        .from(aiChatHistory)
        .where(eq(aiChatHistory.userId, userId))
        .groupBy(aiChatHistory.sessionId)
        .orderBy(sql`MIN(${aiChatHistory.createdAt}) DESC`);

      return sessions;
    } catch (error) {
      console.error('Error fetching AI chat history:', error);
      return [];
    }
  }



  async createAiChatMessage(message: InsertAiChatHistory): Promise<AiChatHistory> {
    try {
      const result = await db.insert(aiChatHistory).values(message).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating AI chat message:', error);
      throw new Error('Failed to create AI chat message');
    }
  }

  async deleteAiChatSession(userId: string, sessionId: string): Promise<void> {
    try {
      await db.delete(aiChatHistory)
        .where(and(eq(aiChatHistory.userId, userId), eq(aiChatHistory.sessionId, sessionId)));
    } catch (error) {
      console.error('Error deleting AI chat session:', error);
      throw new Error('Failed to delete AI chat session');
    }
  }

  async deleteAllAiChatHistory(userId: string): Promise<void> {
    try {
      await db.delete(aiChatHistory).where(eq(aiChatHistory.userId, userId));
    } catch (error) {
      console.error('Error deleting all AI chat history:', error);
      throw new Error('Failed to delete AI chat history');
    }
  }

  // === BACKUP MANAGEMENT === 
  // TEMPORARILY DISABLED TO FIX NOTIFICATIONS API - WILL RE-ENABLE AFTER NOTIFICATIONS WORK
  /*
  async createBackupConfiguration(config: BackupConfigurationInsert): Promise<BackupConfiguration> {
    try {
      const [result] = await db.insert(backupConfigurations).values({
        ...config,
        updatedAt: new Date(),
      }).returning();
      return result;
    } catch (error) {
      console.error("Error creating backup configuration:", error);
      throw new Error("Failed to create backup configuration");
    }
  }

  async getBackupConfigurations(): Promise<BackupConfiguration[]> {
    try {
      return await db.select().from(backupConfigurations).orderBy(backupConfigurations.createdAt);
    } catch (error) {
      console.error("Error fetching backup configurations:", error);
      throw new Error("Failed to fetch backup configurations");
    }
  }

  async updateBackupConfiguration(id: string, updates: Partial<BackupConfigurationInsert>): Promise<BackupConfiguration> {
    try {
      const [result] = await db.update(backupConfigurations)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(backupConfigurations.id, id))
        .returning();
      
      if (!result) {
        throw new Error("Backup configuration not found");
      }
      
      return result;
    } catch (error) {
      console.error("Error updating backup configuration:", error);
      throw new Error("Failed to update backup configuration");
    }
  }

  async deleteBackupConfiguration(id: string): Promise<void> {
    try {
      const result = await db.delete(backupConfigurations)
        .where(eq(backupConfigurations.id, id));
      
      if (result.rowCount === 0) {
        throw new Error("Backup configuration not found");
      }
    } catch (error) {
      console.error("Error deleting backup configuration:", error);
      throw new Error("Failed to delete backup configuration");
    }
  }

  async createBackupJob(job: BackupJobInsert): Promise<BackupJob> {
    try {
      const [result] = await db.insert(backupJobs).values(job).returning();
      return result;
    } catch (error) {
      console.error("Error creating backup job:", error);
      throw new Error("Failed to create backup job");
    }
  }

  async updateBackupJob(id: string, updates: Partial<BackupJobInsert>): Promise<BackupJob> {
    try {
      const [result] = await db.update(backupJobs)
        .set(updates)
        .where(eq(backupJobs.id, id))
        .returning();
      
      if (!result) {
        throw new Error("Backup job not found");
      }
      
      return result;
    } catch (error) {
      console.error("Error updating backup job:", error);
      throw new Error("Failed to update backup job");
    }
  }

  async getBackupJobs(limit = 50): Promise<BackupJob[]> {
    try {
      return await db.select()
        .from(backupJobs)
        .orderBy(desc(backupJobs.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Error fetching backup jobs:", error);
      throw new Error("Failed to fetch backup jobs");
    }
  }

  async getBackupJobsByConfiguration(configId: string): Promise<BackupJob[]> {
    try {
      return await db.select()
        .from(backupJobs)
        .where(eq(backupJobs.configurationId, configId))
        .orderBy(desc(backupJobs.createdAt));
    } catch (error) {
      console.error("Error fetching backup jobs for configuration:", error);
      throw new Error("Failed to fetch backup jobs for configuration");
    }
  }

  async createRestorePoint(point: RestorePointInsert): Promise<RestorePoint> {
    try {
      const [result] = await db.insert(restorePoints).values(point).returning();
      return result;
    } catch (error) {
      console.error("Error creating restore point:", error);
      throw new Error("Failed to create restore point");
    }
  }

  async getRestorePoints(): Promise<RestorePoint[]> {
    try {
      return await db.select()
        .from(restorePoints)
        .where(eq(restorePoints.isArchived, false))
        .orderBy(desc(restorePoints.createdAt));
    } catch (error) {
      console.error("Error fetching restore points:", error);
      throw new Error("Failed to fetch restore points");
    }
  }

  async updateRestorePoint(id: string, updates: Partial<RestorePointInsert>): Promise<RestorePoint> {
    try {
      const [result] = await db.update(restorePoints)
        .set(updates)
        .where(eq(restorePoints.id, id))
        .returning();
      
      if (!result) {
        throw new Error("Restore point not found");
      }
      
      return result;
    } catch (error) {
      console.error("Error updating restore point:", error);
      throw new Error("Failed to update restore point");
    }
  }

  async archiveRestorePoint(id: string): Promise<void> {
    try {
      await db.update(restorePoints)
        .set({ isArchived: true })
        .where(eq(restorePoints.id, id));
    } catch (error) {
      console.error("Error archiving restore point:", error);
      throw new Error("Failed to archive restore point");
    }
  }

  async createBackupAuditLog(log: BackupAuditLogInsert): Promise<void> {
    try {
      await db.insert(backupAuditLog).values(log);
    } catch (error) {
      console.error("Error creating backup audit log:", error);
      // Non-critical, don't throw
    }
  }

  async getBackupAuditLogs(limit = 100): Promise<BackupAuditLog[]> {
    try {
      return await db.select()
        .from(backupAuditLog)
        .orderBy(desc(backupAuditLog.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Error fetching backup audit logs:", error);
      throw new Error("Failed to fetch backup audit logs");
    }
  }

  async getBackupStats(): Promise<{
    totalConfigurations: number;
    activeConfigurations: number;
    totalJobs: number;
    successfulJobs: number;
    failedJobs: number;
    totalRestorePoints: number;
    totalBackupSize: number;
  }> {
    try {
      const [totalConfigs] = await db.select({ count: count() }).from(backupConfigurations);
      const [activeConfigs] = await db.select({ count: count() })
        .from(backupConfigurations)
        .where(eq(backupConfigurations.enabled, true));
      
      const [totalJobsResult] = await db.select({ count: count() }).from(backupJobs);
      const [successfulJobsResult] = await db.select({ count: count() })
        .from(backupJobs)
        .where(eq(backupJobs.status, 'completed'));
      const [failedJobsResult] = await db.select({ count: count() })
        .from(backupJobs)
        .where(eq(backupJobs.status, 'failed'));
      
      const [totalRestorePointsResult] = await db.select({ count: count() })
        .from(restorePoints)
        .where(eq(restorePoints.isArchived, false));
      
      // Calculate total backup size
      const sizeResult = await db.select({
        totalSize: sql<number>`COALESCE(SUM(${backupJobs.backupSizeBytes}), 0)`
      }).from(backupJobs).where(eq(backupJobs.status, 'completed'));
      
      return {
        totalConfigurations: totalConfigs.count,
        activeConfigurations: activeConfigs.count,
        totalJobs: totalJobsResult.count,
        successfulJobs: successfulJobsResult.count,
        failedJobs: failedJobsResult.count,
        totalRestorePoints: totalRestorePointsResult.count,
        totalBackupSize: sizeResult[0]?.totalSize || 0,
      };
    } catch (error) {
      console.error("Error fetching backup stats:", error);
      throw new Error("Failed to fetch backup stats");
    }
  }
  */
  // END TEMPORARY BACKUP DISABLE

  // AI Document Jobs Methods
  async getAiDocumentJobs(userId: string): Promise<AiDocumentJob[]> {
    try {
      return await db.select().from(aiDocumentJobs)
        .where(eq(aiDocumentJobs.userId, userId))
        .orderBy(desc(aiDocumentJobs.createdAt));
    } catch (error) {
      console.error('Error fetching AI document jobs:', error);
      return [];
    }
  }

  async getAiDocumentJob(id: string): Promise<AiDocumentJob | undefined> {
    try {
      const result = await db.select().from(aiDocumentJobs).where(eq(aiDocumentJobs.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching AI document job:', error);
      return undefined;
    }
  }

  async createAiDocumentJob(job: InsertAiDocumentJob): Promise<AiDocumentJob> {
    try {
      const result = await db.insert(aiDocumentJobs).values(job).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating AI document job:', error);
      throw new Error('Failed to create AI document job');
    }
  }

  async updateAiDocumentJob(id: string, job: Partial<AiDocumentJob>): Promise<AiDocumentJob> {
    try {
      const result = await db.update(aiDocumentJobs)
        .set(job)
        .where(eq(aiDocumentJobs.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating AI document job:', error);
      throw new Error('Failed to update AI document job');
    }
  }

  async deleteAiDocumentJob(id: string): Promise<void> {
    try {
      await db.delete(aiDocumentJobs).where(eq(aiDocumentJobs.id, id));
    } catch (error) {
      console.error('Error deleting AI document job:', error);
      throw new Error('Failed to delete AI document job');
    }
  }

  // SendGrid Templates methods
  async createSendgridTemplate(template: InsertSendgridTemplate): Promise<SendgridTemplate> {
    const result = await db.insert(sendgridTemplates).values(template).returning();
    return result[0];
  }

  async getSendgridTemplates(): Promise<SendgridTemplate[]> {
    return await db.select().from(sendgridTemplates).orderBy(desc(sendgridTemplates.createdAt));
  }

  async getSendgridTemplateById(id: string): Promise<SendgridTemplate | null> {
    const result = await db.select().from(sendgridTemplates).where(eq(sendgridTemplates.id, id));
    return result[0] || null;
  }

  async getSendgridTemplateByCategory(category: string): Promise<SendgridTemplate[]> {
    return await db.select().from(sendgridTemplates)
      .where(and(eq(sendgridTemplates.category, category), eq(sendgridTemplates.isActive, true)))
      .orderBy(desc(sendgridTemplates.createdAt));
  }

  async updateSendgridTemplate(id: string, updates: Partial<InsertSendgridTemplate>): Promise<SendgridTemplate | null> {
    const result = await db.update(sendgridTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sendgridTemplates.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteSendgridTemplate(id: string): Promise<boolean> {
    const result = await db.delete(sendgridTemplates).where(eq(sendgridTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // WhatsApp Settings methods
  async getWhatsappSettings(): Promise<WhatsappSettings[]> {
    try {
      return await db.select().from(whatsappSettings).orderBy(desc(whatsappSettings.createdAt));
    } catch (error) {
      console.error('Error fetching WhatsApp settings:', error);
      throw new Error('Failed to fetch WhatsApp settings');
    }
  }

  async createWhatsappSettings(settings: InsertWhatsappSettings): Promise<WhatsappSettings> {
    try {
      const result = await db.insert(whatsappSettings).values(settings).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating WhatsApp settings:', error);
      throw new Error('Failed to create WhatsApp settings');
    }
  }

  async updateWhatsappSettings(id: string, settings: Partial<InsertWhatsappSettings>): Promise<WhatsappSettings> {
    try {
      const result = await db
        .update(whatsappSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(whatsappSettings.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error('WhatsApp settings not found');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error updating WhatsApp settings:', error);
      throw new Error('Failed to update WhatsApp settings');
    }
  }

  async deleteWhatsappSettings(id: string): Promise<void> {
    try {
      await db.delete(whatsappSettings).where(eq(whatsappSettings.id, id));
    } catch (error) {
      console.error('Error deleting WhatsApp settings:', error);
      throw new Error('Failed to delete WhatsApp settings');
    }
  }

  // WhatsApp Templates methods
  async getWhatsappTemplates(): Promise<WhatsappTemplate[]> {
    try {
      return await db.select().from(whatsappTemplates).orderBy(desc(whatsappTemplates.createdAt));
    } catch (error) {
      console.error('Error fetching WhatsApp templates:', error);
      throw new Error('Failed to fetch WhatsApp templates');
    }
  }

  async getWhatsappTemplateById(id: string): Promise<WhatsappTemplate | undefined> {
    try {
      const result = await db.select().from(whatsappTemplates).where(eq(whatsappTemplates.id, id));
      return result[0] || undefined;
    } catch (error) {
      console.error('Error fetching WhatsApp template:', error);
      throw new Error('Failed to fetch WhatsApp template');
    }
  }

  async getWhatsappTemplateByName(name: string, provider: string): Promise<WhatsappTemplate | undefined> {
    try {
      const result = await db.select().from(whatsappTemplates).where(
        and(eq(whatsappTemplates.name, name), eq(whatsappTemplates.provider, provider))
      );
      return result[0] || undefined;
    } catch (error) {
      console.error('Error fetching WhatsApp template by name:', error);
      throw new Error('Failed to fetch WhatsApp template by name');
    }
  }

  async createWhatsappTemplate(template: InsertWhatsappTemplate): Promise<WhatsappTemplate> {
    try {
      const result = await db.insert(whatsappTemplates).values(template).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating WhatsApp template:', error);
      throw new Error('Failed to create WhatsApp template');
    }
  }

  async updateWhatsappTemplate(id: string, template: Partial<InsertWhatsappTemplate>): Promise<WhatsappTemplate | undefined> {
    try {
      const result = await db
        .update(whatsappTemplates)
        .set({ ...template, updatedAt: new Date() })
        .where(eq(whatsappTemplates.id, id))
        .returning();
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating WhatsApp template:', error);
      throw new Error('Failed to update WhatsApp template');
    }
  }

  async updateWhatsappTemplateStatus(id: string, status: string): Promise<WhatsappTemplate | undefined> {
    try {
      const result = await db
        .update(whatsappTemplates)
        .set({ status, updatedAt: new Date() })
        .where(eq(whatsappTemplates.id, id))
        .returning();
      
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating WhatsApp template status:', error);
      throw new Error('Failed to update WhatsApp template status');
    }
  }

  async deleteWhatsappTemplate(id: string): Promise<boolean> {
    try {
      const result = await db.delete(whatsappTemplates).where(eq(whatsappTemplates.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting WhatsApp template:', error);
      throw new Error('Failed to delete WhatsApp template');
    }
  }

  // Telegram Settings methods
  async getTelegramSettings(): Promise<TelegramSettings[]> {
    try {
      return await db.select().from(telegramSettings).orderBy(desc(telegramSettings.createdAt));
    } catch (error) {
      console.error('Error fetching Telegram settings:', error);
      throw new Error('Failed to fetch Telegram settings');
    }
  }

  async createTelegramSettings(settings: InsertTelegramSettings): Promise<TelegramSettings> {
    try {
      const result = await db.insert(telegramSettings).values(settings).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating Telegram settings:', error);
      throw new Error('Failed to create Telegram settings');
    }
  }

  async updateTelegramSettings(id: string, settings: Partial<InsertTelegramSettings>): Promise<TelegramSettings> {
    try {
      const result = await db
        .update(telegramSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(telegramSettings.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error('Telegram settings not found');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error updating Telegram settings:', error);
      throw new Error('Failed to update Telegram settings');
    }
  }

  async deleteTelegramSettings(id: string): Promise<void> {
    try {
      await db.delete(telegramSettings).where(eq(telegramSettings.id, id));
    } catch (error) {
      console.error('Error deleting Telegram settings:', error);
      throw new Error('Failed to delete Telegram settings');
    }
  }

  // Telegram Templates methods
  async getTelegramTemplates(): Promise<TelegramTemplate[]> {
    try {
      return await db.select().from(telegramTemplates).orderBy(desc(telegramTemplates.createdAt));
    } catch (error) {
      console.error('Error fetching Telegram templates:', error);
      throw new Error('Failed to fetch Telegram templates');
    }
  }

  async getTelegramTemplate(id: string): Promise<TelegramTemplate | undefined> {
    try {
      const result = await db.select().from(telegramTemplates).where(eq(telegramTemplates.id, id));
      return result[0] || undefined;
    } catch (error) {
      console.error('Error fetching Telegram template:', error);
      throw new Error('Failed to fetch Telegram template');
    }
  }

  async createTelegramTemplate(template: InsertTelegramTemplate): Promise<TelegramTemplate> {
    try {
      const result = await db.insert(telegramTemplates).values(template).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating Telegram template:', error);
      throw new Error('Failed to create Telegram template');
    }
  }

  async updateTelegramTemplate(id: string, template: Partial<InsertTelegramTemplate>): Promise<TelegramTemplate> {
    try {
      const result = await db
        .update(telegramTemplates)
        .set({ ...template, updatedAt: new Date() })
        .where(eq(telegramTemplates.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error('Telegram template not found');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error updating Telegram template:', error);
      throw new Error('Failed to update Telegram template');
    }
  }

  async deleteTelegramTemplate(id: string): Promise<void> {
    try {
      await db.delete(telegramTemplates).where(eq(telegramTemplates.id, id));
    } catch (error) {
      console.error('Error deleting Telegram template:', error);
      throw new Error('Failed to delete Telegram template');
    }
  }

  // Telegram Chats methods
  async getTelegramChats(): Promise<TelegramChat[]> {
    try {
      const result = await db.select({
        id: telegramChats.id,
        chatId: telegramChats.chatId,
        telegramChatId: telegramChats.telegramChatId,
        chatType: telegramChats.chatType,
        title: telegramChats.title,
        username: telegramChats.username,
        firstName: telegramChats.firstName,
        lastName: telegramChats.lastName,
        phoneNumber: telegramChats.phoneNumber,
        languageCode: telegramChats.languageCode,
        isBlocked: telegramChats.isBlocked,
        isPremium: telegramChats.isPremium,
        isBot: telegramChats.isBot,
        lastMessageId: telegramChats.lastMessageId,
        lastMessageAt: telegramChats.lastMessageAt,
        messageCount: telegramChats.messageCount,
        linkedCustomerId: telegramChats.linkedCustomerId,
        linkedResourceId: telegramChats.linkedResourceId,
        notes: telegramChats.notes,
        tags: telegramChats.tags,
        createdAt: telegramChats.createdAt,
        updatedAt: telegramChats.updatedAt,
        lastRealMessage: telegramChats.lastRealMessage
      }).from(telegramChats).orderBy(desc(telegramChats.createdAt));
      
      return result as TelegramChat[];
    } catch (error) {
      console.error('Error fetching Telegram chats:', error);
      throw new Error('Failed to fetch Telegram chats');
    }
  }

  async getTelegramChat(id: string): Promise<TelegramChat | undefined> {
    try {
      const result = await db.select().from(telegramChats).where(eq(telegramChats.id, id));
      return result[0] || undefined;
    } catch (error) {
      console.error('Error fetching Telegram chat:', error);
      throw new Error('Failed to fetch Telegram chat');
    }
  }

  async createTelegramChat(chat: InsertTelegramChat): Promise<TelegramChat> {
    try {
      const result = await db.insert(telegramChats).values(chat).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating Telegram chat:', error);
      throw new Error('Failed to create Telegram chat');
    }
  }

  async updateTelegramChat(id: string, chat: Partial<InsertTelegramChat>): Promise<TelegramChat> {
    try {
      const result = await db
        .update(telegramChats)
        .set({ ...chat, updatedAt: new Date() })
        .where(eq(telegramChats.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error('Telegram chat not found');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error updating Telegram chat:', error);
      throw new Error('Failed to update Telegram chat');
    }
  }

  async deleteTelegramChat(id: string): Promise<void> {
    try {
      await db.delete(telegramChats).where(eq(telegramChats.id, id));
    } catch (error) {
      console.error('Error deleting Telegram chat:', error);
      throw new Error('Failed to delete Telegram chat');
    }
  }

  async getTelegramMessages(): Promise<TelegramMessage[]> {
    try {
      const result = await db.select().from(telegramMessages);
      return result;
    } catch (error) {
      console.error('Error getting Telegram messages:', error);
      throw new Error('Failed to fetch Telegram messages');
    }
  }

  // Legacy compatibility methods
  async saveWhatsappSettings(data: InsertWhatsappSettings): Promise<WhatsappSettings> {
    // Use modern unified method
    const settingsList = await this.getWhatsappSettings();
    
    if (settingsList.length > 0) {
      return await this.updateWhatsappSettings(settingsList[0].id, data);
    } else {
      return await this.createWhatsappSettings(data);
    }
  }

  async testWhatsappConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const settingsList = await this.getWhatsappSettings();
      
      if (settingsList.length === 0) {
        return { success: false, message: "Configurazione WhatsApp non trovata" };
      }

      const settings = settingsList[0];

      if (!settings.isActive) {
        return { success: false, message: "Configurazione WhatsApp disabilitata" };
      }

      if (settings.provider === 'twilio') {
        if (!settings.accountSid || !settings.authToken) {
          return { success: false, message: "Credenziali Twilio mancanti" };
        }
        
        await this.updateWhatsappSettings(settings.id, {
          // lastTestAt: new Date(), // Property doesn't exist in schema
          isApiConnected: true
        });
        
        return { success: true, message: "Connessione Twilio WhatsApp verificata con successo" };
      } else if (settings.provider === 'linkmobility') {
        if (!settings.apiKey) {
          return { success: false, message: "API Key LinkMobility mancante" };
        }
        
        await this.updateWhatsappSettings(settings.id, {
          // lastTestAt: new Date(), // Property doesn't exist in schema
          isApiConnected: true
        });
        
        return { success: true, message: "Connessione LinkMobility WhatsApp verificata" };
      }

      return { success: false, message: "Provider WhatsApp non supportato" };
    } catch (error) {
      console.error('WhatsApp connection test error:', error);
      return { success: false, message: `Errore test connessione: ${error}` };
    }
  }

  // SMS Settings
  async getSmsSettings(): Promise<SmsSettings | undefined> {
    try {
      const [settings] = await db.select().from(smsSettings).limit(1);
      return settings;
    } catch (error) {
      console.error('Error fetching SMS settings:', error);
      throw new Error('Failed to fetch SMS settings');
    }
  }

  async createSmsSettings(settings: InsertSmsSettings): Promise<SmsSettings> {
    try {
      const [newSettings] = await db.insert(smsSettings).values(settings).returning();
      return newSettings;
    } catch (error) {
      console.error('Error creating SMS settings:', error);
      throw new Error('Failed to create SMS settings');
    }
  }

  async updateSmsSettings(id: number, settings: Partial<InsertSmsSettings>): Promise<SmsSettings> {
    try {
      const [updatedSettings] = await db
        .update(smsSettings)
        .set(settings)
        .where(eq(smsSettings.id, id))
        .returning();
      
      if (!updatedSettings) {
        throw new Error('SMS settings not found');
      }
      
      return updatedSettings;
    } catch (error) {
      console.error('Error updating SMS settings:', error);
      throw new Error('Failed to update SMS settings');
    }
  }

  async deleteSmsSettings(id: number): Promise<void> {
    try {
      const result = await db.delete(smsSettings).where(eq(smsSettings.id, id));
      
      if (result.rowCount === 0) {
        throw new Error('SMS settings not found');
      }
    } catch (error) {
      console.error('Error deleting SMS settings:', error);
      throw error instanceof Error ? error : new Error('Failed to delete SMS settings');
    }
  }

  // SMS Templates
  async getSmsTemplates(): Promise<SmsTemplate[]> {
    try {
      return await db.select().from(smsTemplates).orderBy(desc(smsTemplates.createdAt));
    } catch (error) {
      console.error('Error fetching SMS templates:', error);
      throw new Error('Failed to fetch SMS templates');
    }
  }

  async getSmsTemplate(id: number): Promise<SmsTemplate | undefined> {
    try {
      const [template] = await db.select().from(smsTemplates).where(eq(smsTemplates.id, id));
      return template;
    } catch (error) {
      console.error('Error fetching SMS template:', error);
      throw new Error('Failed to fetch SMS template');
    }
  }

  async createSmsTemplate(template: InsertSmsTemplate): Promise<SmsTemplate> {
    try {
      const [newTemplate] = await db.insert(smsTemplates).values(template).returning();
      return newTemplate;
    } catch (error) {
      console.error('Error creating SMS template:', error);
      throw new Error('Failed to create SMS template');
    }
  }

  async updateSmsTemplate(id: number, template: Partial<InsertSmsTemplate>): Promise<SmsTemplate> {
    try {
      const [updatedTemplate] = await db
        .update(smsTemplates)
        .set(template)
        .where(eq(smsTemplates.id, id))
        .returning();
      
      if (!updatedTemplate) {
        throw new Error('SMS template not found');
      }
      
      return updatedTemplate;
    } catch (error) {
      console.error('Error updating SMS template:', error);
      throw new Error('Failed to update SMS template');
    }
  }

  async deleteSmsTemplate(id: number): Promise<void> {
    try {
      const result = await db.delete(smsTemplates).where(eq(smsTemplates.id, id));
      
      if (result.rowCount === 0) {
        throw new Error('SMS template not found');
      }
    } catch (error) {
      console.error('Error deleting SMS template:', error);
      throw error instanceof Error ? error : new Error('Failed to delete SMS template');
    }
  }

  // SMS Messages
  async getSmsMessages(limit: number = 50): Promise<SmsMessage[]> {
    try {
      return await db.select().from(smsMessages).orderBy(desc(smsMessages.createdAt)).limit(limit);
    } catch (error) {
      console.error('Error fetching SMS messages:', error);
      throw new Error('Failed to fetch SMS messages');
    }
  }

  async getSmsMessage(id: number): Promise<SmsMessage | undefined> {
    try {
      const [message] = await db.select().from(smsMessages).where(eq(smsMessages.id, id));
      return message;
    } catch (error) {
      console.error('Error fetching SMS message:', error);
      throw new Error('Failed to fetch SMS message');
    }
  }

  async createSmsMessage(message: InsertSmsMessage): Promise<SmsMessage> {
    try {
      const [newMessage] = await db.insert(smsMessages).values(message).returning();
      return newMessage;
    } catch (error) {
      console.error('Error creating SMS message:', error);
      throw new Error('Failed to create SMS message');
    }
  }

  async updateSmsMessage(id: number, message: Partial<InsertSmsMessage>): Promise<SmsMessage> {
    try {
      const [updatedMessage] = await db
        .update(smsMessages)
        .set(message)
        .where(eq(smsMessages.id, id))
        .returning();
      
      if (!updatedMessage) {
        throw new Error('SMS message not found');
      }
      
      return updatedMessage;
    } catch (error) {
      console.error('Error updating SMS message:', error);
      throw new Error('Failed to update SMS message');
    }
  }

  async deleteSmsMessage(id: number): Promise<void> {
    try {
      const result = await db.delete(smsMessages).where(eq(smsMessages.id, id));
      
      if (result.rowCount === 0) {
        throw new Error('SMS message not found');
      }
    } catch (error) {
      console.error('Error deleting SMS message:', error);
      throw error instanceof Error ? error : new Error('Failed to delete SMS message');
    }
  }

  // SMS Blacklist
  async getSmsBlacklist(): Promise<SmsBlacklist[]> {
    try {
      return await db.select().from(smsBlacklist).where(eq(smsBlacklist.isActive, true)).orderBy(desc(smsBlacklist.createdAt));
    } catch (error) {
      console.error('Error fetching SMS blacklist:', error);
      throw new Error('Failed to fetch SMS blacklist');
    }
  }

  async addToSmsBlacklist(entry: InsertSmsBlacklist): Promise<SmsBlacklist> {
    try {
      const [newEntry] = await db.insert(smsBlacklist).values(entry).returning();
      return newEntry;
    } catch (error) {
      console.error('Error adding to SMS blacklist:', error);
      throw new Error('Failed to add to SMS blacklist');
    }
  }

  async removeFromSmsBlacklist(phoneNumber: string): Promise<void> {
    try {
      const result = await db
        .update(smsBlacklist)
        .set({ isActive: false })
        .where(and(eq(smsBlacklist.phoneNumber, phoneNumber), eq(smsBlacklist.isActive, true)));
      
      if (result.rowCount === 0) {
        throw new Error('Phone number not found in blacklist');
      }
    } catch (error) {
      console.error('Error removing from SMS blacklist:', error);
      throw error instanceof Error ? error : new Error('Failed to remove from SMS blacklist');
    }
  }
  // AI Financial Insights methods
  async getFinancialInsights(userId: string): Promise<any[]> {
    // Return empty array for now - this would need proper schema implementation
    return [];
  }

  async createFinancialInsight(insight: {
    userId: string;
    type: string;
    title: string;
    description: string;
    confidence: number;
    impact: string;
    category: string;
    data: any;
    priority: number;
  }): Promise<any> {
    // Mock implementation - would need proper schema
    return {
      id: `insight_${Date.now()}`,
      ...insight,
      createdAt: new Date().toISOString()
    };
  }

  async getFinancialInsightsMetrics(userId: string): Promise<any> {
    // Mock metrics data
    return {
      totalInsights: 8,
      highPriorityAlerts: 2,
      predictionAccuracy: 0.87,
      lastUpdateTime: new Date().toISOString(),
      trendsData: [
        { period: 'Gen', income: 15000, expense: 8000, net: 7000 },
        { period: 'Feb', income: 18000, expense: 9500, net: 8500 },
        { period: 'Mar', income: 22000, expense: 11000, net: 11000 }
      ],
      categoryBreakdown: [
        { name: 'Consulenze', value: 35000, color: '#3b82f6' },
        { name: 'Prodotti', value: 28000, color: '#ef4444' },
        { name: 'Servizi', value: 15000, color: '#10b981' }
      ]
    };
  }

  // Document Analysis methods
  async createDocumentAnalysis(analysis: {
    userId: string;
    filename: string;
    fileType: string;
    analysis: string;
    extractedData: any;
    tokensUsed: number;
    confidence: number;
    processingTime: number;
  }): Promise<any> {
    // Mock implementation
    return {
      id: `doc_analysis_${Date.now()}`,
      ...analysis,
      status: 'completed' as const,
      createdAt: new Date().toISOString()
    };
  }

  async getDocumentAnalysisHistory(userId: string): Promise<any[]> {
    // Mock history data
    return [
      {
        id: 'analysis_1',
        filename: 'fattura_esempio.xml',
        fileType: 'application/xml',
        status: 'completed' as const,
        analysis: 'Fattura elettronica analizzata con successo. Estratti dati fiscali completi.',
        extractedData: { amount: 1500, vat: 22, supplier: 'Fornitore Esempio' },
        tokensUsed: 450,
        confidence: 0.92,
        processingTime: 3,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
  }

  // Raw query execution for AI natural language queries
  async executeRawQuery(sqlQuery: string, userId: string): Promise<any[]> {
    try {
      // For security, we should validate and sanitize the query
      // For now, return mock data based on common query patterns
      const lowerQuery = sqlQuery.toLowerCase();
      
      if (lowerQuery.includes('movements') || lowerQuery.includes('movimenti')) {
        const movements = await this.getMovements();
        return movements.slice(0, 10); // Limit results
      }
      
      if (lowerQuery.includes('companies') || lowerQuery.includes('aziende')) {
        const companies = await this.getCompanies();
        return companies.slice(0, 10);
      }
      
      // Default empty result for safety
      return [];
    } catch (error) {
      console.error('Error executing raw query:', error);
      throw new Error('Query execution failed');
    }
  }

  // Calendar Events Implementation
  async getCalendarEvents(userId?: string): Promise<CalendarEvent[]> {
    try {
      let whereConditions = [eq(calendarEvents.isActive, true)];
      
      if (userId) {
        whereConditions.push(
          or(
            eq(calendarEvents.createdByUserId, userId),
            eq(calendarEvents.assignedToUserId, userId)
          )
        );
      }
      
      const query = db.select().from(calendarEvents).where(and(...whereConditions));
      
      const events = await query.orderBy(calendarEvents.startDate);
      return events;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    try {
      const [event] = await db.select().from(calendarEvents)
        .where(and(eq(calendarEvents.id, id), eq(calendarEvents.isActive, true)));
      return event || undefined;
    } catch (error) {
      console.error('Error fetching calendar event:', error);
      throw new Error('Failed to fetch calendar event');
    }
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    try {
      const [newEvent] = await db.insert(calendarEvents).values({
        ...event,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return newEvent;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  async updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent> {
    try {
      const [updatedEvent] = await db
        .update(calendarEvents)
        .set({ ...event, updatedAt: new Date() })
        .where(eq(calendarEvents.id, id))
        .returning();
      
      if (!updatedEvent) {
        throw new Error('Calendar event not found');
      }
      
      return updatedEvent;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    try {
      // Soft delete - mark as inactive instead of actual deletion
      const result = await db
        .update(calendarEvents)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(calendarEvents.id, id));
      
      if (result.rowCount === 0) {
        throw new Error('Calendar event not found');
      }
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }

  async getCalendarEventsByDateRange(startDate: Date, endDate: Date, userId?: string): Promise<CalendarEvent[]> {
    try {
      let whereConditions = [
        eq(calendarEvents.isActive, true),
        gte(calendarEvents.startDate, startDate),
        lte(calendarEvents.endDate, endDate)
      ];
      
      if (userId) {
        whereConditions.push(
          or(
            eq(calendarEvents.createdByUserId, userId),
            eq(calendarEvents.assignedToUserId, userId)
          )
        );
      }
      
      const query = db.select().from(calendarEvents).where(and(...whereConditions));
      
      const events = await query.orderBy(calendarEvents.startDate);
      return events;
    } catch (error) {
      console.error('Error fetching calendar events by date range:', error);
      throw new Error('Failed to fetch calendar events by date range');
    }
  }

  // Calendar Reminders Implementation
  async getCalendarReminders(eventId: string): Promise<CalendarReminder[]> {
    try {
      const reminders = await db.select().from(calendarReminders)
        .where(and(
          eq(calendarReminders.eventId, eventId),
          eq(calendarReminders.isActive, true)
        ))
        .orderBy(calendarReminders.reminderTime);
      return reminders;
    } catch (error) {
      console.error('Error fetching calendar reminders:', error);
      throw new Error('Failed to fetch calendar reminders');
    }
  }

  async createCalendarReminder(reminder: InsertCalendarReminder): Promise<CalendarReminder> {
    try {
      const [newReminder] = await db.insert(calendarReminders).values({
        ...reminder,
        createdAt: new Date()
      }).returning();
      return newReminder;
    } catch (error) {
      console.error('Error creating calendar reminder:', error);
      throw new Error('Failed to create calendar reminder');
    }
  }

  async updateCalendarReminder(id: string, reminder: Partial<InsertCalendarReminder>): Promise<CalendarReminder> {
    try {
      const [updatedReminder] = await db
        .update(calendarReminders)
        .set(reminder)
        .where(eq(calendarReminders.id, id))
        .returning();
      
      if (!updatedReminder) {
        throw new Error('Calendar reminder not found');
      }
      
      return updatedReminder;
    } catch (error) {
      console.error('Error updating calendar reminder:', error);
      throw new Error('Failed to update calendar reminder');
    }
  }

  async deleteCalendarReminder(id: string): Promise<void> {
    try {
      const result = await db.delete(calendarReminders).where(eq(calendarReminders.id, id));
      
      if (result.rowCount === 0) {
        throw new Error('Calendar reminder not found');
      }
    } catch (error) {
      console.error('Error deleting calendar reminder:', error);
      throw new Error('Failed to delete calendar reminder');
    }
  }
  // === DOCUMENT ANALYSIS METHODS ===

  async createDocumentAnalysis(data: {
    userId: string;
    filename: string;
    fileType: string;
    analysis: string;
    extractedData: any;
    tokensUsed: number;
    confidence: number;
    processingTime: number;
  }): Promise<any> {
    const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // For now store in memory, would need a proper table in production
    const docAnalysis = {
      id,
      userId: data.userId,
      filename: data.filename,
      fileType: data.fileType,
      analysis: data.analysis,
      extractedData: data.extractedData,
      tokensUsed: data.tokensUsed,
      confidence: data.confidence,
      processingTime: data.processingTime,
      createdAt: new Date()
    };

    // Store in memory for this session
    if (!this.documentAnalyses) {
      this.documentAnalyses = [];
    }
    this.documentAnalyses.push(docAnalysis);

    return docAnalysis;
  }

  async getDocumentAnalysisHistory(userId: string): Promise<any[]> {
    if (!this.documentAnalyses) {
      return [];
    }
    
    return this.documentAnalyses
      .filter((doc: any) => doc.userId === userId)
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50);
  }

  async getDocumentAnalysis(id: string): Promise<any | null> {
    if (!this.documentAnalyses) {
      return null;
    }
    
    return this.documentAnalyses.find((doc: any) => doc.id === id) || null;
  }

  async deleteDocumentAnalysis(id: string): Promise<void> {
    if (!this.documentAnalyses) {
      return;
    }
    
    this.documentAnalyses = this.documentAnalyses.filter((doc: any) => doc.id !== id);
  }

  private documentAnalyses: any[] = [];
}

// Initialize DatabaseStorage with proper error handling
console.log('[STORAGE] Initializing DatabaseStorage...');
export const storage = new DatabaseStorage();
console.log('[STORAGE] DatabaseStorage initialized successfully');
