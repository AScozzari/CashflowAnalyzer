import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Send, 
  Paperclip, 
  Archive, 
  Trash2,
  Reply,
  ReplyAll,
  Forward,
  Star,
  Clock,
  Search,
  Filter,
  Plus,
  FileText
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  starred: boolean;
  attachments?: string[];
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
}

export function EmailInterface() {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [composing, setComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  // Load emails from API
  const { data: emails = [] } = useQuery<Email[]>({
    queryKey: ['/api/emails'],
    retry: false,
  });

  // Load email templates from API
  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/email/templates'],
    retry: false,
  });

  const handleComposeWithTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setComposing(true);
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[800px]">
      {/* Sidebar con lista email */}
      <div className="col-span-4 space-y-4">
        {/* Compose Button */}
        <Button 
          onClick={() => setComposing(true)}
          className="w-full flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuova Email
        </Button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Email List */}
        <Card className="h-[600px] overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Inbox</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-y-auto h-[520px]">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                    selectedEmail?.id === email.id ? 'bg-muted' : ''
                  } ${!email.read ? 'font-semibold' : ''}`}
                  onClick={() => setSelectedEmail(email)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{email.from}</span>
                    <div className="flex items-center gap-1">
                      {email.starred && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                      {!email.read && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                    </div>
                  </div>
                  <h4 className="text-sm font-medium mb-1 truncate">{email.subject}</h4>
                  <p className="text-xs text-muted-foreground truncate">{email.body}</p>
                  <span className="text-xs text-muted-foreground">{email.timestamp}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="col-span-8 space-y-4">
        {composing ? (
          /* Compose Email */
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {selectedTemplate ? `Template: ${selectedTemplate.name}` : "Nuova Email"}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setComposing(false);
                    setSelectedTemplate(null);
                  }}
                >
                  Chiudi
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label>Template (opzionale)</Label>
                <Select onValueChange={(value) => {
                  const template = templates.find(t => t.id === value);
                  setSelectedTemplate(template || null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="to">A</Label>
                  <Input id="to" placeholder="destinatario@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cc">CC</Label>
                  <Input id="cc" placeholder="copia@example.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Oggetto</Label>
                <Input
                  id="subject"
                  placeholder="Oggetto dell'email"
                  defaultValue={selectedTemplate?.subject || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Messaggio</Label>
                <Textarea
                  id="body"
                  placeholder="Scrivi il tuo messaggio..."
                  className="h-64 resize-none"
                  defaultValue={selectedTemplate?.body || ""}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Allega File
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="outline">Salva Bozza</Button>
                  <Button className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Invia
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : selectedEmail ? (
          /* View Email */
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedEmail.subject}</h3>
                  <p className="text-sm text-muted-foreground">
                    Da: {selectedEmail.from} • {selectedEmail.timestamp}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{selectedEmail.body}</p>
              </div>

              {selectedEmail.attachments && (
                <div className="space-y-2">
                  <Label>Allegati</Label>
                  <div className="flex gap-2">
                    {selectedEmail.attachments.map((attachment, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        {attachment}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Reply className="h-4 w-4" />
                  Rispondi
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <ReplyAll className="h-4 w-4" />
                  Rispondi a Tutti
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Forward className="h-4 w-4" />
                  Inoltra
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Templates Overview */
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Template Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="p-4 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">{template.subject}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{template.category}</Badge>
                        <Button
                          size="sm"
                          onClick={() => handleComposeWithTemplate(template)}
                        >
                          Usa Template
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {template.body.substring(0, 100)}...
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}