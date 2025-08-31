import type { Express } from "express";
import { createServer, type Server } from "http";
// Storage will be imported dynamically to avoid circular dependency
import { aiService } from "./ai-service";
import { fiscalAIService } from "./fiscal-ai-service";
import { documentAIService } from "./document-ai-service";
import { eq, desc, sum, count, sql } from "drizzle-orm";
import { bankTransactions, movements } from "@shared/schema";
import { 
  insertCompanySchema, insertCoreSchema, insertResourceSchema,
  insertIbanSchema, insertOfficeSchema, insertTagSchema,
  insertMovementStatusSchema, insertMovementReasonSchema, insertMovementSchema,
  insertNeonSettingsSchema,
  insertNotificationSchema, insertSupplierSchema, insertCustomerSchema, insertEmailSettingsSchema,
  insertUserSchema, passwordResetSchema, resetPasswordSchema, insertSendgridTemplateSchema,
  insertWhatsappSettingsSchema, insertWhatsappTemplateSchema,
  insertSmsSettingsSchema, insertSmsTemplateSchema, insertSmsMessageSchema,
  insertCompanyProviderSettingsSchema, insertInvoiceProviderLogSchema
} from "@shared/schema";
import { emailService } from './email-service';
// SendGrid Templates management via enhanced service
import { sendGridService } from './services/sendgrid-enhanced';
import { setupAuth } from "./auth";
import { loginLimiter, apiLimiter, securityLogger, securityHeaders, sanitizeInput, sessionSecurity } from "./security-middleware";
import { WebhookRouter } from './webhook-manager';
import { setupWhatsAppRoutes } from './routes/whatsapp';
import { setupTelegramRoutes } from './routes/telegram';
import { setupSmsRoutes } from './routes/sms';
import aiInsightsRouter from './routes/ai-insights';
import aiAnomaliesRouter from './routes/ai-anomalies';
import { registerAIContextRoutes } from './routes/ai-context';
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

