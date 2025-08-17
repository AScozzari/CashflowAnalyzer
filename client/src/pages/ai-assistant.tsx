import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, FileText, BarChart3, Search, Sparkles } from "lucide-react";
import { DocumentAnalyzer } from "@/components/ai/document-analyzer";
import { FinancialInsightsWidget } from "@/components/ai/financial-insights-widget";
import { NaturalLanguageQuery } from "@/components/ai/natural-language-query";
import { AIGraphGenerator } from "@/components/ai/ai-graph-generator";

export function AIAssistantPage() {
  const [extractedData, setExtractedData] = useState<any>(null);
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [generatedChart, setGeneratedChart] = useState<any>(null);

  const handleDataExtracted = (data: any) => {
    setExtractedData(data);
    console.log('Data extracted from document:', data);
  };

  const handleQueryResults = (results: any[]) => {
    setQueryResults(results);
    console.log('Query results:', results);
  };

  const handleChartGenerated = (chart: any) => {
    setGeneratedChart(chart);
    console.log('Chart generated:', chart);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI Assistant
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Analisi intelligente, insights automatici e query in linguaggio naturale
              </p>
            </div>
            <div className="ml-auto">
              <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-blue-600">
                <Sparkles className="w-4 h-4 mr-1" />
                Powered by OpenAI GPT-4o
              </Badge>
            </div>
          </div>
        </div>

        {/* AI Tools Tabs */}
        <Tabs defaultValue="insights" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="insights" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>Financial Insights</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Document Analyzer</span>
            </TabsTrigger>
            <TabsTrigger value="query" className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Natural Query</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Chart Generator</span>
            </TabsTrigger>
          </TabsList>

          {/* Financial Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span>AI Financial Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FinancialInsightsWidget 
                  showFullInterface={true}
                  autoRefresh={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Document Analysis Tab */}
          <TabsContent value="documents" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span>Document Analyzer</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DocumentAnalyzer
                    onDataExtracted={handleDataExtracted}
                    maxFileSize={10485760}
                    acceptedTypes={['.pdf', '.xml', '.txt', '.json']}
                  />
                </CardContent>
              </Card>

              {/* Extracted Data Display */}
              {extractedData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dati Estratti</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(extractedData, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Natural Language Query Tab */}
          <TabsContent value="query" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="w-5 h-5 text-green-600" />
                    <span>Natural Language Query</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NaturalLanguageQuery
                    onResultsFound={handleQueryResults}
                    maxResults={50}
                    enableExport={true}
                  />
                </CardContent>
              </Card>

              {/* Query Results Preview */}
              {queryResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ultimi Risultati</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {queryResults.length} risultati trovati
                      </p>
                      <div className="max-h-64 overflow-y-auto">
                        {queryResults.slice(0, 5).map((result, idx) => (
                          <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                            {JSON.stringify(result).substring(0, 100)}...
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Chart Generator Tab */}
          <TabsContent value="charts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                    <span>AI Chart Generator</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AIGraphGenerator
                    onChartGenerated={handleChartGenerated}
                    dataSource="all"
                  />
                </CardContent>
              </Card>

              {/* Generated Chart Preview */}
              {generatedChart && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ultimo Grafico</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold">{generatedChart.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {generatedChart.description}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm">
                          Tipo: {generatedChart.type} • 
                          {generatedChart.data.length} punti dati • 
                          Confidenza: {(generatedChart.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* AI Status Footer */}
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">AI System Status: Attivo</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Modello: GPT-4o • Ultima sincronizzazione: {new Date().toLocaleTimeString('it-IT')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}