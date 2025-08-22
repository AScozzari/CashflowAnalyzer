import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Send as TelegramIcon,
  Bot,
  MessageSquare,
  Users,
  Search,
  Phone,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  MoreHorizontal,
  Brain,
  Zap
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TelegramMessage {
  id: string;
  chatId: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  messageType: 'text' | 'photo' | 'document' | 'sticker';
  isOutgoing: boolean;
  delivered: boolean;
  read: boolean;
  aiGenerated?: boolean;
}

interface TelegramChat {
  id: string;
  telegramChatId: string;
  chatType: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  lastSeen: string;
  messageCount: number;
  unreadCount: number;
  online: boolean;
  isBlocked: boolean;
  linkedCustomerId?: string;
  linkedResourceId?: string;
  avatar?: string;
}

interface TelegramTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
  aiGenerated?: boolean;
}

export function TelegramInterfaceImproved() {
  const [selectedChat, setSelectedChat] = useState<TelegramChat | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TelegramTemplate | null>(null);
  const [aiAssistanceEnabled, setAiAssistanceEnabled] = useState(true);
  const [showMessageAnalysis, setShowMessageAnalysis] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ✅ DATI REALI DAL DATABASE
  const getLastMessagePreview = (chat: any) => {
    if (chat.lastRealMessage && chat.lastRealMessage.trim()) {
      return chat.lastRealMessage.length > 50 
        ? chat.lastRealMessage.substring(0, 50) + '...' 
        : chat.lastRealMessage;
    }
    
    return 'Nessun messaggio';
  };

  const getLastSeenFromTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Mai visto';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Online';
    if (diffMins < 60) return `${diffMins} min fa`;
    if (diffHours < 24) return `${diffHours} ore fa`;
    if (diffDays === 1) return 'Ieri';
    if (diffDays < 7) return `${diffDays} giorni fa`;
    return 'Oltre una settimana fa';
  };

  // Genera nome contatto - DEFINITA PRIMA DELL'USO
  const getContactName = (chat: any) => {
    if (chat.chatType === 'group' || chat.chatType === 'supergroup' || chat.chatType === 'channel') {
      return chat.title || `Gruppo ${chat.telegramChatId}`;
    }
    
    const parts = [];
    if (chat.firstName) parts.push(chat.firstName);
    if (chat.lastName) parts.push(chat.lastName);
    
    if (parts.length > 0) return parts.join(' ');
    if (chat.username) return `@${chat.username}`;
    return `Chat ${chat.telegramChatId}`;
  };

  // Genera iniziali contatto - DEFINITA PRIMA DELL'USO
  const getContactInitials = (chat: any) => {
    const name = getContactName(chat);
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Fetch chat messages for selected chat
  const { data: telegramMessages = [], refetch: refetchMessages } = useQuery<TelegramMessage[]>({
    queryKey: ['/api/telegram/messages', selectedChat?.id],
    enabled: !!selectedChat,
  });

  // Fetch telegram templates
  const { data: telegramTemplates = [] } = useQuery<TelegramTemplate[]>({
    queryKey: ['/api/telegram/templates'],
  });

  // Fetch telegram chats/contacts
  const { data: telegramChats = [], isLoading: chatsLoading, error: chatsError, refetch } = useQuery<TelegramChat[]>({
    queryKey: ['/api/telegram/chats'],
    select: (data: any[]) => {
      console.log('🔍 Telegram chats ricevute:', data?.length || 0, '(dati completi):', data);
      if (!data || !Array.isArray(data)) {
        console.warn('❌ Dati Telegram chats non validi:', data);
        return [];
      }
      // ✅ DATI DIRETTI DAL DATABASE: Minimali trasformazioni solo per interfaccia
      const transformedChats = data.map((chat: any) => ({
        id: chat.id,
        telegramChatId: chat.telegramChatId,
        chatType: chat.chatType || 'private',
        title: chat.title,
        username: chat.username,
        firstName: chat.firstName,
        lastName: chat.lastName,
        phoneNumber: chat.phoneNumber,
        lastMessage: getLastMessagePreview(chat),
        lastMessageAt: chat.lastMessageAt,
        lastSeen: getLastSeenFromTimestamp(chat.lastMessageAt),
        messageCount: chat.messageCount || 0,
        unreadCount: 0,
        online: false,
        isBlocked: chat.isBlocked || false,
        linkedCustomerId: chat.linkedCustomerId,
        linkedResourceId: chat.linkedResourceId,
        avatar: undefined
      }));
      console.log('✅ Chat trasformate:', transformedChats.length, transformedChats);
      return transformedChats;
    }
  });

  // Funzioni spostate sopra per evitare errori di hoisting

  // Filter chats based on search (with type safety)
  const filteredChats = (telegramChats || []).filter((chat: TelegramChat) => {
    const name = getContactName(chat).toLowerCase();
    const username = chat.username?.toLowerCase() || '';
    const phone = chat.phoneNumber || '';
    return name.includes(searchQuery.toLowerCase()) || 
           username.includes(searchQuery.toLowerCase()) ||
           phone.includes(searchQuery);
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ content, chatId }: { content: string; chatId: string }) => {
      console.log('🚀 [SEND MESSAGE] Invio messaggio:', { chatId, content });
      return apiRequest('POST', '/api/telegram/send', { 
        chatId: chatId,
        message: content,
        parseMode: 'HTML'
      });
    },
    onSuccess: (data) => {
      console.log('✅ [SEND MESSAGE] Successo:', data);
      setMessageInput("");
      
      // Invalida entrambe le cache
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/chats'] });
      if (selectedChat) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/telegram/messages', selectedChat.id] 
        });
      }
      
      // Forza il refetch delle chat per aggiornare i contatori
      refetch();
      refetchMessages();
      
      toast({
        title: "Messaggio inviato",
        description: "Il messaggio Telegram è stato inviato con successo"
      });
    },
    onError: (error: any) => {
      console.error('❌ [SEND MESSAGE] Errore:', error);
      toast({
        title: "Errore invio messaggio",
        description: error?.message || "Errore nell'invio del messaggio",
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedChat) {
      sendMessageMutation.mutate({
        content: messageInput,
        chatId: selectedChat.telegramChatId
      });
    }
  };

  // Funzioni spostate sopra per evitare errori di hoisting

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-[calc(100vh-200px)] flex border rounded-lg overflow-hidden bg-background">
      {/* Left Sidebar - Chat List */}
      <div className="w-1/3 border-r flex flex-col">
        {/* Search Header */}
        <div className="p-4 border-b bg-muted/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <TelegramIcon className="h-5 w-5 text-blue-500" />
              Telegram
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {telegramChats.length} chat
              </Badge>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="telegram-search-input"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {chatsLoading ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>Caricamento chat...</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nessuna chat trovata</p>
                <p className="text-xs">Le chat appariranno automaticamente</p>
                {chatsError && (
                  <p className="text-xs text-red-500 mt-2">Errore nel caricamento: {String(chatsError)}</p>
                )}
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedChat?.id === chat.id ? 'bg-blue-50 dark:bg-blue-950' : ''
                  }`}
                  data-testid={`telegram-chat-${chat.id}`}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={chat.avatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        {getContactInitials(chat)}
                      </AvatarFallback>
                    </Avatar>
                    {chat.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm truncate">{getContactName(chat)}</h4>
                      <div className="flex items-center gap-1">
                        {chat.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 text-xs rounded-full flex items-center justify-center">
                            {chat.unreadCount}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {chat.lastSeen}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground truncate flex-1">
                        {chat.lastMessage || 'Nessun messaggio'}
                      </p>
                      <div className="flex items-center gap-1">
                        {chat.chatType === 'private' ? (
                          <User className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <Users className="h-3 w-3 text-muted-foreground" />
                        )}
                        <Bot className="h-3 w-3 text-blue-500" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Chat Content */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-muted/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                      {getContactInitials(selectedChat)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-sm">{getContactName(selectedChat)}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="capitalize text-xs">
                        {selectedChat.chatType}
                      </Badge>
                      <span>{selectedChat.lastSeen}</span>
                      {selectedChat.online && (
                        <span className="text-green-500">• Online</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {telegramMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <TelegramIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nessun messaggio in questa chat</p>
                    <p className="text-xs">Inizia la conversazione inviando un messaggio</p>
                  </div>
                ) : (
                  telegramMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isOutgoing ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isOutgoing
                            ? 'bg-blue-500 text-white'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center justify-between mt-1 text-xs ${
                          message.isOutgoing ? 'text-blue-100' : 'text-muted-foreground'
                        }`}>
                          <span>{formatTime(message.timestamp)}</span>
                          {message.isOutgoing && (
                            <div className="flex items-center">
                              {message.delivered ? (
                                <CheckCircle className="h-3 w-3 ml-1" />
                              ) : (
                                <Clock className="h-3 w-3 ml-1" />
                              )}
                            </div>
                          )}
                          {message.aiGenerated && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              <Brain className="h-2 w-2 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-muted/10">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Scrivi un messaggio..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                  data-testid="telegram-message-input"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  size="sm"
                  data-testid="telegram-send-button"
                >
                  <TelegramIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
            <div>
              <TelegramIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Seleziona una chat</h3>
              <p>Scegli una chat dalla lista per iniziare la conversazione</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}