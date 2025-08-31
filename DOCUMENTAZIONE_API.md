# 🔌 **DOCUMENTAZIONE API EASYCASHFLOWS**
*Riferimento Completo API e Integrazioni*

---

## 🎯 **PANORAMICA API**

EasyCashFlows espone un'API REST completa che consente l'integrazione con sistemi esterni, sviluppo di applicazioni personalizzate, e automazione dei processi business. L'API è progettata seguendo standard REST e utilizza autenticazione sicura.

### **Caratteristiche API**
- ✅ **RESTful Design**: Architettura REST standard
- ✅ **JSON Response**: Tutte le risposte in formato JSON
- ✅ **Authentication**: Autenticazione basata su sessioni sicure
- ✅ **Rate Limiting**: Protezione contro abuso API
- ✅ **Error Handling**: Gestione errori standardizzata
- ✅ **Versioning**: Supporto versioning per backward compatibility

### **Base URL**
```
Development: https://your-app.replit.dev/api
Production:  https://easycashflows.yourdomain.com/api
```

---

## 🔐 **AUTENTICAZIONE E SICUREZZA**

### **Session-Based Authentication**
```typescript
// Login Request
POST /api/auth/login
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}

// Response Success
{
  "user": {
    "id": "uuid-string",
    "username": "username",
    "email": "email@domain.com",
    "role": "admin|finance|user",
    "firstName": "Nome",
    "lastName": "Cognome"
  }
}
```

### **Authorization Headers**
```typescript
// Tutte le richieste autenticate richiedono:
Cookie: connect.sid=session-token

// Rate Limiting Headers in Response:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### **Error Responses Standard**
```typescript
// Formato errore standardizzato
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "timestamp": "2025-08-31T10:30:00Z",
  "path": "/api/endpoint",
  "details": {
    "field": "validation error details"
  }
}

// HTTP Status Codes Utilizzati:
200 - Success
201 - Created
400 - Bad Request (validation errors)
401 - Unauthorized (authentication required)
403 - Forbidden (insufficient permissions)
404 - Not Found
429 - Too Many Requests (rate limit)
500 - Internal Server Error
```

---

## 👤 **API AUTENTICAZIONE**

### **Auth Endpoints**

#### **POST /api/auth/login**
Autenticazione utente nel sistema.

```typescript
Request:
{
  "username": "string (required)",
  "password": "string (required)"
}

Response Success (200):
{
  "user": {
    "id": "string",
    "username": "string", 
    "email": "string",
    "role": "admin|finance|user",
    "firstName": "string",
    "lastName": "string",
    "isFirstAccess": boolean,
    "lastLogin": "ISO date string"
  }
}

Response Error (401):
{
  "error": "Credenziali non valide"
}
```

#### **POST /api/auth/logout**
Logout utente e invalidazione sessione.

```typescript
Request: No body required

Response Success (200):
{
  "message": "Logout effettuato con successo"
}
```

#### **GET /api/auth/user**
Ottieni informazioni utente corrente autenticato.

```typescript
Response Success (200):
{
  "user": {
    "id": "string",
    "username": "string",
    "email": "string", 
    "role": "admin|finance|user",
    "firstName": "string",
    "lastName": "string",
    "resourceId": "string|null"
  }
}

Response Error (401):
{
  "error": "Non autenticato"
}
```

#### **POST /api/auth/forgot-password**
Richiesta reset password.

```typescript
Request:
{
  "username": "string (required)"
}

Response Success (200):
{
  "message": "Email di reset inviata se l'utente esiste"
}
```

#### **POST /api/auth/reset-password**
Reset password con token.

```typescript
Request:
{
  "token": "string (required)",
  "newPassword": "string (required, min 8 chars)"
}

Response Success (200):
{
  "message": "Password aggiornata con successo"
}
```

---

## 💰 **API MOVIMENTI FINANZIARI**

### **Movement Endpoints**

#### **GET /api/movements**
Lista movimenti con filtri opzionali.

```typescript
Query Parameters:
- companyId?: string - Filtra per azienda
- startDate?: string - Data inizio (ISO format)
- endDate?: string - Data fine (ISO format)  
- type?: 'income'|'expense'|'transfer' - Tipo movimento
- minAmount?: number - Importo minimo
- maxAmount?: number - Importo massimo
- page?: number - Pagina (default: 1)
- limit?: number - Elementi per pagina (default: 50, max: 200)

