import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar as CalendarIcon,
  ChevronLeft, 
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  User,
  Repeat,
  Bell,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, isToday, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import EventModal from "./event-modal";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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

interface WeeklyCalendarViewProps {
  initialDate?: Date;
  onClose?: () => void;
}

export default function WeeklyCalendarView({ initialDate = new Date(), onClose }: WeeklyCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calcola date della settimana
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Lunedì
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Fetch eventi della settimana
  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['/api/calendar/week', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/calendar/week?date=${format(weekStart, 'yyyy-MM-dd')}`);
      return response.json();
    },
    refetchInterval: 30000 // Refresh ogni 30 secondi
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiRequest('DELETE', `/api/calendar/events/${eventId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: '✅ Evento Eliminato', 
        description: 'L\'evento è stato eliminato con successo' 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/week'] });
    },
    onError: () => {
      toast({ 
        title: '❌ Errore', 
        description: 'Impossibile eliminare l\'evento',
        variant: 'destructive'
      });
    }
  });

  // Update event status mutation
  const updateEventStatusMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/calendar/events/${eventId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: '✅ Stato Aggiornato', 
        description: 'Lo stato dell\'evento è stato aggiornato' 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/week'] });
    }
  });

  // Naviga settimane
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1)
    );
  };

  // Raggruppa eventi per giorno
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.startDate);
      return isSameDay(eventDate, date);
    }).sort((a, b) => {
      const timeA = parseISO(a.startDate).getTime();
      const timeB = parseISO(b.startDate).getTime();
      return timeA - timeB;
    });
  };

  // Colori per priorità
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  // Icone per tipo evento
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <User className="h-3 w-3" />;
      case 'deadline': return <Clock className="h-3 w-3" />;
      case 'reminder': return <Bell className="h-3 w-3" />;
      default: return <CalendarIcon className="h-3 w-3" />;
    }
  };

  // Apri modal per nuovo evento
  const handleNewEvent = (date?: Date) => {
    setSelectedEvent(null);
    setSelectedDate(date || currentDate);
    setIsEventModalOpen(true);
  };

  // Apri modal per modifica evento
  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  // Oggi
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            Calendario EasyCashFlows
          </h1>
          <Badge variant="outline" className="text-blue-600">
            Vista Settimanale
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={goToToday}
          >
            Oggi
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigateWeek('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigateWeek('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[200px] text-center">
            {format(weekStart, 'd MMM', { locale: it })} - {format(weekEnd, 'd MMM yyyy', { locale: it })}
          </span>
          <Button 
            onClick={() => handleNewEvent()}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="button-new-event"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Evento
          </Button>
          {onClose && (
            <Button 
              variant="outline" 
              onClick={onClose}
              data-testid="button-close-calendar"
            >
              Chiudi
            </Button>
          )}
        </div>
      </div>

      {/* Griglia Settimanale */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-7 gap-2 h-full">
          {weekDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentDay = isToday(day);
            
            return (
              <Card 
                key={index} 
                className={`flex flex-col ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className={`flex items-center gap-2 ${isCurrentDay ? 'text-blue-600 font-bold' : ''}`}>
                      <span className="capitalize">
                        {format(day, 'EEE', { locale: it })}
                      </span>
                      <span className={`text-lg ${isCurrentDay ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm' : ''}`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleNewEvent(day)}
                      className="h-6 w-6 p-0"
                      data-testid={`button-add-event-${format(day, 'yyyy-MM-dd')}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 p-2 space-y-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="text-xs text-muted-foreground">Caricamento...</div>
                  ) : dayEvents.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic">Nessun evento</div>
                  ) : (
                    dayEvents.map((event) => (
                      <div 
                        key={event.id}
                        className={`p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                          event.status === 'completed' ? 'opacity-60' : ''
                        }`}
                        style={{ backgroundColor: event.color || '#3B82F6' }}
                        onClick={() => handleEditEvent(event)}
                        data-testid={`event-${event.id}`}
                      >
                        <div className="flex items-center justify-between text-white">
                          <div className="flex items-center gap-1">
                            {getTypeIcon(event.type)}
                            <span className="font-medium truncate">{event.title}</span>
                          </div>
                          {event.isRecurring && <Repeat className="h-3 w-3" />}
                        </div>
                        
                        {!event.isAllDay && (
                          <div className="text-white/80 text-xs mt-1">
                            {format(parseISO(event.startDate), 'HH:mm')}
                            {event.endDate && format(parseISO(event.endDate), 'HH:mm') !== format(parseISO(event.startDate), 'HH:mm') && 
                              ` - ${format(parseISO(event.endDate), 'HH:mm')}`
                            }
                          </div>
                        )}
                        
                        {event.location && (
                          <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
                            <MapPin className="h-2 w-2" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-1">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getPriorityColor(event.priority)} text-white border-0`}
                          >
                            {event.priority}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className="text-xs text-white border-white/50"
                          >
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setSelectedEvent(null);
          setSelectedDate(null);
        }}
        event={selectedEvent}
        initialDate={selectedDate}
        onEventCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/calendar/week'] });
        }}
        onEventUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/calendar/week'] });
        }}
      />
    </div>
  );
}