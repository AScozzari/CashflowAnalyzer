import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Globe, 
  FileText, 
  Upload, 
  Link as LinkIcon, 
  Search, 
  Brain, 
  Trash2, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  X
} from "lucide-react";

// Schemi di validazione
const webContextSchema = z.object({
  url: z.string().url("Inserisci un URL valido"),
  query: z.string().min(10, "Descrivi cosa cercare (minimo 10 caratteri)"),
  title: z.string().optional()
});

const documentContextSchema = z.object({
  description: z.string().min(5, "Descrivi il documento (minimo 5 caratteri)")
});

type WebContextFormData = z.infer<typeof webContextSchema>;
type DocumentContextFormData = z.infer<typeof documentContextSchema>;

interface WebContext {
  id: string;
  url: string;
  title: string;
  query: string;
  status: 'active' | 'processing' | 'error';
  extractedContent?: string;
  createdAt: string;
}

interface DocumentContext {
  id: string;
  filename: string;
  description: string;
  status: 'active' | 'processing' | 'error';
  extractedContent?: string;
  createdAt: string;
}

export default function AIContextOptimization() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch contesti web
  const { data: webContexts = [], refetch: refetchWebContexts } = useQuery<WebContext[]>({
    queryKey: ['/api/ai/web-contexts'],
    retry: false,
  });

  // Fetch contesti documenti
  const { data: documentContexts = [], refetch: refetchDocumentContexts } = useQuery<DocumentContext[]>({
    queryKey: ['/api/ai/document-contexts'],
    retry: false,
  });

  // Form per contesto web
  const webForm = useForm<WebContextFormData>({
    resolver: zodResolver(webContextSchema),
    defaultValues: {
      url: "",
      query: "",
      title: ""
    }
  });

  // Form per documento
  const documentForm = useForm<DocumentContextFormData>({
    resolver: zodResolver(documentContextSchema),
    defaultValues: {
      description: ""
    }
  });

  // Aggiungi contesto web
  const addWebContextMutation = useMutation({
    mutationFn: async (data: WebContextFormData) => {
      return await apiRequest('POST', '/api/ai/web-contexts', data);
    },
    onSuccess: () => {
      refetchWebContexts();
      webForm.reset();
      toast({
        title: "✅ Contesto Web Aggiunto",
        description: "La fonte web è stata aggiunta con successo al contesto AI",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiungere il contesto web",
        variant: "destructive",
      });
    },
  });

  // Aggiungi contesto documento
  const addDocumentContextMutation = useMutation({
    mutationFn: async (data: { file: File; description: string }) => {
      const formData = new FormData();
      formData.append('document', data.file);
      formData.append('description', data.description);

      const response = await fetch('/api/ai/document-contexts', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore caricamento documento');
      }

      return response.json();
    },
    onSuccess: () => {
      refetchDocumentContexts();
      documentForm.reset();
      setSelectedFile(null);
      toast({
        title: "✅ Documento Aggiunto",
        description: "Il documento è stato aggiunto con successo al contesto AI",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile caricare il documento",
        variant: "destructive",
      });
    },
  });

  // Rimuovi contesto web
  const removeWebContextMutation = useMutation({
    mutationFn: async (contextId: string) => {
      return await apiRequest('DELETE', `/api/ai/web-contexts/${contextId}`);
    },
    onSuccess: () => {
      refetchWebContexts();
      toast({
        title: "Contesto Rimosso",
        description: "La fonte web è stata rimossa dal contesto AI",
      });
    },
  });

  // Rimuovi contesto documento
  const removeDocumentContextMutation = useMutation({
    mutationFn: async (contextId: string) => {
      return await apiRequest('DELETE', `/api/ai/document-contexts/${contextId}`);
    },
    onSuccess: () => {
      refetchDocumentContexts();
      toast({
        title: "Documento Rimosso",
        description: "Il documento è stato rimosso dal contesto AI",
      });
    },
  });

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File troppo grande",
        description: "Il file deve essere inferiore a 10MB",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
  };

  // Handle drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Submit handlers
  const onWebSubmit = (data: WebContextFormData) => {
    addWebContextMutation.mutate(data);
  };

  const onDocumentSubmit = (data: DocumentContextFormData) => {
    if (!selectedFile) {
      toast({
        title: "Nessun file selezionato",
        description: "Seleziona un documento da caricare",
        variant: "destructive",
      });
      return;
    }

    addDocumentContextMutation.mutate({
      file: selectedFile,
      description: data.description
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data non valida';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
            <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold">Ottimizzazione Contesti AI</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Migliora la precisione delle risposte del Consulente Fiscale attraverso web search e analisi documenti
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contesto Web */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-green-600" />
              Contesto Web
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Aggiungi informazioni da fonti web per migliorare il contesto delle risposte
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...webForm}>
              <form onSubmit={webForm.handleSubmit(onWebSubmit)} className="space-y-4">
                <FormField
                  control={webForm.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL o fonte web</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://esempio.com/normativa-fiscale..."
                          className="w-full"
                          data-testid="input-web-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={webForm.control}
                  name="query"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Query per il contesto</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Descrivi cosa cercare nel web per migliorare il contesto..."
                          className="w-full h-20"
                          data-testid="input-web-query"
                        />
                      </FormControl>
                      <FormDescription>
                        Spiega che tipo di informazioni cercare nella fonte web
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={addWebContextMutation.isPending}
                  data-testid="button-add-web-context"
                >
                  {addWebContextMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Elaborazione...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Ottimizza Contesto
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Lista contesti web attivi */}
            {webContexts.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <h4 className="font-medium text-sm">Contesti Web Attivi</h4>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {webContexts.map((context) => (
                      <div key={context.id} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg border">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <LinkIcon className="w-3 h-3 text-green-600" />
                            <span className="text-xs font-medium truncate">{context.title || new URL(context.url).hostname}</span>
                            <Badge variant={context.status === 'active' ? 'default' : context.status === 'processing' ? 'secondary' : 'destructive'}>
                              {context.status === 'active' ? 'Attivo' : context.status === 'processing' ? 'Processing' : 'Errore'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{context.query}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatDate(context.createdAt)}</span>
                            <a href={context.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                              <ExternalLink className="w-3 h-3" />
                              Link
                            </a>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeWebContextMutation.mutate(context.id)}
                          data-testid={`button-remove-web-context-${context.id}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analisi Documenti */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600" />
              Analisi Documenti
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Carica documenti per migliorare il contesto fiscale
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-muted hover:border-blue-400 hover:bg-muted/30'
              }`}
              data-testid="document-upload-area"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.xml"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
              />
              
              <div className="space-y-3">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-medium">
                    {selectedFile ? selectedFile.name : "Seleziona documento"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF, Word, Excel, Immagini, XML (Max 10MB)
                  </p>
                </div>
                {selectedFile && (
                  <Badge variant="outline" className="mt-2">
                    {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                  </Badge>
                )}
              </div>
            </div>

            <Form {...documentForm}>
              <form onSubmit={documentForm.handleSubmit(onDocumentSubmit)} className="space-y-4">
                <FormField
                  control={documentForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrizione documento</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Descrivi il tipo di documento e le informazioni rilevanti..."
                          className="w-full h-20"
                          data-testid="input-document-description"
                        />
                      </FormControl>
                      <FormDescription>
                        Spiega che tipo di informazioni contiene il documento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!selectedFile || addDocumentContextMutation.isPending}
                  data-testid="button-analyze-document"
                >
                  {addDocumentContextMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analizzando...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Analizza Documento
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Lista documenti attivi */}
            {documentContexts.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <h4 className="font-medium text-sm">Documenti Analizzati</h4>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {documentContexts.map((context) => (
                      <div key={context.id} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg border">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-3 h-3 text-blue-600" />
                            <span className="text-xs font-medium truncate">{context.filename}</span>
                            <Badge variant={context.status === 'active' ? 'default' : context.status === 'processing' ? 'secondary' : 'destructive'}>
                              {context.status === 'active' ? 'Attivo' : context.status === 'processing' ? 'Processing' : 'Errore'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{context.description}</p>
                          <span className="text-xs text-muted-foreground">{formatDate(context.createdAt)}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeDocumentContextMutation.mutate(context.id)}
                          data-testid={`button-remove-document-context-${context.id}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informazioni aggiuntive */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Come funziona:</strong> I contesti web e documenti che aggiungi qui verranno utilizzati dal Consulente Fiscale AI per fornire risposte più precise e aggiornate. Assicurati di aggiungere fonti affidabili e documenti rilevanti per il tuo settore.
        </AlertDescription>
      </Alert>
    </div>
  );
}