import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send as TelegramIcon, 
  Send, 
  Phone,
  Video,
  MoreHorizontal,
  Search,
  Paperclip,
  Smile,
  Mic,
  Pin,
  Settings,
  Users,
  Bot,
  Zap
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TelegramMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'sticker';
  isOutgoing: boolean;
  edited: boolean;
  forwarded?: boolean;
  replyTo?: string;
}

interface TelegramChat {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  lastMessage?: string;
  lastSeen: string;
  unreadCount: number;
  online: boolean;
  type: 'private' | 'group' | 'channel';
  memberCount?: number;
  pinned: boolean;
}

interface TelegramTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
  useMarkdown: boolean;
}

export function TelegramInterface() {
  const [selectedChat, setSelectedChat] = useState<TelegramChat | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TelegramTemplate | null>(null);

  // Mock Telegram data
  const chats: TelegramChat[] = [
    {
      id: "1",
      name: "EasyCashFlows Support",
      username: "@easycashflows_support",
      lastMessage: "Ciao! Come posso aiutarti?",
      lastSeen: "1 minuto fa",
      unreadCount: 3,
      online: true,
      type: 'private',
      pinned: true
    },
    {
      id: "2",
      name: "Team Sviluppo",
      lastMessage: "Nuova feature rilasciata!",
      lastSeen: "30 minuti fa",
      unreadCount: 0,
      online: false,
      type: 'group',
      memberCount: 8,
      pinned: false
    },
    {
      id: "3",
      name: "Cliente Premium",
      username: "@cliente_premium",
      lastMessage: "Grazie per il supporto",
      lastSeen: "2 ore fa",
      unreadCount: 1,
      online: false,
      type: 'private',
      pinned: false
    },
    {
      id: "4",
      name: "Notifiche Sistema",
      username: "@system_notifications",
      lastMessage: "Backup completato con successo",
      lastSeen: "5 ore fa",
      unreadCount: 0,
      online: true,
      type: 'channel',
      memberCount: 156,
      pinned: false
    }
  ];

  const messages: TelegramMessage[] = [
    {
      id: "1",
      from: "@easycashflows_support",
      to: "me",
      content: "Ciao! Benvenuto nel supporto EasyCashFlows. Come posso aiutarti oggi?",
      timestamp: "14:30",
      type: 'text',
      isOutgoing: false,
      edited: false
    },
    {
      id: "2",
      from: "me",
      to: "@easycashflows_support",
      content: "Ciao! Avrei bisogno di aiuto con la configurazione della fatturazione elettronica.",
      timestamp: "14:32",
      type: 'text',
      isOutgoing: true,
      edited: false
    },
    {
      id: "3",
      from: "@easycashflows_support",
      to: "me",
      content: "Perfetto! Ti mando subito la guida completa. La fatturazione elettronica è molto semplice da configurare:\n\n🔹 Vai in Impostazioni > Fatturazione\n🔹 Inserisci i dati della tua azienda\n🔹 Configura il certificato digitale\n\nHai già un certificato digitale?",
      timestamp: "14:33",
      type: 'text',
      isOutgoing: false,
      edited: false
    },
    {
      id: "4",
      from: "me",
      to: "@easycashflows_support",
      content: "Sì, ce l'ho già. Dove lo carico?",
      timestamp: "14:35",
      type: 'text',
      isOutgoing: true,
      edited: false
    }
  ];

  const templates: TelegramTemplate[] = [
    {
      id: "1",
      name: "Benvenuto Bot",
      content: "🤖 *Ciao {nome}!*\n\nBenvenuto nel supporto EasyCashFlows!\n\nSono qui per aiutarti con:\n• Fatturazione elettronica\n• Gestione clienti\n• Analisi finanziarie\n• Supporto tecnico\n\nCosa posso fare per te?",
      category: "onboarding",
      variables: ["nome"],
      useMarkdown: true
    },
    {
      id: "2",
      name: "Notifica Pagamento",
      content: "💰 *Pagamento Ricevuto*\n\n✅ Fattura: `{numero_fattura}`\n💶 Importo: *€{importo}*\n📅 Data: {data}\n👤 Cliente: {cliente}\n\nGrazie!",
      category: "payments",
      variables: ["numero_fattura", "importo", "data", "cliente"],
      useMarkdown: true
    },
    {
      id: "3",
      name: "Reminder Scadenza",
      content: "⏰ *Promemoria Scadenza*\n\nGentile {nome},\n\nLa fattura #{numero} di €{importo} scade il {data_scadenza}.\n\n🔗 [Paga Ora]({link_pagamento})\n\nGrazie per la collaborazione!",
      category: "reminders",
      variables: ["nome", "numero", "importo", "data_scadenza", "link_pagamento"],
      useMarkdown: true
    }
  ];

  const getChatIcon = (chat: TelegramChat) => {
    switch (chat.type) {
      case 'group':
        return <Users className="h-4 w-4" />;
      case 'channel':
        return <TelegramIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !selectedChat) return;
    
    console.log("Sending Telegram message:", messageInput, "to:", selectedChat.name);
    setMessageInput("");
  };

  const useTemplate = (template: TelegramTemplate) => {
    setMessageInput(template.content);
    setSelectedTemplate(template);
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[800px]">
      {/* Chats Sidebar */}
      <div className="col-span-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <Card className="h-[740px] overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TelegramIcon className="h-5 w-5 text-cyan-600" />
              Telegram
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[650px]">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                    selectedChat?.id === chat.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={chat.avatar} />
                        <AvatarFallback className="bg-cyan-100 text-cyan-800">
                          {chat.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {chat.online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          {chat.pinned && <Pin className="h-3 w-3 text-cyan-600" />}
                          {getChatIcon(chat)}
                          <h4 className="font-medium truncate">{chat.name}</h4>
                        </div>
                        <span className="text-xs text-muted-foreground">{chat.lastSeen}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1">
                          {chat.username && (
                            <span className="text-xs text-cyan-600">{chat.username}</span>
                          )}
                          {chat.memberCount && (
                            <span className="text-xs text-muted-foreground">
                              {chat.memberCount} membri
                            </span>
                          )}
                        </div>
                        {chat.unreadCount > 0 && (
                          <Badge className="bg-cyan-500 text-white min-w-[20px] h-5 text-xs">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="col-span-8">
        {selectedChat ? (
          <Card className="h-full flex flex-col">
            {/* Chat Header */}
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedChat.avatar} />
                      <AvatarFallback className="bg-cyan-100 text-cyan-800">
                        {selectedChat.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {selectedChat.online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {getChatIcon(selectedChat)}
                      <h3 className="font-semibold">{selectedChat.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedChat.username && (
                        <span className="text-sm text-cyan-600">{selectedChat.username}</span>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {selectedChat.online ? 'Online' : `Ultimo accesso: ${selectedChat.lastSeen}`}
                      </span>
                      {selectedChat.memberCount && (
                        <span className="text-sm text-muted-foreground">
                          {selectedChat.memberCount} membri
                        </span>
                      )}
                    </div>
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
                            ? 'bg-cyan-500 text-white'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content.includes('*') || message.content.includes('`') ? (
                            // Render markdown-like formatting
                            <div dangerouslySetInnerHTML={{
                              __html: message.content
                                .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
                                .replace(/`([^`]+)`/g, '<code class="bg-black/20 px-1 rounded">$1</code>')
                                .replace(/\n/g, '<br>')
                            }} />
                          ) : (
                            message.content
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-xs ${message.isOutgoing ? 'text-cyan-100' : 'text-muted-foreground'}`}>
                            {message.timestamp}
                          </span>
                          {message.edited && (
                            <span className={`text-xs ${message.isOutgoing ? 'text-cyan-100' : 'text-muted-foreground'}`}>
                              modificato
                            </span>
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
                <Label className="text-sm">Template Bot</Label>
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
                          <Bot className="h-3 w-3" />
                          <span className="text-sm">{template.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                          {template.useMarkdown && (
                            <Zap className="h-3 w-3 text-blue-500" title="Supporta Markdown" />
                          )}
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
                <Button onClick={sendMessage} size="sm" className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-700">
                  {messageInput.trim() ? (
                    <Send className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {selectedTemplate?.useMarkdown && (
                <div className="text-xs text-muted-foreground">
                  💡 Supporto Markdown: *grassetto*, `codice`, [link](url)
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <TelegramIcon className="h-16 w-16 text-cyan-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Seleziona una chat</h3>
                <p className="text-muted-foreground">Scegli una conversazione per iniziare</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}