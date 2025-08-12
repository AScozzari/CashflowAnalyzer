# Istruzioni per Configurare Nginx - EasyCashFlows

## Comandi da eseguire sul server di produzione (217.64.206.247)

### 1. Backup della configurazione esistente
```bash
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)
```

### 2. Creare la nuova configurazione nginx
```bash
sudo nano /etc/nginx/sites-available/default
```

Cancella tutto il contenuto esistente e incolla questo:

```nginx
server {
    listen 80;
    server_name 217.64.206.247;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Handle file uploads
    client_max_body_size 50M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Salva con: `Ctrl+X`, poi `Y`, poi `Enter`

### 3. Testare la configurazione nginx
```bash
sudo nginx -t
```

### 4. Se il test è OK, ricaricare nginx
```bash
sudo systemctl reload nginx
```

### 5. Verificare che tutto funzioni
```bash
sudo systemctl status nginx
pm2 status
```

### 6. Testare l'accesso
Ora puoi accedere all'applicazione su: **http://217.64.206.247**

## Risoluzione problemi

Se qualcosa va storto:
```bash
# Ripristinare il backup
sudo cp /etc/nginx/sites-available/default.backup.* /etc/nginx/sites-available/default
sudo systemctl reload nginx
```

## Verifica finale
L'applicazione dovrebbe essere accessibile su http://217.64.206.247 (porta 80) invece che sulla porta 3000.