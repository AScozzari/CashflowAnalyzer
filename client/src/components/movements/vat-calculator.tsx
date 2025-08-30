import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, Euro, Info } from 'lucide-react';
import { useVatManagement } from '@/hooks/useVatCalculation';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VatCalculatorProps {
  // Controlled values
  amount?: number;
  vatCodeId?: string;
  vatAmount?: number;
  netAmount?: number;
  totalAmount?: number;
  
  // Callbacks
  onVatCalculated?: (calculation: {
    imponibile: number;
    imposta: number;
    totale: number;
    vatCodeId: string;
  }) => void;
  
  // Configuration
  calculationType?: 'from_imponibile' | 'from_totale';
  showOnlyStandardVat?: boolean;
  disabled?: boolean;
  title?: string;
}

export function VatCalculator({
  amount: controlledAmount,
  vatCodeId: controlledVatCodeId,
  vatAmount: controlledVatAmount,
  netAmount: controlledNetAmount,
  totalAmount: controlledTotalAmount,
  onVatCalculated,
  calculationType = 'from_imponibile',
  showOnlyStandardVat = false,
  disabled = false,
  title = "Calcolo IVA"
}: VatCalculatorProps) {
  
  const {
    vatCodes,
    isLoadingVatCodes,
    calculateFromImponibile,
    calculateFromTotale,
    lastCalculation,
    isCalculating,
    getVatCodeById,
    getVatCodesByType,
    getVatDescription
  } = useVatManagement();

  // Internal state for uncontrolled usage
  const [localAmount, setLocalAmount] = useState<string>('');
  const [localVatCodeId, setLocalVatCodeId] = useState<string>('');

  // Use controlled values if provided, otherwise use local state
  const currentAmount = controlledAmount !== undefined ? controlledAmount.toString() : localAmount;
  const currentVatCodeId = controlledVatCodeId || localVatCodeId;

  const availableVatCodes = showOnlyStandardVat 
    ? getVatCodesByType('standard')
    : getVatCodesByType();

  const selectedVatCode = getVatCodeById(currentVatCodeId);

  const handleAmountChange = (value: string) => {
    if (controlledAmount === undefined) {
      setLocalAmount(value);
    }
  };

  const handleVatCodeChange = (value: string) => {
    if (controlledVatCodeId === undefined) {
      setLocalVatCodeId(value);
    }
  };

  const handleCalculate = () => {
    const numAmount = parseFloat(currentAmount);
    
    if (!numAmount || numAmount <= 0 || !currentVatCodeId) {
      return;
    }

    if (calculationType === 'from_imponibile') {
      calculateFromImponibile(numAmount, currentVatCodeId);
    } else {
      calculateFromTotale(numAmount, currentVatCodeId);
    }
  };

  // Auto-calculate when values change
  useEffect(() => {
    if (currentAmount && currentVatCodeId && parseFloat(currentAmount) > 0) {
      handleCalculate();
    }
  }, [currentAmount, currentVatCodeId, calculationType]);

  // Notify parent of calculation results
  useEffect(() => {
    if (lastCalculation && onVatCalculated) {
      onVatCalculated({
        imponibile: lastCalculation.imponibile,
        imposta: lastCalculation.imposta,
        totale: lastCalculation.totale,
        vatCodeId: currentVatCodeId
      });
    }
  }, [lastCalculation, currentVatCodeId, onVatCalculated]);

  return (
    <Card className="w-full" data-testid="vat-calculator">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {calculationType === 'from_imponibile' 
            ? "Inserisci l'importo senza IVA per calcolare l'imposta"
            : "Inserisci l'importo totale per scorporare l'IVA"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Input Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">
            {calculationType === 'from_imponibile' ? 'Importo Imponibile' : 'Importo Totale'}
          </Label>
          <div className="relative">
            <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={currentAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="pl-10"
              disabled={disabled}
              data-testid="input-amount"
            />
          </div>
        </div>

        {/* VAT Code Selection */}
        <div className="space-y-2">
          <Label htmlFor="vat-code">Codice IVA</Label>
          <Select 
            value={currentVatCodeId} 
            onValueChange={handleVatCodeChange}
            disabled={disabled || isLoadingVatCodes}
          >
            <SelectTrigger data-testid="select-vat-code">
              <SelectValue placeholder="Seleziona codice IVA" />
            </SelectTrigger>
            <SelectContent>
              {availableVatCodes.map((vatCode) => (
                <SelectItem key={vatCode.id} value={vatCode.id}>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{vatCode.code}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {getVatDescription(vatCode)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedVatCode && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="w-4 h-4" />
              <span>{selectedVatCode.description}</span>
              {selectedVatCode.natura && (
                <Badge variant="outline" className="text-xs">
                  {selectedVatCode.natura}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Calculate Button */}
        <Button 
          onClick={handleCalculate}
          disabled={disabled || isCalculating || !currentAmount || !currentVatCodeId}
          className="w-full"
          data-testid="button-calculate"
        >
          {isCalculating ? 'Calcolando...' : 'Calcola IVA'}
        </Button>

        {/* Results */}
        {(lastCalculation || (controlledNetAmount !== undefined && controlledVatAmount !== undefined)) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium">Risultato Calcolo</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    Imponibile
                  </div>
                  <div className="text-lg font-semibold" data-testid="result-imponibile">
                    €{(lastCalculation?.imponibile || controlledNetAmount || 0).toFixed(2)}
                  </div>
                </div>
                
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    IVA
                  </div>
                  <div className="text-lg font-semibold text-orange-600" data-testid="result-imposta">
                    €{(lastCalculation?.imposta || controlledVatAmount || 0).toFixed(2)}
                  </div>
                </div>
                
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    Totale
                  </div>
                  <div className="text-lg font-semibold text-green-600" data-testid="result-totale">
                    €{(lastCalculation?.totale || controlledTotalAmount || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {selectedVatCode && selectedVatCode.percentage > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  Aliquota applicata: {selectedVatCode.percentage}%
                </div>
              )}
            </div>
          </>
        )}

        {/* Special VAT info */}
        {selectedVatCode?.natura && (
          <Alert data-testid="vat-info-alert">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {selectedVatCode.natura.startsWith('N6') && (
                "Operazione con inversione contabile (Reverse Charge) - L'IVA è a carico del cessionario"
              )}
              {selectedVatCode.natura.startsWith('N1') && (
                "Operazione esclusa da IVA secondo l'art. 15 del DPR 633/72"
              )}
              {selectedVatCode.natura.startsWith('N2') && (
                "Operazione non soggetta a IVA"
              )}
              {selectedVatCode.natura.startsWith('N3') && (
                "Operazione non imponibile"
              )}
              {selectedVatCode.natura === 'N4' && (
                "Operazione esente da IVA secondo l'art. 10 del DPR 633/72"
              )}
              {selectedVatCode.natura === 'N5' && (
                "Regime del margine - IVA non esposta in fattura"
              )}
              {selectedVatCode.natura === 'N7' && (
                "IVA assolta in altro stato dell'Unione Europea"
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}