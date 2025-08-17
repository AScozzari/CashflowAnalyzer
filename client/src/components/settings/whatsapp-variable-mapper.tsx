import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Link, Trash2, Plus, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AVAILABLE_VARIABLES } from '@/hooks/use-whatsapp-variables';

interface VariableMapping {
  placeholder: string; // {{1}}, {{2}}, {{3}}
  dynamicVariable: string; // customer.name, company.email
  label: string;
  type: 'text' | 'currency' | 'date' | 'email' | 'phone';
}

interface WhatsAppVariableMapperProps {
  onMappingChange?: (mappings: VariableMapping[]) => void;
  initialMappings?: VariableMapping[];
}

export function WhatsAppVariableMapper({ onMappingChange, initialMappings = [] }: WhatsAppVariableMapperProps) {
  const { toast } = useToast();
  const [mappings, setMappings] = useState<VariableMapping[]>(
    initialMappings.length > 0 ? initialMappings : [
      { placeholder: '{{1}}', dynamicVariable: '', label: '', type: 'text' },
      { placeholder: '{{2}}', dynamicVariable: '', label: '', type: 'text' },
      { placeholder: '{{3}}', dynamicVariable: '', label: '', type: 'text' }
    ]
  );

  // Ottieni tutte le variabili disponibili in formato flat
  const allVariables = Object.entries(AVAILABLE_VARIABLES).flatMap(([category, variables]) =>
    variables.map(v => ({
      ...v,
      category,
      fullKey: v.key,
      displayLabel: `[${category.toUpperCase()}] ${v.label}`
    }))
  );

  const updateMapping = (index: number, field: keyof VariableMapping, value: string) => {
    const newMappings = [...mappings];
    
    if (field === 'dynamicVariable' && value) {
      // Trova la variabile selezionata per popolare automaticamente label e type
      const selectedVariable = allVariables.find(v => v.fullKey === value);
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
    onMappingChange?.(newMappings);
  };

  const addMapping = () => {
    const nextNumber = mappings.length + 1;
    const newMapping: VariableMapping = {
      placeholder: `{{${nextNumber}}}`,
      dynamicVariable: '',
      label: '',
      type: 'text'
    };
    
    const newMappings = [...mappings, newMapping];
    setMappings(newMappings);
    onMappingChange?.(newMappings);
    
    toast({
      title: "Mapping aggiunto",
      description: `Aggiunto placeholder {{${nextNumber}}}`
    });
  };

  const removeMapping = (index: number) => {
    const newMappings = mappings.filter((_, i) => i !== index)
      .map((mapping, i) => ({
        ...mapping,
        placeholder: `{{${i + 1}}}`
      }));
    
    setMappings(newMappings);
    onMappingChange?.(newMappings);
    
    toast({
      title: "Mapping rimosso",
      description: "Placeholder rimosso e numerazione aggiornata"
    });
  };

  const clearAllMappings = () => {
    const clearedMappings = mappings.map(m => ({
      ...m,
      dynamicVariable: '',
      label: '',
      type: 'text' as const
    }));
    
    setMappings(clearedMappings);
    onMappingChange?.(clearedMappings);
    
    toast({
      title: "Mappings puliti",
      description: "Tutti i mapping sono stati resettati"
    });
  };

  const getExampleTemplate = () => {
    const validMappings = mappings.filter(m => m.dynamicVariable && m.label);
    if (validMappings.length === 0) return "Configura i mapping per vedere l'esempio";
    
    return `Esempio template convertito:

VECCHIO SISTEMA:
"Ciao {{1}}, il tuo pagamento di {{2}} è in scadenza il {{3}}"

NUOVO SISTEMA:
"Ciao {customer.name}, il tuo pagamento di {movement.amount} è in scadenza il {movement.date}"

Con i tuoi mapping:
- ${validMappings[0]?.placeholder} → {${validMappings[0]?.dynamicVariable}} (${validMappings[0]?.label})
${validMappings[1] ? `- ${validMappings[1].placeholder} → {${validMappings[1].dynamicVariable}} (${validMappings[1].label})` : ''}
${validMappings[2] ? `- ${validMappings[2].placeholder} → {${validMappings[2].dynamicVariable}} (${validMappings[2].label})` : ''}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Mapping Variabili: Da Placeholders a Sistema Dinamico
          </CardTitle>
          <CardDescription>
            Collega i placeholder numerici del sistema legacy alle nuove variabili dinamiche.
            Questo permette di convertire automaticamente i template esistenti.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Come Funziona il Mapping
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  Definisci quale variabile dinamica sostituisce ogni placeholder numerico:
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• <strong>Placeholder 1</strong> diventa <strong>customer.name</strong></li>
                  <li>• <strong>Placeholder 2</strong> diventa <strong>movement.amount</strong></li>
                  <li>• <strong>Placeholder 3</strong> diventa <strong>movement.date</strong></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Mappings Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Configurazione Mapping</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearAllMappings}>
                  Pulisci Tutto
                </Button>
                <Button variant="outline" size="sm" onClick={addMapping}>
                  <Plus className="w-4 h-4 mr-1" />
                  Aggiungi
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {mappings.map((mapping, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    
                    {/* Placeholder Legacy */}
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium block mb-1">Placeholder</label>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {mapping.placeholder}
                        </Badge>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="md:col-span-1 flex justify-center">
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>

                    {/* Dynamic Variable Selection */}
                    <div className="md:col-span-6">
                      <label className="text-sm font-medium block mb-1">Variabile Dinamica</label>
                      <Select
                        value={mapping.dynamicVariable}
                        onValueChange={(value) => updateMapping(index, 'dynamicVariable', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona variabile dinamica" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nessuna variabile</SelectItem>
                          {allVariables.map((variable) => (
                            <SelectItem key={variable.fullKey} value={variable.fullKey}>
                              {variable.displayLabel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Type Badge */}
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium block mb-1">Tipo</label>
                      <Badge variant="secondary" className="w-full justify-center">
                        {mapping.type}
                      </Badge>
                    </div>

                    {/* Remove Button */}
                    <div className="md:col-span-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMapping(index)}
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={mappings.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Selected Variable Info */}
                  {mapping.dynamicVariable && mapping.label && (
                    <div className="mt-3 p-2 bg-green-50 dark:bg-green-950 rounded text-sm">
                      <span className="text-green-700 dark:text-green-300">
                        ✓ <strong>{mapping.placeholder}</strong> → <code>{'{' + mapping.dynamicVariable + '}'}</code> 
                        ({mapping.label})
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Example Preview */}
          <div>
            <h4 className="font-medium mb-3">Anteprima Conversione</h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {getExampleTemplate()}
              </pre>
            </div>
          </div>

          {/* Current Mappings Summary */}
          <div>
            <h4 className="font-medium mb-3">Riepilogo Mapping Correnti</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {mappings.map((mapping, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    mapping.dynamicVariable 
                      ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="text-sm">
                    <div className="font-mono font-medium">{mapping.placeholder}</div>
                    <div className="text-gray-600 dark:text-gray-300">
                      {mapping.dynamicVariable ? (
                        <>
                          <code className="text-xs">{'{' + mapping.dynamicVariable + '}'}</code>
                          <div className="text-xs mt-1">{mapping.label}</div>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">Non configurato</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}