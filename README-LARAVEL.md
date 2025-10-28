# BlackPay - Laravel 12 Application

Aplicação Laravel 12 convertida do React para PHP com autenticação e integração com Supabase.

## Requisitos

- PHP 8.2 ou superior
- Composer
- PostgreSQL (via Supabase)
- Extensões PHP: PDO, pdo_pgsql, mbstring, openssl, json

## Instalação

### 1. Instalar Dependências PHP

```bash
composer install
```

### 2. Configurar Ambiente

Copie o arquivo `.env.laravel` para `.env`:

```bash
cp .env.laravel .env
```

### 3. Gerar Application Key

```bash
php artisan key:generate
```

### 4. Configurar Permissões

```bash
chmod -R 775 storage bootstrap/cache
```

## Executar Aplicação

### Servidor de Desenvolvimento PHP

```bash
php artisan serve
```

A aplicação estará disponível em: `http://localhost:8000`

### Apache/Nginx

Configure o document root para a pasta `public/`.

#### Exemplo de configuração Apache:

```apache
<VirtualHost *:80>
    ServerName blackpay.local
    DocumentRoot /caminho/para/projeto/public

    <Directory /caminho/para/projeto/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Exemplo de configuração Nginx:

```nginx
server {
    listen 80;
    server_name blackpay.local;
    root /caminho/para/projeto/public;

    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

## Estrutura do Projeto

```
.
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── AuthController.php    # Controller de autenticação
│   └── Services/
│       └── SupabaseService.php       # Serviço de integração Supabase
├── bootstrap/
│   └── app.php                       # Bootstrap da aplicação
├── config/
│   ├── app.php                       # Configurações principais
│   ├── database.php                  # Configurações de banco de dados
│   ├── session.php                   # Configurações de sessão
│   └── logging.php                   # Configurações de logs
├── public/
│   ├── index.php                     # Ponto de entrada
│   ├── .htaccess                     # Configuração Apache
│   └── [imagens]                     # Assets estáticos
├── resources/
│   └── views/
│       ├── layouts/
│       │   └── app.blade.php         # Layout principal
│       └── auth/
│           └── main.blade.php        # Página de login/registro
├── routes/
│   ├── web.php                       # Rotas web
│   └── console.php                   # Comandos artisan
├── storage/                          # Logs, cache, sessões
├── .env.laravel                      # Exemplo de configuração
├── artisan                           # CLI do Laravel
└── composer.json                     # Dependências PHP
```

## Funcionalidades

### Autenticação

- **Registro de usuários**: Formulário com validação completa
- **Login**: Autenticação de usuários existentes
- **Validações**: E-mail, senha (mínimo 8 caracteres), confirmação de senha
- **Mensagens de erro**: Feedback em português para o usuário
- **Toast de sucesso**: Notificação animada após registro

### Integração Supabase

O serviço `SupabaseService` (`app/Services/SupabaseService.php`) fornece métodos para:

- `signUp($email, $password)`: Registrar novo usuário
- `signIn($email, $password)`: Fazer login
- `signOut($accessToken)`: Fazer logout

### Views Blade

- **Alpine.js**: Para interatividade no frontend
- **Tailwind CSS**: Framework CSS via CDN
- **Design Responsivo**: Mobile-first, otimizado para todas as telas
- **Animações**: Transições suaves e feedback visual

## Rotas Disponíveis

- `GET /` - Página principal (login/registro)
- `POST /register` - Processar registro
- `POST /login` - Processar login
- `POST /logout` - Fazer logout
- `GET /forgot-password` - Página de recuperação de senha

## Variáveis de Ambiente

Principais variáveis no arquivo `.env`:

```env
APP_NAME=BlackPay
APP_ENV=local
APP_KEY=                              # Gerar com: php artisan key:generate
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=blackpay
DB_USERNAME=postgres
DB_PASSWORD=

VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

## Desenvolvimento

### Logs

Os logs são armazenados em `storage/logs/laravel.log`.

Para visualizar logs em tempo real:

```bash
tail -f storage/logs/laravel.log
```

### Cache

Limpar cache da aplicação:

```bash
php artisan cache:clear
php artisan config:clear
php artisan view:clear
```

### Comandos Úteis

```bash
# Listar todas as rotas
php artisan route:list

# Executar servidor de desenvolvimento
php artisan serve --host=0.0.0.0 --port=8000

# Verificar versão do Laravel
php artisan --version
```

## Tecnologias

- **Laravel 12**: Framework PHP
- **PHP 8.2+**: Linguagem de programação
- **Blade**: Template engine
- **Alpine.js**: JavaScript reativo
- **Tailwind CSS**: Framework CSS
- **Supabase**: Backend as a Service (autenticação + banco de dados)
- **PostgreSQL**: Banco de dados

## Segurança

- CSRF Protection habilitado em todos os formulários
- Validação de entrada em todos os endpoints
- Senhas hashadas com Bcrypt
- Headers de segurança configurados
- Session management seguro

## Suporte

Para problemas ou dúvidas, consulte a documentação oficial:

- [Laravel 12 Documentation](https://laravel.com/docs/12.x)
- [Supabase Documentation](https://supabase.com/docs)
- [Alpine.js Documentation](https://alpinejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Licença

MIT
