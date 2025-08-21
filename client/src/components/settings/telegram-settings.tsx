import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Send as TelegramIcon,
  Bot,
  Settings,
  Clock,
  Shield,
  Zap,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  Webhook,
  MessageSquare,
  Users,
  Globe
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TelegramSettings {
  id?: string;
  botToken: string;
  botUsername: string;
  webhookUrl?: string;
  webhookSecret?: string;
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

export function TelegramSettings() {
  const [formData, setFormData] = useState<TelegramSettings>({
    botToken: '',
    botUsername: '',
    webhookUrl: '',
    webhookSecret: '',
    allowedUpdates: ['message', 'callback_query'],
    botDescription: '',
    botShortDescription: '',
    allowedChatTypes: ['private', 'group'],
    adminChatIds: [],
    maxMessageLength: 4096,
    rateLimitPerMinute: 30,
    enableBusinessHours: false,
    businessHoursStart: '09:00',
    businessHoursEnd: '18:00',
    businessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    autoReplyOutsideHours: true,
    outOfHoursMessage: '',
    enableAutoReply: false,
    enableAiResponses: false,
    aiModel: 'gpt-4o',
    aiSystemPrompt: '',
    isActive: false
  });

  const [testResult, setTestResult] = useState<{ success: boolean; botInfo?: any; error?: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query per ottenere le impostazioni esistenti
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/telegram/settings'],
    enabled: true
  });

  // Mutation per salvare le impostazioni
  const saveMutation = useMutation({
    mutationFn: (data: TelegramSettings) => 
      apiRequest('/api/telegram/settings', { method: 'POST', body: data }),
    onSuccess: () => {
      toast({ title: "Impostazioni Telegram salvate con successo!" });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/settings'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore nel salvataggio", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation per testare la connessione
  const testMutation = useMutation({
    mutationFn: () => apiRequest('/api/telegram/test', { method: 'POST' }),
    onSuccess: (result) => {
      setTestResult(result);
      if (result.success) {
        toast({ title: "Test connessione Telegram riuscito!" });
      } else {
        toast({ 
          title: "Test fallito", 
          description: result.error,
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      setTestResult({ success: false, error: error.message });
      toast({ 
        title: "Errore nel test", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleTest = () => {
    testMutation.mutate();
  };

  const updateField = (field: keyof TelegramSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addAdminChatId = (chatId: string) => {
    if (chatId && !formData.adminChatIds.includes(chatId)) {
      updateField('adminChatIds', [...formData.adminChatIds, chatId]);
    }
  };

  const removeAdminChatId = (chatId: string) => {
    updateField('adminChatIds', formData.adminChatIds.filter(id => id !== chatId));
  };

  const dayLabels: Record<string, string> = {
    monday: 'Lunedì',
    tuesday: 'Martedì', 
    wednesday: 'Mercoledì',
    thursday: 'Giovedì',
    friday: 'Venerdì',
    saturday: 'Sabato',
    sunday: 'Domenica'
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <TelegramIcon className="h-4 w-4 animate-spin" />
            <span>Caricamento impostazioni Telegram...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con stato */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TelegramIcon className="h-5 w-5 text-blue-500" />
              <CardTitle>Configurazione Telegram Bot</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              {formData.isActive ? (
                <Badge variant="default" className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Attivo
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" />
                  Inattivo
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configurazione Bot */}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="botToken">Bot Token *</Label>
                <Input
                  id="botToken"
                  type="password"
                  value={formData.botToken}
                  onChange={(e) => updateField('botToken', e.target.value)}
                  placeholder="1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ"
                  data-testid="input-telegram-bot-token"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ottienilo da @BotFather su Telegram
                </p>
              </div>
              <div>
                <Label htmlFor="botUsername">Bot Username *</Label>
                <Input
                  id="botUsername"
                  value={formData.botUsername}
                  onChange={(e) => updateField('botUsername', e.target.value)}
                  placeholder="@your_bot_username"
                  data-testid="input-telegram-bot-username"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="botDescription">Descrizione Bot</Label>
                <Textarea
                  id="botDescription"
                  value={formData.botDescription || ''}
                  onChange={(e) => updateField('botDescription', e.target.value)}
                  placeholder="Descrizione completa del bot..."
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <Label htmlFor="botShortDescription">Descrizione Breve</Label>
                <Textarea
                  id="botShortDescription"
                  value={formData.botShortDescription || ''}
                  onChange={(e) => updateField('botShortDescription', e.target.value)}
                  placeholder="Descrizione breve..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Webhook Configuration */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Webhook className="h-4 w-4" />
              <Label className="text-sm font-medium">Configurazione Webhook</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="webhookUrl">URL Webhook</Label>
                <Input
                  id="webhookUrl"
                  value={formData.webhookUrl || ''}
                  onChange={(e) => updateField('webhookUrl', e.target.value)}
                  placeholder="https://yourdomain.com/webhook/telegram"
                />
              </div>
              <div>
                <Label htmlFor="webhookSecret">Secret Token</Label>
                <Input
                  id="webhookSecret"
                  type="password"
                  value={formData.webhookSecret || ''}
                  onChange={(e) => updateField('webhookSecret', e.target.value)}
                  placeholder="Token segreto per validazione"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Security & Permissions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <Label className="text-sm font-medium">Sicurezza e Permessi</Label>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Tipi Chat Consentiti</Label>
                <div className="mt-2 space-y-2">
                  {['private', 'group', 'supergroup', 'channel'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`chatType-${type}`}
                        checked={formData.allowedChatTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateField('allowedChatTypes', [...formData.allowedChatTypes, type]);
                          } else {
                            updateField('allowedChatTypes', formData.allowedChatTypes.filter(t => t !== type));
                          }
                        }}
                      />
                      <Label htmlFor={`chatType-${type}`} className="text-sm capitalize">
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="maxMessageLength">Lunghezza Max Messaggio</Label>
                <Input
                  id="maxMessageLength"
                  type="number"
                  value={formData.maxMessageLength}
                  onChange={(e) => updateField('maxMessageLength', parseInt(e.target.value))}
                  min="1"
                  max="4096"
                />
              </div>

              <div>
                <Label htmlFor="rateLimitPerMinute">Rate Limit (msg/min)</Label>
                <Input
                  id="rateLimitPerMinute"
                  type="number"
                  value={formData.rateLimitPerMinute}
                  onChange={(e) => updateField('rateLimitPerMinute', parseInt(e.target.value))}
                  min="1"
                  max="300"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Business Hours */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <Label className="text-sm font-medium">Orari di Lavoro</Label>
              </div>
              <Switch
                checked={formData.enableBusinessHours}
                onCheckedChange={(checked) => updateField('enableBusinessHours', checked)}
              />
            </div>

            {formData.enableBusinessHours && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessHoursStart">Orario Inizio</Label>
                    <Input
                      id="businessHoursStart"
                      type="time"
                      value={formData.businessHoursStart}
                      onChange={(e) => updateField('businessHoursStart', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessHoursEnd">Orario Fine</Label>
                    <Input
                      id="businessHoursEnd"
                      type="time"
                      value={formData.businessHoursEnd}
                      onChange={(e) => updateField('businessHoursEnd', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Giorni Lavorativi</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(dayLabels).map(([day, label]) => (
                      <div key={day} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`day-${day}`}
                          checked={formData.businessDays.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateField('businessDays', [...formData.businessDays, day]);
                            } else {
                              updateField('businessDays', formData.businessDays.filter(d => d !== day));
                            }
                          }}
                        />
                        <Label htmlFor={`day-${day}`} className="text-sm">{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.autoReplyOutsideHours}
                      onCheckedChange={(checked) => updateField('autoReplyOutsideHours', checked)}
                    />
                    <Label className="text-sm">Risposta automatica fuori orario</Label>
                  </div>

                  {formData.autoReplyOutsideHours && (
                    <div>
                      <Label htmlFor="outOfHoursMessage">Messaggio Fuori Orario</Label>
                      <Textarea
                        id="outOfHoursMessage"
                        value={formData.outOfHoursMessage || ''}
                        onChange={(e) => updateField('outOfHoursMessage', e.target.value)}
                        placeholder="Messaggio personalizzato per orari non lavorativi..."
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Auto-Reply & AI */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <Label className="text-sm font-medium">Automazione e AI</Label>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.enableAutoReply}
                  onCheckedChange={(checked) => updateField('enableAutoReply', checked)}
                />
                <Label className="text-sm">Abilita risposte automatiche</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.enableAiResponses}
                  onCheckedChange={(checked) => updateField('enableAiResponses', checked)}
                />
                <Label className="text-sm">Abilita risposte AI</Label>
              </div>

              {formData.enableAiResponses && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label htmlFor="aiModel">Modello AI</Label>
                    <Select value={formData.aiModel} onValueChange={(value) => updateField('aiModel', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (Raccomandato)</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="aiSystemPrompt">Prompt Sistema AI</Label>
                    <Textarea
                      id="aiSystemPrompt"
                      value={formData.aiSystemPrompt || ''}
                      onChange={(e) => updateField('aiSystemPrompt', e.target.value)}
                      placeholder="Istruzioni per l'AI su come comportarsi nelle risposte..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Test Results */}
          {testResult && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TestTube className="h-4 w-4" />
                <Label className="text-sm font-medium">Risultato Test</Label>
              </div>
              
              <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center space-x-2">
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {testResult.success ? 'Connessione riuscita' : 'Connessione fallita'}
                  </span>
                </div>
                
                {testResult.success && testResult.botInfo && (
                  <div className="mt-2 text-xs space-y-1">
                    <p><strong>Bot:</strong> @{testResult.botInfo.username}</p>
                    <p><strong>Nome:</strong> {testResult.botInfo.first_name}</p>
                    <p><strong>ID:</strong> {testResult.botInfo.id}</p>
                  </div>
                )}
                
                {!testResult.success && testResult.error && (
                  <p className="mt-2 text-xs text-red-600">{testResult.error}</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => updateField('isActive', checked)}
              />
              <Label className="text-sm font-medium">
                Attiva Telegram Bot
              </Label>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={testMutation.isPending || !formData.botToken}
                data-testid="button-test-telegram"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testMutation.isPending ? 'Test in corso...' : 'Test Connessione'}
              </Button>

              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                data-testid="button-save-telegram"
              >
                {saveMutation.isPending ? 'Salvataggio...' : 'Salva Configurazione'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}