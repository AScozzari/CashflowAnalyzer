import { EventEmitter } from 'events';

// Tipi per il sistema di code
interface QueuedWebhook {
  id: string;
  type: 'whatsapp' | 'sms' | 'email' | 'messenger';
  provider: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  data: any;
  timestamp: Date;
  attempts: number;
  maxAttempts: number;
  nextRetry?: Date;
  error?: string;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  avgProcessingTime: number;
}

// Sistema di Code Webhook Avanzato
export class WebhookQueueManager extends EventEmitter {
  private queues: Map<string, QueuedWebhook[]> = new Map();
  private processing: Map<string, QueuedWebhook> = new Map();
  private workers: Map<string, boolean> = new Map();
  private stats: QueueStats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    avgProcessingTime: 0
  };

  // Configurazione code per priorità
  private readonly queueConfig = {
    urgent: { concurrency: 5, retryDelay: 1000 },
    high: { concurrency: 3, retryDelay: 2000 },
    normal: { concurrency: 2, retryDelay: 5000 },
    low: { concurrency: 1, retryDelay: 10000 }
  };

  constructor() {
    super();
    this.initializeQueues();
    this.startWorkers();
  }

  private initializeQueues(): void {
    // Inizializza code separate per priorità
    ['urgent', 'high', 'normal', 'low'].forEach(priority => {
      this.queues.set(priority, []);
      this.workers.set(priority, false);
    });
    
    console.log('[QUEUE MANAGER] ✅ Code webhook inizializzate con priorità');
  }

  // Aggiunge webhook alla coda appropriata
  async enqueue(webhook: Omit<QueuedWebhook, 'id' | 'attempts' | 'timestamp'>): Promise<string> {
    const queuedWebhook: QueuedWebhook = {
      ...webhook,
      id: this.generateId(),
      attempts: 0,
      timestamp: new Date()
    };

    // Determina priorità automatica se non specificata
    if (!webhook.priority) {
      queuedWebhook.priority = this.determinePriority(webhook);
    }

    const queue = this.queues.get(queuedWebhook.priority);
    if (!queue) {
      throw new Error(`Coda ${queuedWebhook.priority} non trovata`);
    }

    queue.push(queuedWebhook);
    this.stats.pending++;

    console.log(`[QUEUE] 📥 Webhook ${queuedWebhook.type} accodato con priorità ${queuedWebhook.priority}`);
    
    // Avvia worker per questa priorità se non attivo
    this.startWorkerForPriority(queuedWebhook.priority);
    
    this.emit('webhook_queued', queuedWebhook);
    return queuedWebhook.id;
  }

  // Determina priorità automatica
  private determinePriority(webhook: Omit<QueuedWebhook, 'id' | 'attempts' | 'timestamp'>): 'low' | 'normal' | 'high' | 'urgent' {
    // Logica intelligente per priorità
    
    // URGENTE: Errori di pagamento, problemi critici
    if (webhook.data?.body?.toLowerCase().includes('errore') ||
        webhook.data?.body?.toLowerCase().includes('problema') ||
        webhook.data?.body?.toLowerCase().includes('pagamento')) {
      return 'urgent';
    }

    // ALTA: Nuovi clienti, richieste commerciali
    if (webhook.data?.body?.toLowerCase().includes('nuovo') ||
        webhook.data?.body?.toLowerCase().includes('preventivo') ||
        webhook.data?.body?.toLowerCase().includes('acquisto')) {
      return 'high';
    }

    // BASSA: Status update, conferme
    if (webhook.data?.type === 'status_update' ||
        webhook.data?.body?.toLowerCase().includes('ok') ||
        webhook.data?.body?.toLowerCase().includes('grazie')) {
      return 'low';
    }

    return 'normal';
  }

  // Avvia worker per priorità specifica
  private startWorkerForPriority(priority: string): void {
    if (this.workers.get(priority)) return; // Worker già attivo

    this.workers.set(priority, true);
    const config = this.queueConfig[priority as keyof typeof this.queueConfig];
    
    if (!config) return;

    console.log(`[QUEUE] 🚀 Avvio worker per priorità ${priority} (concurrency: ${config.concurrency})`);

    // Avvia multipli worker per concurrency
    for (let i = 0; i < config.concurrency; i++) {
      this.processQueue(priority, config.retryDelay);
    }
  }

  // Processa coda specifica
  private async processQueue(priority: string, retryDelay: number): Promise<void> {
    while (this.workers.get(priority)) {
      const queue = this.queues.get(priority);
      if (!queue || queue.length === 0) {
        await this.sleep(1000); // Attendi 1 secondo se coda vuota
        continue;
      }

      const webhook = queue.shift();
      if (!webhook) continue;

      const startTime = Date.now();
      this.stats.pending--;
      this.stats.processing++;
      this.processing.set(webhook.id, webhook);

      try {
        console.log(`[QUEUE] 🔄 Processando webhook ${webhook.type} ID:${webhook.id.slice(0, 8)}...`);
        
        // Processa il webhook
        await this.processWebhook(webhook);
        
        // Successo
        this.stats.processing--;
        this.stats.completed++;
        this.processing.delete(webhook.id);
        
        const processingTime = Date.now() - startTime;
        this.updateAvgProcessingTime(processingTime);
        
        console.log(`[QUEUE] ✅ Webhook ${webhook.id.slice(0, 8)} processato in ${processingTime}ms`);
        this.emit('webhook_completed', webhook);

      } catch (error: any) {
        await this.handleWebhookError(webhook, error, retryDelay);
      }
    }
  }

  // Processa singolo webhook
  private async processWebhook(webhook: QueuedWebhook): Promise<void> {
    webhook.attempts++;

    switch (webhook.type) {
      case 'whatsapp':
        await this.processWhatsAppWebhook(webhook);
        break;
      case 'sms':
        await this.processSMSWebhook(webhook);
        break;
      case 'email':
        await this.processEmailWebhook(webhook);
        break;
      case 'messenger':
        await this.processMessengerWebhook(webhook);
        break;
      default:
        throw new Error(`Tipo webhook non supportato: ${webhook.type}`);
    }
  }

  // Processori specifici per tipo webhook
  private async processWhatsAppWebhook(webhook: QueuedWebhook): Promise<void> {
    const { WhatsAppWebhookHandler } = await import('../webhook-manager');
    // Processa WhatsApp usando l'handler esistente
    if (webhook.data?.type === 'incoming_message') {
      // Processa messaggio in arrivo
      console.log(`[QUEUE] Processando messaggio WhatsApp da ${webhook.data.from}: ${webhook.data.body?.slice(0, 50)}...`);
    } else if (webhook.data?.type === 'status_update') {
      // Processa aggiornamento stato
      console.log(`[QUEUE] Processando status update WhatsApp: ${webhook.data.status}`);
    }
  }

  private async processSMSWebhook(webhook: QueuedWebhook): Promise<void> {
    const { SMSWebhookHandler } = await import('../webhook-manager');
    // Simula processamento SMS
    console.log(`[QUEUE] Processando SMS da ${webhook.data.from}`);
  }

  private async processEmailWebhook(webhook: QueuedWebhook): Promise<void> {
    const { EmailWebhookHandler } = await import('../webhook-manager');
    // Simula processamento Email
    console.log(`[QUEUE] Processando Email da ${webhook.data.from}`);
  }

  private async processMessengerWebhook(webhook: QueuedWebhook): Promise<void> {
    const { MessengerWebhookHandler } = await import('../webhook-manager');
    // Simula processamento Messenger
    console.log(`[QUEUE] Processando Messenger da ${webhook.data.senderId}`);
  }

  // Gestisce errori e retry
  private async handleWebhookError(webhook: QueuedWebhook, error: any, retryDelay: number): Promise<void> {
    console.error(`[QUEUE] ❌ Errore processando webhook ${webhook.id.slice(0, 8)}:`, error);
    
    webhook.error = error.message;
    this.stats.processing--;
    this.processing.delete(webhook.id);

    // Retry se non superato limite
    if (webhook.attempts < webhook.maxAttempts) {
      webhook.nextRetry = new Date(Date.now() + retryDelay);
      
      console.log(`[QUEUE] 🔄 Scheduling retry ${webhook.attempts}/${webhook.maxAttempts} per webhook ${webhook.id.slice(0, 8)} in ${retryDelay}ms`);
      
      // Ri-accoda dopo delay
      setTimeout(() => {
        const queue = this.queues.get(webhook.priority);
        if (queue) {
          queue.unshift(webhook); // Priorità alta per retry
          this.stats.pending++;
        }
      }, retryDelay);

      this.emit('webhook_retry', webhook);
    } else {
      // Fallimento definitivo
      this.stats.failed++;
      console.error(`[QUEUE] 💀 Webhook ${webhook.id.slice(0, 8)} FAILED definitivamente dopo ${webhook.attempts} tentativi`);
      this.emit('webhook_failed', webhook);
    }
  }

  // Utilities
  private generateId(): string {
    return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateAvgProcessingTime(time: number): void {
    const totalCompleted = this.stats.completed;
    this.stats.avgProcessingTime = ((this.stats.avgProcessingTime * (totalCompleted - 1)) + time) / totalCompleted;
  }

  // Avvia tutti i worker
  private startWorkers(): void {
    ['urgent', 'high', 'normal', 'low'].forEach(priority => {
      this.startWorkerForPriority(priority);
    });
    
    console.log('[QUEUE MANAGER] 🚀 Tutti i worker avviati');
  }

  // Ferma tutti i worker (per shutdown)
  async shutdown(): Promise<void> {
    console.log('[QUEUE MANAGER] 🛑 Fermando tutti i worker...');
    
    ['urgent', 'high', 'normal', 'low'].forEach(priority => {
      this.workers.set(priority, false);
    });

    // Attendi completamento processamento in corso
    while (this.stats.processing > 0) {
      console.log(`[QUEUE MANAGER] ⏳ Attendendo completamento ${this.stats.processing} webhook in processamento...`);
      await this.sleep(1000);
    }

    console.log('[QUEUE MANAGER] ✅ Shutdown completato');
  }

  // Statistiche pubbliche
  getStats(): QueueStats {
    return { ...this.stats };
  }

  // Info dettagliate code
  getQueueInfo(): Record<string, number> {
    const info: Record<string, number> = {};
    
    this.queues.forEach((queue, priority) => {
      info[priority] = queue.length;
    });
    
    return info;
  }

  // Pulisce code (per manutenzione)
  clearQueues(): void {
    this.queues.forEach(queue => queue.length = 0);
    this.stats.pending = 0;
    console.log('[QUEUE MANAGER] 🧹 Code pulite');
  }
}

// Singleton instance
export const webhookQueueManager = new WebhookQueueManager();