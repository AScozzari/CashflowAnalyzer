import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, MessageSquare, Users, ShieldCheck, Plus, X, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { insertWhatsappTemplateSchema, type InsertWhatsappTemplate } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppTemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (template: InsertWhatsappTemplate) => Promise<void>;
  template?: any;
}

export function WhatsAppTemplateForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  template 
}: WhatsAppTemplateFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState({
    customerName: 'Mario Rossi',
    amount: '€ 1.250,00',
    dueDate: '31/12/2024'
  });

  const form = useForm<InsertWhatsappTemplate>({
    resolver: zodResolver(insertWhatsappTemplateSchema),
    defaultValues: {
      name: template?.name || '',
      provider: template?.provider || 'twilio',
      category: template?.category || 'UTILITY',
      language: template?.language || 'it',
      body: template?.body || { content: '', variables: [] },
      header: template?.header || undefined,
      footer: template?.footer || undefined,
      buttons: template?.buttons || undefined,
      tags: template?.tags || [],
      description: template?.description || ''
    }
  });

  const handleSubmit = async (data: InsertWhatsappTemplate) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast({
        title: "Template salvato",
        description: "Il template WhatsApp è stato salvato con successo"
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore nel salvataggio del template",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'AUTHENTICATION':
        return {
          icon: <ShieldCheck className="h-4 w-4 text-blue-500" />,
          description: 'Codici di verifica, autenticazione a due fattori',
          examples: 'OTP, conferme login, reset password'
        };
      case 'UTILITY':
        return {
          icon: <MessageSquare className="h-4 w-4 text-green-500" />,
          description: 'Notifiche, promemoria, aggiornamenti di stato',
          examples: 'Solleciti pagamento, conferme ordini, aggiornamenti'
        };
      case 'MARKETING':
        return {
          icon: <Users className="h-4 w-4 text-orange-500" />,
          description: 'Promozioni, offerte, campagne marketing',
          examples: 'Offerte speciali, newsletter, promozioni'
        };
      default:
        return { icon: null, description: '', examples: '' };
    }
  };

  const generatePreview = () => {
    const bodyData = form.watch('body');
    const bodyContent = typeof bodyData === 'object' ? bodyData?.content || '' : bodyData || '';
    let preview = bodyContent;
    
    // Replace placeholders with sample data  
    preview = preview.replace(/\{\{1\}\}/g, previewData.customerName);
    preview = preview.replace(/\{\{2\}\}/g, previewData.amount);
    preview = preview.replace(/\{\{3\}\}/g, previewData.dueDate);
    
    return preview;
  };

  const categoryInfo = getCategoryInfo(form.watch('category') || 'UTILITY');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {template ? 'Modifica Template WhatsApp' : 'Nuovo Template WhatsApp'}
          </DialogTitle>
          <DialogDescription>
            Crea template conformi alle linee guida di Meta WhatsApp Business Platform 2024
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Main Template Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informazioni Base</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Template</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="payment_reminder_utility" 
                            data-testid="input-template-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="provider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provider</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-provider">
                                <SelectValue placeholder="Seleziona provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="twilio">Twilio</SelectItem>
                              <SelectItem value="linkmobility">LinkMobility</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Seleziona categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                              <SelectItem value="UTILITY">Utility</SelectItem>
                              <SelectItem value="MARKETING">Marketing</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Category Info */}
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {categoryInfo.icon}
                      <span className="font-medium text-sm">Categoria {form.watch('category')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{categoryInfo.description}</p>
                    <p className="text-xs text-muted-foreground">Esempi: {categoryInfo.examples}</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrizione</FormLabel>
                        <FormControl>
                          <Input 
                            value={field.value || ''} 
                            onChange={field.onChange}
                            placeholder="Promemoria pagamento per clienti" 
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Template Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contenuto Template</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Corpo Messaggio</FormLabel>
                        <FormControl>
                          <Textarea
                            value={typeof field.value === 'object' ? field.value?.content || '' : field.value || ''}
                            onChange={(e) => field.onChange({ content: e.target.value, variables: [] })}
                            placeholder={`Ciao {{1}}, il pagamento di {{2}} scade il {{3}}. Grazie!`}
                            className="min-h-[120px]"
                            data-testid="textarea-body-content"
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground">
                          Usa {`{{1}}, {{2}}, {{3}}`} per variabili sequenziali
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="footer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Footer (Opzionale)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            value={typeof field.value === 'object' ? field.value?.content || '' : field.value || ''}
                            onChange={(e) => field.onChange({ content: e.target.value })}
                            placeholder="EasyCashFlows - Gestione Finanziaria"
                            maxLength={60}
                            data-testid="input-footer"
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground">
                          Massimo 60 caratteri
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Preview Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full"
                    data-testid="button-preview"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showPreview ? 'Nascondi Anteprima' : 'Mostra Anteprima'}
                  </Button>

                  {showPreview && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="font-medium text-sm mb-2 text-blue-800">Anteprima Messaggio</div>
                      <div className="whitespace-pre-wrap text-sm bg-white p-3 rounded border">
                        {generatePreview()}
                        {(() => {
                          const footerData = form.watch('footer');
                          const footerContent = typeof footerData === 'object' ? footerData?.content : footerData;
                          return footerContent && (
                            <div className="mt-2 pt-2 border-t text-xs text-gray-600">
                              {footerContent}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Guidelines Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Linee Guida Meta 2024:</strong> I template devono essere approvati da Meta WhatsApp Business Platform 
                prima dell'uso. Variabili sequenziali obbligatorie ({`{{1}}, {{2}}, {{3}}`}). Nessuna variabile adiacente consentita.
              </AlertDescription>
            </Alert>

            <Separator />

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-cancel"
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="button-save-template"
              >
                {isSubmitting ? 'Salvando...' : (template ? 'Aggiorna Template' : 'Salva Template')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}