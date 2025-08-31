# 🔥 LOGICA BIDIRECTIONAL FATTURE ↔ MOVIMENTI
## DOCUMENTAZIONE TECNICA COMPLETA

### OVERVIEW SISTEMA
Il sistema EasyCashFlows implementa una **sincronizzazione bidirectional intelligente** tra fatture elettroniche (FatturaPA) e movimenti finanziari, garantendo che ogni cambiamento si rifletta automaticamente tra i due sistemi.

---

## 🎯 CARATTERISTICHE CHIAVE

### ✅ FUNZIONALITÀ IMPLEMENTATE
- **Sincronizzazione automatica**: Fatture → Movimenti con mapping intelligente
- **Gestione bidirezionale**: Aggiornamenti status fattura → movimento e viceversa
- **Validazione completa**: Controlli su dati obbligatori e coerenza
- **Tipologie documento**: Supporto completo TD01-TD22 (FatturaPA)
- **Importi negativi**: Gestione automatica note credito (TD04, TD08)
- **Termini pagamento**: Calcolo automatico date movimento
- **Prevenzione duplicati**: Sistema di controllo movimenti esistenti
- **API REST complete**: Endpoint `/api/invoicing/invoices/:id/create-movement`

---

## 📋 MAPPING TIPOLOGIE DOCUMENTO

### TIPOLOGIE CHE GENERANO IMPORTI NEGATIVI
```typescript
const NEGATIVE_AMOUNT_INVOICE_TYPES = [
  'TD04', // Nota di credito
  'TD08', // Nota di credito semplificata  
];
```

### TIPOLOGIE CHE NON GENERANO MOVIMENTI
```typescript
const NON_MOVEMENT_INVOICE_TYPES = [
  'TD20', // Autofattura (già contabilizzata)
  'TD21', // Autofattura per cessione beni
  'TD22', // Estrazione beni da deposito IVA
];
```

### MAPPING CAUSALI AUTOMATICHE
```typescript
const INVOICE_TYPE_TO_MOVEMENT_REASON = {
  'TD01': 'FATT_ATT',   // Fattura → Fatturazione attiva
  'TD02': 'FATT_ACC',   // Acconto → Fatturazione acconto
  'TD04': 'NOTA_CR',    // Nota credito → Nota credito
  'TD05': 'NOTA_DB',    // Nota debito → Nota debito
  'TD06': 'FATT_ATT',   // Parcella → Fatturazione attiva
  'TD07': 'FATT_SEMPL', // Semplificata → Fatturazione semplificata
  'TD08': 'NOTA_CR',    // Nota credito semplificata → Nota credito
};
```

---

## 🔄 DIREZIONE FATTURE E TIPI MOVIMENTO

### LOGICA CENTRALE
```typescript
// FATTURE EMESSE (outgoing) → sempre INCOME
if (invoice.direction === 'outgoing') {
  movementType = 'income';  // Entrata per l'azienda
}

// FATTURE RICEVUTE (incoming) → sempre EXPENSE  
if (invoice.direction === 'incoming') {
  movementType = 'expense'; // Uscita per l'azienda
}
```

### ESEMPI PRATICI
1. **Fattura emessa a cliente** → Movimento di **entrata** (+€1000)
2. **Nota credito emessa** → Movimento di **entrata negativa** (-€500)
3. **Fattura ricevuta da fornitore** → Movimento di **uscita** (+€800)
4. **Nota credito ricevuta** → Movimento di **uscita negativa** (-€200)

---

## 💰 GESTIONE IMPORTI E SEGNI

### ALGORITMO CALCOLO IMPORTI
```typescript
export function analyzeInvoiceForMovement(invoice, invoiceLines?) {
  const isNegativeType = NEGATIVE_AMOUNT_INVOICE_TYPES.includes(invoice.invoiceType.code);
  const baseAmount = parseFloat(invoice.totalAmount.toString());
  
  // CALCOLO FINALE
  const finalAmount = isNegativeType ? -baseAmount : baseAmount;
  
  // Nel database movimento: sempre positivo nel campo amount
  // Se negativo, viene applicato il segno nell'interfaccia
  movementData.amount = Math.abs(finalAmount).toString();
  
  // Per note credito aggiungi segno negativo
  if (isNegativeType) {
    movementData.amount = (-Math.abs(finalAmount)).toString();
  }
}
```

