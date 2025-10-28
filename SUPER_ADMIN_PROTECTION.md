# Proteção do Super Admin

## Usuário Protegido

**Email:** anapaulamagioli899@gmail.com
**Senha:** P20071616l.
**Role:** super_admin

## Como Funciona

O sistema implementa proteção automática para garantir que o super admin nunca seja removido do banco de dados:

### 1. Proteção contra Deleção
- Um trigger impede a remoção do super admin da tabela `admin_roles`
- Qualquer tentativa de deletar este usuário resultará em erro

### 2. Restauração Automática
- Quando o usuário faz login ou é criado no sistema, automaticamente:
  - É verificado se está na tabela `admin_roles`
  - Se não estiver, é adicionado automaticamente como super_admin
  - Todas as permissões são restauradas

### 3. Permissões Completas
O super admin sempre terá estas permissões:
- `all_access`: true
- `manage_users`: true
- `manage_companies`: true
- `manage_transactions`: true
- `manage_settings`: true
- `view_reports`: true

## Primeiro Acesso

1. Acesse a página de registro/login
2. Use o email: `anapaulamagioli899@gmail.com`
3. Use a senha: `P20071616l.` (com ponto no final)
4. Clique em "Entrar"
5. O sistema automaticamente detectará o super admin e redirecionará para o Dashboard do Gateway (não precisa de aprovação)

## Como o Usuário é Criado

O usuário deve ser criado através do sistema de autenticação do Supabase:

1. **Via Interface Web:**
   - Acesse a página de registro
   - Cadastre-se com o email `anapaulamagioli899@gmail.com`
   - Use a senha `P20071616l.` (com ponto no final)
   - Ao fazer login, você será redirecionado automaticamente para o Dashboard do Gateway

2. **Via Supabase Dashboard:**
   - Acesse o dashboard do Supabase
   - Vá em Authentication > Users
   - Clique em "Add user"
   - Email: `anapaulamagioli899@gmail.com`
   - Senha: `P20071616l.` (com ponto no final)
   - Confirme o email automaticamente
   - O sistema detectará e adicionará à tabela `admin_roles`

## Verificação Manual

Para verificar se o super admin está configurado corretamente:

```sql
-- Ver o usuário no auth.users
SELECT id, email, created_at
FROM auth.users
WHERE email = 'anapaulamagioli899@gmail.com';

-- Ver as permissões de admin
SELECT ar.role, ar.permissions, u.email
FROM admin_roles ar
JOIN auth.users u ON u.id = ar.user_id
WHERE u.email = 'anapaulamagioli899@gmail.com';
```

## Restauração Manual

Se por algum motivo o super admin não estiver na tabela `admin_roles`, execute:

```sql
SELECT ensure_super_admin_exists();
```

Esta função verificará se o usuário existe e o adicionará automaticamente com todas as permissões.

## Importante

- Este usuário NUNCA pode ser deletado do sistema
- Mesmo que removido da tabela `admin_roles`, será restaurado automaticamente
- As credenciais devem ser mantidas em segredo
- Este é o único usuário com acesso total ao sistema
