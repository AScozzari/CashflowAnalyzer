import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, CreditCard, Wifi, WifiOff, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BankSelect } from "@/components/ui/bank-select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { insertIbanSchema, type Iban, type InsertIban, type Company } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { italianBanks } from "@/data/italian-banks";
import BankingApiSetup from "./banking-api-setup";

// Mappatura intelligente banche -> provider API
const BANK_API_MAPPING = {
  "UniCredit": "unicredit",
  "Intesa Sanpaolo": "intesa",
  "Banco BPM": "cbi_globe",
  "BPER Banca": "cbi_globe", 
  "Credem": "cbi_globe",
  "UBI Banca": "cbi_globe",
  "Banche di Credito Cooperativo (BCC)": "cbi_globe",
  "Monte dei Paschi di Siena": "nexi",
  "Banco di Sardegna": "banco_bpm_direct",
  "Banco Desio": "banco_desio_direct"
};

const PROVIDER_INFO = {
  unicredit: { name: "UniCredit", status: "✅ Implementato", color: "green" },
  intesa: { name: "Intesa Sanpaolo", status: "✅ Implementato", color: "green" },
  cbi_globe: { name: "CBI Globe", status: "✅ Disponibile", color: "green" },
  nexi: { name: "NEXI", status: "🚧 In sviluppo", color: "orange" },
  banco_bpm_direct: { name: "Banco BPM", status: "⚠️ Partnership richiesta", color: "yellow" },
  banco_desio_direct: { name: "Banco Desio", status: "⚠️ Partnership richiesta", color: "yellow" }
};

interface IbanFormProps {
  iban?: Iban;
  onClose: () => void;
}

