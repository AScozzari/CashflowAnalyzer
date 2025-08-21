import type { Express } from "express";
import { createServer, type Server } from "http";
// Storage will be imported dynamically to avoid circular dependency
import { aiService } from "./ai-service";
import { eq, desc, sum, count, sql } from "drizzle-orm";
import { bankTransactions, movements } from "@shared/schema";
import { 
  insertCompanySchema, insertCoreSchema, insertResourceSchema,
  insertIbanSchema, insertOfficeSchema, insertTagSchema,
  insertMovementStatusSchema, insertMovementReasonSchema, insertMovementSchema,
  insertNotificationSchema, insertSupplierSchema, insertCustomerSchema, insertEmailSettingsSchema,
  insertUserSchema, passwordResetSchema, resetPasswordSchema, insertSendgridTemplateSchema,
  insertWhatsappSettingsSchema, insertWhatsappTemplateSchema,
  insertSmsSettingsSchema, insertSmsTemplateSchema, insertSmsMessageSchema
} from "@shared/schema";
import { emailService } from './email-service';
import { SendGridTemplateService } from './sendgrid-templates';
import { sendGridService } from './services/sendgrid-enhanced';
import { setupAuth } from "./auth";
import { loginLimiter, apiLimiter, securityLogger, securityHeaders, sanitizeInput, sessionSecurity } from "./security-middleware";
import { WebhookRouter } from './webhook-manager';
import { setupWhatsAppRoutes } from './routes/whatsapp';
import { setupTelegramRoutes } from './routes/telegram';
import multer from 'multer';
import type { Request } from 'express';
import path from 'path';
import { z } from 'zod';
import fs from 'fs';
import { xmlInvoiceParser, type MovementSuggestion } from './xml-invoice-parser';
import { systemService } from './services/system-service';

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|xml/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'text/xml' || file.mimetype === 'application/xml';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, PNG, XML are allowed.'));
    }
  }
});

// Error handler middleware
const handleAsyncErrors = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Authentication middleware will be provided by setupAuth

