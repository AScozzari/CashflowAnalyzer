import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, Truck, Building2, Phone, Mail, Globe, User, FileText, Calendar, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CitySelect } from "@/components/ui/city-select";
import { CitySelectWithCap } from "@/components/shared/city-select-with-cap";
import { useToast } from "@/hooks/use-toast";
import { insertSupplierSchema, type Supplier, type InsertSupplier } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface SupplierFormProps {
  supplier?: Supplier;
  onClose: () => void;
}

function SupplierForm({ supplier, onClose }: SupplierFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertSupplier>({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: {
      name: supplier?.name || "",
      legalForm: supplier?.legalForm || "",
      address: supplier?.address || "",
      zipCode: supplier?.zipCode || "",
      city: supplier?.city || "",
      country: supplier?.country || "Italia",
      email: supplier?.email || "",
      phone: supplier?.phone || "",
      mobile: supplier?.mobile || "",
      website: supplier?.website || "",
      contactPerson: supplier?.contactPerson || "",
      taxCode: supplier?.taxCode || "",
      vatNumber: supplier?.vatNumber || "",
      pec: supplier?.pec || "",
      sdi: supplier?.sdi || "",
      paymentTerms: supplier?.paymentTerms || "pagamento a 30gg",
      notes: supplier?.notes || "",
      isActive: supplier?.isActive !== false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const url = supplier ? `/api/suppliers/${supplier.id}` : "/api/suppliers";
      const method = supplier ? "PUT" : "POST";
      const res = await apiRequest(method, url, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Successo",
        description: `Fornitore ${supplier ? "aggiornato" : "creato"} con successo`,
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

  const onSubmit = (data: InsertSupplier) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome/Ragione Sociale *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="es. Acme Forniture srl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="legalForm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forma Giuridica</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona forma giuridica" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="SRL">SRL</SelectItem>
                    <SelectItem value="SPA">SPA</SelectItem>
                    <SelectItem value="SRLS">SRLS</SelectItem>
                    <SelectItem value="SNC">SNC</SelectItem>
                    <SelectItem value="SAS">SAS</SelectItem>
                    <SelectItem value="SS">Società Semplice</SelectItem>
                    <SelectItem value="DITTA_INDIVIDUALE">Ditta Individuale</SelectItem>
                    <SelectItem value="ALTRA">Altra</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vatNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Partita IVA *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="IT12345678901" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="taxCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Codice Fiscale</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="12345678901" value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Indirizzo</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Via Roma 123" value={field.value || ""} />
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
                <FormLabel>Città</FormLabel>
                <FormControl>
                  <CitySelectWithCap
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    onCapChange={(cap) => form.setValue("zipCode", cap)}
                    placeholder="Seleziona città"
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
                  <Input {...field} placeholder="Italia" value={field.value || ""} />
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
              <FormLabel>CAP</FormLabel>
              <FormControl>
                <Input {...field} placeholder="00000" value={field.value || ""} />
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
                <Input {...field} type="email" placeholder="info@fornitore.it" value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefono</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="es. 06 123456789" value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cellulare/WhatsApp</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="es. +39 333 1234567" value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sito Web</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://www.fornitore.it" value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Persona di Riferimento</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Mario Rossi" value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="pec"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PEC</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="fornitore@pec.it" value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sdi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Codice SDI</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="ABCDEFG" value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentTerms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modalità di Pagamento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona modalità" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pagamento a 30gg">Pagamento a 30gg</SelectItem>
                    <SelectItem value="pagamento a 60gg">Pagamento a 60gg</SelectItem>
                    <SelectItem value="pagamento a 90gg">Pagamento a 90gg</SelectItem>
                    <SelectItem value="pagamento a 120gg">Pagamento a 120gg</SelectItem>
                    <SelectItem value="pagamento a 30gg df fine mese">Pagamento a 30gg df fine mese</SelectItem>
                    <SelectItem value="pagamento a 60gg df fine mese">Pagamento a 60gg df fine mese</SelectItem>
                    <SelectItem value="pagamento a 90gg df fine mese">Pagamento a 90gg df fine mese</SelectItem>
                    <SelectItem value="pagamento a 120gg df fine mese">Pagamento a 120gg df fine mese</SelectItem>
                    <SelectItem value="pagamento a vista cash">Pagamento a vista cash</SelectItem>
                    <SelectItem value="pagamento a vista elettronico">Pagamento a vista elettronico</SelectItem>
                    <SelectItem value="finanziamento">Finanziamento</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Note aggiuntive sul fornitore..." value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Fornitore Attivo</FormLabel>
                <div className="text-sm text-gray-500">Il fornitore è attivo e può essere utilizzato</div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Salvataggio..." : supplier ? "Aggiorna" : "Crea"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function SupplierManagement() {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/suppliers/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Successo",
        description: "Fornitore eliminato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleDelete = async (supplier: Supplier) => {
    if (window.confirm(`Sei sicuro di voler eliminare il fornitore "${supplier.name}"?`)) {
      deleteMutation.mutate(supplier.id);
    }
  };

  const handleCloseDialog = () => {
    setSelectedSupplier(undefined);
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return <div className="flex justify-center p-4">Caricamento fornitori...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground dark:text-foreground">Gestione Fornitori</h2>
          <p className="text-muted-foreground">Gestisci i fornitori aziendali per l'integrazione XML fatture</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedSupplier(undefined)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Fornitore
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card dark:bg-card text-card-foreground dark:text-card-foreground border-border dark:border-border">
            <DialogHeader>
              <DialogTitle>
                {selectedSupplier ? "Modifica Fornitore" : "Nuovo Fornitore"}
              </DialogTitle>
              <DialogDescription>
                {selectedSupplier 
                  ? "Modifica i dati del fornitore esistente"
                  : "Inserisci i dati del nuovo fornitore. I fornitori sono utilizzati per il matching automatico delle fatture XML."
                }
              </DialogDescription>
            </DialogHeader>
            <SupplierForm supplier={selectedSupplier} onClose={handleCloseDialog} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card dark:bg-card rounded-xl shadow border border-border dark:border-border">
        <div className="p-4 border-b border-border dark:border-border">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <span className="font-medium">Lista Fornitori ({suppliers.length})</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornitore</TableHead>
                <TableHead>Partita IVA</TableHead>
                <TableHead>Contatti</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Truck className="h-8 w-8 text-muted-foreground/50" />
                      <p>Nessun fornitore configurato</p>
                      <p className="text-sm">Aggiungi il primo fornitore per iniziare</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {supplier.name}
                        </div>
                        {supplier.legalForm && (
                          <Badge variant="outline" className="text-xs">
                            {supplier.legalForm}
                          </Badge>
                        )}
                        {supplier.contactPerson && (
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {supplier.contactPerson}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-mono text-sm">{supplier.vatNumber}</div>
                        {supplier.taxCode && (
                          <div className="text-xs text-gray-500">{supplier.taxCode}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.email && (
                          <div className="text-sm flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {supplier.phone}
                          </div>
                        )}
                        {supplier.website && (
                          <div className="text-sm flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              Sito web
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-sm">{supplier.paymentTerms} gg</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.isActive ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Attivo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inattivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(supplier)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  );
}