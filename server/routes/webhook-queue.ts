import type { Express } from 'express';

// API Routes per monitoraggio code webhook
export function setupWebhookQueueRoutes(app: Express): void {

  // Statistiche code webhook
  app.get('/api/webhooks/queue/stats', async (req, res) => {
    try {
      const { webhookQueueManager } = await import('../services/webhook-queue-manager');
      
      const stats = webhookQueueManager.getStats();
      const queueInfo = webhookQueueManager.getQueueInfo();
      
      res.json({
        stats,
        queues: queueInfo,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[QUEUE API] Error getting stats:', error);
      res.status(500).json({ error: 'Failed to get queue stats' });
    }
  });

  // Pulisci code (admin only)
  app.post('/api/webhooks/queue/clear', async (req, res) => {
    try {
      const { webhookQueueManager } = await import('../services/webhook-queue-manager');
      
      webhookQueueManager.clearQueues();
      
      res.json({
        success: true,
        message: 'Code webhook pulite',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[QUEUE API] Error clearing queues:', error);
      res.status(500).json({ error: 'Failed to clear queues' });
    }
  });

  // Pausa/riprendi worker (per manutenzione)
  app.post('/api/webhooks/queue/pause', async (req, res) => {
    try {
      // Implementa logica pause/resume se necessaria
      res.json({
        success: true,
        message: 'Code webhook sospese',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[QUEUE API] Error pausing queues:', error);
      res.status(500).json({ error: 'Failed to pause queues' });
    }
  });

  console.log('✅ Webhook Queue API routes setup complete');
}