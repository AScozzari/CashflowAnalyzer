import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, TestTube, Mail, Edit, FileText } from 'lucide-react';
import type { SendgridTemplate, InsertSendgridTemplate } from '@shared/schema';

const TEMPLATE_CATEGORIES = [
  { value: 'password_reset', label: 'Recupero Password', icon: '🔑', color: 'bg-red-100 text-red-800' },
  { value: 'notification', label: 'Notifiche Generali', icon: '🔔', color: 'bg-blue-100 text-blue-800' },
  { value: 'invoice', label: 'Fatture', icon: '📄', color: 'bg-green-100 text-green-800' },
  { value: 'welcome', label: 'Benvenuto', icon: '👋', color: 'bg-purple-100 text-purple-800' },
  { value: 'alert', label: 'Avvisi Urgenti', icon: '⚠️', color: 'bg-orange-100 text-orange-800' },
  { value: 'report', label: 'Report', icon: '📊', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'reminder', label: 'Promemoria', icon: '⏰', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'verification', label: 'Verifica Account', icon: '✅', color: 'bg-teal-100 text-teal-800' }
];

export function SendGridTemplatesManager() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SendgridTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<InsertSendgridTemplate>>({
    name: '',
    subject: '',
    category: 'notification',
    templateId: '',
    description: '',
    variables: '',
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates, isLoading } = useQuery<SendgridTemplate[]>({
    queryKey: ['/api/sendgrid/templates'],
  });

  // Create template mutation
  const createTemplate = useMutation({
    mutationFn: async (template: InsertSendgridTemplate) => {
      const response = await fetch('/api/sendgrid/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (!response.ok) throw new Error('Errore nella creazione del template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sendgrid/templates'] });
      toast({ title: 'Template creato con successo' });
      setIsAdding(false);
      setNewTemplate({
        name: '',
        subject: '',
        category: 'notification',
        templateId: '',
        description: '',
        variables: '',
        isActive: true
      });
    },
    onError: () => {
      toast({ title: 'Errore nella creazione del template', variant: 'destructive' });
    }
  });

  // Delete template mutation
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/sendgrid/templates/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Errore nella cancellazione del template');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sendgrid/templates'] });
      toast({ title: 'Template eliminato con successo' });
    },
    onError: () => {
      toast({ title: 'Errore nella cancellazione del template', variant: 'destructive' });
    }
  });

  // Test template mutation
  const testTemplate = useMutation({
    mutationFn: async ({ templateId, testEmail }: { templateId: string; testEmail: string }) => {
      const response = await fetch('/api/sendgrid/templates/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, testEmail }),
      });
      if (!response.ok) throw new Error('Errore nel test del template');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Email di test inviata con successo' });
    },
    onError: () => {
      toast({ title: 'Errore nell\'invio dell\'email di test', variant: 'destructive' });
    }
  });

  const handleSubmit = () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.templateId) {
      toast({ title: 'Compila tutti i campi obbligatori', variant: 'destructive' });
      return;
    }
    createTemplate.mutate(newTemplate as InsertSendgridTemplate);
  };

  const getCategoryInfo = (category: string) => {
    return TEMPLATE_CATEGORIES.find(cat => cat.value === category) || TEMPLATE_CATEGORIES[0];
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Caricamento template...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Template SendGrid
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Gestisci template email categorizzati per diversi scenari
          </p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-2"
          data-testid="button-add-template"
        >
          <Plus className="w-4 h-4" />
          <span>Nuovo Template</span>
        </Button>
      </div>

      {/* Add Template Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5" />
              <span>Nuovo Template SendGrid</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Template</Label>
                <Input
                  id="name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Es: Password Reset Email"
                  data-testid="input-template-name"
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select 
                  value={newTemplate.category} 
                  onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger data-testid="select-template-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center space-x-2">
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject">Oggetto Email</Label>
                <Input
                  id="subject"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Es: Recupera la tua password"
                  data-testid="input-template-subject"
                />
              </div>
              <div>
                <Label htmlFor="templateId">Template ID SendGrid</Label>
                <Input
                  id="templateId"
                  value={newTemplate.templateId}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, templateId: e.target.value }))}
                  placeholder="d-abc123def456"
                  data-testid="input-template-id"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrizione uso del template..."
                data-testid="textarea-template-description"
              />
            </div>

            <div>
              <Label htmlFor="variables">Variabili Template (JSON)</Label>
              <Textarea
                id="variables"
                value={newTemplate.variables}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, variables: e.target.value }))}
                placeholder='{"first_name": "string", "reset_link": "string"}'
                data-testid="textarea-template-variables"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={newTemplate.isActive}
                  onCheckedChange={(checked) => setNewTemplate(prev => ({ ...prev, isActive: checked }))}
                  data-testid="switch-template-active"
                />
                <Label htmlFor="isActive">Template attivo</Label>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  Annulla
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createTemplate.isPending}
                  data-testid="button-save-template"
                >
                  {createTemplate.isPending ? 'Salvataggio...' : 'Salva Template'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates?.map((template) => {
          const categoryInfo = getCategoryInfo(template.category);
          
          return (
            <Card key={template.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className={categoryInfo.color}>
                    {categoryInfo.icon} {categoryInfo.label}
                  </Badge>
                  {template.isActive ? (
                    <Badge variant="default">Attivo</Badge>
                  ) : (
                    <Badge variant="secondary">Inattivo</Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Oggetto: {template.subject}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ID: {template.templateId}
                  </p>
                </div>
                
                {template.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {template.description}
                  </p>
                )}

                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const testEmail = prompt('Inserisci email di test:');
                      if (testEmail) {
                        testTemplate.mutate({ templateId: template.templateId, testEmail });
                      }
                    }}
                    disabled={testTemplate.isPending}
                    data-testid={`button-test-${template.id}`}
                  >
                    <TestTube className="w-3 h-3 mr-1" />
                    Test
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingTemplate(template)}
                    data-testid={`button-edit-${template.id}`}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Modifica
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Sei sicuro di voler eliminare questo template?')) {
                        deleteTemplate.mutate(template.id);
                      }
                    }}
                    disabled={deleteTemplate.isPending}
                    data-testid={`button-delete-${template.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {templates?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nessun template configurato
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Inizia creando il tuo primo template SendGrid categorizzato
            </p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crea primo template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}