Response Success (200):
{
  "movements": [
    {
      "id": "string",
      "amount": number,
      "movementDate": "ISO date",
      "type": "income|expense|transfer",
      "description": "string",
      "documentNumber": "string|null",
      "company": {
        "id": "string",
        "name": "string"
      },
      "iban": {
        "id": "string", 
        "iban": "string",
        "bankName": "string"
      },
      "supplier": {
        "id": "string",
        "name": "string"
      } | null,
      "customer": {
        "id": "string", 
        "name": "string"
      } | null,
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ],
  "pagination": {
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
  }
}
```

#### **POST /api/movements**
Crea nuovo movimento finanziario.

```typescript
Request:
{
  "amount": number (required, > 0),
  "movementDate": "ISO date string (required)",
  "type": "income|expense|transfer (required)",
  "description": "string (required, max 500 chars)",
  "documentNumber": "string (optional)",
  "companyId": "string (required)",
  "ibanId": "string (required)",
  "supplierId": "string (optional)",
  "customerId": "string (optional)",
  "resourceId": "string (optional)",
  "reasonId": "string (optional)",
  "statusId": "string (optional)",
  "tags": ["string"] (optional),
  "notes": "string (optional)",
  "vatAmount": number (optional),
  "vatRate": number (optional)
}

Response Success (201):
{
  "movement": {
    "id": "string",
    "amount": number,
    // ... tutti i campi movimento
  }
}

Response Error (400):
{
  "error": "Validation error message",
  "details": {
    "amount": "Amount must be greater than 0",
    "companyId": "Company ID is required"
  }
}
```

#### **PUT /api/movements/:id**
Aggiorna movimento esistente.

```typescript
Request:
{
  // Tutti i campi opzionali, solo quelli forniti vengono aggiornati
  "amount": number (optional),
  "description": "string (optional)",
  // ... altri campi
}

Response Success (200):
{
  "movement": {
    // movimento aggiornato completo
  }
}

Response Error (404):
{
  "error": "Movimento non trovato"
}
```

#### **DELETE /api/movements/:id**
Elimina movimento (soft delete).

```typescript
Response Success (200):
{
  "message": "Movimento eliminato con successo"
}

Response Error (403):
{
  "error": "Permessi insufficienti per eliminare questo movimento"
}
```

---

## 🏢 **API GESTIONE AZIENDE**

### **Company Endpoints**

#### **GET /api/companies**
Lista tutte le aziende accessibili all'utente.

```typescript
Response Success (200):
{
  "companies": [
    {
      "id": "string",
      "name": "string",
      "legalForm": "string",
      "address": "string",
      "city": "string",
      "zipCode": "string",
      "country": "string",
      "email": "string",
      "taxCode": "string",
      "vatNumber": "string",
      "isActive": boolean,
      "createdAt": "ISO date"
    }
  ]
}
```

#### **POST /api/companies**
Crea nuova azienda (Solo Admin).

```typescript
Request:
{
  "name": "string (required)",
  "legalForm": "string (required)",
  "address": "string (required)", 
  "city": "string (required)",
  "zipCode": "string (required)",
  "country": "string (default: Italia)",
  "email": "string (optional)",
  "taxCode": "string (optional)",
  "vatNumber": "string (optional)",
  "adminContact": "string (optional)",
  "notes": "string (optional)"
}

Response Success (201):
{
  "company": {
    "id": "string",
    // ... tutti i campi azienda
  }
}
```

#### **GET /api/companies/:id/stats**
Statistiche finanziarie azienda.

```typescript
Query Parameters:
- period?: 'today'|'week'|'month'|'quarter'|'year'
- startDate?: string (ISO date)
- endDate?: string (ISO date)

Response Success (200):
{
  "stats": {
    "totalIncome": number,
    "totalExpenses": number,
    "netCashFlow": number,
    "movementCount": number,
    "averageMovementAmount": number,
    "largestMovement": {
      "amount": number,
      "description": "string",
      "date": "ISO date"
    },
    "monthlyTrend": [
      {
        "month": "2025-01",
        "income": number,
        "expenses": number,
        "netFlow": number
      }
    ]
  }
}
```

---

## 🏦 **API GESTIONE IBAN**

### **IBAN Endpoints**

#### **GET /api/ibans**
Lista IBAN per aziende accessibili.

```typescript
Query Parameters:
- companyId?: string - Filtra per azienda specifica

Response Success (200):
{
  "ibans": [
    {
      "id": "string",
      "iban": "string",
      "bankName": "string", 
      "bankCode": "string",
      "description": "string",
      "companyId": "string",
      "company": {
        "id": "string",
        "name": "string"
      },
      "apiProvider": "string|null",
      "autoSyncEnabled": boolean,
      "lastSyncDate": "ISO date|null",
      "isActive": boolean
    }
  ]
}
```

#### **POST /api/ibans**
Crea nuovo IBAN (Admin/Finance).

```typescript
Request:
{
  "iban": "string (required, formato IBAN valido)",
  "bankName": "string (required)",
  "bankCode": "string (optional)",
  "description": "string (optional)",
  "companyId": "string (required)",
  "apiProvider": "string (optional)",
  "autoSyncEnabled": boolean (default: false),
  "syncFrequency": "hourly|daily|weekly (default: daily)"
}

Response Success (201):
{
  "iban": {
    "id": "string",
    // ... tutti i campi IBAN
  }
}
```

#### **POST /api/ibans/:id/sync**
Sincronizzazione manuale movimenti IBAN.

```typescript
Request:
{
  "startDate": "ISO date (optional)",
  "endDate": "ISO date (optional)"
}

Response Success (200):
{
  "syncResult": {
    "newMovements": number,
    "updatedMovements": number,
    "duplicatesSkipped": number,
    "errors": number,
    "lastSyncDate": "ISO date"
  }
}
```

---

## 🧾 **API FATTURAZIONE ELETTRONICA**

### **Invoice Endpoints**

#### **POST /api/invoices/upload**
Upload fattura XML FatturaPA.

```typescript
Request: multipart/form-data
- file: XML file (required)
- companyId: string (required)
- autoCreateMovement: boolean (default: true)

Response Success (201):
{
  "invoice": {
    "id": "string",
    "fileName": "string",
    "supplier": {
      "vatNumber": "string",
      "name": "string",
      "address": "string"
    },
    "customer": {
      "vatNumber": "string", 
      "name": "string"
    },
    "amounts": {
      "taxableAmount": number,
      "vatAmount": number,
      "totalAmount": number
    },
    "documentNumber": "string",
    "documentDate": "ISO date",
    "dueDate": "ISO date",
    "parsedAt": "ISO date"
  },
  "suggestedMovement": {
    "amount": number,
    "type": "income|expense",
    "description": "string",
    "supplier": "string|null"
  } | null
}
```

#### **GET /api/invoices**
Lista fatture processate.

```typescript
Query Parameters:
- companyId?: string
- startDate?: string (ISO date)
- endDate?: string (ISO date)
- supplier?: string - Cerca per nome fornitore
- page?: number
- limit?: number

Response Success (200):
{
  "invoices": [
    {
      "id": "string",
      "fileName": "string",
      "supplier": {
        "vatNumber": "string",
        "name": "string"
      },
      "totalAmount": number,
      "documentDate": "ISO date",
      "status": "pending|processed|error",
      "linkedMovementId": "string|null"
    }
  ],
  "pagination": {
    "total": number,
    "page": number, 
    "limit": number,
    "totalPages": number
  }
}
```

---

## 📊 **API ANALYTICS E REPORTING**

### **Analytics Endpoints**

#### **GET /api/analytics/dashboard**
Dati dashboard principale.

```typescript
Query Parameters:
- companyId?: string - Specifica azienda
- period?: 'today'|'week'|'month'|'quarter'|'year'

Response Success (200):
{
  "dashboard": {
    "totalBalance": number,
    "monthlyIncome": number,
    "monthlyExpenses": number, 
    "netCashFlow": number,
    "pendingPayments": number,
    "overduePayments": number,
    "trends": {
      "cashFlowTrend": [
        {
          "date": "ISO date",
          "income": number,
          "expenses": number,
          "balance": number
        }
      ],
      "categoryBreakdown": [
        {
          "category": "string",
          "amount": number,
          "percentage": number
        }
      ]
    }
  }
}
```

#### **GET /api/analytics/cash-flow**
Analisi cash flow avanzata.

```typescript
Query Parameters:
- companyId: string (required)
- startDate: string (ISO date, required)
- endDate: string (ISO date, required)
- granularity: 'daily'|'weekly'|'monthly' (default: daily)

Response Success (200):
{
  "cashFlow": {
    "summary": {
      "totalIncome": number,
      "totalExpenses": number,
      "netFlow": number,
      "averageDailyFlow": number
    },
    "timeline": [
      {
        "date": "ISO date",
        "income": number,
        "expenses": number,
        "netFlow": number,
        "cumulativeFlow": number
      }
    ],
    "predictions": [
      {
        "date": "ISO date",
        "predictedIncome": number,
        "predictedExpenses": number,
        "confidence": number
      }
    ]
  }
}
```

#### **POST /api/analytics/custom-report**
Genera report personalizzato.

```typescript
Request:
{
  "name": "string (required)",
  "filters": {
    "companyIds": ["string"],
    "dateRange": {
      "start": "ISO date",
      "end": "ISO date"
    },
    "amountRange": {
      "min": number,
      "max": number
    },
    "types": ["income", "expense", "transfer"],
    "categories": ["string"]
  },
  "groupBy": ["date", "company", "type", "category"],
  "metrics": ["sum", "count", "average", "min", "max"],
  "format": "json|csv|excel|pdf"
}

Response Success (200):
{
  "report": {
    "id": "string",
    "name": "string",
    "data": [
      {
        "group": "string",
        "sum": number,
        "count": number,
        "average": number
      }
    ],
    "downloadUrl": "string (se format != json)"
  }
}
```

---

## 🤖 **API INTELLIGENZA ARTIFICIALE**

### **AI Assistant Endpoints**

#### **POST /api/ai/chat**
Chat con AI Assistant.

```typescript
Request:
{
  "message": "string (required)",
  "context": {
    "companyId": "string (optional)",
    "conversationId": "string (optional)"
  }
}

Response Success (200):
{
  "response": {
    "message": "string",
    "conversationId": "string",
    "suggestions": [
      {
        "text": "string",
        "action": "string",
        "confidence": number
      }
    ],
    "data": {
      // Eventuali dati strutturati (grafici, tabelle)
    }
  }
}
```

#### **POST /api/ai/analyze-document**
Analisi automatica documento con AI.

```typescript
Request: multipart/form-data
- file: Document file (PDF, image, XML)
- documentType: 'invoice'|'receipt'|'contract'|'generic'
- companyId: string (required)

Response Success (200):
{
  "analysis": {
    "documentType": "string",
    "extractedData": {
      "supplier": {
        "name": "string",
        "vatNumber": "string",
        "address": "string"
      },
      "amounts": {
        "taxableAmount": number,
        "vatAmount": number,
        "totalAmount": number
      },
      "dates": {
        "documentDate": "ISO date",
        "dueDate": "ISO date"
      },
      "documentNumber": "string"
    },
    "confidence": number,
    "suggestedMovement": {
      "amount": number,
      "type": "income|expense",
      "description": "string"
    }
  }
}
```

#### **GET /api/ai/insights/:companyId**
Insights AI per azienda specifica.

```typescript
Query Parameters:
- period?: 'month'|'quarter'|'year'
- includePrections?: boolean

Response Success (200):
{
  "insights": {
    "cashFlowHealth": {
      "score": number (0-100),
      "status": "excellent|good|warning|critical",
      "recommendations": ["string"]
    },
    "spendingPatterns": [
      {
        "category": "string",
        "trend": "increasing|decreasing|stable",
        "changePercentage": number,
        "recommendation": "string"
      }
    ],
    "anomalies": [
      {
        "type": "unusual_amount|timing|frequency",
        "description": "string", 
        "movementId": "string",
        "severity": "low|medium|high"
      }
    ],
    "predictions": {
      "nextMonth": {
        "predictedIncome": number,
        "predictedExpenses": number,
        "confidence": number
      }
    }
  }
}
```

---

## 📞 **API COMUNICAZIONI MULTI-CANALE**

### **WhatsApp API**

#### **POST /api/whatsapp/send-message**
Invia messaggio WhatsApp.

```typescript
Request:
{
  "to": "string (required, formato +39XXXXXXXXX)",
  "templateId": "string (required)",
  "variables": {
    "customerName": "string",
    "amount": "string", 
    "dueDate": "string",
    "companyName": "string"
  },
  "companyId": "string (required)"
}

Response Success (200):
{
  "message": {
    "id": "string",
    "sid": "string (Twilio Message SID)",
    "status": "queued|sending|sent|delivered|failed",
    "to": "string",
    "templateUsed": "string",
    "sentAt": "ISO date"
  }
}
```

#### **GET /api/whatsapp/templates**
Lista template WhatsApp approvati.

```typescript
Response Success (200):
{
  "templates": [
    {
      "id": "string",
      "contentSid": "string",
      "friendlyName": "string",
      "language": "string",
      "status": "approved|pending|rejected",
      "variables": [
        {
          "name": "string",
          "type": "string|number|date",
          "required": boolean
        }
      ],
      "category": "string"
    }
  ]
}
```

### **SMS API**

#### **POST /api/sms/send**
Invia SMS.

```typescript
Request:
{
  "to": "string (required)",
  "message": "string (required, max 160 chars)",
  "qualityType": "GP|TI|SI (default: TI)",
  "scheduledDate": "ISO date (optional)"
}

Response Success (200):
{
  "sms": {
    "id": "string",
    "status": "sent|scheduled|failed",
    "to": "string",
    "message": "string",
    "cost": number,
    "sentAt": "ISO date"
  }
}
```

### **Email API**

#### **POST /api/email/send**
Invia email.

```typescript
Request:
{
  "to": "string (required)",
  "subject": "string (required)",
  "templateId": "string (optional)",
  "dynamicData": {
    "customerName": "string",
    "amount": "string",
    // ... altre variabili template
  },
  "attachments": [
    {
      "filename": "string",
      "content": "base64 string",
      "type": "application/pdf|image/jpeg|..."
    }
  ]
}

Response Success (200):
{
  "email": {
    "id": "string", 
    "messageId": "string (SendGrid Message ID)",
    "status": "sent|queued|failed",
    "to": "string",
    "subject": "string",
    "sentAt": "ISO date"
  }
}
```

---

## 📅 **API CALENDARIO**

### **Calendar Integration Endpoints**

#### **GET /api/calendar/events**
Lista eventi calendario.

```typescript
Query Parameters:
- provider: 'google'|'outlook' (required)
- startDate: string (ISO date, required)
- endDate: string (ISO date, required)
- calendarId?: string

Response Success (200):
{
  "events": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "startDate": "ISO date",
      "endDate": "ISO date",
      "attendees": [
        {
          "email": "string",
          "name": "string",
          "status": "accepted|declined|tentative|pending"
        }
      ],
      "location": "string",
      "provider": "google|outlook"
    }
  ]
}
```

#### **POST /api/calendar/create-event**
Crea nuovo evento calendario.

```typescript
Request:
{
  "provider": "google|outlook (required)",
  "title": "string (required)",
  "description": "string (optional)",
  "startDate": "ISO date (required)",
  "endDate": "ISO date (required)",
  "attendees": [
    {
      "email": "string (required)",
      "name": "string (optional)"
    }
  ],
  "location": "string (optional)",
  "reminder": {
    "minutes": number (default: 15),
    "method": "email|popup"
  }
}

