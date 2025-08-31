import { useState } from "react";
import { Bell, Eye, EyeOff, Trash2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, useUnreadNotificationsCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification } from "@/hooks/use-notifications";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function NotificationsBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const { data: notifications = [], isLoading } = useNotifications();
  
  // Function to get category color - Updated per user requirements
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'telegram': return 'bg-purple-500 hover:bg-purple-600'; // Viola per Telegram
      case 'sms': return 'bg-red-500 hover:bg-red-600'; // Rosso per SMS
      case 'movements': return 'bg-yellow-500 hover:bg-yellow-600'; // Giallo per movimenti
      case 'whatsapp': return 'bg-green-500 hover:bg-green-600'; 
      case 'email': return 'bg-blue-500 hover:bg-blue-600';
      case 'messenger': return 'bg-indigo-500 hover:bg-indigo-600';
      case 'invoicing': return 'bg-cyan-500 hover:bg-cyan-600'; // Acquamarina per fatture
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Function to get category CSS color (for segments)
  const getCategoryCssColor = (category: string): string => {
    switch (category) {
      case 'telegram': return '#8b5cf6'; // purple-500
      case 'sms': return '#ef4444'; // red-500
      case 'movements': return '#eab308'; // yellow-500
      case 'whatsapp': return '#22c55e'; // green-500
      case 'email': return '#3b82f6'; // blue-500
      case 'messenger': return '#6366f1'; // indigo-500
      case 'invoicing': return '#06b6d4'; // cyan-500 - acquamarina
      default: return '#6b7280'; // gray-500
    }
  };

  // Get unread notifications by category
  const unreadByCategory = notifications
    .filter(n => !n.isRead)
    .reduce((acc: any, notification: any) => {
      const cat = notification.category || 'other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
  
  // Get active categories with notifications
  const activeCategories = Object.keys(unreadByCategory).filter(cat => unreadByCategory[cat] > 0);
  
  // Create segments for multi-color badge
  const createSegments = () => {
    if (activeCategories.length === 0) return [];
    if (activeCategories.length === 1) {
      return [{
        category: activeCategories[0],
        color: getCategoryCssColor(activeCategories[0]),
        startAngle: 0,
        endAngle: 360,
        count: unreadByCategory[activeCategories[0]]
      }];
    }

    const totalNotifications = Object.values(unreadByCategory).reduce((sum: number, count) => sum + count, 0);
    let currentAngle = 0;
    
    return activeCategories.map(category => {
      const count = unreadByCategory[category];
      const percentage = count / totalNotifications;
      const angleSize = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSize;
      
      currentAngle += angleSize;
      
      return {
        category,
        color: getCategoryCssColor(category),
        startAngle,
        endAngle,
        count
      };
    });
  };

  const segments = createSegments();
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsReadMutation.mutateAsync(notificationId);
      toast({
        title: "Notifica segnata come letta",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile segnare la notifica come letta",
        variant: "destructive"
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      toast({
        title: "Tutte le notifiche segnate come lette",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile segnare tutte le notifiche come lette",
        variant: "destructive"
      });
    }
  };

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotificationMutation.mutateAsync(notificationId);
      toast({
        title: "Notifica eliminata",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile eliminare la notifica",
        variant: "destructive"
      });
    }
  };

  const handleNotificationClick = (notification: any) => {
    // Segna come letta se non lo è già
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Naviga alla pagina appropriata in base al tipo di notifica
    let targetUrl = '/movements'; // Default
    
    if (notification.actionUrl) {
      targetUrl = notification.actionUrl;
    } else if (notification.category) {
      switch (notification.category) {
        case 'movement':
          targetUrl = '/movements';
          break;
        case 'whatsapp':
          targetUrl = '/communications/whatsapp';
          break;
        case 'sms':
          targetUrl = '/communications/sms';
          break;
        case 'email':
          targetUrl = '/communications/email';
          break;
        case 'messenger':
          targetUrl = '/communications/messenger';
          break;
        case 'telegram':
          targetUrl = '/communications/telegram';
          break;
        default:
          targetUrl = '/movements';
      }
    }
    
    setLocation(targetUrl);
    setIsOpen(false);
  };

  // Function to get category label in Italian
  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'telegram': return 'Telegram';
      case 'sms': return 'SMS';
      case 'movements': return 'Movimenti';
      case 'whatsapp': return 'WhatsApp';
      case 'email': return 'Email';
      case 'messenger': return 'Messenger';
      case 'invoicing': return 'Fatturazione';
      default: return 'Altro';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="notifications-bell">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5">
              {segments.length === 1 ? (
                // Badge singolo per una sola categoria
                <Badge 
                  className={`h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs text-white ${getCategoryColor(segments[0].category)}`}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              ) : (
                // Badge multi-segmento per categorie multiple
                <div className="relative w-5 h-5 rounded-full overflow-hidden border border-white shadow-sm">
                  {segments.map((segment, index) => {
                    const startAngle = (segment.startAngle - 90) * (Math.PI / 180); // -90 per iniziare dall'alto
                    const endAngle = (segment.endAngle - 90) * (Math.PI / 180);
                    
                    // Calcola le coordinate per il path SVG
                    const radius = 10; // metà della larghezza (20px / 2)
                    const largeArcFlag = segment.endAngle - segment.startAngle > 180 ? 1 : 0;
                    
                    const x1 = radius + radius * Math.cos(startAngle);
                    const y1 = radius + radius * Math.sin(startAngle);
                    const x2 = radius + radius * Math.cos(endAngle);
                    const y2 = radius + radius * Math.sin(endAngle);
                    
                    const pathData = `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                    
                    return (
                      <svg
                        key={index}
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d={pathData}
                          fill={segment.color}
                          className="opacity-90"
                        />
                      </svg>
                    );
                  })}
                  
                  {/* Numero al centro */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white drop-shadow-sm">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifiche</h3>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Segna tutte lette
              </Button>
            )}
          </div>
          
          {unreadCount > 0 && (
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="font-medium">Non lette: {unreadCount}</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(unreadByCategory).map(([category, count]) => (
                  <div key={category} className="flex items-center space-x-1">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: getCategoryCssColor(category) }}
                    />
                    <span>{getCategoryLabel(category)}: {count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Caricamento notifiche...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Nessuna notifica
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={`m-2 cursor-pointer transition-colors hover:bg-muted/50 ${
                    !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getCategoryColor(notification.category)}`} />
                        <CardTitle className="text-sm font-medium leading-tight">
                          {notification.title}
                          {!notification.isRead && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Nuovo
                            </Badge>
                          )}
                        </CardTitle>
                      </div>
                      <div className="flex space-x-1">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            disabled={markAsReadMutation.isPending}
                            className="h-6 w-6 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteNotification(notification.id, e)}
                          disabled={deleteNotificationMutation.isPending}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}