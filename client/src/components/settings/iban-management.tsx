import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BankSelect } from "@/components/ui/bank-select";
import { useToast } from "@/hooks/use-toast";
import { insertIbanSchema, type Iban, type InsertIban, type Company } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { italianBanks } from "@/data/italian-banks";

interface IbanFormProps {
  iban?: Iban;
  onClose: () => void;
}

function IbanForm({ iban, onClose }: IbanFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const form = useForm<InsertIban>({
    resolver: zodResolver(insertIbanSchema),
    defaultValues: {
      iban: iban?.iban || "",
      bankName: iban?.bankName || "",
      description: iban?.description || "",
      notes: iban?.notes || "",
      companyId: iban?.companyId || "",
    },
  });

  // Trova il valore della banca selezionata per il componente BankSelect
  const getBankValue = (bankName: string) => {
    const bank = italianBanks.find(b => b.label === bankName);
    return bank ? bank.value : "";
  };

  const mutation = useMutation({
    mutationFn: async (data: InsertIban) => {
      if (iban) {
        return await apiRequest(`/api/ibans/${iban.id}`, "PUT", data);
      } else {
        return await apiRequest("/api/ibans", "POST", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ibans"] });
      toast({
        title: "Successo",
        description: `IBAN ${iban ? "aggiornato" : "creato"} con successo`,
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

  const onSubmit = (data: InsertIban) => {
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
          name="iban"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IBAN *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="IT00 0000 0000 0000 0000 0000 000" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bankName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banca *</FormLabel>
              <FormControl>
                <BankSelect
                  value={getBankValue(field.value)}
                  onValueChange={(value) => {
                    const selectedBank = italianBanks.find(bank => bank.value === value);
                    field.onChange(selectedBank ? selectedBank.label : value);
                  }}
                  placeholder="Seleziona banca italiana..."
                />
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
                <Input {...field} placeholder="es. Conto Corrente Principale" value={field.value || ""} />
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
            {mutation.isPending ? "Salvando..." : (iban ? "Aggiorna" : "Crea")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function IbanManagement() {
  const [selectedIban, setSelectedIban] = useState<Iban | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ibans = [], isLoading } = useQuery<Iban[]>({
    queryKey: ["/api/ibans"],
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/ibans/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ibans"] });
      toast({
        title: "Successo",
        description: "IBAN eliminato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare l'IBAN",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (iban: Iban) => {
    setSelectedIban(iban);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo IBAN?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setSelectedIban(null);
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
        <h4 className="text-lg font-medium text-foreground dark:text-foreground">Gestione IBAN</h4>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedIban(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo IBAN
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-card dark:bg-card text-card-foreground dark:text-card-foreground border-border dark:border-border">
            <DialogHeader>
              <DialogTitle>
                {selectedIban ? "Modifica IBAN" : "Nuovo IBAN"}
              </DialogTitle>
              <DialogDescription>
                {selectedIban ? "Modifica le informazioni dell'IBAN selezionato" : "Aggiungi un nuovo IBAN per i movimenti finanziari"}
              </DialogDescription>
            </DialogHeader>
            <IbanForm iban={selectedIban || undefined} onClose={handleCloseDialog} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>IBAN</TableHead>
              <TableHead>Banca</TableHead>
              <TableHead>Descrizione</TableHead>
              <TableHead>Ragione Sociale</TableHead>
              <TableHead className="w-24">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ibans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nessun IBAN trovato
                </TableCell>
              </TableRow>
            ) : (
              ibans.map((iban) => (
                <TableRow key={iban.id}>
                  <TableCell className="font-mono text-sm">
                    {iban.iban.replace(/(.{4})/g, '$1 ').trim()}
                  </TableCell>
                  <TableCell>{iban.bankName}</TableCell>
                  <TableCell>{iban.description || "-"}</TableCell>
                  <TableCell>{getCompanyName(iban.companyId)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(iban)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(iban.id)}
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