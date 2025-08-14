import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ERROR BOUNDARY] Caught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleRefresh = () => {
    // Clear error state and force refresh
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  private handleReset = () => {
    // Just clear error state without refresh
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-xl">Oops! Qualcosa è andato storto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Si è verificato un errore imprevisto. Puoi provare a ricaricare la pagina o contattare il supporto se il problema persiste.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Dettagli errore (sviluppo)</summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="outline" className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Riprova
                </Button>
                <Button onClick={this.handleRefresh} className="flex-1">
                  Ricarica Pagina
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook per riportare errori in componenti funzionali
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: string) => {
    console.error('[USE ERROR HANDLER]', error, errorInfo);
    // In un'app reale, potresti inviare questo a un servizio di monitoring
  };
};