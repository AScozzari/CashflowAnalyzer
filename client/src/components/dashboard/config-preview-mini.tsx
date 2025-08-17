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

interface ChannelUsage {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'configured' | 'partial' | 'not_configured' | 'error';
  currentUsage: number;
  monthlyLimit: number;
  usagePercentage: number;
  lastUsed?: string;
  messagesThisMonth: number;
  cost: string;
}

interface SystemMetrics {
  totalChannels: number;
  activeChannels: number;
  configurationHealth: number;
  lastUpdate: string;
}

export function ConfigPreviewMini() {
  const [channels, setChannels] = useState<ChannelUsage[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalChannels: 4,
    activeChannels: 0,
    configurationHealth: 0,
    lastUpdate: new Date().toLocaleString('it-IT')
  });

  useEffect(() => {
    // Simulate loading channel usage data
    const mockChannels: ChannelUsage[] = [
      {
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: <MessageSquare className="w-4 h-4" />,
        status: 'configured',
        currentUsage: 4440,
        monthlyLimit: 10000,
        usagePercentage: 44,
        lastUsed: '2 ore fa',
        messagesThisMonth: 4440,
        cost: '€22.50'
      },
      {
        id: 'email',
        name: 'Email',
        icon: <Mail className="w-4 h-4" />,
        status: 'configured',
        currentUsage: 2340,
        monthlyLimit: 50000,
        usagePercentage: 5,
        lastUsed: '1 giorno fa',
        messagesThisMonth: 2340,
        cost: '€8.90'
      },
      {
        id: 'sms',
        name: 'SMS',
        icon: <Phone className="w-4 h-4" />,
        status: 'configured',
        currentUsage: 340,
        monthlyLimit: 1000,
        usagePercentage: 34,
        lastUsed: '5 ore fa',
        messagesThisMonth: 340,
        cost: '€15.60'
      },
      {
        id: 'telegram',
        name: 'Telegram',
        icon: <Send className="w-4 h-4" />,
        status: 'not_configured',
        currentUsage: 0,
        monthlyLimit: 10000,
        usagePercentage: 0,
        lastUsed: 'Mai',
        messagesThisMonth: 0,
        cost: '€0.00'
      }
    ];

    setChannels(mockChannels);

    // Calculate metrics
    const activeChannelsCount = mockChannels.filter(ch => ch.status === 'configured').length;
    const avgUsage = mockChannels.reduce((acc, ch) => acc + ch.usagePercentage, 0) / mockChannels.length;

    setMetrics(prev => ({
      ...prev,
      activeChannels: activeChannelsCount,
      configurationHealth: Math.round(avgUsage)
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
    <Card className="w-full border-blue-200 dark:border-blue-800 shadow-lg bg-gradient-to-br from-blue-50/50 to-purple-50/30 dark:from-blue-950/50 dark:to-purple-950/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg font-bold text-blue-900 dark:text-blue-100">📊 Utilizzo Canali</CardTitle>
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
        <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Utilizzo Medio</span>
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
        </div>

        {/* Channel Usage Cards */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">📊 Utilizzo Mensile Canali</h4>
          <div className="grid grid-cols-1 gap-3">
            {channels.map((channel) => (
              <div 
                key={channel.id} 
                className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${getStatusColor(channel.status)}`}>
                    {channel.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{channel.name}</span>
                      {getStatusIcon(channel.status)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Ultimo utilizzo: {channel.lastUsed}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-primary">{channel.cost}</div>
                    <div className="text-xs text-muted-foreground">Costo mese</div>
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Messaggi inviati</span>
                    <span className="font-medium">{channel.messagesThisMonth.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Limite mensile</span>
                    <span className="font-medium">{channel.monthlyLimit.toLocaleString()}</span>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Utilizzo</span>
                      <span className="text-xs font-medium">{channel.usagePercentage}%</span>
                    </div>
                    <Progress 
                      value={channel.usagePercentage} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


      </CardContent>
    </Card>
  );
}