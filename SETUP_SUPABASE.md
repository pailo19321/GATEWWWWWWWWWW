# Configuração do Supabase - GoldsPay

Este guia mostra como configurar sua própria instância do Supabase para rodar o GoldsPay independentemente do Bolt.

## 1. Criar Conta no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Crie uma conta gratuita (GitHub, Google, ou Email)

## 2. Criar Novo Projeto

1. No dashboard do Supabase, clique em "New Project"
2. Preencha as informações:
   - **Name**: GoldsPay (ou nome de sua preferência)
   - **Database Password**: Crie uma senha forte e **ANOTE**
   - **Region**: Escolha a região mais próxima de você
   - **Pricing Plan**: Free (para começar)
3. Clique em "Create new project"
4. Aguarde 2-3 minutos até o projeto ser criado

## 3. Obter Credenciais

Após o projeto ser criado:

1. No menu lateral, clique em **"Project Settings"** (ícone de engrenagem)
2. Clique em **"API"**
3. Você verá duas informações importantes:

   **Project URL** (algo como: `https://xxxxxxxxxxxxx.supabase.co`)
   ```
   https://seu-projeto-id.supabase.co
   ```

   **anon/public key** (uma chave longa começando com `eyJ...`)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 4. Configurar o Arquivo .env

1. Na raiz do projeto, copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Abra o arquivo `.env` e substitua os valores:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 5. Aplicar Migrações do Banco de Dados

Você tem duas opções para criar as tabelas:

### Opção A: Usando o SQL Editor do Supabase (Recomendado)

1. No dashboard do Supabase, clique em **"SQL Editor"** no menu lateral
2. Clique em **"New query"**
3. Copie e cole o conteúdo do arquivo de migração mais recente:
   - Abra: `supabase/migrations/20251026193010_initialize_goldspay_complete_system.sql`
   - Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em **"Run"** ou pressione `Ctrl+Enter`
6. Aguarde a execução completar (pode levar alguns segundos)

### Opção B: Usando Supabase CLI (Para desenvolvedores avançados)

1. Instale o Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Faça login:
   ```bash
   supabase login
   ```

3. Link com seu projeto:
   ```bash
   supabase link --project-ref seu-projeto-id
   ```

4. Aplique as migrações:
   ```bash
   supabase db push
   ```

## 6. Configurar Autenticação

1. No dashboard do Supabase, vá em **"Authentication"** no menu lateral
2. Clique em **"Providers"**
3. Certifique-se que **"Email"** está habilitado
4. Clique em **"Email"**
5. Configure:
   - ✅ Enable Email provider
   - ❌ Confirm email (desabilite para facilitar desenvolvimento)
6. Clique em "Save"

## 7. Verificar Row Level Security (RLS)

1. No dashboard, clique em **"Table Editor"**
2. Selecione qualquer tabela (ex: `company_profiles`)
3. Clique nas **"..."** ao lado do nome da tabela
4. Clique em **"View policies"**
5. Verifique se as políticas de RLS estão criadas

As políticas foram criadas automaticamente pela migração.

## 8. Instalar Dependências e Rodar o Projeto

```bash
# Instalar dependências JavaScript
npm install

# Build do projeto (desenvolvimento)
npm run dev

# OU Build de produção
npm run build
```

## 9. Testar a Aplicação

1. Abra o navegador em `http://localhost:5173` (desenvolvimento) ou onde seu servidor estiver rodando
2. Tente criar uma conta
3. Faça login
4. Verifique se consegue preencher o formulário de empresa

## 10. Criar Primeiro Usuário Admin (Opcional)

Para ter acesso ao painel admin, você precisa criar um usuário admin:

1. Primeiro, crie uma conta normal pela interface
2. Copie o UUID do seu usuário:
   - Vá em **Authentication > Users** no Supabase
   - Copie o UUID do seu usuário
3. No **SQL Editor**, execute:
   ```sql
   INSERT INTO admin_roles (user_id, role, permissions, granted_by)
   VALUES (
     'cole-seu-uuid-aqui',
     'super_admin',
     ARRAY['all'],
     'cole-seu-uuid-aqui'
   );
   ```
4. Agora você pode acessar `/admin` na aplicação

## Solução de Problemas

### Erro: "Invalid API key"
- Verifique se copiou a chave `anon/public` corretamente
- Certifique-se que não há espaços extras no `.env`

### Erro: "relation does not exist"
- As migrações não foram aplicadas corretamente
- Execute novamente o SQL da migração

### Não consigo criar conta
- Verifique se o provider Email está habilitado
- Verifique se o RLS está configurado corretamente
- Olhe o console do navegador (F12) para ver erros

### Erro de CORS
- Verifique se a URL do Supabase está correta
- Certifique-se que está usando HTTPS na URL

## Ambiente de Produção

Para CloudPanel ou servidor de produção:

1. Configure as variáveis de ambiente no painel de controle
2. Execute `npm run build` para gerar os arquivos otimizados
3. Aponte o servidor web para a pasta `dist/`
4. Configure SSL/HTTPS (obrigatório)
5. Configure um domínio personalizado

## Custos

- **Free Tier**: 500MB database, 1GB file storage, 2GB bandwidth
- Suficiente para desenvolvimento e pequenos projetos
- Upgrades disponíveis conforme necessidade

## Suporte

- Documentação Supabase: https://supabase.com/docs
- Status do Supabase: https://status.supabase.com
- Discord Supabase: https://discord.supabase.com

---

✅ Após seguir este guia, sua aplicação estará rodando com seu próprio Supabase, independente do Bolt!
