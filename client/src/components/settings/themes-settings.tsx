import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette,
  Monitor,
  Sun,
  Moon,
  Eye,
  Download,
  Upload,
  Save,
  RefreshCw,
  Brush,
  Image,
  Type,
  Layout,
  Settings
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ThemeSettings {
  // Color scheme
  colorScheme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
  
  // Branding
  logoUrl: string;
  faviconUrl: string;
  companyName: string;
  companyColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  
  // Typography
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  
  // Layout
  sidebarPosition: 'left' | 'right';
  headerStyle: 'fixed' | 'static';
  compactMode: boolean;
  
  // Custom CSS
  customCss: string;
  
  // Accessibility
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
}

const predefinedThemes = [
  {
    id: 'default',
    name: 'EasyCashFlows Default',
    preview: '#3B82F6',
    colors: {
      primary: '#3B82F6',
      secondary: '#6B7280',
      accent: '#10B981'
    }
  },
  {
    id: 'corporate',
    name: 'Corporate Blue',
    preview: '#1E40AF',
    colors: {
      primary: '#1E40AF',
      secondary: '#374151',
      accent: '#059669'
    }
  },
  {
    id: 'modern',
    name: 'Modern Purple',
    preview: '#7C3AED',
    colors: {
      primary: '#7C3AED',
      secondary: '#6B7280',
      accent: '#EC4899'
    }
  },
  {
    id: 'nature',
    name: 'Nature Green',
    preview: '#059669',
    colors: {
      primary: '#059669',
      secondary: '#374151',
      accent: '#F59E0B'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    preview: '#EA580C',
    colors: {
      primary: '#EA580C',
      secondary: '#6B7280',
      accent: '#DC2626'
    }
  }
];

const fontOptions = [
  { value: 'Inter', label: 'Inter (Default)' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' }
];

export default function ThemesSettings() {
  const [activeTab, setActiveTab] = useState('appearance');
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current theme settings
  const { data: settings, isLoading } = useQuery<ThemeSettings>({
    queryKey: ['/api/themes/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/themes/settings');
      return response.json();
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<ThemeSettings>) => {
      const response = await apiRequest('PUT', '/api/themes/settings', newSettings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '✅ Tema Aggiornato',
        description: 'Le impostazioni del tema sono state salvate'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/themes/settings'] });
      // Apply theme changes immediately
      applyThemeChanges();
    }
  });

  // Apply predefined theme mutation
  const applyThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      const response = await apiRequest('POST', `/api/themes/apply/${themeId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '✅ Tema Applicato',
        description: 'Il nuovo tema è stato applicato con successo'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/themes/settings'] });
      applyThemeChanges();
    }
  });

  // Export theme mutation
  const exportThemeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/themes/export');
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'easycashflows-theme.json';
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: '✅ Tema Esportato',
        description: 'Il file del tema è stato scaricato'
      });
    }
  });

  const handleSettingChange = (key: keyof ThemeSettings, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const applyThemeChanges = () => {
    // Apply theme changes to document root
    if (settings) {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', settings.primaryColor);
      root.style.setProperty('--accent-color', settings.accentColor);
      
      if (settings.colorScheme === 'dark') {
        root.classList.add('dark');
      } else if (settings.colorScheme === 'light') {
        root.classList.remove('dark');
      }
      
      if (settings.fontFamily) {
        root.style.setProperty('--font-family', settings.fontFamily);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon' | 'theme') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Handle file upload logic here
    if (type === 'theme') {
      // Import theme file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const themeData = JSON.parse(e.target?.result as string);
          updateSettingsMutation.mutate(themeData);
        } catch (error) {
          toast({
            title: '❌ Errore Import',
            description: 'File tema non valido',
            variant: 'destructive'
          });
        }
      };
      reader.readAsText(file);
    } else {
      // Handle logo/favicon upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      // Upload file and update settings
      apiRequest('POST', '/api/themes/upload', formData)
        .then(response => response.json())
        .then(data => {
          if (type === 'logo') {
            handleSettingChange('logoUrl', data.url);
          } else {
            handleSettingChange('faviconUrl', data.url);
          }
        });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Caricamento impostazioni tema...</div>;
  }

  return (
    <div className="space-y-6" data-testid="themes-settings">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-purple-600" />
        <h2 className="text-xl font-semibold">Temi e Interfaccia</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="appearance">Aspetto</TabsTrigger>
          <TabsTrigger value="branding">Brand</TabsTrigger>
          <TabsTrigger value="typography">Tipografia</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="custom">Personalizzato</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          {/* Color Scheme */}
          <Card>
            <CardHeader>
              <CardTitle>Schema Colori</CardTitle>
              <CardDescription>
                Configura il tema chiaro/scuro e i colori principali
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="colorScheme">Modalità Tema</Label>
                <Select
                  value={settings?.colorScheme || 'light'}
                  onValueChange={(value) => handleSettingChange('colorScheme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Chiaro
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Scuro
                      </div>
                    </SelectItem>
                    <SelectItem value="auto">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Automatico
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Colore Primario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings?.primaryColor || '#3B82F6'}
                      onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                      className="w-20"
                    />
                    <Input
                      value={settings?.primaryColor || '#3B82F6'}
                      onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accentColor">Colore Accento</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={settings?.accentColor || '#10B981'}
                      onChange={(e) => handleSettingChange('accentColor', e.target.value)}
                      className="w-20"
                    />
                    <Input
                      value={settings?.accentColor || '#10B981'}
                      onChange={(e) => handleSettingChange('accentColor', e.target.value)}
                      placeholder="#10B981"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Predefined Themes */}
          <Card>
            <CardHeader>
              <CardTitle>Temi Predefiniti</CardTitle>
              <CardDescription>
                Seleziona uno dei temi preconfigurati
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {predefinedThemes.map((theme) => (
                  <div
                    key={theme.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedTheme === theme.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedTheme(theme.id)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: theme.preview }}
                      />
                      <span className="font-medium">{theme.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: theme.colors.secondary }}
                      />
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedTheme && (
                <Button
                  className="mt-4 w-full"
                  onClick={() => applyThemeMutation.mutate(selectedTheme)}
                  disabled={applyThemeMutation.isPending}
                >
                  <Brush className="h-4 w-4 mr-2" />
                  Applica Tema Selezionato
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branding Aziendale</CardTitle>
              <CardDescription>
                Personalizza logo, favicon e informazioni aziendali
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName">Nome Azienda</Label>
                <Input
                  id="companyName"
                  value={settings?.companyName || ''}
                  onChange={(e) => handleSettingChange('companyName', e.target.value)}
                  placeholder="EasyCashFlows"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Logo Aziendale</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {settings?.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt="Logo"
                        className="max-h-16 mx-auto mb-2"
                      />
                    ) : (
                      <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Carica Logo
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>

                <div>
                  <Label>Favicon</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {settings?.faviconUrl ? (
                      <img
                        src={settings.faviconUrl}
                        alt="Favicon"
                        className="max-h-8 mx-auto mb-2"
                      />
                    ) : (
                      <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'favicon')}
                      className="hidden"
                      id="favicon-upload"
                    />
                    <Label htmlFor="favicon-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Carica Favicon
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipografia</CardTitle>
              <CardDescription>
                Configura font e dimensioni del testo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select
                  value={settings?.fontFamily || 'Inter'}
                  onValueChange={(value) => handleSettingChange('fontFamily', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fontSize">Dimensione Font</Label>
                <Select
                  value={settings?.fontSize || 'medium'}
                  onValueChange={(value) => handleSettingChange('fontSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Piccolo</SelectItem>
                    <SelectItem value="medium">Medio</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Layout Interfaccia</CardTitle>
              <CardDescription>
                Personalizza il layout e la disposizione degli elementi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sidebarPosition">Posizione Sidebar</Label>
                <Select
                  value={settings?.sidebarPosition || 'left'}
                  onValueChange={(value) => handleSettingChange('sidebarPosition', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Sinistra</SelectItem>
                    <SelectItem value="right">Destra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="headerStyle">Stile Header</Label>
                <Select
                  value={settings?.headerStyle || 'fixed'}
                  onValueChange={(value) => handleSettingChange('headerStyle', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fisso</SelectItem>
                    <SelectItem value="static">Statico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="compactMode"
                    checked={settings?.compactMode || false}
                    onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
                  />
                  <Label htmlFor="compactMode">Modalità Compatta</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="highContrast"
                    checked={settings?.highContrast || false}
                    onCheckedChange={(checked) => handleSettingChange('highContrast', checked)}
                  />
                  <Label htmlFor="highContrast">Alto Contrasto</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="reducedMotion"
                    checked={settings?.reducedMotion || false}
                    onCheckedChange={(checked) => handleSettingChange('reducedMotion', checked)}
                  />
                  <Label htmlFor="reducedMotion">Animazioni Ridotte</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="largeText"
                    checked={settings?.largeText || false}
                    onCheckedChange={(checked) => handleSettingChange('largeText', checked)}
                  />
                  <Label htmlFor="largeText">Testo Ingrandito</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CSS Personalizzato</CardTitle>
              <CardDescription>
                Aggiungi stili CSS personalizzati per modifiche avanzate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customCss">CSS Personalizzato</Label>
                <textarea
                  id="customCss"
                  className="w-full h-48 p-3 border rounded-md font-mono text-sm"
                  value={settings?.customCss || ''}
                  onChange={(e) => handleSettingChange('customCss', e.target.value)}
                  placeholder="/* Inserisci qui il tuo CSS personalizzato */
.custom-header {
  background: linear-gradient(45deg, #3B82F6, #10B981);
}

.custom-button {
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => updateSettingsMutation.mutate({ customCss: settings?.customCss })}
                  disabled={updateSettingsMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Applica CSS
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleSettingChange('customCss', '')}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset CSS
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Import/Export */}
          <Card>
            <CardHeader>
              <CardTitle>Import/Export Tema</CardTitle>
              <CardDescription>
                Salva o carica configurazioni tema personalizzate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => exportThemeMutation.mutate()}
                  disabled={exportThemeMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Esporta Tema
                </Button>
                
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileUpload(e, 'theme')}
                  className="hidden"
                  id="theme-upload"
                />
                <Label htmlFor="theme-upload" className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Importa Tema
                    </span>
                  </Button>
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}