import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Users,
  ChevronDown,
  ChevronUp
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

export function WhatsAppInterfaceImproved() {
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [aiAssistanceEnabled, setAiAssistanceEnabled] = useState(true);
  const [autoResponseEnabled, setAutoResponseEnabled] = useState(false);
  const [showMessageAnalysis, setShowMessageAnalysis] = useState(false);
  const [showContactPanel, setShowContactPanel] = useState(true);
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
  };

  // Send message function
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedContact?.phone) {
      toast({
        title: "Errore",
        description: "Inserisci un messaggio e seleziona un contatto",
        variant: "destructive"
      });
      return;
    }

    await sendMessageMutation.mutateAsync({
      content: messageInput,
      to: selectedContact.phone
    });
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[800px]">
      {/* Contact Search and Chat List */}
      <div className="col-span-4">
        <Card className="h-full">
          <CardHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                WhatsApp
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={aiAssistanceEnabled ? "default" : "secondary"} className="text-xs">
                  AI {aiAssistanceEnabled ? "ON" : "OFF"}
                </Badge>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {/* Contact Search Section - INLINE */}
            <div className="border-b">
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Cerca Contatti</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowContactPanel(!showContactPanel)}
                  >
                    {showContactPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                
                {showContactPanel && (
                  <div className="space-y-3">
                    <ContactSearchEnhanced 
                      onContactSelect={handleContactSelect}
                      placeholder="Cerca contatti WhatsApp..."
                      filterByType={['resource', 'customer', 'supplier']}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Search Bar for existing chats */}
            <div className="p-3 border-b bg-muted/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Cerca nelle chat esistenti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="chat-search-input"
                />
              </div>
            </div>

            {/* Chat List */}
            <ScrollArea className="h-[350px]">
              {whatsappChats
                .filter(chat => 
                  (chat.name && chat.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (chat.phone && chat.phone.includes(searchQuery))
                )
                .map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-3 border-b cursor-pointer hover:bg-accent transition-colors ${
                      selectedContact?.id === chat.id ? 'bg-accent border-l-4 border-l-green-600' : ''
                    }`}
                    onClick={() => setSelectedContact(chat)}
                    data-testid={`chat-item-${chat.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={chat.avatar} />
                          <AvatarFallback className="bg-green-100 text-green-700">
                            {chat.name ? chat.name.split(' ').map(n => n[0]).join('') : '?'}
                          </AvatarFallback>
                        </Avatar>
                        {chat.online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm truncate">{chat.name || 'Contatto sconosciuto'}</h4>
                          <span className="text-xs text-muted-foreground">{chat.lastSeen}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">
                            {chat.lastMessage || 'Nessun messaggio'}
                          </p>
                          {chat.unreadCount > 0 && (
                            <Badge className="bg-green-600 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                              {chat.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {chat.company && (
                          <p className="text-xs text-muted-foreground truncate">{chat.company}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              
              {whatsappChats.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessuna chat trovata</p>
                  <p className="text-sm mt-1">Cerca un contatto per iniziare</p>
                </div>
              )}
            </ScrollArea>

            {/* Selected Contact Info */}
            {selectedContact && (
              <div className="p-3 border-t bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedContact.avatar} />
                    <AvatarFallback className="bg-green-100 text-green-700">
                      {selectedContact.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{selectedContact.name}</div>
                    <div className="text-xs text-green-600 font-mono">{selectedContact.phone}</div>
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
                      <AvatarFallback className="bg-green-100 text-green-700">
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
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {whatsappMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOutgoing ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.isOutgoing
                          ? 'bg-green-600 text-white'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {message.isOutgoing && (
                          <div className="flex items-center gap-1">
                            {message.delivered && (
                              <CheckCheck className={`h-4 w-4 ${message.read ? 'text-blue-400' : 'text-gray-400'}`} />
                            )}
                            {message.aiGenerated && (
                              <Bot className="h-3 w-3 text-blue-400" />
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* AI Analysis */}
                      {message.analysis && showMessageAnalysis && !message.isOutgoing && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-900">
                          <div className="flex items-center gap-2 mb-1">
                            <Brain className="h-3 w-3" />
                            <span className="font-medium">Analisi AI</span>
                          </div>
                          <p>Sentiment: {message.analysis.sentiment}</p>
                          <p>Urgenza: {message.analysis.urgency}</p>
                          {message.analysis.suggestedResponse && (
                            <p className="mt-1 italic">Risposta suggerita: {message.analysis.suggestedResponse}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {whatsappMessages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nessun messaggio</p>
                    <p className="text-sm mt-1">Inizia la conversazione</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Message Input Area */}
            <div className="border-t p-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      placeholder="Scrivi un messaggio..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1"
                      data-testid="message-input"
                    />
                    <Button variant="ghost" size="sm">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Smile className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Template Selection */}
                  {whatsappTemplates.length > 0 && (
                    <Select value={selectedTemplate?.id} onValueChange={(value) => 
                      setSelectedTemplate(whatsappTemplates.find(t => t.id === value) || null)
                    }>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleziona template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {whatsappTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <Button 
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Seleziona un contatto</h3>
              <p>Scegli un contatto per iniziare la conversazione WhatsApp</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}