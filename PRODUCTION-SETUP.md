# EasyCashFlows - Guida Setup Produzione

## Setup Iniziale Server

### 1. Preparazione Server (Eseguire come root)
```bash
# Dal tuo terminale locale
./server-setup.sh
```

### 2. Configurazione Database PostgreSQL
```bash
# Accedi al server
ssh antonio@217.64.206.247

# Configura PostgreSQL
sudo -u postgres psql
CREATE DATABASE easycashflows;
CREATE USER easycashflows_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE easycashflows TO easycashflows_user;
\q
```

### 3. Configurazione File .env
```bash
# Sul server, crea il file .env
cd /var/www/cashflows
nano .env
```

Inserisci questa configurazione (sostituisci i valori):
```env
DATABASE_URL="postgresql://easycashflows_user:your_secure_password@localhost:5432/easycashflows"
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
SESSION_SECRET="your-super-secret-session-key-minimum-32-characters"
SENDGRID_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="noreply@yourdomain.com"
FROM_NAME="EasyCashFlows"
ALLOWED_ORIGINS="http://217.64.206.247:5000"
LOG_LEVEL=info
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/var/www/cashflows/uploads
BCRYPT_ROUNDS=12
JWT_EXPIRE=24h
```

### 4. Setup Database e Primo Avvio
```bash
cd /var/www/cashflows

# Installa dipendenze
npm install --production

# Esegui migrazione database
npm run db:push

# Crea utente admin iniziale
npm run seed:admin

# Avvia applicazione
./manage.sh start
```

## Deployment Quotidiano

### Processo Automatizzato
```bash
# Dal tuo ambiente locale Replit
./deploy.sh
```

### Verifiche Post-Deploy
```bash
# Controlla stato applicazione
ssh antonio@217.64.206.247 'cd /var/www/cashflows && ./manage.sh status'

# Visualizza log
ssh antonio@217.64.206.247 'cd /var/www/cashflows && ./manage.sh logs'
```

## Gestione Server

### Comandi Principali
```bash
# Avvia applicazione
./manage.sh start

# Ferma applicazione  
./manage.sh stop

# Riavvia applicazione
./manage.sh restart

# Visualizza stato
./manage.sh status

# Visualizza log
./manage.sh logs
```

### Backup Database
```bash
# Backup giornaliero (automatizzare con cron)
pg_dump easycashflows > backup_$(date +%Y%m%d).sql
```

### Monitoraggio
```bash
# Controllo processo
ps aux | grep node

# Controllo porte
netstat -tlnp | grep :5000

# Controllo spazio disco
df -h
```

## Troubleshooting

### Problema: Applicazione non si avvia
```bash
# Controlla log
./manage.sh logs

# Controlla porta occupata
lsof -i :5000

# Riavvia forzato
pm2 kill
./manage.sh start
```

### Problema: Database non raggiungibile
```bash
# Verifica PostgreSQL
sudo systemctl status postgresql
sudo systemctl restart postgresql

# Test connessione
psql -h localhost -U easycashflows_user -d easycashflows
```

### Problema: Errori di permessi
```bash
# Ripristina permessi
sudo chown -R antonio:antonio /var/www/cashflows
chmod +x /var/www/cashflows/manage.sh
```

## URL Accesso
- Applicazione: http://217.64.206.247:5000
- Credenziali Admin: admin / admin (cambiare al primo accesso)

## Note di Sicurezza
- Cambiare password database predefinite
- Configurare HTTPS con reverse proxy (nginx)
- Backup regolari database
- Monitoraggio log accessi
- Firewall hardware già presente e configurato