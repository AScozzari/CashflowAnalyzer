import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarDays, Clock, Bell, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Schema per il reminder
const remindSchema = z.object({
  remindDate: z.string().min(1, "Seleziona una data per il promemoria"),
  remindTime: z.string().min(1, "Seleziona un orario per il promemoria"),
  notes: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  notificationChannels: z.array(z.string()).min(1, "Seleziona almeno un canale di notifica")
});

type RemindFormData = z.infer<typeof remindSchema>;

interface MovementData {
  type: 'income' | 'expense';
  amount: string;
  description?: string;
  companyName?: string;
  flowDate: string;
  entityName?: string; // Nome cliente/fornitore
}

interface MovementRemindModalProps {
  isOpen: boolean;
  onClose: () => void;
  movementData: MovementData;
  onSave: (remindData: RemindFormData) => void;
}

const priorityOptions = [
  { value: 'low', label: 'Bassa', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'Alta', color: 'bg-red-100 text-red-800' }
];

const notificationChannels = [
  { id: 'email', label: 'Email', icon: '📧' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { id: 'sms', label: 'SMS', icon: '📱' },
  { id: 'system', label: 'Notifica Sistema', icon: '🔔' }
];

export default function MovementRemindModal({ 
  isOpen, 
  onClose, 
  movementData, 
  onSave 
}: MovementRemindModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RemindFormData>({
    resolver: zodResolver(remindSchema),
    defaultValues: {
      remindDate: '',
      remindTime: '09:00',
      notes: '',
      priority: 'medium',
      notificationChannels: ['system']
    }
  });

  // Mutation per salvare il reminder
  const saveReminderMutation = useMutation({
    mutationFn: async (reminderData: RemindFormData & { movementData: MovementData }) => {
      const response = await apiRequest('POST', '/api/calendar/reminders', reminderData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '✅ Promemoria Creato',
        description: 'Il promemoria per il movimento è stato salvato nel calendario'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({
        title: '❌ Errore',
        description: 'Impossibile salvare il promemoria',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (data: RemindFormData) => {
    setIsSubmitting(true);
    
    // Combina data e ora per creare il datetime del reminder
    const reminderDateTime = `${data.remindDate}T${data.remindTime}`;
    
    const reminderData = {
      ...data,
      movementData,
      reminderDateTime
    };

    saveReminderMutation.mutate(reminderData);
    onSave(data);
    setIsSubmitting(false);
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(num);
  };

  const getMovementTypeLabel = (type: string) => {
    return type === 'income' ? 'Entrata' : 'Uscita';
  };

  const getMovementTypeColor = (type: string) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="movement-remind-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            Crea Promemoria Movimento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Riepilogo Movimento */}
          <Card className="bg-gray-50 dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Movimento da Ricordare</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tipo:</span>
                <Badge variant="outline" className={getMovementTypeColor(movementData.type)}>
                  {getMovementTypeLabel(movementData.type)}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Importo:</span>
                <span className={`font-semibold ${getMovementTypeColor(movementData.type)}`}>
                  {formatCurrency(movementData.amount)}
                </span>
              </div>

              {movementData.entityName && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {movementData.type === 'income' ? 'Cliente:' : 'Fornitore:'}
                  </span>
                  <span className="text-sm font-medium">{movementData.entityName}</span>
                </div>
              )}

              {movementData.companyName && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Azienda:</span>
                  <span className="text-sm font-medium">{movementData.companyName}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Data Movimento:</span>
                <span className="text-sm font-medium">
                  {new Date(movementData.flowDate).toLocaleDateString('it-IT')}
                </span>
              </div>

              {movementData.description && (
                <div className="pt-2">
                  <span className="text-sm text-gray-600">Descrizione:</span>
                  <p className="text-sm mt-1 p-2 bg-white dark:bg-gray-800 rounded border">
                    {movementData.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Promemoria */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Data e Ora Promemoria */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Quando Ricordare
                  </CardTitle>
                  <CardDescription>
                    Imposta data e ora per ricevere il promemoria
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="remindDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Promemoria</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              min={new Date().toISOString().split('T')[0]}
                              data-testid="remind-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="remindTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ora Promemoria</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              data-testid="remind-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priorità</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="remind-priority">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {priorityOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${option.color.includes('gray') ? 'bg-gray-400' : option.color.includes('yellow') ? 'bg-yellow-400' : 'bg-red-400'}`}></span>
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Canali di Notifica */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Canali di Notifica
                  </CardTitle>
                  <CardDescription>
                    Seleziona come vuoi ricevere il promemoria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notificationChannels"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-2 gap-3">
                          {notificationChannels.map((channel) => (
                            <label
                              key={channel.id}
                              className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                field.value.includes(channel.id)
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={field.value.includes(channel.id)}
                                onChange={(e) => {
                                  const updatedChannels = e.target.checked
                                    ? [...field.value, channel.id]
                                    : field.value.filter(c => c !== channel.id);
                                  field.onChange(updatedChannels);
                                }}
                                className="w-4 h-4 text-blue-600"
                                data-testid={`channel-${channel.id}`}
                              />
                              <span className="text-lg">{channel.icon}</span>
                              <span className="text-sm font-medium">{channel.label}</span>
                            </label>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Note Aggiuntive */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Note Aggiuntive</CardTitle>
                  <CardDescription>
                    Aggiungi dettagli o contesto per il promemoria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="es. Verificare se il pagamento è stato ricevuto, controllare fattura, follow-up con il cliente..."
                            rows={4}
                            data-testid="remind-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Pulsanti Azione */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  data-testid="button-cancel-remind"
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || saveReminderMutation.isPending}
                  data-testid="button-save-remind"
                >
                  {isSubmitting || saveReminderMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Crea Promemoria
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}