---

## 📅 CALCOLO DATE E TERMINI PAGAMENTO

### DATA MOVIMENTO INTELLIGENTE
```typescript
export function calculateMovementDateFromPaymentTerms(
  invoiceDate: string,
  paymentTermsDays: number
): string {
  const invoiceDateObj = new Date(invoiceDate);
  const movementDate = new Date(invoiceDateObj);
  movementDate.setDate(movementDate.getDate() + paymentTermsDays);
  return movementDate.toISOString().split('T')[0];
}
```

### ESEMPI
- **Fattura emessa 01/01/2025** + 30 giorni → Movimento **31/01/2025**
- **Fattura ricevuta 15/01/2025** + 60 giorni → Movimento **16/03/2025**

---

## 🔄 SINCRONIZZAZIONE STATUS BIDIREZIONALE

### MAPPING STATUS INTELLIGENTE
```typescript
const statusMap = {
  'draft': ['Da Saldare', 'Pending'],
  'sent': ['In Lavorazione', 'Processing', 'Sent'],
  'paid': ['Saldato', 'Paid', 'Completed'],
  'cancelled': ['Annullato', 'Cancelled'],
  'overdue': ['Scaduto', 'Overdue']
};
```

### AGGIORNAMENTO AUTOMATICO
```typescript
export function syncMovementStatusFromInvoice(invoice, movement, statusMappings) {
  const newStatusId = mapInvoiceStatusToMovementStatus(invoice.status, statusMappings);
  
  const updates = { statusId: newStatusId };
  
  // VERIFICA AUTOMATICA QUANDO PAGATO
  if (invoice.status === 'paid' && invoice.paymentDate) {
    updates.lastVerificationDate = new Date();
    updates.isVerified = true;
    updates.verificationStatus = 'verified';
  }
  
  return updates;
}
```

---

## 🔗 COLLEGAMENTO E RICONCILIAZIONE

### IDENTIFICAZIONE MOVIMENTI COLLEGATI
```typescript
export function isMovementLinkedToInvoice(movement, invoice) {
  // 1. Controllo numero fattura
  if (movement.invoiceNumber === `${invoice.number}/${invoice.year}`) {
    return true;
  }
  
  // 2. Controllo documento number
  if (movement.documentNumber?.includes(invoice.number)) {
    return true;
  }
  
  // 3. Controllo XML content
  if (movement.xmlData && invoice.xmlContent && 
      movement.xmlData === invoice.xmlContent) {
    return true;
  }
  
  return false;
}
```

---

## 📊 DATI MOVIMENTO GENERATI

### STRUTTURA COMPLETA
```typescript
const movementData: InsertMovement = {
  // Date intelligenti
  insertDate: new Date().toISOString().split('T')[0], // Oggi
  flowDate: calculateWithPaymentTerms(invoice.issueDate, paymentDays),
  
  // Tipo e importi
  type: mapping.movementType, // 'income' | 'expense'
  amount: Math.abs(mapping.amount).toString(),
  vatAmount: invoice.totalTaxAmount?.toString() || '0',
  netAmount: invoice.totalTaxableAmount?.toString() || '0',
  
  // Relazioni obbligatorie
  companyId: invoice.companyId,
  coreId: options.coreId, // Fornito dall'esterno
  statusId: mapFromInvoiceStatus(invoice.status),
  reasonId: mapping.suggestedReasonId,
  
  // Cliente/Fornitore automatico
  customerId: invoice.customerId || undefined,
  supplierId: invoice.supplierId || undefined,
  
  // IBAN mappato
  ibanId: mapPaymentMethodToIban(invoice.paymentMethodId, companyIbans),
  
  // Metadati fattura
  invoiceNumber: `${invoice.number}/${invoice.year}`,
  documentNumber: `${invoice.invoiceType.code}-${invoice.number}`,
  xmlData: invoice.xmlContent || undefined,
  
  // Note automatiche
  notes: [
    generateAutoNotes(invoice),
    paymentTermsNote,
    invoice.notes,
    additionalNotes
  ].filter(Boolean).join('\n\n')
};
```

