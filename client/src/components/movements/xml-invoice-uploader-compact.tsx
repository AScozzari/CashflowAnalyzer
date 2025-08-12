import { useState } from "react";
import { Upload, FileX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CompactXMLUploaderProps {
  onDataParsed?: (data: any) => void;
}

export default function CompactXMLUploader({ onDataParsed }: CompactXMLUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);

    try {
      // Simulazione dei dati estratti dal file XML per test
      const mockParsedData = {
        supplier: {
          vatNumber: "12345678901",
          name: "Fornitore Test S.r.l.",
          taxCode: "RSSMRA85M01H501Z",
          address: "Via Roma 123",
          city: "Milano",
          zipCode: "20100"
        },
        invoice: {
          documentNumber: "2025/001",
          documentDate: "2025-01-10",
          totalAmount: 1220.00,
          vatAmount: 220.00,
          netAmount: 1000.00,
          description: "Servizi di consulenza informatica"
        },
        movementSuggestion: {
          type: 'expense' as const,
          amount: "1220.00",
          flowDate: "2025-01-10",
          documentNumber: "2025/001",
          description: "Servizi di consulenza informatica",
          vatAmount: 220.00,
          netAmount: 1000.00,
          notes: "Fattura elettronica - Fornitore Test S.r.l. (P.IVA: 12345678901)"
        }
      };

      // Per ora simulo una risposta di successo
      toast({
        title: "XML Elaborato (Simulazione)",
        description: `Estratti dati da fattura ${mockParsedData.invoice.documentNumber}`,
      });

      if (onDataParsed) {
        onDataParsed(mockParsedData);
      }

      setIsOpen(false);
      setSelectedFile(null);

    } catch (error) {
      console.error('Errore nell\'upload XML:', error);
      toast({
        title: "Errore",
        description: "Impossibile elaborare il file XML",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline" 
          size="sm"
          className="gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
        >
          <Upload className="h-4 w-4" />
          Carica XML
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Carica Fattura XML</DialogTitle>
          <DialogDescription>
            Seleziona un file XML di fattura elettronica per compilare automaticamente il movimento
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="xml-file-input"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Clicca per caricare</span> il file XML
                </p>
                <p className="text-xs text-gray-500">Solo file XML</p>
              </div>
              <input
                id="xml-file-input"
                type="file"
                className="hidden"
                accept=".xml"
                onChange={handleFileSelect}
              />
            </label>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileX className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {selectedFile.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
              >
                <FileX className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isProcessing}
            >
              {isProcessing ? "Elaborazione..." : "Carica e Compila"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}