Response Success (201):
{
  "event": {
    "id": "string",
    "calendarEventId": "string",
    "meetingUrl": "string (optional)",
    // ... altri dettagli evento
  }
}
```

---

## 🔔 **API NOTIFICHE**

### **Notification Endpoints**

#### **GET /api/notifications**
Lista notifiche utente corrente.

```typescript
Query Parameters:
- category?: 'movement'|'whatsapp'|'sms'|'email'|'system'
- isRead?: boolean
- page?: number
- limit?: number

Response Success (200):
{
  "notifications": [
    {
      "id": "string",
      "type": "string",
      "category": "string",
      "title": "string",
      "message": "string",
      "actionUrl": "string|null",
      "isRead": boolean,
      "priority": "low|medium|high|urgent",
      "createdAt": "ISO date"
    }
  ],
  "unreadCount": number
}
```

#### **PUT /api/notifications/:id/read**
Marca notifica come letta.

```typescript
Response Success (200):
{
  "message": "Notifica marcata come letta"
}
```

#### **POST /api/notifications/mark-all-read**
Marca tutte notifiche come lette.

```typescript
Request:
{
  "category": "string (optional)" // Marca solo categoria specifica
}

Response Success (200):
{
  "markedCount": number
}
```

---

## ⚙️ **API CONFIGURAZIONI SISTEMA**

### **Settings Endpoints (Solo Admin)**

#### **GET /api/settings/general**
Configurazioni generali sistema.

```typescript
Response Success (200):
{
  "settings": {
    "systemName": "string",
    "defaultLanguage": "string",
    "defaultTimezone": "string",
    "dateFormat": "string",
    "numberFormat": "string",
    "defaultCurrency": "string",
    "businessHours": {
      "start": "HH:mm",
      "end": "HH:mm",
      "workDays": ["monday", "tuesday", "..."]
    }
  }
}
```

#### **PUT /api/settings/general**
Aggiorna configurazioni generali.

```typescript
Request:
{
  "systemName": "string (optional)",
  "defaultLanguage": "it|en (optional)",
  "defaultTimezone": "string (optional)",
  "dateFormat": "DD/MM/YYYY|MM/DD/YYYY|YYYY-MM-DD",
  "numberFormat": "european|american",
  "defaultCurrency": "EUR|USD|GBP"
}

