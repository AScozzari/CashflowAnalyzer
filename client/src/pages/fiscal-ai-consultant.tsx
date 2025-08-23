import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Brain, 
  Send, 
  MessageCircle, 
  FileText, 
  Upload,
  Paperclip,
  Clock,
  User,
  Bot,
  Plus,
  Settings,
  Trash2,
  Eye,
  Download,
  Search,
  Globe,
  TrendingUp,
  BarChart3,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Header from '@/components/layout/header';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: Array<{
    title: string;
    description: string;
    priority: string;
    impact: string;
    actionRequired: string;
  }>;
  references?: string[];
  confidence?: number;
}


interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export function FiscalAIConsultant() {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string>('new');
  const [activeTab, setActiveTab] = useState('chat');
  
  // Ottimizzazione state
  const [webContext, setWebContext] = useState('');
  const [documentContext, setDocumentContext] = useState<File | null>(null);
  const [contextQuery, setContextQuery] = useState('');
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for fetching conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/fiscal-ai/conversations'],
    queryFn: () => fetch('/api/fiscal-ai/conversations', { credentials: 'include' }).then(res => res.json())
  });

  // Query for fetching messages of active conversation
  const { data: conversationMessages = [] } = useQuery({
    queryKey: ['/api/fiscal-ai/conversations', activeConversationId, 'messages'],
    queryFn: () => {
      if (activeConversationId === 'new') return [];
      return fetch(`/api/fiscal-ai/conversations/${activeConversationId}/messages`, { credentials: 'include' })
        .then(res => res.json())
        .then(messages => messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          suggestions: msg.metadata?.suggestions || [],
          references: msg.metadata?.references || [],
          confidence: msg.metadata?.confidence || 0.8
        })));
    },
    enabled: activeConversationId !== 'new'
  });

  // Sync messages when conversation changes
  useEffect(() => {
    if (activeConversationId === 'new') {
      setMessages([]);
    } else {
      setMessages(conversationMessages);
    }
  }, [activeConversationId, conversationMessages]);

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await fetch('/api/fiscal-ai/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fiscal-ai/conversations'] });
    }
  });

  // Create message mutation
  const createMessageMutation = useMutation({
    mutationFn: async ({ conversationId, role, content, metadata }: { 
      conversationId: string; 
      role: string; 
      content: string; 
      metadata?: any 
    }) => {
      const response = await fetch(`/api/fiscal-ai/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content, metadata }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/fiscal-ai/conversations', activeConversationId, 'messages'] 
      });
    }
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await fetch(`/api/fiscal-ai/conversations/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete conversation');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fiscal-ai/conversations'] });
    }
  });

  // Chat mutation with persistence
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/fiscal-ai/advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: message }),
        credentials: 'include'
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
    onSuccess: async (data, originalMessage) => {
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
      
      try {
        let currentConversationId = activeConversationId;
        
        // Create new conversation if it's the first exchange
        if (activeConversationId === 'new') {
          const title = originalMessage.substring(0, 40) + '...' || 'Nuova Conversazione';
          const newConversation = await createConversationMutation.mutateAsync(title);
          currentConversationId = newConversation.id;
          setActiveConversationId(currentConversationId);
        }
        
        // Save user message to database
        await createMessageMutation.mutateAsync({
          conversationId: currentConversationId,
          role: 'user',
          content: originalMessage
        });
        
        // Save assistant message to database
        await createMessageMutation.mutateAsync({
          conversationId: currentConversationId,
          role: 'assistant',
          content: data.answer || 'Risposta ricevuta',
          metadata: {
            suggestions: data.suggestions || [],
            references: data.references || [],
            confidence: data.confidence || 0.8
          }
        });
        
      } catch (error) {
        console.error('Error saving messages:', error);
        toast({
          title: "Avviso",
          description: "Conversazione non salvata automaticamente",
          variant: "destructive"
        });
      }
      
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

  // Ottimizzazione mutations
  const naturalLanguageQueryMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest('POST', '/api/ai/natural-language-query', { query });
      return response.json();
    },
    onSuccess: (data) => {
      setOptimizationResults(data);
      toast({
        title: "✅ Query Eseguita",
        description: `Trovati ${data.resultCount} risultati`,
      });
    },
  });

  const contextOptimizationMutation = useMutation({
    mutationFn: async ({ webContext, query }: { webContext: string; query: string }) => {
      const response = await apiRequest('POST', '/api/ai/optimize-context', { 
        webContext, 
        query,
        includeWebSearch: !!webContext
      });
      return response.json();
    },
    onSuccess: (data) => {
      setOptimizationResults(data);
      toast({
        title: "🔍 Contesto Ottimizzato",
        description: "Il contesto è stato migliorato con successo",
      });
    },
  });

  const documentUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      const response = await fetch('/api/fiscal-ai/upload-document', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Upload fallito');
      return response.json();
    },
    onSuccess: (data) => {
      setOptimizationResults(data);
      toast({
        title: "📄 Documento Analizzato",
        description: "L'analisi del documento è stata completata",
      });
    },
  });

  const chartGenerationMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest('POST', '/api/ai/generate-chart', { query });
      return response.json();
    },
    onSuccess: (data) => {
      setOptimizationResults(data);
      toast({
        title: "📊 Grafico Generato",
        description: "Il grafico è stato creato con successo",
      });
    },
  });


  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(inputMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  // Removed updateConversation function - logic moved to onSuccess

  const startNewConversation = () => {
    setMessages([]);
    setActiveConversationId('new');
  };

  const loadConversation = (conversation: any) => {
    setActiveConversationId(conversation.id);
  };

  const deleteConversation = (conversationId: string) => {
    deleteConversationMutation.mutate(conversationId);
    if (activeConversationId === conversationId) {
      startNewConversation();
    }
  };

  // Ottimizzazione handlers
  const handleNaturalLanguageQuery = () => {
    if (!contextQuery.trim()) return;
    naturalLanguageQueryMutation.mutate(contextQuery);
  };

  const handleContextOptimization = () => {
    if (!contextQuery.trim()) return;
    contextOptimizationMutation.mutate({ webContext, query: contextQuery });
  };

  const handleDocumentUpload = () => {
    if (!documentContext) return;
    documentUploadMutation.mutate(documentContext);
  };

  const handleChartGeneration = () => {
    if (!contextQuery.trim()) return;
    chartGenerationMutation.mutate(contextQuery);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentContext(file);
    }
  };

  const suggestedQuestions = [
    "Come funziona l'IRES premiale 2025?",
    "Quali detrazioni posso applicare?", 
    "Come ottimizzare i pagamenti IVA?",
    "Scadenze fiscali 2025 da non perdere?",
    "Agevolazioni per la mia PMI?",
    "Come ridurre il carico fiscale?"
  ];

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header Standard EasyCashFlows */}
      <Header title="Consulente Fiscale AI" subtitle="Specializzato in normative italiane per PMI" />
      
      <div className="flex-1 flex">
      {/* Sidebar - Conversazioni */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header Sidebar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Consulente Fiscale AI</h1>
              <p className="text-xs text-muted-foreground">PMI • Normative 2025</p>
            </div>
          </div>
          <Button 
            onClick={startNewConversation}
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuova Conversazione
          </Button>
        </div>

        {/* Lista Conversazioni */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.map((conversation: any) => (
              <div
                key={conversation.id}
                className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                  activeConversationId === conversation.id ? 'bg-blue-50 border border-blue-200' : ''
                }`}
                onClick={() => loadConversation(conversation)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conversation.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {conversation.messageCount || 0} messaggi
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      deleteConversation(conversation.id);
                    }}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessuna conversazione</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Ottimizzazione AI - Link alla pagina Document Analyzer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Strumenti AI</h3>
            <Settings className="h-4 w-4 text-gray-500" />
          </div>
          <Link to="/document-analyzer">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-left justify-start h-auto p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:from-blue-100 hover:to-purple-100"
            >
              <div className="flex items-center space-x-3 w-full">
                <div className="p-1.5 bg-blue-500 rounded-full">
                  <Brain className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-blue-900">Document Analyzer Pro</p>
                  <p className="text-xs text-blue-700">Ottimizza contesto e analisi documenti</p>
                </div>
              </div>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="flex-1 flex flex-col">
        {/* Navigation Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {activeTab === 'chat' ? (
                  activeConversationId === 'new' ? 'Nuova Conversazione' : 
                  conversations.find((c: any) => c.id === activeConversationId)?.title || 'Conversazione'
                ) : 'Ottimizzazione Contesti AI'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'chat' ? 'Risolvi i tuoi dubbi fiscali con l\'AI' : 'Migliora il contesto per risposte più precise'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/document-analyzer">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>Document Analyzer</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <span>Chat</span>
              </TabsTrigger>
              <TabsTrigger value="optimization" className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Ottimizzazione</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Chat Tab Content */}
          <TabsContent value="chat" className="flex-1 flex flex-col mt-0 space-y-0">

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="h-16 w-16 mx-auto text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Ciao! Sono il tuo Consulente Fiscale AI</h3>
                <p className="text-muted-foreground mb-6">
                  Specializzato in normative fiscali italiane e ottimizzazione per PMI.
                  <br />Fai la tua prima domanda o scegli un suggerimento:
                </p>
                
                <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {suggestedQuestions.map((question, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => setInputMessage(question)}
                      className="text-left justify-start h-auto p-3 whitespace-normal"
                    >
                      <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={message.role === 'user' ? 'bg-gray-500' : 'bg-blue-500'}>
                        {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`rounded-lg p-4 ${
                      message.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border border-gray-200'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium opacity-75">Suggerimenti:</p>
                          {message.suggestions.map((suggestion, idx) => (
                            <div key={idx} className="text-xs p-2 bg-blue-50 rounded border border-blue-200">
                              <p className="font-medium text-blue-900">{suggestion.title}</p>
                              <p className="text-blue-700">{suggestion.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {message.confidence && (
                        <div className="mt-2 text-xs opacity-75">
                          Confidenza: {Math.round(message.confidence * 100)}%
                        </div>
                      )}
                      
                      <p className="text-xs opacity-50 mt-1">
                        {message.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-500">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-2 items-end">
              <div className="flex-1">
                <Textarea
                  data-testid="input-fiscal-chat"
                  placeholder="Scrivi la tua domanda fiscale..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="min-h-[44px] max-h-[120px] resize-none text-sm"
                  disabled={sendMessageMutation.isPending}
                  rows={1}
                />
              </div>
              <div className="flex space-x-1">
                <Button
                  data-testid="button-send-message"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                  className="h-[44px] px-4"
                >
                  {sendMessageMutation.isPending ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
        </TabsContent>

        {/* Optimization Tab Content */}
        <TabsContent value="optimization" className="flex-1 flex flex-col mt-0 space-y-0">
          <div className="flex-1 p-6 space-y-6">
            <div className="max-w-4xl mx-auto">
              {/* Header Ottimizzazione */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">Ottimizzazione Contesti AI</h2>
                <p className="text-muted-foreground">
                  Migliora la precisione delle risposte attraverso web search e analisi documenti
                </p>
              </div>

              {/* Web Context Optimization */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>Contesto Web</span>
                  </CardTitle>
                  <CardDescription>
                    Aggiungi informazioni da fonti web per migliorare il contesto delle risposte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="web-context">URL o fonte web</Label>
                    <Input
                      id="web-context"
                      data-testid="input-web-context"
                      placeholder="https://esempio.com/normativa-fiscale..."
                      value={webContext}
                      onChange={(e) => setWebContext(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="context-query">Query per il contesto</Label>
                    <Textarea
                      id="context-query"
                      data-testid="input-context-query"
                      placeholder="Descri cosa cercare nel web per migliorare il contesto..."
                      value={contextQuery}
                      onChange={(e) => setContextQuery(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button
                    data-testid="button-optimize-context"
                    onClick={handleContextOptimization}
                    disabled={contextOptimizationMutation.isPending || !contextQuery.trim()}
                    className="w-full"
                  >
                    {contextOptimizationMutation.isPending ? (
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Ottimizza Contesto
                  </Button>
                </CardContent>
              </Card>

              {/* Document Upload */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span>Analisi Documenti</span>
                  </CardTitle>
                  <CardDescription>
                    Carica documenti per migliorare il contesto fiscale
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Seleziona documento</Label>
                    <div className="flex items-center space-x-3">
                      <input
                        ref={fileUploadRef}
                        type="file"
                        onChange={handleFileSelect}
                        accept=".pdf,.xml,.jpg,.jpeg,.png,.doc,.docx"
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileUploadRef.current?.click()}
                        className="flex-1"
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        {documentContext ? documentContext.name : 'Scegli File'}
                      </Button>
                    </div>
                  </div>
                  <Button
                    data-testid="button-upload-document"
                    onClick={handleDocumentUpload}
                    disabled={documentUploadMutation.isPending || !documentContext}
                    className="w-full"
                  >
                    {documentUploadMutation.isPending ? (
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Analizza Documento
                  </Button>
                </CardContent>
              </Card>

              {/* Natural Language Query */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="h-5 w-5" />
                    <span>Query Avanzate</span>
                  </CardTitle>
                  <CardDescription>
                    Esegui query complesse sui tuoi dati finanziari
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    data-testid="button-natural-query"
                    onClick={handleNaturalLanguageQuery}
                    disabled={naturalLanguageQueryMutation.isPending || !contextQuery.trim()}
                    className="w-full"
                  >
                    {naturalLanguageQueryMutation.isPending ? (
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TrendingUp className="h-4 w-4 mr-2" />
                    )}
                    Esegui Query Avanzata
                  </Button>
                </CardContent>
              </Card>

              {/* Chart Generation */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Generazione Grafici AI</span>
                  </CardTitle>
                  <CardDescription>
                    Genera grafici intelligenti basati sui tuoi dati
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    data-testid="button-generate-chart"
                    onClick={handleChartGeneration}
                    disabled={chartGenerationMutation.isPending || !contextQuery.trim()}
                    className="w-full"
                  >
                    {chartGenerationMutation.isPending ? (
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <BarChart3 className="h-4 w-4 mr-2" />
                    )}
                    Genera Grafico
                  </Button>
                </CardContent>
              </Card>

              {/* Results Display */}
              {optimizationResults && (
                <Card>
                  <CardHeader>
                    <CardTitle>Risultati Ottimizzazione</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                      {JSON.stringify(optimizationResults, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        </Tabs>
      </div>
      </div>
    </div>
  );
}