import React from 'react';
import { Skeleton } from './skeleton';
import { Card, CardContent, CardHeader } from './card';
import { Loader2, Wifi, WifiOff } from 'lucide-react';

// Componente per loading skeleton personalizzato
export const LoadingSkeleton = ({ 
  lines = 3, 
  className = '',
  showAvatar = false 
}: { 
  lines?: number; 
  className?: string;
  showAvatar?: boolean;
}) => (
  <div className={`space-y-3 ${className}`}>
    {showAvatar && (
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[160px]" />
        </div>
      </div>
    )}
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className="h-4 w-full" />
    ))}
  </div>
);

// Componente per loading di tabelle
export const TableLoadingSkeleton = ({ 
  rows = 5, 
  columns = 4 
}: { 
  rows?: number; 
  columns?: number; 
}) => (
  <div className="space-y-3">
    {/* Header skeleton */}
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={`header-${i}`} className="h-8 w-full" />
      ))}
    </div>
    {/* Rows skeleton */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="grid grid-cols-4 gap-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-6 w-full" />
        ))}
      </div>
    ))}
  </div>
);

// Componente per loading di cards
export const CardLoadingSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// Componente per loading centrato con spinner
export const CenteredLoader = ({ 
  message = 'Caricamento...',
  size = 'default'
}: { 
  message?: string;
  size?: 'small' | 'default' | 'large';
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-6 w-6',
    large: 'h-8 w-8'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

// Componente per loading inline
export const InlineLoader = ({ 
  message = 'Caricamento...',
  className = ''
}: { 
  message?: string;
  className?: string;
}) => (
  <div className={`flex items-center space-x-2 ${className}`}>
    <Loader2 className="h-4 w-4 animate-spin" />
    <span className="text-sm text-muted-foreground">{message}</span>
  </div>
);

// Componente per indicatore di connessione
export const ConnectionStatus = ({ 
  isOnline = true,
  className = ''
}: { 
  isOnline?: boolean;
  className?: string;
}) => (
  <div className={`flex items-center space-x-2 ${className}`}>
    {isOnline ? (
      <>
        <Wifi className="h-4 w-4 text-green-500" />
        <span className="text-xs text-green-600">Online</span>
      </>
    ) : (
      <>
        <WifiOff className="h-4 w-4 text-red-500" />
        <span className="text-xs text-red-600">Offline</span>
      </>
    )}
  </div>
);

// Componente per loading progressivo
export const ProgressiveLoader = ({ 
  progress = 0,
  message = 'Elaborazione...',
  className = ''
}: { 
  progress?: number;
  message?: string;
  className?: string;
}) => (
  <div className={`space-y-3 ${className}`}>
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{message}</span>
      <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div 
        className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out" 
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

// Hook per gestire stati di loading multipli
export const useLoadingStates = () => {
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});

  const setLoading = React.useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const isLoading = React.useCallback((key: string) => {
    return Boolean(loadingStates[key]);
  }, [loadingStates]);

  const isAnyLoading = React.useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  return { setLoading, isLoading, isAnyLoading };
};