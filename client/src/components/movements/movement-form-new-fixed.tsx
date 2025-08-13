import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { 
  CalendarIcon, 
  Building2, 
  FileText, 
  Calculator, 
  CreditCard, 
  User, 
  UserPlus, 
  Truck, 
  Eye,
  Plus,
  Loader2,
  Upload,
  MapPin,
  Mail,
  Phone,
  Building,
  Hash,
  Users
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CompactXMLUploader from "./xml-invoice-uploader-compact";
import type { MovementWithRelations, Company, Core, Resource, Office, Iban, Tag, MovementStatus, MovementReason, Supplier, Customer } from "@shared/schema";

// Schema del form con validazione
const movementFormSchema = z.object({
  insertDate: z.string().min(1, "Data inserimento richiesta"),
  entityType: z.string().optional(),
  flowDate: z.string().min(1, "Data movimento richiesta"),
  companyId: z.string().min(1, "Azienda richiesta"),
  coreId: z.string().min(1, "Core richiesto"),
  reasonId: z.string().min(1, "Causale richiesta"),
  type: z.enum(["income", "expense"], { required_error: "Tipo richiesto" }),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  resourceId: z.string().optional(),
  officeId: z.string().optional(),
  ibanId: z.string().optional(),
  statusId: z.string().min(1, "Stato richiesto"),
  tagId: z.string().optional(),
  amount: z.string().min(1, "Importo richiesto").refine(val => !isNaN(parseFloat(val)), "Importo non valido"),
  vatAmount: z.string().optional(),
  vatType: z.string().optional(),
  notes: z.string().optional(),
  documentNumber: z.string().optional(),
  fileName: z.string().optional(),
});

type MovementFormData = z.infer<typeof movementFormSchema>;

interface MovementFormNewProps {
  movement?: MovementWithRelations;
  onClose: () => void;
  isOpen: boolean;
}

export default function MovementFormNew({ movement, onClose, isOpen }: MovementFormNewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<MovementFormData>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      insertDate: movement?.insertDate || new Date().toISOString().split('T')[0],
      flowDate: movement?.flowDate || new Date().toISOString().split('T')[0],
      type: movement?.type as "income" | "expense" || "income",
      amount: movement?.amount?.toString() || "",
      vatAmount: movement?.vatAmount?.toString() || "",
      vatType: movement?.vatType || "",
      notes: movement?.notes || "",
      documentNumber: movement?.documentNumber || "",
      companyId: movement?.companyId || "",
      coreId: movement?.coreId || "",
      statusId: movement?.statusId || "",
      reasonId: movement?.reasonId || "",
      resourceId: movement?.resourceId || "",
      officeId: movement?.officeId || "",
      ibanId: movement?.ibanId || "",
      tagId: movement?.tagId || "",
      customerId: movement?.customerId || "",
      supplierId: movement?.supplierId || "",
    },
  });

  // Watch form values for dynamic behavior
  const watchedType = form.watch("type");
  const watchedAmount = form.watch("amount");
  const watchedVatType = form.watch("vatType");
  const watchedCompanyId = form.watch("companyId");
  const watchedEntityType = form.watch("entityType");

  // Data queries
  const { data: companies = [] } = useQuery<Company[]>({ queryKey: ["/api/companies"] });
  const { data: cores = [] } = useQuery<Core[]>({ queryKey: ["/api/cores"] });
  const { data: resources = [] } = useQuery<Resource[]>({ queryKey: ["/api/resources"] });
  const { data: offices = [] } = useQuery<Office[]>({ queryKey: ["/api/offices"] });
  const { data: ibans = [] } = useQuery<Iban[]>({ queryKey: ["/api/ibans"] });
  const { data: tags = [] } = useQuery<Tag[]>({ queryKey: ["/api/tags"] });
  const { data: statuses = [] } = useQuery<MovementStatus[]>({ queryKey: ["/api/movement-statuses"] });
  const { data: reasons = [] } = useQuery<MovementReason[]>({ queryKey: ["/api/movement-reasons"] });
  const { data: suppliers = [] } = useQuery<Supplier[]>({ queryKey: ["/api/suppliers"] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

  // Filter data based on selected company
  const filteredCores = cores.filter(core => core.companyId === watchedCompanyId);
  const filteredResources = resources.filter(resource => resource.companyId === watchedCompanyId);
  const filteredOffices = offices.filter(office => office.companyId === watchedCompanyId);
  const filteredIbans = ibans.filter(iban => iban.companyId === watchedCompanyId);

  // Filter reasons based on movement type
  const filteredReasons = reasons.filter(reason => 
    reason.type === watchedType || reason.type === "both"
  );

  // Auto-calculate VAT (IVA inclusa nell'importo totale)
  useEffect(() => {
    if (watchedAmount && watchedVatType) {
      const totalAmount = parseFloat(watchedAmount);
      let vatAmount = 0;
      
      // Calcolo IVA inclusa: IVA = (Totale * Aliquota) / (100 + Aliquota)
      switch (watchedVatType) {
        case "iva_22":
          vatAmount = (totalAmount * 22) / 122;
          break;
        case "iva_10":
          vatAmount = (totalAmount * 10) / 110;
          break;
        case "iva_4":
          vatAmount = (totalAmount * 4) / 104;
          break;
        default:
          vatAmount = 0;
      }
      
      form.setValue("vatAmount", vatAmount.toFixed(2));
    }
  }, [watchedAmount, watchedVatType, form]);

  // Reset entity fields when entity type changes
  useEffect(() => {
    if (watchedEntityType) {
      form.setValue("customerId", "");
      form.setValue("supplierId", "");
      form.setValue("resourceId", "");
    }
  }, [watchedEntityType, form]);

  const createMovementMutation = useMutation({
    mutationFn: async (data: MovementFormData) => {
      const formData = new FormData();
      
      // Add form data (excluding file-related fields)
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'fileName' && value !== undefined && value !== "") {
          formData.append(key, value.toString());
        }
      });
      
      // Add file if uploaded
      if (uploadedFile) {
        formData.append("document", uploadedFile);
        formData.append("fileName", uploadedFile.name);
      }
      
      const response = await fetch("/api/movements", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      toast({
        title: "Successo",
        description: "Movimento creato con successo",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione del movimento",
        variant: "destructive",
      });
    },
  });

  const updateMovementMutation = useMutation({
    mutationFn: async (data: MovementFormData) => {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'fileName' && value !== undefined && value !== "") {
          formData.append(key, value.toString());
        }
      });
      
      if (uploadedFile) {
        formData.append("document", uploadedFile);
        formData.append("fileName", uploadedFile.name);
      }
      
      const response = await fetch(`/api/movements/${movement?.id}`, {
        method: "PUT",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      toast({
        title: "Successo",
        description: "Movimento aggiornato con successo",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento del movimento",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: MovementFormData) => {
    setIsSubmitting(true);
    try {
      if (movement) {
        await updateMovementMutation.mutateAsync(data);
      } else {
        await createMovementMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleXMLDataParsed = (data: any) => {
    if (data.importo) form.setValue("amount", data.importo.toString());
    if (data.documento) form.setValue("documentNumber", data.documento);
    if (data.iva) {
      // Mappatura da percentuale a enum
      const vatMapping: Record<string, string> = {
        "22%": "iva_22",
        "10%": "iva_10", 
        "4%": "iva_4",
        "0%": "esente"
      };
      form.setValue("vatType", vatMapping[data.iva] || "iva_22");
    }
    if (data.fornitore && suppliers.length > 0) {
      const supplier = suppliers.find(s => 
        s.name?.toLowerCase().includes(data.fornitore.toLowerCase()) ||
        s.vatNumber === data.partitaIva
      );
      if (supplier) {
        form.setValue("supplierId", supplier.id);
        form.setValue("entityType", "supplier");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {movement ? "Modifica Movimento" : "Nuovo Movimento"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Sezione 1: Informazioni Base */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Informazioni Base
                </CardTitle>
                <CardDescription>
                  Campi obbligatori per tutti i movimenti
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="insertDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Inserimento *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="flowDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Movimento *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Movimento *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="income">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Entrata
                            </div>
                          </SelectItem>
                          <SelectItem value="expense">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              Uscita
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Company, Core, Reason */}
                <div className="grid grid-cols-3 gap-4">
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
                                {company.name}
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
                    name="coreId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Core *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona core" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredCores.map((core) => (
                              <SelectItem key={core.id} value={core.id}>
                                {core.name}
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
                    name="reasonId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Causale *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona causale" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredReasons.map((reason) => (
                              <SelectItem key={reason.id} value={reason.id}>
                                {reason.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sezione 2: Entità Associate (dinamica) */}
            {watchedType && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {watchedType === "income" ? <User className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
                    Entità Associata
                  </CardTitle>
                  <CardDescription>
                    {watchedType === "income" 
                      ? "Scegli chi riceve il pagamento: cliente o risorsa interna"
                      : "Scegli chi effettua il pagamento: fornitore o risorsa interna"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Primo step: selezione tipo entità */}
                  <FormField
                    control={form.control}
                    name="entityType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chi è coinvolto nel movimento?</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona tipo di entità" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={watchedType === "income" ? "customer" : "supplier"}>
                              <div className="flex items-center gap-2">
                                {watchedType === "income" ? <User className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                                {watchedType === "income" ? "Cliente esterno" : "Fornitore esterno"}
                              </div>
                            </SelectItem>
                            <SelectItem value="resource">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Risorsa interna
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Secondo step: selezione specifica basata sul tipo */}
                  {watchedEntityType === "customer" && watchedType === "income" && (
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Cliente
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {/* TODO: Aprire modal nuovo cliente */}}
                              className="h-6 w-6 p-0"
                              title="Crea nuovo cliente"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona cliente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.type === 'private' 
                                    ? `${customer.firstName} ${customer.lastName}`.trim()
                                    : customer.name
                                  }
                                  {customer.type === 'business' && customer.vatNumber && (
                                    <span className="text-gray-500 ml-2">({customer.vatNumber})</span>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {watchedEntityType === "supplier" && watchedType === "expense" && (
                    <FormField
                      control={form.control}
                      name="supplierId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Fornitore
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {/* TODO: Aprire modal nuovo fornitore */}}
                              className="h-6 w-6 p-0"
                              title="Crea nuovo fornitore"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona fornitore" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {suppliers.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                  {supplier.name}
                                  {supplier.vatNumber && (
                                    <span className="text-gray-500 ml-2">({supplier.vatNumber})</span>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {watchedEntityType === "resource" && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="resourceId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Risorsa</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleziona risorsa" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredResources.map((resource) => (
                                  <SelectItem key={resource.id} value={resource.id}>
                                    {resource.firstName} {resource.lastName}
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
                        name="officeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sede Operativa</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleziona sede (opzionale)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredOffices.map((office) => (
                                  <SelectItem key={office.id} value={office.id}>
                                    {office.name} - {office.city}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sezione 3: Dettagli Finanziari */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Dettagli Finanziari e Documentali
                </CardTitle>
                <CardDescription>
                  Importi, IVA, stato e documenti
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* IBAN, Status, Tag */}
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="ibanId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBAN</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona IBAN (opzionale)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredIbans.map((iban) => (
                              <SelectItem key={iban.id} value={iban.id}>
                                {iban.description} - {iban.iban?.slice(-8)}
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
                    name="statusId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stato *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona stato" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statuses.map((status) => (
                              <SelectItem key={status.id} value={status.id}>
                                {status.name}
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
                    name="tagId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tag</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona tag (opzionale)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tags.map((tag) => (
                              <SelectItem key={tag.id} value={tag.id}>
                                {tag.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Amount, VAT */}
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Importo *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vatType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo IVA</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona IVA" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="iva_22">22% (Standard)</SelectItem>
                            <SelectItem value="iva_10">10% (Ridotta)</SelectItem>
                            <SelectItem value="iva_4">4% (Super ridotta)</SelectItem>
                            <SelectItem value="esente">0% (Esente)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vatAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Importo IVA</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notes and Document */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="documentNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numero Documento</FormLabel>
                        <FormControl>
                          <Input placeholder="Es. FAT-2024/001" {...field} />
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
                          <Textarea placeholder="Note aggiuntive (opzionale)..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* XML Upload - Solo per spese, in alto */}
                {watchedType === "expense" && (
                  <div className="flex justify-end mb-4">
                    <CompactXMLUploader onDataParsed={handleXMLDataParsed} />
                  </div>
                )}

                {/* File Upload */}
                <div className="space-y-2">
                  <FormLabel>Documenti</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                      className="flex-1"
                    />
                  </div>
                  {uploadedFile && (
                    <p className="text-xs text-muted-foreground">
                      File selezionato: {uploadedFile.name}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  movement ? "Aggiorna Movimento" : "Salva Movimento"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}