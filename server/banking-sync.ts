import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db } from "./db";
import { bankTransactions, movements, ibans } from "../shared/schema";

// Interfaccia per le transazioni dalle API PSD2
interface BankApiTransaction {
  transactionId: string;
  transactionDate: string;
  valueDate: string;
  amount: number;
  currency: string;
  description: string;
  balance?: number;
  creditorName?: string;
  debtorName?: string;
  remittanceInfo?: string;
  purposeCode?: string;
  endToEndId?: string;
  creditorIban?: string;
  debtorIban?: string;
}

// Simulazione chiamata API PSD2 (da sostituire con chiamate reali)
async function fetchTransactionsFromBankAPI(
  apiProvider: string, 
  iban: string, 
  credentials: any,
  fromDate: string,
  toDate: string
): Promise<BankApiTransaction[]> {
  console.log(`[BANK SYNC] Simulando chiamata API per ${apiProvider}, IBAN: ${iban.slice(-4)}`);
  
  // Simulazione dati di esempio per testing
  const mockTransactions: BankApiTransaction[] = [
    {
      transactionId: `TXN_${Date.now()}_001`,
      transactionDate: "2025-08-15",
      valueDate: "2025-08-15", 
      amount: -1500.00,
      currency: "EUR",
      description: "Bonifico a fornitore ABC SRL",
      creditorName: "ABC SRL",
      remittanceInfo: "Fattura 2025/001",
      endToEndId: "ABC123456789"
    },
    {
      transactionId: `TXN_${Date.now()}_002`,
      transactionDate: "2025-08-16",
      valueDate: "2025-08-16",
      amount: 2800.00,
      currency: "EUR", 
      description: "Incasso cliente XYZ SpA",
      debtorName: "XYZ SPA",
      remittanceInfo: "Fattura 2025/100",
      endToEndId: "XYZ987654321"
    },
    {
      transactionId: `TXN_${Date.now()}_003`,
      transactionDate: "2025-08-17",
      valueDate: "2025-08-17",
      amount: -850.50,
      currency: "EUR",
      description: "Pagamento utenze ENEL",
      creditorName: "ENEL ENERGIA SPA", 
      remittanceInfo: "Bolletta agosto 2025"
    }
  ];

  return mockTransactions;
}

