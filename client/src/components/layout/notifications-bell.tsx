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
      default: return 'bg-gray-500 hover:bg-gray-600';
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
  
  // Get primary category (most notifications) - Fixed default to match schema
  const primaryCategory = Object.keys(unreadByCategory).reduce((a, b) => 
    unreadByCategory[a] > unreadByCategory[b] ? a : b, 'movements'
  );
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

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className={`absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs text-white ${getCategoryColor(primaryCategory)}`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
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