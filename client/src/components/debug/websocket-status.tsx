import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, RefreshCw, Zap, AlertTriangle } from "lucide-react";
import { wsManager } from "@/lib/websocket-manager";

interface ConnectionStats {
  connected: boolean;
  readyState: number;
  retryCount: number;
  lastError?: string;
  connectionTime?: number;
}

const readyStateLabels = {
  0: 'CONNECTING',
  1: 'OPEN',
  2: 'CLOSING',
  3: 'CLOSED'
};

export function WebSocketStatus() {
  const [stats, setStats] = useState<ConnectionStats>({
    connected: false,
    readyState: 3,
    retryCount: 0
  });

  useEffect(() => {
    const updateStats = () => {
      setStats({
        connected: wsManager.isConnected(),
        readyState: wsManager.getReadyState(),
        retryCount: 0 // wsManager doesn't expose this currently
      });
    };

    // Initial state
    updateStats();

    // Listen to WebSocket events
    const handleConnected = () => {
      setStats(prev => ({
        ...prev,
        connected: true,
        readyState: 1,
        connectionTime: Date.now(),
        lastError: undefined
      }));
    };

    const handleDisconnected = (data: any) => {
      setStats(prev => ({
        ...prev,
        connected: false,
        readyState: 3,
        lastError: data?.reason || 'Connection lost'
      }));
    };

    const handleError = (error: any) => {
      setStats(prev => ({
        ...prev,
        lastError: error?.message || 'WebSocket error'
      }));
    };

    wsManager.on('connected', handleConnected);
    wsManager.on('disconnected', handleDisconnected);
    wsManager.on('error', handleError);

    const interval = setInterval(updateStats, 2000);

    return () => {
      clearInterval(interval);
      wsManager.off('connected', handleConnected);
      wsManager.off('disconnected', handleDisconnected);
      wsManager.off('error', handleError);
    };
  }, []);

  const handleReconnect = () => {
    wsManager.disconnect();
    setTimeout(() => wsManager.connect(), 500);
  };

  const getStatusIcon = () => {
    if (stats.connected) {
      return <Wifi className="w-4 h-4 text-green-600" />;
    } else if (stats.readyState === 0) {
      return <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />;
    } else {
      return <WifiOff className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusBadge = () => {
    if (stats.connected) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
    } else if (stats.readyState === 0) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Connecting...</Badge>;
    } else {
      return <Badge variant="destructive">Disconnected</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">WebSocket Status</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            <Button 
              onClick={handleReconnect}
              variant="outline" 
              size="sm"
              disabled={stats.readyState === 0}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${stats.readyState === 0 ? 'animate-spin' : ''}`} />
              Reconnect
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Ready State:</strong> {readyStateLabels[stats.readyState as keyof typeof readyStateLabels]}
          </div>
          <div>
            <strong>Status:</strong> {stats.connected ? 'Active' : 'Inactive'}
          </div>
          {stats.connectionTime && (
            <div>
              <strong>Connected Since:</strong> {new Date(stats.connectionTime).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Error Display */}
        {stats.lastError && (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>Last Error:</strong> {stats.lastError}
            </AlertDescription>
          </Alert>
        )}

        {/* Replit Infrastructure Notice */}
        {!stats.connected && (
          <Alert>
            <Zap className="w-4 h-4" />
            <AlertDescription>
              <strong>Known Issue:</strong> Replit has migrated to a new WebSocket proxy system (Eval) which is causing 
              temporary connection issues. This affects hot reload but doesn't impact your application functionality.
              <br /><br />
              <strong>Workaround:</strong> Manual refresh may be needed during development. 
              The connection manager will attempt automatic reconnection.
            </AlertDescription>
          </Alert>
        )}

        {/* Technical Details */}
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">Technical Details</summary>
          <div className="mt-2 space-y-1">
            <div>WebSocket URL: {window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//{window.location.host}</div>
            <div>Environment: {process.env.NODE_ENV}</div>
            <div>User Agent: {navigator.userAgent.slice(0, 80)}...</div>
            <div>Domain: {window.location.hostname}</div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}