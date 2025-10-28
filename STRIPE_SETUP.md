# Configuração do Stripe PSP

## Visão Geral

O sistema agora suporta **múltiplos PSPs (Payment Service Providers)** simultaneamente:
- **Pagar.me** (padrão) - PIX, Boleto, Cartão de Crédito/Débito
- **Stripe** (novo) - Cartão de Crédito/Débito

Ambos podem estar ativos ao mesmo tempo, e você pode escolher qual será o padrão.

## Como Configurar o Stripe

### 1. Obter Credenciais do Stripe

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com/)
2. Crie uma conta se ainda não tiver
3. Vá em **Developers → API Keys**
4. Copie as seguintes chaves:
   - **Publishable key** (começa com `pk_`)
   - **Secret key** (começa com `sk_`)

### 2. Configurar no Painel Admin

1. Faça login como **Super Admin**
2. Acesse o **Painel Admin**
3. Clique na aba **"Pagar.me PSP"** (agora renomeada para "Gerenciamento de PSPs")
4. Você verá dois cards: **Stripe** (roxo) e **Pagar.me** (verde)

#### Configurar Stripe:
- **Chave Secreta**: Cole sua Secret Key do Stripe
- **Chave Pública**: Cole sua Publishable Key do Stripe
- **Webhook Secret**: (opcional) Para segurança extra
- Marque **"Ativo"** para habilitar
- Marque **"Padrão"** se quiser que seja o PSP principal
- Clique em **"Salvar Stripe"**

### 3. Configurar Webhook (Recomendado)

Para receber notificações automáticas de mudanças de status dos pagamentos:

1. No Dashboard do Stripe, vá em **Developers → Webhooks**
2. Clique em **"Add endpoint"**
3. Cole a URL:
   ```
   https://SEU_PROJETO.supabase.co/functions/v1/stripe-webhook
   ```
4. Selecione os eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
   - `charge.dispute.created`
5. Copie o **Signing secret** (começa com `whsec_`)
6. Cole no campo **"Webhook Secret"** no painel admin

## Edge Functions Criadas

O sistema criou automaticamente 2 Edge Functions para o Stripe:

### 1. `create-payment-stripe`
- Processa pagamentos com cartão via Stripe
- Endpoint: `https://SEU_PROJETO.supabase.co/functions/v1/create-payment-stripe`
- Requer autenticação JWT

### 2. `stripe-webhook`
- Recebe notificações do Stripe sobre mudanças de status
- Endpoint: `https://SEU_PROJETO.supabase.co/functions/v1/stripe-webhook`
- Webhook público (não requer auth)

## Banco de Dados

### Tabelas Criadas:

1. **psp_configurations**
   - Armazena configurações de Stripe e Pagar.me
   - Permite ativar/desativar cada PSP
   - Define qual é o padrão

2. **user_psp_preferences**
   - Permite que usuários escolham seu PSP preferido
   - Fallback automático se PSP não disponível

3. **psp_transaction_logs**
   - Logs detalhados de cada transação por PSP
   - Request/Response payloads
   - Tempo de processamento
   - Status codes

### Função SQL:

`get_user_psp(user_id)` - Retorna o PSP apropriado para um usuário

## Como Funciona

### Fluxo de Pagamento:

1. **Usuário inicia pagamento**
2. **Sistema determina PSP:**
   - Verifica preferência do usuário
   - Se não houver preferência, usa o PSP padrão
   - Se PSP preferido estiver inativo, usa o padrão
3. **Processa pagamento:**
   - Stripe: `create-payment-stripe` Edge Function
   - Pagar.me: `create-payment` Edge Function
4. **Webhook atualiza status:**
   - Stripe: `stripe-webhook`
   - Pagar.me: `pagarme-webhook`
5. **Banco atualizado em tempo real**

### Métodos de Pagamento:

| PSP      | Cartão | PIX | Boleto |
|----------|--------|-----|--------|
| Stripe   | ✅     | ❌  | ❌     |
| Pagar.me | ✅     | ✅  | ✅     |

## Vantagens de Múltiplos PSPs

1. **Redundância**: Se um PSP falhar, outro pode processar
2. **Otimização de Cusas**: Use o PSP com melhor taxa para cada tipo de transação
3. **Alcance Global**: Stripe para clientes internacionais, Pagar.me para Brasil
4. **Flexibilidade**: Usuários podem escolher seu PSP preferido

## Segurança

- ✅ Todas as chaves são armazenadas com **RLS habilitado**
- ✅ Apenas admins podem ver/editar credenciais
- ✅ Webhooks verificam assinatura para evitar fraude
- ✅ Logs completos de todas as transações
- ✅ Integração em tempo real com o painel admin

## Monitoramento

No painel admin você pode:

1. Ver todas as transações por PSP
2. Comparar performance entre Stripe e Pagar.me
3. Ver logs de erro detalhados
4. Ativar/desativar PSPs em tempo real
5. Receber notificações instantâneas de novas transações

## Custos

### Stripe (Padrão Brasil):
- 3.99% + R$ 0,39 por transação bem-sucedida
- Sem taxas de setup ou mensalidade
- Taxas menores para volumes altos

### Pagar.me:
- Configure sua taxa personalizada no painel admin
- Padrão: 2.99% por transação

## Suporte

Para problemas com:
- **Stripe**: [Documentação Stripe](https://stripe.com/docs)
- **Pagar.me**: [Documentação Pagar.me](https://docs.pagar.me)
- **Sistema**: suporte@goldspay.com

## Testes

### Cartões de Teste Stripe:

```
Sucesso: 4242 4242 4242 4242
Falha:   4000 0000 0000 0002
3D:      4000 0025 0000 3155
```

Qualquer CVV válido, qualquer data futura.

## Próximos Passos

1. Configure suas credenciais do Stripe no painel admin
2. Teste com cartões de teste
3. Configure o webhook para produção
4. Ative o Stripe como padrão se desejar
5. Monitore transações no painel admin em tempo real