Response Success (200):
{
  "settings": {
    // configurazioni aggiornate
  }
}
```

#### **GET /api/settings/security**
Configurazioni sicurezza (Solo Admin).

```typescript
Response Success (200):
{
  "security": {
    "maxLoginAttempts": number,
    "lockoutDuration": number, // secondi
    "sessionTimeout": number,  // secondi
    "passwordPolicy": {
      "minLength": number,
      "requireUppercase": boolean,
      "requireNumbers": boolean,
      "requireSymbols": boolean,
      "expireDays": number
    },
    "apiRateLimit": {
      "requestsPerMinute": number,
      "burstLimit": number
    }
  }
}
```

---

## 🔄 **API WEBHOOK E AUTOMAZIONE**

### **Webhook Configuration**

#### **POST /api/webhooks/register**
Registra nuovo webhook endpoint.

```typescript
Request:
{
  "url": "string (required, HTTPS endpoint)",
  "events": ["movement.created", "invoice.received", "payment.due"],
  "secret": "string (required, per signature verification)",
  "description": "string (optional)",
  "isActive": boolean (default: true)
}

Response Success (201):
{
  "webhook": {
    "id": "string",
    "url": "string",
    "events": ["string"],
    "isActive": boolean,
    "createdAt": "ISO date"
  }
}
```

### **Webhook Events Reference**

#### **Movement Events**
```typescript
// movement.created
{
  "event": "movement.created",
  "timestamp": "ISO date",
  "data": {
    "movement": {
      "id": "string",
      "amount": number,
      "type": "income|expense|transfer",
      "description": "string",
      "company": {
        "id": "string",
        "name": "string"
      }
    }
  }
}

