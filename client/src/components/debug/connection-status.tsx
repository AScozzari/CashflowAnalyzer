import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Activity, AlertCircle, CheckCircle } from 'lucide-react';

interface ConnectionTest {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: string;
}

export function ConnectionStatus() {
  const [tests, setTests] = useState<ConnectionTest[]>([
    { name: 'Environment Detection', status: 'pending', message: 'Checking...' },
    { name: 'API Health', status: 'pending', message: 'Testing...' },
    { name: 'WebSocket Support', status: 'pending', message: 'Testing...' },
    { name: 'iframe Context', status: 'pending', message: 'Checking...' }
  ]);

  const updateTest = (name: string, status: 'success' | 'error', message: string, details?: string) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { name, status, message, details } : test
    ));
  };

  useEffect(() => {
    // Test 1: Environment Detection
    const isReplit = window.location.hostname.includes('replit.dev');
    const isIframe = window.self !== window.top;
    updateTest('Environment Detection', 'success', 
      `Replit: ${isReplit}, iframe: ${isIframe}`, 
      `URL: ${window.location.href}`);

    // Test 2: API Health
    fetch('/api/auth/user')
      .then(response => {
        updateTest('API Health', 'success', 
          `Status: ${response.status}`, 
          `Endpoint responding correctly`);
      })
      .catch(error => {
        updateTest('API Health', 'error', 
          `Connection failed`, 
          error.message);
      });

    // Test 3: WebSocket Support
    try {
      const wsUrl = `wss://${window.location.hostname}`;
      const ws = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        ws.close();
        updateTest('WebSocket Support', 'error', 
          'Connection timeout', 
          `Failed to connect to ${wsUrl}`);
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        updateTest('WebSocket Support', 'success', 
          'Connection successful', 
          `Connected to ${wsUrl}`);
        ws.close();
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        updateTest('WebSocket Support', 'error', 
          'Connection failed', 
          `Cannot connect to ${wsUrl}`);
      };
    } catch (error) {
      updateTest('WebSocket Support', 'error', 
        'WebSocket not supported', 
        (error as Error).message);
    }

    // Test 4: iframe Context
    try {
      if (window.self !== window.top) {
        if (window.location.hostname.includes('replit.dev')) {
          document.domain = 'replit.dev';
          updateTest('iframe Context', 'success', 
            'iframe with domain fix', 
            'document.domain set to replit.dev');
        } else {
          updateTest('iframe Context', 'success', 
            'iframe detected', 
            'Running in iframe context');
        }
      } else {
        updateTest('iframe Context', 'success', 
          'Direct access', 
          'Not in iframe - direct window access');
      }
    } catch (error) {
      updateTest('iframe Context', 'error', 
        'iframe issues', 
        (error as Error).message);
    }
  }, []);

  const getIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-yellow-600 animate-pulse" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const hasErrors = tests.some(test => test.status === 'error');
  const allComplete = tests.every(test => test.status !== 'pending');

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {hasErrors ? <WifiOff className="w-5 h-5 text-red-600" /> : <Wifi className="w-5 h-5 text-green-600" />}
          <CardTitle>Connection Diagnostic</CardTitle>
        </div>
        {allComplete && (
          <Badge className={hasErrors ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
            {hasErrors ? 'Issues Detected' : 'All Systems OK'}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!allComplete && (
          <Alert>
            <Activity className="w-4 h-4 animate-pulse" />
            <AlertDescription>
              Running connection diagnostics...
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          {tests.map((test) => (
            <div key={test.name} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              {getIcon(test.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{test.name}</h4>
                  <Badge className={getStatusColor(test.status)}>
                    {test.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{test.message}</p>
                {test.details && (
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {test.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {hasErrors && allComplete && (
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Some connection issues detected. This might affect hot reload or API functionality.
              Try refreshing the page or opening in a new tab.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}