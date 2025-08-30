import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Building, 
  Users, 
  Calendar, 
  Euro, 
  Save, 
  Send,
  Trash2,
  Calculator,
  FileText,
  Search
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

// Schema di validazione per la fattura
const invoiceSchema = z.object({
  companyId: z.string().min(1, "Seleziona una ragione sociale"),
  customerId: z.string().optional(),
  invoiceTypeId: z.string().min(1, "Seleziona il tipo documento"),
  issueDate: z.string().min(1, "Data emissione richiesta"),
  dueDate: z.string().optional(),
  paymentTermsId: z.string().optional(),
  paymentMethodId: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    description: z.string().min(1, "Descrizione richiesta"),
    quantity: z.number().min(0.01, "Quantità deve essere maggiore di 0"),
    unitPrice: z.number().min(0, "Prezzo unitario non può essere negativo"),
    vatCodeId: z.string().min(1, "Codice IVA richiesto"),
    discountPercentage: z.number().min(0).max(100).default(0),
  })).min(1, "Almeno una riga è richiesta"),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export function InvoiceCreation() {
  const [isCalculating, setIsCalculating] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      issueDate: new Date().toISOString().split('T')[0],
      lines: [{
        description: "",
        quantity: 1,
        unitPrice: 0,
        vatCodeId: "",
        discountPercentage: 0,
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  // Fetch data for dropdowns
  const { data: companies } = useQuery({
    queryKey: ['/api/companies'],
  });

  const { data: customers } = useQuery({
    queryKey: ['/api/customers'],
  });

  const { data: invoiceTypes } = useQuery({
    queryKey: ['/api/invoicing/types'],
  });

  const { data: vatCodes } = useQuery({
    queryKey: ['/api/invoicing/vat-codes'],
  });

  const { data: paymentTerms } = useQuery({
    queryKey: ['/api/invoicing/payment-terms'],
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['/api/invoicing/payment-methods'],
  });

  // Mutation per creare la fattura
  const createInvoiceMutation = useMutation({
    mutationFn: (data: InvoiceFormData) => 
      apiRequest('/invoicing/invoices', 'POST', data),
    onSuccess: (invoice: any) => {
      toast({
        title: "Fattura creata",
        description: "La fattura è stata creata con successo",
      });
      
      // Avvia la sincronizzazione con i provider esterni
      if (invoice?.id) {
        syncWithProvidersMutation.mutate(invoice.id);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/invoicing/invoices'] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Errore nella creazione della fattura",
        variant: "destructive",
      });
    },
  });

  // Mutation per sincronizzazione con provider esterni
  const syncWithProvidersMutation = useMutation({
    mutationFn: (invoiceId: string) => 
      apiRequest(`/invoicing/invoices/${invoiceId}/sync-providers`, 'POST'),
    onSuccess: (result: any) => {
      if (result.providers?.length > 0) {
        toast({
          title: "Sincronizzazione provider",
          description: `Fattura sincronizzata con ${result.providers.length} provider(s) esterni`,
        });
      }
    },
    onError: () => {
      toast({
        title: "Avviso sincronizzazione",
        description: "Fattura creata ma sincronizzazione provider non riuscita",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvoiceFormData) => {
    createInvoiceMutation.mutate(data);
  };

  const calculateLineTotals = () => {
    setIsCalculating(true);
    const lines = form.getValues('lines');
    
    // Simula calcolo automatico
    setTimeout(() => {
      const updatedLines = lines.map(line => {
        const subtotal = line.quantity * line.unitPrice;
        const discountAmount = (subtotal * line.discountPercentage) / 100;
        const taxableAmount = subtotal - discountAmount;
        
        return {
          ...line,
          totalPrice: taxableAmount,
        };
      });
      
      form.setValue('lines', updatedLines);
      setIsCalculating(false);
    }, 1000);
  };

  const addNewLine = () => {
    append({
      description: "",
      quantity: 1,
      unitPrice: 0,
      vatCodeId: "",
      discountPercentage: 0,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <span>Nuova Fattura Elettronica</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Dati Generali */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Building className="h-5 w-5" />
                      <span>Dati Emittente</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="companyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ragione Sociale *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="company-select">
                                <SelectValue placeholder="Seleziona ragione sociale" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {companies?.map((company: any) => (
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
                      name="invoiceTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo Documento *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="invoice-type-select">
                                <SelectValue placeholder="Seleziona tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {invoiceTypes?.map((type: any) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.code} - {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Dati Cliente</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="customer-select">
                                <SelectValue placeholder="Seleziona cliente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers?.map((customer: any) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.businessName || customer.firstName + ' ' + customer.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="issueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Emissione *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="issue-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Scadenza</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="due-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Righe Fattura */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Euro className="h-5 w-5" />
                    <span>Righe Fattura</span>
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={calculateLineTotals}
                      disabled={isCalculating}
                      data-testid="calculate-totals"
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      {isCalculating ? "Calcolando..." : "Ricalcola"}
                    </Button>
                    <Button 
                      type="button" 
                      size="sm"
                      onClick={addNewLine}
                      data-testid="add-line"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Riga
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <div className="md:col-span-2">
                            <FormField
                              control={form.control}
                              name={`lines.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Descrizione *</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      {...field} 
                                      placeholder="Descrizione prodotto/servizio"
                                      data-testid={`line-description-${index}`}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`lines.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantità *</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    data-testid={`line-quantity-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`lines.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prezzo Unit. *</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    data-testid={`line-unit-price-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`lines.${index}.vatCodeId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>IVA *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid={`line-vat-${index}`}>
                                      <SelectValue placeholder="IVA" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {vatCodes?.map((vat: any) => (
                                      <SelectItem key={vat.id} value={vat.id}>
                                        <div className="flex items-center justify-between w-full">
                                          <span className="font-medium">{vat.code}</span>
                                          <span className="text-sm text-muted-foreground ml-2">
                                            {vat.natura ? 
                                              `${vat.description} (${vat.natura})` : 
                                              `IVA ${vat.percentage}%`
                                            }
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex items-end">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => remove(index)}
                              disabled={fields.length === 1}
                              data-testid={`remove-line-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pagamento e Note */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Condizioni di Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="paymentTermsId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Termini di Pagamento</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="payment-terms-select">
                                <SelectValue placeholder="Seleziona termini" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentTerms?.map((term: any) => (
                                <SelectItem key={term.id} value={term.id}>
                                  {term.name} ({term.days} giorni)
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
                      name="paymentMethodId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modalità di Pagamento</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="payment-method-select">
                                <SelectValue placeholder="Seleziona modalità" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentMethods?.map((method: any) => (
                                <SelectItem key={method.id} value={method.id}>
                                  {method.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Note e Riferimenti</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Note aggiuntive..."
                              rows={4}
                              data-testid="invoice-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Azioni */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline">
                      <Save className="h-4 w-4 mr-2" />
                      Salva Bozza
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={createInvoiceMutation.isPending}
                      data-testid="create-invoice-submit"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {createInvoiceMutation.isPending ? "Creando..." : "Crea Fattura"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}