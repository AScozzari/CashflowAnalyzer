# 🚀 EasyCashFlows - Deploy Automatico Ultra-Rapido

**Deploy completo in 3 comandi!** ⚡

## ⚡ Deploy Immediato (60 secondi)

```bash
# 1. Copia i file sul tuo server
git clone <repository> easycashflows
cd easycashflows

# 2. Lancia il deploy automatico
./deploy-auto.sh

# 3. Fine! 🎉
```

L'app sarà disponibile su `http://localhost:5000`

**Login**: `admin` / `admin123`

## 🗂️ File Creati per l'Automazione

### **📦 Dockerfile.auto**
- Docker image completamente automatizzata
- Auto-setup database schema
- Controlli connettività automatici
- Gestione errori intelligente

### **🐳 docker-compose.auto.yml**  
- Deploy completo con un comando
- 3 modalità: Basic, Full, Pro
- Database locale opzionale
- Reverse proxy nginx incluso

### **⚙️ .env.template**
- Template configurazione completa
- Valori di default intelligenti
- Guida integrata step-by-step

### **🚀 deploy-auto.sh**
- Script di deploy ultra-automatizzato
- Setup interattivo guidato
- Verifica stato automatica
- 3 modalità deploy

## 🎯 Modalità Deploy

### **1️⃣ BASIC - Solo App**
```bash
./deploy-auto.sh
# Scegli opzione 1
```
- Usa database esterno (Neon, AWS, ecc.)
- Deploy più veloce
- Ideale per produzione

### **2️⃣ FULL - App + Database**
```bash
./deploy-auto.sh  
# Scegli opzione 2
```
- Include PostgreSQL locale
- Tutto in Docker
- Ideale per testing/development

### **3️⃣ PRO - Setup Completo**
```bash
./deploy-auto.sh
# Scegli opzione 3
```
- App + Database + Nginx
- HTTPS ready
- Production-grade setup

## 📋 Requisiti Minimi

- **Docker** installato
- **2GB RAM** minimo
- **10GB spazio** disco
- **Connessione internet** per download immagini

## 🔧 Configurazione Rapida

### **Database Gratuito (Consigliato)**
1. Vai su [neon.tech](https://neon.tech)
2. Crea account gratuito
3. Crea database
4. Copia connection string nel file `.env`

### **Servizi Opzionali**
- **Email**: [SendGrid](https://sendgrid.com) per email automatiche
- **SMS/WhatsApp**: [Twilio](https://twilio.com) per notifiche mobile

## 🎮 Comandi Utili Post-Deploy

```bash
# Vedere logs in tempo reale
docker compose -f docker-compose.auto.yml logs -f

# Riavviare applicazione
docker compose -f docker-compose.auto.yml restart

# Fermare tutto
docker compose -f docker-compose.auto.yml down

# Aggiornare immagine
docker compose -f docker-compose.auto.yml build --no-cache
docker compose -f docker-compose.auto.yml up -d

# Backup database
docker exec easycashflows-db pg_dump -U easycashflows easycashflows > backup.sql
```

## 🔍 Troubleshooting

### **App non parte**
```bash
# Controlla logs
docker compose -f docker-compose.auto.yml logs easycashflows

# Problemi comuni:
# 1. DATABASE_URL non configurato -> Edita .env
# 2. Porta 5000 occupata -> Cambia HOST_PORT in .env  
# 3. Memoria insufficiente -> Aumenta RAM server
```

### **Database non connette**
```bash
# Test connessione database
docker exec easycashflows-auto node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(console.log).catch(console.error);
"
```

## 📚 Documentazione Completa

Dopo il deploy, trovi la documentazione completa nei file:

- **📊 DOCUMENTAZIONE_TECNICA.md** - Architettura e features
- **👥 GUIDA_UTENTE_CLIENTI.md** - Manuale utente completo  
- **👨‍💼 GUIDA_AMMINISTRATORE.md** - Gestione sistema
- **🔌 DOCUMENTAZIONE_API.md** - API e integrazioni

## 🆘 Supporto

1. **Logs**: `docker compose -f docker-compose.auto.yml logs -f`
2. **Status**: `docker compose -f docker-compose.auto.yml ps`
3. **Health**: `curl http://localhost:5000/api/auth/user`
4. **Documentazione**: Leggi i file inclusi

---

**✨ Deploy automatico creato per massima semplicità!**