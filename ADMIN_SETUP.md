# Configuração do Painel Administrativo

## Como Criar o Primeiro Super Admin

Para acessar o painel administrativo e aprovar contas, você precisa promover um usuário a **Super Admin**.

### Passo 1: Criar uma Conta

1. Acesse a aplicação
2. Crie uma conta normalmente através do formulário de cadastro
3. Anote o email usado no cadastro

### Passo 2: Obter o ID do Usuário

Execute a seguinte query no Supabase SQL Editor:

```sql
SELECT id, email FROM auth.users WHERE email = 'seu-email@exemplo.com';
```

Copie o `id` (UUID) retornado.

### Passo 3: Promover a Super Admin

Execute a seguinte função no Supabase SQL Editor:

```sql
SELECT promote_to_super_admin('cole-o-uuid-aqui');
```

Exemplo:
```sql
SELECT promote_to_super_admin('123e4567-e89b-12d3-a456-426614174000');
```

### Passo 4: Acessar o Painel Admin

1. Faça logout e login novamente
2. Você agora terá acesso ao botão "Painel Admin" no dashboard
3. Clique no botão para acessar o painel administrativo

## Funcionalidades do Painel Admin

### Atualização em Tempo Real ✨

O painel administrativo possui **atualização automática em tempo real** para:

- **Novas contas pendentes**: Assim que um usuário se cadastra, aparece imediatamente na lista de aprovações
- **Transações**: Todas as transações são atualizadas em tempo real
- **Logs de atividade**: Registros de ações aparecem instantaneamente

O indicador **"Ao Vivo"** no canto superior direito mostra que o painel está conectado e recebendo atualizações automáticas.

### Aprovar Contas

1. No painel admin, clique na aba **"Aprovações"**
2. Você verá todas as contas pendentes
3. Clique em **"Detalhes"** para ver informações completas
4. Clique em **"Aprovar"** ou **"Rejeitar"**
5. Para rejeitar, informe o motivo da rejeição

### Recursos Disponíveis

- **Dashboard**: Estatísticas gerais da plataforma
- **Aprovações**: Gerenciar aprovações de contas (com atualização em tempo real)
- **Usuários**: Visualizar todos os usuários cadastrados
- **Transações**: Monitorar todas as transações (com atualização em tempo real)
- **Anti-Fraude**: Configurar regras de detecção de fraude
- **Compliance/KYC**: Gerenciar documentos de compliance
- **Repasses**: Gerenciar lotes de pagamento
- **Conciliação**: Relatórios de conciliação
- **Pagar.me PSP**: Integração com gateway de pagamento
- **Customização**: Personalizar aparência da plataforma
- **Sistema**: Configurações gerais
- **Logs**: Histórico de atividades (com atualização em tempo real)

## Fluxo de Aprovação

1. Usuário cria conta e preenche formulário
2. Status inicial: **"Pendente"** (pending)
3. Usuário vê tela de aprovação pendente
4. Admin recebe notificação em tempo real no painel
5. Admin aprova ou rejeita a conta
6. Usuário pode fazer login e acessar o sistema (se aprovado)

## Permissões de Admin

Existem 4 tipos de permissões:

- **super_admin**: Acesso total, pode gerenciar outros admins
- **admin**: Pode aprovar contas e gerenciar configurações
- **support**: Acesso somente leitura e suporte a usuários
- **financial**: Acesso a relatórios financeiros e repasses

## Gateway de Pagamento

O sistema está integrado com o **Pagar.me** para processar pagamentos. Todas as transações são sincronizadas automaticamente e aparecem em tempo real no painel administrativo.

## Segurança

- Todas as tabelas possuem **Row Level Security (RLS)** habilitado
- Apenas usuários com role de admin podem acessar dados administrativos
- Logs de auditoria registram todas as ações importantes
- Senhas são criptografadas pelo Supabase Auth

## Suporte

Para dúvidas ou problemas:
- Email: suporte@goldspay.com
- Telefone: +55 (11) 99999-9999
