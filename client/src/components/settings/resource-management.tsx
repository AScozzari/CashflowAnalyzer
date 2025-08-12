import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, Users, X, Upload, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { CitySelect } from "@/components/ui/city-select";
import type { UploadResult } from '@uppy/core';
import { insertResourceSchema, type Resource, type InsertResource, type Company, type Office } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

interface ResourceFormProps {
  resource?: Resource;
  onClose: () => void;
}

function ResourceForm({ resource, onClose }: ResourceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOffices, setSelectedOffices] = useState<string[]>(resource?.officeIds || []);
  const [avatarUrl, setAvatarUrl] = useState<string>(resource?.avatar || "");

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const form = useForm<InsertResource & { password?: string }>({
    resolver: zodResolver(insertResourceSchema.extend({
      password: resource ? z.string().optional() : z.string().min(6, "Password deve essere di almeno 6 caratteri")
    })),
    defaultValues: {
      firstName: resource?.firstName || "",
      lastName: resource?.lastName || "",
      taxCode: resource?.taxCode || "",
      email: resource?.email || "",
      address: resource?.address || "",
      zipCode: resource?.zipCode || "",
      city: resource?.city || "",
      country: resource?.country || "Italia",
      companyId: resource?.companyId || "",
      officeIds: resource?.officeIds || [],
      role: (resource?.role as "admin" | "finance" | "user") || "user",
      avatar: resource?.avatar || "",
      notes: resource?.notes || "",
      password: "",
    },
  });

  const selectedCompanyId = form.watch("companyId");

  // Fetch offices filtered by selected company
  const { data: offices = [] } = useQuery<Office[]>({
    queryKey: ["/api/offices", selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      const response = await fetch(`/api/offices?companyId=${selectedCompanyId}`);
      return response.json();
    },
    enabled: !!selectedCompanyId,
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertResource) => {
      if (resource) {
        return await apiRequest(`/api/resources/${resource.id}`, "PUT", data);
      } else {
        return await apiRequest("/api/resources", "POST", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({
        title: "Successo",
        description: `Risorsa ${resource ? "aggiornata" : "creata"} con successo`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertResource) => {
    mutation.mutate({
      ...data,
      officeIds: selectedOffices,
    });
  };

  const handleOfficeToggle = (officeId: string) => {
    setSelectedOffices(prev => 
      prev.includes(officeId) 
        ? prev.filter(id => id !== officeId)
        : [...prev, officeId]
    );
  };

  const removeOffice = (officeId: string) => {
    setSelectedOffices(prev => prev.filter(id => id !== officeId));
  };

  const getOfficeName = (officeId: string) => {
    if (!offices || !Array.isArray(offices)) return officeId;
    const office = offices.find(o => o.id === officeId);
    return office ? office.name : officeId;
  };

  // Avatar upload functions
  const handleGetUploadParameters = async () => {
    const response: any = await apiRequest("/api/objects/upload", "POST", {});
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleAvatarUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadUrl = (result.successful[0] as any).uploadURL;
      if (resource?.id && uploadUrl) {
        try {
          const response: any = await apiRequest(`/api/resources/${resource.id}/avatar`, "PUT", {
            avatarUrl: uploadUrl,
          });
          setAvatarUrl(response.avatarPath);
          form.setValue("avatar", response.avatarPath);
          toast({
            title: "Successo",
            description: "Avatar caricato con successo",
          });
          queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
        } catch (error: any) {
          toast({
            title: "Errore",
            description: error.message || "Errore durante il caricamento dell'avatar",
            variant: "destructive",
          });
        }
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Dati Anagrafici */}
        <div className="space-y-4 border-b pb-4">
          <h4 className="font-medium text-gray-900">Dati Anagrafici</h4>
          
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl ? `/objects/${avatarUrl.replace('/objects/', '')}` : undefined} />
              <AvatarFallback className="text-lg">
                {form.watch("firstName")?.[0]?.toUpperCase()}{form.watch("lastName")?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Foto Profilo</span>
              {resource?.id ? (
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5 * 1024 * 1024} // 5MB
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleAvatarUploadComplete}
                  buttonClassName="h-8 text-xs"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Cambia Avatar
                </ObjectUploader>
              ) : (
                <span className="text-xs text-muted-foreground">Salva la risorsa per aggiungere un avatar</span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="es. Mario" className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cognome *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="es. Rossi" className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="taxCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Codice Fiscale *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="es. RSSMRA80A01H501X" className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
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
                  <Input {...field} type="email" placeholder="es. mario.rossi@azienda.it" value={field.value || ""} className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!resource && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Iniziale *</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Password da cambiare al primo accesso" value={field.value || ""} className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    L'utente dovrà obbligatoriamente cambiare questa password al primo accesso
                  </p>
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Indirizzo</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="es. Via Roma 123" value={field.value || ""} className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Città</FormLabel>
                  <FormControl>
                    <CitySelect 
                      value={field.value || ""} 
                      onValueChange={field.onChange}
                      placeholder="Seleziona città..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CAP</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="es. 00100" value={field.value || ""} className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paese</FormLabel>
                  <FormControl>
                    <Input {...field} value="Italia" readOnly className="bg-gray-50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>


        </div>

        {/* Assegnazioni Aziendali */}
        <div className="space-y-4 border-b pb-4">
          <h4 className="font-medium text-gray-900">Assegnazioni Aziendali</h4>
          
          <FormField
            control={form.control}
            name="companyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ragione Sociale *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona ragione sociale" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name} ({company.legalForm})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sedi Operative - Multi Select */}
          <FormField
            control={form.control}
            name="officeIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sedi Operative (opzionale)</FormLabel>
                <div className="space-y-2">
                  {selectedOffices.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedOffices.map((officeId) => (
                        <Badge key={officeId} variant="secondary" className="pr-1">
                          {getOfficeName(officeId)}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-auto p-0 ml-2 hover:bg-transparent"
                            onClick={() => removeOffice(officeId)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {selectedCompanyId ? (
                    <Select onValueChange={handleOfficeToggle} value="">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Aggiungi sede operativa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {offices && Array.isArray(offices) && offices.filter(office => !selectedOffices.includes(office.id)).map((office) => (
                          <SelectItem key={office.id} value={office.id}>
                            {office.name} - {office.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Seleziona prima una ragione sociale per vedere le sedi operative
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Ruolo e Note */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Ruolo e Note</h4>
          
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ruolo *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona ruolo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="user">User - Visualizzazione movimenti assegnati</SelectItem>
                    <SelectItem value="finance">Finance - Gestione movimenti e analytics</SelectItem>
                    <SelectItem value="admin">Admin - Accesso completo al sistema</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Note aggiuntive sulla risorsa" value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : (resource ? "Aggiorna" : "Crea")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function ResourceManagement() {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/resources/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({
        title: "Successo",
        description: "Risorsa eliminata con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare la risorsa",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (resource: Resource) => {
    setSelectedResource(resource);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questa risorsa?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setSelectedResource(null);
    setIsDialogOpen(false);
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'N/A';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>;
      case 'finance':
        return <Badge variant="default">Finance</Badge>;
      case 'user':
        return <Badge variant="secondary">User</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-medium text-foreground dark:text-foreground">Gestione Risorse</h4>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedResource(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuova Risorsa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card dark:bg-card text-card-foreground dark:text-card-foreground border-border dark:border-border">
            <DialogHeader>
              <DialogTitle>
                {selectedResource ? "Modifica Risorsa" : "Nuova Risorsa"}
              </DialogTitle>
              <DialogDescription>
                {selectedResource ? "Modifica le informazioni della risorsa selezionata" : "Crea una nuova risorsa per l'organizzazione"}
              </DialogDescription>
            </DialogHeader>
            <ResourceForm resource={selectedResource || undefined} onClose={handleCloseDialog} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome Completo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ragione Sociale</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead className="w-24">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nessuna risorsa trovata
                </TableCell>
              </TableRow>
            ) : (
              resources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="font-medium">
                    {resource.firstName} {resource.lastName}
                    <div className="text-sm text-gray-500">{resource.taxCode}</div>
                  </TableCell>
                  <TableCell>{resource.email || "-"}</TableCell>
                  <TableCell>{getCompanyName(resource.companyId)}</TableCell>
                  <TableCell>{getRoleBadge(resource.role)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(resource)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(resource.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}