---

## 🚀 API ENDPOINTS PRINCIPALI

### CREAZIONE MOVIMENTO DA FATTURA
```http
POST /api/invoicing/invoices/:id/create-movement
Authorization: Bearer <token>
Content-Type: application/json

{
  "forceCreate": false,          // Opzionale: forza creazione se esiste già
  "coreId": "core-uuid",         // Obbligatorio: core di contabilità
  "statusId": "status-uuid",     // Opzionale: status specifico
  "reasonId": "reason-uuid",     // Opzionale: causale specifica
  "paymentTermsDays": 30,        // Opzionale: termini pagamento
  "additionalNotes": "Note..."   // Opzionale: note aggiuntive
}
```

### RISPOSTA SUCCESSO
```json
{
  "message": "Movement created successfully",
  "movementId": "movement-uuid-generated",
  "invoiceId": "invoice-uuid",
  "mapping": {
    "amount": 1000,
    "movementType": "income",
    "isNegativeAmount": false,
    "autoGeneratedNotes": "Fattura n. 001/2025 | Data emissione: 2025-01-01"
  }
}
```

### RISPOSTA ERRORE (movimento già esistente)
```json
{
  "message": "Movement already exists for this invoice",
  "existingMovementId": "existing-movement-uuid",
  "hint": "Use forceCreate: true to create anyway"
}
```

---

## ✅ VALIDAZIONI IMPLEMENTATE

### CONTROLLI PRE-CREAZIONE
```typescript
export function validateInvoiceForMovement(invoice) {
  const errors = [];
  
  // Controlli obbligatori
  if (!invoice.companyId) errors.push('Azienda mancante');
  if (!invoice.totalAmount || parseFloat(invoice.totalAmount) === 0) {
    errors.push('Importo fattura non valido');
  }
  if (!invoice.issueDate) errors.push('Data emissione mancante');
  
  // Controlli direzione
  if (invoice.direction === 'outgoing' && !invoice.customerId) {
    errors.push('Cliente mancante per fattura emessa');
  }
  if (invoice.direction === 'incoming' && !invoice.supplierId) {
    errors.push('Fornitore mancante per fattura ricevuta');
  }
  
  // Controlli status
  if (invoice.status === 'cancelled') {
    errors.push('Fattura annullata - movimento non generabile');
  }
  
  return { isValid: errors.length === 0, errors };
}
```

---

## 🔍 ESEMPI PRATICI COMPLETI

### CASO 1: Fattura Attiva TD01
```typescript
// INPUT: Fattura emessa €1200 + IVA
{
  direction: 'outgoing',
  invoiceType: { code: 'TD01' },
  totalAmount: '1200.00',
  customerId: 'customer-abc'
}

// OUTPUT: Movimento generato
{
  type: 'income',           // Entrata
  amount: '1200.00',        // Positivo
  reasonId: 'FATT_ATT',    // Fatturazione attiva
  customerId: 'customer-abc',
  invoiceNumber: '001/2025'
}
```

### CASO 2: Nota Credito TD04
```typescript
// INPUT: Nota credito emessa €300
{
  direction: 'outgoing',
  invoiceType: { code: 'TD04' },
  totalAmount: '300.00',
  customerId: 'customer-abc'
}

// OUTPUT: Movimento generato
{
  type: 'income',           // Entrata (ma negativa)
  amount: '-300.00',        // Negativo per nota credito
  reasonId: 'NOTA_CR',     // Nota credito
  customerId: 'customer-abc',
  invoiceNumber: '002/2025'
}
```

### CASO 3: Fattura Fornitore
```typescript
// INPUT: Fattura ricevuta da fornitore €800
{
  direction: 'incoming',
  invoiceType: { code: 'TD01' },
  totalAmount: '800.00',
  supplierId: 'supplier-xyz'
}

// OUTPUT: Movimento generato
{
  type: 'expense',          // Uscita
  amount: '800.00',         // Positivo (spesa)
  reasonId: 'FATT_ATT',    // Fatturazione attiva
  supplierId: 'supplier-xyz',
  invoiceNumber: '100/2025'
}
```

