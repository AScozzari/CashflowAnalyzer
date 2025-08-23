import type { Express } from "express";
import { storage } from "../storage";
import { insertFiscalAiConversationSchema, insertFiscalAiMessageSchema } from "@shared/schema";
// Import will be handled by registerRoutes function parameter

export function registerFiscalAiRoutes(app: Express, requireAuth: any) {
  // Get all conversations for user
  app.get('/api/fiscal-ai/conversations', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const conversations = await storage.getFiscalAiConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching fiscal AI conversations:', error);
      res.status(500).json({ error: 'Errore nel caricamento delle conversazioni' });
    }
  });

  // Get specific conversation
  app.get('/api/fiscal-ai/conversations/:id', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const conversation = await storage.getFiscalAiConversation(req.params.id, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversazione non trovata" });
      }

      res.json(conversation);
    } catch (error) {
      console.error('Error fetching fiscal AI conversation:', error);
      res.status(500).json({ error: 'Errore nel caricamento della conversazione' });
    }
  });

  // Create new conversation
  app.post('/api/fiscal-ai/conversations', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const validatedData = insertFiscalAiConversationSchema.parse({
        ...req.body,
        userId
      });

      const conversation = await storage.createFiscalAiConversation(validatedData);
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Error creating fiscal AI conversation:', error);
      res.status(500).json({ error: 'Errore nella creazione della conversazione' });
    }
  });

  // Update conversation
  app.put('/api/fiscal-ai/conversations/:id', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const updatedConversation = await storage.updateFiscalAiConversation(
        req.params.id,
        userId,
        req.body
      );

      if (!updatedConversation) {
        return res.status(404).json({ error: "Conversazione non trovata" });
      }

      res.json(updatedConversation);
    } catch (error) {
      console.error('Error updating fiscal AI conversation:', error);
      res.status(500).json({ error: 'Errore nella modifica della conversazione' });
    }
  });

  // Delete conversation
  app.delete('/api/fiscal-ai/conversations/:id', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      await storage.deleteFiscalAiConversation(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting fiscal AI conversation:', error);
      res.status(500).json({ error: 'Errore nella cancellazione della conversazione' });
    }
  });

  // Get messages for conversation
  app.get('/api/fiscal-ai/conversations/:id/messages', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      const messages = await storage.getFiscalAiMessages(req.params.id, userId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching fiscal AI messages:', error);
      res.status(500).json({ error: 'Errore nel caricamento dei messaggi' });
    }
  });

  // Create new message
  app.post('/api/fiscal-ai/conversations/:id/messages', requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Non autenticato" });
      }

      // Verifica che la conversazione appartenga all'utente
      const conversation = await storage.getFiscalAiConversation(req.params.id, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversazione non trovata" });
      }

      const validatedData = insertFiscalAiMessageSchema.parse({
        ...req.body,
        conversationId: req.params.id
      });

      const message = await storage.createFiscalAiMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating fiscal AI message:', error);
      res.status(500).json({ error: 'Errore nella creazione del messaggio' });
    }
  });
}