// Algoritmo di matching intelligente
function calculateMatchScore(
  movement: any,
  transaction: BankApiTransaction
): number {
  let score = 0;
  let maxScore = 0;

  // 1. Matching importo (peso: 40%)
  maxScore += 40;
  const movementAmount = Math.abs(parseFloat(movement.amount));
  const transactionAmount = Math.abs(transaction.amount);
  const amountDiff = Math.abs(movementAmount - transactionAmount);
  
  if (amountDiff === 0) {
    score += 40; // Match perfetto
  } else if (amountDiff <= movementAmount * 0.01) { // ±1%
    score += 35; // Match quasi perfetto
  } else if (amountDiff <= movementAmount * 0.05) { // ±5%
    score += 20; // Match accettabile
  }

  // 2. Matching data (peso: 30%)
  maxScore += 30;
  const movementDate = new Date(movement.flowDate);
  const transactionDate = new Date(transaction.transactionDate);
  const daysDiff = Math.abs((movementDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    score += 30; // Stessa data
  } else if (daysDiff <= 1) {
    score += 25; // ±1 giorno
  } else if (daysDiff <= 3) {
    score += 15; // ±3 giorni
  } else if (daysDiff <= 7) {
    score += 5; // ±7 giorni
  }

  // 3. Matching tipo operazione (peso: 15%)
  maxScore += 15;
  const isMovementIncome = movement.type === 'income';
  const isTransactionIncome = transaction.amount > 0;
  if (isMovementIncome === isTransactionIncome) {
    score += 15;
  }

  // 4. Matching descrizione/causale (peso: 15%)
  maxScore += 15;
  if (movement.notes && transaction.description) {
    const movementDesc = movement.notes.toLowerCase();
    const transactionDesc = transaction.description.toLowerCase();
    
    // Cerca parole chiave comuni
    const movementWords = movementDesc.split(/\s+/);
    const transactionWords = transactionDesc.split(/\s+/);
    const commonWords = movementWords.filter((word: string) => 
      word.length > 3 && transactionWords.some((tw: string) => tw.includes(word) || word.includes(tw))
    );
    
    if (commonWords.length >= 2) {
      score += 15;
    } else if (commonWords.length === 1) {
      score += 8;
    }
  }

  // Bonus per match fattura/documento
  if (movement.invoiceNumber && transaction.remittanceInfo) {
    if (transaction.remittanceInfo.includes(movement.invoiceNumber)) {
      score += 10; // Bonus per numero fattura
    }
  }

  return Math.min(score / maxScore * 100, 100);
}

// Sincronizzazione automatica per un IBAN
export async function syncBankTransactions(ibanId: string): Promise<{
  synced: number;
  matched: number;
  errors: string[];
}> {
  console.log(`[BANK SYNC] Iniziando sincronizzazione per IBAN ${ibanId}`);
  
  try {
    // Recupera le informazioni dell'IBAN
    const ibanData = await db.select().from(ibans).where(eq(ibans.id, ibanId)).limit(1);
    if (ibanData.length === 0) {
      throw new Error("IBAN non trovato");
    }

    const iban = ibanData[0];
    if (!iban.apiProvider || !iban.autoSyncEnabled) {
      throw new Error("IBAN non configurato per sincronizzazione automatica");
    }

    // Calcola il periodo di sincronizzazione (ultimi 30 giorni)
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);

    // Chiama l'API bancaria
    const transactions = await fetchTransactionsFromBankAPI(
      iban.apiProvider,
      iban.iban,
      iban.apiCredentials,
      fromDate.toISOString().split('T')[0],
      toDate.toISOString().split('T')[0]
    );

    console.log(`[BANK SYNC] Recuperate ${transactions.length} transazioni dalla banca`);

    let syncedCount = 0;
    let matchedCount = 0;
    const errors: string[] = [];

    // Processa ogni transazione
    for (const transaction of transactions) {
      try {
        // Verifica se la transazione esiste già
        const existing = await db.select()
          .from(bankTransactions)
          .where(and(
            eq(bankTransactions.ibanId, ibanId),
            eq(bankTransactions.transactionId, transaction.transactionId)
          ))
          .limit(1);

        if (existing.length === 0) {
          // Inserisce la nuova transazione
          const [newTransaction] = await db.insert(bankTransactions).values({
            ibanId,
            transactionId: transaction.transactionId,
            transactionDate: transaction.transactionDate,
            valueDate: transaction.valueDate,
            amount: transaction.amount.toString(),
            currency: transaction.currency,
            description: transaction.description,
            balance: transaction.balance?.toString() || null,
            creditorName: transaction.creditorName || null,
            debtorName: transaction.debtorName || null,
            remittanceInfo: transaction.remittanceInfo || null,
            purposeCode: transaction.purposeCode || null,
            rawData: transaction,
            isMatched: false
          }).returning();

          syncedCount++;

          // Cerca movimenti da matchare
          await matchTransactionWithMovements(newTransaction.id, transaction, ibanId);
          matchedCount++;
        }
      } catch (error: any) {
        console.error(`[BANK SYNC] Errore processando transazione ${transaction.transactionId}:`, error);
        errors.push(`Transazione ${transaction.transactionId}: ${error?.message || 'Errore sconosciuto'}`);
      }
    }

    // Aggiorna data ultima sincronizzazione
    await db.update(ibans)
      .set({ lastSyncDate: new Date() })
      .where(eq(ibans.id, ibanId));

    console.log(`[BANK SYNC] Completata: ${syncedCount} sincronizzate, ${matchedCount} matchate`);
    
    return {
      synced: syncedCount,
      matched: matchedCount,
      errors
    };

  } catch (error) {
    console.error(`[BANK SYNC] Errore sincronizzazione IBAN ${ibanId}:`, error);
    throw error;
  }
}

