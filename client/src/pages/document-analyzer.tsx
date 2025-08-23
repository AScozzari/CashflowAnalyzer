import { useState, useRef, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, FileText, Image, FileCheck, Brain, Zap, 
  CheckCircle2, AlertTriangle, TrendingUp, Calendar,
  Euro, Users, MapPin, Phone, Mail, Hash, 
  FileImage, FileType, FileSpreadsheet, Eye,
  Plus, ArrowRight, AlertCircle, Shield, Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/header";
import { FooterSignature } from "@/components/layout/footer-signature";

interface DocumentAnalysis {
  id: string;
  fileName: string;
  fileType: string;
  summary: string;
  keyPoints: string[];
  documentType: string;
  extractedData: {
    amounts?: string[];
    dates?: string[];
    parties?: string[];
    references?: string[];
    vatNumbers?: string[];
    addresses?: string[];
    contacts?: string[];
  };
  suggestedMovement?: {
    type: 'income' | 'expense';
    amount: number;
    description: string;
    date: string;
    confidence: number;
    category: string;
    supplier?: string;
    customer?: string;
    vatAmount?: number;
    netAmount?: number;
  };
  confidence: number;
  recommendations: string[];
  compliance: {
    isCompliant: boolean;
    issues: string[];
    requirements: string[];
  };
  tokensUsed: number;
  processingTime: number;
  createdAt: string;
}

export default function DocumentAnalyzerPage() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysis | null>(null);
  const [viewingAnalysis, setViewingAnalysis] = useState<DocumentAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Formati supportati con icone e descrizioni
  const supportedFormats = [
    { 
      extensions: ['.pdf'], 
      type: 'PDF', 
      description: 'Fatture, contratti, DDT',
      icon: FileText,
      color: 'text-red-600 bg-red-100'
    },
    { 
      extensions: ['.jpg', '.jpeg', '.png', '.webp'], 
      type: 'Immagini', 
      description: 'Documenti scansionati',
      icon: FileImage,
      color: 'text-blue-600 bg-blue-100'
    },
    { 
      extensions: ['.xml'], 
      type: 'XML', 
      description: 'FatturaPA elettroniche',
      icon: FileType,
      color: 'text-green-600 bg-green-100'
    },
    { 
      extensions: ['.doc', '.docx', '.xls', '.xlsx'], 
      type: 'Office', 
      description: 'Word, Excel, contratti',
      icon: FileSpreadsheet,
      color: 'text-purple-600 bg-purple-100'
    },
    { 
      extensions: ['.txt'], 
      type: 'Testo', 
      description: 'Documenti di testo',
      icon: FileText,
      color: 'text-gray-600 bg-gray-100'
    }
  ];

  // Fetch cronologia analisi
  const { data: analysisHistory = [], refetch: refetchHistory } = useQuery<DocumentAnalysis[]>({
    queryKey: ['/api/document-analysis/history'],
    retry: false,
  });

  // Analisi documento mutation
  const analyzeDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('analysisType', 'professional');
      
      const response = await fetch('/api/document-analysis/analyze', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore nell\'analisi del documento');
      }

      return response.json();
    },
    onSuccess: (result: DocumentAnalysis) => {
      setAnalysisResult(result);
      // FORZA REFRESH statistiche
      setTimeout(() => {
        refetchHistory();
      }, 100);
      toast({
        title: "✅ Analisi Completata",
        description: `Documento ${result.fileName} analizzato con successo`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore Analisi",
        description: error.message || "Errore durante l'analisi del documento",
        variant: "destructive",
      });
    },
  });

  // Crea movimento finanziario mutation
  const createMovementMutation = useMutation({
    mutationFn: async (movementData: any) => {
      const response = await apiRequest('POST', '/api/movements', movementData);
      if (!response.ok) {
        throw new Error('Errore nella creazione del movimento');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Movimento Creato",
        description: "Il movimento finanziario è stato aggiunto con successo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/movements'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore Creazione",
        description: error.message || "Errore nella creazione del movimento",
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = useCallback((file: File) => {
    // Validazione dimensione (15MB max per immagini e PDF)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "❌ File Troppo Grande",
        description: `Il file non può superare 15MB`,
        variant: "destructive",
      });
      return;
    }

    // Validazione formato
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isSupported = supportedFormats.some(format => 
      format.extensions.includes(fileExtension)
    );

    if (!isSupported) {
      toast({
        title: "❌ Formato Non Supportato",
        description: "Carica PDF, immagini, XML, Word, Excel o file di testo",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setAnalysisResult(null);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const startAnalysis = () => {
    if (selectedFile) {
      analyzeDocumentMutation.mutate(selectedFile);
    }
  };

  const createMovementFromSuggestion = (suggestion: DocumentAnalysis['suggestedMovement']) => {
    if (!suggestion) return;

    const movementData = {
      type: suggestion.type,
      amount: suggestion.amount,
      description: suggestion.description,
      date: suggestion.date,
      category: suggestion.category,
      ...(suggestion.supplier && { supplier: suggestion.supplier }),
      ...(suggestion.customer && { customer: suggestion.customer }),
      ...(suggestion.vatAmount && { vatAmount: suggestion.vatAmount }),
      ...(suggestion.netAmount && { netAmount: suggestion.netAmount }),
      source: 'document_analysis'
    };

    createMovementMutation.mutate(movementData);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-100';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'Alta';
    if (confidence >= 0.7) return 'Media';
    return 'Bassa';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header professionale */}
      <Header 
        title="AI Analisi Documenti" 
        subtitle="Analisi intelligente e OCR avanzato per tutti i tuoi documenti aziendali"
      />

      {/* Statistiche rapide */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Documenti Analizzati</p>
                <p className="text-2xl font-bold text-blue-700">{analysisHistory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Movimenti Suggeriti</p>
                <p className="text-2xl font-bold text-green-700">
                  {analysisHistory.filter(a => a.suggestedMovement).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900">Precisione Media</p>
                <p className="text-2xl font-bold text-purple-700">
                  {analysisHistory.length > 0 
                    ? Math.round(analysisHistory.reduce((acc, a) => acc + a.confidence, 0) / analysisHistory.length * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Shield className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-900">Conformità</p>
                <p className="text-2xl font-bold text-orange-700">
                  {analysisHistory.length > 0 
                    ? Math.round(analysisHistory.filter(a => a.compliance.isCompliant).length / analysisHistory.length * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Area di upload professionale */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
        <CardContent className="p-8">
          <div
            className={cn(
              "text-center space-y-6 transition-all duration-300",
              isDragOver && "transform scale-105"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">
                Carica il Tuo Documento
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Trascina qui il documento da analizzare oppure clicca per selezionarne uno. 
                L'AI analizzerà il contenuto e ti fornirà insights dettagliati.
              </p>
            </div>

            {!selectedFile ? (
              <div className="space-y-4">
                <Button 
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Seleziona Documento
                </Button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.xml,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />

                <p className="text-sm text-gray-500">
                  Dimensione massima: 15MB • Formati supportati: PDF, Immagini, XML, Office, Testo
                </p>
              </div>
            ) : (
              <div className="max-w-md mx-auto p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <FileCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Sconosciuto'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <Button 
                    onClick={startAnalysis}
                    disabled={analyzeDocumentMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    {analyzeDocumentMutation.isPending ? (
                      <>
                        <Brain className="w-4 h-4 mr-2 animate-pulse" />
                        Analizzando...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Avvia Analisi AI
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedFile(null)}
                    disabled={analyzeDocumentMutation.isPending}
                  >
                    Cambia
                  </Button>
                </div>

                {analyzeDocumentMutation.isPending && (
                  <div className="mt-4">
                    <Progress value={75} className="h-2" />
                    <p className="text-sm text-center mt-2 text-gray-600">
                      L'AI sta analizzando il documento...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Formati supportati */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {supportedFormats.map((format, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className={cn("w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center", format.color)}>
                <format.icon className="w-6 h-6" />
              </div>
              <h4 className="font-medium text-sm text-gray-900 mb-1">{format.type}</h4>
              <p className="text-xs text-gray-500">{format.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risultati analisi */}
      {analysisResult && (
        <div className="space-y-6">
          <Card className="border-green-200 bg-green-50/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-green-800">Analisi Completata</CardTitle>
                    <p className="text-sm text-green-600">
                      {analysisResult.documentType} • Confidenza: {Math.round(analysisResult.confidence * 100)}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={cn("text-xs", getConfidenceColor(analysisResult.confidence))}>
                    {getConfidenceLabel(analysisResult.confidence)}
                  </Badge>
                  <div className="text-xs text-gray-500 text-right">
                    <div>{analysisResult.tokensUsed} token</div>
                    <div>{analysisResult.processingTime}ms</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Riassunto */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Riassunto del Documento
                </h4>
                <p className="text-gray-700 bg-white p-4 rounded-lg border">
                  {analysisResult.summary}
                </p>
              </div>

              {/* Punti chiave */}
              {analysisResult.keyPoints.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Punti Chiave
                  </h4>
                  <div className="space-y-2">
                    {analysisResult.keyPoints.map((point, index) => (
                      <div key={index} className="flex items-start space-x-3 bg-white p-3 rounded-lg border">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dati estratti */}
              {Object.keys(analysisResult.extractedData).length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Hash className="w-4 h-4 mr-2" />
                    Dati Estratti
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analysisResult.extractedData.amounts && analysisResult.extractedData.amounts.length > 0 && (
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center space-x-2 mb-2">
                          <Euro className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-sm">Importi</span>
                        </div>
                        <div className="space-y-1">
                          {analysisResult.extractedData.amounts.map((amount, i) => (
                            <div key={i} className="text-sm text-gray-700">{amount}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResult.extractedData.dates && analysisResult.extractedData.dates.length > 0 && (
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-sm">Date</span>
                        </div>
                        <div className="space-y-1">
                          {analysisResult.extractedData.dates.map((date, i) => (
                            <div key={i} className="text-sm text-gray-700">{date}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResult.extractedData.parties && analysisResult.extractedData.parties.length > 0 && (
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="w-4 h-4 text-purple-600" />
                          <span className="font-medium text-sm">Soggetti</span>
                        </div>
                        <div className="space-y-1">
                          {analysisResult.extractedData.parties.map((party, i) => (
                            <div key={i} className="text-sm text-gray-700">{party}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResult.extractedData.references && analysisResult.extractedData.references.length > 0 && (
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center space-x-2 mb-2">
                          <Hash className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-sm">Riferimenti</span>
                        </div>
                        <div className="space-y-1">
                          {analysisResult.extractedData.references.map((ref, i) => (
                            <div key={i} className="text-sm text-gray-700">{ref}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Movimento suggerito */}
              {analysisResult.suggestedMovement && (
                <Alert className="border-orange-200 bg-orange-50">
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <strong className="text-orange-800">Movimento Finanziario Rilevato</strong>
                        <Badge className={cn(
                          "text-xs",
                          getConfidenceColor(analysisResult.suggestedMovement.confidence)
                        )}>
                          {getConfidenceLabel(analysisResult.suggestedMovement.confidence)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Tipo:</span>{' '}
                          <Badge variant={analysisResult.suggestedMovement.type === 'income' ? 'default' : 'destructive'}>
                            {analysisResult.suggestedMovement.type === 'income' ? 'Entrata' : 'Uscita'}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Importo:</span> €{analysisResult.suggestedMovement.amount}
                        </div>
                        <div>
                          <span className="font-medium">Data:</span> {analysisResult.suggestedMovement.date}
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <span className="font-medium">Descrizione:</span> {analysisResult.suggestedMovement.description}
                      </div>
                      
                      <Button 
                        onClick={() => createMovementFromSuggestion(analysisResult.suggestedMovement)}
                        disabled={createMovementMutation.isPending}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Crea Movimento Automaticamente
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Conformità */}
              {!analysisResult.compliance.isCompliant && analysisResult.compliance.issues.length > 0 && (
                <Alert className="border-red-200 bg-red-50" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <strong>Problemi di Conformità Rilevati:</strong>
                      <ul className="list-disc list-inside space-y-1">
                        {analysisResult.compliance.issues.map((issue, i) => (
                          <li key={i} className="text-sm">{issue}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Raccomandazioni */}
              {analysisResult.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Raccomandazioni
                  </h4>
                  <div className="space-y-2">
                    {analysisResult.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-blue-800 text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cronologia analisi */}
      {analysisHistory.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Cronologia Analisi</span>
              </CardTitle>
              <Badge variant="secondary">{analysisHistory.length} documenti</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisHistory.slice(0, 10).map((analysis) => (
                <div key={analysis.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{analysis.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {analysis.documentType} • {new Date(analysis.createdAt).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className={cn("text-xs", getConfidenceColor(analysis.confidence))}>
                      {getConfidenceLabel(analysis.confidence)}
                    </Badge>
                    
                    {analysis.suggestedMovement && (
                      <Badge variant="outline" className="text-xs text-green-700 bg-green-50">
                        Movimento
                      </Badge>
                    )}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Analisi - {analysis.fileName}</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh] pr-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Riassunto:</h4>
                              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{analysis.summary}</p>
                            </div>
                            
                            {analysis.keyPoints.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2">Punti Chiave:</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                  {analysis.keyPoints.map((point, i) => (
                                    <li key={i}>{point}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {analysis.suggestedMovement && (
                              <div className="p-3 bg-orange-50 rounded">
                                <h4 className="font-semibold mb-2 text-orange-800">Movimento Suggerito:</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div><strong>Tipo:</strong> {analysis.suggestedMovement.type === 'income' ? 'Entrata' : 'Uscita'}</div>
                                  <div><strong>Importo:</strong> €{analysis.suggestedMovement.amount}</div>
                                  <div><strong>Data:</strong> {analysis.suggestedMovement.date}</div>
                                  <div><strong>Categoria:</strong> {analysis.suggestedMovement.category}</div>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500 pt-2 border-t">
                              <span>Confidenza: {(analysis.confidence * 100).toFixed(1)}%</span>
                              <span>Token: {analysis.tokensUsed}</span>
                              <span>Tempo: {analysis.processingTime}ms</span>
                            </div>
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <FooterSignature />
    </div>
  );
}