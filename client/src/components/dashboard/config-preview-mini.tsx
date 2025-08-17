import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Send, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Zap,
  BarChart3,
  TrendingUp,
  Shield
} from 'lucide-react';
import { Link } from 'wouter';

interface ChannelStatus {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'configured' | 'partial' | 'not_configured' | 'error';
  completionRate: number;
  lastActivity?: string;
  activeFeatures: number;
  totalFeatures: number;
  quickActions: string[];
}

interface SystemMetrics {
  totalChannels: number;
  activeChannels: number;
  configurationHealth: number;
  lastUpdate: string;
}

export function ConfigPreviewMini() {
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalChannels: 4,
    activeChannels: 0,
    configurationHealth: 0,
    lastUpdate: new Date().toLocaleString('it-IT')
  });

  useEffect(() => {
    // Simulate loading channel statuses
    const mockChannels: ChannelStatus[] = [
      {
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: <MessageSquare className="w-4 h-4" />,
        status: 'configured',
        completionRate: 95,
        lastActivity: '2 ore fa',
        activeFeatures: 4,
        totalFeatures: 4,
        quickActions: ['Template', 'Variabili', 'Test']
      },
      {
        id: 'email',
        name: 'Email',
        icon: <Mail className="w-4 h-4" />,
        status: 'partial',
        completionRate: 70,
        lastActivity: '1 giorno fa',
        activeFeatures: 2,
        totalFeatures: 3,
        quickActions: ['API Key', 'Template']
      },
      {
        id: 'sms',
        name: 'SMS',
        icon: <Phone className="w-4 h-4" />,
        status: 'configured',
        completionRate: 85,
        lastActivity: '5 ore fa',
        activeFeatures: 3,
        totalFeatures: 4,
        quickActions: ['Skebby', 'Template']
      },
      {
        id: 'telegram',
        name: 'Telegram',
        icon: <Send className="w-4 h-4" />,
        status: 'not_configured',
        completionRate: 0,
        lastActivity: 'Mai',
        activeFeatures: 0,
        totalFeatures: 4,
        quickActions: ['Configura Bot']
      }
    ];

    setChannels(mockChannels);

    // Calculate metrics
    const activeChannelsCount = mockChannels.filter(ch => ch.status === 'configured').length;
    const avgHealth = mockChannels.reduce((acc, ch) => acc + ch.completionRate, 0) / mockChannels.length;

    setMetrics(prev => ({
      ...prev,
      activeChannels: activeChannelsCount,
      configurationHealth: Math.round(avgHealth)
    }));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'configured': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-orange-600 bg-orange-100';
      case 'not_configured': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'configured': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'partial': return <Clock className="w-4 h-4 text-orange-600" />;
      case 'not_configured': return <Settings className="w-4 h-4 text-gray-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Settings className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'configured': return 'Configurato';
      case 'partial': return 'Parziale';
      case 'not_configured': return 'Da Configurare';
      case 'error': return 'Errore';
      default: return 'Sconosciuto';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Configurazione Canali</CardTitle>
          </div>
          <Link href="/settings">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configura
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* System Metrics Overview */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Salute Sistema</span>
            </div>
            <div className="text-xl font-bold text-blue-600">{metrics.configurationHealth}%</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Canali Attivi</span>
            </div>
            <div className="text-xl font-bold text-green-600">{metrics.activeChannels}/{metrics.totalChannels}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Shield className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">Ultimo Aggiornamento</span>
            </div>
            <div className="text-xs text-muted-foreground">{metrics.lastUpdate}</div>
          </div>
        </div>

        {/* Channel Status Grid */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Status Canali</h4>
          <div className="grid grid-cols-1 gap-3">
            {channels.map((channel) => (
              <div 
                key={channel.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${getStatusColor(channel.status)}`}>
                    {channel.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{channel.name}</span>
                      {getStatusIcon(channel.status)}
                      <Badge variant="outline" className="text-xs">
                        {getStatusText(channel.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Funzioni: {channel.activeFeatures}/{channel.totalFeatures}</span>
                      <span>Ultimo: {channel.lastActivity}</span>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">Completamento</span>
                        <span className="text-xs font-medium">{channel.completionRate}%</span>
                      </div>
                      <Progress value={channel.completionRate} className="h-1" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  {channel.quickActions.map((action, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Azioni Rapide</span>
            <div className="flex gap-2">
              <Link href="/settings?tab=channels">
                <Button size="sm" variant="outline" className="text-xs">
                  Configura Tutto
                </Button>
              </Link>
              <Button size="sm" className="text-xs">
                Test Canali
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}