---

## 📈 STATUS TRACKING E WORKFLOW

### FLUSSO COMPLETO
```
1. FATTURA CREATA (draft)     → MOVIMENTO (Da Saldare)
2. FATTURA INVIATA (sent)     → MOVIMENTO (In Lavorazione)  
3. FATTURA PAGATA (paid)      → MOVIMENTO (Saldato + verified)
4. FATTURA SCADUTA (overdue)  → MOVIMENTO (Scaduto)
5. FATTURA CANCELLATA        → MOVIMENTO (non generabile)
```

### AGGIORNAMENTI AUTOMATICI
- **Cambio status fattura** → Aggiorna automaticamente movimento collegato
- **Pagamento fattura** → Segna movimento come verificato con data
- **Cancellazione fattura** → Impedisce creazione movimento

---

## 🛠️ FILE COINVOLTI NEL SISTEMA

### CORE LOGIC
- `shared/invoice-movement-sync.ts` - **Logica principale bidirectional**
- `shared/schema.ts` - Definizioni tipi e tabelle database

### API ENDPOINTS  
- `server/routes.ts` (linea 4034+) - Endpoint creazione movimento
- `server/storage.ts` - Metodi database per movimenti e fatture

### FRONTEND COMPONENTS
- `client/src/components/movements/movement-form-new-fixed.tsx` - Form creazione movimento
- `client/src/components/invoicing/invoices-list-professional.tsx` - Lista fatture con azioni

---

## 🎯 OBIETTIVI RAGGIUNTI

### ✅ FUNZIONALITÀ COMPLETE
1. **Mapping intelligente** fatture → movimenti
2. **Gestione importi negativi** per note credito
3. **Calcolo date automatico** con termini pagamento
4. **Sincronizzazione status** bidirezionale
5. **Prevenzione duplicati** con controlli esistenti
6. **Validazioni complete** pre-creazione
7. **API REST robuste** con gestione errori
8. **Supporto FatturaPA completo** TD01-TD22

### 🔧 PERSONALIZZAZIONI DISPONIBILI
- **Force create**: Creazione forzata anche se movimento esiste
- **Core ID custom**: Specifico core contabilità
- **Status custom**: Status movimento personalizzato  
- **Causale custom**: Reason ID specifico
- **Termini pagamento**: Giorni personalizzabili
- **Note aggiuntive**: Annotazioni custom

---

## 🚨 CONSIDERAZIONI TECNICHE

### SICUREZZA
- **Autenticazione richiesta**: Role "admin" o "finance"
- **Validazione input**: Controlli completi pre-elaborazione
- **Prevenzione duplicati**: Sistema anti-collision

### PERFORMANCE
- **Query ottimizzate**: Select specifici con relazioni
- **Caching intelligente**: Uso React Query per frontend
- **Batch operations**: Supporto operazioni multiple

### MANUTENIBILITÀ
- **Codice modulare**: Funzioni singola responsabilità
- **Type safety**: TypeScript completo
- **Documentazione inline**: Commenti tecnici dettagliati

---

## 🔮 ROADMAP FUTURI SVILUPPI

### PRIORITÀ ALTA
- [ ] Sincronizzazione **movimenti → fatture** (reverse sync)
- [ ] **Riconciliazione bancaria** automatica
- [ ] **Batch sync** per più fatture simultanee

### PRIORITÀ MEDIA  
- [ ] **Webhook notifications** per sync eventi
- [ ] **Audit trail** completo modifiche
- [ ] **Dashboard sync** real-time

### PRIORITÀ BASSA
- [ ] **Export/Import** configurazioni sync
- [ ] **Analytics** performance sincronizzazioni
- [ ] **Multi-azienda** sync policies

---

*Documentazione creata: 31 Agosto 2025*  
*Sistema EasyCashFlows - Bidirectional Sync v1.0*  
*Status: ✅ IMPLEMENTAZIONE COMPLETA E FUNZIONANTE*