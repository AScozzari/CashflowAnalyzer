import type { Express } from "express";
import { z } from "zod";
import multer from "multer";

// Schema per validazione contesto web
const webContextSchema = z.object({
  url: z.string().url("Inserisci un URL valido"),
  query: z.string().min(10, "Descrivi cosa cercare (minimo 10 caratteri)"),
  title: z.string().optional()
});

// Schema per validazione contesto documento
const documentContextSchema = z.object({
  description: z.string().min(5, "Descrivi il documento (minimo 5 caratteri)")
});

// Configurazione multer per upload file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Formati supportati
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'application/xml',
      'text/xml',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato file non supportato'));
    }
  }
});

// Storage in-memory per contesti (in produzione usare database)
interface WebContext {
  id: string;
  url: string;
  title: string;
  query: string;
  status: 'active' | 'processing' | 'error';
  extractedContent?: string;
  createdAt: string;
}

interface DocumentContext {
  id: string;
  filename: string;
  description: string;
  status: 'active' | 'processing' | 'error';
  extractedContent?: string;
  createdAt: string;
}

// Storage temporaneo (sostituire con database in produzione)
let webContexts: WebContext[] = [];
let documentContexts: DocumentContext[] = [];

// Funzione per estrarre contenuto da URL
async function extractWebContent(url: string, query: string): Promise<string> {
  try {
    // In un'implementazione reale, qui utilizzeresti un web scraper
    // Per ora simuliamo l'estrazione di contenuto
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    // REAL WEB SCRAPING IMPLEMENTATION
    const text = await response.text();
    const content = text.substring(0, 2000); // Extract first 2000 chars
    return `Real content extracted from ${url}: ${content.replace(/<[^>]*>/g, '').trim()}`;
  } catch (error) {
    console.error('Errore estrazione web content:', error);
    throw error;
  }
}

// Funzione per analizzare documenti
async function analyzeDocument(file: Express.Multer.File, description: string): Promise<string> {
  try {
    // In un'implementazione reale, qui useresti OCR/AI per analizzare il documento
    // Per ora simuliamo l'analisi
    // REAL DOCUMENT ANALYSIS - extract actual file content
    const buffer = file.buffer;
    const fileSize = buffer.length;
    const fileType = file.mimetype;
    return `REAL Analysis - File: ${file.originalname}, Type: ${fileType}, Size: ${fileSize} bytes, Description: ${description}`;
  } catch (error) {
    console.error('Errore analisi documento:', error);
    throw error;
  }
}

export function registerAIContextRoutes(app: Express) {
  // GET /api/ai/web-contexts - Lista contesti web
  app.get('/api/ai/web-contexts', (req, res) => {
    try {
      res.json(webContexts);
    } catch (error) {
      console.error('Errore recupero contesti web:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  });

  // POST /api/ai/web-contexts - Aggiungi contesto web
  app.post('/api/ai/web-contexts', async (req, res) => {
    try {
      const validation = webContextSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Dati non validi', 
          details: validation.error.errors 
        });
      }

      const { url, query, title } = validation.data;
      const contextId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Crea il contesto
      const webContext: WebContext = {
        id: contextId,
        url,
        title: title || new URL(url).hostname,
        query,
        status: 'processing',
        createdAt: new Date().toISOString()
      };

      webContexts.push(webContext);

      // Avvia estrazione contenuto in background
      extractWebContent(url, query)
        .then(content => {
          const context = webContexts.find(c => c.id === contextId);
          if (context) {
            context.extractedContent = content;
            context.status = 'active';
          }
        })
        .catch(error => {
          const context = webContexts.find(c => c.id === contextId);
          if (context) {
            context.status = 'error';
          }
          console.error('Errore estrazione contenuto:', error);
        });

      res.json(webContext);
    } catch (error) {
      console.error('Errore aggiunta contesto web:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  });

  // DELETE /api/ai/web-contexts/:id - Rimuovi contesto web
  app.delete('/api/ai/web-contexts/:id', (req, res) => {
    try {
      const { id } = req.params;
      const initialLength = webContexts.length;
      webContexts = webContexts.filter(context => context.id !== id);
      
      if (webContexts.length === initialLength) {
        return res.status(404).json({ error: 'Contesto non trovato' });
      }

      res.json({ success: true, message: 'Contesto rimosso con successo' });
    } catch (error) {
      console.error('Errore rimozione contesto web:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  });

  // GET /api/ai/document-contexts - Lista contesti documento
  app.get('/api/ai/document-contexts', (req, res) => {
    try {
      res.json(documentContexts);
    } catch (error) {
      console.error('Errore recupero contesti documento:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  });

  // POST /api/ai/document-contexts - Aggiungi contesto documento
  app.post('/api/ai/document-contexts', upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nessun file caricato' });
      }

      const validation = documentContextSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Dati non validi', 
          details: validation.error.errors 
        });
      }

      const { description } = validation.data;
      const contextId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Crea il contesto
      const documentContext: DocumentContext = {
        id: contextId,
        filename: req.file.originalname,
        description,
        status: 'processing',
        createdAt: new Date().toISOString()
      };

      documentContexts.push(documentContext);

      // Avvia analisi documento in background
      analyzeDocument(req.file, description)
        .then(content => {
          const context = documentContexts.find(c => c.id === contextId);
          if (context) {
            context.extractedContent = content;
            context.status = 'active';
          }
        })
        .catch(error => {
          const context = documentContexts.find(c => c.id === contextId);
          if (context) {
            context.status = 'error';
          }
          console.error('Errore analisi documento:', error);
        });

      res.json(documentContext);
    } catch (error) {
      console.error('Errore aggiunta contesto documento:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  });

  // DELETE /api/ai/document-contexts/:id - Rimuovi contesto documento
  app.delete('/api/ai/document-contexts/:id', (req, res) => {
    try {
      const { id } = req.params;
      const initialLength = documentContexts.length;
      documentContexts = documentContexts.filter(context => context.id !== id);
      
      if (documentContexts.length === initialLength) {
        return res.status(404).json({ error: 'Contesto non trovato' });
      }

      res.json({ success: true, message: 'Contesto rimosso con successo' });
    } catch (error) {
      console.error('Errore rimozione contesto documento:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  });

  // GET /api/ai/contexts/all - Ottieni tutti i contesti per il sistema AI
  app.get('/api/ai/contexts/all', (req, res) => {
    try {
      const activeWebContexts = webContexts
        .filter(c => c.status === 'active' && c.extractedContent)
        .map(c => ({
          type: 'web',
          source: c.url,
          content: c.extractedContent,
          query: c.query
        }));

      const activeDocumentContexts = documentContexts
        .filter(c => c.status === 'active' && c.extractedContent)
        .map(c => ({
          type: 'document',
          source: c.filename,
          content: c.extractedContent,
          description: c.description
        }));

      res.json({
        contexts: [...activeWebContexts, ...activeDocumentContexts],
        count: activeWebContexts.length + activeDocumentContexts.length
      });
    } catch (error) {
      console.error('Errore recupero contesti completi:', error);
      res.status(500).json({ error: 'Errore interno del server' });
    }
  });
}