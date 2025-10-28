# Configuração do Gateway de Pagamento Pagar.me

Este documento descreve como configurar e utilizar a integração com o Pagar.me no GoldsPay.

## 📋 O que foi implementado

### ✅ Edge Functions do Supabase

1. **create-payment** - Processa pagamentos via Pagar.me
   - Suporta PIX, Cartão de Crédito e Boleto
   - Cria transações automaticamente no banco de dados
   - Retorna QR Code para PIX e PDF para Boleto

2. **pagarme-webhook** - Recebe notificações do Pagar.me
   - Atualiza status das transações automaticamente
   - Processa eventos: paid, pending, failed, refunded, chargeback
   - Cria registros de chargeback quando necessário

### ✅ Componente de Checkout

- Interface completa para pagamentos
- Suporta os 3 métodos de pagamento
- Validação de dados em tempo real
- Formatação automática de CPF/CNPJ, telefone, cartão
- Exibição de QR Code PIX e download de Boleto

### ✅ Integração no Dashboard

- Botão "Criar Pagamento" no dashboard
- Atualização automática de saldo após pagamentos
- Dashboard atualiza em tempo real via Supabase Realtime

## 🚀 Configuração Necessária

### 1. Obter credenciais do Pagar.me

1. Acesse https://dashboard.pagar.me/
2. Crie uma conta ou faça login
3. Vá em **Configurações > API Keys**
4. Copie sua **Secret Key** (sk_test_... para teste ou sk_live_... para produção)

### 2. Configurar variável de ambiente

A variável `PAGARME_SECRET_KEY` já foi adicionada ao arquivo `.env`:

```bash
PAGARME_SECRET_KEY=your_pagarme_secret_key_here
```

**IMPORTANTE:** Substitua `your_pagarme_secret_key_here` pela sua chave secreta real do Pagar.me.

### 3. Configurar Webhook no Pagar.me

Para receber atualizações automáticas de pagamento:

1. Acesse https://dashboard.pagar.me/
2. Vá em **Configurações > Webhooks**
3. Adicione uma nova URL de webhook:
   ```
   https://[SEU_PROJETO].supabase.co/functions/v1/pagarme-webhook
   ```
4. Selecione os eventos:
   - `charge.paid`
   - `charge.pending`
   - `charge.failed`
   - `charge.refunded`
   - `charge.chargeback`
   - `order.paid`
   - `order.pending`
   - `order.payment_failed`
   - `order.refunded`

### 4. Testar a integração

#### Modo de Teste

O Pagar.me oferece dados de teste para desenvolvimento:

**Cartões de teste:**
- **Aprovado:** 4111 1111 1111 1111
- **Negado:** 4000 0000 0000 0002
- CVV: qualquer 3 dígitos
- Validade: qualquer data futura

**PIX e Boleto:**
- Em modo de teste, PIX e Boleto são gerados mas não requerem pagamento real
- Você pode simular o pagamento manualmente no dashboard do Pagar.me

## 💳 Como usar

### No Dashboard

1. Clique no botão **"Criar Pagamento"**
2. Escolha o método de pagamento (PIX, Cartão ou Boleto)
3. Preencha os dados do pagador
4. Se escolher cartão, preencha os dados do cartão
5. Clique em **"Pagar"**

### Resultados

- **PIX:** Exibe QR Code para escanear + código para copiar
- **Boleto:** Exibe código de barras + botão para baixar PDF
- **Cartão:** Processa imediatamente e mostra confirmação

### Atualizações automáticas

- O webhook atualiza o status automaticamente
- O dashboard recarrega as transações em tempo real
- O saldo é recalculado automaticamente

## 📊 Estrutura de Dados

### Tabela `transactions`

Armazena todas as transações:

```sql
- id: UUID único
- user_id: ID do usuário (auth.users)
- amount: Valor em BRL (decimal)
- type: 'sale' | 'withdrawal' | 'refund' | 'chargeback'
- payment_method: 'pix' | 'credit_card' | 'boleto'
- status: 'paid' | 'pending' | 'failed' | 'refunded'
- pagarme_transaction_id: ID da transação no Pagar.me
- customer_name: Nome do cliente
- customer_email: Email do cliente
- description: Descrição da transação
- created_at: Data de criação
- paid_at: Data do pagamento
```

## 🔒 Segurança

- ✅ Edge Functions autenticadas via JWT
- ✅ Row Level Security (RLS) ativado em todas as tabelas
- ✅ Usuários só acessam suas próprias transações
- ✅ Chave secreta do Pagar.me armazenada de forma segura
- ✅ CORS configurado corretamente

## 🧪 Testando localmente

```bash
# 1. Certifique-se de ter as variáveis de ambiente corretas
cat .env

# 2. Inicie o servidor de desenvolvimento
npm run dev

# 3. Faça login no sistema

# 4. Clique em "Criar Pagamento" e teste cada método
```

## 🐛 Resolução de Problemas

### Erro: "PAGARME_SECRET_KEY não configurada"

- Verifique se você adicionou a chave no arquivo `.env`
- Reinicie o servidor de desenvolvimento

### Webhook não está funcionando

- Verifique se a URL está correta no dashboard do Pagar.me
- Verifique se os eventos estão selecionados
- Teste manualmente usando o simulador de webhooks do Pagar.me

### Transações não aparecem no dashboard

- Verifique se o usuário está autenticado
- Verifique se as políticas RLS estão corretas
- Verifique os logs da Edge Function no Supabase

## 📚 Recursos Adicionais

- [Documentação Pagar.me](https://docs.pagar.me/)
- [API Reference Pagar.me](https://docs.pagar.me/reference/overview)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Webhooks Pagar.me](https://docs.pagar.me/docs/webhooks-1)

## 🎯 Próximos Passos

Funcionalidades que podem ser adicionadas:

- [ ] Parcelamento de cartão de crédito
- [ ] Múltiplos métodos de pagamento em uma compra
- [ ] Assinaturas/pagamentos recorrentes
- [ ] Split de pagamentos entre vendedores
- [ ] Antifraude avançado
- [ ] Relatórios de transações
- [ ] Exportação de dados para Excel/PDF
- [ ] Sistema de reembolso manual
- [ ] Gerenciamento de disputas/chargeback
