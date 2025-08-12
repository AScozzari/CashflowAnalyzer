import { parseStringPromise } from 'xml2js';
import { storage } from './storage';

export interface ParsedInvoiceData {
  // Dati del fornitore/cedente
  supplier: {
    vatNumber: string;
    taxCode?: string;
    name: string;
    address?: string;
    zipCode?: string;
    city?: string;
    country?: string;
  };
  
  // Dati della fattura
  invoice: {
    documentType: string;
    documentNumber: string;
    documentDate: string;
    totalAmount: number;
    vatAmount: number;
    netAmount: number;
    currency: string;
    description: string;
  };
  
  // Dati del cessionario (azienda)
  customer: {
    vatNumber: string;
    taxCode?: string;
    name: string;
  };
  
  // Righe della fattura
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    vatRate: number;
    vatAmount: number;
  }>;
  
  // Dati di pagamento
  payment?: {
    terms: string;
    dueDate?: string;
    amount: number;
    method?: string;
  };
}

export interface MovementSuggestion {
  type: 'income' | 'expense';
  amount: string;
  flowDate: string;
  documentNumber: string;
  documentDate: string;
  description: string;
  notes: string;
  supplierId?: string;
  companyId?: string;
  vatAmount?: number;
  netAmount?: number;
}

export class XMLInvoiceParser {
  