// movement.updated
{
  "event": "movement.updated", 
  "timestamp": "ISO date",
  "data": {
    "movement": { /* movimento aggiornato */ },
    "changes": {
      "amount": { "old": number, "new": number },
      "description": { "old": "string", "new": "string" }
    }
  }
}
```

#### **Invoice Events**
```typescript
// invoice.received (da upload XML)
{
  "event": "invoice.received",
  "timestamp": "ISO date",
  "data": {
    "invoice": {
      "id": "string",
      "supplier": { "name": "string", "vatNumber": "string" },
      "totalAmount": number,
      "dueDate": "ISO date"
    },
    "suggestedMovement": {
      "amount": number,
      "description": "string"
    }
  }
}
```

#### **Payment Events**
```typescript
// payment.due (1 giorno prima scadenza)
{
  "event": "payment.due",
  "timestamp": "ISO date", 
  "data": {
    "movement": {
      "id": "string",
      "amount": number,
      "description": "string",
      "dueDate": "ISO date",
      "supplier": {
        "name": "string",
        "contactInfo": {
          "email": "string",
          "phone": "string"
        }
      }
    }
  }
}
```

---

## 🔌 **API INTEGRAZIONI ESTERNE**

### **Banking API Integration**

#### **POST /api/banking/connect**
Connetti conto bancario per sincronizzazione.

```typescript
Request:
{
  "ibanId": "string (required)",
  "provider": "unicredit|intesa|cbi_globe|nexi",
  "credentials": {
    "clientId": "string",
    "clientSecret": "string", 
    "certificatePath": "string (per alcuni provider)"
  },
  "sandboxMode": boolean (default: true)
}

Response Success (200):
{
  "connection": {
    "id": "string",
    "status": "connected|pending|failed",
    "consentUrl": "string (per PSD2 consent flow)",
    "expiresAt": "ISO date"
  }
}
```

#### **POST /api/banking/sync/:ibanId**
Sincronizza movimenti da banking API.

```typescript
Request:
{
  "startDate": "ISO date (optional)",
  "endDate": "ISO date (optional)", 
  "force": boolean (default: false)
}

