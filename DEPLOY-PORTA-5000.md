# Deployment EasyCashFlows - Porta 5000

## Configurazione Unificata

EasyCashFlows è ora completamente configurato per usare la **porta 5000** sia in sviluppo che in produzione.

### Sviluppo (Replit)
- ✅ Porta 5000 attiva e funzionante
- ✅ Frontend configurato per porta 5000  
- ✅ Tutte le API funzionano correttamente

### Produzione (Server Ubuntu)
- 🔄 Da configurare con porta 5000
- Script: `server-setup-porta-5000.sh`

## Deployment su Server di Produzione

### 1. Copia lo script sul server:
```bash
# Dalla tua macchina locale
scp server-setup-porta-5000.sh antonio@217.64.206.247:/tmp/
```

### 2. Esegui la configurazione:
```bash
# Connessione SSH al server
ssh antonio@217.64.206.247

# Esegui lo script di setup
bash /tmp/server-setup-porta-5000.sh
```

### 3. Accesso all'applicazione:

#### Locale (sul server):
- URL: http://localhost:5000
- Nginx: http://localhost:80

#### Esterno (tunnel SSH):
```bash
# Dal tuo PC
ssh -L 5000:localhost:5000 antonio@217.64.206.247

# Poi accedi a: http://localhost:5000
```

## Gestione Produzione

### Controllo stato:
```bash
# Sul server
tail -f /var/log/easycashflows-5000.log
ps aux | grep tsx
netstat -tlnp | grep 5000
```

### Stop/Start:
```bash
# Stop
kill $(cat /var/www/cashflows/app-5000.pid)

# Start
cd /var/www/cashflows
export NODE_ENV=production PORT=5000
export DATABASE_URL='postgresql://easycashflows_user:EasyFlows2025!@localhost:5432/easycashflows'
nohup ./node_modules/.bin/tsx server/index.ts > /var/log/easycashflows-5000.log 2>&1 &
echo $! > app-5000.pid
```

## Risultato Atteso

Dopo il deployment:
- ✅ EasyCashFlows attivo su porta 5000
- ✅ Nginx reverse proxy: porta 80 → 5000  
- ✅ Frontend e backend allineati sulla stessa porta
- ✅ Sistema completamente operativo
- ✅ Accesso tramite tunnel SSH funzionante

## Troubleshooting

Se l'applicazione non si avvia:
1. Controlla i log: `tail -f /var/log/easycashflows-5000.log`
2. Verifica database: `psql -U easycashflows_user -d easycashflows -h localhost`
3. Testa nginx: `sudo nginx -t`
4. Riavvia nginx: `sudo systemctl reload nginx`