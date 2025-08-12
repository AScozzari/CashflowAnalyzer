import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { insertMovementReasonSchema, type MovementReason, type InsertMovementReason } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface MovementReasonFormProps {
  reason?: MovementReason;
  onClose: () => void;
}

function MovementReasonForm({ reason, onClose }: MovementReasonFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertMovementReason>({
    resolver: zodResolver(insertMovementReasonSchema),
    defaultValues: {
      name: reason?.name || "",
      description: reason?.description || "",
      type: reason?.type || "entrata",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertMovementReason) => {
      if (reason) {
        return await apiRequest(`/api/movement-reasons/${reason.id}`, "PUT", data);
      } else {
        return await apiRequest("/api/movement-reasons", "POST", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movement-reasons"] });
      toast({
        title: "Successo",
        description: `Causale ${reason ? "aggiornata" : "creata"} con successo`,
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

  const onSubmit = (data: InsertMovementReason) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="entrata">Entrata</SelectItem>
                  <SelectItem value="uscita">Uscita</SelectItem>
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
              <FormLabel>Nome Causale *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="es. Vendita Prodotti, Pagamento Fornitori" />
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
                <Textarea {...field} placeholder="Descrizione dettagliata della causale" value={field.value || ""} />
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
            {mutation.isPending ? "Salvando..." : (reason ? "Aggiorna" : "Crea")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function MovementReasonManagement() {
  const [selectedReason, setSelectedReason] = useState<MovementReason | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reasons = [], isLoading } = useQuery<MovementReason[]>({
    queryKey: ["/api/movement-reasons"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/movement-reasons/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movement-reasons"] });
      toast({
        title: "Successo",
        description: "Causale eliminata con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare la causale",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (reason: MovementReason) => {
    setSelectedReason(reason);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questa causale?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setSelectedReason(null);
    setIsDialogOpen(false);
  };

  const getTypeIcon = (type: string) => {
    return type === "entrata" ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTypeBadge = (type: string) => {
    return type === "entrata" ? (
      <Badge variant="secondary" className="bg-green-50 text-green-700">
        Entrata
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-50 text-red-700">
        Uscita
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-medium text-foreground dark:text-foreground">Gestione Causali</h4>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedReason(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuova Causale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-card dark:bg-card text-card-foreground dark:text-card-foreground border-border dark:border-border">
            <DialogHeader>
              <DialogTitle>
                {selectedReason ? "Modifica Causale" : "Nuova Causale"}
              </DialogTitle>
              <DialogDescription>
                {selectedReason ? "Modifica le informazioni della causale selezionata" : "Crea una nuova causale per categorizzare i movimenti"}
              </DialogDescription>
            </DialogHeader>
            <MovementReasonForm reason={selectedReason || undefined} onClose={handleCloseDialog} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead className="w-24">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reasons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nessuna causale trovata
                </TableCell>
              </TableRow>
            ) : (
              reasons.map((reason) => (
                <TableRow key={reason.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(reason.type)}
                      <span>{reason.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(reason.type)}</TableCell>
                  <TableCell className="max-w-xs truncate">{reason.description || "-"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(reason)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(reason.id)}
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