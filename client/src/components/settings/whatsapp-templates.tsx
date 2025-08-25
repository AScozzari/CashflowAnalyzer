import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WhatsAppTemplateForm } from "./whatsapp-template-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, MessageSquare, Plus, Edit, Trash2, Phone, Smartphone, Shield, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type InsertWhatsappTemplate } from "@shared/schema";

export function WhatsAppTemplates() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch WhatsApp templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/whatsapp/templates'],
    refetchOnWindowFocus: false
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (templateData: InsertWhatsappTemplate) => 
      apiRequest('/api/whatsapp/templates', 'POST', templateData),
    onSuccess: () => {
      toast({
        title: "Template creato",
        description: "Il template è stato salvato con successo"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/templates'] });
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Errore creazione template",
        description: error.message || "Impossibile creare il template",
        variant: "destructive",
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, ...templateData }: InsertWhatsappTemplate & { id: string }) =>
      apiRequest(`/api/whatsapp/templates/${id}`, 'PUT', templateData),
    onSuccess: () => {
      toast({
        title: "Template aggiornato",
        description: "Le modifiche sono state salvate con successo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/templates'] });
      setIsFormOpen(false);
      setEditingTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore aggiornamento template",
        description: error.message || "Impossibile aggiornare il template",
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) =>
      apiRequest(`/api/whatsapp/templates/${templateId}`, 'DELETE'),
    onSuccess: () => {
      toast({
        title: "Template eliminato",
        description: "Il template è stato rimosso con successo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/templates'] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore eliminazione template",
        description: error.message || "Impossibile eliminare il template",
        variant: "destructive",
      });
    },
  });

  // Import templates from Twilio mutation
  const importTemplatesMutation = useMutation({
    mutationFn: () => apiRequest('/api/whatsapp/templates/import', 'POST'),
    onSuccess: (data: any) => {
      toast({
        title: "Sincronizzazione completata",
        description: `Importati ${data.imported?.length || 0} template da Twilio`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/templates'] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore sincronizzazione",
        description: error.message || "Impossibile sincronizzare con Twilio",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleTemplateSubmit = async (templateData: InsertWhatsappTemplate) => {
    if (editingTemplate) {
      await updateTemplateMutation.mutateAsync({ ...templateData, id: editingTemplate.id });
    } else {
      await createTemplateMutation.mutateAsync(templateData);
    }
  };

  // Handle edit template
  const openEditDialog = (template: any) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  // Handle new template
  const openNewDialog = () => {
    setEditingTemplate(null);
    setIsFormOpen(true);
  };

  // Close form
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTemplate(null);
  };

  // Get provider icon
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'twilio':
        return <Phone className="h-4 w-4 text-blue-500" />;
      case 'linkmobility':
        return <Smartphone className="h-4 w-4 text-purple-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get category badge
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'AUTHENTICATION':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Shield className="w-3 h-3 mr-1" />Auth</Badge>;
      case 'UTILITY':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Utility</Badge>;
      case 'MARKETING':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Marketing</Badge>;
      default:
        return <Badge variant="secondary">{category}</Badge>;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Approvato</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">In Attesa</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rifiutato</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Template WhatsApp</h2>
          <p className="text-muted-foreground">
            Gestisci i template per i messaggi WhatsApp Business
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => importTemplatesMutation.mutate()}
            variant="outline"
            disabled={importTemplatesMutation.isPending}
            data-testid="button-sync-templates"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${importTemplatesMutation.isPending ? 'animate-spin' : ''}`} />
            {importTemplatesMutation.isPending ? 'Sincronizzando...' : 'Sincronizza con Twilio'}
          </Button>
          <Button 
            onClick={openNewDialog} 
            className="bg-green-600 hover:bg-green-700"
            data-testid="button-new-template"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Template
          </Button>
        </div>
      </div>

      {/* Guidelines Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Meta WhatsApp Business 2024:</strong> I template devono essere approvati da Meta prima dell'uso. 
          Utilizza variabili sequenziali ({`{{1}}, {{2}}, {{3}}`}) e rispetta le linee guida per ogni categoria.
        </AlertDescription>
      </Alert>

      <Separator />

      {/* Template Form Modal */}
      <WhatsAppTemplateForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={handleTemplateSubmit}
        template={editingTemplate}
      />

      {/* Templates List */}
      <div className="grid gap-4">
        {templatesLoading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Caricamento template...</p>
            </CardContent>
          </Card>
        ) : !templates || (templates as any[]).length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Nessun template trovato</h3>
              <p className="text-muted-foreground mb-4">
                Crea il tuo primo template WhatsApp per iniziare
              </p>
              <Button onClick={openNewDialog} data-testid="button-first-template">
                <Plus className="w-4 h-4 mr-2" />
                Crea Primo Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          (templates as any[]).map((template: any) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(template.provider)}
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription>
                        Provider: {template.provider} | Lingua: {template.language}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(template.category)}
                    {template.status && getStatusBadge(template.status)}
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(template)}
                        data-testid={`button-edit-${template.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTemplateMutation.mutate(template.id)}
                        disabled={deleteTemplateMutation.isPending}
                        data-testid={`button-delete-${template.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">
                      {typeof template.body === 'object' ? template.body?.content : template.body}
                    </p>
                  </div>
                  
                  {template.footer?.content && (
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      {template.footer.content}
                    </div>
                  )}

                  {template.description && (
                    <div className="text-sm text-muted-foreground">
                      {template.description}
                    </div>
                  )}

                  {template.tags && template.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {template.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}