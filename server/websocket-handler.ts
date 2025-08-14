/**
 * WebSocket Handler for EasyCashFlows
 * Implements real-time features: notifications, live updates, hot reload
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import url from 'url';
import { IncomingMessage } from 'http';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  sessionId?: string;
  isAlive?: boolean;
}

export class EasyCashFlowsWebSocketHandler {
  private wss: WebSocketServer;
  private clients: Set<AuthenticatedWebSocket> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: Server) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.setupWebSocketServer();
    this.startHeartbeat();
    
    console.log('🔌 WebSocket server initialized on /ws');
  }

  private verifyClient(info: { req: IncomingMessage }): boolean {
    // Parse URL and check for valid connection
    const pathname = url.parse(info.req.url || '').pathname;
    
    // Allow connections to /ws and /ws-test (for testing)
    return pathname === '/ws' || pathname === '/ws-test';
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, request) => {
      const pathname = url.parse(request.url || '').pathname;
      
      // Handle test connections immediately
      if (pathname === '/ws-test') {
        ws.close(1000, 'Test connection successful');
        return;
      }

      // Initialize connection
      ws.isAlive = true;
      this.clients.add(ws);
      
      console.log(`🔗 WebSocket client connected. Total clients: ${this.clients.size}`);

      // Setup event handlers
      ws.on('message', (data) => this.handleMessage(ws, data));
      ws.on('pong', () => { ws.isAlive = true; });
      ws.on('close', () => this.handleDisconnection(ws));
      ws.on('error', (error) => this.handleError(ws, error));

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connected',
        timestamp: new Date().toISOString(),
        clientCount: this.clients.size
      });
    });
  }

  private handleMessage(ws: AuthenticatedWebSocket, data: Buffer): void {
    try {
      const message = data.toString();
      
      // Handle heartbeat ping
      if (message === 'ping') {
        ws.send('pong');
        return;
      }

      // Parse JSON messages
      let parsedMessage;
      try {
        parsedMessage = JSON.parse(message);
      } catch {
        // Handle simple string messages
        console.log(`📨 WebSocket message: ${message}`);
        return;
      }

      // Handle different message types
      switch (parsedMessage.type) {
        case 'auth':
          this.handleAuthentication(ws, parsedMessage);
          break;
        case 'subscribe':
          this.handleSubscription(ws, parsedMessage);
          break;
        case 'unsubscribe':
          this.handleUnsubscription(ws, parsedMessage);
          break;
        default:
          console.log(`📨 Unknown WebSocket message type: ${parsedMessage.type}`);
      }
    } catch (error) {
      console.error('❌ Error handling WebSocket message:', error);
    }
  }

  private handleAuthentication(ws: AuthenticatedWebSocket, message: any): void {
    // In a real implementation, verify session/token here
    ws.userId = message.userId;
    ws.sessionId = message.sessionId;
    
    this.sendToClient(ws, {
      type: 'auth_success',
      userId: ws.userId
    });
  }

  private handleSubscription(ws: AuthenticatedWebSocket, message: any): void {
    // Handle subscription to specific channels (notifications, movements, etc.)
    this.sendToClient(ws, {
      type: 'subscribed',
      channel: message.channel
    });
  }

  private handleUnsubscription(ws: AuthenticatedWebSocket, message: any): void {
    // Handle unsubscription from channels
    this.sendToClient(ws, {
      type: 'unsubscribed',
      channel: message.channel
    });
  }

  private handleDisconnection(ws: AuthenticatedWebSocket): void {
    this.clients.delete(ws);
    console.log(`🔌 WebSocket client disconnected. Total clients: ${this.clients.size}`);
  }

  private handleError(ws: AuthenticatedWebSocket, error: Error): void {
    console.error('❌ WebSocket error:', error);
    this.clients.delete(ws);
  }

  private sendToClient(ws: AuthenticatedWebSocket, data: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((ws) => {
        if (!ws.isAlive) {
          ws.terminate();
          this.clients.delete(ws);
          return;
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  // Public methods for sending notifications
  public broadcastNotification(notification: any): void {
    const message = {
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString()
    };

    this.clients.forEach((ws) => {
      if (ws.userId) { // Only send to authenticated clients
        this.sendToClient(ws, message);
      }
    });
  }

  public sendToUser(userId: string, data: any): void {
    this.clients.forEach((ws) => {
      if (ws.userId === userId) {
        this.sendToClient(ws, data);
      }
    });
  }

  public getConnectedClientCount(): number {
    return this.clients.size;
  }

  public close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.clients.forEach((ws) => {
      ws.close(1000, 'Server shutdown');
    });
    
    this.wss.close();
    console.log('🔌 WebSocket server closed');
  }
}