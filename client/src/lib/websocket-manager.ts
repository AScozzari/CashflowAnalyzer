/**
 * WebSocket Connection Manager - Replit 2025 Eval Proxy Workaround
 * Implements robust reconnection logic for Replit's new infrastructure
 */

export interface WebSocketConfig {
  url: string;
  maxRetries: number;
  retryDelay: number;
  heartbeatInterval: number;
  debug: boolean;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private retryCount = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private listeners: { [event: string]: Function[] } = {};

  constructor(config: Partial<WebSocketConfig> = {}) {
    // INTELLIGENT REPLIT CONFIG: Auto-detect if WebSocket should be enabled
    const isReplitDev = window.location.hostname.includes('replit.dev');
    const shouldEnableWS = !isReplitDev || this.testReplitWebSocketSupport();
    
    if (shouldEnableWS) {
      console.log('[WebSocket Manager] WebSocket enabled with Replit optimizations');
    } else {
      console.log('[WebSocket Manager] WebSocket disabled - fallback to HTTP polling');
    }
    
    this.config = {
      url: this.getWebSocketUrl(),
      maxRetries: shouldEnableWS ? 5 : 0,
      retryDelay: 2000, // Longer delay for Replit stability
      heartbeatInterval: 45000, // Increased for Replit Eval proxy
      debug: shouldEnableWS,
      ...config
    };
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let host = window.location.host;
    
    // REPLIT 2025 EVAL PROXY: Keep original domain for proper routing
    // The Eval proxy handles WebSocket connections correctly when using same domain
    if (host.includes('replit.dev')) {
      this.log('Using Replit domain for WebSocket:', host);
    }
    
    return `${protocol}//${host}/ws`;
  }

  private testReplitWebSocketSupport(): boolean {
    // Conservative approach: disable WebSocket on Replit for now
    // until we implement proper server-side WebSocket handler
    return false;
  }

  private log(message: string, data?: any): void {
    if (this.config?.debug) {
      console.log(`[WebSocket Manager] ${message}`, data || '');
    }
  }

  private emit(event: string, data?: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(data));
    }
  }

  public on(event: string, listener: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  public off(event: string, listener: Function): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
  }

  public connect(): void {
    if (this.config.maxRetries === 0) {
      this.log('WebSocket disabled - using HTTP fallback');
      return;
    }

    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      this.log('Connection already in progress');
      return;
    }

    this.isConnecting = true;
    this.log('Attempting WebSocket connection to:', this.config.url);

    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventHandlers();
    } catch (error) {
      this.log('Failed to create WebSocket:', error);
      this.handleConnectionFailure();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.log('WebSocket connected successfully');
      this.isConnecting = false;
      this.retryCount = 0;
      this.startHeartbeat();
      this.emit('connected');
    };

    this.ws.onclose = (event) => {
      this.log('WebSocket closed:', { code: event.code, reason: event.reason });
      this.cleanup();
      this.handleConnectionFailure();
      this.emit('disconnected', { code: event.code, reason: event.reason });
    };

    this.ws.onerror = (error) => {
      this.log('WebSocket error:', error);
      this.emit('error', error);
    };

    this.ws.onmessage = (event) => {
      this.log('Message received:', event.data);
      
      // Handle heartbeat pong responses
      if (event.data === 'pong') {
        this.log('Heartbeat pong received');
        return;
      }
      
      this.emit('message', event.data);
    };
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.log('Sending heartbeat ping');
        this.ws.send('ping');
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private cleanup(): void {
    this.isConnecting = false;
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private handleConnectionFailure(): void {
    this.cleanup();

    if (this.retryCount < this.config.maxRetries) {
      const delay = Math.min(
        this.config.retryDelay * Math.pow(2, this.retryCount), // Exponential backoff
        30000 // Max 30 seconds
      );

      this.log(`Reconnecting in ${delay}ms...`);
      
      this.reconnectTimer = setTimeout(() => {
        this.retryCount++;
        this.connect();
      }, delay);
    } else {
      this.log('Max retry attempts reached. Connection failed permanently.');
      this.emit('maxRetriesReached');
    }
  }

  public send(data: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    }
    
    this.log('Cannot send data: WebSocket not connected');
    return false;
  }

  public disconnect(): void {
    this.log('Manually disconnecting WebSocket');
    this.cleanup();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
  }

  public getReadyState(): number {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance for easy use
export const wsManager = new WebSocketManager();

// Auto-connect for hot reload functionality
if (process.env.NODE_ENV === 'development') {
  wsManager.connect();
  
  wsManager.on('connected', () => {
    console.log('🔄 Hot reload WebSocket connected');
  });
  
  wsManager.on('disconnected', () => {
    console.log('⚠️ Hot reload WebSocket disconnected');
  });
  
  wsManager.on('maxRetriesReached', () => {
    console.warn('❌ Hot reload WebSocket failed permanently. Manual refresh may be needed.');
  });
}