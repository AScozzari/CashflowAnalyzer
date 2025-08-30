import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function VatCodesDebug() {
  const { data: vatCodes, isLoading, error } = useQuery({
    queryKey: ['/api/invoicing/vat-codes'],
    retry: 1,
  });

  console.log('🔍 VAT CODES DEBUG:', { vatCodes, isLoading, error });

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔍 Debug Codici IVA</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="text-center py-4">
            <p>Caricamento codici IVA...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold">Errore nel caricamento:</h3>
            <p className="text-red-600">{error?.toString()}</p>
          </div>
        )}

        {vatCodes && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Codici IVA caricati</h3>
              <Badge variant="secondary">{vatCodes.length} codici</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vatCodes.map((vat: any) => (
                <div key={vat.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{vat.percentage}%</Badge>
                    <Badge variant={vat.isActive ? "default" : "secondary"}>
                      {vat.isActive ? "Attivo" : "Inattivo"}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm mb-1">Codice: {vat.code}</h4>
                  <p className="text-xs text-gray-600">{vat.description}</p>
                  {vat.natura && (
                    <p className="text-xs text-blue-600 mt-1">Natura: {vat.natura}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">ID: {vat.id}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && !error && !vatCodes && (
          <div className="text-center py-4">
            <p className="text-gray-500">Nessun codice IVA trovato</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}