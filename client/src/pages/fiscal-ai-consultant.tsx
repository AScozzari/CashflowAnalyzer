import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

interface DocumentUpload {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  analysis?: string;
  extractedData?: any;
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentUpload[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Chat mutation
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
      
      setMessages(prev => {
        const updatedMessages = [...prev, assistantMessage];
        
        // Create new conversation if it's the first exchange
        if (activeConversationId === 'new' && updatedMessages.length === 2) {
          const firstUserMessage = updatedMessages.find(m => m.role === 'user');
          const title = firstUserMessage?.content.substring(0, 40) + '...' || 'Nuova Conversazione';
          
          const newConversation: Conversation = {
            id: `conv_${Date.now()}`,
            title,
            messages: updatedMessages,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          setConversations(prev => [newConversation, ...prev]);
          setActiveConversationId(newConversation.id);
        } else if (activeConversationId !== 'new') {
          // Update existing conversation
          setConversations(prev => prev.map(conv => 
            conv.id === activeConversationId 
              ? { ...conv, messages: updatedMessages, updatedAt: new Date() }
              : conv
          ));
        }
        
        return updatedMessages;
      });
      
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
    if (!inputMessage.trim() || sendMessageMutation.isPending) return;
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

  // Removed updateConversation function - logic moved to onSuccess

  const startNewConversation = () => {
    setMessages([]);
    setActiveConversationId('new');
  };

  const loadConversation = (conversation: Conversation) => {
    setMessages(conversation.messages);
    setActiveConversationId(conversation.id);
  };

  const deleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    if (activeConversationId === conversationId) {
      startNewConversation();
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
    <div className="h-screen bg-gray-50 flex">
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
            {conversations.map((conversation) => (
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
                      {conversation.messages.length} messaggi
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
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

        {/* Documenti Caricati */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Documenti</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-6 w-6 p-0"
            >
              <Upload className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {uploadedDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center space-x-2 text-xs p-2 bg-gray-50 rounded">
                <FileText className="h-3 w-3 text-blue-500" />
                <span className="flex-1 truncate">{doc.name}</span>
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                  <Eye className="h-2 w-2" />
                </Button>
              </div>
            ))}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.xml"
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-500 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">Consulente Fiscale AI</h2>
                <p className="text-xs text-muted-foreground">Sempre online • Specialista PMI</p>
              </div>
            </div>
          </div>
        </div>

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
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadDocumentMutation.isPending}
                  className="h-[44px] w-[44px] p-0"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
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
      </div>
    </div>
  );
}