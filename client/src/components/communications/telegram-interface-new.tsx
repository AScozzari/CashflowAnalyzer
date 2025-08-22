import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, 
  Send, 
  Phone,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  FileText,
  Settings,
  TestTube,
  Bot,
  User,
  Zap,
  Archive,
  Trash2
} from "lucide-react";
import { ContactSearchEnhanced } from "./contact-search-enhanced";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface TelegramChat {
  id: string;
  telegramChatId: string;
  chatType: string;
  title?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  lastMessage?: string;
  lastRealMessage?: string;
  lastMessageAt?: string;
  lastSeen?: string;
  messageCount: number;
  unreadCount?: number;
  online?: boolean;
  isBlocked: boolean;
  linkedCustomerId?: string;
  linkedResourceId?: string;
}

interface TelegramMessage {
  id: string;
  chatId: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  messageType: string;
  isOutgoing: boolean;
  delivered?: boolean;
  read?: boolean;
  aiGenerated?: boolean;
}

interface TelegramTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
  characterCount: number;
  parseMode?: string;
}

interface TelegramInterfaceProps {
  selectedChatIdFromUrl?: string | null;
  onChatSelect?: (chatId: string | null) => void;
}

export function TelegramInterfaceNew({ selectedChatIdFromUrl, onChatSelect }: TelegramInterfaceProps = {}) {
  const [selectedChat, setSelectedChat] = useState<TelegramChat | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [composing, setComposing] = useState(false);
  const [recipientUsername, setRecipientUsername] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Telegram stats to check if configured
  const { data: telegramStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/telegram/stats'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch Telegram chats
  const { data: chats, isLoading: chatsLoading } = useQuery<TelegramChat[]>({
    queryKey: ['/api/telegram/chats'],
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  // Gestione selezione automatica chat da URL
  useEffect(() => {
    if (selectedChatIdFromUrl && chats) {
      const targetChat = chats.find(chat => chat.telegramChatId === selectedChatIdFromUrl);
      if (targetChat && targetChat.id !== selectedChat?.id) {
        setSelectedChat(targetChat);
      }
    }
  }, [selectedChatIdFromUrl, chats, selectedChat]);

  // Wrapper per setSelectedChat che notifica il componente padre
  const handleChatSelect = (chat: TelegramChat | null) => {
    setSelectedChat(chat);
    if (onChatSelect) {
      onChatSelect(chat?.telegramChatId || null);
    }
  };

  // Fetch Telegram templates
  const { data: templates, isLoading: templatesLoading } = useQuery<TelegramTemplate[]>({
    queryKey: ['/api/telegram/templates']
  });

  // Fetch messages for selected chat
  const { data: messages, isLoading: messagesLoading } = useQuery<TelegramMessage[]>({
    queryKey: ['/api/telegram/messages', selectedChat?.id],
    enabled: !!selectedChat?.id,
    refetchInterval: 5000 // Refresh every 5 seconds for real-time
  });

  // Send Telegram message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { chatId: string; message: string; parseMode?: string }) => {
      const response = await apiRequest('POST', '/api/telegram/send', data);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('[TELEGRAM] Message sent successfully:', data);
      toast({ 
        title: '✅ Messaggio Telegram Inviato!', 
        description: `Messaggio inviato. ID: ${data.messageId}` 
      });
      setMessageInput("");
      
      // ✅ INVALIDATE BOTH CHATS AND MESSAGES TO REFRESH UI
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/chats'] });
      if (selectedChat?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/telegram/messages', selectedChat.id] });
      }
      
      if (composing) {
        setRecipientUsername("");
        setComposing(false);
      }
    },
    onError: (error: any) => {
      console.error('[TELEGRAM] Error sending message:', error);
      toast({ 
        title: '❌ Errore Invio', 
        description: error.message || 'Impossibile inviare il messaggio Telegram',
        variant: 'destructive'
      });
    }
  });

  // Test Telegram connection mutation  
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/telegram/test');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ 
          title: '✅ Connessione Telegram OK', 
          description: `Bot: ${data.botInfo?.username}, Webhook: ${data.webhookInfo?.url ? 'Attivo' : 'Inattivo'}` 
        });
      } else {
        toast({ 
          title: '❌ Test Fallito', 
          description: data.error || 'Errore nella connessione Telegram',
          variant: 'destructive'
        });
      }
    },
    onError: () => {
      toast({ 
        title: '❌ Errore Test', 
        description: 'Impossibile testare la connessione Telegram',
        variant: 'destructive'
      });
    }
  });

  // Archive chat mutation
  const archiveChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const response = await apiRequest('PUT', `/api/telegram/chats/${chatId}`, {
        isArchived: true
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: '✅ Chat Archiviata', 
        description: 'La chat è stata archiviata con successo' 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/chats'] });
    },
    onError: () => {
      toast({ 
        title: '❌ Errore Archiviazione', 
        description: 'Impossibile archiviare la chat',
        variant: 'destructive'
      });
    }
  });

  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const response = await apiRequest('DELETE', `/api/telegram/chats/${chatId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: '✅ Chat Eliminata', 
        description: 'La chat è stata eliminata permanentemente' 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/chats'] });
      handleChatSelect(null);
    },
    onError: () => {
      toast({ 
        title: '❌ Errore Eliminazione', 
        description: 'Impossibile eliminare la chat',
        variant: 'destructive'
      });
    }
  });

  const sendMessage = () => {
    if (!messageInput.trim()) {
      toast({ 
        title: 'Messaggio vuoto', 
        description: 'Inserisci un messaggio da inviare',
        variant: 'destructive'
      });
      return;
    }
    
    const recipient = composing ? recipientUsername : selectedChat?.telegramChatId;
    if (!recipient) {
      toast({ 
        title: 'Destinatario mancante', 
        description: 'Seleziona una chat o inserisci un username',
        variant: 'destructive'
      });
      return;
    }
    
    console.log('[TELEGRAM] Sending message:', messageInput, 'to chat:', recipient);
    console.log('[TELEGRAM] selectedChat debug:', selectedChat);
    console.log('[TELEGRAM] telegramChatId:', selectedChat?.telegramChatId);
    
    // ✅ FORCE USE NUMERIC CHAT ID TO FIX SENDING ISSUE
    const finalChatId = composing ? recipientUsername : selectedChat?.telegramChatId;
    if (!finalChatId) {
      console.error('[TELEGRAM] ❌ No valid chat ID found!');
      return;
    }
    
    sendMessageMutation.mutate({ chatId: finalChatId, message: messageInput });
  };

  const useTemplate = (template: TelegramTemplate) => {
    setMessageInput(template.content);
  };

  const getContactName = (chat: TelegramChat) => {
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

  const getLastMessagePreview = (chat: TelegramChat) => {
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

  const characterCount = messageInput.length;
  const estimatedCost = 0; // Telegram è gratuito

  return (
    <div className="space-y-4">
      {/* Telegram Status Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <h2 className="font-semibold">Telegram Bot</h2>
              </div>
              <div className="flex items-center gap-2">
                {telegramStats?.configured ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Attivo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-600">
                    <Settings className="h-3 w-3 mr-1" />
                    Da configurare
                  </Badge>
                )}
                {telegramStats?.username && (
                  <Badge variant="outline">
                    @{telegramStats.username}
                  </Badge>
                )}
                {telegramStats?.webhook && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <Zap className="h-3 w-3 mr-1" />
                    Webhook Attivo
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => testConnectionMutation.mutate()}
                disabled={testConnectionMutation.isPending}
                className="flex items-center gap-2"
                data-testid="button-test-telegram-connection"
              >
                <TestTube className="h-4 w-4" />
                {testConnectionMutation.isPending ? 'Testando...' : 'Test Connessione'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-6 h-[800px]">
        {/* Chats Sidebar */}
        <div className="col-span-4 space-y-4">
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setComposing(true)}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Nuovo Messaggio
            </Button>
          </div>

          {/* Contact Search */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Cerca Contatti</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ContactSearchEnhanced
                onContactSelect={(contact: any) => {
                  // Convert contact to TelegramChat format
                  const telegramChat: TelegramChat = {
                    id: contact.id,
                    telegramChatId: contact.phone || contact.id,
                    chatType: 'private',
                    firstName: contact.name.split(' ')[0],
                    lastName: contact.name.split(' ').slice(1).join(' '),
                    username: contact.username,
                    lastMessage: 'Nessun messaggio precedente',
                    lastSeen: 'Mai',
                    messageCount: 0,
                    isBlocked: false
                  };
                  handleChatSelect(telegramChat);
                  setComposing(false);
                }}
                placeholder="Cerca contatti..."
                filterByType={['resource', 'customer', 'supplier']}
              />
            </CardContent>
          </Card>

          <Card className="h-[680px] overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Chat Telegram</CardTitle>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {chatsLoading ? (
                <div className="p-4 text-center">Caricamento chat...</div>
              ) : !chats || chats.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nessuna chat Telegram</p>
                  <p className="text-xs">Le chat appariranno quando qualcuno scrive al bot</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                        selectedChat?.id === chat.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => {
                        handleChatSelect(chat);
                        setComposing(false);
                      }}
                      data-testid={`chat-item-${chat.telegramChatId}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            {chat.chatType === 'private' ? (
                              <User className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Users className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium truncate">{getContactName(chat)}</h4>
                            <span className="text-xs text-muted-foreground">
                              {getLastSeenFromTimestamp(chat.lastMessageAt || null)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {getLastMessagePreview(chat)}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">
                              {chat.username ? `@${chat.username}` : chat.telegramChatId}
                            </span>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                {chat.messageCount} msg
                              </Badge>
                              {chat.unreadCount && chat.unreadCount > 0 && (
                                <Badge className="bg-blue-500 text-white text-xs">
                                  {chat.unreadCount}
                                </Badge>
                              )}
                              
                              {/* Chat Actions */}
                              <div className="flex ml-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    archiveChatMutation.mutate(chat.id);
                                  }}
                                  disabled={archiveChatMutation.isPending}
                                  data-testid={`button-archive-chat-${chat.telegramChatId}`}
                                >
                                  <Archive className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Eliminare questa chat?')) {
                                      deleteChatMutation.mutate(chat.id);
                                    }
                                  }}
                                  disabled={deleteChatMutation.isPending}
                                  data-testid={`button-delete-chat-${chat.telegramChatId}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message Area */}
        <div className="col-span-8">
          <Card className="h-full flex flex-col">
            {composing ? (
              /* Compose Message */
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Nuovo Messaggio Telegram
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setComposing(false)}
                    >
                      Annulla
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Destinatario (Chat ID o @username)</Label>
                    <Input
                      id="recipient"
                      placeholder="es: 123456789 o @username"
                      value={recipientUsername}
                      onChange={(e) => setRecipientUsername(e.target.value)}
                      data-testid="input-telegram-recipient"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Template Telegram</Label>
                    <Select onValueChange={(value) => {
                      const template = templates?.find(t => t.id === value);
                      if (template) useTemplate(template);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>{template.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {template.category}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="message">Messaggio</Label>
                      <div className="text-xs text-muted-foreground">
                        {characterCount} caratteri • Gratuito
                      </div>
                    </div>
                    <Textarea
                      id="message"
                      placeholder="Scrivi il tuo messaggio Telegram..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="h-32 resize-none"
                      maxLength={4096} // Telegram limit
                      data-testid="textarea-telegram-message"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={sendMessage}
                      disabled={!messageInput.trim() || !recipientUsername.trim() || sendMessageMutation.isPending}
                      className="flex items-center gap-2"
                      data-testid="button-send-telegram"
                    >
                      <Send className="h-4 w-4" />
                      {sendMessageMutation.isPending ? 'Invio...' : 'Invia Telegram'}
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : selectedChat ? (
              /* View Conversation */
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {selectedChat.chatType === 'private' ? (
                          <User className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Users className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{getContactName(selectedChat)}</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedChat.username ? `@${selectedChat.username}` : selectedChat.telegramChatId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {selectedChat.messageCount} messaggi
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 p-4 overflow-hidden">
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {messagesLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                          <p className="text-sm text-muted-foreground">Caricamento messaggi...</p>
                        </div>
                      ) : !messages || messages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Nessun messaggio in questa chat</p>
                          <p className="text-xs">Invia il primo messaggio per iniziare la conversazione</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.isOutgoing ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-3 py-2 ${
                                message.isOutgoing
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <div className="flex items-center justify-between mt-1 gap-2">
                                <span className={`text-xs ${message.isOutgoing ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                  {new Date(message.timestamp).toLocaleString('it-IT', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    day: '2-digit',
                                    month: '2-digit'
                                  })}
                                </span>
                                {message.isOutgoing && (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-blue-100" />
                                    {message.aiGenerated && (
                                      <Zap className="h-3 w-3 text-yellow-300" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>

                <div className="border-t p-4 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Template Telegram</Label>
                    <Select onValueChange={(value) => {
                      const template = templates?.find(t => t.id === value);
                      if (template) useTemplate(template);
                    }}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Seleziona template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3" />
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

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="message-input" className="text-sm">Messaggio</Label>
                      <div className="text-xs text-muted-foreground">
                        {characterCount}/4096 • Gratuito
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        id="message-input"
                        placeholder="Scrivi un messaggio Telegram..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className="h-16 resize-none flex-1"
                        maxLength={4096}
                        data-testid="textarea-telegram-conversation"
                      />
                      <Button 
                        onClick={sendMessage}
                        disabled={!messageInput.trim() || sendMessageMutation.isPending}
                        className="self-end"
                        data-testid="button-send-telegram-conversation"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* No Selection */
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Bot className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold">Telegram Bot</h3>
                    <p className="text-muted-foreground">Seleziona una chat o crea un nuovo messaggio</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}