Response Success (200):
{
  "syncResult": {
    "totalTransactions": number,
    "newMovements": number,
    "matchedMovements": number,
    "duplicatesSkipped": number,
    "errors": [
      {
        "transaction": "string",
        "error": "string"
      }
    ],
    "lastSyncDate": "ISO date"
  }
}
```

### **Invoice Provider Integration**

#### **POST /api/invoicing/providers/configure**
Configura provider fatturazione elettronica.

```typescript
Request:
{
  "companyId": "string (required)",
  "provider": "fatture_in_cloud|acube", 
  "credentials": {
    "clientId": "string",
    "clientSecret": "string",
    "redirectUri": "string"
  },
  "configuration": {
    "autoSubmitToSDI": boolean,
    "enableDigitalConservation": boolean,
    "defaultPaymentTerms": number
  }
}

Response Success (200):
{
  "provider": {
    "id": "string",
    "status": "configured|pending_auth|error",
    "authUrl": "string (per OAuth flow)",
    "capabilities": ["invoice_creation", "sdi_submission", "conservation"]
  }
}
```

---

## 📊 **API REPORTING AVANZATO**

### **Export APIs**

#### **POST /api/export/movements**
Export movimenti personalizzato.

```typescript
Request:
{
  "filters": {
    "companyIds": ["string"],
    "startDate": "ISO date",
    "endDate": "ISO date",
    "types": ["income", "expense"],
    "minAmount": number,
    "maxAmount": number
  },
  "format": "csv|excel|pdf",
  "columns": [
    "amount", "date", "description", "company",
    "iban", "supplier", "customer", "notes"
  ],
  "groupBy": "month|company|type",
  "includeCharts": boolean,
  "deliveryMethod": "download|email"
}

Response Success (200):
{
  "export": {
    "id": "string",
    "status": "processing|ready|failed",
    "downloadUrl": "string (se download)",
    "emailSent": boolean (se email),
    "recordCount": number,
    "createdAt": "ISO date"
  }
}
```

### **Scheduled Reports API**

#### **POST /api/reports/schedule**
Programma report automatico.

```typescript
Request:
{
  "name": "string (required)",
  "description": "string (optional)",
  "filters": {
    // stessi filtri di export
  },
  "schedule": {
    "frequency": "daily|weekly|monthly|quarterly",
    "dayOfWeek": number (0-6, per weekly),
    "dayOfMonth": number (1-31, per monthly),
    "time": "HH:mm"
  },
  "delivery": {
    "method": "email",
    "recipients": ["string"],
    "subject": "string"
  },
  "format": "pdf|excel|csv"
}

Response Success (201):
{
  "scheduledReport": {
    "id": "string",
    "nextRun": "ISO date",
    "isActive": boolean
  }
}
```

---

## 🔒 **API SECURITY E AUDIT**

### **Audit APIs (Solo Admin)**

#### **GET /api/audit/logs**
Log audit sistema.

```typescript
Query Parameters:
- startDate?: string (ISO date)
- endDate?: string (ISO date)
- userId?: string
- action?: string
- resource?: string
- page?: number
- limit?: number

Response Success (200):
{
  "auditLogs": [
    {
      "id": "string",
      "userId": "string",
      "user": {
        "username": "string",
        "role": "string"
      },
      "action": "string",
      "resource": "string",
      "resourceId": "string",
      "ipAddress": "string",
      "userAgent": "string",
      "details": {
        "changes": {
          "field": { "old": "value", "new": "value" }
        }
      },
      "timestamp": "ISO date"
    }
  ]
}
```

#### **GET /api/audit/security-events**
Eventi sicurezza sistema.

```typescript
Response Success (200):
{
  "securityEvents": [
    {
      "id": "string",
      "type": "failed_login|suspicious_activity|rate_limit_exceeded",
      "severity": "low|medium|high|critical",
      "description": "string",
      "ipAddress": "string",
      "userId": "string|null",
      "details": {
        "attemptCount": number,
        "location": "string"
      },
      "timestamp": "ISO date"
    }
  ]
}
```

---

## 📈 **API MONITORING E HEALTH**

### **System Health Endpoints**

#### **GET /api/health**
Health check sistema (pubblico).

```typescript
Response Success (200):
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "ISO date",
  "services": {
    "database": "healthy|unhealthy",
    "ai": "healthy|unhealthy", 
    "storage": "healthy|unhealthy",
    "communications": "healthy|unhealthy"
  },
  "version": "string"
}
```

#### **GET /api/monitoring/metrics** (Solo Admin)
Metriche dettagliate sistema.

```typescript
Response Success (200):
{
  "metrics": {
    "server": {
      "cpuUsage": number,
      "memoryUsage": number,
      "diskUsage": number,
      "uptime": number
    },
    "database": {
      "activeConnections": number,
      "slowQueries": number,
      "storage": number,
      "performance": number
    },
    "api": {
      "requestsPerMinute": number,
      "averageResponseTime": number,
      "errorRate": number
    },
    "integrations": {
      "banking": "healthy|degraded|error",
      "email": "healthy|degraded|error",
      "whatsapp": "healthy|degraded|error"
    }
  }
}
```

---

## 📚 **SDK E LIBRERIE CLIENT**

### **JavaScript/TypeScript SDK**

#### **Installazione**
```bash
npm install easycashflows-sdk
```

#### **Configurazione**
```typescript
import { EasyCashFlowsClient } from 'easycashflows-sdk';

