# 🚀 EasyCashFlows - Guida Deployment Docker

> **Deployment industriale per clienti PMI con setup automatico del database**

## 📋 Panoramica

EasyCashFlows include un sistema di deployment automatico che:

- ✅ **Auto-crea lo schema database** su ogni nuovo account cliente
- ✅ **Migrazione automatica** via Drizzle ORM  
- ✅ **Setup dati demo** per testing immediato
- ✅ **Health check** e validazione completa
- ✅ **Nginx proxy** con HTTPS e rate limiting
- ✅ **Logging** e monitoraggio integrati

## 🔧 Setup Cliente - 3 Passi Semplici

### Passo 1: Database Neon (Gratuito)

```bash
# 1. Vai su https://neon.tech (gratuito 3GB)
# 2. Crea account e nuovo progetto "EasyCashFlows"
# 3. Ottieni la CONNECTION STRING dalla dashboard
```

### Passo 2: Configurazione Environment

```bash
# Copia file esempio
cp .env.example .env

# Modifica con i tuoi dati
nano .env
```

**Configurazione minima richiesta:**
```env
# OBBLIGATORIO - Database Neon
DATABASE_URL=postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require

# OPZIONALE - Email notifiche (SendGrid gratuito)
SENDGRID_API_KEY=SG.xxxxxxxxx

# OPZIONALE - SMS/WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxx
```

### Passo 3: Deploy con Docker

```bash
# Deploy semplice (solo app)
docker-compose up -d easycashflows

# Deploy completo (app + nginx + SSL)
docker-compose --profile proxy up -d
```

## 🎯 Accesso Immediato

**URL:** `http://localhost:5000`  
**Login:** `admin` / `admin123`

## 🔍 Verifica Deployment

```bash
# Stato containers
docker-compose ps

# Log applicazione
docker-compose logs -f easycashflows

# Health check
curl http://localhost:5000/api/auth/user
```

## 🏗️ Architettura Deployment

```mermaid
graph TB
    A[Docker Compose] --> B[EasyCashFlows App]
    A --> C[Nginx Proxy]
    B --> D[Neon Database]
    
    B --> E[Auto Schema Migration]
    B --> F[Demo Data Setup]
    B --> G[Health Validation]
    
    C --> H[SSL Termination]
    C --> I[Rate Limiting]
    C --> J[Static Caching]
```

## 📊 Schema Database - Creazione Automatica

Lo script `deploy-docker.ts` crea automaticamente:

### Tabelle Core Business
- **companies** - Ragioni sociali
- **users** - Utenti e permessi
- **movements** - Movimenti finanziari
- **suppliers/customers** - Fornitori/clienti

### Tabelle Sistema
- **neon_settings** - Configurazione Neon DB
- **ai_settings** - Configurazione OpenAI
- **whatsapp_settings** - Configurazione comunicazioni

### Tabelle Sicurezza
- **login_audit_log** - Audit accessi
- **security_settings** - Impostazioni sicurezza
- **active_sessions** - Sessioni attive

## 🔧 Troubleshooting

### Errore: "DATABASE_URL must be set"
```bash
# Verifica file .env esista e sia configurato
cat .env | grep DATABASE_URL

# Riavvia container
docker-compose restart easycashflows
```

### Errore: "Connection refused"
```bash
# Verifica connessione database
docker-compose exec easycashflows npx tsx scripts/deploy-docker.ts --validate-only

# Verifica porta disponibile
netstat -an | grep 5000
```

### Errore: "Schema creation failed"
```bash
# Forza ricreazione schema
docker-compose exec easycashflows npx tsx scripts/deploy-docker.ts --force-schema

# Controlla log dettagliati
docker-compose logs easycashflows | grep SCHEMA
```

## 🔐 Produzione - Configurazione Avanzata

### SSL Certificate Setup
```bash
# Genera certificato self-signed per test
mkdir ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem

# Per produzione usa Let's Encrypt
certbot certonly --webroot -w /var/www/certbot \
  -d tuodominio.com
```

### Environment Variables Produzione
```env
# Sicurezza
NODE_ENV=production
SKIP_DEMO=true

# Performance  
DATABASE_MAX_CONNECTIONS=20
API_RATE_LIMIT=100

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
```

### Backup Automatico
```bash
# Backup database via script incluso
docker-compose exec easycashflows npm run backup

# Backup via cron (ogni notte alle 2:00)
0 2 * * * docker-compose exec easycashflows npm run backup
```

## 📈 Monitoraggio e Metriche

### Health Check Integrato
```bash
# Endpoint health check
GET /api/auth/user

# Risposta OK (200)
{"error": "Non autenticato"}

# Risposta ERRORE (500/timeout)
Service unavailable
```

### Log Structure
```bash
# Log applicazione
docker-compose logs easycashflows

# Log nginx (se abilitato)
docker-compose logs nginx

# Log database deployment
docker-compose exec easycashflows cat /app/logs/deployment.log
```

## 🚀 Scaling e Performance

### Replica Database (Multi-tenant)
```yaml
# docker-compose.override.yml
services:
  easycashflows-client2:
    extends: easycashflows
    environment:
      - DATABASE_URL=${CLIENT2_DATABASE_URL}
      - PORT=5001
    ports:
      - "5001:5001"
```

### Load Balancer
```nginx
upstream easycashflows_cluster {
    server easycashflows-app:5000;
    server easycashflows-client2:5001;
    keepalive 32;
}
```

## 🎯 Esempio Completo - Deploy Cliente

```bash
#!/bin/bash
# Deploy script completo per nuovo cliente

set -e

echo "🚀 Deploy EasyCashFlows per nuovo cliente"

# 1. Setup environment
cp .env.example .env
echo "✅ Configura DATABASE_URL in .env e premi ENTER"
read

# 2. Verifica configurazione
if ! grep -q "DATABASE_URL=" .env; then
    echo "❌ DATABASE_URL non configurato"
    exit 1
fi

# 3. Deploy
docker-compose up -d easycashflows

# 4. Attendi avvio
echo "⏳ Attendo avvio applicazione..."
sleep 30

# 5. Health check
if curl -f http://localhost:5000/api/auth/user > /dev/null 2>&1; then
    echo "✅ EasyCashFlows avviato con successo!"
    echo "🌐 Accesso: http://localhost:5000"
    echo "👤 Login: admin / admin123"
else
    echo "❌ Errore durante l'avvio"
    docker-compose logs easycashflows
    exit 1
fi
```

## 📚 Risorse Aggiuntive

- **Neon Database:** https://neon.tech/docs
- **SendGrid Setup:** https://docs.sendgrid.com/for-developers/sending-email/api-getting-started  
- **Twilio WhatsApp:** https://www.twilio.com/docs/whatsapp
- **Docker Compose:** https://docs.docker.com/compose/

---

> 💡 **Supporto Tecnico:** Per assistenza contatta il team EasyCashFlows

**Sistema testato con:**
- ✅ Docker 24.0+
- ✅ Docker Compose 2.20+  
- ✅ Ubuntu 20.04/22.04
- ✅ CentOS 8/9
- ✅ Debian 11/12