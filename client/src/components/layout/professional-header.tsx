import { Bell, Menu, Settings, User, MessageSquare, Mail, Smartphone, MessageCircle, TrendingUp, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { Notification } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CalendarWeeklyView from "@/components/calendar/calendar-weekly-view";

interface ProfessionalHeaderProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

// Notification category icons
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'movement': return <TrendingUp className="w-4 h-4" />;
    case 'whatsapp': return <MessageSquare className="w-4 h-4" />;
    case 'sms': return <Smartphone className="w-4 h-4" />;
    case 'email': return <Mail className="w-4 h-4" />;
    case 'messenger': return <MessageCircle className="w-4 h-4" />;
    default: return <Bell className="w-4 h-4" />;
  }
};

// Notification category colors
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'movement': return 'text-green-600 bg-green-50 border-green-200';
    case 'whatsapp': return 'text-green-600 bg-green-50 border-green-200';
    case 'sms': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'email': return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'messenger': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

// Notification category names
const getCategoryName = (category: string) => {
  switch (category) {
    case 'movement': return 'Movimenti';
    case 'whatsapp': return 'WhatsApp';
    case 'sms': return 'SMS';
    case 'email': return 'Email';
    case 'messenger': return 'Messenger';
    default: return 'Notifiche';
  }
};

export function ProfessionalHeader({ onToggleSidebar, sidebarOpen = false }: ProfessionalHeaderProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: notifications, isLoading } = useNotifications();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Categorize notifications
  const categorizedNotifications = {
    movement: notifications?.filter(n => n.category === 'movement') || [],
    whatsapp: notifications?.filter(n => n.category === 'whatsapp') || [],
    sms: notifications?.filter(n => n.category === 'sms') || [],
    email: notifications?.filter(n => n.category === 'email') || [],
    messenger: notifications?.filter(n => n.category === 'messenger') || []
  };

  // Total unread count
  const unreadCount = notifications?.filter(n => !n.isRead)?.length || 0;

  // Get category counts
  const getCategoryCount = (category: keyof typeof categorizedNotifications) => {
    return categorizedNotifications[category].filter(n => !n.isRead).length;
  };

  const handleLogout = async () => {
    // Mock logout function - implement actual logout logic
    navigate("/auth");
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setNotificationOpen(false);
    }
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <Card 
      className={`mb-2 cursor-pointer hover:shadow-md transition-all duration-200 border ${getCategoryColor(notification.category || 'default')}`}
      onClick={() => handleNotificationClick(notification)}
      data-testid={`notification-item-${notification.id}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${getCategoryColor(notification.category || 'default')}`}>
            {getCategoryIcon(notification.category || 'default')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-sm leading-tight">{notification.title}</h4>
              {!notification.isRead && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Nuovo
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {notification.message}
            </p>
            {notification.from && (
              <p className="text-xs text-muted-foreground mt-1">
                Da: {notification.from}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: it })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden"
            data-testid="button-toggle-sidebar"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link href="/dashboard">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EC</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white hidden sm:block">
                EasyCashFlows
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Calendar Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCalendarOpen(true)}
            className="relative hover:bg-gray-100 dark:hover:bg-gray-800"
            data-testid="button-calendar"
          >
            <Calendar className="h-5 w-5" />
            {/* TODO: Add calendar event count badge */}
          </Button>

          {/* Professional Notification Bell */}
          <DropdownMenu open={notificationOpen} onOpenChange={setNotificationOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative hover:bg-gray-100 dark:hover:bg-gray-800"
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-600"
                    data-testid="badge-notification-count"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-96 p-0" align="end" data-testid="dropdown-notifications">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Notifiche</h3>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" data-testid="text-unread-count">
                      {unreadCount} non lette
                    </Badge>
                  )}
                </div>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-6 rounded-none border-b">
                  <TabsTrigger value="all" className="text-xs">
                    Tutte
                    {unreadCount > 0 && (
                      <Badge className="ml-1 h-4 w-4 text-xs">{unreadCount}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="movement" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {getCategoryCount('movement') > 0 && (
                      <Badge className="ml-1 h-4 w-4 text-xs">{getCategoryCount('movement')}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp" className="text-xs">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    {getCategoryCount('whatsapp') > 0 && (
                      <Badge className="ml-1 h-4 w-4 text-xs">{getCategoryCount('whatsapp')}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="sms" className="text-xs">
                    <Smartphone className="w-3 h-3 mr-1" />
                    {getCategoryCount('sms') > 0 && (
                      <Badge className="ml-1 h-4 w-4 text-xs">{getCategoryCount('sms')}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="email" className="text-xs">
                    <Mail className="w-3 h-3 mr-1" />
                    {getCategoryCount('email') > 0 && (
                      <Badge className="ml-1 h-4 w-4 text-xs">{getCategoryCount('email')}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="messenger" className="text-xs">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    {getCategoryCount('messenger') > 0 && (
                      <Badge className="ml-1 h-4 w-4 text-xs">{getCategoryCount('messenger')}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="max-h-96">
                  <TabsContent value="all" className="p-4 mt-0">
                    {isLoading ? (
                      <div className="text-center py-4 text-muted-foreground">
                        Caricamento notifiche...
                      </div>
                    ) : notifications && notifications.length > 0 ? (
                      notifications
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 10)
                        .map((notification) => (
                          <NotificationItem key={notification.id} notification={notification} />
                        ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Nessuna notifica</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Category specific tabs */}
                  {Object.entries(categorizedNotifications).map(([category, categoryNotifications]) => (
                    <TabsContent key={category} value={category} className="p-4 mt-0">
                      {categoryNotifications.length > 0 ? (
                        categoryNotifications
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .slice(0, 10)
                          .map((notification) => (
                            <NotificationItem key={notification.id} notification={notification} />
                          ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          {getCategoryIcon(category)}
                          <p className="mt-2">Nessuna notifica per {getCategoryName(category)}</p>
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </ScrollArea>
              </Tabs>

              {notifications && notifications.length > 10 && (
                <div className="p-4 border-t">
                  <Button variant="ghost" className="w-full text-center" asChild>
                    <Link href="/notifications">
                      Visualizza tutte le notifiche
                    </Link>
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="button-user-menu">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatarUrl || undefined} alt={user?.username || 'User'} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" data-testid="dropdown-user-menu">
              <DropdownMenuLabel data-testid="text-user-info">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" data-testid="link-settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Impostazioni</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                <User className="mr-2 h-4 w-4" />
                <span>Disconnettiti</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Calendar Dialog */}
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <CalendarWeeklyView 
            onClose={() => setCalendarOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </header>
  );
}