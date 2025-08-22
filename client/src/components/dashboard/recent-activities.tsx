import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageCircle,
  Smartphone,
  Mail,
  Send,
  MessageSquare,
  Clock,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface RecentActivity {
  id: string;
  type: 'whatsapp' | 'sms' | 'email' | 'telegram' | 'messenger';
  title: string;
  subtitle: string;
  timestamp: string;
  icon: string;
  color: string;
  route: string;
}

interface RecentActivitiesProps {
  className?: string;
}

export default function RecentActivities({ className }: RecentActivitiesProps) {
  const [, setLocation] = useLocation();

  const { data: activities = [], isLoading } = useQuery<RecentActivity[]>({
    queryKey: ['/api/recent-activities'],
    staleTime: 2 * 60 * 1000, // 2 minuti
    gcTime: 5 * 60 * 1000,
  });

  const getIcon = (iconName: string, color: string) => {
    const iconClass = `h-4 w-4 ${
      color === 'green' ? 'text-green-600' : 
      color === 'red' ? 'text-red-600' : 
      color === 'blue' ? 'text-blue-600' : 
      color === 'purple' ? 'text-purple-600' :
      'text-gray-600'
    }`;

    switch (iconName) {
      case 'message-circle':
        return <MessageCircle className={iconClass} />;
      case 'smartphone':
        return <Smartphone className={iconClass} />;
      case 'mail':
        return <Mail className={iconClass} />;
      case 'send':
        return <Send className={iconClass} />;
      case 'message-square':
        return <MessageSquare className={iconClass} />;
      default:
        return <MessageCircle className={iconClass} />;
    }
  };

  const getBackgroundColor = (color: string) => {
    return color === 'green' ? 'bg-green-50 dark:bg-green-950/30' : 
           color === 'red' ? 'bg-red-50 dark:bg-red-950/30' : 
           color === 'blue' ? 'bg-blue-50 dark:bg-blue-950/30' : 
           color === 'purple' ? 'bg-purple-50 dark:bg-purple-950/30' :
           'bg-gray-50 dark:bg-gray-950/30';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Attività Recenti</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Nessuna attività</h3>
            <p className="text-sm text-muted-foreground">
              Non sono presenti attività recenti da visualizzare
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Attività Recenti</span>
            <span className="text-xs bg-muted px-2 py-1 rounded-full">
              {activities.length}
            </span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="group flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all duration-200 cursor-pointer bg-card/50 hover:bg-card"
              onClick={() => setLocation(activity.route)}
            >
              <div className={`p-2 rounded-full ${getBackgroundColor(activity.color)}`}>
                {getIcon(activity.icon, activity.color)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.subtitle}
                    </p>
                  </div>
                  
                  <div className="text-right ml-2">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.timestamp), 'dd/MM', { locale: it })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.timestamp), 'HH:mm', { locale: it })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}