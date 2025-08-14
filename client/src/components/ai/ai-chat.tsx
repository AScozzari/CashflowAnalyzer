import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Send, Bot, User, Loader2, Trash2, Settings } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
      {/* Sessions Sidebar */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Chat Sessions</CardTitle>
            <Button onClick={startNewSession} size="sm" variant="outline">
              Nuova Chat
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[480px]">
            <div className="space-y-2 p-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setCurrentSessionId(session.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    currentSessionId === session.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <div className="font-medium text-sm truncate">{session.title}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {session.messageCount} messaggi
                  </div>
                  <div className="text-xs opacity-50">
                    {format(new Date(session.createdAt), 'dd/MM HH:mm')}
                  </div>
                </div>
              ))}
              
              {sessions.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nessuna chat iniziata</p>
                  <p className="text-xs">Inizia una nuova conversazione</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="lg:col-span-3 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Assistant
            </CardTitle>
            <div className="flex gap-2">
              {currentSessionId && (
                <Button
                  onClick={() => clearSessionMutation.mutate(currentSessionId)}
                  size="sm"
                  variant="outline"
                  disabled={clearSessionMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Badge variant="secondary">GPT-4o-mini</Badge>
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
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">Inizia una conversazione</h3>
                  <p className="text-sm">
                    Chiedi al tuo assistente AI analisi finanziarie, consigli sui flussi di cassa,
                    o qualsiasi domanda sulla gestione aziendale.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex gap-3 max-w-[80%] ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>
                      <div
                        className={`rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs opacity-70">
                            {format(new Date(message.timestamp), 'HH:mm')}
                          </span>
                          {message.tokensUsed && (
                            <Badge variant="outline" className="text-xs">
                              {message.tokensUsed} token
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
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

          {/* Input Area */}
          <Separator />
          <div className="p-4">
            <div className="flex gap-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Scrivi un messaggio al tuo assistente AI..."
                disabled={sendMessageMutation.isPending || isTyping}
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || sendMessageMutation.isPending || isTyping}
                size="sm"
                data-testid="button-send-message"
              >
                {sendMessageMutation.isPending || isTyping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2 mt-3">
              <Button
                onClick={() => setCurrentMessage("Analizza i miei flussi di cassa degli ultimi 3 mesi")}
                size="sm"
                variant="outline"
                className="text-xs"
                disabled={sendMessageMutation.isPending}
              >
                Analisi Flussi
              </Button>
              <Button
                onClick={() => setCurrentMessage("Suggerisci strategie per migliorare la liquidità")}
                size="sm"
                variant="outline"
                className="text-xs"
                disabled={sendMessageMutation.isPending}
              >
                Consigli Liquidità
              </Button>
              <Button
                onClick={() => setCurrentMessage("Prevedi i flussi di cassa per i prossimi 6 mesi")}
                size="sm"
                variant="outline"
                className="text-xs"
                disabled={sendMessageMutation.isPending}
              >
                Previsioni
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}