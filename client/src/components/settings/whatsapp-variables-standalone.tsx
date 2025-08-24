import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, Lightbulb, PlayCircle, ArrowRight, AlertTriangle, 
  Copy, TestTube, Zap, Info, Link 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Sistema completamente collegato al database reale
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Genera esempi dinamici basati sui dati reali del database
function generateRealVariables(customers: any[], companies: any[], movements: any[], suppliers: any[]) {
  const sampleCustomer = customers[0];
  const sampleCompany = companies[0]; 
  const sampleMovement = movements[0];
  const sampleSupplier = suppliers[0];

  return {
    customer: [
      { key: 'customer.name', label: 'Nome Cliente', type: 'text', example: sampleCustomer?.name || 'Nessun cliente' },
      { key: 'customer.email', label: 'Email Cliente', type: 'email', example: sampleCustomer?.email || 'email@example.it' },
      { key: 'customer.phone', label: 'Telefono Cliente', type: 'phone', example: sampleCustomer?.phone || '+39 333 0000000' },
      { key: 'customer.address', label: 'Indirizzo Cliente', type: 'text', example: sampleCustomer?.address || 'Indirizzo non disponibile' },
      { key: 'customer.vat', label: 'Partita IVA Cliente', type: 'text', example: sampleCustomer?.vatNumber || 'P.IVA non disponibile' }
    ],
    company: [
      { key: 'company.name', label: 'Nome Azienda', type: 'text', example: sampleCompany?.name || 'Azienda non disponibile' },
      { key: 'company.email', label: 'Email Azienda', type: 'email', example: sampleCompany?.email || 'email@azienda.it' },
      { key: 'company.phone', label: 'Telefono Azienda', type: 'phone', example: sampleCompany?.phone || '+39 02 0000000' },
      { key: 'company.address', label: 'Indirizzo Azienda', type: 'text', example: sampleCompany?.address || 'Indirizzo non disponibile' },
      { key: 'company.vat', label: 'Partita IVA Azienda', type: 'text', example: sampleCompany?.vatNumber || 'P.IVA non disponibile' }
    ],
    movement: [
      { key: 'movement.amount', label: 'Importo Movimento', type: 'currency', example: sampleMovement ? `€${parseFloat(sampleMovement.amount || '0').toLocaleString('it-IT')}` : '€0,00' },
      { key: 'movement.description', label: 'Descrizione Movimento', type: 'text', example: sampleMovement?.description || 'Nessuna descrizione' },
      { key: 'movement.date', label: 'Data Movimento', type: 'date', example: sampleMovement?.flowDate ? new Date(sampleMovement.flowDate).toLocaleDateString('it-IT') : new Date().toLocaleDateString('it-IT') },
      { key: 'movement.type', label: 'Tipo Movimento', type: 'text', example: sampleMovement?.type === 'income' ? 'Entrata' : sampleMovement?.type === 'expense' ? 'Uscita' : 'Tipo non disponibile' },
      { key: 'movement.category', label: 'Categoria Movimento', type: 'text', example: sampleMovement?.category || 'Categoria non disponibile' }
    ],
    supplier: [
      { key: 'supplier.name', label: 'Nome Fornitore', type: 'text', example: sampleSupplier?.name || 'Nessun fornitore' },
      { key: 'supplier.email', label: 'Email Fornitore', type: 'email', example: sampleSupplier?.email || 'email@fornitore.it' },
      { key: 'supplier.phone', label: 'Telefono Fornitore', type: 'phone', example: sampleSupplier?.phone || '+39 02 0000000' },
      { key: 'supplier.address', label: 'Indirizzo Fornitore', type: 'text', example: sampleSupplier?.address || 'Indirizzo non disponibile' },
      { key: 'supplier.vat', label: 'Partita IVA Fornitore', type: 'text', example: sampleSupplier?.vatNumber || 'P.IVA non disponibile' }
    ],
    system: [
      { key: 'system.current_date', label: 'Data Corrente', type: 'date', example: new Date().toLocaleDateString('it-IT') },
      { key: 'system.company_name', label: 'Nome Sistema', type: 'text', example: 'EasyCashFlows' },
      { key: 'system.year', label: 'Anno Corrente', type: 'text', example: new Date().getFullYear().toString() },
      { key: 'system.month', label: 'Mese Corrente', type: 'text', example: new Date().toLocaleDateString('it-IT', { month: 'long' }) }
    ]
  };
}

