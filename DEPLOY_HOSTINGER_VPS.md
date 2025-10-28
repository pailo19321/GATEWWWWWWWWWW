# Deploy GoldsPay - VPS Hostinger (Debian 12 + CloudPanel)

## Pré-requisitos

- VPS Hostinger com Debian 12
- CloudPanel instalado
- Acesso SSH à VPS
- Domínio configurado (ex: goldspay.com.br)

## Parte 1: Preparar a VPS

### 1.1. Conectar via SSH

```bash
ssh root@seu-ip-da-vps
```

### 1.2. Instalar Node.js 18+ (se ainda não tiver)

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 1.3. Instalar PM2 (para manter app rodando)

```bash
npm install -g pm2
```

## Parte 2: Configurar Site no CloudPanel

### 2.1. Criar Site no CloudPanel

1. Acesse CloudPanel: `https://seu-ip-da-vps:8443`
2. Faça login
3. Vá em **Sites** → **Add Site**
4. Preencha:
   - **Domain Name**: goldspay.com.br (seu domínio)
   - **Site User**: goldspay
   - **App Type**: Static HTML (vamos mudar isso depois)
5. Clique em **Create**

### 2.2. Configurar SSL (Importante!)

1. No site criado, vá em **SSL/TLS**
2. Clique em **New Let's Encrypt Certificate**
3. Selecione seu domínio
4. Clique em **Create and Install**
5. Aguarde a instalação do certificado

## Parte 3: Fazer Upload do Projeto

### 3.1. Preparar projeto localmente

No seu computador, abra o terminal na pasta do projeto:

```bash
# Build do projeto
npm run build

# Criar arquivo .zip com o build e arquivos necessários
```

### 3.2. Opção A: Upload via SFTP/SCP

Use um cliente FTP como FileZilla ou WinSCP:

**Conexão:**
- Host: seu-ip-da-vps
- Porta: 22
- Usuário: goldspay (ou o usuário que criou no CloudPanel)
- Senha: a senha do usuário

**Caminhos importantes:**
- Raiz do site: `/home/goldspay/htdocs/goldspay.com.br/`
- Fazer upload para este diretório

### 3.3. Opção B: Upload via Git (Recomendado)

```bash
# Na VPS, vá para o diretório do site
cd /home/goldspay/htdocs/goldspay.com.br/

# Clone seu repositório (se usar GitHub/GitLab)
git clone https://github.com/seu-usuario/goldspay.git .

# Ou faça upload manual dos arquivos
```

## Parte 4: Configurar o Projeto na VPS

### 4.1. Conectar via SSH e ir para pasta do site

```bash
ssh root@seu-ip-da-vps
cd /home/goldspay/htdocs/goldspay.com.br/
```

### 4.2. Instalar dependências

```bash
npm install
```

### 4.3. Criar arquivo .env

```bash
nano .env
```

Cole o conteúdo:

```env
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw
```

Salve: `Ctrl + O`, Enter, `Ctrl + X`

### 4.4. Build do projeto

```bash
npm run build
```

## Parte 5: Configurar Nginx (CloudPanel)

### 5.1. Editar configuração do Nginx

```bash
nano /etc/nginx/sites-enabled/goldspay.com.br.conf
```

### 5.2. Substituir o conteúdo por:

```nginx
server {
  listen 80;
  listen [::]:80;
  listen 443 ssl http2;
  listen [::]:443 ssl http2;

  server_name goldspay.com.br www.goldspay.com.br;

  ssl_certificate /etc/letsencrypt/live/goldspay.com.br/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/goldspay.com.br/privkey.pem;

  root /home/goldspay/htdocs/goldspay.com.br/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # Gzip
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

  # Cache para assets
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

**IMPORTANTE:** Substitua `goldspay.com.br` pelo seu domínio real!

Salve: `Ctrl + O`, Enter, `Ctrl + X`

### 5.3. Testar e recarregar Nginx

```bash
# Testar configuração
nginx -t

# Se estiver OK, recarregar
systemctl reload nginx
```

## Parte 6: Automatizar Deploy (Opcional)

### 6.1. Criar script de deploy

```bash
nano /home/goldspay/deploy.sh
```

Cole:

```bash
#!/bin/bash
cd /home/goldspay/htdocs/goldspay.com.br/

# Pull do Git (se usar)
# git pull origin main

# Instalar dependências
npm install

# Build
npm run build

# Recarregar Nginx
systemctl reload nginx

echo "Deploy concluído!"
```

Salve e dê permissão:

```bash
chmod +x /home/goldspay/deploy.sh
```

### 6.2. Para fazer deploy futuro

```bash
/home/goldspay/deploy.sh
```

## Verificações Finais

### 1. Verificar se o site está no ar

Abra no navegador: `https://goldspay.com.br`

### 2. Verificar logs do Nginx (se houver erro)

```bash
tail -f /var/log/nginx/error.log
```

### 3. Verificar permissões

```bash
chown -R goldspay:goldspay /home/goldspay/htdocs/goldspay.com.br/
chmod -R 755 /home/goldspay/htdocs/goldspay.com.br/
```

## Troubleshooting

### Erro 404 ao acessar o site

- Verifique se a pasta `dist` existe
- Rode `npm run build` novamente
- Verifique o caminho `root` no Nginx

### Erro 502 Bad Gateway

- Verifique se o Nginx está rodando: `systemctl status nginx`
- Recarregue o Nginx: `systemctl reload nginx`

### Site não carrega (página em branco)

- Abra o Console do navegador (F12)
- Verifique erros relacionados ao Supabase
- Confirme que o `.env` está correto

### SSL não funciona

- Verifique se o certificado foi instalado corretamente
- Rode: `certbot certificates`
- Renove se necessário: `certbot renew`

## Comandos Úteis

```bash
# Ver logs do Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Reiniciar Nginx
systemctl restart nginx

# Ver status do Nginx
systemctl status nginx

# Testar configuração do Nginx
nginx -t

# Ver processos Node.js rodando
pm2 list

# Ver espaço em disco
df -h
```

## Configurações de Domínio (DNS)

No painel da Hostinger ou onde seu domínio está registrado:

### Registros DNS necessários:

```
Tipo A:
@ → IP-DA-SUA-VPS

Tipo A:
www → IP-DA-SUA-VPS
```

Aguarde até 24h para propagação DNS (geralmente leva minutos).

## Atualizações Futuras

Quando quiser atualizar o site:

1. Faça as mudanças localmente
2. Teste com `npm run dev`
3. Suba para o servidor:
   - Via Git: `git pull` na VPS
   - Via FTP: faça upload dos arquivos
4. Na VPS: `npm install && npm run build`
5. Recarregue Nginx: `systemctl reload nginx`

## Backup

### Fazer backup do projeto

```bash
cd /home/goldspay/htdocs/
tar -czf goldspay-backup-$(date +%Y%m%d).tar.gz goldspay.com.br/
```

### Restaurar backup

```bash
cd /home/goldspay/htdocs/
tar -xzf goldspay-backup-20250126.tar.gz
```

## Segurança

### Firewall (UFW)

```bash
# Permitir HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

### Atualizações automáticas

```bash
apt install unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades
```

## Suporte

Se tiver problemas:
1. Verifique os logs do Nginx
2. Teste a build localmente antes de subir
3. Confirme que o domínio está apontando para o IP correto
4. Entre em contato com suporte da Hostinger se necessário

---

**Pronto! Seu GoldsPay está no ar! 🚀**
