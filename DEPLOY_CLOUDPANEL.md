# Deploy GoldsPay no CloudPanel

Este guia mostra como fazer deploy da aplicação GoldsPay no CloudPanel usando o banco de dados PostgreSQL do próprio painel.

## Requisitos

- CloudPanel instalado e configurado
- Acesso SSH ao servidor
- Domínio apontado para o servidor

## 1. Criar Site no CloudPanel

1. Acesse o painel do CloudPanel
2. Clique em **"Sites"** no menu lateral
3. Clique em **"Add Site"**
4. Preencha:
   - **Domain Name**: seudomain.com.br
   - **Site Type**: PHP
   - **PHP Version**: 8.2 ou superior
   - **Site User**: goldspay (ou nome de sua preferência)
5. Clique em **"Add Site"**

## 2. Criar Banco de Dados PostgreSQL

1. No CloudPanel, clique em **"Databases"**
2. Clique em **"Add Database"**
3. Escolha **PostgreSQL**
4. Preencha:
   - **Database Name**: goldspay
   - **Database User**: goldspay_user
   - **Password**: [Crie uma senha forte]
5. **ANOTE** essas credenciais
6. Clique em **"Add Database"**

## 3. Fazer Upload dos Arquivos

### Opção A: Via Git (Recomendado)

```bash
# Conecte via SSH
ssh seu-usuario@seu-servidor

# Navegue até a pasta do site
cd /home/goldspay/htdocs/seudomain.com.br

# Clone o repositório (ou faça upload manual)
git clone https://github.com/seu-usuario/goldspay.git .

# Ou se já tiver os arquivos localmente, use SCP
# scp -r /caminho/local/* seu-usuario@servidor:/home/goldspay/htdocs/seudomain.com.br/
```

### Opção B: Via FTP/SFTP

Use FileZilla ou outro cliente FTP para fazer upload de todos os arquivos do projeto para:
```
/home/goldspay/htdocs/seudomain.com.br/
```

## 4. Configurar Variáveis de Ambiente

```bash
# Conecte via SSH
ssh seu-usuario@seu-servidor

# Navegue até a pasta do projeto
cd /home/goldspay/htdocs/seudomain.com.br

# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env
nano .env
```

Configure as seguintes variáveis:

```env
APP_NAME=GoldsPay
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_TIMEZONE=America/Sao_Paulo
APP_URL=https://seudomain.com.br

APP_LOCALE=pt_BR

# Database - Use as credenciais criadas no passo 2
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=goldspay
DB_USERNAME=goldspay_user
DB_PASSWORD=sua_senha_aqui

SESSION_DRIVER=database
SESSION_LIFETIME=120

CACHE_STORE=database
QUEUE_CONNECTION=database

LOG_CHANNEL=stack
LOG_LEVEL=error
```

Salve e feche (Ctrl+X, depois Y, depois Enter)

## 5. Instalar Dependências

```bash
# Instalar dependências PHP
composer install --no-dev --optimize-autoloader

# Instalar dependências JavaScript
npm install

# Gerar chave da aplicação
php artisan key:generate

# Build do frontend para produção
npm run build
```

## 6. Executar Migrações do Banco de Dados

```bash
# Rodar as migrações
php artisan migrate --force

# Verificar se as tabelas foram criadas
php artisan tinker
```

No tinker, execute:
```php
\DB::select('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
exit
```

## 7. Configurar Permissões

```bash
# Ajustar permissões das pastas
chmod -R 755 storage bootstrap/cache
chown -R goldspay:goldspay storage bootstrap/cache

# Criar pasta de cache se não existir
mkdir -p bootstrap/cache
```

## 8. Configurar Nginx (CloudPanel faz automaticamente)

O CloudPanel já configura o Nginx automaticamente, mas verifique se a configuração está correta:

```bash
# Verificar configuração do Nginx
cat /etc/nginx/sites-enabled/seudomain.com.br.conf
```

Certifique-se que o `root` aponta para a pasta `public`:
```nginx
root /home/goldspay/htdocs/seudomain.com.br/public;
```

Se precisar editar:
```bash
sudo nano /etc/nginx/sites-enabled/seudomain.com.br.conf
```

Adicione ou verifique se existe:

```nginx
location / {
    try_files $uri $uri/ /index.php?$query_string;
}

location ~ \.php$ {
    include snippets/fastcgi-php.conf;
    fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
}
```

