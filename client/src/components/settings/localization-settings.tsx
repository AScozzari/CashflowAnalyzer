import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Languages,
  Calendar,
  DollarSign,
  Clock,
  MapPin,
  Palette,
  Globe,
  Save,
  RefreshCw,
  CheckCircle,
  Settings,
  Eye
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface LocalizationSettings {
  // Language settings
  defaultLanguage: string;
  availableLanguages: string[];
  autoDetectLanguage: boolean;
  
  // Regional settings
  country: string;
  region: string;
  timezone: string;
  
  // Format settings
  dateFormat: string;
  timeFormat: '12h' | '24h';
  numberFormat: 'comma' | 'dot' | 'space';
  currency: string;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  
  // Business settings
  fiscalYearStart: string; // MM-DD format
  weekStart: 'sunday' | 'monday';
  workingDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
  
  // UI preferences
  rtlLayout: boolean;
  compactNumbers: boolean;
  localizedIcons: boolean;
}

const supportedLanguages = [
  { code: 'it', name: 'Italiano', flag: '🇮🇹', native: 'Italiano' },
  { code: 'en', name: 'English', flag: '🇺🇸', native: 'English' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', native: 'Français' },
  { code: 'es', name: 'Español', flag: '🇪🇸', native: 'Español' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', native: 'Deutsch' },
  { code: 'pt', name: 'Português', flag: '🇵🇹', native: 'Português' }
];

const supportedCurrencies = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' }
];

const timezones = [
  { value: 'Europe/Rome', label: 'Europe/Rome (CET/CEST)', offset: '+01:00' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)', offset: '-05:00' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)', offset: '-08:00' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)', offset: '+09:00' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)', offset: '+01:00' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)', offset: '+01:00' }
];

const dateFormats = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)', example: '31/12/2024' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)', example: '12/31/2024' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)', example: '2024-12-31' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (31-12-2024)', example: '31-12-2024' },
  { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD (2024/12/31)', example: '2024/12/31' }
];

