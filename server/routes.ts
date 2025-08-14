import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService } from "./ai-service";
import { 
  insertCompanySchema, insertCoreSchema, insertResourceSchema,
  insertIbanSchema, insertOfficeSchema, insertTagSchema,
  insertMovementStatusSchema, insertMovementReasonSchema, insertMovementSchema,
  insertNotificationSchema, insertSupplierSchema, insertCustomerSchema, insertEmailSettingsSchema,
  passwordResetSchema, resetPasswordSchema
} from "@shared/schema";
import { emailService } from './email-service';
import { setupAuth } from "./auth";
import { loginLimiter, apiLimiter, securityLogger, securityHeaders, sanitizeInput, sessionSecurity } from "./security-middleware";
import multer from 'multer';
import type { Request } from 'express';
import path from 'path';
import { z } from 'zod';
import fs from 'fs';
import { xmlInvoiceParser, type MovementSuggestion } from './xml-invoice-parser';

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
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; frame-ancestors 'self' *.replit.dev *.repl.co");
    
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
  
  // Debug middleware for API routes
  app.use('/api', (req, res, next) => {
    console.log(`API Request: ${req.method} ${req.path}`);
    next();
  });
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
      const validatedData = insertIbanSchema.parse(req.body);
      const iban = await storage.createIban(validatedData);
      res.status(201).json(iban);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      console.error('Error creating IBAN:', error);
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
      res.setHeader('Content-Type', getContentType(fileExtension));
      
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
      
      const stats = await storage.getMovementStats(period);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  }));

  app.get("/api/analytics/cash-flow", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const daysParam = req.query.days as string;
      let days = 30;
      
      if (daysParam) {
        const parsedDays = parseInt(daysParam, 10);
        if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 365) {
          return res.status(400).json({ message: "Days must be between 1 and 365" });
        }
        days = parsedDays;
      }
      
      const data = await storage.getCashFlowData(days);
      res.json(data);
    } catch (error) {
      console.error('Error fetching cash flow data:', error);
      res.status(500).json({ message: "Failed to fetch cash flow data" });
    }
  }));

  app.get("/api/analytics/status-distribution", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const data = await storage.getMovementStatusDistribution();
      res.json(data);
    } catch (error) {
      console.error('Error fetching status distribution:', error);
      res.status(500).json({ message: "Failed to fetch status distribution" });
    }
  }));

  // Advanced Analytics with Filters
  app.get("/api/analytics/filtered-movements", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const user = req.user;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 25, 100);
      
      // Extract filters from query parameters
      const filters = {
        createdDateFrom: req.query.createdDateFrom,
        createdDateTo: req.query.createdDateTo,
        flowDateFrom: req.query.flowDateFrom,
        flowDateTo: req.query.flowDateTo,
        companyId: req.query.companyId,
        officeId: req.query.officeId,
        resourceId: req.query.resourceId,
        coreId: req.query.coreId,
        ibanId: req.query.ibanId,
        statusId: req.query.statusId,
        reasonId: req.query.reasonId,
        supplierId: req.query.supplierId,
        type: req.query.type,
        amountFrom: req.query.amountFrom ? parseFloat(req.query.amountFrom as string) : undefined,
        amountTo: req.query.amountTo ? parseFloat(req.query.amountTo as string) : undefined,
        vatType: req.query.vatType,
        hasVat: req.query.hasVat === 'true' ? true : req.query.hasVat === 'false' ? false : undefined,
        tagIds: req.query.tagIds ? (req.query.tagIds as string).split(',') : undefined
      };

      const result = await storage.getFilteredMovements(user, filters, page, pageSize);
      res.json(result);
    } catch (error) {
      console.error('Error fetching filtered movements:', error);
      res.status(500).json({ message: "Failed to fetch filtered movements" });
    }
  }));

  // Export filtered movements
  app.get("/api/analytics/export", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const user = req.user;
      const format = req.query.format || 'csv';
      
      // Same filters as above but for export (no pagination)
      const filters = {
        createdDateFrom: req.query.createdDateFrom,
        createdDateTo: req.query.createdDateTo,
        flowDateFrom: req.query.flowDateFrom,
        flowDateTo: req.query.flowDateTo,
        companyId: req.query.companyId,
        officeId: req.query.officeId,
        resourceId: req.query.resourceId,
        coreId: req.query.coreId,
        ibanId: req.query.ibanId,
        statusId: req.query.statusId,
        reasonId: req.query.reasonId,
        supplierId: req.query.supplierId,
        type: req.query.type,
        amountFrom: req.query.amountFrom ? parseFloat(req.query.amountFrom as string) : undefined,
        amountTo: req.query.amountTo ? parseFloat(req.query.amountTo as string) : undefined,
        vatType: req.query.vatType,
        hasVat: req.query.hasVat === 'true' ? true : req.query.hasVat === 'false' ? false : undefined,
        tagIds: req.query.tagIds ? (req.query.tagIds as string).split(',') : undefined
      };

      const exportData = await storage.exportFilteredMovements(user, filters, format);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="movimenti_analytics.csv"');
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="movimenti_analytics.json"');
      }
      
      res.send(exportData);
    } catch (error) {
      console.error('Error exporting movements:', error);
      res.status(500).json({ message: "Failed to export movements" });
    }
  }));

  // Download movement file endpoint for analytics
  app.get("/api/movements/:id/download", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const movementId = req.params.id;
      const movement = await storage.getMovement(movementId);
      
      if (!movement) {
        return res.status(404).json({ message: "Movement not found" });
      }

      if (!movement.documentPath) {
        return res.status(404).json({ message: "No file attached to this movement" });
      }

      const user = req.user;
      // Check if user has access to this movement
      if (user.role === 'user' && user.resourceId && movement.resourceId !== user.resourceId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!fs.existsSync(movement.documentPath)) {
        return res.status(404).json({ message: "File not found on server" });
      }

      const fileName = path.basename(movement.documentPath);
      res.download(movement.documentPath, fileName);
    } catch (error) {
      console.error('Error downloading movement file:', error);
      res.status(500).json({ message: "Failed to download file" });
    }
  }));

  // Notifications  
  app.get("/api/notifications", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const { isRead } = req.query;
      const readStatus = isRead !== undefined ? isRead === 'true' : undefined;
      const notifications = await storage.getNotifications(req.user.id, readStatus);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  }));

  app.get("/api/notifications/unread-count", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      const count = await storage.getUnreadNotificationsCount(req.user.id);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  }));

  app.put("/api/notifications/:id/read", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  }));

  app.put("/api/notifications/mark-all-read", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  }));

  app.delete("/api/notifications/:id", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  }));

  // Object Storage Routes
  app.get("/objects/:objectPath(*)", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
    const objectStorageService = new ObjectStorageService();
    
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  }));

  app.post("/api/objects/upload", requireAuth, handleAsyncErrors(async (req: any, res: any) => {
    const { ObjectStorageService } = await import("./objectStorage");
    const objectStorageService = new ObjectStorageService();
    
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  }));

  app.put("/api/resources/:id/avatar", requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    if (!req.body.avatarUrl) {
      return res.status(400).json({ error: "avatarUrl is required" });
    }

    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(req.body.avatarUrl);

      // Update resource with avatar path
      const resource = await storage.updateResource(req.params.id, { 
        avatar: objectPath 
      });

      res.json({ 
        resource,
        avatarPath: objectPath 
      });
    } catch (error) {
      console.error("Error setting avatar:", error);
      res.status(500).json({ error: "Failed to set avatar" });
    }
  }));

  // Suppliers API routes
  app.get('/api/suppliers', requireRole("admin", "finance", "user"), handleAsyncErrors(async (req: any, res: any) => {
    const suppliers = await storage.getSuppliers();
    res.json(suppliers);
  }));

  app.post('/api/suppliers', requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    const parsedData = insertSupplierSchema.parse(req.body);
    const supplier = await storage.createSupplier(parsedData);
    res.status(201).json(supplier);
  }));

  app.put('/api/suppliers/:id', requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    const parsedData = insertSupplierSchema.parse(req.body);
    const supplier = await storage.updateSupplier(req.params.id, parsedData);
    res.json(supplier);
  }));

  app.delete('/api/suppliers/:id', requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    await storage.deleteSupplier(req.params.id);
    res.status(204).send();
  }));

  // API per ottenere fornitore tramite partita IVA (per matching XML)
  app.get('/api/suppliers/by-vat/:vatNumber', requireRole("admin", "finance", "user"), handleAsyncErrors(async (req: any, res: any) => {
    const supplier = await storage.getSupplierByVatNumber(req.params.vatNumber);
    if (!supplier) {
      return res.status(404).json({ error: "Fornitore non trovato" });
    }
    res.json(supplier);
  }));

  // Customers API routes
  app.get('/api/customers', requireRole("admin", "finance", "user"), handleAsyncErrors(async (req: any, res: any) => {
    const customers = await storage.getCustomers();
    res.json(customers);
  }));

  app.post('/api/customers', requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    const parsedData = insertCustomerSchema.parse(req.body);
    const customer = await storage.createCustomer(parsedData);
    res.status(201).json(customer);
  }));

  app.put('/api/customers/:id', requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    const parsedData = insertCustomerSchema.parse(req.body);
    const customer = await storage.updateCustomer(req.params.id, parsedData);
    res.json(customer);
  }));

  app.delete('/api/customers/:id', requireRole("admin"), handleAsyncErrors(async (req: any, res: any) => {
    await storage.deleteCustomer(req.params.id);
    res.status(204).send();
  }));

  app.get('/api/customers/by-vat/:vatNumber', requireRole("admin", "finance", "user"), handleAsyncErrors(async (req: any, res: any) => {
    const customer = await storage.getCustomerByVatNumber(req.params.vatNumber);
    if (!customer) {
      return res.status(404).json({ error: "Cliente non trovato" });
    }
    res.json(customer);
  }));

  app.get('/api/customers/by-tax-code/:taxCode', requireRole("admin", "finance", "user"), handleAsyncErrors(async (req: any, res: any) => {
    const customer = await storage.getCustomerByTaxCode(req.params.taxCode);
    if (!customer) {
      return res.status(404).json({ error: "Cliente non trovato" });
    }
    res.json(customer);
  }));

  // API per l'upload e parsing dei file XML delle fatture elettroniche
  app.post('/api/invoices/parse-xml', requireRole("admin", "finance"), upload.single('xmlFile'), handleAsyncErrors(async (req: any, res: any) => {
    if (!req.file) {
      return res.status(400).json({ error: "Nessun file XML caricato" });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;

    try {
      // Verifica che sia un file XML
      if (!originalName.toLowerCase().endsWith('.xml')) {
        fs.unlinkSync(filePath); // Elimina il file caricato
        return res.status(400).json({ error: "Il file deve essere in formato XML" });
      }

      // Leggi il contenuto del file
      const xmlContent = fs.readFileSync(filePath, 'utf-8');
      
      // Parsing del file XML
      const parsedData = await xmlInvoiceParser.parseInvoiceXML(xmlContent);
      
      // Genera suggerimenti per i movimenti
      const movementSuggestions = await xmlInvoiceParser.generateMovementSuggestions(parsedData);
      
      // Verifica se il fornitore esiste o va creato
      let supplierInfo = null;
      if (parsedData.supplier.vatNumber) {
        const existingSupplier = await storage.getSupplierByVatNumber(parsedData.supplier.vatNumber);
        if (!existingSupplier) {
          // Suggerisci la creazione del fornitore
          supplierInfo = {
            exists: false,
            suggested: {
              name: parsedData.supplier.name,
              vatNumber: parsedData.supplier.vatNumber,
              taxCode: parsedData.supplier.taxCode,
              address: parsedData.supplier.address,
              zipCode: parsedData.supplier.zipCode,
              city: parsedData.supplier.city,
              country: parsedData.supplier.country
            }
          };
        } else {
          supplierInfo = {
            exists: true,
            supplier: existingSupplier
          };
        }
      }

      // Pulizia del file temporaneo
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        fileName: originalName,
        parsedData,
        movementSuggestions,
        supplierInfo,
        message: `Fattura ${parsedData.invoice.documentNumber} analizzata con successo`
      });

    } catch (error) {
      // Pulizia del file in caso di errore
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      console.error('Errore nel parsing XML:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Errore nel parsing del file XML",
        details: "Verifica che il file sia una fattura elettronica valida in formato FatturaPA"
      });
    }
  }));

  // API per creare automaticamente un fornitore dai dati XML
  app.post('/api/suppliers/create-from-xml', requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    const supplierData = req.body;
    
    try {
      // Validazione dei dati essenziali
      if (!supplierData.name || !supplierData.vatNumber) {
        return res.status(400).json({ error: "Nome e Partita IVA sono obbligatori" });
      }

      // Verifica che non esista già
      const existingSupplier = await storage.getSupplierByVatNumber(supplierData.vatNumber);
      if (existingSupplier) {
        return res.status(409).json({ error: "Fornitore già esistente con questa Partita IVA" });
      }

      // Crea il nuovo fornitore
      const newSupplier = await storage.createSupplier({
        name: supplierData.name,
        vatNumber: supplierData.vatNumber,
        taxCode: supplierData.taxCode || '',
        address: supplierData.address || '',
        zipCode: supplierData.zipCode || '',
        city: supplierData.city || '',
        country: supplierData.country || 'Italia',
        email: '',
        phone: '',
        website: '',
        contactPerson: '',
        legalForm: '',
        pec: '',
        sdi: '',
        paymentTerms: "30",
        notes: 'Creato automaticamente dal parsing XML fattura elettronica',
        isActive: true
      });

      res.status(201).json({
        success: true,
        supplier: newSupplier,
        message: `Fornitore ${newSupplier.name} creato con successo`
      });

    } catch (error) {
      console.error('Errore nella creazione del fornitore:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Errore nella creazione del fornitore"
      });
    }
  }));

  // API per creare movimenti dai suggerimenti XML
  app.post('/api/movements/create-from-xml', requireRole("admin", "finance"), handleAsyncErrors(async (req: any, res: any) => {
    const { suggestions, selectedSuggestions } = req.body;
    
    if (!Array.isArray(selectedSuggestions) || selectedSuggestions.length === 0) {
      return res.status(400).json({ error: "Nessun suggerimento selezionato" });
    }

    const createdMovements = [];
    const errors = [];

    try {
      for (const index of selectedSuggestions) {
        if (index >= 0 && index < suggestions.length) {
          const suggestion: MovementSuggestion = suggestions[index];
          
          try {
            // Valida i dati del movimento
            const movementData = insertMovementSchema.parse({
              companyId: suggestion.companyId,
              coreId: null,
              resourceId: null,
              officeId: null,
              statusId: null,
              reasonId: null,
              tagId: null,
              ibanId: null,
              supplierId: suggestion.supplierId || null,
              type: suggestion.type,
              amount: suggestion.amount,
              flowDate: suggestion.flowDate,
              documentNumber: suggestion.documentNumber,
              documentDate: suggestion.documentDate,
              description: suggestion.description,
              notes: suggestion.notes,
              filePath: null
            });

            const movement = await storage.createMovement(movementData);
            createdMovements.push(movement);

            // Crea notifica per il nuovo movimento
            await createMovementNotifications(movement.id, 'new_movement', req.user?.id);

          } catch (movementError) {
            errors.push({
              suggestion: index,
              error: movementError instanceof Error ? movementError.message : 'Errore sconosciuto'
            });
          }
        }
      }

      res.json({
        success: true,
        createdMovements,
        errors: errors.length > 0 ? errors : null,
        message: `${createdMovements.length} movimenti creati con successo${errors.length > 0 ? ` (${errors.length} errori)` : ''}`
      });

    } catch (error) {
      console.error('Errore nella creazione dei movimenti:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Errore nella creazione dei movimenti"
      });
    }
  }));

  // Password reset requests
  app.post("/api/password-reset/request", async (req, res) => {
    try {
      const { email } = passwordResetSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ success: true, message: "Se l'email esiste, riceverai le istruzioni per il reset" });
      }
      
      const token = await storage.createPasswordResetToken(user.id);
      const emailSent = await emailService.sendPasswordResetEmail(user.email, token, user.username);
      
      if (emailSent) {
        res.json({ success: true, message: "Email di reset inviata con successo" });
      } else {
        res.status(500).json({ error: "Errore nell'invio dell'email" });
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  app.post("/api/password-reset/confirm", async (req, res) => {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      
      const success = await storage.resetUserPassword(token, password);
      
      if (success) {
        res.json({ success: true, message: "Password reimpostata con successo" });
      } else {
        res.status(400).json({ error: "Token non valido o scaduto" });
      }
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  app.get("/api/password-reset/validate/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const user = await storage.validatePasswordResetToken(token);
      
      if (user) {
        res.json({ valid: true });
      } else {
        res.json({ valid: false });
      }
    } catch (error) {
      console.error('Token validation error:', error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  });

  // Email settings management
  app.get("/api/email-settings", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const settings = await storage.getEmailSettings();
      if (settings) {
        // Don't expose sensitive data like API keys
        const { sendgridApiKey, smtpPassword, ...safeSettings } = settings;
        res.json({ 
          ...safeSettings,
          sendgridApiKey: sendgridApiKey ? '***CONFIGURED***' : null,
          smtpPassword: smtpPassword ? '***CONFIGURED***' : null
        });
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error('Error getting email settings:', error);
      res.status(500).json({ error: "Errore nel recupero delle impostazioni email" });
    }
  });

  app.post("/api/email-settings", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const settings = insertEmailSettingsSchema.parse(req.body);
      const savedSettings = await storage.saveEmailSettings(settings);
      
      // Reload email service settings
      await emailService.loadSettings();
      
      res.json({ success: true, message: "Impostazioni email salvate con successo" });
    } catch (error) {
      console.error('Error saving email settings:', error);
      res.status(500).json({ error: "Errore nel salvataggio delle impostazioni email" });
    }
  });

  app.post("/api/email-settings/test", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const result = await emailService.testConnection();
      res.json(result);
    } catch (error) {
      console.error('Error testing email connection:', error);
      res.status(500).json({ success: false, message: "Errore nel test della connessione email" });
    }
  });

  // ===================
  // AI ENDPOINTS
  // ===================

  // AI Settings
  app.get("/api/ai/settings", requireAuth, handleAsyncErrors(async (req, res) => {
    try {
      const settings = await storage.getAiSettings(req.user.id);
      if (settings) {
        // Don't expose OpenAI API key
        const { openaiApiKey, ...safeSettings } = settings;
        res.json({ 
          ...safeSettings,
          openaiApiKey: openaiApiKey ? '***CONFIGURED***' : null
        });
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error('Error getting AI settings:', error);
      res.status(500).json({ error: "Errore nel recupero delle impostazioni AI" });
    }
  }));

  app.post("/api/ai/settings", requireAuth, handleAsyncErrors(async (req, res) => {
    try {
      const { openaiApiKey, ...otherSettings } = req.body;
      
      // Check if settings exist
      const existingSettings = await storage.getAiSettings(req.user.id);
      
      let savedSettings;
      if (existingSettings) {
        // Update existing settings
        const updateData = { ...otherSettings };
        // Only update API key if provided
        if (openaiApiKey && openaiApiKey !== '***CONFIGURED***') {
          updateData.openaiApiKey = openaiApiKey;
        }
        savedSettings = await storage.updateAiSettings(req.user.id, updateData);
      } else {
        // Create new settings
        const createData = { 
          userId: req.user.id, 
          ...otherSettings 
        };
        if (openaiApiKey && openaiApiKey !== '***CONFIGURED***') {
          createData.openaiApiKey = openaiApiKey;
        }
        savedSettings = await storage.createAiSettings(createData);
      }
      
      res.json({ success: true, message: "Impostazioni AI salvate con successo" });
    } catch (error) {
      console.error('Error saving AI settings:', error);
      res.status(500).json({ error: "Errore nel salvataggio delle impostazioni AI" });
    }
  }));

  app.post("/api/ai/test-connection", requireAuth, handleAsyncErrors(async (req, res) => {
    try {
      const result = await aiService.testConnection();
      res.json(result);
    } catch (error) {
      console.error('Error testing AI connection:', error);
      res.status(500).json({ success: false, error: "Errore nel test della connessione AI" });
    }
  }));

  // AI Chat
  app.post("/api/ai/chat", requireAuth, handleAsyncErrors(async (req, res) => {
    try {
      const { message, sessionId, context } = req.body;
      
      if (!message || !sessionId) {
        return res.status(400).json({ error: "Messaggio e sessionId sono richiesti" });
      }

      const result = await aiService.chatCompletion(
        req.user.id,
        message,
        sessionId,
        context
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error in AI chat:', error);
      res.status(500).json({ error: error.message || "Errore nella chat AI" });
    }
  }));

  app.get("/api/ai/chat/history/:sessionId?", requireAuth, handleAsyncErrors(async (req, res) => {
    try {
      const { sessionId } = req.params;
      const history = await storage.getAiChatHistory(req.user.id, sessionId);
      res.json(history);
    } catch (error) {
      console.error('Error getting chat history:', error);
      res.status(500).json({ error: "Errore nel recupero dello storico chat" });
    }
  }));

  app.delete("/api/ai/chat/:sessionId", requireAuth, handleAsyncErrors(async (req, res) => {
    try {
      const { sessionId } = req.params;
      await storage.deleteAiChatSession(req.user.id, sessionId);
      res.json({ success: true, message: "Sessione chat eliminata" });
    } catch (error) {
      console.error('Error deleting chat session:', error);
      res.status(500).json({ error: "Errore nell'eliminazione della sessione chat" });
    }
  }));

  // AI Document Analysis
  app.post("/api/ai/analyze-document", requireAuth, upload.single('document'), handleAsyncErrors(async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nessun documento fornito" });
      }

      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      const result = await aiService.analyzeDocument(
        req.user.id,
        fileContent,
        req.file.mimetype || 'unknown'
      );

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json(result);
    } catch (error) {
      console.error('Error analyzing document:', error);
      
      // Clean up uploaded file if it exists
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ error: error.message || "Errore nell'analisi del documento" });
    }
  }));

  // AI Financial Insights
  app.post("/api/ai/insights", requireAuth, handleAsyncErrors(async (req, res) => {
    try {
      const { financialData } = req.body;
      
      if (!financialData) {
        return res.status(400).json({ error: "Dati finanziari richiesti" });
      }

      const result = await aiService.generateFinancialInsights(
        req.user.id,
        financialData
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error generating insights:', error);
      res.status(500).json({ error: error.message || "Errore nella generazione degli insights" });
    }
  }));

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to get content type based on file extension
function getContentType(extension: string): string {
  const contentTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.txt': 'text/plain',
    '.xml': 'application/xml',
  };
  
  return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
}
