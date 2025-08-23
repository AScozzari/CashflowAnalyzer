import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Sparkles,
  Send,
  MessageCircle,
  Upload,
  Link,
  Paperclip,
  RotateCw,
  Trash2,
  Eye,
  User
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    impact: string;
    actionRequired: string;
  }>;
  references?: string[];
  confidence?: number;
}

interface DocumentUpload {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  analysis?: string;
  extractedData?: any;
}

interface WebSource {
  id: string;
  url: string;
  title: string;
  description: string;
  addedAt: Date;
  status: 'active' | 'processing' | 'error';
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
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Optimization tab state
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentUpload[]>([]);
  const [webSources, setWebSources] = useState<WebSource[]>([]);
  const [newWebSource, setNewWebSource] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get fiscal analysis
  const { data: analysis, isLoading: analysisLoading } = useQuery<FiscalAnalysis>({
    queryKey: ['/api/fiscal-ai/analysis'],
    enabled: true
  });

  // Chat mutations
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/fiscal-ai/advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: message })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return response.json();
    },
    onMutate: (message: string) => {
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      setIsTyping(true);
    },
    onSuccess: (data) => {
      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'Risposta ricevuta',
        timestamp: new Date(),
        suggestions: data.suggestions || [],
        references: data.references || [],
        confidence: data.confidence || 0.8
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    },
    onError: () => {
      setIsTyping(false);
      toast({
        title: "Errore",
        description: "Errore nell'invio del messaggio",
        variant: "destructive"
      });
    }
  });
  
  // Document upload mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      
      const response = await fetch('/api/fiscal-ai/upload-document', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload document');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const newDoc: DocumentUpload = {
        id: data.id,
        name: data.name,
        type: data.type,
        size: data.size,
        uploadedAt: new Date(),
        analysis: data.analysis,
        extractedData: data.extractedData
      };
      setUploadedDocuments(prev => [...prev, newDoc]);
      toast({
        title: "Successo",
        description: "Documento caricato e analizzato con successo"
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nel caricamento del documento",
        variant: "destructive"
      });
    }
  });

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    sendMessageMutation.mutate(inputMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadDocumentMutation.mutate(file);
    }
  };

  const handleAddWebSource = () => {
    if (!newWebSource.trim()) return;
    
    const newSource: WebSource = {
      id: `web_${Date.now()}`,
      url: newWebSource,
      title: `Fonte Web ${webSources.length + 1}`,
      description: 'Fonte web aggiunta per contesto',
      addedAt: new Date(),
      status: 'active'
    };
    
    setWebSources(prev => [...prev, newSource]);
    setNewWebSource('');
    toast({
      title: "Fonte aggiunta",
      description: "La fonte web è stata aggiunta al contesto AI"
    });
  };

  const suggestedQuestions = [
    "Quali sono le scadenze fiscali più importanti per il mio settore?",
    "Come posso ottimizzare il carico fiscale della mia PMI?",
    "Ci sono agevolazioni fiscali 2025 di cui posso beneficiare?",
    "Come funziona l'IRES premiale e posso accedervi?",
    "Quali sono i requisiti per le deduzioni Industria 4.0?"
  ];

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
          <TabsTrigger value="chat">
            <MessageCircle className="h-4 w-4 mr-2" />
            Consulente AI
          </TabsTrigger>
          <TabsTrigger value="optimizations">
            <Sparkles className="h-4 w-4 mr-2" />
            Ottimizzazione
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analisi Fiscale
          </TabsTrigger>
        </TabsList>

        {/* Analisi Fiscale */}
        {/* Chat AI Interface */}
        <TabsContent value="chat" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
            {/* Chat Area */}
            <div className="lg:col-span-3 flex flex-col h-full">
              <Card className="flex-1 flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <MessageCircle className="h-5 w-5" />
                      <span>Consulente Fiscale AI</span>
                    </CardTitle>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Online
                    </Badge>
                  </div>
                  <CardDescription>
                    Esperto in normative fiscali italiane 2025 per PMI
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-4">
                  {/* Messages */}
                  <ScrollArea className="flex-1 mb-4">
                    <div className="space-y-4 pr-4">
                      {messages.length === 0 && (
                        <div className="text-center py-8">
                          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">
                            Ciao! Sono il tuo consulente fiscale AI specializzato in PMI italiane.
                            <br />Come posso aiutarti oggi?
                          </p>
                        </div>
                      )}
                      
                      {messages.map((message) => (
                        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800'} rounded-lg p-3`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            
                            {message.suggestions && message.suggestions.length > 0 && (
                              <div className="mt-3 space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">Suggerimenti:</p>
                                {message.suggestions.map((suggestion, idx) => (
                                  <div key={idx} className="text-xs p-2 bg-white/10 rounded border">
                                    <p className="font-medium">{suggestion.title}</p>
                                    <p className="text-muted-foreground">{suggestion.description}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {message.confidence && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Confidenza: {Math.round(message.confidence * 100)}%
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>
                  
                  {/* Input Area */}
                  <div className="border-t pt-4">
                    <div className="flex space-x-2">
                      <Textarea 
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Scrivi la tua domanda fiscale..."
                        className="flex-1 min-h-[60px] resize-none"
                        disabled={sendMessageMutation.isPending}
                      />
                      <div className="flex flex-col space-y-2">
                        <Button 
                          onClick={handleSendMessage}
                          disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                          size="sm"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Suggested Questions Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Domande Suggerite</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {suggestedQuestions.map((question, idx) => (
                      <Button 
                        key={idx}
                        variant="ghost" 
                        size="sm"
                        className="w-full text-left h-auto p-2 text-xs"
                        onClick={() => setInputMessage(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Analysis Tab - Placeholder */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Analisi Fiscale Automatizzata</span>
              </CardTitle>
              <CardDescription>
                Sistema di analisi AI della situazione fiscale aziendale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Calculator className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Funzionalità in Sviluppo</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  L'analisi fiscale automatizzata è attualmente in fase di sviluppo. 
                  Utilizza il chat AI per ottenere consulenze fiscali personalizzate.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const tabsTrigger = document.querySelector('[data-state="active"]')?.parentElement?.querySelector('[value="chat"]') as HTMLElement;
                    tabsTrigger?.click();
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Usa Chat Consulente AI
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat AI Professionale */}
        <TabsContent value="chat" className="space-y-6">
          {/* Chat Interface principale - stile ChatGPT */}
          <div className="space-y-4">
            {/* Storico conversazioni */}
            <div className="bg-white border rounded-lg min-h-[500px] max-h-[600px] overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Brain className="h-12 w-12 text-blue-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Consulente Fiscale AI</h3>
                  <p className="text-muted-foreground mb-6">Esperto in normative fiscali italiane. Fai la tua prima domanda!</p>
                  
                  {/* Suggerimenti veloci cliccabili */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl">
                    {[
                      "Come funziona l'IRES premiale 2025?",
                      "Quali detrazioni posso applicare?",
                      "Come ottimizzare i pagamenti IVA?",
                      "Scadenze fiscali 2025 da non perdere?"
                    ].map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => setInputMessage(suggestion)}
                        className="text-left justify-start h-auto p-3 whitespace-normal"
                      >
                        <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="flex items-start space-x-2">
                          {message.role === 'assistant' && <Brain className="h-4 w-4 mt-1 flex-shrink-0" />}
                          <div className="flex-1">
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {new Date(message.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            
                            {/* Suggerimenti seguiti (solo per l'AI) */}
                            {message.role === 'assistant' && message.suggestions && (
                              <div className="mt-3 space-y-2">
                                <p className="text-xs font-medium opacity-80">Suggerimenti correlati:</p>
                                <div className="flex flex-wrap gap-1">
                                  {message.suggestions.slice(0, 3).map((suggestion, idx) => (
                                    <Button
                                      key={idx}
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setInputMessage(suggestion.title)}
                                      className="text-xs h-auto p-1.5 border-current"
                                    >
                                      {suggestion.title}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          {message.role === 'user' && <User className="h-4 w-4 mt-1 flex-shrink-0" />}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Indicatore di digitazione */}
                  {sendMessageMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Brain className="h-4 w-4" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Input area */}
            <div className="flex space-x-2">
              <div className="flex-1">
                <Textarea
                  data-testid="input-fiscal-chat"
                  placeholder="Scrivi la tua domanda al Consulente Fiscale AI..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="min-h-[60px] resize-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (inputMessage.trim()) {
                        handleSendMessage();
                      }
                    }
                  }}
                />
              </div>
              <Button
                data-testid="button-send-message"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                className="h-[60px] px-4"
              >
                {sendMessageMutation.isPending ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Sezioni rimosse - ora usiamo solo la chat integrata */}
        </TabsContent>

        {/* Ottimizzazioni Dettagliate */}
        <TabsContent value="optimizations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Carica Documenti</span>
                </CardTitle>
                <CardDescription>
                  Carica documenti fiscali, bilanci, fatture per analisi AI migliorata
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Trascina qui i tuoi documenti o clicca per caricare
                  </p>
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadDocumentMutation.isPending}
                  >
                    {uploadDocumentMutation.isPending ? (
                      <>
                        <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                        Caricamento...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Seleziona Documento
                      </>
                    )}
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.xml"
                  />
                </div>
                
                {/* Uploaded Documents */}
                {uploadedDocuments.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Documenti Caricati</h4>
                    {uploadedDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium text-sm">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(doc.size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploadedAt).toLocaleDateString('it-IT')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {doc.analysis && (
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={() => {
                            setUploadedDocuments(prev => prev.filter(d => d.id !== doc.id));
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Web Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Link className="h-5 w-5" />
                  <span>Fonti Web</span>
                </CardTitle>
                <CardDescription>
                  Aggiungi fonti web specializzate per contesto fiscale avanzato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input 
                    value={newWebSource}
                    onChange={(e) => setNewWebSource(e.target.value)}
                    placeholder="https://esempio.com/normativa-fiscale"
                    className="flex-1"
                  />
                  <Button onClick={handleAddWebSource} disabled={!newWebSource.trim()}>
                    <Link className="h-4 w-4 mr-2" />
                    Aggiungi
                  </Button>
                </div>
                
                {/* Suggested Sources */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Fonti Consigliate</h4>
                  {[
                    { url: "https://www.agenziaentrate.gov.it", title: "Agenzia delle Entrate" },
                    { url: "https://www.finanze.gov.it", title: "Ministero dell'Economia" },
                    { url: "https://www.gazzettaufficiale.it", title: "Gazzetta Ufficiale" },
                    { url: "https://fiscoetasse.com", title: "Fisco e Tasse" }
                  ].map((source, idx) => (
                    <Button 
                      key={idx}
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setNewWebSource(source.url)}
                    >
                      <Link className="h-4 w-4 mr-2" />
                      {source.title}
                    </Button>
                  ))}
                </div>

                {/* Added Web Sources */}
                {webSources.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Fonti Attive</h4>
                    {webSources.map((source) => (
                      <div key={source.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Link className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium text-sm">{source.title}</p>
                            <p className="text-xs text-muted-foreground">{source.url}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline" 
                            className={source.status === 'active' ? 'text-green-600' : 'text-gray-600'}
                          >
                            {source.status === 'active' ? 'Attiva' : 'In elaborazione'}
                          </Badge>
                          <Button size="sm" variant="destructive" onClick={() => {
                            setWebSources(prev => prev.filter(s => s.id !== source.id));
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Optimization Summary */}
          {(uploadedDocuments.length > 0 || webSources.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5" />
                  <span>Contesto AI Migliorato</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <FileText className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                    <p className="font-bold text-lg">{uploadedDocuments.length}</p>
                    <p className="text-sm text-muted-foreground">Documenti Analizzati</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Link className="h-8 w-8 mx-auto text-green-500 mb-2" />
                    <p className="font-bold text-lg">{webSources.length}</p>
                    <p className="text-sm text-muted-foreground">Fonti Web Attive</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Brain className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                    <p className="font-bold text-lg">{Math.round((uploadedDocuments.length + webSources.length) * 15)}%</p>
                    <p className="text-sm text-muted-foreground">Precisione AI</p>
                  </div>
                </div>
                
                <Alert className="mt-4">
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    Il consulente AI ora ha accesso a {uploadedDocuments.length} documenti aziendali e {webSources.length} fonti web specializzate. 
                    Le risposte saranno più precise e personalizzate per la tua situazione specifica.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}