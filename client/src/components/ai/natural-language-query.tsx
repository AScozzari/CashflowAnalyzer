import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Loader2, Database, Download, Eye, Calendar, Euro, Building, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface QueryResult {
  id: string;
  query: string;
  sqlQuery: string;
  results: any[];
  executionTime: number;
  resultCount: number;
  confidence: number;
  suggestions: string[];
  createdAt: string;
}

interface NaturalLanguageQueryProps {
  onResultsFound?: (results: any[]) => void;
  maxResults?: number;
  enableExport?: boolean;
}

const EXAMPLE_QUERIES = [
  "Mostra tutti i movimenti di gennaio 2025",
  "Trova i fornitori con spese superiori a 5000 euro",
  "Elenca le entrate degli ultimi 30 giorni",
  "Quali sono le aziende con più transazioni?",
  "Mostra i movimenti non verificati",
  "Trova tutti i pagamenti in scadenza questa settimana",
  "Quali sono i core business più redditizi?",
  "Mostra le fatture con IVA al 22%"
];

export function NaturalLanguageQuery({ 
  onResultsFound, 
  maxResults = 100,
  enableExport = true
}: NaturalLanguageQueryProps) {
  const [query, setQuery] = useState("");
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<QueryResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Execute query mutation
  const executeQueryMutation = useMutation({
    mutationFn: async (naturalQuery: string) => {
      const response = await apiRequest('POST', '/api/ai/natural-query', {
        query: naturalQuery,
        maxResults,
        includeMetadata: true
      });
      return response;
    },
    onSuccess: (result: QueryResult) => {
      toast({
        title: "✅ Query Eseguita",
        description: `Trovati ${result.resultCount} risultati in ${result.executionTime}ms`,
      });
      
      setQueryHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 queries
      setQuery("");
      
      if (onResultsFound && result.results) {
        onResultsFound(result.results);
      }
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore Query",
        description: error.message || "Errore nell'esecuzione della query",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      executeQueryMutation.mutate(query.trim());
    }
  };

  const executeExampleQuery = (exampleQuery: string) => {
    setQuery(exampleQuery);
    executeQueryMutation.mutate(exampleQuery);
  };

  const exportResults = (result: QueryResult) => {
    if (result.results.length === 0) return;
    
    const csv = convertToCSV(result.results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "📄 Export Completato",
      description: "I risultati sono stati esportati in CSV",
    });
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  const getQueryTypeIcon = (query: string) => {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('movimento') || lowerQuery.includes('transazione')) {
      return <Euro className="w-4 h-4 text-green-500" />;
    }
    if (lowerQuery.includes('azienda') || lowerQuery.includes('cliente') || lowerQuery.includes('fornitore')) {
      return <Building className="w-4 h-4 text-blue-500" />;
    }
    if (lowerQuery.includes('utente') || lowerQuery.includes('risorsa')) {
      return <User className="w-4 h-4 text-purple-500" />;
    }
    if (lowerQuery.includes('data') || lowerQuery.includes('periodo')) {
      return <Calendar className="w-4 h-4 text-orange-500" />;
    }
    return <Database className="w-4 h-4 text-gray-500" />;
  };

  const renderResultsTable = (results: any[]) => {
    if (results.length === 0) return <p className="text-center py-4 text-muted-foreground">Nessun risultato</p>;
    
    const columns = Object.keys(results[0]);
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => (
              <TableHead key={col}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.slice(0, 20).map((row, idx) => (
            <TableRow key={idx}>
              {columns.map(col => (
                <TableCell key={col}>
                  {typeof row[col] === 'object' ? JSON.stringify(row[col]) : row[col]?.toString()}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      {/* Query Input */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-blue-600" />
            <CardTitle>Query in Linguaggio Naturale</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Scrivi la tua domanda in linguaggio naturale... es: 'Mostra le entrate di gennaio'"
              className="flex-1"
              disabled={executeQueryMutation.isPending}
            />
            <Button 
              type="submit" 
              disabled={executeQueryMutation.isPending || !query.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {executeQueryMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </form>

          {/* Example Queries */}
          <div>
            <p className="text-sm font-medium mb-3">Query di Esempio:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.map((example, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => executeExampleQuery(example)}
                  disabled={executeQueryMutation.isPending}
                  className="text-xs"
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>

          {/* AI Processing Info */}
          {executeQueryMutation.isPending && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  L'AI sta convertendo la tua domanda in query SQL...
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Query History & Results */}
      {queryHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cronologia Query</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {queryHistory.map((result) => (
                <div key={result.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      {getQueryTypeIcon(result.query)}
                      <div className="flex-1">
                        <p className="font-medium">{result.query}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                          <span>{result.resultCount} risultati</span>
                          <span>{result.executionTime}ms</span>
                          <span>Confidenza: {(result.confidence * 100).toFixed(1)}%</span>
                          <span>{new Date(result.createdAt).toLocaleDateString('it-IT')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={result.confidence > 0.8 ? "default" : "secondary"}>
                        {result.confidence > 0.8 ? "Alta Confidenza" : "Media Confidenza"}
                      </Badge>
                      {enableExport && result.results.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => exportResults(result)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Risultati Query: {result.query}</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[60vh]">
                            <div className="space-y-4">
                              {/* SQL Query */}
                              <div>
                                <h5 className="font-medium mb-2">Query SQL Generata:</h5>
                                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                                  {result.sqlQuery}
                                </pre>
                              </div>
                              
                              <Separator />
                              
                              {/* Results */}
                              <div>
                                <h5 className="font-medium mb-2">
                                  Risultati ({result.resultCount}):
                                </h5>
                                <div className="border rounded">
                                  {renderResultsTable(result.results)}
                                </div>
                              </div>
                              
                              {/* Suggestions */}
                              {result.suggestions.length > 0 && (
                                <>
                                  <Separator />
                                  <div>
                                    <h5 className="font-medium mb-2">Suggerimenti per migliorare:</h5>
                                    <ul className="text-sm space-y-1 text-muted-foreground">
                                      {result.suggestions.map((suggestion, idx) => (
                                        <li key={idx}>• {suggestion}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </>
                              )}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  {/* Quick Results Preview */}
                  {result.results.length > 0 && (
                    <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                      <p className="font-medium mb-1">Anteprima risultati:</p>
                      <p className="text-muted-foreground">
                        {result.results.slice(0, 3).map((row, idx) => 
                          Object.values(row).slice(0, 2).join(' - ')
                        ).join(' | ')}
                        {result.results.length > 3 && '...'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}