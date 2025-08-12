import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { insertCoreSchema, type Core, type InsertCore, type Company } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface CoreFormProps {
  core?: Core;
  onClose: () => void;
}

function CoreForm({ core, onClose }: CoreFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const form = useForm<InsertCore>({
    resolver: zodResolver(insertCoreSchema),
    defaultValues: {
      name: core?.name || "",
      description: core?.description || "",
      companyId: core?.companyId || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertCore) => {
      if (core) {
        return await apiRequest(`/api/cores/${core.id}`, "PUT", data);
      } else {
        return await apiRequest("/api/cores", "POST", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cores"] });
      toast({
        title: "Successo",
        description: `Core business ${core ? "aggiornato" : "creato"} con successo`,
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

  const onSubmit = (data: InsertCore) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Core Business *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="es. Sviluppo Software" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrizione</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ""} placeholder="Descrizione dettagliata del core business" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : (core ? "Aggiorna" : "Crea")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function CoreManagement() {
  const [selectedCore, setSelectedCore] = useState<Core | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cores = [], isLoading } = useQuery<Core[]>({
    queryKey: ["/api/cores"],
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/cores/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cores"] });
      toast({
        title: "Successo",
        description: "Core business eliminato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare il core business",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (core: Core) => {
    setSelectedCore(core);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo core business?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setSelectedCore(null);
    setIsDialogOpen(false);
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company ? `${company.name} (${company.legalForm})` : 'N/A';
  };

  if (isLoading) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-medium text-gray-900">Gestione Core Business</h4>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedCore(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Core Business
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {selectedCore ? "Modifica Core Business" : "Nuovo Core Business"}
              </DialogTitle>
              <DialogDescription>
                {selectedCore ? "Modifica le informazioni del core business selezionato" : "Crea un nuovo core business per organizzare le attività"}
              </DialogDescription>
            </DialogHeader>
            <CoreForm core={selectedCore || undefined} onClose={handleCloseDialog} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Ragione Sociale</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead className="w-24">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nessun core business trovato
                </TableCell>
              </TableRow>
            ) : (
              cores.map((core) => (
                <TableRow key={core.id}>
                  <TableCell className="font-medium">{core.name}</TableCell>
                  <TableCell>{getCompanyName(core.companyId)}</TableCell>
                  <TableCell className="max-w-xs truncate">{core.description || "-"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(core)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(core.id)}
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