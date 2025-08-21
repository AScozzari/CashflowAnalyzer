import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  AlertCircle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TelegramChat {
  id: string;
  telegramChatId: string;
  chatType: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  lastMessageAt?: string;
  messageCount: number;
  isBlocked: boolean;
  linkedCustomerId?: string;
  linkedResourceId?: string;
}

interface TelegramTemplate {
  id: string;
  name: string;
  type: 'message' | 'command' | 'inline_keyboard';
  category: 'welcome' | 'support' | 'info' | 'marketing' | 'automation';
  content: string;
  parseMode: 'HTML' | 'Markdown' | 'MarkdownV2';
  variables: string[];
  usageCount: number;
  isActive: boolean;
}

export function TelegramInterface() {
  const [selectedChat, setSelectedChat] = useState<TelegramChat | null>(null);
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showChatSelector, setShowChatSelector] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries  
  const { data: chats, isLoading: chatsLoading, refetch: refetchChats } = useQuery({
    queryKey: ['/api/telegram/chats'],
    enabled: true,
    refetchInterval: 10000 // Refresh ogni 10 secondi per nuove chat
  }) as { data: TelegramChat[], isLoading: boolean, refetch: () => void };

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/telegram/templates'],
    enabled: true
  }) as { data: TelegramTemplate[], isLoading: boolean };

  const { data: stats } = useQuery({
    queryKey: ['/api/telegram/stats'],
    enabled: true
  }) as { data: any };

  const { data: customers } = useQuery({
    queryKey: ['/api/customers'],
    enabled: true
  }) as { data: any[] };

  const { data: resources } = useQuery({
    queryKey: ['/api/resources'],
    enabled: true
  }) as { data: any[] };

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { chatId: string; message: string; parseMode?: string }) => {
      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Messaggio Telegram inviato con successo!" });
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/chats'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore invio messaggio", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const sendTemplateMutation = useMutation({
    mutationFn: async (data: { chatId: string; templateId: string; variables?: Record<string, string> }) => {
      const response = await fetch('/api/telegram/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to send template');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Template Telegram inviato con successo!" });
      setSelectedTemplate('');
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/chats'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore invio template", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Filtered chats for search
  const filteredChats = (chats || []).filter((chat: TelegramChat) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      chat.firstName?.toLowerCase().includes(searchLower) ||
      chat.lastName?.toLowerCase().includes(searchLower) ||
      chat.username?.toLowerCase().includes(searchLower) ||
      chat.title?.toLowerCase().includes(searchLower) ||
      chat.phoneNumber?.includes(searchTerm)
    );
  });

  const handleSendMessage = () => {
    if (!selectedChat || !message.trim()) return;
    
    sendMessageMutation.mutate({
      chatId: selectedChat.telegramChatId,
      message: message,
      parseMode: 'HTML'
    });
  };

  const handleSendTemplate = () => {
    if (!selectedChat || !selectedTemplate) return;
    
    const template = templates?.find((t: TelegramTemplate) => t.id === selectedTemplate);
    if (!template) return;

    // Basic variable substitution
    const variables: Record<string, string> = {};
    if (selectedChat.firstName) variables.nome = selectedChat.firstName;
    if (selectedChat.lastName) variables.cognome = selectedChat.lastName;
    if (selectedChat.username) variables.username = selectedChat.username;

    sendTemplateMutation.mutate({
      chatId: selectedChat.telegramChatId,
      templateId: selectedTemplate,
      variables
    });
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

  const getLinkedEntityName = (chat: TelegramChat) => {
    if (chat.linkedCustomerId && customers && Array.isArray(customers)) {
      const customer = customers.find((c: any) => c.id === chat.linkedCustomerId);
      return customer ? `Cliente: ${customer.businessName || customer.firstName + ' ' + customer.lastName}` : null;
    }
    if (chat.linkedResourceId && resources && Array.isArray(resources)) {
      const resource = resources.find((r: any) => r.id === chat.linkedResourceId);
      return resource ? `Risorsa: ${resource.firstName} ${resource.lastName}` : null;
    }
    return null;
  };

  if (chatsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <TelegramIcon className="h-4 w-4 animate-spin" />
            <span>Caricamento chat Telegram...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con statistiche */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TelegramIcon className="h-5 w-5 text-blue-500" />
              <CardTitle>Interfaccia Telegram</CardTitle>
            </div>
            <div className="flex items-center space-x-4">
              {stats && (
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Bot className="h-3 w-3" />
                    <span>Bot: {stats?.isInitialized ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{stats?.totalChats || 0} chat</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{stats?.totalTemplates || 0} template</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Selector */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Seleziona Chat</CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca chat..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-telegram-chats"
                />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredChats.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nessuna chat trovata</p>
                      <p className="text-xs">Le chat appariranno dopo il primo messaggio</p>
                    </div>
                  ) : (
                    filteredChats.map((chat: TelegramChat) => (
                      <div
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedChat?.id === chat.id 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                            : 'border-border hover:bg-muted'
                        }`}
                        data-testid={`telegram-chat-${chat.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                {chat.chatType === 'private' ? (
                                  <User className="h-3 w-3" />
                                ) : (
                                  <Users className="h-3 w-3" />
                                )}
                                <span className="font-medium text-sm truncate">
                                  {getContactName(chat)}
                                </span>
                              </div>
                              {chat.isBlocked && (
                                <Badge variant="secondary" className="text-xs">
                                  Bloccato
                                </Badge>
                              )}
                            </div>
                            
                            {chat.username && (
                              <p className="text-xs text-muted-foreground">@{chat.username}</p>
                            )}
                            
                            {chat.phoneNumber && (
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{chat.phoneNumber}</span>
                              </div>
                            )}
                            
                            {getLinkedEntityName(chat) && (
                              <p className="text-xs text-blue-600 dark:text-blue-400">
                                {getLinkedEntityName(chat)}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                <MessageSquare className="h-3 w-3" />
                                <span>{chat.messageCount} msg</span>
                              </div>
                              {chat.lastMessageAt && (
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{new Date(chat.lastMessageAt).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Messaggi Interface */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {selectedChat ? `Chat con ${getContactName(selectedChat)}` : 'Seleziona una chat'}
              </CardTitle>
              {selectedChat && (
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="capitalize">
                    {selectedChat.chatType}
                  </Badge>
                  <span>ID: {selectedChat.telegramChatId}</span>
                  {selectedChat.lastMessageAt && (
                    <span>Ultimo messaggio: {new Date(selectedChat.lastMessageAt).toLocaleString()}</span>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedChat ? (
                <>
                  {/* Template Selector */}
                  <div className="space-y-2">
                    <Label htmlFor="template-select">Template Predefinito</Label>
                    <div className="flex space-x-2">
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Seleziona template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {templates?.filter((t: TelegramTemplate) => t.isActive).map((template: TelegramTemplate) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {template.category}
                                </Badge>
                                <span>{template.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleSendTemplate}
                        disabled={!selectedTemplate || sendTemplateMutation.isPending}
                        variant="outline"
                        data-testid="button-send-telegram-template"
                      >
                        {sendTemplateMutation.isPending ? 'Invio...' : 'Usa Template'}
                      </Button>
                    </div>
                  </div>

                  {/* Template Preview */}
                  {selectedTemplate && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Anteprima Template:</div>
                      <div className="text-sm">
                        {templates?.find((t: TelegramTemplate) => t.id === selectedTemplate)?.content}
                      </div>
                    </div>
                  )}

                  {/* Custom Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Messaggio Personalizzato</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Scrivi il tuo messaggio..."
                      className="min-h-[100px]"
                      data-testid="textarea-telegram-message"
                    />
                    <div className="text-xs text-muted-foreground">
                      Supporta HTML: <code>&lt;b&gt;grassetto&lt;/b&gt;</code>, <code>&lt;i&gt;corsivo&lt;/i&gt;</code>, <code>&lt;a href="url"&gt;link&lt;/a&gt;</code>
                    </div>
                  </div>

                  {/* Send Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sendMessageMutation.isPending}
                      data-testid="button-send-telegram-message"
                    >
                      <TelegramIcon className="h-4 w-4 mr-2" />
                      {sendMessageMutation.isPending ? 'Invio in corso...' : 'Invia Messaggio'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <TelegramIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Seleziona una chat per iniziare a inviare messaggi</p>
                  <p className="text-xs mt-1">Le chat vengono create automaticamente quando gli utenti scrivono al bot</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}