// Helper function to create notifications based on user roles
async function createMovementNotifications(movementId: string, type: 'new_movement' | 'movement_updated', createdByUserId?: string) {
  try {
    const { storage } = await import('./storage');
    const users = await storage.getUsers();
    const movement = await storage.getMovement(movementId);
    
    if (!movement) return;
    
    for (const user of users) {
      // Skip notification for the user who created/updated the movement
      if (user.id === createdByUserId) continue;
      
      let shouldNotify = false;
      let title = '';
      let message = '';
      
      if (user.role === 'admin' || user.role === 'finance') {
        // Admin and Finance see all new movements
        shouldNotify = true;
        title = type === 'new_movement' ? 'Nuovo movimento inserito' : 'Movimento aggiornato';
        message = `${movement.type === 'income' ? 'Entrata' : 'Uscita'} di €${movement.amount} - ${movement.documentNumber || 'N/A'}`;
      } else if (user.role === 'user' && movement.resourceId === user.resourceId) {
        // Users only see movements assigned to their resource
        shouldNotify = true;
        title = type === 'new_movement' ? 'Movimento assegnato' : 'Movimento aggiornato';
        message = `Ti è stato assegnato un movimento: ${movement.type === 'income' ? 'Entrata' : 'Uscita'} di €${movement.amount}`;
      }
      
      if (shouldNotify) {
        await storage.createNotification({
          userId: user.id,
          movementId: movementId,
          type: type,
          title: title,
          message: message,
          isRead: false
        });
      }
    }
  } catch (error) {
    console.error('Error creating movement notifications:', error);
    // Don't throw error to avoid breaking the main movement operation
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ==================== MULTI-CHANNEL WEBHOOK SYSTEM ====================
  
  // Initialize and setup webhook system for all channels
  const { WebhookRouter, storage } = await import('./webhook-manager');
  WebhookRouter.initializeAI(storage);
  WebhookRouter.setupRoutes(app);
  
  console.log('✅ Multi-Channel Webhook System initialized:');
  console.log('   • WhatsApp: Twilio + LinkMobility (AI-powered)');
  console.log('   • SMS: Skebby (AI-powered)');
  console.log('   • Email: SendGrid (AI-powered)');
  console.log('   • Messenger: Facebook (AI-powered)');

  // Security middleware globali
  // Security headers applied selectively (X-Frame-Options handled in main index.ts)
  app.use((req, res, next) => {
    // Prevenzione XSS
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // HSTS (solo in produzione con HTTPS)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    // CSP with iframe support
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: ws: *.replit.dev *.repl.co; frame-ancestors 'self' *.replit.dev *.repl.co");
    
    // X-Frame-Options NOT set here - handled in main index.ts
    next();
  });
  app.use(securityLogger);
  app.use(sanitizeInput);
  app.use(sessionSecurity);
  
  // Rate limiting per API
  app.use('/api', apiLimiter);
  
  // Setup authentication
  const { requireAuth, requireRole } = setupAuth(app);
  


  // Import storage dynamically to avoid circular dependency
  console.log('[DEBUG] Loading storage module dynamically...');
  const storageModule = await import('./storage');
  const dbStorage = storageModule.storage;
  console.log('[DEBUG] Storage loaded successfully:', !!dbStorage, typeof dbStorage);
  
  if (!dbStorage) {
    throw new Error('[ROUTES] Storage is undefined after dynamic import');
  }

  // Debug middleware for API routes
  app.use('/api', (req, res, next) => {
    console.log(`API Request: ${req.method} ${req.path}`);
    next();
  });
  // Companies
  app.get("/api/companies", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const companies = await dbStorage.getCompanies();
      res.json(companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  }));

  app.get("/api/companies/:id", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const company = await dbStorage.getCompanyWithRelations(req.params.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error('Error fetching company:', error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  }));

  app.post("/api/companies", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      const company = await dbStorage.createCompany(validatedData);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Error creating company:', error);
      res.status(500).json({ message: "Failed to create company" });
    }
  }));

  app.put("/api/companies/:id", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertCompanySchema.partial().parse(req.body);
      const company = await dbStorage.updateCompany(req.params.id, validatedData);
      res.json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Error updating company:', error);
      res.status(500).json({ message: "Failed to update company" });
    }
  }));

  app.delete("/api/companies/:id", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      await dbStorage.deleteCompany(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting company:', error);
      res.status(500).json({ message: "Failed to delete company" });
    }
  }));

  // Cores
  app.get("/api/cores", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { companyId } = req.query;
      const cores = companyId 
        ? await dbStorage.getCoresByCompany(companyId as string)
        : await dbStorage.getCores();
      res.json(cores);
    } catch (error) {
      console.error('Error fetching cores:', error);
      res.status(500).json({ message: "Failed to fetch cores" });
    }
  }));

  app.post("/api/cores", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertCoreSchema.parse(req.body);
      const core = await dbStorage.createCore(validatedData);
      res.status(201).json(core);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Error creating core:', error);
      res.status(500).json({ message: "Failed to create core" });
    }
  }));

  app.put("/api/cores/:id", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertCoreSchema.partial().parse(req.body);
      const core = await dbStorage.updateCore(req.params.id, validatedData);
      res.json(core);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Error updating core:', error);
      res.status(500).json({ message: "Failed to update core" });
    }
  }));

  app.delete("/api/cores/:id", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      await dbStorage.deleteCore(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting core:', error);
      res.status(500).json({ message: "Failed to delete core" });
    }
  }));

  // Resources
  app.get("/api/resources", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { companyId } = req.query;
      const resources = companyId 
        ? await dbStorage.getResourcesByCompany(companyId as string)
        : await dbStorage.getResources();
      res.json(resources);
    } catch (error) {
      console.error('Error fetching resources:', error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  }));

  app.post("/api/resources", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertResourceSchema.parse(req.body);
      const resource = await dbStorage.createResource(validatedData);
      res.status(201).json(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Error creating resource:', error);
      res.status(500).json({ message: "Failed to create resource" });
    }
  }));

  app.put("/api/resources/:id", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertResourceSchema.partial().parse(req.body);
      const resource = await dbStorage.updateResource(req.params.id, validatedData);
      res.json(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Error updating resource:', error);
      res.status(500).json({ message: "Failed to update resource" });
    }
  }));

  app.delete("/api/resources/:id", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      await dbStorage.deleteResource(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting resource:', error);
      res.status(500).json({ message: "Failed to delete resource" });
    }
  }));

  // Customers
  app.get("/api/customers", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const customers = await dbStorage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  }));

  // Suppliers
  app.get("/api/suppliers", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const suppliers = await dbStorage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  }));

  // IBANs
  app.get("/api/ibans", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { companyId } = req.query;
      const ibans = companyId 
        ? await dbStorage.getIbansByCompany(companyId as string)
        : await dbStorage.getIbans();
      res.json(ibans);
    } catch (error) {
      console.error('Error fetching IBANs:', error);
      res.status(500).json({ message: "Failed to fetch IBANs" });
    }
  }));

  app.post("/api/ibans", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      console.log('[IBAN SERVER] Dati ricevuti:', req.body);
      console.log('[IBAN SERVER] User:', req.user?.username, req.user?.role);
      const validatedData = insertIbanSchema.parse(req.body);
      console.log('[IBAN SERVER] Dati validati:', validatedData);
      const iban = await dbStorage.createIban(validatedData);
      console.log('[IBAN SERVER] IBAN creato con successo:', iban.id);
      res.status(201).json(iban);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[IBAN SERVER] Errore validazione Zod:', error.errors);
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('[IBAN SERVER] Errore creazione IBAN:', error);
      res.status(500).json({ message: "Failed to create IBAN" });
    }
  }));

  app.put("/api/ibans/:id", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertIbanSchema.partial().parse(req.body);
      const iban = await dbStorage.updateIban(req.params.id, validatedData);
      res.json(iban);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Error updating IBAN:', error);
      res.status(500).json({ message: "Failed to update IBAN" });
    }
  }));

  app.delete("/api/ibans/:id", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      await dbStorage.deleteIban(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting IBAN:', error);
      res.status(500).json({ message: "Failed to delete IBAN" });
    }
  }));

  // Offices
  app.get("/api/offices", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { companyId } = req.query;
      const offices = companyId 
        ? await dbStorage.getOfficesByCompany(companyId as string)
        : await dbStorage.getOffices();
      res.json(offices);
    } catch (error) {
      console.error('Error fetching offices:', error);
      res.status(500).json({ message: "Failed to fetch offices" });
    }
  }));

  app.post("/api/offices", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertOfficeSchema.parse(req.body);
      const office = await dbStorage.createOffice(validatedData);
      res.status(201).json(office);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Error creating office:', error);
      res.status(500).json({ message: "Failed to create office" });
    }
  }));

  app.put("/api/offices/:id", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertOfficeSchema.partial().parse(req.body);
      const office = await dbStorage.updateOffice(req.params.id, validatedData);
      res.json(office);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Error updating office:', error);
      res.status(500).json({ message: "Failed to update office" });
    }
  }));

  app.delete("/api/offices/:id", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      await dbStorage.deleteOffice(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting office:', error);
      res.status(500).json({ message: "Failed to delete office" });
    }
  }));

  // Tags
  app.get("/api/tags", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const tags = await dbStorage.getTags();
      res.json(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  }));

  app.post("/api/tags", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertTagSchema.parse(req.body);
      const tag = await dbStorage.createTag(validatedData);
      res.status(201).json(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Error creating tag:', error);
      res.status(500).json({ message: "Failed to create tag" });
    }
  }));

  app.put("/api/tags/:id", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertTagSchema.partial().parse(req.body);
      const tag = await dbStorage.updateTag(req.params.id, validatedData);
      res.json(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Error updating tag:', error);
      res.status(500).json({ message: "Failed to update tag" });
    }
  }));

  app.delete("/api/tags/:id", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      await dbStorage.deleteTag(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting tag:', error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  }));

  // Movement Statuses
  app.get("/api/movement-statuses", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const statuses = await dbStorage.getMovementStatuses();
      res.json(statuses);
    } catch (error) {
      console.error('Error fetching movement statuses:', error);
      res.status(500).json({ message: "Failed to fetch movement statuses" });
    }
  }));

  // Movement Reasons API
  app.get("/api/movement-reasons", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const reasons = await dbStorage.getMovementReasons();
      res.json(reasons);
    } catch (error) {
      console.error('Error fetching movement reasons:', error);
      res.status(500).json({ message: "Failed to fetch movement reasons" });
    }
  }));

  app.post("/api/movement-reasons", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertMovementReasonSchema.parse(req.body);
      const reason = await dbStorage.createMovementReason(validatedData);
      res.status(201).json(reason);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Error creating movement reason:', error);
      res.status(500).json({ message: "Failed to create movement reason" });
    }
  }));

  app.put("/api/movement-reasons/:id", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertMovementReasonSchema.partial().parse(req.body);
      const reason = await dbStorage.updateMovementReason(req.params.id, validatedData);
      res.json(reason);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Error updating movement reason:', error);
      res.status(500).json({ message: "Failed to update movement reason" });
    }
  }));

  app.delete("/api/movement-reasons/:id", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      await dbStorage.deleteMovementReason(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting movement reason:', error);
      res.status(500).json({ message: "Failed to delete movement reason" });
    }
  }));

  app.post("/api/movement-statuses", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertMovementStatusSchema.parse(req.body);
      const status = await dbStorage.createMovementStatus(validatedData);
      res.status(201).json(status);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Error creating movement status:', error);
      res.status(500).json({ message: "Failed to create movement status" });
    }
  }));

  app.put("/api/movement-statuses/:id", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertMovementStatusSchema.partial().parse(req.body);
      const status = await dbStorage.updateMovementStatus(req.params.id, validatedData);
      res.json(status);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Error updating movement status:', error);
      res.status(500).json({ message: "Failed to update movement status" });
    }
  }));

  app.delete("/api/movement-statuses/:id", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      await dbStorage.deleteMovementStatus(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting movement status:', error);
      res.status(500).json({ message: "Failed to delete movement status" });
    }
  }));

  // Movements
  app.get("/api/movements", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { page = 1, limit = 50, ...filters } = req.query;
      const user = req.user;
      
      const validFilters: any = {};
      if (filters.companyId) validFilters.companyId = filters.companyId as string;
      if (filters.coreId) validFilters.coreId = filters.coreId as string;
      if (filters.resourceId) validFilters.resourceId = filters.resourceId as string;
      if (filters.officeId) validFilters.officeId = filters.officeId as string;
      if (filters.statusId) validFilters.statusId = filters.statusId as string;
      if (filters.reasonId) validFilters.reasonId = filters.reasonId as string;
      if (filters.type && (filters.type === 'income' || filters.type === 'expense')) {
        validFilters.type = filters.type;
      }
      if (filters.startDate) validFilters.startDate = filters.startDate as string;
      if (filters.endDate) validFilters.endDate = filters.endDate as string;

      // Se l'utente ha ruolo "user", può vedere solo i movimenti della sua risorsa
      if (user.role === 'user' && user.resourceId) {
        validFilters.resourceId = user.resourceId;
      }

      const movements = await dbStorage.getMovements(validFilters);
      
      // Apply pagination
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      
      const paginatedMovements = movements.slice(startIndex, endIndex);
      
      res.json({
        data: paginatedMovements,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: movements.length,
          totalPages: Math.ceil(movements.length / limitNum)
        }
      });
    } catch (error) {
      console.error('Error fetching movements:', error);
      res.status(500).json({ message: "Failed to fetch movements" });
    }
  }));

  // Get filtered movements with advanced filters (dedicated endpoint for Movements page)
  app.get("/api/movements/filtered", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const user = req.user;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 25;
      
      console.log("[MOVEMENTS] Filtered request with params:", req.query);
      
      // Extract filters from query parameters
      const filters: any = {};
      
      // Date filters - supporto per insert date e flow date
      if (req.query.insertDateFrom) filters.insertDateFrom = req.query.insertDateFrom as string;
      if (req.query.insertDateTo) filters.insertDateTo = req.query.insertDateTo as string;
      if (req.query.flowDateFrom) filters.flowDateFrom = req.query.flowDateFrom as string;
      if (req.query.flowDateTo) filters.flowDateTo = req.query.flowDateTo as string;
      
      // Entity filters
      if (req.query.companyId) filters.companyId = req.query.companyId as string;
      if (req.query.coreId) filters.coreId = req.query.coreId as string;
      if (req.query.resourceId) filters.resourceId = req.query.resourceId as string;
      if (req.query.officeId) filters.officeId = req.query.officeId as string;
      
      // Movement filters
      if (req.query.type) filters.type = req.query.type as string;
      if (req.query.statusId) filters.statusId = req.query.statusId as string;
      if (req.query.reasonId) filters.reasonId = req.query.reasonId as string;
      if (req.query.ibanId) filters.ibanId = req.query.ibanId as string;
      
      // Amount filters
      if (req.query.amountFrom) filters.amountFrom = parseFloat(req.query.amountFrom as string);
      if (req.query.amountTo) filters.amountTo = parseFloat(req.query.amountTo as string);
      
      // External relations
      if (req.query.customerId) filters.customerId = req.query.customerId as string;
      if (req.query.supplierId) filters.supplierId = req.query.supplierId as string;
      
      // Document filter for reports
      if (req.query.hasDocument === 'true') filters.hasDocument = true;
      
      // VAT and documents
      if (req.query.vatType) filters.vatType = req.query.vatType as string;
      if (req.query.hasVat !== undefined) filters.hasVat = req.query.hasVat === 'true';
      if (req.query.hasDocument !== undefined) filters.hasDocument = req.query.hasDocument === 'true';
      
      // Tag filters
      if (req.query.tagIds && typeof req.query.tagIds === 'string') {
        filters.tagIds = req.query.tagIds.split(',').filter(id => id.trim());
      }

      // Se l'utente ha ruolo "user", può vedere solo i movimenti della sua risorsa
      if (user.role === 'user' && user.resourceId) {
        filters.resourceId = user.resourceId;
      }
      
      console.log("[MOVEMENTS] Applying filters:", filters);
      
      const movements = await dbStorage.getFilteredMovements(filters, page, pageSize);
      
      console.log("[MOVEMENTS] Filtered results:", movements?.data?.length || 0, "movements found");
      
      // Verifica che la risposta sia valida
      if (!movements || !movements.data || !movements.pagination) {
        console.error("[MOVEMENTS] Invalid response from getFilteredMovements:", movements);
        return res.status(500).json({ error: "Invalid movements data structure" });
      }
      
      // Assicura che la risposta sia nel formato corretto per il frontend
      res.json({
        data: movements.data,
        pagination: {
          page: movements.pagination.page,
          limit: movements.pagination.limit,
          total: movements.pagination.total,
          totalPages: movements.pagination.totalPages
        }
      });
    } catch (error) {
      console.error("Error fetching filtered movements:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }));

  app.get("/api/movements/:id", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const user = req.user;
      const movement = await dbStorage.getMovement(req.params.id);
      if (!movement) {
        return res.status(404).json({ message: "Movement not found" });
      }

      // Se l'utente ha ruolo "user", può vedere solo i movimenti della sua risorsa
      if (user.role === 'user' && user.resourceId && movement.resourceId !== user.resourceId) {
        return res.status(403).json({ message: "Access denied to this movement" });
      }

      res.json(movement);
    } catch (error) {
      console.error('Error fetching movement:', error);
      res.status(500).json({ message: "Failed to fetch movement" });
    }
  }));

  app.post("/api/movements", requireRole("admin", "finance"), upload.single('document'), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const movementData = {
        ...req.body,
        ...(req.file && { documentPath: req.file.path }),
      };
      
      const validatedData = insertMovementSchema.parse(movementData);
      const movement = await dbStorage.createMovement(validatedData);
      
      // Create notifications for new movement
      await createMovementNotifications(movement.id, 'new_movement', req.user.id);
      
      res.status(201).json(movement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Error creating movement:', error);
      res.status(500).json({ message: "Failed to create movement" });
    }
  }));

  app.put("/api/movements/:id", requireRole("admin", "finance"), upload.single('document'), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const updateData = {
        ...req.body,
        ...(req.file && { documentPath: req.file.path }),
      };
      const validatedData = insertMovementSchema.partial().parse(updateData);
      const movement = await dbStorage.updateMovement(req.params.id, validatedData);
      
      // Create notifications for updated movement
      await createMovementNotifications(movement.id, 'movement_updated', req.user.id);
      
      res.json(movement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Error updating movement:', error);
      res.status(500).json({ message: "Failed to update movement" });
    }
  }));

  app.delete("/api/movements/:id", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      await dbStorage.deleteMovement(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting movement:', error);
      res.status(500).json({ message: "Failed to delete movement" });
    }
  }));

  // Download movement document
  app.get("/api/movements/:id/document", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const movement = await dbStorage.getMovement(req.params.id);
      if (!movement) {
        return res.status(404).json({ message: "Movement not found" });
      }

      if (!movement.documentPath) {
        return res.status(404).json({ message: "No document attached to this movement" });
      }

      // Check if file exists
      
      if (!fs.existsSync(movement.documentPath)) {
        return res.status(404).json({ message: "Document file not found" });
      }

      // Get file info
      const fileName = path.basename(movement.documentPath);
      const fileExtension = path.extname(movement.documentPath);
      
      // Set appropriate headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream'); // getContentType(fileExtension);
      
      // Stream the file
      const fileStream = fs.createReadStream(movement.documentPath);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({ message: "Failed to download document" });
    }
  }));

  // Analytics
  app.get("/api/analytics/stats", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { startDate, endDate } = req.query;
      const user = req.user;
      let period;
      
      if (startDate && endDate) {
        // Validate date format
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
        
        period = {
          startDate: startDate as string,
          endDate: endDate as string,
        };
      }
      
      // User con role 'user' vedono solo gli analytics dei loro movimenti
      let resourceIdFilter = undefined;
      if (user.role === 'user' && user.resourceId) {
        resourceIdFilter = user.resourceId;
      }
      
      const stats = await dbStorage.getMovementStats(period, resourceIdFilter);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  }));

  app.get("/api/analytics/cash-flow", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const daysParam = req.query.days as string;
      const user = req.user;
      let days = 30;
      
      if (daysParam) {
        const parsedDays = parseInt(daysParam, 10);
        if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 365) {
          return res.status(400).json({ message: "Days must be between 1 and 365" });
        }
        days = parsedDays;
      }
      
      // User con role 'user' vedono solo i cash flow dei loro movimenti
      let resourceIdFilter = undefined;
      if (user.role === 'user' && user.resourceId) {
        resourceIdFilter = user.resourceId;
      }
      
      const data = await dbStorage.getCashFlowData(days, resourceIdFilter);
      res.json(data);
    } catch (error) {
      console.error('Error fetching cash flow data:', error);
      res.status(500).json({ message: "Failed to fetch cash flow data" });
    }
  }));

  // Dashboard endpoint - cashflow per tutti i movimenti del mese corrente (grafici)
  app.get("/api/analytics/cashflow", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const user = req.user;
      
      // Calcola il primo e ultimo giorno del mese corrente
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // User con role 'user' vedono solo i cash flow dei loro movimenti
      let resourceIdFilter = undefined;
      if (user.role === 'user' && user.resourceId) {
        resourceIdFilter = user.resourceId;
      }
      
      // Ottieni tutti i movimenti del mese corrente
      const filters: any = {
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0]
      };
      if (resourceIdFilter) {
        filters.resourceId = resourceIdFilter;
      }
      
      const movements = await dbStorage.getMovements(filters);
      
      // Raggruppa per giorno e calcola totali
      const dailyData: { [key: string]: { income: number; expenses: number; net: number } } = {};
      
      movements.forEach(movement => {
        const date = movement.flowDate.split('T')[0]; // YYYY-MM-DD
        if (!dailyData[date]) {
          dailyData[date] = { income: 0, expenses: 0, net: 0 };
        }
        
        const amount = parseFloat(movement.amount);
        if (movement.type === 'income') {
          dailyData[date].income += amount;
          dailyData[date].net += amount;
        } else {
          dailyData[date].expenses += amount;
          dailyData[date].net -= amount;
        }
      });
      
      // Converte in array ordinato per data
      const chartData = Object.entries(dailyData)
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
          ...data
        }))
        .sort((a, b) => {
          const dateA = a.date.split('/').reverse().join('-');
          const dateB = b.date.split('/').reverse().join('-');
          return dateA.localeCompare(dateB);
        });
      
      res.json(chartData);
    } catch (error) {
      console.error('Error fetching dashboard cashflow data:', error);
      res.status(500).json({ message: "Failed to fetch dashboard cashflow data" });
    }
  }));

  // Dashboard endpoint - TUTTI i movimenti del mese corrente per grafici
  app.get("/api/movements/recent", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const user = req.user;
      
      // Calcola il primo e ultimo giorno del mese corrente
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const filters: any = {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0]
      };
      
      // User con role 'user' vedono solo i loro movimenti
      if (user.role === 'user' && user.resourceId) {
        filters.resourceId = user.resourceId;
      }
      
      const movements = await dbStorage.getMovements(filters);
      
      // Ordina per data più recente - TUTTI i movimenti del mese corrente
      const currentMonthMovements = movements
        .sort((a, b) => new Date(b.flowDate).getTime() - new Date(a.flowDate).getTime());
      
      console.log(`[DASHBOARD] Found ${currentMonthMovements.length} movements for current month`);
      
      res.json(currentMonthMovements);
    } catch (error) {
      console.error('Error fetching recent movements:', error);
      res.status(500).json({ message: "Failed to fetch recent movements" });
    }
  }));

  // Setup communication routes
  setupWhatsAppRoutes(app);
  setupTelegramRoutes(app);

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
