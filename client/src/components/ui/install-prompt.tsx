import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, X, Smartphone, Monitor, Wifi, WifiOff } from "lucide-react";
import { usePWA, useServiceWorker } from "@/hooks/use-pwa";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function InstallPrompt() {
  const { isInstallable, isInstalled, isOnline, installApp } = usePWA();
  const { updateAvailable, updateServiceWorker } = useServiceWorker();
  const [isInstalling, setIsInstalling] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);

  if (!showPrompt || isInstalled) return null;

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await installApp();
    } catch (error) {
      console.error('Failed to install app:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <>
      {/* Offline Indicator */}
      {!isOnline && (
        <Alert className="mb-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Modalità offline attiva. I dati vengono salvati localmente e sincronizzati quando torni online.
          </AlertDescription>
        </Alert>
      )}

      {/* Update Available */}
      {updateAvailable && (
        <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Download className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Nuovo aggiornamento disponibile!</span>
            <Button size="sm" onClick={updateServiceWorker}>
              Aggiorna
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Install Prompt */}
      {isInstallable && (
        <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Installa EasyCashFlows</CardTitle>
                  <CardDescription>
                    Accesso rapido e funzionalità offline
                  </CardDescription>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPrompt(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="text-xs">
                <Wifi className="h-3 w-3 mr-1" />
                Funziona offline
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Monitor className="h-3 w-3 mr-1" />
                App nativa
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Download className="h-3 w-3 mr-1" />
                Installazione rapida
              </Badge>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1"
              >
                {isInstalling ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Installazione...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Installa App
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setShowPrompt(false)}
              >
                Più tardi
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-3">
              L'app viene installata sul tuo dispositivo per un accesso rapido e funzionalità offline complete.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

export function PWAStatus() {
  const { isInstalled, isOnline, isSupported } = usePWA();
  
  if (!isSupported) return null;

  return (
    <div className="flex items-center gap-2">
      {isInstalled && (
        <Badge variant="outline" className="text-xs">
          <Monitor className="h-3 w-3 mr-1" />
          App Mode
        </Badge>
      )}
      
      <Badge variant={isOnline ? "default" : "secondary"} className="text-xs">
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3 mr-1" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 mr-1" />
            Offline
          </>
        )}
      </Badge>
    </div>
  );
}