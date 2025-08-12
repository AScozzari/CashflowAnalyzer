import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, AlertCircle, Loader2 } from "lucide-react";
import { insertMovementSchema } from "@shared/schema";
import { LEGAL_FORMS, MAX_FILE_SIZE, ALLOWED_FILE_TYPES, VALIDATION_MESSAGES } from "@/lib/constants";
import type { MovementWithRelations, Company, Core, Resource, Office, Iban, Tag, MovementStatus, MovementReason } from "@shared/schema";
import CompactXMLUploader from "./xml-invoice-uploader-compact";

const formSchema = insertMovementSchema.extend({
  amount: z.string()
    .min(1, VALIDATION_MESSAGES.REQUIRED)
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "L'importo deve essere un numero positivo"
    ),
}).refine((data) => {
  const insertDate = new Date(data.insertDate);
  const flowDate = new Date(data.flowDate);
  return insertDate <= flowDate;
}, {
  message: "La data di inserimento non può essere successiva alla data del flusso",
  path: ["flowDate"],
});

interface MovementFormProps {
  movement?: MovementWithRelations | null;
  onClose: () => void;
}

export default function MovementForm({ movement, onClose }: MovementFormProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      insertDate: new Date().toISOString().split('T')[0],
      flowDate: new Date().toISOString().split('T')[0],
      type: "income",
      amount: "",
      vatAmount: "",
      vatType: undefined,
      supplierId: "",
      documentNumber: "",
      notes: "",
      companyId: "",
      coreId: "",
      statusId: "",
      reasonId: "",
      resourceId: "",
      officeId: "",
      ibanId: "",
      tagId: "",
    },
  });

  // Watch for changes to reset dependent fields
  const watchedCompanyId = form.watch("companyId");

  useEffect(() => {
    if (watchedCompanyId !== selectedCompanyId) {
      setSelectedCompanyId(watchedCompanyId);
      // Reset dependent fields when company changes
      if (watchedCompanyId !== movement?.companyId) {
        form.setValue("coreId", "");
        form.setValue("resourceId", "");
        form.setValue("officeId", "");
        form.setValue("ibanId", "");
      }
    }
  }, [watchedCompanyId, selectedCompanyId, form, movement?.companyId]);

  // Populate form if editing
  useEffect(() => {
    if (movement) {
      form.reset({
        insertDate: movement.insertDate,
        flowDate: movement.flowDate,
        type: movement.type as "income" | "expense",
        amount: movement.amount,
        vatAmount: movement.vatAmount || "",
        vatType: movement.vatType || undefined,
        supplierId: movement.supplierId || "",
        documentNumber: movement.documentNumber || "",
        notes: movement.notes || "",
        companyId: movement.companyId,
        coreId: movement.coreId,
        statusId: movement.statusId,
        reasonId: movement.reasonId || "",
        resourceId: movement.resourceId || "",
        officeId: movement.officeId || "",
        ibanId: movement.ibanId || "",
        tagId: movement.tagId || "",
      });
      setSelectedCompanyId(movement.companyId);
    }
  }, [movement, form]);

  // Fetch entities with proper error handling
  const { data: companies = [], isLoading: companiesLoading, error: companiesError } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    retry: 3,
    retryDelay: 1000,
  });

  const { data: cores = [], isLoading: coresLoading } = useQuery<Core[]>({
    queryKey: ["/api/cores", selectedCompanyId],
    queryFn: () => selectedCompanyId ? 
      fetch(`/api/cores?companyId=${selectedCompanyId}`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch cores');
        return res.json();
      }) : 
      Promise.resolve([]),
    enabled: !!selectedCompanyId,
    retry: 2,
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources", selectedCompanyId],
    queryFn: () => selectedCompanyId ? 
      fetch(`/api/resources?companyId=${selectedCompanyId}`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch resources');
        return res.json();
      }) : 
      Promise.resolve([]),
    enabled: !!selectedCompanyId,
    retry: 2,
  });

  const { data: offices = [] } = useQuery<Office[]>({
    queryKey: ["/api/offices", selectedCompanyId],
    queryFn: () => selectedCompanyId ? 
      fetch(`/api/offices?companyId=${selectedCompanyId}`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch offices');
        return res.json();
      }) : 
      Promise.resolve([]),
    enabled: !!selectedCompanyId,
    retry: 2,
  });

  const { data: ibans = [] } = useQuery<Iban[]>({
    queryKey: ["/api/ibans", selectedCompanyId],
    queryFn: () => selectedCompanyId ? 
      fetch(`/api/ibans?companyId=${selectedCompanyId}`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch ibans');
        return res.json();
      }) : 
      Promise.resolve([]),
    enabled: !!selectedCompanyId,
    retry: 2,
  });

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
    retry: 2,
  });

  const { data: statuses = [] } = useQuery<MovementStatus[]>({
    queryKey: ["/api/movement-statuses"],
    retry: 2,
  });

  const { data: reasons = [] } = useQuery<MovementReason[]>({
    queryKey: ["/api/movement-reasons"],
    retry: 2,
  });

  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
    retry: 2,
  });

  const createMovementMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/movements", {
        method: "POST",
        body: data,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Movement creation error:', errorData);
        
        // Handle validation errors specifically
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const validationErrors = errorData.errors.map(err => err.message || err.field).join(', ');
          throw new Error(`Errori di validazione: ${validationErrors}`);
        }
        
        throw new Error(errorData.message || "Failed to create movement");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Movimento creato",
        description: "Il movimento è stato creato con successo.",
      });
      onClose();
    },
    onError: (error: Error) => {
      console.error('Movement creation error:', error);
      let errorMessage = error.message;
      
      // Parse validation errors if available
      if (error.message.includes('validation')) {
        errorMessage = "Verificare i dati inseriti. Alcuni campi potrebbero non essere validi.";
      } else if (error.message.includes('required')) {
        errorMessage = "Alcuni campi obbligatori non sono stati compilati.";
      }
      
      toast({
        title: "Errore nella creazione",
        description: errorMessage || "Si è verificato un errore durante la creazione del movimento.",
        variant: "destructive",
      });
    },
  });

  const updateMovementMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!movement) throw new Error("No movement to update");
      const response = await fetch(`/api/movements/${movement.id}`, {
        method: "PUT",
        body: data,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update movement");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Movimento aggiornato",
        description: "Il movimento è stato aggiornato con successo.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'aggiornamento del movimento.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: any) => {
    // Validate form before submission
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      console.log('Form validation errors:', errors);
      
      // Show specific error message for first error
      const firstError = Object.values(errors)[0];
      toast({
        title: "Errore di validazione",
        description: firstError?.message || "Verificare i campi obbligatori",
        variant: "destructive",
      });
      return;
    }

    // Check required fields manually
    const requiredFields = ['companyId', 'coreId', 'statusId', 'reasonId', 'resourceId', 'amount'];
    const missingFields = requiredFields.filter(field => !values[field] || values[field] === '');
    
    if (missingFields.length > 0) {
      const fieldNames = {
        companyId: 'Ragione Sociale',
        coreId: 'Core',
        statusId: 'Stato',
        reasonId: 'Causale',
        resourceId: 'Risorsa',
        amount: 'Importo'
      };
      
      const missingFieldNames = missingFields.map(field => fieldNames[field] || field).join(', ');
      toast({
        title: "Campi obbligatori mancanti",
        description: `È necessario compilare: ${missingFieldNames}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Append all form values, filtering out empty strings for optional fields
      Object.entries(values).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Append file if present
      if (uploadedFile) {
        formData.append('document', uploadedFile);
      }

      if (movement) {
        await updateMovementMutation.mutateAsync(formData);
      } else {
        await createMovementMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error('Submit error:', error);
      // Error handled by mutation onError
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File troppo grande",
          description: "Il file deve essere inferiore a 10MB.",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: "Tipo di file non supportato",
          description: "Sono supportati solo file PDF, DOC, DOCX, JPG, JPEG, PNG.",
          variant: "destructive",
        });
        return;
      }

      setUploadedFile(file);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (companiesError) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 text-red-600 mb-4">
          <AlertCircle className="h-5 w-5" />
          <span>Errore nel caricamento delle aziende</span>
        </div>
        <Button onClick={onClose} variant="outline">
          Chiudi
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="pb-4 border-b border-border dark:border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-semibold text-foreground dark:text-foreground">
          {movement ? "Modifica Movimento" : "Nuovo Movimento"}
        </h3>
        {!movement && (
          <CompactXMLUploader
            onDataParsed={(data) => {
              console.log('Dati XML ricevuti:', data);
              
              // Autocompila i campi del form con i dati dell'XML
              if (data?.movementSuggestion) {
                const suggestion = data.movementSuggestion;
                
                form.setValue('type', suggestion.type || 'expense');
                form.setValue('amount', suggestion.amount || '0');
                form.setValue('flowDate', suggestion.flowDate || '');
                form.setValue('documentNumber', suggestion.documentNumber || '');
                form.setValue('description', suggestion.description || '');
                form.setValue('notes', suggestion.notes || '');
                
                // Campi VAT
                if (suggestion.vatAmount) {
                  form.setValue('vatAmount', suggestion.vatAmount.toString());
                }
                if (suggestion.netAmount) {
                  form.setValue('netAmount', suggestion.netAmount.toString());
                }
              }
              
              // Mostra informazioni del fornitore se disponibili
              if (data?.supplier) {
                setSelectedSupplier({
                  id: 'xml-supplier',
                  name: data.supplier.name,
                  vatNumber: data.supplier.vatNumber,
                  taxCode: data.supplier.taxCode || '',
                  address: data.supplier.address || '',
                  city: data.supplier.city || '',
                  zipCode: data.supplier.zipCode || '',
                  country: 'Italia',
                  email: '',
                  phone: '',
                  website: '',
                  contactPerson: '',
                  legalForm: '',
                  pec: '',
                  sdi: '',
                  paymentTerms: '30',
                  notes: 'Estratto da XML fattura elettronica',
                  isActive: true
                });
              }

              toast({
                title: "Form autocompilato",
                description: "I campi sono stati compilati automaticamente dai dati XML",
              });
            }}
          />
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
          {/* Date Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                  <FormLabel>Data Flusso *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Movement Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo Movimento *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="income" id="income" />
                      <Label htmlFor="income">Entrata</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="expense" id="expense" />
                      <Label htmlFor="expense">Uscita</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Required Entities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ragione Sociale *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={companiesLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          companiesLoading ? "Caricamento..." : "Seleziona Ragione Sociale"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies.map((company: any) => (
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
              name="coreId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Core Business *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!selectedCompanyId || coresLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !selectedCompanyId 
                            ? "Seleziona prima una ragione sociale"
                            : coresLoading 
                            ? "Caricamento..."
                            : "Seleziona Core"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cores.map((core: any) => (
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

          {/* Optional Entities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <FormField
              control={form.control}
              name="resourceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risorsa</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || undefined}
                    disabled={!selectedCompanyId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !selectedCompanyId 
                            ? "Seleziona prima una ragione sociale"
                            : "Seleziona Risorsa"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nessuna risorsa</SelectItem>
                      {resources.map((resource: any) => (
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
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || undefined}
                    disabled={!selectedCompanyId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !selectedCompanyId 
                            ? "Seleziona prima una ragione sociale"
                            : "Seleziona Sede"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nessuna sede</SelectItem>
                      {offices.map((office: any) => (
                        <SelectItem key={office.id} value={office.id}>
                          {office.city} - {office.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <FormField
              control={form.control}
              name="ibanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IBAN</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || undefined}
                    disabled={!selectedCompanyId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !selectedCompanyId 
                            ? "Seleziona prima una ragione sociale"
                            : "Seleziona IBAN"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nessun IBAN</SelectItem>
                      {ibans.map((iban: any) => (
                        <SelectItem key={iban.id} value={iban.id}>
                          {iban.iban.substring(0, 8)}...{iban.iban.substring(iban.iban.length - 4)} ({iban.bankName})
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
                      {reasons?.filter(reason => 
                        reason.type === 'both' || 
                        reason.type === form.watch("type")
                      ).map((reason) => (
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
              name="statusId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stato *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona Stato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statuses.map((status: any) => (
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
          </div>

          {/* Tags Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <FormField
              control={form.control}
              name="tagId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona Tag" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nessun tag</SelectItem>
                      {tags.map((tag: any) => (
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

          {/* Amount, VAT and Document Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Importo Totale (€) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vatAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Importo IVA (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
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
                  <FormLabel>Tipo IVA</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona Tipo IVA" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="iva_22">IVA 22%</SelectItem>
                      <SelectItem value="iva_10">IVA 10%</SelectItem>
                      <SelectItem value="iva_4">IVA 4%</SelectItem>
                      <SelectItem value="iva_art_74">IVA Art 74</SelectItem>
                      <SelectItem value="esente">Esente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="documentNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numero Documento</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="es. FAT-2025-001" 
                      maxLength={50}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Supplier for expenses */}
            {form.watch("type") === "expense" && (
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornitore</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona Fornitore" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map((supplier: any) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name} - {supplier.vatNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* File Upload */}
          <div>
            <Label>Documento Allegato</Label>
            <div className="mt-2">
              {uploadedFile ? (
                <div className="border border-border dark:border-border rounded-lg p-4 bg-card dark:bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm text-foreground dark:text-foreground">{uploadedFile.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({formatFileSize(uploadedFile.size)})
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border dark:border-border rounded-lg p-6 hover:border-primary transition-colors bg-card/50 dark:bg-card/50">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-foreground dark:text-foreground">
                      Trascina qui il documento o{" "}
                      <label className="text-primary cursor-pointer hover:underline">
                        sfoglia file
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                        />
                      </label>
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      PDF, DOC, JPG fino a 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
                    placeholder="Inserisci eventuali note sul movimento..."
                    className="resize-none"
                    maxLength={1000}
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t border-border dark:border-border">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
              className="min-w-[140px]"
            >
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
    </div>
  );
}
