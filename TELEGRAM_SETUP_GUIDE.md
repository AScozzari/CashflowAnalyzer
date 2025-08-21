# 🤖 Guida Configurazione Telegram Bot per Demo

## 📋 Prerequisiti
1. Account Telegram attivo
2. Accesso admin al sistema EasyCashFlows
3. URL pubblico della tua applicazione Replit

## 🚀 Passo 1: Creare il Bot Telegram

### Contatta BotFather
1. Apri Telegram e cerca `@BotFather`
2. Avvia la chat con `/start`
3. Crea un nuovo bot con `/newbot`

### Configurazione Bot
```
/newbot
Nome del bot: EasyCashFlows Demo Bot
Username del bot: easycashflows_demo_bot (deve finire con _bot)
```

### Ottieni il Token
- BotFather ti fornirà un token simile a: `123456789:AABBccDDeeFFggHHiiJJkkLLmmNNooP`
- **CONSERVA QUESTO TOKEN - È LA TUA API KEY**

## 🔧 Passo 2: Configurazione nel Sistema

### Accedi alle Impostazioni
1. Login: `admin` / `admin123`
2. Vai a **Impostazioni** → **Comunicazioni** → **Telegram**

### Parametri di Configurazione

#### Configurazione Base:
```
Bot Token: 123456789:AABBccDDeeFFggHHiiJJkkLLmmNNooP
Bot Username: easycashflows_demo_bot
Webhook URL: https://IL-TUO-REPLIT-URL.replit.app/api/telegram/webhook
Webhook Secret: genera_password_sicura_123
```

#### Aggiornamenti Consentiti:
```
☑️ message (messaggi normali)
☑️ edited_message (messaggi modificati)
☑️ callback_query (pulsanti inline)
☑️ inline_query (query inline)
```

#### Orari di Servizio:
```
Abilita Orari: ☑️
Inizio: 09:00
Fine: 18:00
Giorni: Lun-Ven
```

#### AI e Risposte:
```
Abilita Auto-Reply: ☑️
Abilita AI: ☑️
Modello AI: gpt-4o
Prompt Sistema: "Sei l'assistente virtuale di EasyCashFlows..."
```

## 🌐 Passo 3: Impostazione Webhook

### URL Webhook Completo
```
https://3cccf94e-2616-47c3-b64a-c2e21fd67b75-00-2zwko4zrx4amo.spock.replit.dev/api/telegram/webhook
```

### Comando BotFather per Webhook
```
/setwebhook
URL: https://IL-TUO-REPLIT-URL.replit.app/api/telegram/webhook
```

### Test Connessione
1. Clicca **"Test Connessione"** nel pannello
2. Verifica che mostri: ✅ Bot attivo e funzionante

## 💬 Passo 4: Test del Bot

### Test Base
1. Cerca il tuo bot su Telegram: `@easycashflows_demo_bot`
2. Scrivi `/start`
3. Il bot dovrebbe rispondere automaticamente

### Test Notifiche
1. Vai alla sezione **Movimenti** del sistema
2. Crea un nuovo movimento finanziario
3. Il bot dovrebbe inviare una notifica automaticamente

## 🔔 Integrazione Centro Notifiche

### Funzionalità Implementate:
- ✅ **Webhook ricevuta automatica** per nuovi messaggi
- ✅ **Notifiche push** nel centro notifiche per ogni messaggio
- ✅ **AI automatica** per risposte intelligenti
- ✅ **Template personalizzati** per diversi tipi di messaggi
- ✅ **Orari di servizio** configurabili
- ✅ **Statistiche dettagliate** di utilizzo

### Tipi di Notifica:
```
🔵 TELEGRAM_MESSAGE_RECEIVED - Nuovo messaggio ricevuto
🔵 TELEGRAM_MESSAGE_SENT - Messaggio inviato con successo
🔵 TELEGRAM_ERROR - Errore nell'invio/ricezione
🔵 TELEGRAM_WEBHOOK - Webhook ricevuto
```

## 🎯 Template di Esempio

### Template Benvenuto:
```
🤖 *Benvenuto in EasyCashFlows!*

Sono il tuo assistente virtuale per la gestione finanziaria.

Posso aiutarti con:
• 💰 Informazioni sui movimenti
• 📊 Report finanziari
• ⚙️ Configurazioni sistema
• 🔔 Notifiche personalizzate

Scrivi /help per vedere tutti i comandi disponibili!
```

### Template Notifica Movimento:
```
💼 *Nuovo Movimento Finanziario*

**Tipo:** {{movement_type}}
**Importo:** €{{amount}}
**Data:** {{date}}
**Descrizione:** {{description}}

_Movimento registrato con successo nel sistema._
```

## 🛠️ Risoluzione Problemi

### Bot non risponde:
1. Verifica che il token sia corretto
2. Controlla che il webhook sia impostato
3. Testa la connessione dal pannello admin

### Webhook non funziona:
1. Verifica l'URL pubblico di Replit
2. Controlla i log del server
3. Assicurati che il secret sia configurato

### Notifiche non arrivano:
1. Verifica gli orari di servizio
2. Controlla le impostazioni AI
3. Testa con un messaggio diretto al bot

## 🔍 Debug e Log

### Endpoint di Test Disponibili:
```
GET /api/telegram/settings - Configurazioni attuali
POST /api/telegram/test - Test connessione
GET /api/telegram/stats - Statistiche bot
GET /api/telegram/chats - Chat attive
```

### Comandi Debug BotFather:
```
/mybots - I tuoi bot
/deletebot - Cancella bot (solo se necessario)
/token - Rigenera token (solo se compromesso)
```

## ✅ Checklist Finale

- [ ] Bot creato su BotFather
- [ ] Token inserito nel sistema
- [ ] Webhook configurato
- [ ] Test connessione superato
- [ ] Bot risponde a `/start`
- [ ] Notifiche nel centro notifiche attive
- [ ] AI configurata e funzionante
- [ ] Template personalizzati creati
- [ ] Orari di servizio impostati

## 🎉 La Tua Demo è Pronta!

Ora puoi:
1. **Ricevere messaggi** direttamente nel centro notifiche
2. **Rispondere automaticamente** con AI
3. **Inviare notifiche** per eventi di sistema
4. **Gestire template** personalizzati
5. **Monitorare statistiche** di utilizzo

---
*Per supporto: controlla i log del server o testa gli endpoint API*