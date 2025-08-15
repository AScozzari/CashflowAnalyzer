import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  CheckCheck
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
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
}

export function WhatsAppInterface() {
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);

  // Mock WhatsApp data
  const contacts: WhatsAppContact[] = [
    {
      id: "1",
      name: "Mario Rossi",
      phone: "+39 333 123 4567",
      lastMessage: "Grazie per la consulenza!",
      lastSeen: "2 minuti fa",
      unreadCount: 2,
      online: true
    },
    {
      id: "2",
      name: "Anna Verdi",
      phone: "+39 347 987 6543",
      lastMessage: "Quando possiamo fare una call?",
      lastSeen: "1 ora fa",
      unreadCount: 0,
      online: false
    },
    {
      id: "3",
      name: "Giuseppe Bianchi",
      phone: "+39 320 555 7890",
      lastMessage: "Ho bisogno della fattura",
      lastSeen: "3 ore fa",
      unreadCount: 1,
      online: false
    }
  ];

  const messages: WhatsAppMessage[] = [
    {
      id: "1",
      from: "+39 333 123 4567",
      to: "me",
      content: "Buongiorno, avrei bisogno di informazioni sui vostri servizi",
      timestamp: "09:30",
      type: 'text',
      isOutgoing: false,
      delivered: true,
      read: true
    },
    {
      id: "2",
      from: "me",
      to: "+39 333 123 4567",
      content: "Buongiorno Mario! Sarò felice di aiutarla. Che tipo di servizi la interessano di più?",
      timestamp: "09:32",
      type: 'text',
      isOutgoing: true,
      delivered: true,
      read: true,
      aiGenerated: true
    },
    {
      id: "3",
      from: "+39 333 123 4567",
      to: "me",
      content: "Principalmente la gestione della fatturazione elettronica",
      timestamp: "09:35",
      type: 'text',
      isOutgoing: false,
      delivered: true,
      read: true
    },
    {
      id: "4",
      from: "me",
      to: "+39 333 123 4567",
      content: "Perfetto! EasyCashFlows offre una soluzione completa per la fatturazione elettronica. Posso inviarle una demo?",
      timestamp: "09:37",
      type: 'text',
      isOutgoing: true,
      delivered: true,
      read: false
    }
  ];

  const templates: WhatsAppTemplate[] = [
    {
      id: "1",
      name: "Benvenuto Nuovo Cliente",
      content: "Ciao {nome}! Benvenuto in EasyCashFlows. Sono qui per aiutarti con qualsiasi domanda sui nostri servizi.",
      category: "onboarding",
      variables: ["nome"]
    },
    {
      id: "2",
      name: "Reminder Pagamento",
      content: "Ciao {nome}, ti ricordo che la fattura {numero_fattura} di €{importo} è in scadenza il {data_scadenza}.",
      category: "payments",
      variables: ["nome", "numero_fattura", "importo", "data_scadenza"]
    },
    {
      id: "3",
      name: "Conferma Appuntamento",
      content: "Ciao {nome}! Confermo il nostro appuntamento per {data} alle {ora}. A presto!",
      category: "appointments", 
      variables: ["nome", "data", "ora"]
    }
  ];

  const sendMessage = () => {
    if (!messageInput.trim() || !selectedContact) return;
    
    // Logic to send message
    console.log("Sending message:", messageInput, "to:", selectedContact.phone);
    setMessageInput("");
  };

  const useTemplate = (template: WhatsAppTemplate) => {
    setMessageInput(template.content);
    setSelectedTemplate(template);
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[800px]">
      {/* Contacts Sidebar */}
      <div className="col-span-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca contatti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button size="sm" variant="outline">
            <Phone className="h-4 w-4" />
          </Button>
        </div>

        <Card className="h-[740px] overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[650px]">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                    selectedContact?.id === contact.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback>
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {contact.online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium truncate">{contact.name}</h4>
                        <span className="text-xs text-muted-foreground">{contact.lastSeen}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                      <p className="text-xs text-muted-foreground">{contact.phone}</p>
                    </div>
                    {contact.unreadCount > 0 && (
                      <Badge className="bg-green-500 text-white min-w-[20px] h-5 text-xs">
                        {contact.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </ScrollArea>
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
                  <Button variant="outline" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
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
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isOutgoing ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-2 ${
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
                              <Bot className="h-3 w-3 text-blue-400" title="Risposta generata dall'AI" />
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
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>

            {/* Message Input */}
            <div className="border-t p-4 space-y-3">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label className="text-sm">Template Rapidi</Label>
                <Select onValueChange={(value) => {
                  const template = templates.find(t => t.id === value);
                  if (template) useTemplate(template);
                }}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Seleziona template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-3 w-3" />
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

              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Scrivi un messaggio..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Paperclip className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Smile className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Button onClick={sendMessage} size="sm" className="flex items-center gap-1">
                  {messageInput.trim() ? (
                    <Send className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Seleziona una chat</h3>
                <p className="text-muted-foreground">Scegli un contatto per iniziare a chattare</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}