const client = new EasyCashFlowsClient({
  baseUrl: 'https://your-instance.easycashflows.com/api',
  apiKey: 'your-api-key', // Per API key authentication
  // OR per session-based
  sessionCookie: 'connect.sid=session-token'
});
```

#### **Esempi Utilizzo**
```typescript
// Ottenere movimenti
const movements = await client.movements.list({
  companyId: 'company-uuid',
  startDate: '2025-01-01',
  endDate: '2025-01-31'
});

// Creare movimento
const movement = await client.movements.create({
  amount: 1500.00,
  type: 'expense',
  description: 'Pagamento fornitore',
  companyId: 'company-uuid',
  ibanId: 'iban-uuid'
});

// Analytics dashboard
const dashboard = await client.analytics.dashboard({
  companyId: 'company-uuid',
  period: 'month'
});

// Inviare WhatsApp
const message = await client.whatsapp.sendMessage({
  to: '+393123456789',
  templateId: 'payment_reminder',
  variables: {
    customerName: 'Mario Rossi',
    amount: '€ 1.500,00',
    dueDate: '15/09/2025'
  }
});
```

### **Python SDK**

#### **Installazione**
```bash
pip install easycashflows-python
```

#### **Configurazione**
```python
from easycashflows import EasyCashFlowsClient

client = EasyCashFlowsClient(
    base_url="https://your-instance.easycashflows.com/api",
    api_key="your-api-key"
)
```

#### **Esempi Utilizzo**
```python
# Ottenere dashboard analytics
dashboard = client.analytics.get_dashboard(
    company_id="company-uuid",
    period="month"
)

# Creare movimento bulk
movements = [
    {
        "amount": 1000.00,
        "type": "expense", 
        "description": "Stipendio gennaio",
        "company_id": "company-uuid"
    },
    # ... altri movimenti
]

results = client.movements.create_bulk(movements)

# AI Assistant
response = client.ai.chat(
    message="Analizza il cash flow dell'ultimo trimestre",
    context={"company_id": "company-uuid"}
)
```

---

## 🔄 **WEBHOOK PAYLOAD REFERENCE**

### **Signature Verification**
```typescript
// Verifica signature webhook
import crypto from 'crypto';

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}
```

### **Event Types Complete**
```typescript
// Tutti gli eventi webhook disponibili
WebhookEvents = {
  // Movimenti
  "movement.created": "Nuovo movimento creato",
  "movement.updated": "Movimento modificato", 
  "movement.deleted": "Movimento eliminato",
  
  // Fatture
  "invoice.uploaded": "Fattura XML caricata",
  "invoice.processed": "Fattura elaborata",
  "invoice.failed": "Errore elaborazione fattura",
  
  // Pagamenti
  "payment.due": "Pagamento in scadenza",
  "payment.overdue": "Pagamento scaduto",
  "payment.received": "Pagamento ricevuto",
  
  // Banking
  "banking.sync.completed": "Sincronizzazione bancaria completata",
  "banking.sync.failed": "Errore sincronizzazione bancaria",
  
  // Comunicazioni
  "whatsapp.message.sent": "Messaggio WhatsApp inviato",
  "whatsapp.message.delivered": "Messaggio WhatsApp consegnato",
  "email.sent": "Email inviata",
  "sms.sent": "SMS inviato",
  
  // Sistema
  "backup.completed": "Backup completato",
  "backup.failed": "Backup fallito",
  "security.breach": "Evento sicurezza critico",
  "user.login": "Login utente",
  "user.logout": "Logout utente"
}
```

---

## 🛡️ **RATE LIMITING E QUOTAS**

### **API Limits**
```typescript
Rate Limits per Ruolo:

Admin:
- General API: 1000 requests/hour
- Export API: 100 requests/hour
- Bulk Operations: 50 requests/hour

Finance:
- General API: 500 requests/hour
- Export API: 50 requests/hour
- Communication API: 200 requests/hour

User:
- General API: 200 requests/hour
- Read-only API: 500 requests/hour
- Communication API: 100 requests/hour
```

### **Quota Management**
```typescript
// Headers per tracking quota
X-RateLimit-Limit: 1000      // Limite orario
X-RateLimit-Remaining: 847   // Richieste rimanenti
X-RateLimit-Reset: 1640995200 // Timestamp reset
X-RateLimit-Retry-After: 3600 // Secondi per retry

// Response quando quota exceed
Status: 429 Too Many Requests
{
  "error": "Rate limit exceeded",
  "retryAfter": 3600,
  "limit": 1000,
  "remaining": 0
}
```

---

## 🧪 **TESTING E DEVELOPMENT**

### **Test Environment**

#### **Sandbox API**
```
Base URL: https://sandbox.easycashflows.com/api
Differenze:
- Dati di test pre-popolati
- Rate limits ridotti
- Email/SMS in modalità debug
- Banking API in sandbox mode
```

#### **Test Data**
```typescript
// Credenziali test disponibili
Test Users:
- admin_test / test123 (Admin)
- finance_test / test123 (Finance)  
- user_test / test123 (User)

