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
  Hash
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
  flowDate: z.string().min(1, "Data movimento richiesta"),
  companyId: z.string().min(1, "Ragione sociale richiesta"),
  coreId: z.string().min(1, "Core business richiesto"),
  reasonId: z.string().min(1, "Causale richiesta"),
  type: z.enum(["income", "expense"], { required_error: "Tipo movimento richiesto" }),
  
  // Sezione entità (dinamica)
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  resourceId: z.string().optional(),
  officeId: z.string().optional(),
  
  // Sezione finale
  ibanId: z.string().optional(),
  statusId: z.string().min(1, "Stato richiesto"),
  tagId: z.string().optional(),
  amount: z.string().min(1, "Importo richiesto"),
  vatType: z.string().min(1, "Tipo IVA richiesto"),
  vatAmount: z.string().optional(),
  notes: z.string().min(1, "Causale richiesta"),
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
  const [selectedEntity, setSelectedEntity] = useState<Customer | Supplier | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  
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
  const watchedCustomerId = form.watch("customerId");
  const watchedSupplierId = form.watch("supplierId");
  const watchedResourceId = form.watch("resourceId");
  const watchedCompanyId = form.watch("companyId");

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

  // Auto-calculate VAT
  useEffect(() => {
    if (watchedAmount && watchedVatType && parseFloat(watchedAmount) > 0) {
      const amount = parseFloat(watchedAmount);
      let vatRate = 0;
      
      switch (watchedVatType) {
        case "iva_22": vatRate = 0.22; break;
        case "iva_10": vatRate = 0.10; break;
        case "iva_4": vatRate = 0.04; break;
        case "iva_art_74":
        case "esente": vatRate = 0; break;
        default: vatRate = 0;
      }
      
      const vatAmount = (amount * vatRate).toFixed(2);
      form.setValue("vatAmount", vatAmount);
    }
  }, [watchedAmount, watchedVatType, form]);

  // Load entity details when selected
  useEffect(() => {
    if (watchedCustomerId) {
      const customer = customers.find(c => c.id === watchedCustomerId);
      setSelectedEntity(customer || null);
    } else if (watchedSupplierId) {
      const supplier = suppliers.find(s => s.id === watchedSupplierId);
      setSelectedEntity(supplier || null);
    } else {
      setSelectedEntity(null);
    }
  }, [watchedCustomerId, watchedSupplierId, customers, suppliers]);

  // Load resource details when selected
  useEffect(() => {
    if (watchedResourceId) {
      const resource = resources.find(r => r.id === watchedResourceId);
      setSelectedResource(resource || null);
    } else {
      setSelectedResource(null);
    }
  }, [watchedResourceId, resources]);

  // Reset dependent fields when changing movement type
  useEffect(() => {
    if (watchedType === "income") {
      form.setValue("supplierId", "");
    } else {
      form.setValue("customerId", "");
    }
  }, [watchedType, form]);

  // Reset dependent fields when changing company
  useEffect(() => {
    if (watchedCompanyId !== movement?.companyId) {
      form.setValue("coreId", "");
      form.setValue("resourceId", "");
      form.setValue("officeId", "");
      form.setValue("ibanId", "");
    }
  }, [watchedCompanyId, form, movement?.companyId]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const endpoint = movement ? `/api/movements/${movement.id}` : "/api/movements";
      const method = movement ? "PUT" : "POST";
      
      const response = await fetch(endpoint, {
        method,
        body: data,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Errore durante il salvataggio");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      toast({
        title: movement ? "Movimento aggiornato" : "Movimento creato",
        description: movement ? "Il movimento è stato aggiornato con successo" : "Il movimento è stato creato con successo",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: MovementFormData) => {
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      
      // Add form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value.toString());
        }
      });
      
      // Add file if uploaded
      if (uploadedFile) {
        formData.append("document", uploadedFile);
        formData.append("fileName", uploadedFile.name);
      }
      
      await createMutation.mutateAsync(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleXMLDataParsed = (parsedData: any) => {
    if (parsedData?.movementSuggestion) {
      const suggestion = parsedData.movementSuggestion;
      
      // Pre-fill form with XML data
      form.setValue("type", suggestion.type);
      form.setValue("amount", suggestion.amount);
      form.setValue("flowDate", suggestion.flowDate);
      form.setValue("documentNumber", suggestion.documentNumber);
      form.setValue("notes", suggestion.description || suggestion.notes);
      
      if (suggestion.vatAmount) {
        form.setValue("vatAmount", suggestion.vatAmount.toString());
      }
    }
    
    if (parsedData?.supplier && watchedType === "expense") {
      // Try to find existing supplier by VAT number
      const existingSupplier = suppliers.find(s => s.vatNumber === parsedData.supplier.vatNumber);
      if (existingSupplier) {
        form.setValue("supplierId", existingSupplier.id);
      }
    }
  };

  const getVatTypeLabel = (vatType: string) => {
    switch (vatType) {
      case "iva_22": return "IVA 22%";
      case "iva_10": return "IVA 10%";
      case "iva_4": return "IVA 4%";
      case "iva_art_74": return "IVA Art.74 0%";
      case "esente": return "Esente IVA";
      default: return vatType;
    }
  };

  const renderEntityCard = () => {
    if (!selectedEntity) return null;

    const isCustomer = 'type' in selectedEntity;
    const displayName = isCustomer 
      ? selectedEntity.type === 'private' 
        ? `${selectedEntity.firstName} ${selectedEntity.lastName}`.trim()
        : selectedEntity.name
      : selectedEntity.name;

    return (
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {isCustomer ? <User className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
            {isCustomer ? "Cliente Selezionato" : "Fornitore Selezionato"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="font-medium">{displayName}</div>
          {selectedEntity.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Mail className="h-3 w-3" />
              {selectedEntity.email}
            </div>
          )}
          {selectedEntity.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Phone className="h-3 w-3" />
              {selectedEntity.phone}
            </div>
          )}
          {isCustomer ? (
            selectedEntity.type === 'business' && selectedEntity.vatNumber && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Hash className="h-3 w-3" />
                P.IVA: {selectedEntity.vatNumber}
              </div>
            )
          ) : (
            selectedEntity.vatNumber && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Hash className="h-3 w-3" />
                P.IVA: {selectedEntity.vatNumber}
              </div>
            )
          )}
          {selectedEntity.address && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="h-3 w-3" />
              {selectedEntity.address}, {selectedEntity.city} {selectedEntity.zipCode}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderResourceCard = () => {
    if (!selectedResource) return null;

    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Risorsa Selezionata
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="font-medium">{selectedResource.firstName} {selectedResource.lastName}</div>
          {selectedResource.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Mail className="h-3 w-3" />
              {selectedResource.email}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Building className="h-3 w-3" />
            {companies.find(c => c.id === selectedResource.companyId)?.name}
          </div>
          <Badge variant="secondary" className="text-xs">
            {selectedResource.role}
          </Badge>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

                {/* Company and Core */}
                <div className="grid grid-cols-2 gap-4">
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
                        <FormLabel>Core Business *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona core business" />
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
                </div>

                {/* Reason and Type */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="reasonId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Oggetto del Movimento *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona oggetto" />
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
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                Entrata
                              </div>
                            </SelectItem>
                            <SelectItem value="expense">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                Uscita
                              </div>
                            </SelectItem>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {watchedType === "income" ? <User className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
                  {watchedType === "income" ? "Cliente e Risorsa" : "Fornitore e Risorsa"}
                </CardTitle>
                <CardDescription>
                  {watchedType === "income" 
                    ? "Seleziona il cliente e/o la risorsa associata al movimento di entrata"
                    : "Seleziona il fornitore e/o la risorsa associata al movimento di uscita"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {watchedType === "income" ? (
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Cliente
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {/* TODO: Aprire modal nuovo cliente */}}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Nuovo
                          </Button>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona cliente (opzionale)" />
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
                ) : (
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Fornitore
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {/* TODO: Aprire modal nuovo fornitore */}}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Nuovo
                          </Button>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona fornitore (opzionale)" />
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

                {/* Resource and Office */}
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
                              <SelectValue placeholder="Seleziona risorsa (opzionale)" />
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

                {/* Entity Details Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {renderEntityCard()}
                  {renderResourceCard()}
                </div>
              </CardContent>
            </Card>

            {/* Sezione 3: Dettagli Finali */}
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

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Causale *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Descrivi la causale del movimento..."
                          className="min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Financial Details */}
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Importo Totale *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00"
                          />
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
                        <FormLabel>Tipo IVA *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona IVA" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="iva_22">IVA 22%</SelectItem>
                            <SelectItem value="iva_10">IVA 10%</SelectItem>
                            <SelectItem value="iva_4">IVA 4%</SelectItem>
                            <SelectItem value="iva_art_74">IVA Art.74 0%</SelectItem>
                            <SelectItem value="esente">Esente IVA</SelectItem>
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
                        <FormLabel>Totale IVA</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00"
                            readOnly
                            className="bg-gray-50 dark:bg-gray-900"
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Calcolato automaticamente: {getVatTypeLabel(watchedVatType)}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Documents */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="documentNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numero Documento</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="es. FT-2025/001" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Documento Allegato</label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                      {watchedType === "expense" && (
                        <CompactXMLUploader onDataParsed={handleXMLDataParsed} />
                      )}
                    </div>
                    {uploadedFile && (
                      <p className="text-xs text-muted-foreground">
                        File selezionato: {uploadedFile.name}
                      </p>
                    )}
                  </div>
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