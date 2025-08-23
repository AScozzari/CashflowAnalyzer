import type { Express } from "express";
import { createServer, type Server } from "http";
// Storage will be imported dynamically to avoid circular dependency
import { aiService } from "./ai-service";
import { fiscalAIService } from "./fiscal-ai-service";
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
import { setupSmsRoutes } from './routes/sms';
import aiInsightsRouter from './routes/ai-insights';
import aiAnomaliesRouter from './routes/ai-anomalies';
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
          category: 'movement',
          title: title,
          message: message,
          actionUrl: `/movements?view=${movementId}`,
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
  const { WebhookRouter } = await import('./webhook-manager');
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
  const storage = storageModule.storage;
  console.log('[DEBUG] Storage loaded successfully:', !!storage, typeof storage);
  
  if (!storage) {
    throw new Error('[ROUTES] Storage is undefined after dynamic import');
  }

  // Debug middleware for API routes
  app.use('/api', (req, res, next) => {
    console.log(`API Request: ${req.method} ${req.path}`);
    next();
  });

  // AI Routes
  app.use('/api/ai', aiInsightsRouter);
  app.use('/api/ai', aiAnomaliesRouter);
  // Companies
  app.get("/api/companies", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  }));

  app.get("/api/companies/:id", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const company = await storage.getCompanyWithRelations(req.params.id);
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
      const company = await storage.createCompany(validatedData);
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
      const company = await storage.updateCompany(req.params.id, validatedData);
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
      await storage.deleteCompany(req.params.id);
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
        ? await storage.getCoresByCompany(companyId as string)
        : await storage.getCores();
      res.json(cores);
    } catch (error) {
      console.error('Error fetching cores:', error);
      res.status(500).json({ message: "Failed to fetch cores" });
    }
  }));

  app.post("/api/cores", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertCoreSchema.parse(req.body);
      const core = await storage.createCore(validatedData);
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
      const core = await storage.updateCore(req.params.id, validatedData);
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
      await storage.deleteCore(req.params.id);
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
        ? await storage.getResourcesByCompany(companyId as string)
        : await storage.getResources();
      res.json(resources);
    } catch (error) {
      console.error('Error fetching resources:', error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  }));

  app.post("/api/resources", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource(validatedData);
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
      const resource = await storage.updateResource(req.params.id, validatedData);
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
      await storage.deleteResource(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting resource:', error);
      res.status(500).json({ message: "Failed to delete resource" });
    }
  }));

  // Customers
  app.get("/api/customers", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  }));

  // Suppliers
  app.get("/api/suppliers", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const suppliers = await storage.getSuppliers();
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
        ? await storage.getIbansByCompany(companyId as string)
        : await storage.getIbans();
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
      const iban = await storage.createIban(validatedData);
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
      const iban = await storage.updateIban(req.params.id, validatedData);
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
      await storage.deleteIban(req.params.id);
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
        ? await storage.getOfficesByCompany(companyId as string)
        : await storage.getOffices();
      res.json(offices);
    } catch (error) {
      console.error('Error fetching offices:', error);
      res.status(500).json({ message: "Failed to fetch offices" });
    }
  }));

  app.post("/api/offices", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertOfficeSchema.parse(req.body);
      const office = await storage.createOffice(validatedData);
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
      const office = await storage.updateOffice(req.params.id, validatedData);
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
      await storage.deleteOffice(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting office:', error);
      res.status(500).json({ message: "Failed to delete office" });
    }
  }));

  // Tags
  app.get("/api/tags", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  }));

  app.post("/api/tags", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(validatedData);
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
      const tag = await storage.updateTag(req.params.id, validatedData);
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
      await storage.deleteTag(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting tag:', error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  }));

  // Movement Statuses
  app.get("/api/movement-statuses", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const statuses = await storage.getMovementStatuses();
      res.json(statuses);
    } catch (error) {
      console.error('Error fetching movement statuses:', error);
      res.status(500).json({ message: "Failed to fetch movement statuses" });
    }
  }));

  // Movement Reasons API
  app.get("/api/movement-reasons", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const reasons = await storage.getMovementReasons();
      res.json(reasons);
    } catch (error) {
      console.error('Error fetching movement reasons:', error);
      res.status(500).json({ message: "Failed to fetch movement reasons" });
    }
  }));

  app.post("/api/movement-reasons", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertMovementReasonSchema.parse(req.body);
      const reason = await storage.createMovementReason(validatedData);
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
      const reason = await storage.updateMovementReason(req.params.id, validatedData);
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
      await storage.deleteMovementReason(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting movement reason:', error);
      res.status(500).json({ message: "Failed to delete movement reason" });
    }
  }));

  app.post("/api/movement-statuses", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertMovementStatusSchema.parse(req.body);
      const status = await storage.createMovementStatus(validatedData);
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
      const status = await storage.updateMovementStatus(req.params.id, validatedData);
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
      await storage.deleteMovementStatus(req.params.id);
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

      const movements = await storage.getMovements(validFilters);
      
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
        filters.tagIds = req.query.tagIds.split(',').filter((id: string) => id.trim());
      }

      // Se l'utente ha ruolo "user", può vedere solo i movimenti della sua risorsa
      if (user.role === 'user' && user.resourceId) {
        filters.resourceId = user.resourceId;
      }
      
      console.log("[MOVEMENTS] Applying filters:", filters);
      
      const movements = await storage.getFilteredMovements(filters, page, pageSize);
      
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
      const movement = await storage.getMovement(req.params.id);
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
      const movement = await storage.createMovement(validatedData);
      
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
      const movement = await storage.updateMovement(req.params.id, validatedData);
      
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
      await storage.deleteMovement(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting movement:', error);
      res.status(500).json({ message: "Failed to delete movement" });
    }
  }));

  // Download movement document
  app.get("/api/movements/:id/document", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const movement = await storage.getMovement(req.params.id);
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
      
      const stats = await storage.getMovementStats(period, resourceIdFilter);
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
      
      const data = await storage.getCashFlowData(days, resourceIdFilter);
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
      
      const movements = await storage.getMovements(filters);
      
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
      
      const movements = await storage.getMovements(filters);
      
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

  // ==================== BANKING APIs ====================
  
  // Banking verification stats
  app.get("/api/banking/verification-stats", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      
      // Get verification statistics from movements
      const movements = await storage.getMovements();
      const userMovements = movements.filter(m => req.user.role === 'admin' || m.companyId);
      
      const total = userMovements.length;
      const verified = userMovements.filter(m => m.isVerified).length;
      const pending = userMovements.filter(m => m.verificationStatus === 'pending').length;
      const matched = userMovements.filter(m => m.verificationStatus === 'matched').length;
      const partial = userMovements.filter(m => m.verificationStatus === 'partial').length;
      const noMatch = userMovements.filter(m => m.verificationStatus === 'no_match').length;
      
      const stats = {
        total,
        verified,
        pending,
        matched,
        partial,
        noMatch
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching banking verification stats:', error);
      res.status(500).json({ message: "Failed to fetch verification stats" });
    }
  }));
  
  // Banking sync single IBAN
  app.post("/api/banking/sync/:ibanId", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { ibanId } = req.params;
      
      // Mock sync result - in production this would sync with actual bank APIs
      const result = {
        synced: Math.floor(Math.random() * 10) + 1,
        matched: Math.floor(Math.random() * 5) + 1,
        errors: [],
        message: `Sincronizzazione IBAN ${ibanId} completata`
      };
      
      res.json(result);
    } catch (error) {
      console.error('Error syncing IBAN:', error);
      res.status(500).json({ error: "Failed to sync IBAN" });
    }
  }));
  
  // Banking sync all IBANs  
  app.post("/api/banking/sync-all", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      // Mock sync all result
      const result = {
        totalSynced: Math.floor(Math.random() * 50) + 10,
        totalMatched: Math.floor(Math.random() * 25) + 5,
        synced: Math.floor(Math.random() * 50) + 10,
        matched: Math.floor(Math.random() * 25) + 5,
        errors: [],
        message: "Sincronizzazione di tutti gli IBAN completata"
      };
      
      res.json(result);
    } catch (error) {
      console.error('Error syncing all IBANs:', error);
      res.status(500).json({ error: "Failed to sync all IBANs" });
    }
  }));

  // NOTIFICATIONS API - Missing routes
  app.get("/api/notifications", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined;
      const notifications = await storage.getNotifications(userId, isRead);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  }));

  app.get("/api/notifications/unread-count", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      // Get count manually since getUnreadNotificationsCount doesn't exist  
      const notifications = await storage.getNotifications(userId, false);
      const count = notifications.length;
      res.json({ count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  }));

  // Delete notification
  app.delete("/api/notifications/:id", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const notificationId = req.params.id;
      const userId = req.user.id;
      
      // Verify user owns this notification or is admin
      const notification = await storage.getNotifications(userId, undefined);
      const targetNotification = notification.find(n => n.id === notificationId);
      
      if (!targetNotification && req.user.role !== 'admin') {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      await storage.deleteNotification(notificationId);
      res.status(204).send(); // 204 No Content for successful delete
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  }));

  // Mark notification as read
  app.patch("/api/notifications/:id/read", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const notificationId = req.params.id;
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  }));

  // Mark all notifications as read
  app.put("/api/notifications/mark-all-read", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  }));

  // Recent communications activities for communications center
  app.get("/api/recent-activities", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      
      // Get all communication notifications (not movements) ordered by date
      const notifications = await storage.getNotifications(userId);
      const communicationNotifications = notifications.filter(notif => 
        ['whatsapp', 'sms', 'email', 'telegram', 'messenger'].includes(notif.category)
      );
      
      // Limit to 25 most recent and format for frontend
      const recentActivities = communicationNotifications
        .slice(0, 25)
        .map(notif => ({
          id: notif.id,
          type: notif.category, // 'whatsapp', 'sms', 'email', 'telegram', 'messenger'
          title: notif.title,
          subtitle: notif.message,
          timestamp: notif.createdAt.toISOString(),
          icon: getChannelIcon(notif.category),
          color: getChannelColor(notif.category),
          route: notif.actionUrl || '/communications'
        }));
      
      res.json(recentActivities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({ error: 'Failed to fetch recent activities' });
    }
  }));
  
  // Helper functions for channels
  function getChannelIcon(category: string): string {
    switch(category) {
      case 'whatsapp': return 'message-circle';
      case 'sms': return 'smartphone';
      case 'email': return 'mail';
      case 'telegram': return 'send';
      case 'messenger': return 'message-square';
      default: return 'message-circle';
    }
  }
  
  function getChannelColor(category: string): string {
    switch(category) {
      case 'whatsapp': return 'green';
      case 'sms': return 'purple';
      case 'email': return 'blue';
      case 'telegram': return 'blue';
      case 'messenger': return 'blue';
      default: return 'gray';
    }
  }

  // Setup communication routes
  setupWhatsAppRoutes(app);
  setupTelegramRoutes(app);
  setupSmsRoutes(app);
  
  // Auto-initialize Telegram service with existing settings
  const initializeTelegramService = async () => {
    try {
      const { storage } = await import('./storage');
      const telegramSettings = await storage.getTelegramSettings();
      
      if (telegramSettings.length > 0) {
        const settings = telegramSettings[0];
        const { telegramService } = await import('./services/telegram-service');
        
        await telegramService.initialize({
          botToken: settings.botToken,
          botUsername: settings.botUsername,
          webhookUrl: settings.webhookUrl || undefined,
          webhookSecret: settings.webhookSecret || undefined,
          allowedUpdates: settings.allowedUpdates as string[],
          enableBusinessHours: settings.enableBusinessHours || false,
          businessHoursStart: settings.businessHoursStart || '09:00',
          businessHoursEnd: settings.businessHoursEnd || '18:00',
          businessDays: settings.businessDays as string[],
          enableAutoReply: settings.enableAutoReply || false,
          enableAiResponses: settings.enableAiResponses || false,
          aiModel: settings.aiModel || 'gpt-4o',
          aiSystemPrompt: settings.aiSystemPrompt || undefined
        });
        
        console.log('🚀 [TELEGRAM] Service auto-initialized from existing settings');
      }
    } catch (error) {
      console.error('❌ [TELEGRAM] Auto-initialization failed:', error);
    }
  };
  
  // Initialize async after server setup
  setTimeout(initializeTelegramService, 1000);

  // Analytics movement stats endpoint
  app.get("/api/analytics/movement-stats", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const user = req.user;
      const periodType = req.query.period || 'month'; // month, week, year
      let resourceIdFilter: string | undefined;
      
      // Apply resource filtering for user role
      if (user.role === 'user' && user.resourceId) {
        resourceIdFilter = user.resourceId;
      }
      
      // Convert period type to date range
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;
      
      switch (periodType) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'month':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
      
      const periodRange = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
      
      const stats = await storage.getMovementStats(periodRange, resourceIdFilter);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching movement stats:', error);
      res.status(500).json({ message: "Failed to fetch movement stats" });
    }
  }));

  // Analytics filtered movements endpoint
  app.get("/api/analytics/filtered-movements", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 25;
      
      console.log("[ANALYTICS] Filtered movements request:", req.query);
      
      // Use existing movements filtered logic
      const filters: any = {};
      
      // Date filters
      if (req.query.createdDateFrom) filters.insertDateFrom = req.query.createdDateFrom;
      if (req.query.createdDateTo) filters.insertDateTo = req.query.createdDateTo;
      if (req.query.flowDateFrom) filters.flowDateFrom = req.query.flowDateFrom;
      if (req.query.flowDateTo) filters.flowDateTo = req.query.flowDateTo;
      
      // Organization filters
      if (req.query.companyId && req.query.companyId !== 'all') filters.companyId = req.query.companyId;
      if (req.query.coreId && req.query.coreId !== 'all') filters.coreId = req.query.coreId;
      if (req.query.officeId && req.query.officeId !== 'all') filters.officeId = req.query.officeId;
      
      // Financial filters
      if (req.query.type && req.query.type !== 'all') filters.type = req.query.type;
      if (req.query.amountFrom) filters.amountFrom = parseFloat(req.query.amountFrom as string);
      if (req.query.amountTo) filters.amountTo = parseFloat(req.query.amountTo as string);
      if (req.query.ibanId && req.query.ibanId !== 'all') filters.ibanId = req.query.ibanId;
      
      // External filters  
      if (req.query.supplierId && req.query.supplierId !== 'all') filters.supplierId = req.query.supplierId;
      if (req.query.resourceId && req.query.resourceId !== 'all') filters.resourceId = req.query.resourceId;
      if (req.query.customerId && req.query.customerId !== 'all') filters.customerId = req.query.customerId;
      
      // Advanced filters
      if (req.query.statusId && req.query.statusId !== 'all') filters.statusId = req.query.statusId;
      if (req.query.reasonId && req.query.reasonId !== 'all') filters.reasonId = req.query.reasonId;
      if (req.query.vatType && req.query.vatType !== 'all') filters.vatType = req.query.vatType;
      if (req.query.hasVat !== undefined) filters.hasVat = req.query.hasVat === 'true';
      if (req.query.hasDocument !== undefined) filters.hasDocument = req.query.hasDocument === 'true';
      if (req.query.tagIds) {
        const tagIds = Array.isArray(req.query.tagIds) ? req.query.tagIds : [req.query.tagIds];
        filters.tagIds = tagIds.filter((id: any) => id !== 'all');
      }

      // Role-based filtering
      if (req.user.role === 'user' && req.user.resourceId) {
        filters.resourceId = req.user.resourceId;
      }

      console.log("[ANALYTICS] Using storage.getFilteredMovements with filters:", filters);
      
      // Use the existing getFilteredMovements method with correct syntax
      const movements = await storage.getFilteredMovements(filters, page, pageSize);

      console.log("[ANALYTICS] Movements response:", {
        totalMovements: movements?.data?.length || 0,
        pagination: movements?.pagination
      });

      res.json({
        data: movements.data || [],
        pagination: movements.pagination || {
          page,
          limit: pageSize,
          total: 0,
          totalPages: 0
        }
      });

    } catch (error) {
      console.error('[ANALYTICS] Error fetching filtered movements:', error);
      res.status(500).json({ 
        error: 'Failed to fetch movements',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // Recent activities endpoint - includes movements and Telegram messages
  app.get("/api/recent-activities", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      // Get recent movements (last 10) - fix the function call
      const recentMovements = await storage.getMovements();
      
      // Get recent Telegram chats with messages
      const telegramChats = await storage.getTelegramChats();
      
      // Combine and format activities with proper typing
      const activities: any[] = [];
      
      // Add movements as activities
      if (recentMovements && Array.isArray(recentMovements)) {
        recentMovements.slice(0, 10).forEach((movement: any) => {
          activities.push({
            id: movement.id,
            type: 'movement',
            title: movement.description || (typeof movement.reason === 'string' ? movement.reason : movement.reason?.name) || 'Movimento finanziario',
            subtitle: `€${movement.amount} • ${movement.type === 'income' ? 'Entrata' : 'Uscita'}`,
            timestamp: movement.flowDate || movement.createdAt,
            icon: movement.type === 'income' ? 'arrow-up-right' : 'arrow-down-left',
            color: movement.type === 'income' ? 'green' : 'red',
            route: '/movements'
          });
        });
      }
      
      // Add Telegram messages as activities  
      if (telegramChats && Array.isArray(telegramChats)) {
        telegramChats.forEach((chat: any) => {
          if (chat.lastMessageAt) {
            activities.push({
              id: `telegram-${chat.id}`,
              type: 'telegram',
              title: `${chat.firstName || chat.username || 'Chat'} ${chat.lastName || ''}`.trim(),
              subtitle: `Ultimo messaggio • Telegram`,
              timestamp: chat.lastMessageAt,
              icon: 'message-circle',
              color: 'blue',
              route: '/communications'
            });
          }
        });
      }
      
      // Sort by timestamp (most recent first) and limit to 15
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 15);
      
      console.log('[RECENT-ACTIVITIES] Generated activities:', sortedActivities.length, 'items');
      res.json(sortedActivities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  }));

  // ================================================================
  // AI SETTINGS & API KEY MANAGEMENT
  // ================================================================
  
  // Get current AI settings
  app.get("/api/ai/settings", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const settings = await storage.getAiSettings(req.user.id);
      if (!settings) {
        // Create default settings if none exist
        const defaultSettings = {
          userId: req.user.id,
          defaultModel: 'gpt-4o',
          chatEnabled: true,
          documentProcessingEnabled: true,
          analyticsEnabled: true,
          predictionsEnabled: true,
          maxTokens: 2000,
          temperature: 0.7,
          privacyMode: 'standard',
          dataRetention: 'none'
        };
        const newSettings = await storage.createAiSettings(defaultSettings);
        return res.json(newSettings);
      }
      res.json(settings);
    } catch (error) {
      console.error('[AI SETTINGS] Error fetching AI settings:', error);
      res.status(500).json({ error: 'Failed to fetch AI settings' });
    }
  }));

  // Get AI API key status
  app.get("/api/ai/api-key/status", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const settings = await storage.getAiSettings(req.user.id);
      
      if (settings?.openaiApiKey) {
        // Hide the full key, show only prefix for security
        const maskedKey = `${settings.openaiApiKey.substring(0, 7)}...${settings.openaiApiKey.slice(-4)}`;
        res.json({
          configured: true,
          maskedKey,
          message: 'API Key configurata'
        });
      } else {
        res.json({
          configured: false,
          maskedKey: null,
          message: 'Nessuna API Key configurata'
        });
      }
    } catch (error) {
      console.error('[AI API STATUS] Error checking API key status:', error);
      res.status(500).json({ 
        configured: false, 
        error: 'Failed to check API key status' 
      });
    }
  }));

  // Update AI API key
  app.post("/api/ai/api-key/update", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey || !apiKey.startsWith('sk-')) {
        return res.status(400).json({ error: 'Invalid API key format. Must start with sk-' });
      }

      // Get or create AI settings
      let settings = await storage.getAiSettings(req.user.id);
      if (!settings) {
        // Create new settings with API key
        const newSettings = {
          userId: req.user.id,
          openaiApiKey: apiKey,
          defaultModel: 'gpt-4o',
          chatEnabled: true,
          documentProcessingEnabled: true,
          analyticsEnabled: true,
          predictionsEnabled: true,
          maxTokens: 2000,
          temperature: 0.7,
          privacyMode: 'standard',
          dataRetention: 'none'
        };
        settings = await storage.createAiSettings(newSettings);
      } else {
        // Update existing settings with new API key
        settings = await storage.updateAiSettings(req.user.id, { openaiApiKey: apiKey });
      }

      console.log('[AI API KEY] ✅ API key updated successfully for user:', req.user.id);
      res.json({ success: true, message: 'API key updated successfully' });
    } catch (error) {
      console.error('[AI API KEY] ❌ Error updating API key:', error);
      res.status(500).json({ error: 'Failed to update API key' });
    }
  }));

  // Get AI chat sessions
  app.get("/api/ai/chat/sessions", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const sessions = await storage.getAiChatSessions(req.user.id);
      res.json(sessions || []);
    } catch (error) {
      console.error('[AI SESSIONS] Error getting chat sessions:', error);
      res.status(500).json({ error: 'Failed to get chat sessions' });
    }
  }));

  // Get AI chat messages for a session
  app.get("/api/ai/chat/messages/:sessionId", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getAiChatHistory(req.user.id, sessionId);
      res.json(messages || []);
    } catch (error) {
      console.error('[AI MESSAGES] Error getting chat messages:', error);
      res.status(500).json({ error: 'Failed to get chat messages' });
    }
  }));

  // Delete AI chat session
  app.delete("/api/ai/chat/sessions/:sessionId", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { sessionId } = req.params;
      await storage.deleteAiChatSession(req.user.id, sessionId);
      res.json({ success: true, message: 'Sessione eliminata' });
    } catch (error) {
      console.error('[AI DELETE] Error deleting chat session:', error);
      res.status(500).json({ error: 'Failed to delete chat session' });
    }
  }));

  // AI Chat endpoint
  app.post("/api/ai/chat", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { message, sessionId } = req.body;
      
      if (!message || !sessionId) {
        return res.status(400).json({ error: 'Message and sessionId are required' });
      }
      
      const result = await aiService.chatCompletion(
        req.user.id,
        message,
        sessionId
      );
      
      console.log(`[AI CHAT] ✅ Chat response generated for user: ${req.user.id}, tokens: ${result.tokensUsed}`);
      
      res.json({
        response: result.response,
        tokensUsed: result.tokensUsed,
        sessionId
      });
    } catch (error) {
      console.error('[AI CHAT] Error during chat completion:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Chat completion failed' 
      });
    }
  }));

  // Test AI API key connection
  app.post("/api/ai/api-key/test", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      // Get user's AI settings to use their API key
      const settings = await storage.getAiSettings(req.user.id);
      if (!settings?.openaiApiKey) {
        return res.status(400).json({ 
          success: false, 
          error: 'No API key configured. Please add an API key first.' 
        });
      }

      // Test connection with user's API key
      const testResult = await aiService.testConnection();
      
      if (testResult.success) {
        console.log('[AI TEST] ✅ API key test successful:', testResult.model);
        res.json({
          success: true,
          model: testResult.model,
          message: 'Connection test successful'
        });
      } else {
        console.log('[AI TEST] ❌ API key test failed:', testResult.error);
        res.json({
          success: false,
          error: testResult.error
        });
      }
    } catch (error) {
      console.error('[AI TEST] ❌ Connection test error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Connection test failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    }
  }));

  // Update AI settings
  app.put("/api/ai/settings", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const settings = await storage.updateAiSettings(req.user.id, req.body);
      res.json(settings);
    } catch (error) {
      console.error('[AI SETTINGS] Error updating AI settings:', error);
      res.status(500).json({ error: 'Failed to update AI settings' });
    }
  }));

  // === FISCAL AI ROUTES ===
  
  // Get fiscal advice
  app.post("/api/fiscal-ai/advice", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { question } = req.body;
      if (!question) {
        return res.status(400).json({ error: 'Question is required' });
      }

      const advice = await fiscalAIService.getFiscalAdvice(req.user.id, question);
      res.json(advice);
    } catch (error: any) {
      console.error('[FISCAL AI] Error getting fiscal advice:', error);
      res.status(500).json({ 
        error: 'Failed to get fiscal advice',
        details: error.message 
      });
    }
  }));

  // Analyze fiscal situation
  app.get("/api/fiscal-ai/analysis", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const analysis = await fiscalAIService.analyzeFiscalSituation(req.user.id);
      res.json(analysis);
    } catch (error: any) {
      console.error('[FISCAL AI] Error analyzing fiscal situation:', error);
      res.status(500).json({ 
        error: 'Failed to analyze fiscal situation',
        details: error.message 
      });
    }
  }));

  // Upload and analyze document
  app.post("/api/fiscal-ai/upload-document", requireAuth, upload.single('document'), handleAsyncErrors(async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No document uploaded' });
      }

      // Analyze the uploaded document
      const analysis = await fiscalAIService.analyzeDocument(req.user.id, req.file);
      
      // Create document analysis record
      const documentAnalysis = await storage.createDocumentAnalysis({
        userId: req.user.id,
        filename: req.file.originalname,
        fileType: req.file.mimetype,
        analysis: analysis.analysis,
        extractedData: analysis.extractedData,
        tokensUsed: analysis.tokensUsed || 0,
        confidence: analysis.confidence || 0.8,
        processingTime: analysis.processingTime || 0
      });

      res.json({
        id: documentAnalysis.id,
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        analysis: analysis.analysis,
        extractedData: analysis.extractedData,
        confidence: analysis.confidence,
        processingTime: analysis.processingTime
      });
    } catch (error: any) {
      console.error('[FISCAL AI] Error uploading document:', error);
      res.status(500).json({ 
        error: 'Failed to upload and analyze document',
        details: error.message 
      });
    }
  }));

  // Get document analysis history
  app.get("/api/fiscal-ai/documents", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const documents = await storage.getDocumentAnalysisHistory(req.user.id);
      res.json(documents);
    } catch (error: any) {
      console.error('[FISCAL AI] Error fetching documents:', error);
      res.status(500).json({ 
        error: 'Failed to fetch document history',
        details: error.message 
      });
    }
  }));

  // === CALENDAR EVENTS ROUTES ===
  
  // Get all calendar events for user
  app.get("/api/calendar/events", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const events = await storage.getCalendarEvents(req.user.id);
      res.json(events);
    } catch (error) {
      console.error('[CALENDAR] Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
  }));

  // Get calendar events by date range
  app.get("/api/calendar/events/range", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }
      
      const events = await storage.getCalendarEventsByDateRange(
        new Date(startDate as string),
        new Date(endDate as string),
        req.user.id
      );
      res.json(events);
    } catch (error) {
      console.error('[CALENDAR] Error fetching events by date range:', error);
      res.status(500).json({ error: 'Failed to fetch calendar events by date range' });
    }
  }));

  // Get single calendar event
  app.get("/api/calendar/events/:id", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const event = await storage.getCalendarEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: 'Calendar event not found' });
      }
      res.json(event);
    } catch (error) {
      console.error('[CALENDAR] Error fetching event:', error);
      res.status(500).json({ error: 'Failed to fetch calendar event' });
    }
  }));

  // Create calendar event
  app.post("/api/calendar/events", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const eventData = {
        ...req.body,
        createdByUserId: req.user.id,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
      };
      
      const newEvent = await storage.createCalendarEvent(eventData);
      res.status(201).json(newEvent);
    } catch (error) {
      console.error('[CALENDAR] Error creating event:', error);
      res.status(500).json({ error: 'Failed to create calendar event' });
    }
  }));

  // Update calendar event
  app.put("/api/calendar/events/:id", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const updateData = { ...req.body };
      if (req.body.startDate) {
        updateData.startDate = new Date(req.body.startDate);
      }
      if (req.body.endDate) {
        updateData.endDate = new Date(req.body.endDate);
      }
      
      const updatedEvent = await storage.updateCalendarEvent(req.params.id, updateData);
      res.json(updatedEvent);
    } catch (error) {
      console.error('[CALENDAR] Error updating event:', error);
      res.status(500).json({ error: 'Failed to update calendar event' });
    }
  }));

  // Delete calendar event
  app.delete("/api/calendar/events/:id", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      await storage.deleteCalendarEvent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('[CALENDAR] Error deleting event:', error);
      res.status(500).json({ error: 'Failed to delete calendar event' });
    }
  }));

  // === CALENDAR REMINDERS ROUTES ===
  
  // Get reminders for an event
  app.get("/api/calendar/events/:eventId/reminders", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const reminders = await storage.getCalendarReminders(req.params.eventId);
      res.json(reminders);
    } catch (error) {
      console.error('[CALENDAR] Error fetching reminders:', error);
      res.status(500).json({ error: 'Failed to fetch calendar reminders' });
    }
  }));

  // Create calendar reminder
  app.post("/api/calendar/reminders", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const reminderData = {
        ...req.body,
        recipientUserId: req.user.id,
        scheduledFor: new Date(req.body.scheduledFor)
      };
      
      const newReminder = await storage.createCalendarReminder(reminderData);
      res.status(201).json(newReminder);
    } catch (error) {
      console.error('[CALENDAR] Error creating reminder:', error);
      res.status(500).json({ error: 'Failed to create calendar reminder' });
    }
  }));

  // Update calendar reminder
  app.put("/api/calendar/reminders/:id", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const updateData = { ...req.body };
      if (req.body.scheduledFor) {
        updateData.scheduledFor = new Date(req.body.scheduledFor);
      }
      
      const updatedReminder = await storage.updateCalendarReminder(req.params.id, updateData);
      res.json(updatedReminder);
    } catch (error) {
      console.error('[CALENDAR] Error updating reminder:', error);
      res.status(500).json({ error: 'Failed to update calendar reminder' });
    }
  }));

  // Delete calendar reminder
  app.delete("/api/calendar/reminders/:id", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      await storage.deleteCalendarReminder(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('[CALENDAR] Error deleting reminder:', error);
      res.status(500).json({ error: 'Failed to delete calendar reminder' });
    }
  }));

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