  /**
   * Parsing principale del file XML FatturaPA
   */
  async parseInvoiceXML(xmlContent: string): Promise<ParsedInvoiceData> {
    try {
      const result = await parseStringPromise(xmlContent, {
        explicitArray: false,
        mergeAttrs: true,
        normalizeTags: false, // Mantieni i tag case-sensitive per FatturaPA
        normalize: true
      });

      const fattura = result['p:FatturaElettronica'] || result.FatturaElettronica || result['p:fatturaelettronica'];
      if (!fattura) {
        throw new Error('Formato XML non valido: struttura FatturaPA non trovata');
      }

      const fatturaHeader = fattura.FatturaElettronicaHeader || fattura.fatturaelectronicaheader;
      const fatturaBody = fattura.FatturaElettronicaBody || fattura.fatturaelectronicabody;

      if (!fatturaHeader || !fatturaBody) {
        throw new Error('Formato XML non valido: header o body mancanti');
      }

      // Estrai dati del cedente/prestatore (fornitore)
      const cedentePrestatore = fatturaHeader.CedentePrestatore || fatturaHeader.cedenteprestatore;
      const datiAnagraficiCedente = cedentePrestatore?.DatiAnagrafici || cedentePrestatore?.datianagrafica;
      const sedeCedente = cedentePrestatore?.Sede || cedentePrestatore?.sede;

      // Estrai dati del cessionario/committente (cliente)
      const cessionarioCommittente = fatturaHeader.CessionarioCommittente || fatturaHeader.cessionariocommittente;
      const datiAnagraficiCessionario = cessionarioCommittente?.DatiAnagrafici || cessionarioCommittente?.datianagrafica;

      // Dati generali del documento
      const datiGeneraliDocumento = fatturaBody.DatiGenerali?.DatiGeneraliDocumento || 
                                   fatturaBody.datigenerali?.datigeneralidocumento;

      // Righe del documento
      const dettaglioLinee = fatturaBody.DatiBeniServizi?.DettaglioLinee || 
                            fatturaBody.datibeniservizi?.dettagliolinee;

      // Dati di pagamento
      const datiPagamento = fatturaBody.DatiPagamento || fatturaBody.datipagamento;

      // Costruisci l'oggetto dati parsed
      const parsedData: ParsedInvoiceData = {
        supplier: {
          vatNumber: this.extractVatNumber(
            datiAnagraficiCedente?.IdFiscaleIVA?.IdPaese || datiAnagraficiCedente?.idfiscaleiva?.idpaese,
            datiAnagraficiCedente?.IdFiscaleIVA?.IdCodice || datiAnagraficiCedente?.idfiscaleiva?.idcodice
          ),
          taxCode: datiAnagraficiCedente?.CodiceFiscale || datiAnagraficiCedente?.codicefiscale,
          name: this.extractCompanyName(datiAnagraficiCedente),
          address: sedeCedente?.Indirizzo || sedeCedente?.indirizzo,
          zipCode: sedeCedente?.CAP || sedeCedente?.cap,
          city: sedeCedente?.Comune || sedeCedente?.comune,
          country: sedeCedente?.Nazione || sedeCedente?.nazione || 'IT'
        },
        
        customer: {
          vatNumber: this.extractVatNumber(
            datiAnagraficiCessionario?.IdFiscaleIVA?.IdPaese || datiAnagraficiCessionario?.idfiscaleiva?.idpaese,
            datiAnagraficiCessionario?.IdFiscaleIVA?.IdCodice || datiAnagraficiCessionario?.idfiscaleiva?.idcodice
          ),
          taxCode: datiAnagraficiCessionario?.CodiceFiscale || datiAnagraficiCessionario?.codicefiscale,
          name: this.extractCompanyName(datiAnagraficiCessionario)
        },
        
        invoice: {
          documentType: datiGeneraliDocumento?.TipoDocumento || datiGeneraliDocumento?.tipodocumento || 'TD01',
          documentNumber: datiGeneraliDocumento?.Numero || datiGeneraliDocumento?.numero || '',
          documentDate: datiGeneraliDocumento?.Data || datiGeneraliDocumento?.data || '',
          totalAmount: parseFloat(datiGeneraliDocumento?.ImportoTotaleDocumento || datiGeneraliDocumento?.importototale || '0'),
          vatAmount: this.calculateTotalVAT(dettaglioLinee),
          netAmount: this.calculateNetAmount(dettaglioLinee),
          currency: datiGeneraliDocumento?.Divisa || datiGeneraliDocumento?.divisa || 'EUR',
          description: this.extractInvoiceDescription(datiGeneraliDocumento, dettaglioLinee)
        },
        
        lines: this.extractInvoiceLines(dettaglioLinee),
        
        payment: this.extractPaymentData(datiPagamento)
      };

      return parsedData;
    } catch (error) {
      console.error('Errore durante il parsing XML:', error);
      throw new Error(`Errore nel parsing del file XML: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    }
  }

  /**
   * Genera suggerimenti per i movimenti basati sui dati della fattura
   */
  async generateMovementSuggestions(parsedData: ParsedInvoiceData): Promise<MovementSuggestion[]> {
    const suggestions: MovementSuggestion[] = [];
    
    try {
      // Determina se è un'entrata o uscita basandosi sui dati aziendali
      const companies = await storage.getCompanies();
      const isIncome = companies.some(company => 
        company.vatNumber === parsedData.customer.vatNumber ||
        company.taxCode === parsedData.customer.taxCode
      );

      // Verifica se il fornitore esiste già nel sistema
      let supplierId: string | undefined;
      if (!isIncome) {
        const existingSupplier = await storage.getSupplierByVatNumber(parsedData.supplier.vatNumber);
        if (existingSupplier) {
          supplierId = existingSupplier.id;
        }
      }

      // Trova la company corrispondente al cessionario
      let companyId: string | undefined;
      if (isIncome) {
        const matchingCompany = companies.find(company => 
          company.vatNumber === parsedData.customer.vatNumber ||
          company.taxCode === parsedData.customer.taxCode
        );
        companyId = matchingCompany?.id;
      }

      // Crea il suggerimento principale per l'importo totale
      const mainSuggestion: MovementSuggestion = {
        type: isIncome ? 'income' : 'expense',
        amount: parsedData.invoice.totalAmount.toString(),
        flowDate: parsedData.invoice.documentDate,
        documentNumber: parsedData.invoice.documentNumber,
        documentDate: parsedData.invoice.documentDate,
        description: parsedData.invoice.description,
        notes: this.generateMovementNotes(parsedData, isIncome),
        supplierId: !isIncome ? supplierId : undefined,
        companyId: isIncome ? companyId : undefined,
        vatAmount: parsedData.invoice.vatAmount,
        netAmount: parsedData.invoice.netAmount
      };

      suggestions.push(mainSuggestion);

      // Se ci sono più righe significative, crea suggerimenti separati
      if (parsedData.lines.length > 1) {
        const significantLines = parsedData.lines.filter(line => line.totalPrice > 100);
        
        for (let index = 0; index < significantLines.length; index++) {
          const line = significantLines[index];
          if (index === 0) continue; // Skip first line as it's covered by main suggestion
          
          const lineSuggestion: MovementSuggestion = {
            type: isIncome ? 'income' : 'expense',
            amount: line.totalPrice.toString(),
            flowDate: parsedData.invoice.documentDate,
            documentNumber: `${parsedData.invoice.documentNumber}-${index + 1}`,
            documentDate: parsedData.invoice.documentDate,
            description: line.description,
            notes: `Riga ${index + 1} - ${line.description}\nQuantità: ${line.quantity} x €${line.unitPrice}`,
            supplierId: !isIncome ? supplierId : undefined,
            companyId: isIncome ? companyId : undefined,
            vatAmount: line.vatAmount,
            netAmount: line.totalPrice - line.vatAmount
          };

          suggestions.push(lineSuggestion);
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Errore nella generazione suggerimenti:', error);
      return []; // Ritorna array vuoto in caso di errore
    }
  }

  /**
   * Verifica se un fornitore deve essere creato automaticamente
   */
  async checkAndCreateSupplier(parsedData: ParsedInvoiceData): Promise<string | null> {
    try {
      // Verifica se il fornitore esiste già
      const existingSupplier = await storage.getSupplierByVatNumber(parsedData.supplier.vatNumber);
      if (existingSupplier) {
        return existingSupplier.id;
      }

      // Crea automaticamente il fornitore se non esiste
      const newSupplier = await storage.createSupplier({
        name: parsedData.supplier.name,
        vatNumber: parsedData.supplier.vatNumber,
        taxCode: parsedData.supplier.taxCode || '',
        address: parsedData.supplier.address || '',
        zipCode: parsedData.supplier.zipCode || '',
        city: parsedData.supplier.city || '',
        country: parsedData.supplier.country || 'Italia',
        email: '',
        phone: '',
        website: '',
        contactPerson: '',
        legalForm: '',
        pec: '',
        sdi: '',
        paymentTerms: parsedData.payment?.terms ? parsedData.payment.terms : "30",
        notes: `Creato automaticamente dal parsing XML fattura ${parsedData.invoice.documentNumber}`,
        isActive: true
      });

      return newSupplier.id;
    } catch (error) {
      console.error('Errore nella creazione automatica del fornitore:', error);
      return null;
    }
  }

  // Metodi helper privati
  private extractVatNumber(country?: string, code?: string): string {
    if (!code) return '';
    const countryCode = country || 'IT';
    // Estrai solo il codice se già include il prefixo paese
    if (code.startsWith(countryCode)) {
      return code;
    }
    return `${countryCode}${code}`;
  }

  private extractCompanyName(datiAnagrafici: any): string {
    if (datiAnagrafici?.Anagrafica?.Denominazione) {
      return datiAnagrafici.Anagrafica.Denominazione;
    }
    if (datiAnagrafici?.anagrafica?.denominazione) {
      return datiAnagrafici.anagrafica.denominazione;
    }
    if (datiAnagrafici?.Denominazione || datiAnagrafici?.denominazione) {
      return datiAnagrafici.Denominazione || datiAnagrafici.denominazione;
    }
    
    const nome = datiAnagrafici?.Anagrafica?.Nome || datiAnagrafici?.anagrafica?.nome || datiAnagrafici?.Nome || datiAnagrafici?.nome || '';
    const cognome = datiAnagrafici?.Anagrafica?.Cognome || datiAnagrafici?.anagrafica?.cognome || datiAnagrafici?.Cognome || datiAnagrafici?.cognome || '';
    return nome && cognome ? `${nome} ${cognome}` : nome || cognome || 'N/A';
  }

  private calculateTotalVAT(dettaglioLinee: any): number {
    if (!dettaglioLinee) return 0;
    
    const lines = Array.isArray(dettaglioLinee) ? dettaglioLinee : [dettaglioLinee];
    return lines.reduce((total: number, line: any) => {
      const aliquotaIva = parseFloat(line?.aliquotaiva || line?.AliquotaIVA || '0');
      const prezzoTotale = parseFloat(line?.prezzototale || line?.PrezzoTotale || '0');
      return total + (prezzoTotale * aliquotaIva / 100);
    }, 0);
  }

  private calculateNetAmount(dettaglioLinee: any): number {
    if (!dettaglioLinee) return 0;
    
    const lines = Array.isArray(dettaglioLinee) ? dettaglioLinee : [dettaglioLinee];
    return lines.reduce((total: number, line: any) => {
      const prezzoTotale = parseFloat(line?.prezzototale || line?.PrezzoTotale || '0');
      return total + prezzoTotale;
    }, 0);
  }

  private extractInvoiceDescription(datiGenerali: any, dettaglioLinee: any): string {
    // Prova prima con la descrizione generale (Causale)
    if (datiGenerali?.Causale || datiGenerali?.causale) {
      return datiGenerali.Causale || datiGenerali.causale;
    }
    if (datiGenerali?.Oggetto || datiGenerali?.oggetto) {
      return datiGenerali.Oggetto || datiGenerali.oggetto;
    }

    // Altrimenti usa la prima riga significativa
    if (dettaglioLinee) {
      const lines = Array.isArray(dettaglioLinee) ? dettaglioLinee : [dettaglioLinee];
      const firstLine = lines[0];
      if (firstLine?.Descrizione || firstLine?.descrizione) {
        return firstLine.Descrizione || firstLine.descrizione;
      }
    }

    return 'Fattura elettronica';
  }

  private extractInvoiceLines(dettaglioLinee: any): ParsedInvoiceData['lines'] {
    if (!dettaglioLinee) return [];
    
    const lines = Array.isArray(dettaglioLinee) ? dettaglioLinee : [dettaglioLinee];
    return lines.map((line: any) => {
      const quantity = parseFloat(line?.quantita || line?.Quantita || '1');
      const unitPrice = parseFloat(line?.prezzotario || line?.PrezzoUnitario || '0');
      const totalPrice = parseFloat(line?.prezzototale || line?.PrezzoTotale || '0');
      const vatRate = parseFloat(line?.aliquotaiva || line?.AliquotaIVA || '0');
      
      return {
        description: line?.descrizione || line?.Descrizione || '',
        quantity,
        unitPrice,
        totalPrice,
        vatRate,
        vatAmount: totalPrice * vatRate / 100
      };
    });
  }

  private extractPaymentData(datiPagamento: any): ParsedInvoiceData['payment'] | undefined {
    if (!datiPagamento) return undefined;
    
    const dettaglioPagamento = datiPagamento?.dettagliopagamento || datiPagamento?.DettaglioPagamento;
    if (!dettaglioPagamento) return undefined;

    const payment = Array.isArray(dettaglioPagamento) ? dettaglioPagamento[0] : dettaglioPagamento;
    
    return {
      terms: payment?.modapagamento || payment?.ModalitaPagamento || '',
      dueDate: payment?.datascadenzapagamento || payment?.DataScadenzaPagamento,
      amount: parseFloat(payment?.importopagamento || payment?.ImportoPagamento || '0'),
      method: payment?.modapagamento || payment?.ModalitaPagamento
    };
  }

  private generateMovementNotes(parsedData: ParsedInvoiceData, isIncome: boolean): string {
    const parts = [];
    
    parts.push(`Fattura XML ${parsedData.invoice.documentNumber} del ${parsedData.invoice.documentDate}`);
    parts.push(`${isIncome ? 'Cliente' : 'Fornitore'}: ${parsedData.supplier.name}`);
    parts.push(`P.IVA: ${parsedData.supplier.vatNumber}`);
    
    if (parsedData.invoice.netAmount > 0) {
      parts.push(`Imponibile: €${parsedData.invoice.netAmount.toFixed(2)}`);
    }
    
    if (parsedData.invoice.vatAmount > 0) {
      parts.push(`IVA: €${parsedData.invoice.vatAmount.toFixed(2)}`);
    }
    
    if (parsedData.payment?.dueDate) {
      parts.push(`Scadenza: ${parsedData.payment.dueDate}`);
    }
    
    return parts.join('\n');
  }
}

export const xmlInvoiceParser = new XMLInvoiceParser();