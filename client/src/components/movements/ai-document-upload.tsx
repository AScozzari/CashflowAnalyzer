import { useState, useRef } from 'react';
import { Upload, FileText, Image, FileX, Loader2, Brain, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ExtractedData {
  // Dati base
  amount?: string;
  date?: string;
  description?: string;
  documentNumber?: string;
  
  // Classificazione AI
  movementType?: 'income' | 'expense';
  confidence?: number;
  
  // Entità rilevate
  supplierInfo?: {
    name?: string;
    vatNumber?: string;
    address?: string;
  };
  customerInfo?: {
    name?: string;
    vatNumber?: string;
    email?: string;
  };
  
  // Dettagli IVA
  vatAmount?: string;
  netAmount?: string;
  vatRate?: string;
  
  // Metadati
  fileType?: string;
  processingNotes?: string[];
}

interface AiDocumentUploadProps {
  onDataExtracted: (data: ExtractedData) => void;
  onFileUploaded: (file: File, filePath: string) => void;
  isProcessing: boolean;
  className?: string;
}

export function AiDocumentUpload({
  onDataExtracted,
  onFileUploaded,
  isProcessing,
  className
}: AiDocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'completed' | 'error'>('idle');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = [
    { type: 'XML', desc: 'FatturaPA, Documenti XML', icon: FileText },
    { type: 'PDF', desc: 'Fatture, Documenti PDF', icon: FileText },
    { type: 'IMG', desc: 'JPG, PNG, WEBP', icon: Image },
    { type: 'DOC', desc: 'Word, Excel, TXT', icon: FileText }
  ];

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Validazione formato file
    const allowedTypes = [
      'application/xml', 'text/xml',
      'application/pdf',
      'image/jpeg', 'image/png', 'image/webp',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Formato file non supportato. Carica XML, PDF, immagini o documenti Office.');
      return;
    }

    // Max size 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File troppo grande. Dimensione massima: 10MB');
      return;
    }

    processFile(file);
  };

  const processFile = async (file: File) => {
    setProcessingStatus('uploading');
    setErrorMessage(null);
    setUploadProgress(0);

    try {
      // Simula upload con progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(uploadInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Upload del file
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/movements/upload-document', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Errore durante l\'upload del file');
      }

      const uploadResult = await uploadResponse.json();
      setUploadProgress(100);

      // Chiama l'AI per analizzare il documento
      setProcessingStatus('analyzing');
      
      const analysisResponse = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: uploadResult.filePath,
          fileName: file.name,
          fileType: file.type,
          analysisType: 'movement_extraction'
        })
      });

      if (!analysisResponse.ok) {
        throw new Error('Errore durante l\'analisi AI del documento');
      }

      const analysisResult = await analysisResponse.json();
      
      // Parsing dei dati estratti dall'AI
      const extractedData: ExtractedData = {
        ...analysisResult.extractedData,
        fileType: getFileTypeLabel(file.type),
        processingNotes: analysisResult.notes || []
      };

      setExtractedData(extractedData);
      setProcessingStatus('completed');

      // Notifica componente padre
      onFileUploaded(file, uploadResult.filePath);
      onDataExtracted(extractedData);

    } catch (error: any) {
      console.error('Errore processamento file:', error);
      setErrorMessage(error.message || 'Errore durante il processamento del file');
      setProcessingStatus('error');
    }
  };

  const getFileTypeLabel = (mimeType: string): string => {
    if (mimeType.includes('xml')) return 'XML';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('image')) return 'Immagine';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Word';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'Excel';
    return 'Documento';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return 'Sconosciuto';
    if (confidence >= 0.9) return 'Alta';
    if (confidence >= 0.7) return 'Media';
    return 'Bassa';
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card className={cn(
        "border-2 border-dashed transition-all duration-200",
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300",
        processingStatus === 'error' ? "border-red-300 bg-red-50" : "",
        processingStatus === 'completed' ? "border-green-300 bg-green-50" : ""
      )}>
        <CardContent className="p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="text-center space-y-4"
          >
            {processingStatus === 'idle' && (
              <>
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Caricamento Intelligente con AI
                  </h3>
                  <p className="text-gray-500 mt-1">
                    Trascina qui il documento o clicca per selezionare
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mx-auto"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Seleziona Documento
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".xml,.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
              </>
            )}

            {(processingStatus === 'uploading' || processingStatus === 'analyzing') && (
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {processingStatus === 'uploading' ? 'Caricamento in corso...' : 'Analisi AI in corso...'}
                  </h3>
                  <Progress value={uploadProgress} className="mt-2 max-w-xs mx-auto" />
                </div>
              </div>
            )}

            {processingStatus === 'completed' && (
              <div className="space-y-2">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-green-800">
                  Analisi Completata!
                </h3>
                <p className="text-green-600 text-sm">
                  Dati estratti e form pre-compilato automaticamente
                </p>
              </div>
            )}

            {processingStatus === 'error' && (
              <div className="space-y-2">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FileX className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-red-800">
                  Errore Processamento
                </h3>
                <p className="text-red-600 text-sm">
                  {errorMessage}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setProcessingStatus('idle');
                    setErrorMessage(null);
                    setUploadProgress(0);
                  }}
                >
                  Riprova
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Formati Supportati */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {supportedFormats.map((format, index) => (
          <div key={index} className="text-center p-2 bg-gray-50 rounded-lg">
            <format.icon className="w-5 h-5 mx-auto mb-1 text-gray-600" />
            <div className="text-xs font-medium text-gray-900">{format.type}</div>
            <div className="text-xs text-gray-500">{format.desc}</div>
          </div>
        ))}
      </div>

      {/* Risultati Analisi AI */}
      {extractedData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Brain className="w-4 h-4 text-blue-600" />
              <span>Dati Estratti dall'AI</span>
              {extractedData.confidence && (
                <Badge variant="outline" className={getConfidenceColor(extractedData.confidence)}>
                  Confidenza: {getConfidenceBadge(extractedData.confidence)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {extractedData.movementType && (
                <div>
                  <span className="font-medium">Tipo:</span>{' '}
                  <Badge variant={extractedData.movementType === 'income' ? 'default' : 'destructive'}>
                    {extractedData.movementType === 'income' ? 'Entrata' : 'Uscita'}
                  </Badge>
                </div>
              )}
              {extractedData.amount && (
                <div>
                  <span className="font-medium">Importo:</span> €{extractedData.amount}
                </div>
              )}
              {extractedData.date && (
                <div>
                  <span className="font-medium">Data:</span> {extractedData.date}
                </div>
              )}
              {extractedData.documentNumber && (
                <div>
                  <span className="font-medium">N° Documento:</span> {extractedData.documentNumber}
                </div>
              )}
            </div>

            {extractedData.supplierInfo && (
              <div className="mt-3 p-2 bg-orange-50 rounded-lg">
                <div className="text-sm font-medium text-orange-800 mb-1">Fornitore Rilevato:</div>
                <div className="text-sm text-orange-700">
                  {extractedData.supplierInfo.name}
                  {extractedData.supplierInfo.vatNumber && (
                    <span className="ml-2">P.IVA: {extractedData.supplierInfo.vatNumber}</span>
                  )}
                </div>
              </div>
            )}

            {extractedData.customerInfo && (
              <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-1">Cliente Rilevato:</div>
                <div className="text-sm text-blue-700">
                  {extractedData.customerInfo.name}
                  {extractedData.customerInfo.vatNumber && (
                    <span className="ml-2">P.IVA: {extractedData.customerInfo.vatNumber}</span>
                  )}
                </div>
              </div>
            )}

            {extractedData.processingNotes && extractedData.processingNotes.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Note AI:</strong> {extractedData.processingNotes.join(', ')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}