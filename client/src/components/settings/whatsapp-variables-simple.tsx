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
import { useQuery } from '@tanstack/react-query';

// Genera categorie dinamiche basate sui dati reali del database
function generateRealVariableCategories(customers: any[], companies: any[], movements: any[]) {
  const sampleCustomer = customers[0];
  const sampleCompany = companies[0];
  const sampleMovement = movements[0];

  return {
    customer: {
      title: 'Cliente',
      description: 'Dati del cliente (fatturazione, contatti)',
      variables: [
        { key: 'customer.name', label: 'Nome Cliente', example: sampleCustomer?.name || 'Nessun cliente' },
        { key: 'customer.email', label: 'Email Cliente', example: sampleCustomer?.email || 'email@cliente.it' },
        { key: 'customer.phone', label: 'Telefono Cliente', example: sampleCustomer?.phone || '+39 333 0000000' },
        { key: 'customer.company', label: 'Azienda Cliente', example: sampleCustomer?.companyName || 'Azienda cliente' },
        { key: 'customer.address', label: 'Indirizzo Cliente', example: sampleCustomer?.address || 'Indirizzo non disponibile' }
      ]
    },
    company: {
      title: 'Azienda',
      description: 'Dati della tua azienda (mittente)',
      variables: [
        { key: 'company.name', label: 'Nome Azienda', example: sampleCompany?.name || 'La Mia Azienda' },
        { key: 'company.email', label: 'Email Azienda', example: sampleCompany?.email || 'info@azienda.it' },
        { key: 'company.phone', label: 'Telefono Azienda', example: sampleCompany?.phone || '+39 02 0000000' },
        { key: 'company.address', label: 'Indirizzo Azienda', example: sampleCompany?.address || 'Indirizzo non disponibile' },
        { key: 'company.vat', label: 'Partita IVA', example: sampleCompany?.vatNumber || 'P.IVA non disponibile' }
      ]
    },
    movement: {
      title: 'Movimento Finanziario',
      description: 'Dati del movimento/fattura/pagamento',
      variables: [
        { key: 'movement.amount', label: 'Importo', example: sampleMovement ? `€${parseFloat(sampleMovement.amount || '0').toLocaleString('it-IT')}` : '€0,00' },
        { key: 'movement.description', label: 'Descrizione', example: sampleMovement?.description || 'Movimento non disponibile' },
        { key: 'movement.date', label: 'Data Movimento', example: sampleMovement?.flowDate ? new Date(sampleMovement.flowDate).toLocaleDateString('it-IT') : new Date().toLocaleDateString('it-IT') },
        { key: 'movement.dueDate', label: 'Data Scadenza', example: sampleMovement?.dueDate ? new Date(sampleMovement.dueDate).toLocaleDateString('it-IT') : 'Non definita' },
        { key: 'movement.invoiceNumber', label: 'Numero Fattura', example: sampleMovement?.invoiceNumber || 'Numero non disponibile' }
      ]
    },
    system: {
      title: 'Sistema',
      description: 'Dati automatici del sistema',
      variables: [
        { key: 'system.date', label: 'Data Oggi', example: new Date().toLocaleDateString('it-IT') },
        { key: 'system.time', label: 'Ora Attuale', example: new Date().toLocaleTimeString('it-IT') },
        { key: 'system.year', label: 'Anno Corrente', example: new Date().getFullYear().toString() },
        { key: 'system.month', label: 'Mese Corrente', example: new Date().toLocaleDateString('it-IT', { month: 'long' }) }
      ]
    }
  };
}

