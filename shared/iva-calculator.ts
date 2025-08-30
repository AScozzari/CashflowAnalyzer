// ===== CALCOLATORE IVA ITALIANO =====
// Sistema uniforme per il calcolo IVA in tutta l'applicazione

export interface IvaCalculation {
  imponibile: number;      // Importo senza IVA
  imposta: number;         // Importo IVA
  totale: number;          // Totale compreso IVA
  percentuale: number;     // Percentuale IVA applicata
  natura?: string;         // Codice natura (N1, N2.1, etc.)
  description: string;     // Descrizione del codice IVA
}

export interface VatCode {
  id: string;
  code: string;
  percentage: number;
  description: string;
  natura?: string;
  isActive: boolean;
}

// ===== FUNZIONI DI CALCOLO IVA =====

/**
 * Calcola IVA partendo dall'imponibile
 */
export function calcolaIvaFromImponibile(
  imponibile: number, 
  vatCode: VatCode
): IvaCalculation {
  const percentuale = vatCode.percentage;
  const imposta = Math.round((imponibile * percentuale) / 100 * 100) / 100;
  const totale = Math.round((imponibile + imposta) * 100) / 100;

  return {
    imponibile: Math.round(imponibile * 100) / 100,
    imposta,
    totale,
    percentuale,
    natura: vatCode.natura,
    description: vatCode.description
  };
}

/**
 * Calcola IVA partendo dal totale (scorporo IVA)
 */
export function calcolaIvaFromTotale(
  totale: number, 
  vatCode: VatCode
): IvaCalculation {
  const percentuale = vatCode.percentage;
  
  if (percentuale === 0) {
    // Per operazioni a 0% (esenti, escluse, etc.)
    return {
      imponibile: Math.round(totale * 100) / 100,
      imposta: 0,
      totale: Math.round(totale * 100) / 100,
      percentuale: 0,
      natura: vatCode.natura,
      description: vatCode.description
    };
  }

  const imponibile = Math.round((totale / (1 + percentuale / 100)) * 100) / 100;
  const imposta = Math.round((totale - imponibile) * 100) / 100;

  return {
    imponibile,
    imposta,
    totale: Math.round(totale * 100) / 100,
    percentuale,
    natura: vatCode.natura,
    description: vatCode.description
  };
}

/**
 * Calcola importi multipli con IVA (per righe fattura)
 */
export function calcolaRigheConIva(
  righe: Array<{
    quantita: number;
    prezzoUnitario: number;
    vatCode: VatCode;
    sconto?: number; // Percentuale sconto
  }>
): {
  righe: Array<IvaCalculation & { quantita: number; prezzoUnitario: number; scontoApplicato: number }>;
  riepilogoIva: Map<string, IvaCalculation>;
  totaleDocumento: number;
} {
  const righeCalcolate = righe.map(riga => {
    // Calcola prezzo scontato
    const scontoApplicato = riga.sconto || 0;
    const prezzoScontato = riga.prezzoUnitario * (1 - scontoApplicato / 100);
    const imponibileRiga = riga.quantita * prezzoScontato;
    
    const calcoloIva = calcolaIvaFromImponibile(imponibileRiga, riga.vatCode);
    
    return {
      ...calcoloIva,
      quantita: riga.quantita,
      prezzoUnitario: riga.prezzoUnitario,
      scontoApplicato
    };
  });

  // Raggruppa per codice IVA
  const riepilogoIva = new Map<string, IvaCalculation>();
  
  righeCalcolate.forEach(riga => {
    const key = `${riga.percentuale}${riga.natura ? `-${riga.natura}` : ''}`;
    
    if (riepilogoIva.has(key)) {
      const esistente = riepilogoIva.get(key)!;
      riepilogoIva.set(key, {
        ...esistente,
        imponibile: Math.round((esistente.imponibile + riga.imponibile) * 100) / 100,
        imposta: Math.round((esistente.imposta + riga.imposta) * 100) / 100,
        totale: Math.round((esistente.totale + riga.totale) * 100) / 100
      });
    } else {
      riepilogoIva.set(key, {
        imponibile: riga.imponibile,
        imposta: riga.imposta,
        totale: riga.totale,
        percentuale: riga.percentuale,
        natura: riga.natura,
        description: riga.description
      });
    }
  });

  const totaleDocumento = Array.from(riepilogoIva.values())
    .reduce((acc, riep) => acc + riep.totale, 0);

  return {
    righe: righeCalcolate,
    riepilogoIva,
    totaleDocumento: Math.round(totaleDocumento * 100) / 100
  };
}

/**
 * Verifica se un codice IVA è reverse charge
 */
export function isReverseCharge(natura?: string): boolean {
  return natura?.startsWith('N6') || false;
}

/**
 * Verifica se un codice IVA è esente/escluso/non imponibile
 */
export function isEsenteEscluso(natura?: string): boolean {
  return natura?.startsWith('N1') || 
         natura?.startsWith('N2') || 
         natura?.startsWith('N3') || 
         natura?.startsWith('N4') || 
         natura?.startsWith('N5') || 
         natura?.startsWith('N7') || false;
}

/**
 * Ottiene la descrizione testuale del regime IVA
 */
export function getRegimeIvaDescription(vatCode: VatCode): string {
  if (vatCode.natura) {
    if (vatCode.natura.startsWith('N1')) return 'Operazione esclusa da IVA';
    if (vatCode.natura.startsWith('N2')) return 'Operazione non soggetta a IVA';
    if (vatCode.natura.startsWith('N3')) return 'Operazione non imponibile';
    if (vatCode.natura === 'N4') return 'Operazione esente da IVA';
    if (vatCode.natura === 'N5') return 'Regime del margine';
    if (vatCode.natura.startsWith('N6')) return 'Inversione contabile (Reverse Charge)';
    if (vatCode.natura === 'N7') return 'IVA assolta in altro stato UE';
  }
  
  if (vatCode.percentage > 0) {
    return `IVA ${vatCode.percentage}%`;
  }
  
  return 'IVA 0%';
}

// ===== COSTANTI UTILI =====

export const ALIQUOTE_STANDARD = {
  ORDINARIA: 22,
  RIDOTTA_1: 10,
  RIDOTTA_2: 5,
  RIDOTTA_3: 4
} as const;

export const NATURA_CODES = {
  ESCLUSE: 'N1',
  NON_SOGGETTE_DPR: 'N2.1',
  NON_SOGGETTE_ALTRI: 'N2.2',
  NON_IMPONIBILI_EXPORT: 'N3.1',
  NON_IMPONIBILI_UE: 'N3.2',
  NON_IMPONIBILI_SAN_MARINO: 'N3.3',
  NON_IMPONIBILI_ASSIMILATE: 'N3.4',
  NON_IMPONIBILI_INTENTO: 'N3.5',
  NON_IMPONIBILI_ALTRE: 'N3.6',
  ESENTI: 'N4',
  REGIME_MARGINE: 'N5',
  REVERSE_CHARGE_ROTTAMI: 'N6.1',
  REVERSE_CHARGE_ORO: 'N6.2',
  REVERSE_CHARGE_EDILE: 'N6.3',
  REVERSE_CHARGE_FABBRICATI: 'N6.4',
  REVERSE_CHARGE_CELLULARI: 'N6.5',
  REVERSE_CHARGE_ELETTRONICI: 'N6.6',
  REVERSE_CHARGE_EDILE_CONNESSI: 'N6.7',
  REVERSE_CHARGE_ENERGIA: 'N6.8',
  REVERSE_CHARGE_ALTRI: 'N6.9',
  IVA_UE: 'N7'
} as const;