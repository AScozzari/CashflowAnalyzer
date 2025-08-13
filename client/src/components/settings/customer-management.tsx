import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Edit2, Plus, Users, Building, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import type { Customer, InsertCustomer } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Schema di validazione per il form
const customerFormSchema = z.object({
  type: z.enum(["private", "business"]),
  // Campi per persone fisiche
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  taxCode: z.string().optional(),
  // Campi per aziende
  name: z.string().optional(),
  legalForm: z.string().optional(),
  vatNumber: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  contactPerson: z.string().optional(),
  pec: z.string().email().optional().or(z.literal("")),
  sdi: z.string().optional(),
  iban: z.string().optional(),
  bankName: z.string().optional(),
  // Campi comuni
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  zipCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional().default("Italia"),
  notes: z.string().optional(),
  isActive: z.boolean().optional().default(true),
}).refine((data) => {
  if (data.type === "private") {
    return data.firstName && data.lastName && data.taxCode;
  } else {
    return data.name && data.vatNumber;
  }
}, {
  message: "I campi obbligatori devono essere compilati in base al tipo di cliente",
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

const ITALIAN_CITIES = [
  "Agrigento", "Alessandria", "Ancona", "Andria", "Arezzo", "Ascoli Piceno", "Asti", "Avellino",
  "Bari", "Barletta", "Belluno", "Benevento", "Bergamo", "Biella", "Bologna", "Bolzano", "Brescia", "Brindisi",
  "Cagliari", "Caltanissetta", "Campobasso", "Caserta", "Catania", "Catanzaro", "Cesena", "Chieti", "Como", "Cosenza", "Cremona", "Crotone", "Cuneo",
  "Enna",
  "Fermo", "Ferrara", "Firenze", "Foggia", "Forlì", "Frosinone",
  "Genova", "Gorizia", "Grosseto",
  "Imperia", "Isernia",
  "L'Aquila", "La Spezia", "Latina", "Lecce", "Lecco", "Livorno", "Lodi", "Lucca",
  "Macerata", "Mantova", "Massa", "Matera", "Messina", "Milano", "Modena", "Monza",
  "Napoli", "Novara", "Nuoro",
  "Oristano",
  "Padova", "Palermo", "Parma", "Pavia", "Perugia", "Pesaro", "Pescara", "Piacenza", "Pisa", "Pistoia", "Pordenone", "Potenza", "Prato",
  "Ragusa", "Ravenna", "Reggio Calabria", "Reggio Emilia", "Rieti", "Rimini", "Roma", "Rovigo",
  "Salerno", "Sassari", "Savona", "Siena", "Siracusa", "Sondrio",
  "Taranto", "Teramo", "Terni", "Torino", "Trapani", "Trento", "Treviso", "Trieste",
  "Udine",
  "Varese", "Venezia", "Verbania", "Vercelli", "Verona", "Vibo Valentia", "Vicenza", "Viterbo"
];

export function CustomerManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cityFilter, setCityFilter] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      type: "private",
      country: "Italia",
      isActive: true,
    },
  });

  const watchedType = form.watch("type");

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertCustomer) => apiRequest("/api/customers", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({ title: "Cliente creato con successo" });
    },
    onError: (error: any) => {
      toast({
        title: "Errore nella creazione",
        description: error.message || "Si è verificato un errore",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertCustomer }) =>
      apiRequest(`/api/customers/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      form.reset();
      toast({ title: "Cliente aggiornato con successo" });
    },
    onError: (error: any) => {
      toast({
        title: "Errore nell'aggiornamento",
        description: error.message || "Si è verificato un errore",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/customers/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);
      toast({ title: "Cliente eliminato con successo" });
    },
    onError: (error: any) => {
      toast({
        title: "Errore nell'eliminazione",
        description: error.message || "Si è verificato un errore",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== "" && value !== undefined)
    );

    if (selectedCustomer) {
      updateMutation.mutate({ id: selectedCustomer.id, data: cleanedData as InsertCustomer });
    } else {
      createMutation.mutate(cleanedData as InsertCustomer);
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    // Assicuriamo che tutti i campi siano del tipo corretto
    const formData: CustomerFormData = {
      type: customer.type as "private" | "business",
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",
      taxCode: customer.taxCode || "",
      name: customer.name || "",
      legalForm: customer.legalForm || "",
      vatNumber: customer.vatNumber || "",
      website: customer.website || "",
      contactPerson: customer.contactPerson || "",
      pec: customer.pec || "",
      sdi: customer.sdi || "",
      iban: customer.iban || "",
      bankName: customer.bankName || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      zipCode: customer.zipCode || "",
      city: customer.city || "",
      country: customer.country || "Italia",
      notes: customer.notes || "",
      isActive: customer.isActive !== false,
    };
    form.reset(formData);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedCustomer(null);
    form.reset();
  };

  const getCustomerDisplayName = (customer: Customer) => {
    if (customer.type === "private") {
      return `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
    }
    return customer.name || "";
  };

  const getCustomerIdentifier = (customer: Customer) => {
    if (customer.type === "private") {
      return customer.taxCode || "";
    }
    return customer.vatNumber || "";
  };

  const filteredCities = ITALIAN_CITIES.filter(city =>
    city.toLowerCase().includes(cityFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Gestione Clienti</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configura i clienti del sistema con informazioni complete per persone fisiche e aziende
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          data-testid="button-create-customer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Cliente
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Caricamento clienti...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid gap-4">
              {customers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Nessun cliente configurato</p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="mt-4"
                    data-testid="button-create-first-customer"
                  >
                    Crea il primo cliente
                  </Button>
                </div>
              ) : (
                customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700"
                    data-testid={`card-customer-${customer.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {customer.type === "private" ? (
                          <User className="h-8 w-8 text-blue-500" />
                        ) : (
                          <Building className="h-8 w-8 text-green-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {getCustomerDisplayName(customer)}
                          </p>
                          <Badge variant={customer.type === "private" ? "default" : "secondary"}>
                            {customer.type === "private" ? "Privato" : "Azienda"}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                          <p>{customer.type === "private" ? "CF" : "P.IVA"}: {getCustomerIdentifier(customer)}</p>
                          {customer.email && <p>Email: {customer.email}</p>}
                          {customer.phone && <p>Tel: {customer.phone}</p>}
                          {customer.city && <p>Città: {customer.city}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(customer)}
                        data-testid={`button-edit-customer-${customer.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(customer)}
                        data-testid={`button-delete-customer-${customer.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dialog per creazione/modifica */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {selectedCustomer ? "Modifica Cliente" : "Nuovo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Tipo Cliente */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Cliente *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-customer-type">
                          <SelectValue placeholder="Seleziona tipo cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="private">Persona Fisica</SelectItem>
                        <SelectItem value="business">Azienda</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Tabs defaultValue="main" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700">
                  <TabsTrigger value="main" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">Dati Principali</TabsTrigger>
                  <TabsTrigger value="contact" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">Contatti</TabsTrigger>
                  <TabsTrigger value="additional" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">Aggiuntive</TabsTrigger>
                </TabsList>

                <TabsContent value="main" className="space-y-4">
                  {watchedType === "private" ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  data-testid="input-first-name"
                                />
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
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  data-testid="input-last-name"
                                />
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
                              <Input
                                {...field}
                                value={field.value || ""}
                                data-testid="input-tax-code"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Azienda *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                data-testid="input-company-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="legalForm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Forma Giuridica</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-legal-form">
                                    <SelectValue placeholder="Seleziona forma giuridica" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="srl">S.r.l.</SelectItem>
                                  <SelectItem value="spa">S.p.A.</SelectItem>
                                  <SelectItem value="srls">S.r.l.s.</SelectItem>
                                  <SelectItem value="snc">S.n.c.</SelectItem>
                                  <SelectItem value="sas">S.a.s.</SelectItem>
                                  <SelectItem value="ditta-individuale">Ditta Individuale</SelectItem>
                                  <SelectItem value="associazione">Associazione</SelectItem>
                                  <SelectItem value="cooperativa">Cooperativa</SelectItem>
                                  <SelectItem value="altro">Altro</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="vatNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Partita IVA *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  data-testid="input-vat-number"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contactPerson"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Persona di Contatto</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  data-testid="input-contact-person"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sito Web</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  data-testid="input-website"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              {...field}
                              value={field.value || ""}
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefono</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              data-testid="input-phone"
                            />
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
                          <Input
                            {...field}
                            value={field.value || ""}
                            data-testid="input-address"
                          />
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
                          <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-city">
                                <SelectValue placeholder="Seleziona città" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                              <div className="p-2">
                                <Input
                                  placeholder="Cerca città..."
                                  value={cityFilter}
                                  onChange={(e) => setCityFilter(e.target.value)}
                                  className="mb-2 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                                />
                              </div>
                              {filteredCities.map((city) => (
                                <SelectItem key={city} value={city} className="focus:bg-gray-100 dark:focus:bg-gray-700">
                                  {city}
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
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Paese</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              data-testid="input-country"
                            />
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
                          <Input
                            {...field}
                            value={field.value || ""}
                            data-testid="input-zip-code"
                            placeholder="00000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="additional" className="space-y-4">
                  {watchedType === "business" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="pec"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PEC</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  {...field}
                                  value={field.value || ""}
                                  data-testid="input-pec"
                                />
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
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  data-testid="input-sdi"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="iban"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>IBAN</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  data-testid="input-iban"
                                />
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
                              <FormLabel>Nome Banca</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  data-testid="input-bank-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Note</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            rows={3}
                            data-testid="textarea-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  data-testid="button-cancel"
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-customer"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Salvando..."
                    : selectedCustomer
                    ? "Aggiorna"
                    : "Crea"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog di conferma eliminazione */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              Sei sicuro di voler eliminare il cliente{" "}
              <strong>{selectedCustomer ? getCustomerDisplayName(selectedCustomer) : ""}</strong>?
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedCustomer && deleteMutation.mutate(selectedCustomer.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}