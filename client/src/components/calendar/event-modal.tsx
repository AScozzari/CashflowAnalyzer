import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  Repeat,
  Bell,
  Save,
  Trash2,
  Link
} from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface CalendarEvent {
  id?: string;
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
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
  color: string;
  linkedMovementId?: string;
  linkedResourceId?: string;
  assignedToUserId?: string;
  reminders?: Array<{
    reminderType: 'notification' | 'email' | 'sms' | 'whatsapp';
    reminderTime: number;
    reminderUnit: 'minutes' | 'hours' | 'days';
  }>;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  initialDate?: Date | null;
  onEventCreated?: () => void;
  onEventUpdated?: () => void;
}

const defaultEvent: Partial<CalendarEvent> = {
  title: '',
  description: '',
  isAllDay: false,
  location: '',
  type: 'task',
  priority: 'medium',
  status: 'planned',
  isRecurring: false,
  color: '#3B82F6',
  reminders: []
};

export default function EventModal({ 
  isOpen, 
  onClose, 
  event, 
  initialDate,
  onEventCreated,
  onEventUpdated 
}: EventModalProps) {
  const [formData, setFormData] = useState<Partial<CalendarEvent>>(defaultEvent);
  const [activeTab, setActiveTab] = useState("details");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch movements for linking
  const { data: movements = [] } = useQuery({
    queryKey: ['/api/movements'],
    enabled: isOpen
  });

  // Fetch resources for assignment
  const { data: resources = [] } = useQuery({
    queryKey: ['/api/resources'],
    enabled: isOpen
  });

  useEffect(() => {
    if (event) {
      setFormData(event);
    } else if (initialDate) {
      const startDate = new Date(initialDate);
      startDate.setHours(9, 0, 0, 0); // Default 9:00 AM
      
      const endDate = new Date(startDate);
      endDate.setHours(10, 0, 0, 0); // Default 1 hour duration
      
      setFormData({
        ...defaultEvent,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    } else {
      setFormData(defaultEvent);
    }
  }, [event, initialDate, isOpen]);

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: Partial<CalendarEvent>) => {
      const response = await apiRequest('POST', '/api/calendar/events', eventData);
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: '✅ Evento Creato', 
        description: 'L\'evento è stato creato con successo' 
      });
      onEventCreated?.();
      onClose();
    },
    onError: () => {
      toast({ 
        title: '❌ Errore', 
        description: 'Impossibile creare l\'evento',
        variant: 'destructive'
      });
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (eventData: Partial<CalendarEvent>) => {
      const response = await apiRequest('PUT', `/api/calendar/events/${event?.id}`, eventData);
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: '✅ Evento Aggiornato', 
        description: 'L\'evento è stato aggiornato con successo' 
      });
      onEventUpdated?.();
      onClose();
    },
    onError: () => {
      toast({ 
        title: '❌ Errore', 
        description: 'Impossibile aggiornare l\'evento',
        variant: 'destructive'
      });
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/calendar/events/${event?.id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: '✅ Evento Eliminato', 
        description: 'L\'evento è stato eliminato con successo' 
      });
      onEventUpdated?.();
      onClose();
    }
  });

  const handleSave = () => {
    if (!formData.title?.trim()) {
      toast({
        title: '❌ Errore',
        description: 'Il titolo è obbligatorio',
        variant: 'destructive'
      });
      return;
    }

    if (event?.id) {
      updateEventMutation.mutate(formData);
    } else {
      createEventMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Sei sicuro di voler eliminare questo evento?')) {
      deleteEventMutation.mutate();
    }
  };

  const addReminder = () => {
    setFormData(prev => ({
      ...prev,
      reminders: [
        ...(prev.reminders || []),
        {
          reminderType: 'notification',
          reminderTime: 15,
          reminderUnit: 'minutes'
        }
      ]
    }));
  };

  const removeReminder = (index: number) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders?.filter((_, i) => i !== index) || []
    }));
  };

  const colorOptions = [
    { value: '#3B82F6', label: 'Blu', class: 'bg-blue-500' },
    { value: '#EF4444', label: 'Rosso', class: 'bg-red-500' },
    { value: '#10B981', label: 'Verde', class: 'bg-green-500' },
    { value: '#F59E0B', label: 'Arancione', class: 'bg-yellow-500' },
    { value: '#8B5CF6', label: 'Viola', class: 'bg-purple-500' },
    { value: '#EC4899', label: 'Rosa', class: 'bg-pink-500' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            {event?.id ? 'Modifica Evento' : 'Nuovo Evento'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Dettagli</TabsTrigger>
            <TabsTrigger value="timing">Orario</TabsTrigger>
            <TabsTrigger value="recurrence">Ricorrenza</TabsTrigger>
            <TabsTrigger value="reminders">Promemoria</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="title">Titolo *</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Inserisci il titolo dell'evento"
                  data-testid="input-event-title"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Inserisci una descrizione dettagliata"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="meeting">Riunione</SelectItem>
                    <SelectItem value="reminder">Promemoria</SelectItem>
                    <SelectItem value="deadline">Scadenza</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priorità</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Bassa</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Stato</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Pianificato</SelectItem>
                    <SelectItem value="in_progress">In Corso</SelectItem>
                    <SelectItem value="completed">Completato</SelectItem>
                    <SelectItem value="cancelled">Annullato</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="color">Colore</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded ${color.class} ${
                        formData.color === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    />
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <Label htmlFor="location">Luogo</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={formData.location || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Inserisci il luogo dell'evento"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timing" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data e Ora Inizio</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate ? format(new Date(formData.startDate), "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: new Date(e.target.value).toISOString() }))}
                />
              </div>

              <div>
                <Label htmlFor="endDate">Data e Ora Fine</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate ? format(new Date(formData.endDate), "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: new Date(e.target.value).toISOString() }))}
                />
              </div>

              <div className="col-span-2 flex items-center space-x-2">
                <Switch
                  id="allDay"
                  checked={formData.isAllDay || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAllDay: checked }))}
                />
                <Label htmlFor="allDay">Tutto il giorno</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recurrence" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="recurring"
                checked={formData.isRecurring || false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: checked }))}
              />
              <Label htmlFor="recurring">Evento ricorrente</Label>
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pattern">Frequenza</Label>
                  <Select
                    value={formData.recurrencePattern}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, recurrencePattern: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona frequenza" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Giornaliera</SelectItem>
                      <SelectItem value="weekly">Settimanale</SelectItem>
                      <SelectItem value="monthly">Mensile</SelectItem>
                      <SelectItem value="yearly">Annuale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="interval">Intervallo</Label>
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    value={formData.recurrenceInterval || 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurrenceInterval: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="endRecurrence">Data Fine Ricorrenza</Label>
                  <Input
                    id="endRecurrence"
                    type="date"
                    value={formData.recurrenceEndDate ? format(new Date(formData.recurrenceEndDate), 'yyyy-MM-dd') : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurrenceEndDate: new Date(e.target.value).toISOString() }))}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reminders" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Promemoria</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addReminder}
              >
                <Bell className="h-4 w-4 mr-2" />
                Aggiungi Promemoria
              </Button>
            </div>

            {formData.reminders?.map((reminder, index) => (
              <div key={index} className="flex items-center gap-2 p-3 border rounded">
                <Select
                  value={reminder.reminderType}
                  onValueChange={(value) => {
                    const newReminders = [...(formData.reminders || [])];
                    newReminders[index] = { ...reminder, reminderType: value as any };
                    setFormData(prev => ({ ...prev, reminders: newReminders }));
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notification">Notifica</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  value={reminder.reminderTime}
                  onChange={(e) => {
                    const newReminders = [...(formData.reminders || [])];
                    newReminders[index] = { ...reminder, reminderTime: parseInt(e.target.value) };
                    setFormData(prev => ({ ...prev, reminders: newReminders }));
                  }}
                  className="w-20"
                />

                <Select
                  value={reminder.reminderUnit}
                  onValueChange={(value) => {
                    const newReminders = [...(formData.reminders || [])];
                    newReminders[index] = { ...reminder, reminderUnit: value as any };
                    setFormData(prev => ({ ...prev, reminders: newReminders }));
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">min</SelectItem>
                    <SelectItem value="hours">ore</SelectItem>
                    <SelectItem value="days">giorni</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeReminder(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            {event?.id && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteEventMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Elimina
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button 
              onClick={handleSave}
              disabled={createEventMutation.isPending || updateEventMutation.isPending}
              data-testid="button-save-event"
            >
              <Save className="h-4 w-4 mr-2" />
              {event?.id ? 'Aggiorna' : 'Crea'} Evento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}