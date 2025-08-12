# DEPLOY STRATEGY CORRETTA: REPLIT → PRODUCTION

## Problema Identificato
Stiamo facendo troppe modifiche manuali sul server di produzione invece di copiare il sistema funzionante da Replit.

## Strategia Corretta
1. **Copia codice completo** da Replit (funzionante)
2. **Migra database** con dati reali 
3. **Solo piccoli fix ambiente** (NODE_ENV, DATABASE_URL)

## Procedura Dettagliata

### STEP 1: BACKUP ATTUALE
```bash
cd /var/www
cp -r cashflows cashflows.backup.$(date +%s)
```

### STEP 2: STOP SERVIZI ATTUALI
```bash
pkill -f tsx
pkill -f node
```

### STEP 3: COPIA CODICE DA REPLIT
```bash
# Se hai repository GitHub aggiornato:
cd /var/www/cashflows
git pull origin main

# OPPURE se hai archive locale:
cd /var/www
rm -rf cashflows
unzip easycashflows-complete.tar.gz
mv easycashflows-complete cashflows
```

### STEP 4: EXPORT DATABASE DA REPLIT
Su Replit, esegui:
```bash
# Connetti a database Neon e esporta
pg_dump $DATABASE_URL > production_data.sql
```

### STEP 5: IMPORT DATABASE SU PRODUZIONE
```bash
cd /var/www/cashflows
PGPASSWORD='EasyFlows2025!' psql -h localhost -U easycashflows_user -d easycashflows < production_data.sql
```

### STEP 6: CONFIGURA ENVIRONMENT
```bash
cat > .env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://easycashflows_user:EasyFlows2025!@localhost:5432/easycashflows
PORT=5000
SESSION_SECRET=production-secret-key-2025
EOF
```

### STEP 7: INSTALLA DIPENDENZE
```bash
npm install
```

### STEP 8: START PRODUZIONE
```bash
nohup npm run dev > /var/log/easycashflows.log 2>&1 &
```

### STEP 9: VERIFICA FINALE
```bash
sleep 10
curl http://127.0.0.1:5000/api/health

# Test login con dati reali
curl -X POST http://127.0.0.1:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Vantaggi di Questa Strategia
- ✅ Codice identico a quello funzionante su Replit
- ✅ Database con dati reali e struttura corretta
- ✅ Minime modifiche = minori errori
- ✅ Deploy riproducibile e affidabile

## Prossimi Passi
1. Esegui export database da Replit
2. Copia codice aggiornato al server
3. Import database e piccoli fix ambiente
4. Test finale funzionante