// Matching di una transazione con i movimenti esistenti
async function matchTransactionWithMovements(
  transactionDbId: string,
  transaction: BankApiTransaction,
  ibanId: string
): Promise<void> {
  // Cerca movimenti candidati (stesso IBAN, periodo ±7 giorni)
  const searchFromDate = new Date(transaction.transactionDate);
  searchFromDate.setDate(searchFromDate.getDate() - 7);
  
  const searchToDate = new Date(transaction.transactionDate);
  searchToDate.setDate(searchToDate.getDate() + 7);

  const candidateMovements = await db.select()
    .from(movements)
    .where(and(
      eq(movements.ibanId, ibanId),
      eq(movements.isVerified, false), // Solo movimenti non ancora verificati
      gte(movements.flowDate, searchFromDate.toISOString().split('T')[0]),
      lte(movements.flowDate, searchToDate.toISOString().split('T')[0])
    ));

  let bestMatch = null;
  let bestScore = 0;

  // Calcola score per ogni movimento candidato
  for (const movement of candidateMovements) {
    const score = calculateMatchScore(movement, transaction);
    if (score > bestScore && score >= 70) { // Soglia minima 70%
      bestScore = score;
      bestMatch = movement;
    }
  }

  // Se trovato un match valido, aggiorna entrambe le tabelle
  if (bestMatch && bestScore >= 70) {
    console.log(`[MATCHING] Match trovato! Score: ${bestScore.toFixed(2)}% - Movimento ${bestMatch.id} ↔ Transazione ${transaction.transactionId}`);

    // Aggiorna il movimento
    await db.update(movements)
      .set({
        isVerified: bestScore >= 90, // Verificato solo se score alto
        verificationStatus: bestScore >= 90 ? 'matched' : 'partial_match',
        bankTransactionId: transactionDbId,
        matchScore: (bestScore / 100).toString(),
        lastVerificationDate: new Date()
      })
      .where(eq(movements.id, bestMatch.id));

    // Aggiorna la transazione bancaria
    await db.update(bankTransactions)
      .set({
        isMatched: true,
        movementId: bestMatch.id,
        matchedAt: new Date()
      })
      .where(eq(bankTransactions.id, transactionDbId));
  } else {
    console.log(`[MATCHING] Nessun match trovato per transazione ${transaction.transactionId}`);
  }
}

// Sincronizzazione di tutti gli IBAN abilitati
export async function syncAllEnabledIbans(): Promise<{
  totalSynced: number;
  totalMatched: number; 
  errors: string[];
}> {
  console.log("[BANK SYNC] Iniziando sincronizzazione globale...");

  const enabledIbans = await db.select()
    .from(ibans)
    .where(and(
      eq(ibans.autoSyncEnabled, true),
      eq(ibans.isActive, true)
    ));

  console.log(`[BANK SYNC] Trovati ${enabledIbans.length} IBAN abilitati per sincronizzazione`);

  let totalSynced = 0;
  let totalMatched = 0;
  const allErrors: string[] = [];

  for (const iban of enabledIbans) {
    try {
      const result = await syncBankTransactions(iban.id);
      totalSynced += result.synced;
      totalMatched += result.matched;
      allErrors.push(...result.errors);
    } catch (error: any) {
      console.error(`[BANK SYNC] Errore IBAN ${iban.iban}:`, error);
      allErrors.push(`IBAN ${iban.iban}: ${error?.message || 'Errore sconosciuto'}`);
    }
  }

  console.log(`[BANK SYNC] Sincronizzazione globale completata: ${totalSynced} transazioni, ${totalMatched} match`);

  return {
    totalSynced,
    totalMatched,
    errors: allErrors
  };
}