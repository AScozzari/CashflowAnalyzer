import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Special handling for React hooks errors during page reload
    if (error.message?.includes('useState') || error.message?.includes('useEffect') || error.message?.includes('Cannot read properties of null')) {
      console.warn('React hooks error detected - likely due to page reload timing. Attempting recovery...');
      // Small delay to allow React to fully initialize, then retry
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined });
      }, 100);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-6 max-w-md">
            <h2 className="text-2xl font-bold text-destructive mb-4">
              Qualcosa è andato storto
            </h2>
            <p className="text-muted-foreground mb-6">
              Si è verificato un errore imprevisto. Prova a ricaricare la pagina.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                Ricarica pagina
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 transition-colors"
              >
                Riprova
              </button>
            </div>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Dettagli errore (per sviluppatori)
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}