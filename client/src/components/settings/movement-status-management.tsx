import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { insertMovementStatusSchema, type MovementStatus, type InsertMovementStatus } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface MovementStatusFormProps {
  status?: MovementStatus;
  onClose: () => void;
}

function MovementStatusForm({ status, onClose }: MovementStatusFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertMovementStatus>({
    resolver: zodResolver(insertMovementStatusSchema),
    defaultValues: {
      name: status?.name || "",
      description: status?.description || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertMovementStatus) => {
      if (status) {
        return await apiRequest(`/api/movement-statuses/${status.id}`, "PUT", data);
      } else {
        return await apiRequest("/api/movement-statuses", "POST", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movement-statuses"] });
      toast({
        title: "Successo",
        description: `Stato movimento ${status ? "aggiornato" : "creato"} con successo`,
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

  const onSubmit = (data: InsertMovementStatus) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Stato *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="es. Da Saldare, Saldato, Annullato" />
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
                <Textarea {...field} placeholder="Descrizione dettagliata dello stato" value={field.value || ""} />
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
            {mutation.isPending ? "Salvando..." : (status ? "Aggiorna" : "Crea")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function MovementStatusManagement() {
  const [selectedStatus, setSelectedStatus] = useState<MovementStatus | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: statuses = [], isLoading } = useQuery<MovementStatus[]>({
    queryKey: ["/api/movement-statuses"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/movement-statuses/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movement-statuses"] });
      toast({
        title: "Successo",
        description: "Stato movimento eliminato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare lo stato movimento",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (status: MovementStatus) => {
    setSelectedStatus(status);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo stato movimento?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setSelectedStatus(null);
    setIsDialogOpen(false);
  };

  const getStatusColor = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('saldato') || lowerName.includes('completato')) {
      return "bg-green-50 text-green-700 border-green-200";
    }
    if (lowerName.includes('saldare') || lowerName.includes('pending')) {
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }
    if (lowerName.includes('annullato') || lowerName.includes('rejected')) {
      return "bg-red-50 text-red-700 border-red-200";
    }
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  if (isLoading) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-medium text-gray-900">Gestione Stati Movimento</h4>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedStatus(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Stato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {selectedStatus ? "Modifica Stato Movimento" : "Nuovo Stato Movimento"}
              </DialogTitle>
              <DialogDescription>
                {selectedStatus ? "Modifica le informazioni dello stato movimento selezionato" : "Crea un nuovo stato per i movimenti finanziari"}
              </DialogDescription>
            </DialogHeader>
            <MovementStatusForm status={selectedStatus || undefined} onClose={handleCloseDialog} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead>Data Creazione</TableHead>
              <TableHead className="w-24">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statuses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  <Flag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nessuno stato movimento trovato
                </TableCell>
              </TableRow>
            ) : (
              statuses.map((status) => (
                <TableRow key={status.id}>
                  <TableCell>
                    <Badge className={`${getStatusColor(status.name)} border`}>
                      {status.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{status.description || "-"}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(status.createdAt).toLocaleDateString('it-IT')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(status)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(status.id)}
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