import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Loader2, Trash2, Settings, Plus, MoreHorizontal, Copy, ThumbsUp, ThumbsDown, Zap, MessageSquare } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tokensUsed?: number;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  createdAt: string;
  messageCount: number;
}

export function AiChat() {
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Generate new session ID
  const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Fetch chat sessions
  const { data: sessions = [] } = useQuery<ChatSession[]>({
    queryKey: ['/api/ai/chat/sessions'],
    retry: false,
  });

  // Fetch messages for current session
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/ai/chat/messages', currentSessionId],
    enabled: !!currentSessionId,
    retry: false,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, sessionId }: { message: string; sessionId: string }) => {
      const response = await apiRequest('POST', '/api/ai/chat', {
        message,
        sessionId,
        context: {
          timestamp: new Date().toISOString(),
          source: 'chat_interface'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore invio messaggio');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate chat queries to refresh messages
      queryClient.invalidateQueries({ queryKey: ['/api/ai/chat/messages', currentSessionId] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/chat/sessions'] });
      
      setIsTyping(false);
      setCurrentMessage("");
      
      toast({
        title: "Messaggio inviato",
        description: `Risposta generata (${data.tokensUsed} token utilizzati)`,
      });
    },
    onError: (error: any) => {
      setIsTyping(false);
      toast({
        title: "Errore invio messaggio",
        description: error.message || "Impossibile inviare il messaggio",
        variant: "destructive",
      });
    },
  });

  // Clear session mutation
  const clearSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest('DELETE', `/api/ai/chat/sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error('Errore eliminazione sessione');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/chat/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/chat/messages'] });
      setCurrentSessionId(null);
      toast({
        title: "Sessione eliminata",
        description: "La cronologia chat è stata cancellata",
      });
    },
  });

  // Handle send message
  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const sessionId = currentSessionId || generateSessionId();
    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
    }

    setIsTyping(true);
    sendMessageMutation.mutate({
      message: currentMessage.trim(),
      sessionId
    });
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Start new session
  const startNewSession = () => {
    setCurrentSessionId(generateSessionId());
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-select first session if none selected
  useEffect(() => {
    if (!currentSessionId && sessions.length > 0) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions, currentSessionId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px]">
      {/* Sessions Sidebar - ChatGPT Style */}
      <Card className="lg:col-span-1 bg-muted/20 border-muted">
        <CardHeader className="pb-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Conversazioni</CardTitle>
            <Button 
              onClick={startNewSession} 
              size="sm" 
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-background"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[580px]">
            <div className="p-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setCurrentSessionId(session.id)}
                  className={cn(
                    "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1",
                    currentSessionId === session.id
                      ? 'bg-primary/10 border border-primary/20 shadow-sm'
                      : 'hover:bg-background/80'
                  )}
                >
                  <div className="flex-shrink-0">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      currentSessionId === session.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted-foreground/20'
                    )}>
                      <MessageSquare className="w-3 h-3" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate mb-1">
                      {session.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{session.messageCount} msg</span>
                      <span>•</span>
                      <span>
                        {session.createdAt && !isNaN(new Date(session.createdAt).getTime())
                          ? format(new Date(session.createdAt), 'dd/MM')
                          : 'N/D'
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearSessionMutation.mutate(session.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {sessions.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  <div className="w-12 h-12 mx-auto mb-4 bg-muted/30 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium mb-1">Nessuna conversazione</p>
                  <p className="text-xs">Clicca + per iniziare</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area - Enhanced Design */}
      <Card className="lg:col-span-3 flex flex-col bg-background border shadow-lg">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">EasyCashFlows AI</CardTitle>
                <p className="text-xs text-muted-foreground">Assistente finanziario intelligente</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                GPT-4o-mini
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Caricamento messaggi...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center max-w-md mx-auto p-8">
                  <div className="w-16 h-16 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Bot className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Benvenuto in EasyCashFlows AI</h3>
                  <p className="text-sm mb-6 leading-relaxed">
                    Il tuo assistente intelligente per analisi finanziarie avanzate, 
                    gestione del flusso di cassa e consigli strategici aziendali.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Inizia una conversazione utilizzando uno dei suggerimenti qui sotto
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`group flex gap-4 px-4 py-6 ${
                      message.role === 'user' 
                        ? 'bg-background' 
                        : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-green-500 text-white'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm">
                          {message.role === 'user' ? 'Tu' : 'EasyCashFlows AI'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp && !isNaN(new Date(message.timestamp).getTime()) 
                            ? format(new Date(message.timestamp), 'HH:mm')
                            : 'Ora non disponibile'
                          }
                        </span>
                        {message.tokensUsed && (
                          <Badge variant="outline" className="text-xs">
                            {message.tokensUsed} token
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </div>
                      
                      {/* Action buttons for AI messages */}
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => navigator.clipboard.writeText(message.content)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copia
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                          >
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            Utile
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                          >
                            <ThumbsDown className="w-3 h-3 mr-1" />
                            Migliora
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator - ChatGPT Style */}
                {isTyping && (
                  <div className="flex gap-4 px-4 py-6 bg-muted/30">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm">EasyCashFlows AI</span>
                        <span className="text-xs text-muted-foreground">sta scrivendo...</span>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area - ChatGPT Style */}
          <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="relative max-w-4xl mx-auto">
              <div className="relative flex items-end gap-3 bg-muted/50 rounded-3xl p-2 border shadow-sm">
                <Textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Messaggio per EasyCashFlows AI..."
                  disabled={sendMessageMutation.isPending || isTyping}
                  className="flex-1 min-h-[24px] max-h-32 resize-none border-0 bg-transparent px-3 py-3 text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                  rows={1}
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || sendMessageMutation.isPending || isTyping}
                  size="sm"
                  className="rounded-full w-8 h-8 p-0 shrink-0"
                  data-testid="button-send-message"
                >
                  {sendMessageMutation.isPending || isTyping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Quick Suggestions - ChatGPT Style */}
            {messages.length === 0 && !isTyping && (
              <div className="max-w-4xl mx-auto mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <Button
                    onClick={() => setCurrentMessage("Fammi un riassunto della situazione finanziaria attuale con dati del database")}
                    variant="ghost"
                    className="h-auto p-3 text-left justify-start bg-muted/30 hover:bg-muted/50 rounded-2xl border"
                    disabled={sendMessageMutation.isPending}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-500" />
                      <span>Riassunto situazione finanziaria</span>
                    </div>
                  </Button>
                  <Button
                    onClick={() => setCurrentMessage("Analizza gli ultimi movimenti e mostrami i trend più importanti")}
                    variant="ghost"
                    className="h-auto p-3 text-left justify-start bg-muted/30 hover:bg-muted/50 rounded-2xl border"
                    disabled={sendMessageMutation.isPending}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-green-500" />
                      <span>Analisi movimenti recenti</span>
                    </div>
                  </Button>
                  <Button
                    onClick={() => setCurrentMessage("Suggerisci strategie per ottimizzare il flusso di cassa aziendale")}
                    variant="ghost"
                    className="h-auto p-3 text-left justify-start bg-muted/30 hover:bg-muted/50 rounded-2xl border"
                    disabled={sendMessageMutation.isPending}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-500" />
                      <span>Consigli ottimizzazione</span>
                    </div>
                  </Button>
                  <Button
                    onClick={() => setCurrentMessage("Prevedi l'andamento finanziario per i prossimi 6 mesi")}
                    variant="ghost"
                    className="h-auto p-3 text-left justify-start bg-muted/30 hover:bg-muted/50 rounded-2xl border"
                    disabled={sendMessageMutation.isPending}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-orange-500" />
                      <span>Previsioni future</span>
                    </div>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}