// Ora le variabili sono generate dinamicamente nel componente

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
  const [copiedVariable, setCopiedVariable] = useState<string>('');
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  
  // Fetch dati reali dal database
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['/api/customers'],
    staleTime: 5 * 60 * 1000
  });

  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['/api/companies'],
    staleTime: 5 * 60 * 1000
  });

  const { data: movements = [], isLoading: movementsLoading } = useQuery({
    queryKey: ['/api/movements'],
    staleTime: 5 * 60 * 1000
  });

  const isLoading = customersLoading || companiesLoading || movementsLoading;

  // Genera categorie dinamiche
  const VARIABLE_CATEGORIES = generateRealVariableCategories(customers, companies, movements);
  const AVAILABLE_VARIABLES = Object.values(VARIABLE_CATEGORIES).flatMap(category => category.variables);
  
  // Mapping semplificato
  const [mappings, setMappings] = useState<Mapping[]>([
    { old: '{1}', new: 'customer.name', label: 'Nome Cliente' },
    { old: '{2}', new: 'movement.amount', label: 'Importo' },
    { old: '{3}', new: 'movement.date', label: 'Data' }
  ]);

  // Funzione per selezionare/deselezionare variabili
  const toggleVariableSelection = (variableKey: string) => {
    if (selectedVariables.includes(variableKey)) {
      setSelectedVariables(selectedVariables.filter(v => v !== variableKey));
    } else {
      setSelectedVariables([...selectedVariables, variableKey]);
    }
  };

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

  // Funzione per usare le variabili selezionate nel mapping automaticamente
  const applySelectedToMapping = () => {
    if (selectedVariables.length === 0) {
      toast({
        title: "Nessuna variabile selezionata",
        description: "Seleziona almeno una variabile prima",
        variant: "destructive"
      });
      return;
    }

    const newMappings = [...mappings];
    selectedVariables.slice(0, 3).forEach((variableKey, index) => {
      const variable = AVAILABLE_VARIABLES.find(v => v.key === variableKey);
      if (variable) {
        newMappings[index] = {
          ...newMappings[index],
          new: variableKey,
          label: variable.label
        };
      }
    });
    
    setMappings(newMappings);
    toast({
      title: "Mapping applicato",
      description: `Applicate ${Math.min(selectedVariables.length, 3)} variabili al mapping`
    });
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
                Mapping
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
                  Variabili per i tuoi template
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>Click</strong>: Seleziona variabile per usarla nel Mapping • <strong>Ctrl+Click</strong>: Copia negli appunti
                </p>
              </div>

              <div className="space-y-6">
                {Object.entries(VARIABLE_CATEGORIES).map(([categoryKey, category]) => (
                  <div key={categoryKey} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {category.title}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {category.variables.length} variabili
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {category.description}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {category.variables.map((variable) => (
                        <div 
                          key={variable.key}
                          className={`border rounded-lg p-3 cursor-pointer transition-all duration-300 ${
                            selectedVariables.includes(variable.key)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-200'
                              : copiedVariable === variable.key 
                              ? 'border-green-500 bg-green-50 dark:bg-green-950 scale-105' 
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            if (e.ctrlKey || e.metaKey) {
                              // Ctrl+Click per copiare
                              navigator.clipboard.writeText(`{${variable.key}}`);
                              setCopiedVariable(variable.key);
                              setTimeout(() => setCopiedVariable(''), 2000);
                              toast({
                                title: "✅ Copiato negli appunti",
                                description: `{${variable.key}} - Ctrl+Click per copiare`
                              });
                            } else {
                              // Click normale per selezionare
                              toggleVariableSelection(variable.key);
                              toast({
                                title: selectedVariables.includes(variable.key) ? "Variabile deselezionata" : "Variabile selezionata",
                                description: `${variable.label} - Le variabili selezionate possono essere usate nel Mapping`
                              });
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
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
                            <div className="ml-3">
                              {selectedVariables.includes(variable.key) ? (
                                <CheckCircle className="w-5 h-5 text-blue-500" />
                              ) : copiedVariable === variable.key ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selectedVariables.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">
                      Variabili Selezionate ({selectedVariables.length})
                    </h4>
                    <Button 
                      onClick={applySelectedToMapping}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Applica al Mapping
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedVariables.map((variableKey) => {
                      const variable = AVAILABLE_VARIABLES.find(v => v.key === variableKey);
                      return (
                        <Badge key={variableKey} variant="secondary" className="font-mono">
                          {variable?.label} - {`{${variableKey}}`}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-800 border rounded-lg p-4">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  💡 Come funziona il sistema variabili
                </h4>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <p><strong>Scopo delle variabili:</strong> Sostituiscono automaticamente i placeholder con dati reali del sistema</p>
                  <p><strong>Esempio pratico:</strong> {`{customer.name}`} diventa "Mario Rossi", {`{movement.amount}`} diventa "€1.250,00"</p>
                  <p><strong>Selezione:</strong> Clicca per selezionare variabili da usare nel Mapping {`{1}, {2}, {3}`}</p>
                  <p><strong>Copia rapida:</strong> Ctrl+Click per copiare negli appunti e incollare dove vuoi</p>
                  <p><strong>Categorie disponibili:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• <strong>Customer:</strong> Dati cliente (nome, email, telefono)</li>
                    <li>• <strong>Company:</strong> Dati azienda (nome, contatti)</li>
                    <li>• <strong>Movement:</strong> Dati movimento finanziario (importo, data, descrizione)</li>
                    <li>• <strong>System:</strong> Dati sistema (data corrente, anno)</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Mapping Semplice */}
            <TabsContent value="mapping" className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Mapping {`{1} {2} {3}`} → Variabili
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Se hai template vecchi che usano {`{1}, {2}, {3}`}, qui puoi decidere a cosa corrispondono. 
                  Ad esempio: {`{1}`} = Nome Cliente, {`{2}`} = Importo, {`{3}`} = Data
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
                            {selectedVariables.length > 0 ? (
                              <>
                                <div className="px-2 py-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                                  Variabili Selezionate ({selectedVariables.length}):
                                </div>
                                {selectedVariables.map((variableKey) => {
                                  const variable = AVAILABLE_VARIABLES.find(v => v.key === variableKey);
                                  return variable ? (
                                    <SelectItem key={variableKey} value={variable.key}>
                                      ⭐ {variable.label} - {`{${variable.key}}`}
                                    </SelectItem>
                                  ) : null;
                                })}
                              </>
                            ) : (
                              <div className="px-2 py-2 text-sm text-gray-500 italic">
                                Nessuna variabile selezionata. Vai in "Variabili Disponibili" per selezionarne.
                              </div>
                            )}
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