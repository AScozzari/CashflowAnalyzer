import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CitySelect } from "@/components/ui/city-select";
import { useToast } from "@/hooks/use-toast";
import { insertOfficeSchema, type Office, type InsertOffice, type Company } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface OfficeFormProps {
  office?: Office;
  onClose: () => void;
}

function OfficeForm({ office, onClose }: OfficeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const form = useForm<InsertOffice>({
    resolver: zodResolver(insertOfficeSchema),
    defaultValues: {
      description: office?.description || "",
      name: office?.name || "",
      companyId: office?.companyId || "",
      address: office?.address || "",
      city: office?.city || "",
      zipCode: office?.zipCode || "",
      country: office?.country || "Italia",
      email: office?.email || "",
      notes: office?.notes || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertOffice) => {
      if (office) {
        return await apiRequest(`/api/offices/${office.id}`, "PUT", data);
      } else {
        return await apiRequest("/api/offices", "POST", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offices"] });
      toast({
        title: "Successo",
        description: `Sede operativa ${office ? "aggiornata" : "creata"} con successo`,
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

  const onSubmit = (data: InsertOffice) => {
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
              <FormLabel>Nome Sede *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="es. Sede Principale, Filiale Roma" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Indirizzo *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="es. Via Roma 123" className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Città *</FormLabel>
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

        <FormField
          control={form.control}
          name="zipCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CAP *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="00000" className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
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
                <Input {...field} type="email" value={field.value || ""} className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
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
                <Textarea {...field} placeholder="Descrizione della sede operativa" value={field.value || ""} />
              </FormControl>
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
                <Textarea {...field} placeholder="Note aggiuntive" value={field.value || ""} />
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
            {mutation.isPending ? "Salvando..." : (office ? "Aggiorna" : "Crea")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function OfficeManagement() {
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: offices = [], isLoading } = useQuery<Office[]>({
    queryKey: ["/api/offices"],
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/offices/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offices"] });
      toast({
        title: "Successo",
        description: "Sede operativa eliminata con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare la sede operativa",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (office: Office) => {
    setSelectedOffice(office);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questa sede operativa?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setSelectedOffice(null);
    setIsDialogOpen(false);
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'N/A';
  };

  if (isLoading) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-medium text-foreground dark:text-foreground">Gestione Sedi Operative</h4>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedOffice(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuova Sede
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-card dark:bg-card text-card-foreground dark:text-card-foreground border-border dark:border-border">
            <DialogHeader>
              <DialogTitle>
                {selectedOffice ? "Modifica Sede Operativa" : "Nuova Sede Operativa"}
              </DialogTitle>
              <DialogDescription>
                {selectedOffice ? "Modifica le informazioni della sede operativa selezionata" : "Crea una nuova sede operativa per l'organizzazione"}
              </DialogDescription>
            </DialogHeader>
            <OfficeForm office={selectedOffice || undefined} onClose={handleCloseDialog} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome Sede</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead>Indirizzo</TableHead>
              <TableHead>Ragione Sociale</TableHead>
              <TableHead className="w-24">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nessuna sede operativa trovata
                </TableCell>
              </TableRow>
            ) : (
              offices.map((office) => (
                <TableRow key={office.id}>
                  <TableCell className="font-medium">{office.name || "-"}</TableCell>
                  <TableCell>{office.description || "-"}</TableCell>
                  <TableCell>{office.address}, {office.city} ({office.zipCode})</TableCell>
                  <TableCell>{getCompanyName(office.companyId)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(office)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(office.id)}
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