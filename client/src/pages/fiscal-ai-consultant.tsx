import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, 
  TrendingUp, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Euro,
  FileText,
  Brain,
  Sparkles
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface FiscalAdvice {
  answer: string;
  suggestions: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    impact: string;
    actionRequired: string;
  }>;
  references: string[];
  confidence: number;
}

interface FiscalAnalysis {
  summary: string;
  optimizations: Array<{
    type: string;
    description: string;
    potentialSaving: number;
    requirements: string[];
  }>;
  deadlines: Array<{
    date: string;
    description: string;
    amount?: number;
  }>;
  riskLevel: 'low' | 'medium' | 'high';
  compliance: 'compliant' | 'warning' | 'critical';
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800', 
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const riskColors = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-red-600'
};

const complianceColors = {
  compliant: 'text-green-600',
  warning: 'text-yellow-600',
  critical: 'text-red-600'
};

export function FiscalAIConsultant() {
  const [question, setQuestion] = useState('');
  const [advice, setAdvice] = useState<FiscalAdvice | null>(null);
  const queryClient = useQueryClient();

  // Get fiscal analysis
  const { data: analysis, isLoading: analysisLoading } = useQuery<FiscalAnalysis>({
    queryKey: ['/api/fiscal-ai/analysis'],
    enabled: true
  });

  // Ask question mutation
  const askQuestionMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await fetch('/api/fiscal-ai/advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get fiscal advice');
      }
      
      return response.json();
    },
    onSuccess: (data: FiscalAdvice) => {
      setAdvice(data);
    }
  });

  const handleAskQuestion = () => {
    if (!question.trim()) return;
    askQuestionMutation.mutate(question);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
          <Brain className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Consulente Fiscale AI</h1>
          <p className="text-muted-foreground">
            Specialista AI per PMI italiane • Normative 2025 • Ottimizzazioni fiscali
          </p>
        </div>
      </div>

      <Tabs defaultValue="analysis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analisi Fiscale
          </TabsTrigger>
          <TabsTrigger value="chat">
            <Brain className="h-4 w-4 mr-2" />
            Consulenza AI
          </TabsTrigger>
          <TabsTrigger value="optimizations">
            <Sparkles className="h-4 w-4 mr-2" />
            Ottimizzazioni
          </TabsTrigger>
        </TabsList>

        {/* Analisi Fiscale */}
        <TabsContent value="analysis" className="space-y-6">
          {analysisLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : analysis ? (
            <>
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Situazione Fiscale</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{analysis.summary}</p>
                  
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Rischio:</span>
                      <Badge variant="outline" className={riskColors[analysis.riskLevel]}>
                        {analysis.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Compliance:</span>
                      <Badge variant="outline" className={complianceColors[analysis.compliance]}>
                        {analysis.compliance === 'compliant' ? 'CONFORME' : 
                         analysis.compliance === 'warning' ? 'ATTENZIONE' : 'CRITICO'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scadenze */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>Prossime Scadenze</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.deadlines.map((deadline, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{deadline.description}</p>
                            <p className="text-xs text-muted-foreground">{deadline.date}</p>
                          </div>
                          {deadline.amount && (
                            <Badge variant="secondary">
                              €{deadline.amount.toLocaleString('it-IT')}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Ottimizzazioni */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Ottimizzazioni</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.optimizations.map((opt, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm">{opt.type}</h4>
                            <Badge className="bg-green-100 text-green-800">
                              €{opt.potentialSaving.toLocaleString('it-IT')}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{opt.description}</p>
                          <div className="text-xs">
                            <span className="font-medium">Requisiti: </span>
                            {opt.requirements.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </TabsContent>

        {/* Consulenza AI */}
        <TabsContent value="chat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chiedi al Commercialista AI</CardTitle>
              <CardDescription>
                Fai domande specifiche sulla tua situazione fiscale. L'AI conosce le normative italiane 2025.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">La tua domanda</label>
                <Textarea
                  data-testid="input-fiscal-question"
                  placeholder="Es: Come posso ottimizzare le tasse sulla mia PMI? Posso usufruire dell'IRES premiale?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button
                data-testid="button-ask-question"
                onClick={handleAskQuestion}
                disabled={!question.trim() || askQuestionMutation.isPending}
                className="w-full"
              >
                {askQuestionMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Analizzando...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Chiedi Consiglio
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Risposta AI */}
          {advice && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Consulenza Professionale</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    Confidenza: {Math.round(advice.confidence * 100)}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose max-w-none">
                  <p className="text-sm">{advice.answer}</p>
                </div>

                {/* Suggerimenti */}
                {advice.suggestions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Azioni Consigliate</h4>
                    {advice.suggestions.map((suggestion, index) => (
                      <Alert key={index} className="border-l-4 border-l-blue-500">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <strong className="text-sm">{suggestion.title}</strong>
                              <Badge className={priorityColors[suggestion.priority]}>
                                {suggestion.priority.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                            <div className="text-xs">
                              <span className="font-medium">Impatto: </span>{suggestion.impact}
                            </div>
                            <div className="text-xs">
                              <span className="font-medium">Azione richiesta: </span>{suggestion.actionRequired}
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                {/* Riferimenti normativi */}
                {advice.references.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Riferimenti Normativi</h4>
                    <div className="flex flex-wrap gap-2">
                      {advice.references.map((ref, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {ref}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Domande suggerite */}
          <Card>
            <CardHeader>
              <CardTitle>Domande Comuni</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  "Come funziona l'IRES premiale 2025?",
                  "Quali detrazioni posso applicare?",
                  "Come ottimizzare i pagamenti IVA?",
                  "Che agevolazioni ho per la mia PMI?",
                  "Scadenze fiscali 2025 da non perdere?",
                  "Come ridurre il carico fiscale legalmente?"
                ].map((q, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuestion(q)}
                    className="text-left justify-start text-xs"
                    data-testid={`button-suggested-${index}`}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ottimizzazioni Dettagliate */}
        <TabsContent value="optimizations" className="space-y-6">
          <div className="text-center text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2" />
            <p>Sezione ottimizzazioni in arrivo...</p>
            <p className="text-xs">Include: Analisi automatica deduzioni, timing pagamenti, pianificazione fiscale</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}