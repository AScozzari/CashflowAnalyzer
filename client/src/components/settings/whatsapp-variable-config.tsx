import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Lightbulb, Settings, ArrowRight } from 'lucide-react';
import { WhatsAppDynamicVariables } from './whatsapp-dynamic-variables';
import { WhatsAppTemplateTester } from './whatsapp-template-tester';
import { WhatsAppVariableMapper } from './whatsapp-variable-mapper';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppVariableConfigProps {
  onVariableSelect?: (variableKey: string, label: string) => void;
}

export function WhatsAppVariableConfig({ onVariableSelect }: WhatsAppVariableConfigProps) {
  const { toast } = useToast();
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('dynamic');

  const handleVariableSelect = (variableKey: string, label: string) => {
    const isSelected = selectedVariables.includes(variableKey);
    
    let updatedSelection: string[];
    if (isSelected) {
      updatedSelection = selectedVariables.filter(v => v !== variableKey);
      toast({
        title: "Variabile rimossa",
        description: `${label} rimossa dalla selezione`
      });
    } else {
      updatedSelection = [...selectedVariables, variableKey];
      toast({
        title: "Variabile aggiunta",
        description: `${label} aggiunta alla selezione`
      });
    }
    
    setSelectedVariables(updatedSelection);
    onVariableSelect?.(variableKey, label);
  };

  const clearSelection = () => {
    setSelectedVariables([]);
    toast({
      title: "Selezione pulita",
      description: "Tutte le variabili sono state deselezionate"
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
            Sistema avanzato per gestire variabili dinamiche nei template WhatsApp.
            Passa dal sistema statico a variabili che estraggono automaticamente 
            dati dalle entità del sistema.
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
                <Settings className="w-4 h-4" />
                Tester Template
              </TabsTrigger>
              <TabsTrigger value="legacy" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Sistema Legacy
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dynamic" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                    ✅ Sistema Dinamico Raccomandato
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Variabili che si collegano automaticamente ai dati reali del sistema
                  </p>
                </div>
                {selectedVariables.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedVariables.length} selezionate</Badge>
                    <Button variant="outline" size="sm" onClick={clearSelection}>
                      Pulisci Selezione
                    </Button>
                  </div>
                )}
              </div>

              <WhatsAppDynamicVariables 
                onVariableSelect={handleVariableSelect}
                selectedVariables={selectedVariables}
              />

              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  💡 Vantaggi del Sistema Dinamico
                </h4>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <li>• <strong>Dati reali</strong>: estrae automaticamente i dati dalle entità del sistema</li>
                  <li>• <strong>Autocompletamento</strong>: nomi azienda, clienti, importi, date vengono popolati automaticamente</li>
                  <li>• <strong>Tipizzazione</strong>: formattazione automatica per valute, date, email, telefoni</li>
                  <li>• <strong>Mantenimento</strong>: nessuna necessità di aggiornamento manuale dei dati</li>
                  <li>• <strong>Scalabilità</strong>: aggiungi nuove variabili senza modificare i template esistenti</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="mapper" className="space-y-4">
              <WhatsAppVariableMapper />
            </TabsContent>

            <TabsContent value="tester" className="space-y-4">
              <WhatsAppTemplateTester />
            </TabsContent>

            <TabsContent value="legacy" className="space-y-4">
              <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                      Sistema Legacy Deprecato
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                      Il sistema attuale con variabili statiche presenta limitazioni:
                    </p>
                    <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1 mb-4">
                      <li>• Dati statici che richiedono inserimento manuale</li>
                      <li>• Nessuna connessione con le entità del sistema</li>
                      <li>• Rischio di errori nel inserimento manuale</li>
                      <li>• Difficile mantenimento e aggiornamento</li>
                      <li>• Limitato a 3 variabili sequenziali</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium mb-3">Variabili Legacy Attuali</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <code className="text-sm">{'{{1}}'}</code>
                    <span className="text-sm text-gray-600">Nome cliente/azienda</span>
                    <span className="text-xs text-gray-500">Esempio: Mario Rossi</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <code className="text-sm">{'{{2}}'}</code>
                    <span className="text-sm text-gray-600">Importo/Valore</span>
                    <span className="text-xs text-gray-500">Esempio: € 1.250,00</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <code className="text-sm">{'{{3}}'}</code>
                    <span className="text-sm text-gray-600">Data scadenza/evento</span>
                    <span className="text-xs text-gray-500">Esempio: 31/12/2024</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center p-6 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-950">
                <div className="text-center">
                  <ArrowRight className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Migrazione Consigliata
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Passa al sistema dinamico per ottenere dati reali e automatici
                  </p>
                  <Button 
                    className="mt-3" 
                    size="sm"
                    onClick={() => setActiveTab('dynamic')}
                  >
                    Usa Sistema Dinamico
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}