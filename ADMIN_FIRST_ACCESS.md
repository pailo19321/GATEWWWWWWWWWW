# Como Acessar o Painel Administrativo pela Primeira Vez

## Problema
O painel administrativo (`/admin`) não está acessível porque nenhum usuário tem permissão de administrador no banco de dados.

## Solução

### Passo 1: Criar uma Conta Normal
1. Acesse o site principal
2. Crie uma conta normalmente através do formulário de cadastro
3. Anote o email usado no cadastro

### Passo 2: Promover o Usuário a Super Admin

Execute o seguinte SQL no seu banco de dados Supabase para dar permissões de super admin ao seu usuário:

```sql
-- Substitua 'seu-email@exemplo.com' pelo email que você usou no cadastro
INSERT INTO admin_roles (user_id, role, is_active)
SELECT id, 'super_admin', true
FROM auth.users
WHERE email = 'seu-email@exemplo.com'
ON CONFLICT (user_id) DO UPDATE
SET role = 'super_admin', is_active = true;
```

### Passo 3: Acessar o Painel Admin
Agora você pode acessar o painel administrativo em `/admin`

## Como Adicionar Mais Administradores

Depois que você tiver acesso ao painel, você poderá promover outros usuários diretamente pela interface administrativa.

## Tipos de Funções Disponíveis

- **super_admin**: Acesso total, pode criar outros admins
- **admin**: Pode gerenciar empresas e transações
- **support**: Apenas visualização e suporte
- **financial**: Acesso a relatórios financeiros

## Estrutura do Banco de Dados

O sistema agora possui as seguintes tabelas principais:

1. **admin_roles** - Funções administrativas
2. **company_profiles** - Perfis de empresas cadastradas
3. **transactions** - Transações do gateway
4. **wallets** - Carteiras digitais dos usuários
5. **customers** - Clientes finais
6. **activity_logs** - Logs de auditoria
7. **platform_settings** - Configurações da plataforma
8. **fraud_detection_rules** - Regras antifraude
9. E outras tabelas de suporte

## Verificando Cadastros Pendentes

Quando usuários se cadastrarem, eles aparecerão automaticamente no painel administrativo na aba "Aprovações Pendentes" onde você poderá:

- Visualizar todos os dados enviados
- Aprovar o cadastro
- Rejeitar com motivo
- Colocar em análise

Os usuários receberão feedback em tempo real sobre o status de suas solicitações.