Recarregue o Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 9. Configurar SSL (HTTPS)

No CloudPanel:
1. Vá em **"Sites"**
2. Selecione seu site
3. Clique na aba **"SSL/TLS"**
4. Clique em **"Actions"** > **"New Let's Encrypt Certificate"**
5. Preencha o email e clique em **"Create and Install"**

Aguarde alguns minutos. Seu site agora estará disponível em HTTPS.

## 10. Criar Primeiro Usuário Admin

```bash
# Conecte via SSH
ssh seu-usuario@seu-servidor

cd /home/goldspay/htdocs/seudomain.com.br

# Abra o tinker
php artisan tinker
```

Execute os seguintes comandos:

```php
// Criar usuário
$user = \App\Models\User::create([
    'email' => 'admin@goldspay.com',
    'password' => \Hash::make('senha-forte-aqui')
]);

// Criar carteira
\App\Models\Wallet::create([
    'user_id' => $user->id,
    'balance' => 0,
    'available_balance' => 0,
    'pending_balance' => 0
]);

// Tornar o usuário admin
\App\Models\AdminRole::create([
    'user_id' => $user->id,
    'role' => 'super_admin',
    'permissions' => ['all'],
    'is_active' => true,
    'created_by' => $user->id
]);

echo "Admin criado com sucesso!";
exit
```

## 11. Configurar Cron Jobs (Opcional)

No CloudPanel:
1. Vá em **"Cron Jobs"**
2. Clique em **"Add Cron Job"**
3. Adicione:

```bash
* * * * * cd /home/goldspay/htdocs/seudomain.com.br && php artisan schedule:run >> /dev/null 2>&1
```

## 12. Otimizações de Produção

```bash
# Cache de configuração
php artisan config:cache

# Cache de rotas
php artisan route:cache

# Cache de views
php artisan view:cache

# Otimizar autoload
composer dump-autoload --optimize
```

## 13. Testar a Aplicação

1. Acesse `https://seudomain.com.br`
2. Tente criar uma conta
3. Faça login
4. Teste o painel admin em `https://seudomain.com.br/admin`

## 14. Monitoramento e Logs

```bash
# Ver logs de erro
tail -f storage/logs/laravel.log

# Ver logs do Nginx
sudo tail -f /var/log/nginx/seudomain.com.br_error.log
```

## Atualizações Futuras

Para atualizar a aplicação:

```bash
cd /home/goldspay/htdocs/seudomain.com.br

# Puxar atualizações (se usando git)
git pull origin main

# Instalar dependências atualizadas
composer install --no-dev --optimize-autoloader
npm install

# Rodar migrações
php artisan migrate --force

# Build do frontend
npm run build

# Limpar e recriar caches
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Solução de Problemas

### Erro 500
- Verifique os logs: `tail -f storage/logs/laravel.log`
- Verifique permissões: `chmod -R 755 storage bootstrap/cache`
- Verifique o `.env`: certifique-se que todas as variáveis estão corretas

### Banco de dados não conecta
- Verifique as credenciais no `.env`
- Teste a conexão: `php artisan tinker` e depois `\DB::connection()->getPdo();`
- Verifique se o PostgreSQL está rodando: `sudo systemctl status postgresql`

### Assets não carregam
- Verifique se rodou `npm run build`
- Verifique permissões da pasta `public`
- Limpe o cache do navegador

### Erro de CSRF Token
- Verifique se o domínio no `.env` está correto
- Limpe os cookies do navegador
- Verifique se o APP_URL está com HTTPS

## Backup

### Backup do Banco de Dados

```bash
# Fazer backup
pg_dump -U goldspay_user -h 127.0.0.1 goldspay > backup-$(date +%Y%m%d).sql

# Restaurar backup
psql -U goldspay_user -h 127.0.0.1 goldspay < backup-20241026.sql
```

### Backup dos Arquivos

```bash
cd /home/goldspay
tar -czf goldspay-backup-$(date +%Y%m%d).tar.gz htdocs/seudomain.com.br
```

## Suporte

Para dúvidas:
- Email: suporte@goldspay.com
- Documentação Laravel: https://laravel.com/docs
- Documentação CloudPanel: https://www.cloudpanel.io/docs/

---

✅ Sua aplicação GoldsPay está rodando com banco de dados PostgreSQL do CloudPanel!
