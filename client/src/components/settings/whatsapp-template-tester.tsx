import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PlayCircle, Copy, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  useWhatsAppTemplateResolver, 
  useWhatsAppTemplatePreview,
  useAvailableEntities,
  type VariableContext 
} from '@/hooks/use-whatsapp-variables';

export function WhatsAppTemplateTester() {
  const { toast } = useToast();
  const [templateBody, setTemplateBody] = useState(
    `Ciao {{customer.name}}, 

La tua fattura di €{{movement.amount}} del {{movement.date}} è pronta.

Dettagli:
- Azienda: {{company.name}}
- Descrizione: {{movement.description}}
- Email: {{customer.email}}

Grazie per aver scelto {{company.name}}!

Data odierna: {{system.current_date}}`
  );
  
  const [context, setContext] = useState<VariableContext>({});
  const [resolvedResult, setResolvedResult] = useState<any>(null);

  const { 
    companies, 
    customers, 
    suppliers, 
    movements, 
    isLoading: entitiesLoading 
  } = useAvailableEntities();

  const templateResolver = useWhatsAppTemplateResolver();
  const templatePreview = useWhatsAppTemplatePreview();

  const handleResolveTemplate = async () => {
    try {
      const result = await templateResolver.mutateAsync({
        templateBody,
        context
      });
      setResolvedResult(result);
      toast({
        title: "Template risolto",
        description: "Template processato con successo con dati reali"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nella risoluzione del template",
        variant: "destructive"
      });
    }
  };

  const handlePreviewTemplate = async () => {
    try {
      const result = await templatePreview.mutateAsync({
        templateBody
      });
      setResolvedResult({ resolvedTemplate: result.previewTemplate, variables: [] });
      toast({
        title: "Anteprima generata",
        description: "Template processato con dati di esempio"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nella generazione anteprima",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiato",
      description: "Template copiato negli appunti"
    });
  };

  const setExampleTemplate = (type: 'invoice' | 'reminder' | 'welcome') => {
    const templates = {
      invoice: `Ciao {{customer.name}},

La tua fattura di €{{movement.amount}} è pronta!

Dettagli:
- Data: {{movement.date}}
- Descrizione: {{movement.description}}
- Azienda: {{company.name}}

Per informazioni: {{company.email}}`,

      reminder: `Gentile {{customer.name}},

Ti ricordiamo il pagamento di €{{movement.amount}} in scadenza.

Dettagli movimento:
- Data: {{movement.date}}
- Descrizione: {{movement.description}}

Per assistenza contatta {{company.phone}}.

Cordiali saluti,
{{company.name}}`,

      welcome: `Benvenuto in {{company.name}}!

Ciao {{customer.name}}, siamo felici di averti come cliente.

I nostri contatti:
- Email: {{company.email}}
- Telefono: {{company.phone}}
- Indirizzo: {{company.address}}

Data registrazione: {{system.current_date}}`
    };

    setTemplateBody(templates[type]);
    setResolvedResult(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5" />
            Tester Template WhatsApp
          </CardTitle>
          <CardDescription>
            Testa i template con variabili dinamiche usando dati reali dal sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Examples */}
          <div>
            <h4 className="font-medium mb-3">Template di Esempio</h4>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setExampleTemplate('invoice')}
              >
                Fattura
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setExampleTemplate('reminder')}
              >
                Promemoria
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setExampleTemplate('welcome')}
              >
                Benvenuto
              </Button>
            </div>
          </div>

          <Separator />

          {/* Context Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Azienda</label>
              <Select
                value={context.companyId || ''}
                onValueChange={(value) => setContext({...context, companyId: value || undefined})}
                disabled={entitiesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona azienda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nessuna azienda</SelectItem>
                  {companies.map((company: any) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Cliente</label>
              <Select
                value={context.customerId || ''}
                onValueChange={(value) => setContext({...context, customerId: value || undefined})}
                disabled={entitiesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nessun cliente</SelectItem>
                  {customers.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Fornitore</label>
              <Select
                value={context.supplierId || ''}
                onValueChange={(value) => setContext({...context, supplierId: value || undefined})}
                disabled={entitiesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona fornitore" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nessun fornitore</SelectItem>
                  {suppliers.map((supplier: any) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Movimento</label>
              <Select
                value={context.movementId || ''}
                onValueChange={(value) => setContext({...context, movementId: value || undefined})}
                disabled={entitiesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona movimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nessun movimento</SelectItem>
                  {movements.map((movement: any) => (
                    <SelectItem key={movement.id} value={movement.id}>
                      {movement.description} - €{movement.amount}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Template Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">Template WhatsApp</label>
            <Textarea
              value={templateBody}
              onChange={(e) => setTemplateBody(e.target.value)}
              placeholder="Scrivi il tuo template con variabili dinamiche..."
              className="min-h-32"
            />
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                <Lightbulb className="w-3 h-3 mr-1" />
                Usa variabili come {`{{customer.name}}, {{company.email}}, {{movement.amount}}`}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleResolveTemplate}
              disabled={templateResolver.isPending || !templateBody.trim()}
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {templateResolver.isPending ? 'Risolvendo...' : 'Risolvi con Dati Reali'}
            </Button>
            <Button 
              variant="outline"
              onClick={handlePreviewTemplate}
              disabled={templatePreview.isPending || !templateBody.trim()}
              className="flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              {templatePreview.isPending ? 'Generando...' : 'Anteprima con Esempi'}
            </Button>
          </div>

          {/* Results */}
          {resolvedResult && (
            <div className="space-y-4">
              <Separator />
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Risultato</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(resolvedResult.resolvedTemplate)}
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copia
                  </Button>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm">
                    {resolvedResult.resolvedTemplate}
                  </pre>
                </div>
              </div>

              {/* Variables Used */}
              {resolvedResult.variables && resolvedResult.variables.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Variabili Risolte</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {resolvedResult.variables.map((variable: any, index: number) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950 rounded"
                      >
                        <code className="text-sm text-blue-700 dark:text-blue-300">
                          {variable.key}
                        </code>
                        <span className="text-sm font-medium">
                          {variable.formatted || variable.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {resolvedResult.errors && resolvedResult.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Errori
                  </h4>
                  <div className="space-y-1">
                    {resolvedResult.errors.map((error: string, index: number) => (
                      <div 
                        key={index}
                        className="text-sm text-red-600 bg-red-50 dark:bg-red-950 p-2 rounded"
                      >
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}