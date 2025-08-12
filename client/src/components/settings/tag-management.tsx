import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { insertTagSchema, type Tag, type InsertTag } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface TagFormProps {
  tag?: Tag;
  onClose: () => void;
}

function TagForm({ tag, onClose }: TagFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertTag>({
    resolver: zodResolver(insertTagSchema),
    defaultValues: {
      name: tag?.name || "",
      description: tag?.description || "",
      color: tag?.color || "#3B82F6",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertTag) => {
      if (tag) {
        return await apiRequest(`/api/tags/${tag.id}`, "PUT", data);
      } else {
        return await apiRequest("/api/tags", "POST", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      toast({
        title: "Successo",
        description: `Tag ${tag ? "aggiornato" : "creato"} con successo`,
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

  const onSubmit = (data: InsertTag) => {
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
              <FormLabel>Nome Tag *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="es. Urgente, Ricorrente, Importante" />
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
                <Textarea {...field} placeholder="Descrizione dettagliata del tag" value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Colore Tag *</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Input 
                    type="color" 
                    {...field} 
                    className="w-20 h-10 rounded-md border border-input bg-background"
                  />
                  <Input 
                    {...field} 
                    placeholder="#3B82F6" 
                    className="flex-1"
                  />
                </div>
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
            {mutation.isPending ? "Salvando..." : (tag ? "Aggiorna" : "Crea")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function TagManagement() {
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/tags/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      toast({
        title: "Successo",
        description: "Tag eliminato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare il tag",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (tag: Tag) => {
    setSelectedTag(tag);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo tag?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setSelectedTag(null);
    setIsDialogOpen(false);
  };

  const getTagColor = (name: string) => {
    const colors = [
      "bg-blue-50 text-blue-700 border-blue-200",
      "bg-green-50 text-green-700 border-green-200",
      "bg-yellow-50 text-yellow-700 border-yellow-200",
      "bg-purple-50 text-purple-700 border-purple-200",
      "bg-red-50 text-red-700 border-red-200",
      "bg-indigo-50 text-indigo-700 border-indigo-200",
    ];
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (isLoading) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-medium text-gray-900">Gestione Tags</h4>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedTag(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {selectedTag ? "Modifica Tag" : "Nuovo Tag"}
              </DialogTitle>
              <DialogDescription>
                {selectedTag ? "Modifica le informazioni del tag selezionato" : "Crea un nuovo tag per categorizzare i movimenti"}
              </DialogDescription>
            </DialogHeader>
            <TagForm tag={selectedTag || undefined} onClose={handleCloseDialog} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Colore</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead>Data Creazione</TableHead>
              <TableHead className="w-24">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  <Tags className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nessun tag trovato
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <Badge className="border" style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }}>
                      {tag.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded-full border-2"
                        style={{ backgroundColor: tag.color, borderColor: tag.color }}
                      />
                      <span className="text-sm font-mono">{tag.color}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{tag.description || "-"}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(tag.createdAt).toLocaleDateString('it-IT')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(tag)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(tag.id)}
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