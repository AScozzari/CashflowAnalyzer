import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, 
  Download, 
  Wifi, 
  WifiOff, 
  Sync, 
  Bell, 
  Settings,
  Share
} from "lucide-react";

interface PWAFeaturesProps {
  className?: string;
}

// Install prompt component
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    
    if (result && result.outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  if (!showInstallPrompt) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Installa l'App</h3>
              <p className="text-xs text-muted-foreground">
                Aggiungi alla schermata principale per accesso rapido
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              onClick={handleInstall}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Installa
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setShowInstallPrompt(false)}
              className="text-xs"
            >
              ✕
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Network status component
export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSync(new Date());
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center space-x-2 text-sm">
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4 text-green-500" />
          <span className="text-green-600 dark:text-green-400">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-red-500" />
          <span className="text-red-600 dark:text-red-400">Offline</span>
        </>
      )}
      <span className="text-muted-foreground">
        • Ultimo sync: {lastSync.toLocaleTimeString('it-IT', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </span>
    </div>
  );
}

// PWA features dashboard
export function PWAFeatures({ className }: PWAFeaturesProps) {
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    // Check if PWA is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true);
    }

    // Check notification permission
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      
      if (permission === 'granted') {
        new Notification('EasyCashFlows', {
          body: 'Notifiche abilitate con successo!',
          icon: '/icon-192x192.png'
        });
      }
    }
  };

  const shareApp = async () => {
    if ('share' in navigator) {
      try {
        await navigator.share({
          title: 'EasyCashFlows',
          text: 'Gestione finanziaria semplice e potente',
          url: window.location.href
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard?.writeText(window.location.href);
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Smartphone className="w-5 h-5 text-blue-600" />
          <span>Funzionalità PWA</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Installation Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span className="text-sm">App installata</span>
          </div>
          <Badge variant={isPWAInstalled ? "default" : "secondary"}>
            {isPWAInstalled ? "Sì" : "No"}
          </Badge>
        </div>

        {/* Network Status */}
        <div className="flex items-center justify-between">
          <NetworkStatus />
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span className="text-sm">Notifiche</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={notificationsEnabled ? "default" : "secondary"}>
              {notificationsEnabled ? "Abilitate" : "Disabilitate"}
            </Badge>
            {!notificationsEnabled && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={requestNotificationPermission}
                className="text-xs"
              >
                Abilita
              </Button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t space-y-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full justify-start text-xs"
            onClick={shareApp}
          >
            <Share className="w-4 h-4 mr-2" />
            Condividi App
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full justify-start text-xs"
            onClick={() => {
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name));
                });
                window.location.reload();
              }
            }}
          >
            <Sync className="w-4 h-4 mr-2" />
            Aggiorna Cache
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}