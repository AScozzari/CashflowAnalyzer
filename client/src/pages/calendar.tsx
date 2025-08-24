import { useState } from "react";
import Header from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Bell,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Filter,
  Download,
  Settings
} from "lucide-react";
import WeeklyCalendarView from "@/components/calendar/calendar-weekly-view";
import EventModal from "@/components/calendar/event-modal";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  location?: string;
  type: 'task' | 'meeting' | 'reminder' | 'deadline';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  isRecurring: boolean;
  color: string;
  linkedMovementId?: string;
  linkedResourceId?: string;
  assignedToUserId?: string;
  createdByUserId: string;
}

export default function Calendar() {
  const [selectedView, setSelectedView] = useState<'week' | 'month' | 'agenda'>('week');
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { toast } = useToast();

  // Fetch eventi calendario
  const { data: events = [], isLoading, error } = useQuery<CalendarEvent[]>({
    queryKey: ['/api/calendar/events'],
    staleTime: 30000, // 30 seconds
  });

  // Stats veloci
  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.startDate);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });

  const thisWeekEvents = events.filter(event => {
    const eventDate = new Date(event.startDate);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Lunedì
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // Domenica
    return eventDate >= weekStart && eventDate <= weekEnd;
  });

  const pendingTasks = events.filter(event => 
    event.type === 'task' && event.status === 'planned'
  );

  const upcomingReminders = events.filter(event => 
    event.type === 'reminder' && 
    new Date(event.startDate) > new Date() &&
    new Date(event.startDate) < new Date(Date.now() + 24 * 60 * 60 * 1000) // prossime 24 ore
  );

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'task': return 'bg-blue-100 text-blue-800';
      case 'meeting': return 'bg-green-100 text-green-800';
      case 'reminder': return 'bg-orange-100 text-orange-800';
      case 'deadline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-600';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'urgent': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Calendario & Pianificazione" 
        subtitle="Gestisci appuntamenti, scadenze e promemoria"
        action={
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2"
              onClick={() => window.location.href = '/settings?tab=system'}
              data-testid="button-calendar-settings"
            >
              <Settings className="h-4 w-4" />
              Impostazioni
            </Button>
            <Button 
              size="sm" 
              onClick={() => setIsNewEventModalOpen(true)}
              className="gap-2"
              data-testid="button-new-event"
            >
              <Plus className="h-4 w-4" />
              Nuovo Evento
            </Button>
          </div>
        } 
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Oggi</p>
                  <p className="text-lg font-bold text-gray-900">{todayEvents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CalendarIcon className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Questa Settimana</p>
                  <p className="text-lg font-bold text-gray-900">{thisWeekEvents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Task Pendenti</p>
                  <p className="text-lg font-bold text-gray-900">{pendingTasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Bell className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Promemoria 24h</p>
                  <p className="text-lg font-bold text-gray-900">{upcomingReminders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendario principale */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Calendario Eventi</CardTitle>
                <CardDescription>
                  Vista completa di tutti i tuoi appuntamenti e scadenze
                </CardDescription>
              </div>
              
              <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as 'week' | 'month' | 'agenda')}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="week" data-testid="tab-week">Settimana</TabsTrigger>
                  <TabsTrigger value="month" data-testid="tab-month">Mese</TabsTrigger>
                  <TabsTrigger value="agenda" data-testid="tab-agenda">Agenda</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <Tabs value={selectedView} className="h-full">
              <TabsContent value="week" className="m-0">
                <WeeklyCalendarView 
                  initialDate={selectedDate || new Date()} 
                />
              </TabsContent>
              
              <TabsContent value="month" className="m-0">
                <div className="p-6 text-center">
                  <div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Vista Mensile
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      La vista mensile sarà disponibile a breve
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedView('week')}
                      data-testid="button-back-to-week"
                    >
                      Torna alla Vista Settimanale
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="agenda" className="m-0">
                <div className="p-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : events.length === 0 ? (
                    <div className="text-center py-12">
                      <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Nessun evento programmato
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Inizia creando il tuo primo evento o promemoria
                      </p>
                      <Button 
                        onClick={() => setIsNewEventModalOpen(true)}
                        data-testid="button-create-first-event"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crea Evento
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold mb-4">Prossimi Eventi</h3>
                      {events
                        .filter(event => new Date(event.startDate) >= new Date())
                        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                        .slice(0, 10)
                        .map((event) => (
                        <Card key={event.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{event.title}</h4>
                                <Badge className={getEventTypeColor(event.type)}>
                                  {event.type === 'task' ? 'Task' :
                                   event.type === 'meeting' ? 'Riunione' :
                                   event.type === 'reminder' ? 'Promemoria' :
                                   event.type === 'deadline' ? 'Scadenza' : event.type}
                                </Badge>
                                <Badge variant="outline" className={getPriorityColor(event.priority)}>
                                  {event.priority === 'low' ? 'Bassa' :
                                   event.priority === 'medium' ? 'Media' :
                                   event.priority === 'high' ? 'Alta' :
                                   event.priority === 'urgent' ? 'Urgente' : event.priority}
                                </Badge>
                              </div>
                              
                              {event.description && (
                                <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                              )}
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {event.isAllDay ? 'Tutto il giorno' : 
                                    `${new Date(event.startDate).toLocaleString('it-IT', { 
                                      day: 'numeric', 
                                      month: 'short', 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}`
                                  }
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {event.location}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Modal Nuovo Evento */}
      <EventModal
        isOpen={isNewEventModalOpen}
        onClose={() => setIsNewEventModalOpen(false)}
        onSave={(eventData) => {
          console.log('New event:', eventData);
          // Gestito dalla mutation nel modal
        }}
        selectedDate={selectedDate}
        event={null}
        mode="create"
      />
    </div>
  );
}