export function LocalizationSettings() {
  const [activeTab, setActiveTab] = useState('language');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current localization settings
  const { data: settings, isLoading } = useQuery<LocalizationSettings>({
    queryKey: ['/api/localization/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/localization/settings');
      return response.json();
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<LocalizationSettings>) => {
      const response = await apiRequest('PUT', '/api/localization/settings', newSettings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '✅ Impostazioni Salvate',
        description: 'Le impostazioni di localizzazione sono state aggiornate'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/localization/settings'] });
    }
  });

  // Apply language mutation
  const applyLanguageMutation = useMutation({
    mutationFn: async (languageCode: string) => {
      const response = await apiRequest('POST', '/api/localization/apply-language', { language: languageCode });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '✅ Lingua Applicata',
        description: 'La nuova lingua è stata applicata. Ricarica la pagina per vedere i cambiamenti.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/localization/settings'] });
    }
  });

  const handleSettingChange = (key: keyof LocalizationSettings, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const formatPreview = (format: string) => {
    const now = new Date('2024-12-31');
    switch (format) {
      case 'DD/MM/YYYY': return now.toLocaleDateString('it-IT');
      case 'MM/DD/YYYY': return now.toLocaleDateString('en-US');
      case 'YYYY-MM-DD': return now.toISOString().split('T')[0];
      case 'DD-MM-YYYY': return now.toLocaleDateString('it-IT').replace(/\//g, '-');
      case 'YYYY/MM/DD': return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
      default: return format;
    }
  };

  const getWorkingDaysText = (days: string[]) => {
    const dayNames = {
      'monday': 'Lun',
      'tuesday': 'Mar', 
      'wednesday': 'Mer',
      'thursday': 'Gio',
      'friday': 'Ven',
      'saturday': 'Sab',
      'sunday': 'Dom'
    };
    return days.map(day => dayNames[day as keyof typeof dayNames]).join(', ');
  };

  if (isLoading) {
    return <div className="text-center py-8">Caricamento impostazioni localizzazione...</div>;
  }

  return (
    <div className="space-y-6" data-testid="localization-settings">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-purple-600" />
        <h2 className="text-xl font-semibold">Localizzazione</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="language">Lingua</TabsTrigger>
          <TabsTrigger value="regional">Regionale</TabsTrigger>
          <TabsTrigger value="formats">Formati</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
        </TabsList>

        <TabsContent value="language" className="space-y-4">
          {/* Current Language */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Lingua Interfaccia
              </CardTitle>
              <CardDescription>
                Configura la lingua principale dell'applicazione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="defaultLanguage">Lingua Predefinita</Label>
                <Select
                  value={settings?.defaultLanguage || 'it'}
                  onValueChange={(value) => handleSettingChange('defaultLanguage', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                          <span className="text-muted-foreground">({lang.native})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="autoDetectLanguage"
                  checked={settings?.autoDetectLanguage || false}
                  onCheckedChange={(checked) => handleSettingChange('autoDetectLanguage', checked)}
                />
                <Label htmlFor="autoDetectLanguage">Rileva Automaticamente Lingua Browser</Label>
              </div>

              <Button
                onClick={() => applyLanguageMutation.mutate(settings?.defaultLanguage || 'it')}
                disabled={applyLanguageMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Applica Lingua Selezionata
              </Button>
            </CardContent>
          </Card>

          {/* Available Languages */}
          <Card>
            <CardHeader>
              <CardTitle>Lingue Disponibili</CardTitle>
              <CardDescription>
                Seleziona le lingue che gli utenti possono scegliere
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {supportedLanguages.map((lang) => (
                  <div key={lang.code} className="flex items-center space-x-2">
                    <Switch
                      id={`lang-${lang.code}`}
                      checked={settings?.availableLanguages?.includes(lang.code) || lang.code === 'it'}
                      onCheckedChange={(checked) => {
                        const current = settings?.availableLanguages || ['it'];
                        const updated = checked 
                          ? [...current, lang.code]
                          : current.filter(l => l !== lang.code);
                        handleSettingChange('availableLanguages', updated);
                      }}
                    />
                    <Label htmlFor={`lang-${lang.code}`} className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      {lang.name}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-4">
          {/* Country and Region */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Paese e Regione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Paese</Label>
                  <Select
                    value={settings?.country || 'IT'}
                    onValueChange={(value) => handleSettingChange('country', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT">🇮🇹 Italia</SelectItem>
                      <SelectItem value="US">🇺🇸 Stati Uniti</SelectItem>
                      <SelectItem value="GB">🇬🇧 Regno Unito</SelectItem>
                      <SelectItem value="FR">🇫🇷 Francia</SelectItem>
                      <SelectItem value="DE">🇩🇪 Germania</SelectItem>
                      <SelectItem value="ES">🇪🇸 Spagna</SelectItem>
                      <SelectItem value="CH">🇨🇭 Svizzera</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="region">Regione</Label>
                  <Input
                    id="region"
                    value={settings?.region || ''}
                    onChange={(e) => handleSettingChange('region', e.target.value)}
                    placeholder="es. Lombardia"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timezone */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Fuso Orario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings?.timezone || 'Europe/Rome'}
                  onValueChange={(value) => handleSettingChange('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        <div className="flex justify-between w-full">
                          <span>{tz.label}</span>
                          <span className="text-muted-foreground ml-2">{tz.offset}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Ora Corrente:</strong> {new Date().toLocaleString('it-IT', { 
                    timeZone: settings?.timezone || 'Europe/Rome',
                    dateStyle: 'full',
                    timeStyle: 'long'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formats" className="space-y-4">
          {/* Date and Time Formats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Formati Data e Ora
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="dateFormat">Formato Data</Label>
                <Select
                  value={settings?.dateFormat || 'DD/MM/YYYY'}
                  onValueChange={(value) => handleSettingChange('dateFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        <div className="flex justify-between w-full">
                          <span>{format.label}</span>
                          <span className="text-muted-foreground ml-4">{format.example}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeFormat">Formato Ora</Label>
                <Select
                  value={settings?.timeFormat || '24h'}
                  onValueChange={(value) => handleSettingChange('timeFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24 ore (15:30)</SelectItem>
                    <SelectItem value="12h">12 ore (3:30 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="numberFormat">Formato Numeri</Label>
                <Select
                  value={settings?.numberFormat || 'comma'}
                  onValueChange={(value) => handleSettingChange('numberFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comma">Virgola (1.234,56)</SelectItem>
                    <SelectItem value="dot">Punto (1,234.56)</SelectItem>
                    <SelectItem value="space">Spazio (1 234,56)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Currency Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Impostazioni Valuta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currency">Valuta Predefinita</Label>
                <Select
                  value={settings?.currency || 'EUR'}
                  onValueChange={(value) => {
                    const selectedCurrency = supportedCurrencies.find(c => c.code === value);
                    handleSettingChange('currency', value);
                    handleSettingChange('currencySymbol', selectedCurrency?.symbol || '€');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedCurrencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <span>{currency.symbol}</span>
                          <span>{currency.code}</span>
                          <span className="text-muted-foreground">- {currency.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="currencyPosition">Posizione Simbolo</Label>
                <Select
                  value={settings?.currencyPosition || 'after'}
                  onValueChange={(value) => handleSettingChange('currencyPosition', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">Prima del numero (€1.234,56)</SelectItem>
                    <SelectItem value="after">Dopo il numero (1.234,56 €)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Anteprima:</strong> {
                    settings?.currencyPosition === 'before' 
                      ? `${settings?.currencySymbol || '€'}1.234,56`
                      : `1.234,56 ${settings?.currencySymbol || '€'}`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          {/* Business Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Calendario Business</CardTitle>
              <CardDescription>
                Configura il calendario fiscale e lavorativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fiscalYearStart">Inizio Anno Fiscale</Label>
                  <Input
                    id="fiscalYearStart"
                    type="date"
                    value={settings?.fiscalYearStart || '01-01'}
                    onChange={(e) => handleSettingChange('fiscalYearStart', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="weekStart">Inizio Settimana</Label>
                  <Select
                    value={settings?.weekStart || 'monday'}
                    onValueChange={(value) => handleSettingChange('weekStart', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monday">Lunedì</SelectItem>
                      <SelectItem value="sunday">Domenica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Giorni Lavorativi</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                    const dayNames = {
                      monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer', thursday: 'Gio',
                      friday: 'Ven', saturday: 'Sab', sunday: 'Dom'
                    };
                    
                    return (
                      <div key={day} className="flex items-center space-x-2">
                        <Switch
                          id={`day-${day}`}
                          checked={settings?.workingDays?.includes(day) || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day)}
                          onCheckedChange={(checked) => {
                            const current = settings?.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
                            const updated = checked 
                              ? [...current, day]
                              : current.filter(d => d !== day);
                            handleSettingChange('workingDays', updated);
                          }}
                        />
                        <Label htmlFor={`day-${day}`} className="text-sm">
                          {dayNames[day as keyof typeof dayNames]}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workingHoursStart">Inizio Orario Lavorativo</Label>
                  <Input
                    id="workingHoursStart"
                    type="time"
                    value={settings?.workingHours?.start || '09:00'}
                    onChange={(e) => handleSettingChange('workingHours', {
                      ...settings?.workingHours,
                      start: e.target.value
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="workingHoursEnd">Fine Orario Lavorativo</Label>
                  <Input
                    id="workingHoursEnd"
                    type="time"
                    value={settings?.workingHours?.end || '18:00'}
                    onChange={(e) => handleSettingChange('workingHours', {
                      ...settings?.workingHours,
                      end: e.target.value
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* UI Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Preferenze Interfaccia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="rtlLayout"
                    checked={settings?.rtlLayout || false}
                    onCheckedChange={(checked) => handleSettingChange('rtlLayout', checked)}
                  />
                  <Label htmlFor="rtlLayout">Layout da Destra a Sinistra (RTL)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="compactNumbers"
                    checked={settings?.compactNumbers || false}
                    onCheckedChange={(checked) => handleSettingChange('compactNumbers', checked)}
                  />
                  <Label htmlFor="compactNumbers">Numeri Compatti (1K, 1M, 1B)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="localizedIcons"
                    checked={settings?.localizedIcons || false}
                    onCheckedChange={(checked) => handleSettingChange('localizedIcons', checked)}
                  />
                  <Label htmlFor="localizedIcons">Icone Localizzate</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Anteprima Impostazioni</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Lingua:</strong> {supportedLanguages.find(l => l.code === settings?.defaultLanguage)?.name || 'Italiano'}</p>
                <p><strong>Paese:</strong> {settings?.country || 'IT'}</p>
                <p><strong>Fuso Orario:</strong> {settings?.timezone || 'Europe/Rome'}</p>
                <p><strong>Formato Data:</strong> {formatPreview(settings?.dateFormat || 'DD/MM/YYYY')}</p>
                <p><strong>Valuta:</strong> {settings?.currency || 'EUR'} ({settings?.currencySymbol || '€'})</p>
                <p><strong>Anno Fiscale:</strong> Inizia il {settings?.fiscalYearStart || '01-01'}</p>
                <p><strong>Giorni Lavorativi:</strong> {getWorkingDaysText(settings?.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])}</p>
                <p><strong>Orario Lavorativo:</strong> {settings?.workingHours?.start || '09:00'} - {settings?.workingHours?.end || '18:00'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}