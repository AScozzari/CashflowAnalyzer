# ⚡ EasyCashFlows - Quick Start Cliente

> **Setup in 5 minuti per clienti business**

## 🎯 Cosa Ti Serve

1. **Account Neon** (gratuito 3GB) → https://neon.tech
2. **Docker** installato sul tuo server
3. **5 minuti** del tuo tempo

## 🚀 Setup Immediato

### 1. Database Gratuito (2 minuti)

```bash
# Vai su https://neon.tech
# → Registrati (gratuito)
# → Crea progetto "EasyCashFlows"
# → Copia la Connection String
```

**Example:** `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`

### 2. Download e Configurazione (1 minuto)

```bash
# Download progetto
git clone https://github.com/tuouser/easycashflows.git
cd easycashflows

# Configura database
cp .env.example .env
nano .env  # Incolla la tua DATABASE_URL
```

### 3. Avvio Automatico (2 minuti)

```bash
# Avvia tutto
docker-compose up -d

# Verifica sia attivo
curl http://localhost:5000
```

## 🎉 Pronto! 

**URL:** http://localhost:5000  
**Login:** `admin` / `admin123`

---

## 📧 Setup Email (Opzionale - 3 minuti)

Per notifiche email automatiche:

```bash
# 1. Vai su https://sendgrid.com (100 email gratis/giorno)
# 2. Crea API Key
# 3. Aggiungi a .env:
echo "SENDGRID_API_KEY=SG.xxxxxxxxx" >> .env

# 4. Riavvia
docker-compose restart
```

## 📱 Setup WhatsApp Business (Opzionale - 5 minuti)

Per messaggi WhatsApp automatici:

```bash
# 1. Vai su https://twilio.com/whatsapp
# 2. Ottieni Account SID e Auth Token
# 3. Aggiungi a .env:
echo "TWILIO_ACCOUNT_SID=ACxxxxxxxxx" >> .env
echo "TWILIO_AUTH_TOKEN=xxxxxxxxx" >> .env

# 4. Riavvia
docker-compose restart
```

---

## ❓ Problemi?

### App non si avvia
```bash
# Controlla log
docker-compose logs

# Verifica database
ping ep-xxx.eu-central-1.aws.neon.tech
```

### Porta 5000 occupata
```bash
# Usa porta diversa
echo "PORT=3000" >> .env
docker-compose restart
```

### Errore permessi
```bash
# Fix Docker permissions
sudo chown -R $USER:$USER .
```

---

## 🔧 Comandi Utili

```bash
# Stato applicazione
docker-compose ps

# Riavvio completo
docker-compose restart

# Update applicazione
git pull
docker-compose build --no-cache
docker-compose up -d

# Backup database
docker-compose exec easycashflows npm run backup

# Log live
docker-compose logs -f
```

---

## 📞 Supporto

**Email:** support@easycashflows.com  
**Telefono:** +39 02 1234 5678  
**Chat:** Disponibile nell'app

---

> ✅ **Garanzia:** Setup funzionante in 5 minuti o ti aiutiamo personalmente