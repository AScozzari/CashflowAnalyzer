import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ContactSearchEnhanced } from "./contact-search-enhanced";
import { 
  MessageSquare, 
  Send, 
  Phone,
  Video,
  MoreHorizontal,
  Search,
  Paperclip,
  Smile,
  Mic,
  Bot,
  Clock,
  CheckCheck,
  Brain,
  Zap,
  TrendingUp,
  AlertCircle,
  Plus,
  Settings,
  Users
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'document';
  isOutgoing: boolean;
  delivered: boolean;
  read: boolean;
  aiGenerated?: boolean;
  analysis?: {
    sentiment: 'positive' | 'neutral' | 'negative';
    urgency: 'low' | 'medium' | 'high';
    category: string;
    suggestedResponse?: string;
  };
}

interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  lastMessage?: string;
  lastSeen: string;
  unreadCount: number;
  online: boolean;
  type?: 'resource' | 'customer' | 'supplier';
  company?: string;
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
  aiGenerated?: boolean;
}

export function WhatsAppInterface() {
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [aiAssistanceEnabled, setAiAssistanceEnabled] = useState(true);
  const [autoResponseEnabled, setAutoResponseEnabled] = useState(false);
  const [showMessageAnalysis, setShowMessageAnalysis] = useState(false);
  const { toast } = useToast();

  // Fetch real data
  const { data: whatsappMessages = [], refetch: refetchMessages } = useQuery<WhatsAppMessage[]>({
    queryKey: ['/api/whatsapp/messages', selectedContact?.id],
    enabled: !!selectedContact,
  });

  const { data: whatsappTemplates = [] } = useQuery<WhatsAppTemplate[]>({
    queryKey: ['/api/whatsapp/templates'],
  });

  // Fetch WhatsApp chats/contacts
  const { data: whatsappChats = [] } = useQuery<WhatsAppContact[]>({
    queryKey: ['/api/whatsapp/chats'],
  });

  // AI message analysis mutation
  const analyzeMessageMutation = useMutation({
    mutationFn: (message: string) => 
      apiRequest('/api/ai/analyze-message', 'POST', { 
        message,
        channel: 'whatsapp',
        sender: selectedContact 
      }),
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ content, to }: { content: string; to: string }) =>
      apiRequest('/api/whatsapp/send', 'POST', { content, to }),
    onSuccess: () => {
      setMessageInput("");
      refetchMessages();
      toast({
        title: "Messaggio inviato",
        description: "Il messaggio WhatsApp è stato inviato con successo"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore invio messaggio",
        description: error.message || "Impossibile inviare il messaggio",
        variant: "destructive"
      });
    }
  });

  // Generate AI response mutation
  const generateResponseMutation = useMutation({
    mutationFn: (originalMessage: string) =>
      apiRequest('/api/ai/generate-response', 'POST', {
        message: originalMessage,
        channel: 'whatsapp',
        context: selectedContact
      }),
  });

  // Contact selection handler
  const handleContactSelect = (contact: any) => {
    const whatsappContact: WhatsAppContact = {
      id: contact.id,
      name: contact.name,
      phone: contact.phone || '',
      lastMessage: '',
      lastSeen: 'Mai',
      unreadCount: 0,
      online: false,
      type: contact.type,
      company: contact.company
    };
    setSelectedContact(whatsappContact);
    setShowContactSearch(false);
  };

  // Functions
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedContact?.phone) {
      toast({
        title: "Errore",
        description: "Inserisci un messaggio e seleziona un contatto",
        variant: "destructive"
      });
      return;
    }

    sendMessageMutation.mutate({
      content: messageInput,
      to: selectedContact.phone
    });
  };

  const generateAIResponse = async (messageContent: string) => {
    if (!aiAssistanceEnabled) return;
    
    try {
      const response = await generateResponseMutation.mutateAsync(messageContent);
      if (response && typeof response === 'object' && 'suggestedResponse' in response) {
        const suggestedResponse = typeof response.suggestedResponse === 'string' ? response.suggestedResponse : '';
        setMessageInput(suggestedResponse);
        toast({
          title: "Risposta AI generata",
          description: "Ho generato una risposta suggerita che puoi modificare prima di inviare"
        });
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
    }
  };

  const analyzeMessage = async (messageContent: string) => {
    if (!aiAssistanceEnabled || !messageContent.trim()) return;
    
    try {
      const analysis = await analyzeMessageMutation.mutateAsync(messageContent);
      if (analysis && typeof analysis === 'object' && 'suggestedResponse' in analysis && analysis.suggestedResponse && autoResponseEnabled) {
        const suggestedResponse = typeof analysis.suggestedResponse === 'string' ? analysis.suggestedResponse : '';
        setMessageInput(suggestedResponse);
      }
    } catch (error) {
      console.error('Error analyzing message:', error);
    }
  };

  const useTemplate = (template: WhatsAppTemplate) => {
    let content = template.content;
    
    // Simple variable replacement with contact info
    if (selectedContact) {
      content = content.replace(/{nome}/g, selectedContact.name);
      content = content.replace(/{telefono}/g, selectedContact.phone);
      content = content.replace(/{azienda}/g, selectedContact.company || '');
    }
    
    setMessageInput(content);
    setSelectedTemplate(template);
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[800px]">
      {/* Contacts Sidebar */}
      <div className="col-span-4 space-y-4">
        {/* WhatsApp Chats List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              {whatsappChats.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nessuna chat attiva</p>
                  <p className="text-xs">Seleziona un contatto per iniziare</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {whatsappChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedContact(chat)}
                      className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors ${
                        selectedContact?.id === chat.id ? 'bg-muted' : ''
                      }`}
                      data-testid={`chat-${chat.id}`}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={chat.avatar} />
                          <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                            {(chat.name || 'N/A').split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        {chat.online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                        {chat.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-sm truncate">{chat.name || 'Contatto senza nome'}</div>
                          <div className="text-xs text-muted-foreground">
                            {chat.lastSeen}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {chat.lastMessage || 'Nessun messaggio'}
                        </div>
                        {chat.phone && (
                          <div className="text-xs text-green-600 font-mono mt-1">
                            📱 {chat.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* AI Settings & Contact Search */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Assistente AI
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={aiAssistanceEnabled ? "default" : "secondary"} className="text-xs">
                  {aiAssistanceEnabled ? "Attivo" : "Disattivo"}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setAiAssistanceEnabled(!aiAssistanceEnabled)}
                  data-testid="toggle-ai-assistance"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span>Risposte automatiche</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoResponseEnabled(!autoResponseEnabled)}
                className={autoResponseEnabled ? "text-green-600" : "text-muted-foreground"}
                data-testid="toggle-auto-response"
              >
                <Zap className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="border-t pt-3">
              <Label className="text-xs font-medium mb-2 block">Seleziona Contatto</Label>
              <Dialog open={showContactSearch} onOpenChange={setShowContactSearch}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left" 
                    size="sm"
                    data-testid="open-contact-search"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    <div className="flex-1 truncate">
                      {selectedContact ? (
                        <div>
                          <div className="font-medium">{selectedContact.name}</div>
                          <div className="text-xs text-muted-foreground">{selectedContact.phone}</div>
                        </div>
                      ) : (
                        "Cerca tra risorse, clienti e fornitori"
                      )}
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Seleziona Contatto WhatsApp</DialogTitle>
                  </DialogHeader>
                  <ContactSearchEnhanced
                    onContactSelect={handleContactSelect}
                    placeholder="Cerca contatti con numero di telefono..."
                    filterByType={['resource', 'customer', 'supplier']}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {selectedContact && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-green-100 text-green-700">
                      {selectedContact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{selectedContact.name}</div>
                    <div className="text-xs text-muted-foreground">{selectedContact.phone}</div>
                    {selectedContact.company && (
                      <div className="text-xs text-muted-foreground truncate">{selectedContact.company}</div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {selectedContact.type === 'resource' ? 'Risorsa' : 
                     selectedContact.type === 'customer' ? 'Cliente' : 'Fornitore'}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="col-span-8">
        {selectedContact ? (
          <Card className="h-full flex flex-col">
            {/* Chat Header */}
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedContact.avatar} />
                      <AvatarFallback>
                        {selectedContact.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {selectedContact.online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedContact.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedContact.online ? 'Online' : `Ultimo accesso: ${selectedContact.lastSeen}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {aiAssistanceEnabled && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowMessageAnalysis(!showMessageAnalysis)}
                      data-testid="toggle-message-analysis"
                    >
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => generateAIResponse("Genera una risposta di cortesia")}
                    disabled={!aiAssistanceEnabled}
                    data-testid="generate-ai-response"
                  >
                    <Bot className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 p-4 overflow-hidden">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {whatsappMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nessun messaggio ancora</p>
                      <p className="text-sm text-muted-foreground">Inizia la conversazione con {selectedContact.name}</p>
                    </div>
                  ) : (
                    whatsappMessages.map((message: WhatsAppMessage) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isOutgoing ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="max-w-[70%] group">
                          <div
                            className={`rounded-lg px-3 py-2 ${
                              message.isOutgoing
                                ? 'bg-green-500 text-white'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex items-center gap-1">
                                <span className={`text-xs ${message.isOutgoing ? 'text-green-100' : 'text-muted-foreground'}`}>
                                  {message.timestamp}
                                </span>
                                {message.aiGenerated && (
                                  <Bot className="h-3 w-3 text-blue-400" />
                                )}
                              </div>
                              {message.isOutgoing && (
                                <div className="flex items-center">
                                  {message.delivered && (
                                    <CheckCheck className={`h-3 w-3 ${message.read ? 'text-blue-400' : 'text-green-100'}`} />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* AI Analysis */}
                          {message.analysis && showMessageAnalysis && aiAssistanceEnabled && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-md text-xs">
                              <div className="flex items-center gap-2 mb-1">
                                <Brain className="h-3 w-3 text-blue-600" />
                                <span className="font-medium text-blue-700 dark:text-blue-300">Analisi AI</span>
                              </div>
                              <div className="space-y-1 text-blue-600 dark:text-blue-400">
                                <div>Sentiment: <Badge variant="outline" className="text-xs">{message.analysis.sentiment}</Badge></div>
                                <div>Urgenza: <Badge variant="outline" className="text-xs">{message.analysis.urgency}</Badge></div>
                                <div>Categoria: {message.analysis.category}</div>
                                {message.analysis.suggestedResponse && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="mt-1 h-6 text-xs"
                                    onClick={() => setMessageInput(message.analysis?.suggestedResponse || '')}
                                  >
                                    Usa risposta suggerita
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Generate AI Response for incoming messages */}
                          {!message.isOutgoing && aiAssistanceEnabled && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-xs"
                                onClick={() => generateAIResponse(message.content)}
                                disabled={generateResponseMutation.isPending}
                              >
                                <Bot className="h-3 w-3 mr-1" />
                                Genera risposta
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>

            {/* Message Input */}
            <div className="border-t p-4 space-y-3">
              {/* Template Selection */}
              {whatsappTemplates.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    Template Rapidi
                    {whatsappTemplates.some(t => t.aiGenerated) && (
                      <Badge variant="secondary" className="text-xs">
                        <Bot className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    )}
                  </Label>
                  <Select onValueChange={(value) => {
                    const template = whatsappTemplates.find(t => t.id === value);
                    if (template) useTemplate(template);
                  }}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Seleziona template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {whatsappTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            {template.aiGenerated ? (
                              <Bot className="h-3 w-3 text-blue-500" />
                            ) : (
                              <MessageSquare className="h-3 w-3" />
                            )}
                            <span className="text-sm">{template.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* AI Message Analysis */}
              {aiAssistanceEnabled && messageInput.trim() && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  {analyzeMessageMutation.isPending ? (
                    <>
                      <Brain className="h-3 w-3 animate-pulse" />
                      Analizzando messaggio...
                    </>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs p-0"
                      onClick={() => analyzeMessage(messageInput)}
                    >
                      <Brain className="h-3 w-3 mr-1" />
                      Analizza con AI
                    </Button>
                  )}
                </div>
              )}

              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder={selectedContact ? `Scrivi a ${selectedContact.name}...` : "Seleziona un contatto per iniziare..."}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    className="pr-24"
                    disabled={!selectedContact}
                    data-testid="message-input"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      title="Allegati"
                      disabled={!selectedContact}
                    >
                      <Paperclip className="h-3 w-3" />
                    </Button>
                    {aiAssistanceEnabled && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0"
                        onClick={() => generateAIResponse("Genera una risposta appropriata")}
                        disabled={!selectedContact || generateResponseMutation.isPending}
                        title="Genera risposta AI"
                      >
                        {generateResponseMutation.isPending ? (
                          <Bot className="h-3 w-3 animate-pulse" />
                        ) : (
                          <Bot className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={sendMessage} 
                  size="sm" 
                  className="flex items-center gap-1"
                  disabled={!messageInput.trim() || !selectedContact || sendMessageMutation.isPending}
                  data-testid="send-message"
                >
                  {sendMessageMutation.isPending ? (
                    <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Invia
                </Button>
              </div>

              {/* AI Status Indicators */}
              {(analyzeMessageMutation.isPending || generateResponseMutation.isPending || sendMessageMutation.isPending) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 animate-pulse bg-blue-500 rounded-full" />
                    {analyzeMessageMutation.isPending && "Analisi AI in corso..."}
                    {generateResponseMutation.isPending && "Generazione risposta AI..."}
                    {sendMessageMutation.isPending && "Invio messaggio..."}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md">
              <div className="relative">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                {aiAssistanceEnabled && (
                  <div className="absolute -top-2 -right-2">
                    <Bot className="h-8 w-8 text-blue-500 bg-white rounded-full p-1 shadow-lg" />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">WhatsApp Business con AI</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Seleziona un contatto dalla sezione sopra per iniziare a chattare</p>
                  {aiAssistanceEnabled && (
                    <div className="flex items-center justify-center gap-2 text-blue-600">
                      <Brain className="h-4 w-4" />
                      <span>Assistente AI attivo per risposte intelligenti</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6 text-xs">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span>Cerca contatti reali</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-blue-600" />
                    <span>Risposte AI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <span>Analisi messaggi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    <span>Template automatici</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}