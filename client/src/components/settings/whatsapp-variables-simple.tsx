import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, Settings, TestTube, Copy, ArrowRight, 
  CheckCircle, AlertCircle, Lightbulb 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Variabili disponibili organizzate in modo semplice
const AVAILABLE_VARIABLES = [
  // Cliente
  { key: 'customer.name', label: 'Nome Cliente', example: 'Mario Rossi' },
  { key: 'customer.email', label: 'Email Cliente', example: 'mario@email.it' },
  { key: 'customer.phone', label: 'Telefono Cliente', example: '+39 333 1234567' },
  
  // Azienda
  { key: 'company.name', label: 'Nome Azienda', example: 'La Mia Azienda S.r.l.' },
  { key: 'company.email', label: 'Email Azienda', example: 'info@azienda.it' },
  { key: 'company.phone', label: 'Telefono Azienda', example: '+39 02 1234567' },
  
  // Movimento finanziario
  { key: 'movement.amount', label: 'Importo', example: '€1.250,00' },
  { key: 'movement.description', label: 'Descrizione', example: 'Fattura servizi' },
  { key: 'movement.date', label: 'Data', example: '15/03/2024' },
  
  // Sistema
  { key: 'system.date', label: 'Data Oggi', example: new Date().toLocaleDateString('it-IT') },
  { key: 'system.year', label: 'Anno', example: new Date().getFullYear().toString() }
];

interface Mapping {
  old: string;
  new: string;
  label: string;
}

export function WhatsAppVariablesSimple() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('variables');
  const [templateText, setTemplateText] = useState('');
  const [previewResult, setPreviewResult] = useState('');
  
  // Mapping semplificato
  const [mappings, setMappings] = useState<Mapping[]>([
    { old: '{1}', new: 'customer.name', label: 'Nome Cliente' },
    { old: '{2}', new: 'movement.amount', label: 'Importo' },
    { old: '{3}', new: 'movement.date', label: 'Data' }
  ]);

  // Funzione per aggiornare mapping
  const updateMapping = (index: number, newVariable: string) => {
    const variable = AVAILABLE_VARIABLES.find(v => v.key === newVariable);
    if (variable) {
      const newMappings = [...mappings];
      newMappings[index] = {
        ...newMappings[index],
        new: newVariable,
        label: variable.label
      };
      setMappings(newMappings);
      
      toast({
        title: "Mapping aggiornato",
        description: `${newMappings[index].old} → ${variable.label}`
      });
    }
  };

  // Funzione per generare anteprima
  const generatePreview = () => {
    if (!templateText.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci del testo nel template",
        variant: "destructive"
      });
      return;
    }

    let result = templateText;
    
    // Sostituisci tutte le variabili con esempi
    AVAILABLE_VARIABLES.forEach(variable => {
      const regex = new RegExp(`\\{${variable.key.replace('.', '\\.')}\\}`, 'g');
      result = result.replace(regex, variable.example);
    });

    setPreviewResult(result);
    toast({
      title: "Anteprima generata",
      description: "Template convertito con dati di esempio"
    });
  };

  // Template di esempio
  const setExampleTemplate = (type: string) => {
    const templates = {
      invoice: `Ciao {customer.name},

La tua fattura di {movement.amount} è pronta.

Dettagli:
- Data: {movement.date}
- Descrizione: {movement.description}

{company.name}
{company.email}`,

      reminder: `Gentile {customer.name},

Ti ricordiamo il pagamento di {movement.amount} in scadenza.

Per informazioni: {company.phone}

{company.name}`,

      welcome: `Benvenuto {customer.name}!

Siamo {company.name}.
Contatti: {company.email}

Data: {system.date}`
    };

    setTemplateText(templates[type as keyof typeof templates] || '');
    setPreviewResult('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            WhatsApp Template - Sistema Semplificato
          </CardTitle>
          <CardDescription>
            Gestisci le variabili dei template WhatsApp in modo semplice e diretto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="variables">
                <Lightbulb className="w-4 h-4 mr-2" />
                Variabili Disponibili
              </TabsTrigger>
              <TabsTrigger value="mapping">
                <Settings className="w-4 h-4 mr-2" />
                Conversione {`{1} {2} {3}`}
              </TabsTrigger>
              <TabsTrigger value="tester">
                <TestTube className="w-4 h-4 mr-2" />
                Testa Template
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Variabili Disponibili */}
            <TabsContent value="variables" className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  Variabili che puoi usare nei template
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Copia e incolla queste variabili nei tuoi template WhatsApp
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AVAILABLE_VARIABLES.map((variable) => (
                  <div 
                    key={variable.key}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(`{${variable.key}}`);
                      toast({
                        title: "Copiato",
                        description: `{${variable.key}} copiato negli appunti`
                      });
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400">
                          {`{${variable.key}}`}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {variable.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Esempio: {variable.example}
                        </div>
                      </div>
                      <Copy className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Come usare le variabili
                </h4>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                  <p>1. Clicca su una variabile per copiarla</p>
                  <p>2. Incollala nel tuo template WhatsApp</p>
                  <p>3. La variabile verrà sostituita automaticamente con i dati reali</p>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Mapping Semplice */}
            <TabsContent value="mapping" className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Converti template vecchi in nuovi
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Se hai template che usano {`{1}, {2}, {3}`}, configurali qui per convertirli automaticamente
                </p>
              </div>

              <div className="space-y-4">
                {mappings.map((mapping, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge variant="outline" className="font-mono min-w-12">
                        {mapping.old}
                      </Badge>
                      
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      
                      <div className="flex-1">
                        <Select
                          value={mapping.new}
                          onValueChange={(value) => updateMapping(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Scegli variabile" />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_VARIABLES.map((variable) => (
                              <SelectItem key={variable.key} value={variable.key}>
                                {variable.label} - {`{${variable.key}}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium mb-2">Esempio di conversione</h4>
                <div className="space-y-2 text-sm font-mono">
                  <div className="text-gray-600 dark:text-gray-400">
                    Vecchio: "Ciao {`{1}`}, il pagamento di {`{2}`} scade il {`{3}`}"
                  </div>
                  <div className="text-green-600 dark:text-green-400">
                    Nuovo: "Ciao {`{customer.name}`}, il pagamento di {`{movement.amount}`} scade il {`{movement.date}`}"
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Tester */}
            <TabsContent value="tester" className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  Testa i tuoi template
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Scrivi un template e vedi come apparirà con dati reali
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="template">Template WhatsApp</Label>
                  <Textarea
                    id="template"
                    value={templateText}
                    onChange={(e) => setTemplateText(e.target.value)}
                    placeholder="Scrivi il tuo template qui...
Es: Ciao {customer.name}, la fattura di {movement.amount} è pronta!"
                    rows={6}
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setExampleTemplate('invoice')}
                  >
                    Esempio Fattura
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setExampleTemplate('reminder')}
                  >
                    Esempio Promemoria
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setExampleTemplate('welcome')}
                  >
                    Esempio Benvenuto
                  </Button>
                </div>

                <Button onClick={generatePreview} className="w-full">
                  <TestTube className="w-4 h-4 mr-2" />
                  Genera Anteprima
                </Button>

                {previewResult && (
                  <div className="space-y-3">
                    <Label>Risultato con dati di esempio:</Label>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="whitespace-pre-wrap text-sm">
                        {previewResult}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => {
                          navigator.clipboard.writeText(previewResult);
                          toast({
                            title: "Copiato",
                            description: "Risultato copiato negli appunti"
                          });
                        }}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copia Risultato
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}