Test Companies:
- Acme SRL (IT01234567890)
- Beta SpA (IT09876543210)

Test IBANs:
- IT60X0542811101000000123456 (Banca Test)
- IT28W8000000292100645654967 (Banca Demo)
```

### **API Testing Tools**

#### **Postman Collection**
```json
{
  "info": {
    "name": "EasyCashFlows API",
    "description": "Complete API collection for testing"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{api_token}}",
        "type": "string"
      }
    ]
  }
}
```

#### **cURL Examples**
```bash
# Login
curl -X POST https://api.easycashflows.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# Get movements
curl -X GET "https://api.easycashflows.com/movements?companyId=uuid&startDate=2025-01-01" \
  -H "Cookie: connect.sid=session-token"

# Create movement  
curl -X POST https://api.easycashflows.com/movements \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=session-token" \
  -d '{
    "amount": 1500.00,
    "type": "expense",
    "description": "Office supplies",
    "companyId": "company-uuid",
    "ibanId": "iban-uuid"
  }'
```

---

## 🚀 **INTEGRATION PATTERNS**

### **Common Integration Scenarios**

#### **CRM Integration**
```typescript
// Sync clienti da CRM esterno
POST /api/customers/bulk-sync
{
  "customers": [
    {
      "externalId": "CRM-123",
      "name": "Cliente Esempio",
      "vatNumber": "IT12345678901",
      "email": "cliente@example.com",
      "syncSource": "salesforce"
    }
  ]
}
```

#### **ERP Integration**
```typescript
// Sync movimenti verso ERP
GET /api/movements?lastSyncDate=2025-08-01T00:00:00Z
// Processo: 
// 1. Ottieni movimenti modificati
// 2. Trasforma in formato ERP
// 3. Invia a ERP
// 4. Aggiorna lastSyncDate
```

#### **Accounting Software Integration**
```typescript
// Export per commercialista
POST /api/export/accounting
{
  "format": "prima_nota", // Formato software contabile
  "period": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "chartOfAccounts": "standard|custom",
  "includeVAT": true
}
```

---

## 📞 **SUPPORTO API E TROUBLESHOOTING**

### **Common API Errors**

#### **Authentication Errors**
```typescript
401 Unauthorized:
- Causa: Session scaduta o credenziali invalide
- Soluzione: Re-autenticare via /api/auth/login

403 Forbidden:
- Causa: Permissions insufficienti per ruolo
- Soluzione: Verificare ruolo utente e permessi richiesti

400 Bad Request:
- Causa: Validation error payload
- Soluzione: Verificare formato e campi richiesti
```

#### **Rate Limiting**
```typescript
429 Too Many Requests:
- Causa: Superato rate limit per ruolo
- Soluzione: Implementare exponential backoff
- Headers: X-RateLimit-Retry-After per timing

Retry Strategy:
1. First retry: 1 second
2. Second retry: 2 seconds  
3. Third retry: 4 seconds
4. Max retries: 5
```

#### **Integration Errors**
```typescript
502 Bad Gateway:
- Causa: Provider esterno non disponibile
- Soluzione: Retry con backoff, check provider status

503 Service Unavailable:
- Causa: Manutenzione programmata sistema
- Soluzione: Check system status page

500 Internal Server Error:
- Causa: Errore interno sistema
- Soluzione: Contattare support con request ID
```

### **Support Contacts**
```
🔧 API Support: api-support@easycashflows.it
📚 Documentation: docs@easycashflows.it  
🚨 Emergency: +39 02 1234 5678
💬 Developer Chat: https://developers.easycashflows.it/chat
```

### **API Status Page**
```
🌐 Status Page: https://status.easycashflows.it
📊 Metrics: Real-time API performance
🔔 Incidents: Notifiche automatiche downtime
📅 Maintenance: Calendario manutenzioni programmate
```

---

## 📋 **API REFERENCE QUICK START**

### **Essential Endpoints**
```typescript
// Core Authentication
POST /api/auth/login           - Login al sistema
GET  /api/auth/user            - Info utente corrente
POST /api/auth/logout          - Logout

// Financial Management  
GET  /api/movements            - Lista movimenti
POST /api/movements            - Crea movimento
PUT  /api/movements/:id        - Aggiorna movimento
DELETE /api/movements/:id      - Elimina movimento

// Company Management
GET  /api/companies            - Lista aziende
POST /api/companies            - Crea azienda
GET  /api/companies/:id/stats  - Statistiche azienda

// Analytics
GET  /api/analytics/dashboard  - Dashboard dati
GET  /api/analytics/cash-flow  - Analisi cash flow
POST /api/analytics/custom-report - Report personalizzato

// Communications
POST /api/whatsapp/send-message - Invia WhatsApp
POST /api/sms/send             - Invia SMS  
POST /api/email/send           - Invia Email

// AI Assistant
POST /api/ai/chat              - Chat con AI
POST /api/ai/analyze-document  - Analizza documento
GET  /api/ai/insights/:id      - Insights AI
```

---

*Documentazione API v3.0 - Ultima revisione: Agosto 2025*  
*© EasyCashFlows - API Reference Complete per Sviluppatori*