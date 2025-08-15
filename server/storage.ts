import {
  companies, cores, resources, ibans, offices, tags, movementStatuses, movementReasons, movements, users, notifications, suppliers, customers, emailSettings, passwordResetTokens, sendgridTemplates,
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
  type AiSettings, type InsertAiSettings,
  type AiChatHistory, type InsertAiChatHistory,
  type AiDocumentJob, type InsertAiDocumentJob,
  type SecuritySettings, type InsertSecuritySettings,
  type LoginAuditLog, type ActiveSession, type PasswordHistory, type TwoFactorAuth
} from "@shared/schema";
import crypto from 'crypto';
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, count, or, isNull, isNotNull } from "drizzle-orm";
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
  getMovement(id: string): Promise<MovementWithRelations | undefined>;
  createMovement(movement: InsertMovement): Promise<Movement>;
  updateMovement(id: string, movement: Partial<InsertMovement>): Promise<Movement>;
  deleteMovement(id: string): Promise<void>;

  // Analytics
  getMovementStats(period?: { startDate: string; endDate: string }): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    totalMovements: number;
    pendingMovements: number;
  }>;
  getCashFlowData(days: number): Promise<Array<{
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

  // Session store per autenticazione
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
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
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, id),
        with: {
          cores: true,
          resources: true,
          ibans: true,
          offices: true,
        },
      });
      return company || undefined;
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

      const results = await db.query.movements.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
          company: true,
          core: true,
          reason: true,
          resource: true,
          office: true,
          iban: true,
          tag: true,
          status: true,
          supplier: true,
        },
        orderBy: [desc(movements.flowDate), desc(movements.createdAt)],
      });
      return results as MovementWithRelations[];
    } catch (error) {
      console.error('Error fetching movements:', error);
      throw new Error('Failed to fetch movements');
    }
  }

  async getMovement(id: string): Promise<MovementWithRelations | undefined> {
    try {
      const movement = await db.query.movements.findFirst({
        where: eq(movements.id, id),
        with: {
          company: true,
          core: true,
          reason: true,
          resource: true,
          office: true,
          iban: true,
          tag: true,
          status: true,
          supplier: true,
        },
      });
      return movement ? (movement as MovementWithRelations) : undefined;
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
        .set({ isRead: true })
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
        .set({ isRead: true })
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
  async getFilteredMovements(user: any, filters: any, page: number = 1, pageSize: number = 25): Promise<{
    data: any[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      // Use the existing getMovements method as a base to avoid complex join issues
      const allMovements = await this.getMovements();
      console.log('Analytics - All movements result:', { 
        hasData: !!allMovements,
        dataLength: Array.isArray(allMovements) ? allMovements.length : 'not array',
        isArray: Array.isArray(allMovements)
      });
      
      // Apply filters manually - ensure we have valid data
      // getMovements returns array directly, not {data: []}
      let filteredMovements = Array.isArray(allMovements) ? allMovements : [];
      console.log('Analytics - Initial filtered movements:', filteredMovements.length);
      
      // Safety check
      if (!Array.isArray(filteredMovements)) {
        console.log('Warning: filteredMovements is not an array:', filteredMovements);
        filteredMovements = [];
      }

      // Apply role-based filtering
      console.log('Analytics - User role:', user.role, 'resourceId:', user.resourceId);
      if (user.role === 'user' && user.resourceId) {
        const beforeFilter = filteredMovements.length;
        filteredMovements = filteredMovements.filter(m => m.resourceId === user.resourceId);
        console.log(`Analytics - Role filter: ${beforeFilter} -> ${filteredMovements.length}`);
      }

      // Log filter details
      console.log('Analytics - Applied filters:', filters);

      // Apply date filters only if they are actually specified
      // Skip empty string, null, undefined filters
      const hasValidDateFrom = (filters.insertDateFrom || filters.createdDateFrom) && 
                               (filters.insertDateFrom || filters.createdDateFrom) !== '';
      const hasValidDateTo = (filters.insertDateTo || filters.createdDateTo) && 
                            (filters.insertDateTo || filters.createdDateTo) !== '';
      
      if (hasValidDateFrom) {
        const beforeFilter = filteredMovements.length;
        const dateFrom = filters.insertDateFrom || filters.createdDateFrom;
        const startDate = new Date(dateFrom);
        filteredMovements = filteredMovements.filter(m => new Date(m.createdAt) >= startDate);
        console.log(`Analytics - Insert date from filter (${dateFrom}): ${beforeFilter} -> ${filteredMovements.length}`);
      } else {
        console.log('Analytics - No valid date from filter, skipping');
      }
      
      if (hasValidDateTo) {
        const beforeFilter = filteredMovements.length;
        const dateTo = filters.insertDateTo || filters.createdDateTo;
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filteredMovements = filteredMovements.filter(m => new Date(m.createdAt) <= endDate);
        console.log(`Analytics - Insert date to filter (${dateTo}): ${beforeFilter} -> ${filteredMovements.length}`);
      } else {
        console.log('Analytics - No valid date to filter, skipping');
      }
      if (filters.flowDateFrom && filters.flowDateFrom !== '') {
        const beforeFilter = filteredMovements.length;
        const startDate = new Date(filters.flowDateFrom);
        filteredMovements = filteredMovements.filter(m => new Date(m.flowDate) >= startDate);
        console.log(`Analytics - Flow date from filter: ${beforeFilter} -> ${filteredMovements.length}`);
      }
      if (filters.flowDateTo && filters.flowDateTo !== '') {
        const beforeFilter = filteredMovements.length;
        const endDate = new Date(filters.flowDateTo);
        endDate.setHours(23, 59, 59, 999);
        filteredMovements = filteredMovements.filter(m => new Date(m.flowDate) <= endDate);
        console.log(`Analytics - Flow date to filter: ${beforeFilter} -> ${filteredMovements.length}`);
      }

      // Apply entity filters
      if (filters.companyId) {
        filteredMovements = filteredMovements.filter(m => m.companyId === filters.companyId);
      }
      if (filters.officeId) {
        filteredMovements = filteredMovements.filter(m => m.officeId === filters.officeId);
      }
      if (filters.resourceId) {
        filteredMovements = filteredMovements.filter(m => m.resourceId === filters.resourceId);
      }
      if (filters.coreId) {
        filteredMovements = filteredMovements.filter(m => m.coreId === filters.coreId);
      }
      if (filters.ibanId) {
        filteredMovements = filteredMovements.filter(m => m.ibanId === filters.ibanId);
      }
      if (filters.statusId) {
        filteredMovements = filteredMovements.filter(m => m.statusId === filters.statusId);
      }
      if (filters.reasonId) {
        filteredMovements = filteredMovements.filter(m => m.reasonId === filters.reasonId);
      }
      if (filters.supplierId) {
        filteredMovements = filteredMovements.filter(m => m.supplierId === filters.supplierId);
      }

      // Apply type filter
      if (filters.type) {
        filteredMovements = filteredMovements.filter(m => m.type === filters.type);
      }

      // Apply amount filters
      if (filters.amountFrom) {
        filteredMovements = filteredMovements.filter(m => parseFloat(m.amount) >= parseFloat(filters.amountFrom));
      }
      if (filters.amountTo) {
        filteredMovements = filteredMovements.filter(m => parseFloat(m.amount) <= parseFloat(filters.amountTo));
      }

      // Apply VAT filters
      if (filters.vatType) {
        filteredMovements = filteredMovements.filter(m => m.vatType === filters.vatType);
      }
      if (filters.hasVat !== undefined) {
        if (filters.hasVat) {
          filteredMovements = filteredMovements.filter(m => m.vatAmount && m.vatAmount !== '');
        } else {
          filteredMovements = filteredMovements.filter(m => !m.vatAmount || m.vatAmount === '');
        }
      }

      // Sort by flow date (newest first)
      filteredMovements.sort((a, b) => new Date(b.flowDate).getTime() - new Date(a.flowDate).getTime());

      // Apply pagination
      const totalCount = filteredMovements.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = filteredMovements.slice(startIndex, endIndex);

      return {
        data: paginatedData,
        totalCount,
        totalPages,
        currentPage: page,
      };
    } catch (error) {
      console.error('Error fetching filtered movements:', error);
      throw new Error('Failed to fetch filtered movements');
    }
  }

  async exportFilteredMovements(user: any, filters: any, format: string = 'csv'): Promise<string> {
    try {
      // Get all movements (no pagination for export)
      const result = await this.getFilteredMovements(user, filters, 1, 10000);
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
      const result = await db.insert(aiSettings).values([settings]).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating AI settings:', error);
      throw new Error('Failed to create AI settings');
    }
  }

  async updateAiSettings(userId: string, settings: Partial<InsertAiSettings>): Promise<AiSettings> {
    try {
      const result = await db.update(aiSettings)
        .set({ ...settings, updatedAt: new Date() })
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
          title: sql<string>`CASE 
            WHEN ${aiChatHistory.sessionId} IS NOT NULL 
            THEN CONCAT('Chat ', SUBSTRING(${aiChatHistory.sessionId}, 1, 8))
            ELSE 'Conversazione'
          END`,
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
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
