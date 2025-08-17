import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare, Copy, Eye, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function WhatsAppVariablesExplained() {
  const { toast } = useToast();

  const copyTemplate = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiato!",
      description: "Template copiato negli appunti"
    });
  };

  const examples = [
    {
      title: "Sollecito Pagamento",
      template: "Ciao {{1}}, ti ricordiamo il pagamento di {{2}} entro il {{3}}. Grazie!",
      variables: [
        { num: "{{1}}", meaning: "Nome cliente", example: "Mario Rossi" },
        { num: "{{2}}", meaning: "Importo dovuto", example: "€ 1.250,00" },
        { num: "{{3}}", meaning: "Data scadenza", example: "31/12/2024" }
      ],
      result: "Ciao Mario Rossi, ti ricordiamo il pagamento di € 1.250,00 entro il 31/12/2024. Grazie!"
    },
    {
      title: "Conferma Ordine",
      template: "Grazie {{1}}! Ordine {{2}} confermato per {{3}}. Consegna prevista: {{4}}",
      variables: [
        { num: "{{1}}", meaning: "Nome cliente", example: "Giulia Bianchi" },
        { num: "{{2}}", meaning: "Numero ordine", example: "#ORD-2024-001" },
        { num: "{{3}}", meaning: "Valore ordine", example: "€ 850,00" },
        { num: "{{4}}", meaning: "Data consegna", example: "15/12/2024" }
      ],
      result: "Grazie Giulia Bianchi! Ordine #ORD-2024-001 confermato per € 850,00. Consegna prevista: 15/12/2024"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-green-100 dark:bg-green-900 rounded-lg p-6 max-w-3xl mx-auto">
          <MessageSquare className="h-10 w-10 text-green-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Come Funzionano le Variabili WhatsApp
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Sistema semplice per personalizzare automaticamente i tuoi messaggi WhatsApp
          </p>
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:bg-green-800 dark:text-green-200">
            Le variabili devono essere sequenziali: {'{'}{'{'}{1}{'}'}{'}'},  {'{'}{'{'}{2}{'}'}{'}'},  {'{'}{'{'}{3}{'}'}{'}'},  ecc.
          </Badge>
        </div>
      </div>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Come Funziona in Pratica
          </CardTitle>
          <CardDescription>
            Processo step-by-step per usare le variabili nei template WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-semibold mb-2">Scrivi il Template</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Crea il messaggio usando {'{'}{'{'}{1}{'}'}{'}'},  {'{'}{'{'}{2}{'}'}{'}'},  {'{'}{'{'}{3}{'}'}{'}'}  dove vuoi inserire dati dinamici
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h4 className="font-semibold mb-2">Configura le Variabili</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nel tab "Variabili" definisci cosa rappresenta ogni {'{'}{'{'}{1}{'}'}{'}'},  {'{'}{'{'}{2}{'}'}{'}'},  ecc.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h4 className="font-semibold mb-2">Invio Automatico</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Il sistema sostituisce automaticamente le variabili con i dati reali quando invia il messaggio
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Examples */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Esempi Pratici</h4>
        {examples.map((example, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{example.title}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyTemplate(example.template)}
                  data-testid={`button-copy-example-${index}`}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copia Template
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Template:</Label>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg font-mono text-sm mt-1">
                  {example.template}
                </div>
              </div>

              {/* Variables Definition */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Significato Variabili:</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {example.variables.map((variable, vIndex) => (
                    <div key={vIndex} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900 rounded">
                      <Badge variant="outline" className="font-mono">
                        {variable.num}
                      </Badge>
                      <span className="text-sm">=</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{variable.meaning}</div>
                        <div className="text-xs text-gray-500">es: {variable.example}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Result */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Risultato Finale:</Label>
                <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 p-3 rounded-lg mt-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">WhatsApp Message</span>
                  </div>
                  <p className="text-sm">{example.result}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Important Notes */}
      <Alert>
        <Eye className="h-4 w-4" />
        <AlertDescription>
          <strong>Regole Importanti:</strong><br />
          • Le variabili devono essere sequenziali: {'{'}{'{'}{1}{'}'}{'}'},  {'{'}{'{'}{2}{'}'}{'}'},  {'{'}{'{'}{3}{'}'}{'}'}  (non puoi saltare numeri)<br />
          • Ogni template può avere variabili diverse con significati diversi<br />
          • Nel tab "Variabili" puoi configurare cosa rappresenta ogni numero<br />
          • Il sistema sostituisce automaticamente le variabili quando invia i messaggi
        </AlertDescription>
      </Alert>
    </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={className}>{children}</label>;
}