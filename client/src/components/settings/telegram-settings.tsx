import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Bot,
  Shield,
  Clock,
  Brain,
  Settings,
  TestTube,
  MessageSquare,
  Webhook,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from "lucide-react";

interface TelegramSettings {
  id?: string;
  botToken: string;
  botUsername: string;
  webhookUrl: string;
  webhookSecret: string;
  allowedUpdates: string[];
  botDescription?: string;
  botShortDescription?: string;
  allowedChatTypes: string[];
  adminChatIds: string[];
  maxMessageLength: number;
  rateLimitPerMinute: number;
  enableBusinessHours: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  businessDays: string[];
  autoReplyOutsideHours: boolean;
  outOfHoursMessage?: string;
  enableAutoReply: boolean;
  enableAiResponses: boolean;
  aiModel: string;
  aiSystemPrompt?: string;
  isActive: boolean;
  lastTested?: string;
  lastMessageSent?: string;
}

interface TestResult {
  success: boolean;
  message: string;
  botInfo?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
  };
}

export default function TelegramSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch current settings
  const { data: settings, isLoading } = useQuery<TelegramSettings[]>({
    queryKey: ['/api/telegram/settings'],
    refetchOnWindowFocus: false
  });

  // Test connection mutation
  const testConnection = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/telegram/test', { method: 'POST' });
      if (!response.ok) throw new Error('Test failed');
      return response.json() as Promise<TestResult>;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "✅ Connessione riuscita",
          description: `Bot ${data.botInfo?.first_name} (@${data.botInfo?.username}) attivo`,
        });
      } else {
        toast({
          title: "❌ Test fallito",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "❌ Errore test",
        description: "Impossibile testare la connessione Telegram",
        variant: "destructive",
      });
    }
  });

  // Save settings mutation
  const saveSettings = useMutation({
    mutationFn: async (data: Partial<TelegramSettings>) => {
      const response = await fetch('/api/telegram/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Save failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Impostazioni salvate",
        description: "La configurazione Telegram è stata aggiornata",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/settings'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore salvataggio",
        description: error.message || "Impossibile salvare le impostazioni",
        variant: "destructive",
      });
    }
  });

  const currentSettings = settings?.[0] || {
    botToken: '',
    botUsername: '',
    webhookUrl: '',
    webhookSecret: '',
    allowedUpdates: ['message', 'callback_query'],
    allowedChatTypes: ['private', 'group'],
    adminChatIds: [],
    maxMessageLength: 4096,
    rateLimitPerMinute: 30,
    enableBusinessHours: false,
    businessHoursStart: '09:00',
    businessHoursEnd: '18:00',
    businessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    autoReplyOutsideHours: true,
    enableAutoReply: false,
    enableAiResponses: false,
    aiModel: 'gpt-4o',
    isActive: false
  };

  const reeplitUrl = window.location.origin;
  const defaultWebhookUrl = `${reeplitUrl}/api/telegram/webhook`;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: Partial<TelegramSettings> = {
      botToken: formData.get('botToken') as string,
      botUsername: formData.get('botUsername') as string,
      webhookUrl: formData.get('webhookUrl') as string || defaultWebhookUrl,
      webhookSecret: formData.get('webhookSecret') as string,
      allowedUpdates: Array.from(formData.getAll('allowedUpdates') as string[]),
      botDescription: formData.get('botDescription') as string,
      maxMessageLength: parseInt(formData.get('maxMessageLength') as string) || 4096,
      rateLimitPerMinute: parseInt(formData.get('rateLimitPerMinute') as string) || 30,
      enableBusinessHours: formData.get('enableBusinessHours') === 'on',
      businessHoursStart: formData.get('businessHoursStart') as string || '09:00',
      businessHoursEnd: formData.get('businessHoursEnd') as string || '18:00',
      businessDays: Array.from(formData.getAll('businessDays') as string[]) || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      autoReplyOutsideHours: formData.get('autoReplyOutsideHours') === 'on',
      enableAutoReply: formData.get('enableAutoReply') === 'on',
      enableAiResponses: formData.get('enableAiResponses') === 'on',
      aiModel: (formData.get('aiModel') as string) || 'gpt-4o',
      aiSystemPrompt: formData.get('aiSystemPrompt') as string,
      isActive: formData.get('isActive') === 'on'
    };

    saveSettings.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-40 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-blue-500" />
            Telegram Bot
          </h1>
          <p className="text-muted-foreground">
            Configura il bot Telegram per ricevere e inviare messaggi automaticamente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={currentSettings.isActive ? "default" : "secondary"}>
            {currentSettings.isActive ? "Attivo" : "Inattivo"}
          </Badge>
          <Button 
            variant="outline" 
            onClick={() => testConnection.mutate()}
            disabled={testConnection.isPending || !currentSettings.botToken}
          >
            <TestTube className="h-4 w-4 mr-2" />
            {testConnection.isPending ? "Test..." : "Test Connessione"}
          </Button>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Prima configurazione:</strong> Consulta la 
          <Button variant="link" className="p-0 h-auto" asChild>
            <a href="/TELEGRAM_SETUP_GUIDE.md" target="_blank">
              guida di configurazione <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button> 
          per creare il bot Telegram.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Base
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Sicurezza
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Orari
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Configurazione Bot
                </CardTitle>
                <CardDescription>
                  Configura le credenziali del bot e il webhook
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="botToken">Token Bot *</Label>
                    <Input
                      id="botToken"
                      name="botToken"
                      type="password"
                      defaultValue={currentSettings.botToken}
                      placeholder="123456789:AABBccDDeeFF..."
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Token fornito da @BotFather
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="botUsername">Username Bot *</Label>
                    <Input
                      id="botUsername"
                      name="botUsername"
                      defaultValue={currentSettings.botUsername}
                      placeholder="@nome_bot"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">URL Webhook</Label>
                  <Input
                    id="webhookUrl"
                    name="webhookUrl"
                    defaultValue={currentSettings.webhookUrl || defaultWebhookUrl}
                    placeholder={defaultWebhookUrl}
                  />
                  <p className="text-xs text-muted-foreground">
                    URL dove Telegram invierà i messaggi (auto-generato)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookSecret">Webhook Secret</Label>
                  <Input
                    id="webhookSecret"
                    name="webhookSecret"
                    type="password"
                    defaultValue={currentSettings.webhookSecret}
                    placeholder="Password sicura per validare i webhook"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="botDescription">Descrizione Bot</Label>
                  <Textarea
                    id="botDescription"
                    name="botDescription"
                    defaultValue={currentSettings.botDescription}
                    placeholder="Descrizione del bot che vedranno gli utenti"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    name="isActive"
                    defaultChecked={currentSettings.isActive}
                  />
                  <Label htmlFor="isActive">Bot attivo</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sicurezza e Limiti
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxMessageLength">Lunghezza Massima Messaggio</Label>
                    <Input
                      id="maxMessageLength"
                      name="maxMessageLength"
                      type="number"
                      defaultValue={currentSettings.maxMessageLength}
                      min={1}
                      max={4096}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rateLimitPerMinute">Limite Messaggi/Minuto</Label>
                    <Input
                      id="rateLimitPerMinute"
                      name="rateLimitPerMinute"
                      type="number"
                      defaultValue={currentSettings.rateLimitPerMinute}
                      min={1}
                      max={300}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Tipi di Aggiornamento Consentiti</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['message', 'edited_message', 'callback_query', 'inline_query'].map((type) => (
                      <label key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="allowedUpdates"
                          value={type}
                          defaultChecked={currentSettings.allowedUpdates?.includes(type)}
                        />
                        <span className="text-sm">{type.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Orari di Servizio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableBusinessHours"
                    name="enableBusinessHours"
                    defaultChecked={currentSettings.enableBusinessHours}
                  />
                  <Label htmlFor="enableBusinessHours">Abilita orari di servizio</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessHoursStart">Inizio</Label>
                    <Input
                      id="businessHoursStart"
                      name="businessHoursStart"
                      type="time"
                      defaultValue={currentSettings.businessHoursStart}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessHoursEnd">Fine</Label>
                    <Input
                      id="businessHoursEnd"
                      name="businessHoursEnd"
                      type="time"
                      defaultValue={currentSettings.businessHoursEnd}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Giorni di Servizio</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 'monday', label: 'Lun' },
                      { value: 'tuesday', label: 'Mar' },
                      { value: 'wednesday', label: 'Mer' },
                      { value: 'thursday', label: 'Gio' },
                      { value: 'friday', label: 'Ven' },
                      { value: 'saturday', label: 'Sab' },
                      { value: 'sunday', label: 'Dom' }
                    ].map((day) => (
                      <label key={day.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="businessDays"
                          value={day.value}
                          defaultChecked={currentSettings.businessDays?.includes(day.value)}
                        />
                        <span className="text-sm">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoReplyOutsideHours"
                    name="autoReplyOutsideHours"
                    defaultChecked={currentSettings.autoReplyOutsideHours}
                  />
                  <Label htmlFor="autoReplyOutsideHours">Risposta automatica fuori orario</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Intelligenza Artificiale
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableAutoReply"
                    name="enableAutoReply"
                    defaultChecked={currentSettings.enableAutoReply}
                  />
                  <Label htmlFor="enableAutoReply">Abilita risposte automatiche</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableAiResponses"
                    name="enableAiResponses"
                    defaultChecked={currentSettings.enableAiResponses}
                  />
                  <Label htmlFor="enableAiResponses">Abilita AI per le risposte</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aiModel">Modello AI</Label>
                  <Select name="aiModel" defaultValue={currentSettings.aiModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona modello AI" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4 Omni (Consigliato)</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aiSystemPrompt">Prompt di Sistema AI</Label>
                  <Textarea
                    id="aiSystemPrompt"
                    name="aiSystemPrompt"
                    defaultValue={currentSettings.aiSystemPrompt || "Sei l'assistente virtuale di EasyCashFlows, un sistema di gestione finanziaria per PMI italiane. Rispondi sempre in italiano, sii professionale ma cordiale."}
                    placeholder="Istruzioni per l'AI su come comportarsi..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              {currentSettings.lastTested && (
                <span>Ultimo test: {new Date(currentSettings.lastTested).toLocaleString('it-IT')}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditing(!isEditing)}>
                Annulla
              </Button>
              <Button type="submit" disabled={saveSettings.isPending}>
                {saveSettings.isPending ? "Salvataggio..." : "Salva Configurazione"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}