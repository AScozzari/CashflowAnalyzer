import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Edit2, Trash2, Shield, Crown, Settings } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Schema per creazione/modifica utente sistema
const systemUserSchema = z.object({
  username: z.string().min(3, "Username deve avere almeno 3 caratteri"),
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "Password deve avere almeno 6 caratteri"),
  role: z.enum(["admin", "finance"], {
    required_error: "Seleziona un ruolo"
  }),
});

type SystemUserFormData = z.infer<typeof systemUserSchema>;

// Helper per i ruoli sistema
const SYSTEM_ROLES = {
  admin: {
    label: "Admin",
    description: "Accesso completo dati, configurazioni e gestione sistema",
    icon: Shield,
    color: "bg-blue-500",
    badge: "default" as const
  },
  finance: {
    label: "Finance", 
    description: "Gestione movimenti finanziari e analytics avanzate",
    icon: Settings,
    color: "bg-green-500",
    badge: "secondary" as const
  }
};

// Tipo per User dal database
interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  resourceId?: string | null;
  lastLogin?: string;
}

// Filtro per identificare utenti sistema (no resourceId + ruoli admin/finance)
function isSystemUser(user: User) {
  return !user.resourceId && ['admin', 'finance'].includes(user.role);
}

export default function SystemUsersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query per ottenere tutti gli utenti e filtrare quelli di sistema
  const { data: allUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Filtra solo utenti di sistema
  const systemUsers = (allUsers as User[]).filter(isSystemUser);

  // Filtra per ricerca
  const filteredUsers = systemUsers.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    SYSTEM_ROLES[user.role as keyof typeof SYSTEM_ROLES]?.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Form per creazione/modifica
  const form = useForm<SystemUserFormData>({
    resolver: zodResolver(systemUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: "admin",
    },
  });

  // Mutation per creare utente sistema
  const createMutation = useMutation({
    mutationFn: async (data: SystemUserFormData) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          resourceId: null, // Importante: NO collegamento a risorsa
        }),
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Utente sistema creato",
        description: "L'utente amministratore è stato aggiunto con successo.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Impossibile creare l'utente sistema.",
        variant: "destructive",
      });
    },
  });

  // Mutation per eliminare utente
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Utente eliminato",
        description: "L'utente sistema è stato rimosso con successo.",
      });
    },
  });

  const onSubmit = (data: SystemUserFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
      username: user.username,
      email: user.email,
      password: "", // Non precompilare la password per sicurezza
      role: user.role as "admin" | "finance",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (userId: string) => {
    if (confirm("Sei sicuro di voler eliminare questo utente sistema?")) {
      deleteMutation.mutate(userId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con ricerca e bottone nuovo */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Utenti Sistema
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestisci amministratori e utenti con accesso al sistema
          </p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cerca utenti sistema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-system-users"
            />
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-system-user">
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "Modifica Utente Sistema" : "Nuovo Utente Sistema"}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-username" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} data-testid="input-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ruolo Sistema</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-role">
                              <SelectValue placeholder="Seleziona ruolo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(SYSTEM_ROLES).map(([value, config]) => {
                              const Icon = config.icon;
                              return (
                                <SelectItem key={value} value={value}>
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1 rounded ${config.color} text-white`}>
                                      <Icon className="h-3 w-3" />
                                    </div>
                                    <div>
                                      <div className="font-medium">{config.label}</div>
                                      <div className="text-xs text-gray-500">{config.description}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setEditingUser(null);
                        form.reset();
                      }}
                    >
                      Annulla
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending}
                      data-testid="button-save-system-user"
                    >
                      {createMutation.isPending ? "Salvando..." : editingUser ? "Aggiorna" : "Crea"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista utenti sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Amministratori Sistema ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Caricamento utenti...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {searchTerm ? "Nessun utente trovato" : "Nessun amministratore configurato"}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const roleConfig = SYSTEM_ROLES[user.role as keyof typeof SYSTEM_ROLES];
                const Icon = roleConfig?.icon || Shield;
                
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    data-testid={`user-system-${user.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${roleConfig?.color || 'bg-gray-500'} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={roleConfig?.badge || "default"}>
                            {roleConfig?.label || user.role}
                          </Badge>
                          {user.lastLogin && (
                            <span className="text-xs text-gray-400">
                              Ultimo accesso: {new Date(user.lastLogin).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        data-testid={`button-edit-${user.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-delete-${user.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info sui ruoli */}
      <Card>
        <CardHeader>
          <CardTitle>Ruoli Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(SYSTEM_ROLES).map(([role, config]) => {
              const Icon = config.icon;
              return (
                <div key={role} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded ${config.color} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-medium">{config.label}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {config.description}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}