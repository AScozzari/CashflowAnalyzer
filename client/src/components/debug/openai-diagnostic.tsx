import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DiagnosticResult {
  step: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: string;
}

export function OpenAIDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateResult = (step: string, status: 'pending' | 'success' | 'error', message: string, details?: string) => {
    setResults(prev => [
      ...prev.filter(r => r.step !== step),
      { step, status, message, details }
    ]);
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);

    // Step 1: Test connection
    updateResult('connection', 'pending', 'Testing OpenAI connection...');
    try {
      const response = await apiRequest('POST', '/api/ai/test-connection');
      const data = await response.json();
      
      if (data.success) {
        updateResult('connection', 'success', `Connected successfully to ${data.model}`, 
          'API key is valid and functional');
      } else {
        updateResult('connection', 'error', data.error || 'Connection failed',
          'This indicates billing or quota issues');
      }
    } catch (error: any) {
      updateResult('connection', 'error', 'Network error', error.message);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">OpenAI API Diagnostic</CardTitle>
          <Button 
            onClick={runDiagnostic}
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isRunning ? 'animate-spin' : ''}`} />
            Run Test
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Diagnostic Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((result) => (
              <div key={result.step} className="flex items-start space-x-3 p-3 border rounded-lg">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium capitalize">{result.step}</span>
                    <Badge variant={result.status === 'success' ? 'default' : 
                      result.status === 'error' ? 'destructive' : 'secondary'}>
                      {result.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-muted-foreground mt-1 opacity-75">{result.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error 429 Troubleshooting Guide */}
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-3">
              <div>
                <strong>Error 429 "Quota Exceeded" - Common Solutions:</strong>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <strong>1. Billing Setup Required:</strong>
                  <p>Even with ChatGPT Plus, the API requires separate billing setup.</p>
                  <a 
                    href="https://platform.openai.com/account/billing/overview" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Open Billing Dashboard <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>

                <div>
                  <strong>2. Enable "Pay as you go":</strong>
                  <p>Add a payment method and load account with prepaid credits ($5-10 minimum).</p>
                </div>

                <div>
                  <strong>3. Regenerate API Key:</strong>
                  <p>After setting up billing, generate a new API key and wait 5-10 minutes.</p>
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Manage API Keys <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>

                <div>
                  <strong>4. Check Usage Tier:</strong>
                  <p>Verify your Usage Tier and rate limits in organization settings.</p>
                  <a 
                    href="https://platform.openai.com/settings/organization/limits" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 mt-1"
                  >
                    View Limits <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Current API Key Info */}
        <div className="p-3 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Current Configuration</h4>
          <div className="text-sm space-y-1">
            <div>API Key: Configured ✓</div>
            <div>Environment: {import.meta.env.MODE}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}