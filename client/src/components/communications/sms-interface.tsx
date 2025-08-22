import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Smartphone, 
  Send, 
  Phone,
  MessageSquare,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  FileText,
  Settings,
  TestTube
} from "lucide-react";
import { ContactSearchEnhanced } from "./contact-search-enhanced";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface SMSMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  isOutgoing: boolean;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  cost?: number;
}

interface SMSContact {
  id: string;
  name: string;
  phone: string;
  lastMessage?: string;
  lastSeen: string;
  messageCount: number;
}

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
  characterCount: number;
}

export function SMSInterface() {
  const [selectedContact, setSelectedContact] = useState<SMSContact | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [composing, setComposing] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState("");

  // Real SMS conversations from database
  const { data: conversations, isLoading: conversationsLoading, refetch: refetchConversations } = useQuery({
    queryKey: ['/api/sms/conversations'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const contacts: SMSContact[] = conversations || [];

  // Real SMS messages from database
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/sms/messages', selectedContact?.phone],
    enabled: !!selectedContact?.phone
  });

  const chatMessages: SMSMessage[] = messages || [];

  // Real SMS templates from database
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/sms/templates']
  });

  const smsTemplates: SMSTemplate[] = templates || [];

  const getStatusIcon = (status: SMSMessage['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'sent':
        return <CheckCircle className="h-3 w-3 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-red-500" />;
    }
  };

  const getStatusText = (status: SMSMessage['status']) => {
    switch (status) {
      case 'pending': return 'In invio';
      case 'sent': return 'Inviato';
      case 'delivered': return 'Consegnato';
      case 'failed': return 'Fallito';
    }
  };

  const characterCount = messageInput.length;
  const smsCount = Math.ceil(characterCount / 160);
  const estimatedCost = smsCount * 0.10; // €0.10 per SMS

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch SMS settings to check if configured
  const { data: smsStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/sms/stats'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Send SMS mutation
  const sendSmsMutation = useMutation({
    mutationFn: async (data: { to: string; message: string }) => {
      const response = await apiRequest('POST', '/api/sms/send', data);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('[SMS] Message sent successfully:', data);
      toast({ 
        title: '✅ SMS Inviato!', 
        description: `Messaggio inviato a ${data.to}. ID: ${data.messageId}` 
      });
      setMessageInput("");
      if (composing) {
        setRecipientPhone("");
        setComposing(false);
      }
      
      // ✅ INVALIDATE CACHE to refresh conversations and messages
      queryClient.invalidateQueries({ queryKey: ['/api/sms/conversations'] });
      if (selectedContact?.phone) {
        queryClient.invalidateQueries({ queryKey: ['/api/sms/messages', selectedContact.phone] });
      }
    },
    onError: (error: any) => {
      console.error('[SMS] Error sending message:', error);
      toast({ 
        title: '❌ Errore Invio', 
        description: error.message || 'Impossibile inviare l\'SMS',
        variant: 'destructive'
      });
    }
  });

  // Test SMS connection mutation  
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/sms/test-connection');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ 
          title: '✅ Connessione SMS OK', 
          description: `Provider: ${data.provider}, User Key: ${data.userKey}` 
        });
      } else {
        toast({ 
          title: '❌ Test Fallito', 
          description: data.message || 'Errore nella connessione SMS',
          variant: 'destructive'
        });
      }
    },
    onError: () => {
      toast({ 
        title: '❌ Errore Test', 
        description: 'Impossibile testare la connessione SMS',
        variant: 'destructive'
      });
    }
  });

  const sendSMS = () => {
    if (!messageInput.trim()) {
      toast({ 
        title: 'Messaggio vuoto', 
        description: 'Inserisci un messaggio da inviare',
        variant: 'destructive'
      });
      return;
    }
    
    // Se l'utente ha digitato un numero diverso, usa quello invece del contatto selezionato
    const recipient = recipientPhone.trim() ? recipientPhone : selectedContact?.phone;
    if (!recipient) {
      toast({ 
        title: 'Destinatario mancante', 
        description: 'Seleziona un contatto o inserisci un numero',
        variant: 'destructive'
      });
      return;
    }

    // Clean phone number (remove spaces, dashes, +39 prefix if present)
    const cleanPhone = recipient.replace(/[\s\-+]/g, '').replace(/^39/, '');
    
    // Remove emoji and special characters for Skebby compatibility
    const cleanMessage = messageInput.replace(/[^\x00-\x7F]/g, '').trim();
    if (cleanMessage !== messageInput) {
      toast({ 
        title: '⚠️ Messaggio modificato', 
        description: 'Rimossi emoji e caratteri speciali per compatibilità SMS',
        variant: 'default'
      });
    }
    
    console.log('[SMS] Sending message:', cleanMessage, 'to:', cleanPhone);
    sendSmsMutation.mutate({ to: cleanPhone, message: cleanMessage });
  };

  const useTemplate = (template: SMSTemplate) => {
    setMessageInput(template.content);
  };

  return (
    <div className="space-y-4">
      {/* SMS Status Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-purple-600" />
                <h2 className="font-semibold">SMS Skebby</h2>
              </div>
              <div className="flex items-center gap-2">
                {smsStats?.isActive ? (
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
                {smsStats?.provider && (
                  <Badge variant="outline">
                    Provider: {smsStats.provider}
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
                data-testid="button-test-sms-connection"
              >
                <TestTube className="h-4 w-4" />
                {testConnectionMutation.isPending ? 'Testando...' : 'Test Connessione'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-6 h-[800px]">
        {/* Contacts Sidebar */}
        <div className="col-span-4 space-y-4">
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setComposing(true)}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Nuovo SMS
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
                const smsContact: SMSContact = {
                  id: contact.id,
                  name: contact.name,
                  phone: contact.phone || '',
                  lastMessage: 'Nessun SMS precedente',
                  lastSeen: 'Mai',
                  messageCount: 0
                };
                setSelectedContact(smsContact);
                setComposing(false);
              }}
              placeholder="Cerca contatti con numero di telefono..."
              filterByType={['resource', 'customer', 'supplier']}
            />
          </CardContent>
        </Card>

        <Card className="h-[680px] overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Conversazioni SMS</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                    selectedContact?.id === contact.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => {
                    setSelectedContact(contact);
                    setComposing(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium truncate">{contact.name}</h4>
                        <span className="text-xs text-muted-foreground">{contact.lastSeen}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">{contact.phone}</span>
                        <Badge variant="outline" className="text-xs">
                          {contact.messageCount} SMS
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* SMS Area */}
      <div className="col-span-8">
        <Card className="h-full flex flex-col">
          {composing ? (
            /* Compose SMS */
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Nuovo SMS
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setComposing(false)}
                  >
                    Chiudi
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Destinatario</Label>
                  <Input
                    id="recipient"
                    placeholder="+39 333 123 4567"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Template SMS</Label>
                  <Select onValueChange={(value) => {
                    const template = smsTemplates.find(t => t.id === value);
                    if (template) useTemplate(template);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(smsTemplates || []).map((template) => (
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
                      {characterCount}/160 • {smsCount} SMS • ~€{estimatedCost.toFixed(2)}
                    </div>
                  </div>
                  <Textarea
                    id="message"
                    placeholder="Scrivi il tuo messaggio SMS..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="h-32 resize-none"
                    maxLength={1000}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={sendSMS}
                    disabled={!messageInput.trim() || !recipientPhone.trim() || sendSmsMutation.isPending}
                    className="flex items-center gap-2"
                    data-testid="button-send-sms"
                  >
                    <Send className="h-4 w-4" />
                    {sendSmsMutation.isPending ? 'Invio...' : 'Invia SMS'}
                  </Button>
                </div>
              </CardContent>
            </>
          ) : selectedContact ? (
            /* View Conversation */
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedContact.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedContact.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {selectedContact.messageCount} SMS
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
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isOutgoing ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-3 py-2 ${
                            message.isOutgoing
                              ? 'bg-purple-500 text-white'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-1 gap-2">
                            <span className={`text-xs ${message.isOutgoing ? 'text-purple-100' : 'text-muted-foreground'}`}>
                              {message.timestamp}
                            </span>
                            {message.isOutgoing && (
                              <div className="flex items-center gap-1">
                                {getStatusIcon(message.status)}
                                <span className="text-xs text-purple-100">
                                  {getStatusText(message.status)}
                                </span>
                                {message.cost && (
                                  <span className="text-xs text-purple-100">
                                    €{message.cost.toFixed(2)}
                                  </span>
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

              <div className="border-t p-4 space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm">Template SMS</Label>
                  <Select onValueChange={(value) => {
                    const template = smsTemplates.find(t => t.id === value);
                    if (template) useTemplate(template);
                  }}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Seleziona template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(smsTemplates || []).map((template) => (
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
                      {characterCount}/160 • {smsCount} SMS • ~€{estimatedCost.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      id="message-input"
                      placeholder="Scrivi un SMS..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="h-16 resize-none flex-1"
                      maxLength={1000}
                    />
                    <Button 
                      onClick={sendSMS}
                      disabled={!messageInput.trim() || sendSmsMutation.isPending}
                      className="self-end"
                      data-testid="button-send-sms-conversation"
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
                <Smartphone className="h-16 w-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">Gestione SMS</h3>
                  <p className="text-muted-foreground">Seleziona una conversazione o crea un nuovo SMS</p>
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