import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Lightbulb, Settings } from 'lucide-react';
import { WhatsAppDynamicVariables } from './whatsapp-dynamic-variables';
import { useToast } from '@/hooks/use-toast';

interface Variable {
  placeholder: string;
  description: string;
  example: string;
  type: 'text' | 'number' | 'date' | 'currency';
}

interface WhatsAppVariableConfigProps {
  onVariablesChange?: (variables: Variable[]) => void;
}

export function WhatsAppVariableConfig({ onVariablesChange }: WhatsAppVariableConfigProps) {
  const { toast } = useToast();
  const [variables, setVariables] = useState<Variable[]>([
    { placeholder: '{{1}}', description: 'Nome cliente/azienda', example: 'Mario Rossi', type: 'text' },
    { placeholder: '{{2}}', description: 'Importo/Valore', example: '€ 1.250,00', type: 'currency' },
    { placeholder: '{{3}}', description: 'Data scadenza/evento', example: '31/12/2024', type: 'date' }
  ]);

  const [newVariable, setNewVariable] = useState<Partial<Variable>>({
    description: '',
    example: '',
    type: 'text'
  });

  const addVariable = () => {
    if (!newVariable.description || !newVariable.example) {
      toast({
        title: "Errore",
        description: "Completa descrizione ed esempio per la variabile",
        variant: "destructive"
      });
      return;
    }

    const nextIndex = variables.length + 1;
    const variable: Variable = {
      placeholder: `{{${nextIndex}}}`,
      description: newVariable.description,
      example: newVariable.example,
      type: newVariable.type || 'text'
    };

    const updatedVariables = [...variables, variable];
    setVariables(updatedVariables);
    onVariablesChange?.(updatedVariables);
    setNewVariable({ description: '', example: '', type: 'text' });

    toast({
      title: "Variabile aggiunta",
      description: `Variabile ${variable.placeholder} aggiunta con successo`
    });
  };

  const removeVariable = (index: number) => {
    const updatedVariables = variables.filter((_, i) => i !== index)
      .map((variable, i) => ({
        ...variable,
        placeholder: `{{${i + 1}}}`
      }));
    
    setVariables(updatedVariables);
    onVariablesChange?.(updatedVariables);

    toast({
      title: "Variabile rimossa",
      description: "La variabile è stata rimossa e gli indici riorganizzati"
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiato",
      description: `${text} copiato negli appunti`
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'currency': return 'bg-green-100 text-green-800 border-green-200';
      case 'date': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'number': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurazione Variabili Template
        </CardTitle>
        <CardDescription>
          Definisci le variabili utilizzabili nei template WhatsApp. Le variabili devono essere sequenziali ({`{{1}}, {{2}}, {{3}}`}).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Variables */}
        <div>
          <Label className="text-sm font-medium">Variabili Attualmente Definite</Label>
          <div className="mt-2 space-y-3">
            {variables.map((variable, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(variable.placeholder)}
                    className="font-mono"
                    data-testid={`button-copy-variable-${index}`}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {variable.placeholder}
                  </Button>
                  <div>
                    <div className="text-sm font-medium">{variable.description}</div>
                    <div className="text-xs text-gray-500">Esempio: {variable.example}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getTypeColor(variable.type)}>
                    {variable.type}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariable(index)}
                    className="text-red-600 hover:text-red-700"
                    data-testid={`button-remove-variable-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {variables.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                Nessuna variabile configurata
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Add New Variable */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Aggiungi Nuova Variabile</Label>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Descrizione</Label>
              <Input
                placeholder="es. Nome cliente"
                value={newVariable.description || ''}
                onChange={(e) => setNewVariable(prev => ({ ...prev, description: e.target.value }))}
                data-testid="input-new-variable-description"
              />
            </div>
            <div>
              <Label className="text-xs">Esempio</Label>
              <Input
                placeholder="es. Mario Rossi"
                value={newVariable.example || ''}
                onChange={(e) => setNewVariable(prev => ({ ...prev, example: e.target.value }))}
                data-testid="input-new-variable-example"
              />
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                value={newVariable.type || 'text'}
                onChange={(e) => setNewVariable(prev => ({ ...prev, type: e.target.value as Variable['type'] }))}
                data-testid="select-new-variable-type"
              >
                <option value="text">Testo</option>
                <option value="currency">Valuta</option>
                <option value="date">Data</option>
                <option value="number">Numero</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={addVariable}
                className="w-full"
                data-testid="button-add-variable"
              >
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi
              </Button>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-blue-600" />
            <Label className="text-sm font-medium text-blue-900 dark:text-blue-100">Esempi di Utilizzo</Label>
          </div>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p>• Sollecito: "Ciao {`{{1}}`}, ti ricordiamo il pagamento di {`{{2}}`} entro il {`{{3}}`}"</p>
            <p>• Conferma: "Grazie {`{{1}}`}, abbiamo ricevuto {`{{2}}`} del {`{{3}}`}"</p>
            <p>• Marketing: "Offerta speciale per {`{{1}}`}: sconto {`{{2}}`} valido fino al {`{{3}}`}"</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}