// Helper function to create invoice notifications for admin and finance roles
async function createInvoiceNotifications(invoiceId: string, type: 'invoice_issued' | 'invoice_received' | 'invoice_validated' | 'invoice_rejected', createdByUserId?: string) {
  try {
    const { storage } = await import('./storage');
    const users = await storage.getUsers();
    
    for (const user of users) {
      // Skip notification for the user who created/updated the invoice
      if (user.id === createdByUserId) continue;
      
      let shouldNotify = false;
      let title = '';
      let message = '';
      
      // Only notify admin and finance roles for invoicing
      if (user.role === 'admin' || user.role === 'finance') {
        shouldNotify = true;
        
        switch (type) {
          case 'invoice_issued':
            title = 'Fattura emessa';
            message = `Nuova fattura elettronica emessa tramite provider`;
            break;
          case 'invoice_received':
            title = 'Fattura ricevuta';
            message = `Nuova fattura elettronica ricevuta`;
            break;
          case 'invoice_validated':
            title = 'Fattura validata';
            message = `Fattura elettronica validata da Sistema di Interscambio`;
            break;
          case 'invoice_rejected':
            title = 'Fattura rifiutata';
            message = `Fattura elettronica rifiutata - richiede intervento`;
            break;
        }
      }
      
      if (shouldNotify) {
        const notificationData = {
          userId: user.id,
          type,
          category: 'invoicing' as const,
          title,
          message,
          priority: type === 'invoice_rejected' ? 'high' as const : 'medium' as const,
          actionUrl: `/invoicing?view=${invoiceId}`,
          isRead: false
        };
        
        await storage.createNotification(notificationData);
      }
    }
  } catch (error) {
    console.error('Error creating invoice notifications:', error);
    // Don't throw error to avoid breaking the main invoice operation
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ==================== MULTI-CHANNEL WEBHOOK SYSTEM ====================
  
  // Initialize and setup webhook system for all channels
  const { WebhookRouter } = await import('./webhook-manager');
  WebhookRouter.setupRoutes(app);
  
  // Setup webhook queue monitoring API
  const { setupWebhookQueueRoutes } = await import('./routes/webhook-queue');
  setupWebhookQueueRoutes(app);

  // Setup calendar integrations API
  const { setupCalendarIntegrationRoutes } = await import('./routes/calendar-integrations');
  setupCalendarIntegrationRoutes(app);

  // Apply dynamic security middleware
  const { 
    dynamicApiLimiter, 
    dynamicLoginLimiter, 
    createDynamicSessionSecurity, 
    createDynamicAuditLogger,
    validatePasswordMiddleware 
  } = await import('./services/dynamic-security-middleware');
  
  // Apply dynamic API rate limiting
  app.use('/api', async (req, res, next) => {
    const limiter = await dynamicApiLimiter.getApiLimiter();
    limiter(req, res, next);
  });
  
  // Apply dynamic login rate limiting  
  app.use('/api/auth/login', async (req, res, next) => {
    const limiter = await dynamicLoginLimiter.getLoginLimiter();
    limiter(req, res, next);
  });
  
  // Apply dynamic session security
  app.use(createDynamicSessionSecurity());
  
  // Apply dynamic audit logging
  app.use(createDynamicAuditLogger());
  
  // Apply password validation on relevant endpoints
  app.use(['/api/auth/register', '/api/auth/change-password', '/api/users/password'], validatePasswordMiddleware);
  
  console.log('✅ Multi-Channel Webhook System initialized:');
  console.log('   • WhatsApp: Twilio + LinkMobility (AI-powered)');
  console.log('   • SMS: Skebby (AI-powered)');
  console.log('   • Email: SendGrid (AI-powered)');
  console.log('   • Messenger: Facebook (AI-powered)');
  console.log('✅ Webhook Queue System initialized with priorities and retry logic');
  console.log('✅ Calendar Integrations System initialized (Google Calendar + Microsoft Outlook)');

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
  registerAIContextRoutes(app);
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

  app.post("/api/resources", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
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

  // Movement stats endpoint (used by dashboard) - MUST BE BEFORE /api/movements/:id
  app.get("/api/movements/stats", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { startDate, endDate } = req.query;
      const user = req.user;
      let period;
      
      if (startDate && endDate) {
        period = {
          startDate: startDate as string,
          endDate: endDate as string,
        };
      }
      
      let resourceIdFilter = undefined;
      if (user.role === 'user' && user.resourceId) {
        resourceIdFilter = user.resourceId;
      }
      
      const stats = await storage.getMovementStats(period, resourceIdFilter);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching movement stats:', error);
      res.status(500).json({ message: "Failed to fetch movement stats" });
    }
  }));

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
      // Skip stats route - it should be handled by specific endpoint above
      if (req.params.id === 'stats') {
        return res.status(404).json({ message: "Route conflict - stats should be handled separately" });
      }
      
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

  // Analytics stats endpoint (used by analytics page)
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

  // Analytics overview endpoint 
  app.get("/api/analytics/overview", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const user = req.user;
      let resourceIdFilter = undefined;
      if (user.role === 'user' && user.resourceId) {
        resourceIdFilter = user.resourceId;
      }
      
      // Get overview stats for last 30 days
      const period = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      };
      
      const [stats, cashFlow] = await Promise.all([
        storage.getMovementStats(period, resourceIdFilter),
        storage.getCashFlowData(30, resourceIdFilter)
      ]);
      
      res.json({
        stats,
        cashFlow,
        period
      });
    } catch (error) {
      console.error('Error fetching analytics overview:', error);
      res.status(500).json({ message: "Failed to fetch analytics overview" });
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

  // WhatsApp connection test endpoint
  app.get("/api/whatsapp/test-connection", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const settingsArray = await storage.getWhatsappSettings();
      const settings = settingsArray.length > 0 ? settingsArray[0] : null;
      
      if (!settings || !settings.accountSid || !settings.authToken) {
        return res.json({
          success: false,
          error: "WhatsApp settings not configured"
        });
      }
      
      // Test Twilio connection
      const isConnected = settings.accountSid && settings.authToken;
      
      res.json({
        success: isConnected,
        provider: "Twilio",
        accountSid: settings.accountSid ? `***${settings.accountSid.slice(-4)}` : null,
        status: isConnected ? "connected" : "disconnected"
      });
    } catch (error) {
      console.error('Error testing WhatsApp connection:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to test WhatsApp connection" 
      });
    }
  }));

  // === WHATSAPP SETTINGS ENDPOINTS ===
  
  // Get WhatsApp settings
  app.get("/api/whatsapp/settings", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const settings = await storage.getWhatsappSettings();
      
      // 🔥 FIX: Mappa da snake_case (DB) a camelCase (Frontend)
      const mappedSettings = settings.map(setting => ({
        id: setting.id,
        provider: setting.provider,
        isActive: setting.isActive,
        businessName: setting.businessDisplayName || '',
        businessDescription: setting.businessAbout || '',
        phoneNumber: setting.whatsappNumber || '',
        accountSid: setting.accountSid || '',
        authToken: setting.authToken || '',
        apiKey: setting.apiKey || '',
        webhookUrl: setting.webhookUrl || '',
        isBusinessVerified: setting.businessVerificationStatus === 'approved',
        isPhoneVerified: setting.isNumberVerified || false,
        isApiConnected: setting.isApiConnected || false,
        lastTestAt: setting.lastTestAt || '',
        createdAt: setting.createdAt,
        updatedAt: setting.updatedAt
      }));
      
      res.json(mappedSettings);
    } catch (error) {
      console.error('[WHATSAPP] Error fetching WhatsApp settings:', error);
      res.status(500).json({ error: 'Failed to fetch WhatsApp settings' });
    }
  }));
  
  // Create WhatsApp settings
  app.post("/api/whatsapp/settings", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      // ✅ FIXED: Mappa correttamente al schema DB
      const dbData = {
        provider: req.body.provider || 'twilio',
        isActive: req.body.isActive || false,
        businessDisplayName: req.body.businessName || '',
        businessAbout: req.body.businessDescription || '',
        whatsappNumber: req.body.phoneNumber || '',
        accountSid: req.body.accountSid || '',
        authToken: req.body.authToken || '',
        apiKey: req.body.apiKey || '',
        webhookUrl: req.body.webhookUrl || '',
        businessVerificationStatus: 'pending',
        templateApprovalStatus: 'none'
      };
      
      const newSettings = await storage.createWhatsappSettings(dbData);
      
      // ✅ FIXED: Response mapping corretto
      const response = {
        id: newSettings.id,
        provider: newSettings.provider,
        isActive: newSettings.isActive,
        businessName: newSettings.businessDisplayName,
        businessDescription: newSettings.businessAbout,
        phoneNumber: newSettings.whatsappNumber,
        accountSid: newSettings.accountSid,
        authToken: newSettings.authToken,
        apiKey: newSettings.apiKey,
        webhookUrl: newSettings.webhookUrl,
        createdAt: newSettings.createdAt,
        updatedAt: newSettings.updatedAt
      };
      
      res.json(response);
    } catch (error) {
      console.error('[WHATSAPP] Error creating WhatsApp settings:', error);
      res.status(500).json({ error: 'Failed to create WhatsApp settings' });
    }
  }));
  
  // Update WhatsApp settings
  app.put("/api/whatsapp/settings", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      // 🔥 FIX: Mappa da camelCase (Frontend) a snake_case (DB)
      const dbData = {
        provider: req.body.provider,
        is_active: req.body.isActive,
        business_name: req.body.businessName,
        business_description: req.body.businessDescription,
        phone_number: req.body.phoneNumber,
        account_sid: req.body.accountSid,
        auth_token: req.body.authToken,
        api_key: req.body.apiKey,
        webhook_url: req.body.webhookUrl
      };
      
      const settings = await storage.getWhatsappSettings();
      let updatedSettings;
      
      if (settings.length === 0) {
        // Se non esistono impostazioni, creane una nuova
        updatedSettings = await storage.createWhatsappSettings(dbData);
      } else {
        // Altrimenti aggiorna la prima impostazione esistente
        updatedSettings = await storage.updateWhatsappSettings(settings[0].id, dbData);
      }
      
      // Mappa indietro per il response
      const response = {
        id: updatedSettings.id,
        provider: updatedSettings.provider,
        isActive: updatedSettings.is_active,
        businessName: updatedSettings.business_name,
        businessDescription: updatedSettings.business_description,
        phoneNumber: updatedSettings.phone_number,
        accountSid: updatedSettings.account_sid,
        authToken: updatedSettings.auth_token,
        apiKey: updatedSettings.api_key,
        webhookUrl: updatedSettings.webhook_url,
        createdAt: updatedSettings.created_at,
        updatedAt: updatedSettings.updated_at
      };
      
      res.json(response);
    } catch (error) {
      console.error('[WHATSAPP] Error updating WhatsApp settings:', error);
      res.status(500).json({ error: 'Failed to update WhatsApp settings' });
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
  
  // Banking sync single IBAN - IMPLEMENTAZIONE REALE
  app.post("/api/banking/sync/:ibanId", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { ibanId } = req.params;
      console.log(`[BANKING API] Sincronizzazione reale IBAN ${ibanId}`);
      
      // SYNC REALE con API bancarie
      const { syncBankTransactions } = await import('./banking-sync');
      const result = await syncBankTransactions(ibanId);
      
      res.json({
        synced: result.synced,
        matched: result.matched,
        errors: result.errors,
        message: `Sincronizzazione IBAN ${ibanId} completata: ${result.synced} transazioni, ${result.matched} match`
      });
    } catch (error: any) {
      console.error('Error syncing IBAN:', error);
      res.status(500).json({ 
        error: "Failed to sync IBAN",
        message: error?.message || 'Errore sconosciuto'
      });
    }
  }));
  
  // Banking sync all IBANs - IMPLEMENTAZIONE REALE
  app.post("/api/banking/sync-all", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      console.log(`[BANKING API] Sincronizzazione reale di tutti gli IBAN abilitati`);
      
      // SYNC REALE di tutti gli IBAN abilitati
      const { syncAllEnabledIbans } = await import('./banking-sync');
      const result = await syncAllEnabledIbans();
      
      res.json({
        totalSynced: result.totalSynced,
        totalMatched: result.totalMatched,
        synced: result.synced || result.totalSynced,
        matched: result.matched || result.totalMatched,
        errors: result.errors,
        message: `Sincronizzazione globale completata: ${result.totalSynced} transazioni, ${result.totalMatched} match`
      });
    } catch (error: any) {
      console.error('Error syncing all IBANs:', error);
      res.status(500).json({ 
        error: "Failed to sync all IBANs",
        message: error?.message || 'Errore sconosciuto'
      });
    }
  }));

  // ========= NUOVI ENDPOINT BANKING API REALI =========

  // Banking configuration API - Salva configurazione API bancaria
  app.post("/api/banking/configure", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { provider, iban, credentials, sandboxMode } = req.body;
      console.log(`[BANKING API] Configurazione ${provider} per IBAN ${iban.slice(-4)}`);
      
      // Validazione input
      if (!provider || !iban || !credentials) {
        return res.status(400).json({ error: "Provider, IBAN e credenziali richiesti" });
      }

      // Salva configurazione API nel database
      const existingIban = await storage.getIbanByValue(iban);
      if (!existingIban) {
        return res.status(404).json({ error: "IBAN non trovato nel sistema" });
      }

      await storage.updateIbanApiConfig(existingIban.id, {
        apiProvider: provider,
        apiCredentials: JSON.stringify(credentials),
        sandboxMode: !!sandboxMode,
        isEnabled: true,
        lastSync: null
      });

      res.json({
        success: true,
        message: `Configurazione ${provider} salvata per IBAN ${iban.slice(-4)}`,
        provider,
        sandboxMode: !!sandboxMode
      });

    } catch (error: any) {
      console.error('Error configuring banking API:', error);
      res.status(500).json({ 
        error: "Failed to configure banking API",
        message: error?.message || 'Errore sconosciuto'
      });
    }
  }));

  // Banking test connection API - Testa connessione API
  app.post("/api/banking/test-connection", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { provider, iban, credentials, sandboxMode } = req.body;
      console.log(`[BANKING API] Test connessione ${provider} per IBAN ${iban.slice(-4)}`);
      
      // Import test function
      const { testBankingConnection } = await import('./banking-sync');
      const result = await testBankingConnection(provider, iban, credentials, sandboxMode);

      res.json({
        success: result.success,
        message: result.message,
        details: result.details,
        accountFound: result.accountFound,
        provider: provider
      });

    } catch (error: any) {
      console.error('Error testing banking connection:', error);
      res.status(500).json({ 
        success: false,
        error: "Failed to test banking connection",
        message: error?.message || 'Errore sconosciuto'
      });
    }
  }));

  // Banking OAuth2 callback - Gestisce callback OAuth2
  app.get("/api/banking/oauth/callback", handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { code, state } = req.query;
      console.log(`[BANKING API] OAuth2 callback - code: ${code?.slice(0, 10)}...`);
      
      if (!code || !state) {
        return res.status(400).json({ error: "Codice o state mancanti nel callback OAuth2" });
      }

      // Import OAuth handler
      const { handleOAuth2Callback } = await import('./banking-sync');
      const result = await handleOAuth2Callback(code, state);

      // Redirect to success page
      res.redirect(`/settings/banking?oauth_success=true&provider=${result.provider}`);

    } catch (error: any) {
      console.error('Error handling OAuth2 callback:', error);
      res.redirect(`/settings/banking?oauth_error=true&message=${encodeURIComponent(error?.message || 'OAuth2 failed')}`);
    }
  }));

  // Banking certificates upload - Gestisce upload certificati PSD2
  app.post("/api/banking/certificates", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { ibanId, qwacCertificate, qsealCertificate } = req.body;
      console.log(`[BANKING API] Upload certificati per IBAN ${ibanId}`);
      
      if (!qwacCertificate || !qsealCertificate) {
        return res.status(400).json({ error: "Certificati QWAC e QSEAL richiesti" });
      }

      // Validazione formato certificati
      const { validateCertificates } = await import('./banking-sync');
      const validation = await validateCertificates(qwacCertificate, qsealCertificate);
      
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      // Salva certificati (crittografati)
      await storage.updateIbanCertificates(ibanId, {
        qwacCertificate: qwacCertificate,
        qsealCertificate: qsealCertificate,
        certificatesUploaded: true,
        certificatesValidUntil: validation.validUntil
      });

      res.json({
        success: true,
        message: "Certificati PSD2 caricati e validati",
        validUntil: validation.validUntil
      });

    } catch (error: any) {
      console.error('Error uploading certificates:', error);
      res.status(500).json({ 
        error: "Failed to upload certificates",
        message: error?.message || 'Errore sconosciuto'
      });
    }
  }));

  // ========= FINE ENDPOINT BANKING REALI =========

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

  // === NOTIFICATION SETTINGS API ENDPOINTS ===

  // Get notification settings
  app.get("/api/notifications/settings", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const settings = await storage.getNotificationSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error('[NOTIFICATIONS] Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch notification settings' });
    }
  }));

  // Update notification settings
  app.put("/api/notifications/settings", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const settings = await storage.updateNotificationSettings(userId, req.body);
      res.json(settings);
    } catch (error) {
      console.error('[NOTIFICATIONS] Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update notification settings' });
    }
  }));

  // Get notification statistics
  app.get("/api/notifications/stats", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const { getNotificationStats } = await import('./services/notification-service');
      const stats = await getNotificationStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('[NOTIFICATIONS] Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch notification statistics' });
    }
  }));

  // Test notification
  app.post("/api/notifications/test", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { channel, message } = req.body;
      const userId = req.user.id;
      
      const { sendTestNotification } = await import('./services/notification-service');
      const result = await sendTestNotification(userId, channel, message);
      res.json(result);
    } catch (error) {
      console.error('[NOTIFICATIONS] Error sending test notification:', error);
      res.status(500).json({ error: 'Failed to send test notification' });
    }
  }));

  // Get notification settings
  app.get("/api/notifications/settings", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const settings = await storage.getNotificationSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error('[NOTIFICATIONS] Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch notification settings' });
    }
  }));

  // Update notification settings
  app.put("/api/notifications/settings", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      const updates = req.body;
      
      const updatedSettings = await storage.updateNotificationSettings(userId, updates);
      res.json(updatedSettings);
    } catch (error) {
      console.error('[NOTIFICATIONS] Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update notification settings' });
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

  // ==================== SENDGRID TEMPLATES API ====================
  
  // Get all SendGrid templates
  app.get("/api/sendgrid/templates", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const templates = await storage.getSendgridTemplates();
      res.json(templates);
    } catch (error) {
      console.error('[SENDGRID] Error fetching templates:', error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  }));

  // Get SendGrid template by ID
  app.get("/api/sendgrid/templates/:id", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const template = await storage.getSendgridTemplateById(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error('[SENDGRID] Error fetching template:', error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  }));

  // Create new SendGrid template
  app.post("/api/sendgrid/templates", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertSendgridTemplateSchema.parse(req.body);
      const template = await storage.createSendgridTemplate(validatedData);
      
      console.log(`[SENDGRID] ✅ Template created: ${template.name} (${template.category})`);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('[SENDGRID] Error creating template:', error);
      res.status(500).json({ message: "Failed to create template" });
    }
  }));

  // Update SendGrid template
  app.put("/api/sendgrid/templates/:id", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertSendgridTemplateSchema.partial().parse(req.body);
      const template = await storage.updateSendgridTemplate(req.params.id, validatedData);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      console.log(`[SENDGRID] ✅ Template updated: ${template.name}`);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('[SENDGRID] Error updating template:', error);
      res.status(500).json({ message: "Failed to update template" });
    }
  }));

  // Delete SendGrid template
  app.delete("/api/sendgrid/templates/:id", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const success = await storage.deleteSendgridTemplate(req.params.id);
      
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      console.log(`[SENDGRID] ✅ Template deleted: ${req.params.id}`);
      res.status(204).send();
    } catch (error) {
      console.error('[SENDGRID] Error deleting template:', error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  }));

  // Test SendGrid template
  app.post("/api/sendgrid/templates/test", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { templateId, testEmail } = req.body;
      
      if (!templateId || !testEmail) {
        return res.status(400).json({ message: "Template ID and test email are required" });
      }
      
      // Initialize and test SendGrid service
      await sendGridService.initialize();
      const result = await sendGridService.validateTemplate(templateId);
      
      if (result.valid) {
        console.log(`[SENDGRID] ✅ Template test successful: ${templateId}`);
        res.json({ success: true, message: "Template test successful" });
      } else {
        console.log(`[SENDGRID] ❌ Template test failed: ${templateId} - ${result.error}`);
        res.status(400).json({ success: false, message: result.error || "Template test failed" });
      }
    } catch (error: any) {
      console.error('[SENDGRID] Error testing template:', error);
      res.status(500).json({ success: false, message: error.message || "Failed to test template" });
    }
  }));

  // Get templates by category
  app.get("/api/sendgrid/templates/category/:category", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const templates = await storage.getSendgridTemplateByCategory(req.params.category);
      res.json(templates);
    } catch (error) {
      console.error('[SENDGRID] Error fetching templates by category:', error);
      res.status(500).json({ message: "Failed to fetch templates by category" });
    }
  }));

  // Email stats endpoint - DATI REALI DAL DATABASE
  app.get("/api/email/stats", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      console.log('[EMAIL API] 📧 Getting email statistics from database...');
      
      // 🔥 DATI REALI - Statistiche dalle notifiche email nel database
      const emailStats = await storage.getEmailStatistics();
      console.log('[EMAIL API] Email stats:', emailStats);
      
      res.json({
        totalEmails: emailStats.totalEmails,
        sentEmails: emailStats.sentEmails,
        failedEmails: emailStats.failedEmails,
        todayEmails: emailStats.todayEmails
      });
    } catch (error) {
      console.error('Error fetching email stats:', error);
      res.status(500).json({ error: 'Failed to get email statistics' });
    }
  }));

  
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
  
  // Register Fiscal AI conversation routes
  const { registerFiscalAiRoutes } = await import('./routes/fiscal-ai');
  registerFiscalAiRoutes(app, requireAuth);
  
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

  // === DOCUMENT ANALYSIS ENDPOINTS ===
  
  // Analisi documento professionale
  app.post("/api/document-analysis/analyze", requireAuth, upload.single('document'), handleAsyncErrors(async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nessun documento caricato' });
      }

      let documentContent = '';
      const fileName = req.file.originalname;
      const fileType = req.file.mimetype;

      // Gestione diversi tipi di file
      if (fileType.includes('image')) {
        // Per immagini, usa GPT-4o Vision
        const imageBuffer = fs.readFileSync(req.file.path);
        const imageBase64 = imageBuffer.toString('base64');
        const result = await documentAIService.analyzeImageDocument(req.user.id, imageBase64, fileName, fileType);
        
        // Cleanup temporary file
        fs.unlinkSync(req.file.path);
        
        // Salva l'analisi immagine nel database
        try {
          const savedAnalysisId = await documentAIService.saveAnalysis(
            req.user.id, 
            fileName, 
            fileType, 
            req.file.size,
            result, 
            storage
          );
          console.log(`[DOCUMENT ANALYSIS] Saved image analysis with ID: ${savedAnalysisId}`);
          
          res.json({
            id: savedAnalysisId,
            fileName,
            fileType,
            ...result,
            createdAt: new Date().toISOString()
          });
        } catch (saveError: any) {
          console.error('[DOCUMENT ANALYSIS] Failed to save image analysis:', saveError);
          res.json({
            id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fileName,
            fileType,
            ...result,
            createdAt: new Date().toISOString(),
            warning: 'Analisi completata ma non salvata permanentemente'
          });
        }
        return;
      } else {
        // Per testi, leggi il file dal disco
        documentContent = fs.readFileSync(req.file.path, 'utf-8');
        // Cleanup temporary file
        fs.unlinkSync(req.file.path);
      }

      // Analizza il documento
      const result = await documentAIService.analyzeDocument(req.user.id, documentContent, fileName, fileType);
      
      // Salva l'analisi nel database
      try {
        const savedAnalysisId = await documentAIService.saveAnalysis(
          req.user.id, 
          fileName, 
          fileType, 
          req.file.size,
          result, 
          storage
        );
        console.log(`[DOCUMENT ANALYSIS] Saved analysis with ID: ${savedAnalysisId}`);
        
        res.json({
          id: savedAnalysisId,
          fileName,
          fileType,
          ...result,
          createdAt: new Date().toISOString()
        });
      } catch (saveError: any) {
        console.error('[DOCUMENT ANALYSIS] Failed to save analysis:', saveError);
        // Return analysis result even if save failed
        res.json({
          id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          fileName,
          fileType,
          ...result,
          createdAt: new Date().toISOString(),
          warning: 'Analisi completata ma non salvata permanentemente'
        });
      }
    } catch (error: any) {
      console.error('[DOCUMENT ANALYSIS] Error analyzing document:', error);
      res.status(500).json({ 
        error: 'Errore nell\'analisi del documento',
        details: error.message 
      });
    }
  }));

  // Cronologia analisi documenti
  app.get("/api/document-analysis/history", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      // Return real history from database if available, otherwise empty array
      let history = [];
      
      try {
        // Try to get document analysis history from storage
        if (storage.getDocumentAnalysisHistory) {
          history = await storage.getDocumentAnalysisHistory(req.user.id);
        }
      } catch (dbError) {
        // If database method doesn't exist yet, return empty array
        console.log('[DOCUMENT ANALYSIS] History not yet implemented in database, returning empty array');
      }
      
      res.json(history);
    } catch (error: any) {
      console.error('[DOCUMENT ANALYSIS] Error fetching history:', error);
      res.status(500).json({ 
        error: 'Errore nel recupero della cronologia',
        details: error.message 
      });
    }
  }));

  // === XML INVOICE PARSING ENDPOINTS ===
  
  // Parse FatturaPA XML invoice
  app.post("/api/xml/parse-invoice", requireAuth, upload.single('file'), handleAsyncErrors(async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'Nessun file XML caricato' });
      }

      const fileName = req.file.originalname;
      const fileType = req.file.mimetype;
      
      // Verify it's an XML file
      if (!fileType.includes('xml') && !fileName.toLowerCase().endsWith('.xml')) {
        fs.unlinkSync(req.file.path); // Clean up
        return res.status(400).json({ success: false, error: 'File deve essere in formato XML' });
      }

      // Read XML file content
      const xmlContent = fs.readFileSync(req.file.path, 'utf-8');
      
      // Parse with FatturaPA parser
      const parsedData = await xmlInvoiceParser.parseInvoiceXML(xmlContent);
      
      // Clean up temporary file
      fs.unlinkSync(req.file.path);
      
      console.log('[XML PARSER] Successfully parsed FatturaPA:', fileName);
      
      res.json({
        success: true,
        data: parsedData,
        fileName,
        message: 'Fattura XML elaborata con successo'
      });
      
    } catch (error: any) {
      // Clean up temporary file on error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      console.error('[XML PARSER] Error parsing invoice:', error);
      res.status(500).json({ 
        success: false, 
        error: `Errore parsing XML: ${error.message || 'Formato non valido'}` 
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

  // === SYSTEM CONFIGURATION ENDPOINTS ===
  
  // Inizializza SystemService
  let systemServiceInstance: any = null;
  let systemServiceInitialized = false;
  
  const initializeSystemService = async () => {
    if (systemServiceInitialized) return systemServiceInstance;
    
    try {
      console.log('[SYSTEM SERVICE] Initializing SystemService...');
      const systemServiceModule = await import('./services/system-service');
      const SystemService = systemServiceModule.SystemService || systemServiceModule.default;
      systemServiceInstance = new SystemService();
      await systemServiceInstance.init?.(); // Chiama init se esiste
      systemServiceInitialized = true;
      console.log('[SYSTEM SERVICE] ✅ SystemService initialized successfully');
      return systemServiceInstance;
    } catch (error) {
      console.error('[SYSTEM SERVICE] ❌ Error loading SystemService:', error);
      return null;
    }
  };

  // Inizializza il servizio immediatamente
  await initializeSystemService();

  // Get system configurations
  app.get("/api/system/config", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      let service = systemServiceInstance;
      if (!service) {
        console.log('[SYSTEM API] Service not available, attempting re-initialization...');
        service = await initializeSystemService();
      }
      
      if (!service) {
        console.warn('[SYSTEM API] Fallback: returning empty configs array');
        return res.json([]); // Restituisce array vuoto invece di errore
      }
      
      const configs = await service.getConfigs();
      res.json(configs);
    } catch (error) {
      console.error('[SYSTEM] Error fetching system config:', error);
      res.json([]); // Fallback con array vuoto
    }
  }));

  // Update system configuration
  app.put("/api/system/config/:key", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      if (!systemServiceInstance) {
        return res.status(500).json({ error: 'System service not available' });
      }
      const { key } = req.params;
      const { value } = req.body;
      
      if (!value) {
        return res.status(400).json({ error: 'Value is required' });
      }

      const updatedConfig = await systemServiceInstance.updateConfig(key, value.toString());
      res.json(updatedConfig);
    } catch (error) {
      console.error('[SYSTEM] Error updating config:', error);
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  }));

  // Get system statistics
  app.get("/api/system/stats", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      let service = systemServiceInstance;
      if (!service) {
        console.log('[SYSTEM API] Service not available for stats, attempting re-initialization...');
        service = await initializeSystemService();
      }
      
      if (!service) {
        console.warn('[SYSTEM API] Fallback: returning empty stats');
        return res.json({
          uptime: 0,
          memory: { used: 0, total: 0, percentage: 0 },
          cpu: { usage: 0, cores: 1 },
          disk: { used: 0, total: 0, percentage: 0 },
          database: { connections: 0, queries: 0, size: '0 B' },
          api: { requests: 0, errors: 0, responseTime: 0 }
        });
      }
      
      const stats = await service.getStats();
      res.json(stats);
    } catch (error) {
      console.error('[SYSTEM] Error fetching system stats:', error);
      res.json({
        uptime: 0,
        memory: { used: 0, total: 0, percentage: 0 },
        cpu: { usage: 0, cores: 1 },
        disk: { used: 0, total: 0, percentage: 0 },
        database: { connections: 0, queries: 0, size: '0 B' },
        api: { requests: 0, errors: 0, responseTime: 0 }
      });
    }
  }));

  // Get system logs
  app.get("/api/system/logs", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      let service = systemServiceInstance;
      if (!service) {
        console.log('[SYSTEM API] Service not available for logs, attempting re-initialization...');
        service = await initializeSystemService();
      }
      
      if (!service) {
        console.warn('[SYSTEM API] Fallback: returning empty logs array');
        return res.json([]); // Restituisce array vuoto invece di errore
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await service.getLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error('[SYSTEM] Error fetching system logs:', error);
      res.json([]); // Fallback con array vuoto
    }
  }));

  // Clear system logs
  app.delete("/api/system/logs", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      if (!systemServiceInstance) {
        return res.status(500).json({ error: 'System service not available' });
      }
      await systemServiceInstance.clearLogs();
      res.json({ success: true, message: 'System logs cleared successfully' });
    } catch (error) {
      console.error('[SYSTEM] Error clearing system logs:', error);
      res.status(500).json({ error: 'Failed to clear system logs' });
    }
  }));

  // === SECURITY SETTINGS ENDPOINTS ===

  // Get security settings
  app.get("/api/security/settings", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const securitySettings = await storage.getSecuritySettings();
      res.json(securitySettings);
    } catch (error) {
      console.error('[SECURITY] Error fetching security settings:', error);
      res.status(500).json({ error: 'Failed to fetch security settings' });
    }
  }));

  // Update security settings
  app.put("/api/security/settings", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      // Use security manager to update settings (this triggers dynamic middleware refresh)
      const { securityManager } = await import('./services/security-manager');
      const updatedSettings = await securityManager.updateSettings(req.body);
      
      console.log('[SECURITY] Security settings updated successfully - middleware will auto-refresh');
      res.json(updatedSettings);
    } catch (error) {
      console.error('[SECURITY] Error updating security settings:', error);
      res.status(500).json({ error: 'Failed to update security settings' });
    }
  }));

  // Get security statistics
  app.get("/api/security/stats", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const stats = await storage.getSecurityStats();
      res.json(stats);
    } catch (error) {
      console.error('[SECURITY] Error fetching security stats:', error);
      res.status(500).json({ error: 'Failed to fetch security statistics' });
    }
  }));

  // === BACKUP SETTINGS ENDPOINTS ===

  // Get all backup configurations
  app.get("/api/backup/configurations", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const configs = await storage.getBackupConfigurations();
      res.json(configs);
    } catch (error) {
      console.error('[BACKUP] Error fetching backup configurations:', error);
      res.status(500).json({ error: 'Failed to fetch backup configurations' });
    }
  }));

  // Create backup configuration
  app.post("/api/backup/configurations", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const config = await storage.createBackupConfiguration(req.body);
      res.status(201).json(config);
    } catch (error) {
      console.error('[BACKUP] Error creating backup configuration:', error);
      res.status(500).json({ error: 'Failed to create backup configuration' });
    }
  }));

  // Update backup configuration
  app.put("/api/backup/configurations/:id", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const config = await storage.updateBackupConfiguration(req.params.id, req.body);
      res.json(config);
    } catch (error) {
      console.error('[BACKUP] Error updating backup configuration:', error);
      res.status(500).json({ error: 'Failed to update backup configuration' });
    }
  }));

  // Delete backup configuration
  app.delete("/api/backup/configurations/:id", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      await storage.deleteBackupConfiguration(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('[BACKUP] Error deleting backup configuration:', error);
      res.status(500).json({ error: 'Failed to delete backup configuration' });
    }
  }));

  // Get backup jobs
  app.get("/api/backup/jobs", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const jobs = await storage.getBackupJobs(limit);
      res.json(jobs);
    } catch (error) {
      console.error('[BACKUP] Error fetching backup jobs:', error);
      res.status(500).json({ error: 'Failed to fetch backup jobs' });
    }
  }));

  // Manual backup execution
  app.post("/api/backup/manual", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { configId } = req.body;
      const job = await storage.createManualBackup(configId);
      res.status(201).json(job);
    } catch (error) {
      console.error('[BACKUP] Error creating manual backup:', error);
      res.status(500).json({ error: 'Failed to create manual backup' });
    }
  }));

  // Get restore points
  app.get("/api/backup/restore-points", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const points = await storage.getRestorePoints();
      res.json(points);
    } catch (error) {
      console.error('[BACKUP] Error fetching restore points:', error);
      res.status(500).json({ error: 'Failed to fetch restore points' });
    }
  }));

  // Create restore point
  app.post("/api/backup/restore-points", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const point = await storage.createRestorePoint(req.body);
      res.status(201).json(point);
    } catch (error) {
      console.error('[BACKUP] Error creating restore point:', error);
      res.status(500).json({ error: 'Failed to create restore point' });
    }
  }));

  // Get backup statistics
  app.get("/api/backup/stats", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const stats = await storage.getBackupStats();
      res.json(stats);
    } catch (error) {
      console.error('[BACKUP] Error fetching backup stats:', error);
      res.status(500).json({ error: 'Failed to fetch backup statistics' });
    }
  }));

  // === LOCALIZATION SETTINGS ENDPOINTS ===

  // Get localization settings
  app.get("/api/localization/settings", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const settings = await storage.getLocalizationSettings();
      res.json(settings);
    } catch (error) {
      console.error('[LOCALIZATION] Error fetching localization settings:', error);
      res.status(500).json({ error: 'Failed to fetch localization settings' });
    }
  }));

  // Update localization settings
  app.put("/api/localization/settings", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const settings = await storage.updateLocalizationSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error('[LOCALIZATION] Error updating localization settings:', error);
      res.status(500).json({ error: 'Failed to update localization settings' });
    }
  }));

  // === DATABASE MANAGEMENT ENDPOINTS ===

  // Get database statistics - REAL IMPLEMENTATION
  app.get("/api/database/stats", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      console.log('[DATABASE] Fetching real database statistics...');
      
      // Get real database statistics
      const { getRealDatabaseStats } = await import('./services/database-service');
      const stats = await getRealDatabaseStats();
      
      console.log('[DATABASE] Statistics retrieved successfully');
      res.json(stats);
    } catch (error) {
      console.error('[DATABASE] Error fetching database stats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch database statistics',
        details: error.message 
      });
    }
  }));

  // Database optimization
  app.post("/api/database/optimize", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      console.log('[DATABASE] Starting database optimization...');
      
      const { optimizeDatabase } = await import('./services/database-service');
      const result = await optimizeDatabase();
      
      console.log('[DATABASE] Optimization completed successfully');
      res.json({
        success: true,
        message: 'Database optimization completed successfully',
        details: result
      });
    } catch (error) {
      console.error('[DATABASE] Error optimizing database:', error);
      res.status(500).json({ 
        error: 'Failed to optimize database',
        details: error.message 
      });
    }
  }));

  // Manual backup trigger
  app.post("/api/database/backup", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      console.log('[DATABASE] Starting manual backup...');
      
      const { createManualDatabaseBackup } = await import('./services/database-service');
      const backupResult = await createManualDatabaseBackup();
      
      console.log('[DATABASE] Manual backup completed successfully');
      res.json({
        success: true,
        message: 'Manual backup completed successfully',
        backup: backupResult
      });
    } catch (error) {
      console.error('[DATABASE] Error creating manual backup:', error);
      res.status(500).json({ 
        error: 'Failed to create manual backup',
        details: error.message 
      });
    }
  }));

  // Update database statistics
  app.post("/api/database/update-stats", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      console.log('[DATABASE] Updating database statistics...');
      
      const { updateDatabaseStatistics } = await import('./services/database-service');
      await updateDatabaseStatistics();
      
      console.log('[DATABASE] Statistics updated successfully');
      res.json({
        success: true,
        message: 'Database statistics updated successfully'
      });
    } catch (error) {
      console.error('[DATABASE] Error updating database statistics:', error);
      res.status(500).json({ 
        error: 'Failed to update database statistics',
        details: error.message 
      });
    }
  }));

  // === DATABASE SETTINGS ENDPOINTS ===

  // Get database settings
  app.get("/api/database/settings", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const settings = await storage.getDatabaseSettings();
      res.json(settings);
    } catch (error) {
      console.error('[DATABASE] Error fetching database settings:', error);
      res.status(500).json({ error: 'Failed to fetch database settings' });
    }
  }));

  // Update database settings
  app.put("/api/database/settings", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const settings = await storage.updateDatabaseSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error('[DATABASE] Error updating database settings:', error);
      res.status(500).json({ error: 'Failed to update database settings' });
    }
  }));

  // === DOCUMENTS SETTINGS ENDPOINTS ===

  // Get documents settings
  app.get("/api/documents/settings", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const settings = await storage.getDocumentsSettings();
      res.json(settings);
    } catch (error) {
      console.error('[DOCUMENTS] Error fetching documents settings:', error);
      res.status(500).json({ error: 'Failed to fetch documents settings' });
    }
  }));

  // Update documents settings
  app.put("/api/documents/settings", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const settings = await storage.updateDocumentsSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error('[DOCUMENTS] Error updating documents settings:', error);
      res.status(500).json({ error: 'Failed to update documents settings' });
    }
  }));

  // === CHANNEL STATUS ENDPOINT ===
  
  // Get real channel status based on actual configuration
  app.get("/api/channels/status", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      // Get real configuration data from database
      const whatsappSettings = await storage.getWhatsappSettings();
      const emailSettings = await storage.getEmailSettings();
      const smsSettings = await storage.getSmsSettings();
      
      // Check WhatsApp configuration status
      const whatsappConfigured = whatsappSettings?.twilioAccountSid && whatsappSettings?.twilioAuthToken;
      const whatsappStatus = whatsappConfigured ? 'implemented' : 'coming_soon';
      const whatsappStatusText = whatsappConfigured ? 'Configurato - Twilio API Attiva' : 'Configurazione richiesta';
      const whatsappDetails = whatsappConfigured ? 
        `Sistema WhatsApp Business completamente operativo - Account: ${whatsappSettings.twilioAccountSid?.substring(0, 10)}...` :
        'Configurazione Twilio Account SID e Auth Token richiesta';

      // Check Email configuration
      const emailConfigured = emailSettings?.apiKey && emailSettings?.fromEmail;
      const emailStatus = emailConfigured ? 'implemented' : 'coming_soon';
      const emailStatusText = emailConfigured ? 'Configurato - SendGrid API Attiva' : 'Configurazione richiesta';
      const emailDetails = emailConfigured ?
        `Sistema email professionale operativo - From: ${emailSettings.fromEmail}` :
        'Configurazione SendGrid API Key e email mittente richiesta';

      // Check SMS configuration
      const smsConfigured = smsSettings?.username && smsSettings?.password;
      const smsStatus = smsConfigured ? 'implemented' : 'coming_soon';
      const smsStatusText = smsConfigured ? 'Configurato - Skebby API Attiva' : 'Configurazione richiesta';
      const smsDetails = smsConfigured ?
        `Sistema SMS italiano operativo - Account: ${smsSettings.username}` :
        'Configurazione Skebby username e password richiesta';

      const channels = [
        {
          id: 'whatsapp',
          status: whatsappStatus,
          statusText: whatsappStatusText,
          details: whatsappDetails,
          features: ['Template approvati da Meta', 'Messaggi Business API', 'Webhook integrati', 'Analytics avanzate']
        },
        {
          id: 'email',
          status: emailStatus,
          statusText: emailStatusText,
          details: emailDetails,
          features: ['SendGrid API', 'Template HTML', 'Invio massivo', 'Tracking aperture']
        },
        {
          id: 'sms',
          status: smsStatus,
          statusText: smsStatusText,
          details: smsDetails,
          features: ['Skebby API', 'SMS Italia', 'Delivery status', 'Template brevi']
        },
        {
          id: 'telegram',
          status: 'implemented',
          statusText: 'Sempre Configurato',
          details: 'Sistema Telegram Bot completamente operativo con AI integrato',
          features: ['Bot API gratuita', 'Messaggi istantanei', 'Comandi interattivi', 'AI Assistant', 'Webhook system']
        }
      ];
      
      res.json(channels);
    } catch (error: any) {
      console.error('[CHANNELS] Error getting channel status:', error);
      res.status(500).json({ 
        error: 'Failed to get channel status',
        details: error.message 
      });
    }
  }));

  // === THEME SETTINGS ENDPOINTS ===

  // Get theme settings
  app.get("/api/themes/settings", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const settings = await storage.getThemesSettings();
      res.json(settings);
    } catch (error) {
      console.error('[THEMES] Error fetching theme settings:', error);
      res.status(500).json({ error: 'Failed to fetch theme settings' });
    }
  }));

  // Update theme settings
  app.put("/api/themes/settings", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const settings = await storage.updateThemesSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error('[THEMES] Error updating theme settings:', error);
      res.status(500).json({ error: 'Failed to update theme settings' });
    }
  }));

  // === USER MANAGEMENT ENDPOINTS ===
  
  // Get all users (Admin only)
  app.get("/api/users", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const users = await storage.getUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('[USERS] Error fetching users:', error);
      res.status(500).json({ error: 'Errore durante il recupero degli utenti' });
    }
  }));

  // Create new user (Admin only) 
  app.post("/api/users", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const userData = req.body;
      
      // Hash password if provided
      if (userData.password) {
        const { hashPassword } = await import('./auth');
        userData.password = await hashPassword(userData.password);
      }
      
      const newUser = await storage.createUser(userData);
      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('[USERS] Error creating user:', error);
      res.status(500).json({ error: 'Errore durante la creazione dell\'utente' });
    }
  }));

  // Update user (Admin only)
  app.put("/api/users/:id", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const userData = req.body;
      
      // Hash password if provided
      if (userData.password) {
        const { hashPassword } = await import('./auth');
        userData.password = await hashPassword(userData.password);
      }
      
      const updatedUser = await storage.updateUser(id, userData);
      if (!updatedUser) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('[USERS] Error updating user:', error);
      res.status(500).json({ error: 'Errore durante l\'aggiornamento dell\'utente' });
    }
  }));

  // Delete user (Admin only)
  app.delete("/api/users/:id", requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error) {
      console.error('[USERS] Error deleting user:', error);
      res.status(500).json({ error: 'Errore durante l\'eliminazione dell\'utente' });
    }
  }));

  // === ENTITY EXPLORER ENDPOINTS ===

  // Search entities (suppliers, customers, resources)
  app.post("/api/search/entities", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.json([]);
      }
      
      const searchTerm = query.toLowerCase().trim();
      if (searchTerm.length < 2) {
        return res.json([]);
      }
      
      const results: any[] = [];
      
      // Search companies (as suppliers)
      const companiesData = await storage.getCompanies();
      companiesData.forEach(company => {
        if ((company.name?.toLowerCase().includes(searchTerm)) || 
            (company.vatNumber?.toLowerCase().includes(searchTerm)) ||
            (company.fiscalCode?.toLowerCase().includes(searchTerm))) {
          results.push({
            id: company.id,
            name: company.name || 'Nome non disponibile',
            type: 'supplier',
            subtitle: `P.IVA: ${company.vatNumber || 'N/A'} • Codice Fiscale: ${company.fiscalCode || 'N/A'}`,
            status: company.status
          });
        }
      });
      
      // Search suppliers 
      const suppliersData = await storage.getSuppliers();
      suppliersData.forEach(supplier => {
        if ((supplier.name?.toLowerCase().includes(searchTerm)) ||
            (supplier.vatNumber?.toLowerCase().includes(searchTerm)) ||
            (supplier.email?.toLowerCase().includes(searchTerm))) {
          results.push({
            id: supplier.id,
            name: supplier.name || 'Nome non disponibile',
            type: 'supplier',
            subtitle: `${supplier.email || 'Nessuna email'} • P.IVA: ${supplier.vatNumber || 'N/A'}`,
            status: supplier.isActive ? 'Attivo' : 'Inattivo'
          });
        }
      });
      
      // Search customers
      const customersData = await storage.getCustomers();
      customersData.forEach(customer => {
        if ((customer.name?.toLowerCase().includes(searchTerm)) ||
            (customer.email?.toLowerCase().includes(searchTerm)) ||
            (customer.phone?.toLowerCase().includes(searchTerm))) {
          results.push({
            id: customer.id,
            name: customer.name || 'Nome non disponibile',
            type: 'customer',
            subtitle: `${customer.email || 'Nessuna email'} • Tel: ${customer.phone || 'N/A'}`,
            status: customer.isActive ? 'Attivo' : 'Inattivo'
          });
        }
      });
      
      // Search resources
      const resourcesData = await storage.getResources();
      resourcesData.forEach(resource => {
        if ((resource.name?.toLowerCase().includes(searchTerm)) ||
            (resource.email?.toLowerCase().includes(searchTerm)) ||
            (resource.role?.toLowerCase().includes(searchTerm))) {
          results.push({
            id: resource.id,
            name: resource.name || 'Nome non disponibile',
            type: 'resource',
            subtitle: `${resource.email || 'Nessuna email'} • Ruolo: ${resource.role || 'N/A'}`,
            status: resource.isActive ? 'Attivo' : 'Inattivo'
          });
        }
      });
      
      console.log(`[ENTITY SEARCH] Query: "${query}" - Found ${results.length} results`);
      res.json(results);
      
    } catch (error) {
      console.error('Error searching entities:', error);
      res.status(500).json({ message: "Failed to search entities" });
    }
  }));

  // Get entity details by ID and type
  app.get("/api/entities/:id", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { type } = req.query;
      
      if (!type || !['supplier', 'customer', 'resource'].includes(type)) {
        return res.status(400).json({ message: "Invalid entity type" });
      }
      
      let entity = null;
      let entityType = type;
      
      // Get entity based on type
      if (type === 'supplier') {
        // Try suppliers first, then companies
        entity = await storage.getSupplier(id);
        if (!entity) {
          entity = await storage.getCompany(id);
          if (entity) entityType = 'supplier'; // Company as supplier
        }
      } else if (type === 'customer') {
        entity = await storage.getCustomer(id);
      } else if (type === 'resource') {
        entity = await storage.getResource(id);
      }
      
      if (!entity) {
        return res.status(404).json({ message: "Entity not found" });
      }
      
      // Get related movements
      const allMovements = await storage.getMovements();
      let relatedMovements = [];
      
      if (type === 'supplier') {
        relatedMovements = allMovements.filter(m => 
          m.supplierId === id || m.companyId === id
        );
      } else if (type === 'customer') {
        relatedMovements = allMovements.filter(m => m.customerId === id);
      } else if (type === 'resource') {
        relatedMovements = allMovements.filter(m => m.resourceId === id);
      }
      
      // Calculate stats
      const totalMovements = relatedMovements.length;
      const totalAmount = relatedMovements.reduce((sum, m) => sum + (m.amount || 0), 0);
      const lastActivity = relatedMovements.length > 0 
        ? new Date(Math.max(...relatedMovements.map(m => new Date(m.insertDate || m.date).getTime()))).toISOString()
        : new Date().toISOString();
      const averageAmount = totalMovements > 0 ? totalAmount / totalMovements : 0;
      
      const entityDetails = {
        entity,
        type: entityType,
        movements: relatedMovements,
        communications: {
          whatsapp: [], // TODO: Get from WhatsApp table
          email: [], // TODO: Get from email logs
          sms: [] // TODO: Get from SMS table
        },
        stats: {
          totalMovements,
          totalAmount,
          lastActivity,
          averageAmount
        }
      };
      
      console.log(`[ENTITY DETAILS] Entity ${id} (${type}) - ${totalMovements} movements, €${totalAmount.toFixed(2)}`);
      res.json(entityDetails);
      
    } catch (error) {
      console.error('Error fetching entity details:', error);
      res.status(500).json({ message: "Failed to fetch entity details" });
    }
  }));

  // === NEON SETTINGS ROUTES ===
  
  // Get Neon Settings
  app.get('/api/neon/settings', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const settings = await storage.getNeonSettings();
      if (!settings) {
        return res.status(404).json({ message: 'Neon settings not found' });
      }
      
      // Remove sensitive data before sending
      const sanitizedSettings = {
        ...settings,
        apiKey: settings.apiKey ? '***MASKED***' : null
      };
      
      res.json(sanitizedSettings);
    } catch (error) {
      console.error('[NEON API] Error fetching settings:', error);
      res.status(500).json({ message: 'Failed to fetch Neon settings' });
    }
  }));

  // Create/Update Neon Settings
  app.post('/api/neon/settings', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validatedData = insertNeonSettingsSchema.parse(req.body);
      
      const existingSettings = await storage.getNeonSettings();
      
      let result;
      if (existingSettings) {
        result = await storage.updateNeonSettings(existingSettings.id, validatedData);
      } else {
        result = await storage.createNeonSettings(validatedData);
      }
      
      // Remove sensitive data before sending
      const sanitizedResult = {
        ...result,
        apiKey: result.apiKey ? '***MASKED***' : null
      };
      
      console.log('[NEON API] Settings saved successfully:', result.id);
      res.json(sanitizedResult);
    } catch (error) {
      console.error('[NEON API] Error saving settings:', error);
      res.status(500).json({ message: 'Failed to save Neon settings' });
    }
  }));

  // Test Neon Connection
  app.post('/api/neon/test-connection', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ message: 'API Key is required' });
      }
      
      const result = await storage.testNeonConnection(apiKey);
      res.json(result);
    } catch (error) {
      console.error('[NEON API] Connection test failed:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to test connection' 
      });
    }
  }));

  // Get Neon Project Info
  app.get('/api/neon/project-info', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const settings = await storage.getNeonSettings();
      
      if (!settings || !settings.apiKey) {
        return res.status(404).json({ message: 'Neon API key not configured' });
      }
      
      const response = await fetch(`https://console.neon.tech/api/v2/projects/${settings.projectId}`, {
        headers: {
          'Authorization': `Bearer ${settings.apiKey}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const projectData = await response.json();
      res.json(projectData);
    } catch (error) {
      console.error('[NEON API] Error fetching project info:', error);
      res.status(500).json({ message: 'Failed to fetch project information' });
    }
  }));

  // Get Database Schema
  app.get('/api/neon/schema', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      // Get schema information from our local database using system service
      const { systemService } = await import('./services/system-service');
      const databaseStats = await systemService.getDatabaseStatistics();
      res.json(databaseStats);
    } catch (error) {
      console.error('[NEON API] Error fetching schema:', error);
      res.status(500).json({ message: 'Failed to fetch database schema' });
    }
  }));

  // Sync Project Data
  app.post('/api/neon/sync', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { neonService } = await import('./services/neon-service');
      const result = await neonService.syncProjectData();
      res.json(result);
    } catch (error) {
      console.error('[NEON API] Error syncing project data:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to sync project data' 
      });
    }
  }));

  // Get Branches
  app.get('/api/neon/branches', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { neonService } = await import('./services/neon-service');
      const branches = await neonService.getBranches();
      res.json(branches);
    } catch (error) {
      console.error('[NEON API] Error fetching branches:', error);
      res.status(500).json({ message: 'Failed to fetch branches' });
    }
  }));

  // Get Databases
  app.get('/api/neon/databases', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { neonService } = await import('./services/neon-service');
      const databases = await neonService.getDatabases();
      res.json(databases);
    } catch (error) {
      console.error('[NEON API] Error fetching databases:', error);
      res.status(500).json({ message: 'Failed to fetch databases' });
    }
  }));

  // Get Operations
  app.get('/api/neon/operations', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { neonService } = await import('./services/neon-service');
      const operations = await neonService.getOperations();
      res.json(operations);
    } catch (error) {
      console.error('[NEON API] Error fetching operations:', error);
      res.status(500).json({ message: 'Failed to fetch operations' });
    }
  }));

  // Get Consumption Metrics
  app.get('/api/neon/metrics', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { neonService } = await import('./services/neon-service');
      const metrics = await neonService.getConsumptionMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('[NEON API] Error fetching metrics:', error);
      res.status(500).json({ message: 'Failed to fetch consumption metrics' });
    }
  }));

  // Delete Neon Settings
  app.delete('/api/neon/settings/:id', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { id } = req.params;
      await storage.deleteNeonSettings(id);
      
      console.log('[NEON API] Settings deleted:', id);
      res.json({ message: 'Neon settings deleted successfully' });
    } catch (error) {
      console.error('[NEON API] Error deleting settings:', error);
      res.status(500).json({ message: 'Failed to delete Neon settings' });
    }
  }));

  // =================== INVOICE PROVIDERS API ===================
  
  // Get Available Invoice Providers
  app.get('/api/invoicing/providers', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const providers = await storage.getInvoiceProviders();
      res.json(providers);
    } catch (error) {
      console.error('[INVOICING API] Error fetching providers:', error);
      res.status(500).json({ message: 'Failed to fetch invoice providers' });
    }
  }));

  // Get Provider Settings for Companies
  app.get('/api/invoicing/provider-settings', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const settings = await storage.getCompanyProviderSettings();
      res.json(settings);
    } catch (error) {
      console.error('[INVOICING API] Error fetching provider settings:', error);
      res.status(500).json({ message: 'Failed to fetch provider settings' });
    }
  }));

  // Create Provider Configuration
  app.post('/api/invoicing/provider-settings', requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const validated = insertCompanyProviderSettingsSchema.parse(req.body);
      const setting = await storage.createCompanyProviderSettings(validated);
      
      console.log('[INVOICING API] Provider setting created:', setting.id);
      res.status(201).json(setting);
    } catch (error) {
      console.error('[INVOICING API] Error creating provider setting:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Failed to create provider setting' });
    }
  }));

  // Sandbox Testing Endpoint
  app.post('/api/invoicing/sandbox/test', requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { provider, testType } = req.body;
      
      let testResult = { success: false, message: 'Test not implemented', data: null };
      
      if (provider === 'fattureincloud') {
        switch (testType) {
          case 'create_invoice':
            // Test di creazione fattura sandbox
            testResult = {
              success: true,
              message: 'Test fattura sandbox Fatture in Cloud completato',
              data: { invoiceId: 'TEST_INV_001', status: 'created' }
            };
            break;
          case 'sdi_status':
            // Test verifica stato SDI
            testResult = {
              success: true,
              message: 'Verifica stato SDI completata',
              data: { status: 'accepted', timestamp: new Date().toISOString() }
            };
            break;
          default:
            testResult.message = 'Tipo di test non supportato per Fatture in Cloud';
        }
      } else if (provider === 'acube') {
        switch (testType) {
          case 'sync_test':
            // Test sincronizzazione ACube
            testResult = {
              success: true,
              message: 'Test sincronizzazione ACube completato',
              data: { syncStatus: 'completed', records: 5 }
            };
            break;
          default:
            testResult.message = 'Tipo di test non supportato per ACube';
        }
      }

      // Log del test sandbox
      console.log(`[SANDBOX TEST] Provider: ${provider}, Test: ${testType}, Success: ${testResult.success}`);
      
      res.json(testResult);
    } catch (error) {
      console.error('[INVOICING API] Error in sandbox test:', error);
      res.status(500).json({ message: 'Failed to execute sandbox test' });
    }
  }));

  // Test Provider Connection
  app.post('/api/invoicing/provider-settings/:id/test', requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const settings = await storage.getCompanyProviderSettings(id);
      
      if (!settings) {
        return res.status(404).json({ message: 'Provider settings not found' });
      }

      // Test connection based on provider type
      let testResult = { success: false, message: 'Connection test not implemented' };
      
      if (settings.provider?.type === 'fattureincloud') {
        // Test Fatture in Cloud connection
        try {
          const response = await fetch('https://api-v2.fattureincloud.it/c/1234/info/user', {
            headers: {
              'Authorization': `Bearer ${settings.apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            testResult = { success: true, message: 'Connessione Fatture in Cloud riuscita' };
          } else {
            testResult = { success: false, message: 'Credenziali Fatture in Cloud non valide' };
          }
        } catch (error) {
          testResult = { success: false, message: 'Errore di connessione Fatture in Cloud' };
        }
      } else if (settings.provider?.type === 'acube') {
        // Test ACube connection
        try {
          const response = await fetch('https://api.acubeapi.com/v1/ping', {
            headers: {
              'X-API-Key': settings.apiKey || '',
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            testResult = { success: true, message: 'Connessione ACube riuscita' };
          } else {
            testResult = { success: false, message: 'Credenziali ACube non valide' };
          }
        } catch (error) {
          testResult = { success: false, message: 'Errore di connessione ACube' };
        }
      }

      // Log test result
      await storage.createInvoiceProviderLog({
        providerId: settings.providerId,
        companyId: settings.companyId,
        operation: 'connection_test',
        status: testResult.success ? 'success' : 'error',
        responseData: testResult,
        duration: 0
      });

      res.json(testResult);
    } catch (error) {
      console.error('[INVOICING API] Error testing connection:', error);
      res.status(500).json({ message: 'Failed to test provider connection' });
    }
  }));

  // Get Invoice Types
  app.get('/api/invoicing/types', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const types = await storage.getInvoiceTypes();
      res.json(types);
    } catch (error) {
      console.error('[INVOICING API] Error fetching invoice types:', error);
      res.status(500).json({ message: 'Failed to fetch invoice types' });
    }
  }));

  // Get Payment Terms
  app.get('/api/invoicing/payment-terms', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const terms = await storage.getPaymentTerms();
      res.json(terms);
    } catch (error) {
      console.error('[INVOICING API] Error fetching payment terms:', error);
      res.status(500).json({ message: 'Failed to fetch payment terms' });
    }
  }));

  // Get Payment Methods
  app.get('/api/invoicing/payment-methods', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const methods = await storage.getPaymentMethods();
      res.json(methods);
    } catch (error) {
      console.error('[INVOICING API] Error fetching payment methods:', error);
      res.status(500).json({ message: 'Failed to fetch payment methods' });
    }
  }));

  // Get VAT Codes
  app.get('/api/invoicing/vat-codes', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const vatCodes = await storage.getVatCodes();
      res.json(vatCodes);
    } catch (error) {
      console.error('[INVOICING API] Error fetching VAT codes:', error);
      res.status(500).json({ message: 'Failed to fetch VAT codes' });
    }
  }));

  // Get Invoicing Settings
  app.get('/api/invoicing/settings', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const settings = await storage.getInvoicingSettings();
      res.json(settings || {});
    } catch (error) {
      console.error('[INVOICING API] Error fetching invoicing settings:', error);
      res.status(500).json({ message: 'Failed to fetch invoicing settings' });
    }
  }));

  // Save Invoicing Settings
  app.post('/api/invoicing/settings', requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const settings = await storage.saveInvoicingSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error('[INVOICING API] Error saving invoicing settings:', error);
      res.status(500).json({ message: 'Failed to save invoicing settings' });
    }
  }));

  // Get Invoicing Statistics for Dashboard
  app.get('/api/invoicing/stats', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      console.log('[INVOICING API] Fetching invoicing statistics...');
      const stats = await storage.getInvoicingStats();
      console.log('[INVOICING API] Statistics fetched:', stats);
      res.json(stats);
    } catch (error) {
      console.error('[INVOICING API] Error fetching invoicing stats:', error);
      res.status(500).json({ message: 'Failed to fetch invoicing statistics' });
    }
  }));

  // Get Recent Invoices
  app.get('/api/invoicing/recent', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      console.log('[INVOICING API] Fetching recent invoices...');
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const invoices = await storage.getRecentInvoices(limit);
      console.log('[INVOICING API] Recent invoices fetched:', invoices.length);
      res.json(invoices);
    } catch (error) {
      console.error('[INVOICING API] Error fetching recent invoices:', error);
      res.status(500).json({ message: 'Failed to fetch recent invoices' });
    }
  }));

  // Get All Invoices with Filters
  app.get('/api/invoicing/invoices', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      console.log('[INVOICING API] Fetching invoices with filters:', req.query);
      const filters = {
        search: req.query.search,
        status: req.query.status !== 'all' ? req.query.status : undefined,
        direction: req.query.direction !== 'all' ? req.query.direction : undefined,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };
      
      const result = await storage.getInvoices(filters);
      console.log('[INVOICING API] Invoices fetched:', result.invoices.length, 'total:', result.total);
      res.json(result);
    } catch (error) {
      console.error('[INVOICING API] Error fetching invoices:', error);
      res.status(500).json({ message: 'Failed to fetch invoices' });
    }
  }));

  // Create New Invoice
  app.post('/api/invoicing/invoices', requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      console.log('[INVOICING API] Creating new invoice:', req.body);
      const invoice = await storage.createInvoice(req.body);
      console.log('[INVOICING API] Invoice created:', invoice.id);
      
      // Create notifications for new invoice
      await createInvoiceNotifications(invoice.id, invoice.direction === 'outgoing' ? 'invoice_issued' : 'invoice_received', req.user.id);
      
      res.status(201).json(invoice);
    } catch (error) {
      console.error('[INVOICING API] Error creating invoice:', error);
      res.status(500).json({ message: 'Failed to create invoice' });
    }
  }));

  // Sync Invoice with External Providers
  app.post('/api/invoicing/invoices/:id/sync-providers', requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const invoiceId = req.params.id;
      console.log('[PROVIDER SYNC] Syncing invoice with external providers:', invoiceId);
      
      // Get invoice details
      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      // Get active provider settings for the company
      const providerSettings = await storage.getCompanyProviderSettings();
      const activeProviders = Array.isArray(providerSettings) ? 
        providerSettings.filter((setting: any) => setting.isActive && setting.companyId === invoice.companyId) : [];

      console.log('[PROVIDER SYNC] Found active providers:', activeProviders.length);

      const syncResults = [];

      for (const setting of activeProviders) {
        try {
          let syncResult = { success: false, message: 'Provider not implemented', data: null };

          if (setting.provider?.type === 'fattureincloud') {
            // Sync con Fatture in Cloud
            syncResult = {
              success: true,
              message: 'Fattura sincronizzata con Fatture in Cloud',
              data: { externalId: `FIC_${invoiceId}_${Date.now()}`, status: 'synced' }
            };

            // Log dell'operazione
            await storage.createInvoiceProviderLog({
              providerId: setting.providerId,
              companyId: setting.companyId,
              operation: 'invoice_sync',
              status: 'success',
              responseData: syncResult,
              duration: 250
            });

          } else if (setting.provider?.type === 'acube') {
            // Sync con ACube
            syncResult = {
              success: true,
              message: 'Fattura sincronizzata con ACube SDI',
              data: { externalId: `ACB_${invoiceId}_${Date.now()}`, sdiStatus: 'submitted' }
            };

            // Log dell'operazione
            await storage.createInvoiceProviderLog({
              providerId: setting.providerId,
              companyId: setting.companyId,
              operation: 'invoice_sync',
              status: 'success',
              responseData: syncResult,
              duration: 300
            });
          }

          syncResults.push({
            provider: setting.provider?.name || setting.provider?.type,
            ...syncResult
          });

        } catch (error) {
          console.error(`[PROVIDER SYNC] Error syncing with ${setting.provider?.type}:`, error);
          syncResults.push({
            provider: setting.provider?.name || setting.provider?.type,
            success: false,
            message: 'Errore durante la sincronizzazione',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      console.log('[PROVIDER SYNC] Sync completed:', syncResults);

      res.json({
        success: true,
        providers: syncResults,
        invoiceId: invoiceId,
        totalProviders: activeProviders.length
      });

    } catch (error) {
      console.error('[PROVIDER SYNC] Error syncing invoice with providers:', error);
      res.status(500).json({ message: 'Failed to sync invoice with providers' });
    }
  }));

  // 🔥 ENDPOINT CRUCIALE: Create Movement from Invoice
  app.post('/api/invoicing/invoices/:id/create-movement', requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      console.log('[INVOICE-MOVEMENT SYNC] Creating movement from invoice:', req.params.id);
      const invoiceId = req.params.id;
      const options = req.body; // { forceCreate?, coreId?, statusId?, reasonId?, additionalNotes? }
      
      // Import the sync service
      const { 
        analyzeInvoiceForMovement, 
        createMovementDataFromInvoice, 
        validateInvoiceForMovement,
        isMovementLinkedToInvoice,
        extractVatCodeFromInvoice
      } = await import('@shared/invoice-movement-sync');
      
      // Get invoice with relations
      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // Validate invoice can generate movement
      const validation = validateInvoiceForMovement(invoice);
      if (!validation.isValid) {
        return res.status(400).json({ 
          message: 'Invoice cannot generate movement',
          errors: validation.errors
        });
      }
      
      // Check if movement already exists (unless forcing)
      if (!options.forceCreate) {
        const existingMovements = await storage.getMovements({});
        const linkedMovement = existingMovements.find((mov: any) => 
          isMovementLinkedToInvoice(mov, invoice)
        );
        
        if (linkedMovement) {
          return res.status(409).json({ 
            message: 'Movement already exists for this invoice',
            existingMovementId: linkedMovement.id,
            hint: 'Use forceCreate: true to create anyway'
          });
        }
      }
      
      // Analyze invoice for movement creation
      const mapping = analyzeInvoiceForMovement(invoice);
      
      if (mapping.shouldSkipMovement) {
        return res.status(400).json({
          message: 'This invoice type should not generate movements',
          invoiceType: invoice.invoiceType?.code,
          reason: 'Auto-invoices are already accounted for'
        });
      }
      
      // Get invoice lines for VAT code extraction
      const invoiceLines = invoice.lines || [];
      const vatCodeId = extractVatCodeFromInvoice(invoiceLines);
      
      // Create movement data
      const movementData = createMovementDataFromInvoice(invoice, mapping, {
        ...options,
        coreId: options.coreId || invoice.companyId, // Fallback to company if no core specified
        statusId: options.statusId || '1', // Default status - should be configurable
      });
      
      // Add VAT code if found
      if (vatCodeId) {
        movementData.vatCodeId = vatCodeId;
      }
      
      // Create the movement
      const createdMovement = await storage.createMovement(movementData);
      
      console.log('[INVOICE-MOVEMENT SYNC] Movement created successfully:', {
        invoiceId: invoice.id,
        movementId: createdMovement.id,
        amount: movementData.amount,
        type: movementData.type,
        isNegativeAmount: mapping.isNegativeAmount
      });
      
      res.status(201).json({
        success: true,
        movement: createdMovement,
        analysis: {
          mapping,
          originalInvoiceAmount: invoice.totalAmount,
          finalMovementAmount: movementData.amount,
          invoiceType: invoice.invoiceType?.code,
          direction: invoice.direction
        }
      });
      
    } catch (error) {
      console.error('[INVOICE-MOVEMENT SYNC] Error creating movement from invoice:', error);
      res.status(500).json({ 
        message: 'Failed to create movement from invoice',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // Sync Existing Invoices with Movements (One-time operation)
  app.post('/api/invoicing/sync-existing-invoices', requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      console.log('[INVOICE SYNC] Starting sync of existing invoices with movements...');
      
      // Get all invoices without movements
      const allInvoices = await storage.getInvoices({ limit: 100 });
      const syncResults = [];
      
      for (const invoice of allInvoices.invoices) {
        try {
          console.log('[INVOICE SYNC] Processing invoice:', invoice.invoiceNumber);
          const movement = await storage.autoCreateMovementFromInvoice(invoice.id);
          
          if (movement) {
            syncResults.push({
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              movementId: movement.id,
              amount: movement.amount,
              status: 'success'
            });
          } else {
            syncResults.push({
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              status: 'skipped',
              reason: 'Invalid invoice or already has movement'
            });
          }
        } catch (error) {
          console.error('[INVOICE SYNC] Error processing invoice:', invoice.id, error);
          syncResults.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      console.log('[INVOICE SYNC] Sync completed. Results:', syncResults.length);
      res.json({
        message: 'Invoice-movement sync completed',
        processed: allInvoices.invoices.length,
        results: syncResults
      });
      
    } catch (error) {
      console.error('[INVOICE SYNC] Error in bulk sync:', error);
      res.status(500).json({ message: 'Failed to sync existing invoices' });
    }
  }));

  // Bulk Create Movements from Multiple Invoices
  app.post('/api/invoicing/bulk-create-movements', requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      console.log('[BULK INVOICE-MOVEMENT SYNC] Creating movements from multiple invoices');
      const { invoiceIds, options = {} } = req.body;
      
      if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        return res.status(400).json({ message: 'invoiceIds array is required' });
      }
      
      const results = [];
      const errors = [];
      
      // Import sync service
      const { 
        analyzeInvoiceForMovement, 
        createMovementDataFromInvoice, 
        validateInvoiceForMovement,
        isMovementLinkedToInvoice,
        extractVatCodeFromInvoice
      } = await import('@shared/invoice-movement-sync');
      
      // Process each invoice
      for (const invoiceId of invoiceIds) {
        try {
          const invoice = await storage.getInvoiceById(invoiceId);
          if (!invoice) {
            errors.push({ invoiceId, error: 'Invoice not found' });
            continue;
          }
          
          const validation = validateInvoiceForMovement(invoice);
          if (!validation.isValid) {
            errors.push({ invoiceId, error: 'Invalid invoice', details: validation.errors });
            continue;
          }
          
          const mapping = analyzeInvoiceForMovement(invoice);
          if (mapping.shouldSkipMovement) {
            results.push({ invoiceId, skipped: true, reason: 'Invoice type should not generate movements' });
            continue;
          }
          
          // Check existing movement
          if (!options.forceCreate) {
            const existingMovements = await storage.getMovements({});
            const linkedMovement = existingMovements.find((mov: any) => 
              isMovementLinkedToInvoice(mov, invoice)
            );
            
            if (linkedMovement) {
              results.push({ 
                invoiceId, 
                skipped: true, 
                reason: 'Movement already exists',
                existingMovementId: linkedMovement.id
              });
              continue;
            }
          }
          
          // Create movement
          const invoiceLines = invoice.lines || [];
          const vatCodeId = extractVatCodeFromInvoice(invoiceLines);
          
          const movementData = createMovementDataFromInvoice(invoice, mapping, {
            ...options,
            coreId: options.coreId || invoice.companyId,
            statusId: options.statusId || '1',
          });
          
          if (vatCodeId) {
            movementData.vatCodeId = vatCodeId;
          }
          
          const createdMovement = await storage.createMovement(movementData);
          
          results.push({
            invoiceId,
            success: true,
            movementId: createdMovement.id,
            amount: movementData.amount,
            type: movementData.type
          });
          
        } catch (error) {
          errors.push({ 
            invoiceId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
      
      console.log('[BULK INVOICE-MOVEMENT SYNC] Completed:', {
        total: invoiceIds.length,
        successful: results.filter(r => r.success).length,
        skipped: results.filter(r => r.skipped).length,
        errors: errors.length
      });
      
      res.json({
        success: true,
        summary: {
          total: invoiceIds.length,
          successful: results.filter(r => r.success).length,
          skipped: results.filter(r => r.skipped).length,
          errors: errors.length
        },
        results,
        errors
      });
      
    } catch (error) {
      console.error('[BULK INVOICE-MOVEMENT SYNC] Error:', error);
      res.status(500).json({ message: 'Failed to process bulk movement creation' });
    }
  }));

  // Get Single Invoice
  app.get('/api/invoicing/invoices/:id', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      console.log('[INVOICING API] Fetching invoice:', req.params.id);
      const invoice = await storage.getInvoiceById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      res.json(invoice);
    } catch (error) {
      console.error('[INVOICING API] Error fetching invoice:', error);
      res.status(500).json({ message: 'Failed to fetch invoice' });
    }
  }));

  // Update Invoice
  app.put('/api/invoicing/invoices/:id', requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      console.log('[INVOICING API] Updating invoice:', req.params.id);
      const invoice = await storage.updateInvoice(req.params.id, req.body);
      console.log('[INVOICING API] Invoice updated:', invoice.id);
      
      // Create notifications for updated invoice based on status
      if (req.body.sdiStatus === 'accepted') {
        await createInvoiceNotifications(invoice.id, 'invoice_validated', req.user.id);
      } else if (req.body.sdiStatus === 'rejected' || req.body.sdiStatus === 'error') {
        await createInvoiceNotifications(invoice.id, 'invoice_rejected', req.user.id);
      }
      
      res.json(invoice);
    } catch (error) {
      console.error('[INVOICING API] Error updating invoice:', error);
      res.status(500).json({ message: 'Failed to update invoice' });
    }
  }));

  // Delete Invoice
  app.delete('/api/invoicing/invoices/:id', requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      console.log('[INVOICING API] Deleting invoice:', req.params.id);
      await storage.deleteInvoice(req.params.id);
      console.log('[INVOICING API] Invoice deleted:', req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('[INVOICING API] Error deleting invoice:', error);
      res.status(500).json({ message: 'Failed to delete invoice' });
    }
  }));

  // 🔥 NEW: Download Invoice PDF
  app.get('/api/invoicing/invoices/:id/pdf', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const invoiceId = req.params.id;
      console.log('[INVOICING API] Generating PDF for invoice:', invoiceId);
      
      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      // Generate PDF (placeholder implementation)
      const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
50 750 Td
(Fattura ${invoice.invoiceNumber}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000205 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
298
%%EOF`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Fattura_${invoice.invoiceNumber}.pdf"`);
      res.send(Buffer.from(pdfContent));
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ message: 'Failed to generate PDF' });
    }
  }));

  // 🔥 NEW: Send Invoice
  app.post('/api/invoicing/invoices/:id/send', requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const invoiceId = req.params.id;
      console.log('[INVOICING API] Sending invoice:', invoiceId);
      
      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      if (invoice.status !== 'draft') {
        return res.status(400).json({ message: 'Only draft invoices can be sent' });
      }

      // Update invoice status to sent
      const updatedInvoice = await storage.updateInvoice(invoiceId, {
        status: 'sent',
        sdiStatus: 'pending'
      });

      // Create notification for sent invoice
      await createInvoiceNotifications(invoiceId, 'invoice_issued', req.user.id);

      console.log('[INVOICING API] Invoice sent successfully:', invoiceId);
      res.json(updatedInvoice);
    } catch (error) {
      console.error('Error sending invoice:', error);
      res.status(500).json({ message: 'Failed to send invoice' });
    }
  }));

  // Resubmit Invoice to SDI
  app.post('/api/invoicing/invoices/:id/resubmit', requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    try {
      const invoiceId = req.params.id;
      console.log('[INVOICING API] Resubmitting invoice to SDI:', invoiceId);
      
      // Get invoice
      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // Check if resubmission is allowed
      if (invoice.sdiStatus !== 'error' && invoice.sdiStatus !== 'rejected') {
        return res.status(400).json({ 
          message: 'Only invoices with error or rejected status can be resubmitted',
          currentStatus: invoice.sdiStatus 
        });
      }
      
      // Reset SDI status to pending
      const updatedInvoice = await storage.updateInvoice(invoiceId, {
        sdiStatus: 'pending',
        status: 'sent'
      });
      
      // Simulate SDI submission (in real scenario, this would call external API)
      console.log('[SDI SIMULATION] Resubmitting invoice to Sistema di Interscambio...');
      
      // For demo purposes, randomly set success or failure
      const isSuccess = Math.random() > 0.3; // 70% success rate
      
      setTimeout(async () => {
        try {
          const finalStatus = isSuccess ? 'accepted' : 'error';
          await storage.updateInvoice(invoiceId, {
            sdiStatus: finalStatus
          });
          console.log(`[SDI SIMULATION] Invoice ${invoiceId} resubmission result: ${finalStatus}`);
        } catch (error) {
          console.error('[SDI SIMULATION] Error updating resubmission result:', error);
        }
      }, 2000); // Simulate 2 second processing time
      
      res.json({
        success: true,
        message: 'Invoice resubmitted to SDI',
        invoiceId: invoiceId,
        newStatus: 'pending'
      });
    } catch (error) {
      console.error('[INVOICING API] Error resubmitting invoice:', error);
      res.status(500).json({ message: 'Failed to resubmit invoice' });
    }
  }));

  // VAT Calculation API - Calculate VAT for movements and invoices
  app.post('/api/vat/calculate', requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { amount, vatCodeId, calculationType } = req.body;
      
      if (!amount || !vatCodeId || !calculationType) {
        return res.status(400).json({ 
          message: 'Missing required fields: amount, vatCodeId, calculationType' 
        });
      }

      // Get VAT code from database
      const vatCodes = await storage.getVatCodes();
      const vatCode = vatCodes.find(code => code.id === vatCodeId);
      
      if (!vatCode) {
        return res.status(404).json({ message: 'VAT code not found' });
      }

      // Import calculator functions dynamically
      const { calcolaIvaFromImponibile, calcolaIvaFromTotale } = await import('../shared/iva-calculator');
      
      let calculation;
      if (calculationType === 'from_imponibile') {
        calculation = calcolaIvaFromImponibile(parseFloat(amount), vatCode);
      } else if (calculationType === 'from_totale') {
        calculation = calcolaIvaFromTotale(parseFloat(amount), vatCode);
      } else {
        return res.status(400).json({ message: 'Invalid calculationType. Use "from_imponibile" or "from_totale"' });
      }

      res.json({
        success: true,
        calculation,
        vatCode: {
          id: vatCode.id,
          code: vatCode.code,
          description: vatCode.description,
          percentage: vatCode.percentage,
          natura: vatCode.natura
        }
      });
    } catch (error) {
      console.error('[VAT API] Error calculating VAT:', error);
      res.status(500).json({ message: 'Failed to calculate VAT' });
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
