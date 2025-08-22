import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, ArrowUpRight, ArrowDownLeft, MessageCircle, Mail, Smartphone } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface RecentActivity {
  id: string;
  type: 'movement' | 'telegram';
  title: string;
  subtitle: string;
  timestamp: string;
  icon: string;
  color: string;
  route: string;
}

export default function RecentActivitiesModal() {
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
      'text-gray-600'
    }`;

    switch (iconName) {
      case 'arrow-up-right':
        return <ArrowUpRight className={iconClass} />;
      case 'arrow-down-left':
        return <ArrowDownLeft className={iconClass} />;
      case 'message-circle':
        return <MessageCircle className={iconClass} />;
      case 'mail':
        return <Mail className={iconClass} />;
      case 'smartphone':
        return <Smartphone className={iconClass} />;
      default:
        return <MessageCircle className={iconClass} />;
    }
  };

  const getBadgeText = (type: string) => {
    switch (type) {
      case 'movement':
        return 'Movimento';
      case 'telegram':
        return 'Telegram';
      default:
        return 'Attività';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Ora';
      if (diffMins < 60) return `${diffMins} min fa`;
      if (diffHours < 24) return `${diffHours} ore fa`;
      if (diffDays === 1) return 'Ieri';
      if (diffDays < 7) return `${diffDays} giorni fa`;
      
      return format(date, 'dd/MM/yyyy', { locale: it });
    } catch {
      return 'Data non valida';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Attività Recenti
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="w-16 h-6 rounded-full" />
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className={`${
                  activity.color === 'green' ? 'text-green-600' : 
                  activity.color === 'red' ? 'text-red-600' : 
                  activity.color === 'blue' ? 'text-blue-600' : 
                  'text-gray-600'
                }`}>
                  {getIcon(activity.icon, activity.color)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.subtitle} • {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
                <Badge variant="outline">{getBadgeText(activity.type)}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nessuna attività recente</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}