function IbanForm({ iban, onClose }: IbanFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBankName, setSelectedBankName] = useState(iban?.bankName || "");
  const [suggestedProvider, setSuggestedProvider] = useState<string | null>(null);
  const [showApiSuggestion, setShowApiSuggestion] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [tempIban, setTempIban] = useState<Partial<Iban> | null>(null);

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const form = useForm<InsertIban>({
    resolver: zodResolver(insertIbanSchema),
    defaultValues: {
      iban: iban?.iban || "",
      bankName: iban?.bankName || "",
      bankCode: iban?.bankCode || "",
      description: iban?.description || "",
      notes: iban?.notes || "",
      companyId: iban?.companyId || "",
      apiProvider: iban?.apiProvider || "",
      autoSyncEnabled: iban?.autoSyncEnabled || false,
      syncFrequency: iban?.syncFrequency || "daily",
    },
  });

  // Trova il valore della banca selezionata per il componente BankSelect
  const getBankValue = (bankName: string) => {
    const bank = italianBanks.find(b => b.label === bankName);
    return bank ? bank.value : "";
  };

  // Logica intelligente per rilevare API disponibili
  const checkApiAvailability = (bankName: string) => {
    const provider = BANK_API_MAPPING[bankName as keyof typeof BANK_API_MAPPING];
    if (provider) {
      setSuggestedProvider(provider);
      setShowApiSuggestion(true);
      
      // Auto-seleziona il provider se non è già impostato
      if (!form.getValues("apiProvider")) {
        form.setValue("apiProvider", provider);
      }
    } else {
      setSuggestedProvider(null);
      setShowApiSuggestion(false);
    }
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
    <>
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
                    const bankName = selectedBank ? selectedBank.label : value;
                    
                    // Aggiorna il form
                    field.onChange(bankName);
                    setSelectedBankName(bankName);
                    
                    // Controlla disponibilità API
                    checkApiAvailability(bankName);
                  }}
                  placeholder="Seleziona banca italiana..."
                />
              </FormControl>
              <FormMessage />
              
              {/* Alert per API disponibili */}
              {showApiSuggestion && suggestedProvider && (
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      🎉 API Disponibili per {selectedBankName}!
                    </p>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                    Provider: {PROVIDER_INFO[suggestedProvider as keyof typeof PROVIDER_INFO]?.status}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-green-600 dark:text-green-300">
                      Il provider API è stato auto-selezionato.
                    </p>
                    <Button
                      type="button" 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-50"
                      onClick={() => {
                        // Salva temporaneamente i dati del form per configurare API
                        const formData = form.getValues();
                        setTempIban({
                          ...formData,
                          id: iban?.id || 'temp-' + Date.now(),
                          bankName: selectedBankName,
                          apiProvider: suggestedProvider,
                        } as Partial<Iban>);
                        setShowApiModal(true);
                      }}
                    >
                      🚀 Configura API Ora
                    </Button>
                  </div>
                </div>
              )}
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

        {/* Sezione API Bancarie */}
        <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Settings2 className="w-4 h-4" />
              Integrazione API Bancaria
            </CardTitle>
            <CardDescription className="text-xs">
              Configura la sincronizzazione automatica dei movimenti bancari per verificare automaticamente i flussi inseriti.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="apiProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider API</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona provider API bancario" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unicredit">UniCredit - API Dirette</SelectItem>
                      <SelectItem value="intesa">Intesa Sanpaolo - API Dirette</SelectItem>
                      <SelectItem value="cbi_globe">CBI Globe - BPM, BPER, Credem, etc.</SelectItem>
                      <SelectItem value="nexi">NEXI - MPS e altri</SelectItem>
                      <SelectItem value="manual">Configurazione Manuale</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Codice Banca (ABI/CAB)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="es. 02008.01030" value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="autoSyncEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium">
                      Sincronizzazione Automatica
                    </FormLabel>
                    <div className="text-xs text-muted-foreground">
                      Attiva la sincronizzazione automatica dei movimenti bancari
                    </div>
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

            {form.watch('autoSyncEnabled') && (
              <FormField
                control={form.control}
                name="syncFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequenza Sincronizzazione</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "daily"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona frequenza" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="hourly">Ogni ora</SelectItem>
                        <SelectItem value="daily">Giornaliera</SelectItem>
                        <SelectItem value="weekly">Settimanale</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

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
      
      {showApiModal && tempIban && (
        <Dialog open={showApiModal} onOpenChange={setShowApiModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>🚀 Configurazione API per {tempIban.bankName}</DialogTitle>
              <DialogDescription>
                Configura l'integrazione API per sincronizzare automaticamente i movimenti bancari
              </DialogDescription>
            </DialogHeader>
            <BankingApiSetup 
              iban={{
                ...tempIban,
                apiProvider: tempIban.apiProvider || undefined,
                syncFrequency: tempIban.syncFrequency || undefined
              } as any} 
              onClose={() => {
                setShowApiModal(false);
                setTempIban(null);
              }} 
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default function IbanManagement() {
  const [selectedIban, setSelectedIban] = useState<Iban | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [selectedIbanForApi, setSelectedIbanForApi] = useState<Iban | null>(null);
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

  const handleConfigureApi = (iban: Iban) => {
    setSelectedIbanForApi(iban);
    setIsApiDialogOpen(true);
  };

  const handleCloseApiDialog = () => {
    setSelectedIbanForApi(null);
    setIsApiDialogOpen(false);
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'N/A';
  };

  const getSuggestedApiProvider = (bankName: string) => {
    for (const [bankKey, bankInfo] of Object.entries(ITALIAN_BANKS)) {
      if (bankName.toLowerCase().includes(bankKey.toLowerCase()) || 
          bankName.toLowerCase().includes(bankInfo.name.toLowerCase())) {
        return bankInfo.apiProvider;
      }
    }
    return null;
  };

  const canUseApi = (bankName: string) => {
    const provider = getSuggestedApiProvider(bankName);
    return provider !== null;
  };

  if (isLoading) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  const ibansWithAvailableApi = ibans.filter(iban => 
    !iban.autoSyncEnabled && canUseApi(iban.bankName)
  );

  return (
    <div>
      {/* Banner notifica API disponibili */}
      {ibansWithAvailableApi.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <h5 className="font-medium text-blue-900 dark:text-blue-100">
              🚀 API Bancarie Disponibili
            </h5>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
            Abbiamo rilevato {ibansWithAvailableApi.length} IBAN con banche che supportano l'integrazione API automatica per la sincronizzazione dei movimenti.
          </p>
          <div className="flex flex-wrap gap-2">
            {ibansWithAvailableApi.slice(0, 3).map(iban => (
              <button
                key={iban.id}
                onClick={() => handleConfigureApi(iban)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
              >
                {iban.bankName} - {getSuggestedApiProvider(iban.bankName)}
              </button>
            ))}
            {ibansWithAvailableApi.length > 3 && (
              <span className="text-xs text-blue-600 dark:text-blue-400 px-2 py-1">
                +{ibansWithAvailableApi.length - 3} altri...
              </span>
            )}
          </div>
        </div>
      )}

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
              <TableHead>API Status</TableHead>
              <TableHead className="w-32">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ibans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
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
                    {iban.autoSyncEnabled ? (
                      <div className="flex items-center gap-1">
                        <Wifi className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Attivo</span>
                      </div>
                    ) : canUseApi(iban.bankName) ? (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-sm text-blue-600 cursor-pointer" 
                              onClick={() => handleConfigureApi(iban)}
                              title="API disponibili - clicca per configurare">
                          API Disponibili
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <WifiOff className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">Non disponibile</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(iban)}
                        title="Modifica IBAN"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {canUseApi(iban.bankName) && !iban.autoSyncEnabled ? (
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleConfigureApi(iban)}
                          title={`Configura API per ${getSuggestedApiProvider(iban.bankName)}`}
                        >
                          <Settings2 className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleConfigureApi(iban)}
                          title="Configura API Bancaria"
                        >
                          <Settings2 className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(iban.id)}
                        disabled={deleteMutation.isPending}
                        title="Elimina IBAN"
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

      {/* Dialog per configurazione API bancarie */}
      <Dialog open={isApiDialogOpen} onOpenChange={setIsApiDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-card dark:bg-card text-card-foreground dark:text-card-foreground border-border dark:border-border">
          <div className="max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              Configurazione API Bancaria
            </DialogTitle>
            <DialogDescription>
              Configura l'integrazione automatica per la sincronizzazione dei movimenti bancari
            </DialogDescription>
          </DialogHeader>
          {selectedIbanForApi && (
            <BankingApiSetup 
              iban={{
                ...selectedIbanForApi,
                apiProvider: selectedIbanForApi.apiProvider || undefined,
                syncFrequency: selectedIbanForApi.syncFrequency || undefined
              }} 
              onClose={handleCloseApiDialog} 
            />
          )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}