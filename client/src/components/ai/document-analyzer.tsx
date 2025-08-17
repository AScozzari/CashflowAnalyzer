import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AnalysisResult {
  id: string;
  filename: string;
  fileType: string;
  status: 'processing' | 'completed' | 'error';
  analysis: string;
  extractedData: any;
  tokensUsed: number;
  processingTime: number;
  createdAt: string;
  confidence: number;
}

interface DocumentAnalyzerProps {
  onDataExtracted?: (data: any) => void;
  maxFileSize?: number;
  acceptedTypes?: string[];
}

export function DocumentAnalyzer({ 
  onDataExtracted, 
  maxFileSize = 10485760, // 10MB
  acceptedTypes = ['.pdf', '.xml', '.txt', '.json']
}: DocumentAnalyzerProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewingResult, setViewingResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch analysis history
  const { data: analysisHistory = [], refetch: refetchHistory } = useQuery<AnalysisResult[]>({
    queryKey: ['/api/ai/document-analysis/history'],
    retry: false,
  });

  // Upload and analyze mutation
  const analyzeDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('analysisType', 'financial');
      
      const response = await fetch('/api/ai/document-analysis', {
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
    onSuccess: (result: AnalysisResult) => {
      toast({
        title: "✅ Documento Analizzato",
        description: `Analisi completata per ${result.filename}`,
      });
      refetchHistory();
      setSelectedFile(null);
      setUploadProgress(0);
      
      if (onDataExtracted && result.extractedData) {
        onDataExtracted(result.extractedData);
      }
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore Analisi",
        description: error.message || "Errore durante l'analisi del documento",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleFileSelect = (file: File) => {
    if (file.size > maxFileSize) {
      toast({
        title: "❌ File Troppo Grande",
        description: `Il file non può superare ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`,
        variant: "destructive",
      });
      return;
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      toast({
        title: "❌ Tipo File Non Supportato",
        description: `Tipi supportati: ${acceptedTypes.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setUploadProgress(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const startAnalysis = () => {
    if (selectedFile) {
      analyzeDocumentMutation.mutate(selectedFile);
    }
  };

  const getStatusBadge = (status: AnalysisResult['status']) => {
    switch (status) {
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Elaborazione</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completato</Badge>;
      case 'error':
        return <Badge variant="destructive">Errore</Badge>;
      default:
        return <Badge variant="outline">Sconosciuto</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <CardTitle>Analisi Documenti AI</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trascina qui il documento da analizzare
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Oppure clicca per selezionare un file
            </p>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              Seleziona File
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept={acceptedTypes.join(',')}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
            <div className="mt-4 text-xs text-gray-400">
              <p>Formati supportati: {acceptedTypes.join(', ')}</p>
              <p>Dimensione massima: {(maxFileSize / 1024 / 1024).toFixed(1)}MB</p>
            </div>
          </div>

          {/* Selected File */}
          {selectedFile && (
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Sconosciuto'}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={startAnalysis}
                  disabled={analyzeDocumentMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {analyzeDocumentMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analizzando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Avvia Analisi AI
                    </>
                  )}
                </Button>
              </div>
              
              {analyzeDocumentMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Analisi in corso...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis History */}
      {analysisHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cronologia Analisi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisHistory.slice(0, 10).map((result) => (
                <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-sm">{result.filename}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(result.createdAt).toLocaleDateString('it-IT')} • 
                        {result.tokensUsed} token • 
                        {result.processingTime}s
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(result.status)}
                    {result.status === 'completed' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Risultati Analisi - {result.filename}</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[60vh] pr-4">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">Analisi AI:</h4>
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm whitespace-pre-wrap">
                                  {result.analysis}
                                </div>
                              </div>
                              
                              {result.extractedData && (
                                <div>
                                  <h4 className="font-semibold mb-2">Dati Estratti:</h4>
                                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                    <pre className="text-xs overflow-x-auto">
                                      {JSON.stringify(result.extractedData, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>Confidenza: {(result.confidence * 100).toFixed(1)}%</span>
                                <span>Token utilizzati: {result.tokensUsed}</span>
                                <span>Tempo: {result.processingTime}s</span>
                              </div>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}