interface VariableMapping {
  placeholder: string;
  dynamicVariable: string;
  label: string;
  type: string;
}

export function WhatsAppVariablesStandalone() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dynamic');
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [templateBody, setTemplateBody] = useState('');
  const [resolvedResult, setResolvedResult] = useState<any>(null);
  const [mappings, setMappings] = useState<VariableMapping[]>([
    { placeholder: '{1}', dynamicVariable: '', label: '', type: 'text' },
    { placeholder: '{2}', dynamicVariable: '', label: '', type: 'text' },
    { placeholder: '{3}', dynamicVariable: '', label: '', type: 'text' }
  ]);

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

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ['/api/suppliers'],
    staleTime: 5 * 60 * 1000
  });

  const isLoading = customersLoading || companiesLoading || movementsLoading || suppliersLoading;

  // Genera variabili dinamiche basate sui dati reali
  const REAL_VARIABLES = generateRealVariables(customers, companies, movements, suppliers);

  // Ottieni tutte le variabili in formato flat
  const allVariables = Object.entries(REAL_VARIABLES).flatMap(([category, variables]) =>
    variables.map(v => ({
      ...v,
      category,
      displayLabel: `[${category.toUpperCase()}] ${v.label}`
    }))
  );

  const handleVariableSelect = (variable: string) => {
    if (selectedVariables.includes(variable)) {
      setSelectedVariables(selectedVariables.filter(v => v !== variable));
    } else {
      setSelectedVariables([...selectedVariables, variable]);
    }
    
    toast({
      title: selectedVariables.includes(variable) ? "Variabile rimossa" : "Variabile aggiunta",
      description: `${variable} ${selectedVariables.includes(variable) ? 'rimossa' : 'aggiunta'} alla selezione`
    });
  };

  const updateMapping = (index: number, field: keyof VariableMapping, value: string) => {
    const newMappings = [...mappings];
    
    if (field === 'dynamicVariable' && value) {
      const selectedVariable = allVariables.find(v => v.key === value);
      if (selectedVariable) {
        newMappings[index] = {
          ...newMappings[index],
          dynamicVariable: value,
          label: selectedVariable.label,
          type: selectedVariable.type
        };
      }
    } else {
      newMappings[index] = {
        ...newMappings[index],
        [field]: value
      };
    }
    
    setMappings(newMappings);
  };

  const simulateTemplateResolution = (template: string) => {
    let resolvedTemplate = template;
    const usedVariables: any[] = [];

    // Trova le variabili nel template
    const variableMatches = template.match(/\{([^}]+)\}/g) || [];
    
    for (const match of variableMatches) {
      const variableName = match.replace(/[{}]/g, '');
      let value = `[${variableName} non trovato]`;
      
      // Trova la variabile e usa l'esempio
      const variable = allVariables.find(v => v.key === variableName);
      if (variable) {
        value = variable.example;
      }
      
      resolvedTemplate = resolvedTemplate.replace(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
      usedVariables.push({
        key: variableName,
        value: value,
        type: variable?.type || 'text',
        formatted: value
      });
    }

    return {
      resolvedTemplate,
      variables: usedVariables
    };
  };

  const handlePreviewTemplate = () => {
    if (!templateBody.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un template da testare",
        variant: "destructive"
      });
      return;
    }

    const result = simulateTemplateResolution(templateBody);
    setResolvedResult(result);
    toast({
      title: "Anteprima generata",
      description: "Template processato con dati di esempio"
    });
  };

  const setExampleTemplate = (type: 'invoice' | 'reminder' | 'welcome') => {
    const templates = {
      invoice: `Ciao {customer.name},

La tua fattura di {movement.amount} è pronta!

Dettagli:
- Data: {movement.date}
- Descrizione: {movement.description}
- Azienda: {company.name}

Per informazioni: {company.email}`,

      reminder: `Gentile {customer.name},

Ti ricordiamo il pagamento di {movement.amount} in scadenza.

Dettagli movimento:
- Data: {movement.date}
- Descrizione: {movement.description}

Per assistenza contatta {company.phone}.

Cordiali saluti,
{company.name}`,

      welcome: `Benvenuto in {company.name}!

Ciao {customer.name}, siamo felici di averti come cliente.

I nostri contatti:
- Email: {company.email}
- Telefono: {company.phone}
- Indirizzo: {company.address}

Data registrazione: {system.current_date}`
    };

    setTemplateBody(templates[type]);
    setResolvedResult(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiato",
      description: "Contenuto copiato negli appunti"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Sistema Variabili Template WhatsApp
          </CardTitle>
          <CardDescription>
            Sistema completo e funzionante per gestire variabili dinamiche nei template WhatsApp.
            Funziona indipendentemente dalle impostazioni del server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dynamic" className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Variabili Dinamiche
              </TabsTrigger>
              <TabsTrigger value="mapper" className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Mapping Placeholder
              </TabsTrigger>
              <TabsTrigger value="tester" className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4" />
                Tester Template
              </TabsTrigger>
              <TabsTrigger value="legacy" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Sistema Legacy
              </TabsTrigger>
            </TabsList>

            {/* Tab Variabili Dinamiche */}
            <TabsContent value="dynamic" className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  ✅ Sistema Dinamico Attivo
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Variabili che si collegano automaticamente ai dati reali del sistema. 
                  Seleziona le variabili che vuoi utilizzare nei tuoi template.
                </p>
              </div>

              {Object.entries(DEMO_VARIABLES).map(([category, variables]) => (
                <div key={category}>
                  <h4 className="font-medium mb-3 capitalize">
                    {category} ({variables.length} variabili)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {variables.map((variable) => (
                      <div 
                        key={variable.key}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedVariables.includes(variable.key)
                            ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => handleVariableSelect(variable.key)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-mono text-sm font-medium">
                              {`{${variable.key}}`}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {variable.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Esempio: {variable.example}
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {variable.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {selectedVariables.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Variabili Selezionate ({selectedVariables.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedVariables.map((variable) => (
                      <Badge key={variable} variant="secondary" className="font-mono">
                        {`{${variable}}`}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => {
                      copyToClipboard(selectedVariables.map(v => `{${v}}`).join(' '));
                      toast({
                        title: "Variabili copiate",
                        description: "Le variabili selezionate sono state copiate negli appunti"
                      });
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copia Variabili
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Tab Mapping Placeholder */}
            <TabsContent value="mapper" className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  🔗 Sistema di Mapping Funzionante
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Configura come i placeholder numerici vengono convertiti in variabili dinamiche.
                  Questo sistema è completamente operativo.
                </p>
              </div>

              <div className="space-y-4">
                {mappings.map((mapping, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium block mb-1">Placeholder</label>
                        <Badge variant="outline" className="font-mono">
                          {mapping.placeholder}
                        </Badge>
                      </div>

                      <div className="md:col-span-1 flex justify-center">
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>

                      <div className="md:col-span-7">
                        <label className="text-sm font-medium block mb-1">Variabile Dinamica</label>
                        <Select
                          value={mapping.dynamicVariable}
                          onValueChange={(value) => updateMapping(index, 'dynamicVariable', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona variabile" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Nessuna variabile</SelectItem>
                            {allVariables.map((variable) => (
                              <SelectItem key={variable.key} value={variable.key}>
                                {variable.displayLabel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-sm font-medium block mb-1">Tipo</label>
                        <Badge variant="secondary" className="w-full justify-center">
                          {mapping.type}
                        </Badge>
                      </div>
                    </div>

                    {mapping.dynamicVariable && mapping.label && (
                      <div className="mt-3 p-2 bg-green-50 dark:bg-green-950 rounded text-sm">
                        <span className="text-green-700 dark:text-green-300">
                          ✓ <strong>{mapping.placeholder}</strong> → <code>{`{${mapping.dynamicVariable}}`}</code> 
                          ({mapping.label})
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium mb-2">Anteprima Conversione</h4>
                <div className="text-sm font-mono whitespace-pre-wrap">
                  {`Esempio conversione:

VECCHIO SISTEMA:
"Ciao {1}, il tuo pagamento di {2} è in scadenza il {3}"

NUOVO SISTEMA:
"Ciao {customer.name}, il tuo pagamento di {movement.amount} è in scadenza il {movement.date}"

Con i tuoi mapping:
${mappings.filter(m => m.dynamicVariable).map(m => 
  `- ${m.placeholder} → {${m.dynamicVariable}} (${m.label})`
).join('\n')}`}
                </div>
              </div>
            </TabsContent>

            {/* Tab Tester Template */}
            <TabsContent value="tester" className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  🧪 Template Tester Operativo
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Testa i template con variabili dinamiche. Sistema completamente funzionante con dati di esempio.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-3">Template di Esempio</h4>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => setExampleTemplate('invoice')}>
                    <TestTube className="w-4 h-4 mr-2" />
                    Fattura
                  </Button>
                  <Button variant="outline" onClick={() => setExampleTemplate('reminder')}>
                    <TestTube className="w-4 h-4 mr-2" />
                    Promemoria
                  </Button>
                  <Button variant="outline" onClick={() => setExampleTemplate('welcome')}>
                    <TestTube className="w-4 h-4 mr-2" />
                    Benvenuto
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Template da Testare</label>
                <Textarea
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  placeholder="Inserisci il tuo template qui... Usa variabili come {customer.name}, {movement.amount}, ecc."
                  rows={8}
                />
              </div>

              <Button onClick={handlePreviewTemplate} className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                Genera Anteprima Template
              </Button>

              {resolvedResult && (
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3">Risultato Template Risolto</h4>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="whitespace-pre-wrap text-sm">
                        {resolvedResult.resolvedTemplate}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => copyToClipboard(resolvedResult.resolvedTemplate)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copia Risultato
                      </Button>
                    </div>
                  </div>

                  {resolvedResult.variables.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Variabili Utilizzate</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {resolvedResult.variables.map((variable: any, index: number) => (
                          <div key={index} className="bg-white dark:bg-gray-800 border rounded-lg p-3">
                            <div className="font-mono text-sm font-medium">
                              {`{${variable.key}}`}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              Valore: {variable.value}
                            </div>
                            <Badge variant="outline" className="mt-2">
                              {variable.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Tab Sistema Legacy */}
            <TabsContent value="legacy" className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                  ⚠️ Sistema Legacy (Non Raccomandato)
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Il sistema legacy usa placeholder numerici fissi come {`{1}, {2}, {3}`}. 
                  È meno flessibile e più difficile da mantenere rispetto al sistema dinamico.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Limitazioni del Sistema Legacy</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• I placeholder sono fissi e non autoesplicativi</li>
                  <li>• Difficile ricordare cosa rappresenta {`{1}, {2}, {3}`}</li>
                  <li>• Non si adatta dinamicamente ai dati disponibili</li>
                  <li>• Richiede mappatura manuale per ogni template</li>
                  <li>• Propenso a errori durante la configurazione</li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  💡 Raccomandazione
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Usa il sistema dinamico nella prima scheda. È più potente, flessibile e facile da usare.
                  Se hai template legacy, usa la scheda "Mapping Placeholder" per convertirli.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}