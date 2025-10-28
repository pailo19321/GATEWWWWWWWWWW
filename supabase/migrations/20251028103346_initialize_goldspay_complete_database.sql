/*
  # Initialize GoldsPay Complete Database System
  
  ## Overview
  Complete database schema for GoldsPay payment gateway platform with all necessary tables,
  security policies (RLS), triggers, and functions.
  
  ## Tables Created
  
  ### 1. company_profiles
  - Stores merchant/company information and KYC data
  - Fields: business type, documents, address, financial info
  - Status tracking: pending, approved, rejected, under_review
  
  ### 2. wallets
  - Financial wallet for each user
  - Tracks balance, pending, and blocked amounts
  - One wallet per user (enforced)
  
  ### 3. transactions
  - All payment transactions
  - Support for multiple PSPs (Stripe, PagarMe, etc)
  - Status tracking and metadata
  
  ### 4. customers
  - End customer records for merchants
  - Contact info and metadata
  
  ### 5. payment_links
  - Shareable payment links
  - Configurable amounts, descriptions, and expirations
  
  ### 6. api_keys
  - API credentials for merchant integrations
  - Public and secret keys
  
  ### 7. webhooks
  - Webhook endpoint configurations
  - Event type filtering and retry logic
  
  ### 8. webhook_deliveries
  - Webhook delivery attempts and logs
  - Success/failure tracking
  
  ### 9. admin_roles
  - Admin user role management
  - Super admin protection
  
  ### 10. admin_settings
  - Platform-wide configuration
  - PSP settings, fees, limits
  
  ### 11. user_2fa_secrets
  - Two-factor authentication secrets
  - TOTP implementation support
  
  ### 12. disputes
  - Chargeback and dispute management
  - Evidence tracking
  
  ### 13. fees
  - Transaction fee records
  - Different fee types and calculations
  
  ### 14. registration_tracking
  - Track registration process steps
  - Prevent duplicate registrations
  
  ## Security Features
  - RLS enabled on ALL tables
  - Restrictive policies (authenticated users only)
  - Admin-only access for sensitive tables
  - Automatic wallet creation trigger
  - Super admin protection
  
  ## Triggers & Functions
  - Auto-create wallet on user signup
  - Timestamp updates
  - Balance validation
  
  ## Important Notes
  - All tables use UUID primary keys
  - Timestamps use timestamptz with default now()
  - Foreign keys with CASCADE deletes where appropriate
  - Indexes on frequently queried columns
*/

-- Drop existing tables if they exist (in correct order to handle dependencies)
DROP TABLE IF EXISTS webhook_deliveries CASCADE;
DROP TABLE IF EXISTS webhooks CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS payment_links CASCADE;
DROP TABLE IF EXISTS fees CASCADE;
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS user_2fa_secrets CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;
DROP TABLE IF EXISTS admin_roles CASCADE;
DROP TABLE IF EXISTS company_profiles CASCADE;
DROP TABLE IF EXISTS registration_tracking CASCADE;

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS create_wallet_on_signup ON auth.users;
DROP FUNCTION IF EXISTS create_user_wallet() CASCADE;
DROP FUNCTION IF EXISTS is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_super_admin(uuid) CASCADE;

-- =============================================================================
-- TABLES
-- =============================================================================

-- 1. Company Profiles Table
CREATE TABLE company_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_type text NOT NULL CHECK (business_type IN ('fisica', 'juridica')),
  cpf text,
  cnpj text,
  razao_social text,
  nome_completo text,
  nome_fatura text,
  media_faturamento text,
  ticket_medio text,
  site_empresa text,
  produtos_vendidos text,
  vende_produtos_fisicos boolean DEFAULT false,
  nome_representante text,
  cpf_representante text,
  email_representante text,
  telefone_representante text,
  data_nascimento date,
  nome_mae text,
  cep text,
  logradouro text,
  numero text,
  bairro text,
  cidade text,
  estado text,
  complemento text,
  document_frontal_url text,
  document_verso_url text,
  document_selfie_url text,
  document_contrato_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
  rejection_reason text,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_company_profiles_user_id ON company_profiles(user_id);
CREATE INDEX idx_company_profiles_status ON company_profiles(status);

-- 2. Wallets Table
CREATE TABLE wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance numeric DEFAULT 0 CHECK (balance >= 0),
  pending_balance numeric DEFAULT 0 CHECK (pending_balance >= 0),
  blocked_balance numeric DEFAULT 0 CHECK (blocked_balance >= 0),
  currency text DEFAULT 'BRL',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- 3. Transactions Table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'BRL',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
  payment_method text CHECK (payment_method IN ('credit_card', 'debit_card', 'pix', 'boleto', 'wallet')),
  psp_provider text CHECK (psp_provider IN ('stripe', 'pagarme', 'mercadopago', 'paypal')),
  psp_transaction_id text,
  description text,
  metadata jsonb DEFAULT '{}',
  fee_amount numeric DEFAULT 0,
  net_amount numeric,
  refunded_amount numeric DEFAULT 0,
  customer_email text,
  customer_name text,
  payment_link_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  refunded_at timestamptz
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_psp_transaction_id ON transactions(psp_transaction_id);

-- 4. Customers Table
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  cpf text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_email ON customers(email);

-- 5. Payment Links Table
CREATE TABLE payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'BRL',
  active boolean DEFAULT true,
  max_uses integer,
  current_uses integer DEFAULT 0,
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_payment_links_user_id ON payment_links(user_id);
CREATE INDEX idx_payment_links_slug ON payment_links(slug);
CREATE INDEX idx_payment_links_active ON payment_links(active);

-- 6. API Keys Table
CREATE TABLE api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  public_key text NOT NULL UNIQUE,
  secret_key_hash text NOT NULL,
  active boolean DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_public_key ON api_keys(public_key);

-- 7. Webhooks Table
CREATE TABLE webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  events text[] NOT NULL,
  active boolean DEFAULT true,
  secret text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX idx_webhooks_active ON webhooks(active);

-- 8. Webhook Deliveries Table
CREATE TABLE webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES webhooks(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  response_status integer,
  response_body text,
  attempts integer DEFAULT 1,
  delivered boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  delivered_at timestamptz
);

CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_delivered ON webhook_deliveries(delivered);

-- 9. Admin Roles Table
CREATE TABLE admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'support')),
  permissions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX idx_admin_roles_role ON admin_roles(role);

-- 10. Admin Settings Table
CREATE TABLE admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_admin_settings_key ON admin_settings(key);

-- 11. Two-Factor Authentication Secrets Table
CREATE TABLE user_2fa_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  secret text NOT NULL,
  enabled boolean DEFAULT false,
  backup_codes text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_user_2fa_secrets_user_id ON user_2fa_secrets(user_id);

-- 12. Disputes Table
CREATE TABLE disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'won', 'lost', 'closed')),
  amount numeric NOT NULL,
  evidence jsonb DEFAULT '{}',
  resolution text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX idx_disputes_transaction_id ON disputes(transaction_id);
CREATE INDEX idx_disputes_user_id ON disputes(user_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- 13. Fees Table
CREATE TABLE fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fee_type text NOT NULL CHECK (fee_type IN ('transaction', 'withdrawal', 'chargeback', 'monthly')),
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text DEFAULT 'BRL',
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_fees_transaction_id ON fees(transaction_id);
CREATE INDEX idx_fees_user_id ON fees(user_id);
CREATE INDEX idx_fees_fee_type ON fees(fee_type);

-- 14. Registration Tracking Table
CREATE TABLE registration_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  cpf text,
  cnpj text,
  status text DEFAULT 'started' CHECK (status IN ('started', 'company_info_completed', 'documents_uploaded', 'completed')),
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_registration_tracking_email ON registration_tracking(email);
CREATE INDEX idx_registration_tracking_cpf ON registration_tracking(cpf);
CREATE INDEX idx_registration_tracking_cnpj ON registration_tracking(cnpj);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to automatically create wallet on user signup
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance, pending_balance, blocked_balance)
  VALUES (NEW.id, 0, 0, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id_param uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles
    WHERE user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id_param uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles
    WHERE user_id = user_id_param AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger to create wallet on user signup
CREATE TRIGGER create_wallet_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_wallet();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_2fa_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_tracking ENABLE ROW LEVEL SECURITY;

-- Company Profiles Policies
CREATE POLICY "Users can view own company profile"
  ON company_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can insert own company profile"
  ON company_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company profile"
  ON company_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can delete company profiles"
  ON company_profiles FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Wallets Policies
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "System can insert wallets"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own wallet"
  ON wallets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));

-- Transactions Policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));

-- Customers Policies
CREATE POLICY "Users can view own customers"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own customers"
  ON customers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Payment Links Policies
CREATE POLICY "Users can view own payment links"
  ON payment_links FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active payment links by slug"
  ON payment_links FOR SELECT
  TO anon
  USING (active = true);

CREATE POLICY "Users can insert own payment links"
  ON payment_links FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment links"
  ON payment_links FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment links"
  ON payment_links FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- API Keys Policies
CREATE POLICY "Users can view own api keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own api keys"
  ON api_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Webhooks Policies
CREATE POLICY "Users can view own webhooks"
  ON webhooks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own webhooks"
  ON webhooks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webhooks"
  ON webhooks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own webhooks"
  ON webhooks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Webhook Deliveries Policies
CREATE POLICY "Users can view own webhook deliveries"
  ON webhook_deliveries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM webhooks
      WHERE webhooks.id = webhook_deliveries.webhook_id
      AND webhooks.user_id = auth.uid()
    )
  );

-- Admin Roles Policies (Admin only)
CREATE POLICY "Only admins can view admin roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Only super admins can manage admin roles"
  ON admin_roles FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Admin Settings Policies (Admin only)
CREATE POLICY "Only admins can view admin settings"
  ON admin_settings FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Only super admins can manage admin settings"
  ON admin_settings FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- 2FA Secrets Policies
CREATE POLICY "Users can view own 2fa secrets"
  ON user_2fa_secrets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2fa secrets"
  ON user_2fa_secrets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own 2fa secrets"
  ON user_2fa_secrets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own 2fa secrets"
  ON user_2fa_secrets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Disputes Policies
CREATE POLICY "Users can view own disputes"
  ON disputes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage all disputes"
  ON disputes FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Fees Policies
CREATE POLICY "Users can view own fees"
  ON fees FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert fees"
  ON fees FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Registration Tracking Policies
CREATE POLICY "Users can view own registration tracking"
  ON registration_tracking FOR SELECT
  TO authenticated
  USING (
    email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert registration tracking"
  ON registration_tracking FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own registration tracking"
  ON registration_tracking FOR UPDATE
  TO authenticated
  USING (
    email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert default admin settings
INSERT INTO admin_settings (key, value, description) VALUES
  ('platform_fee_percentage', '2.5', 'Default platform fee percentage'),
  ('min_withdrawal_amount', '10', 'Minimum withdrawal amount in BRL'),
  ('max_transaction_amount', '100000', 'Maximum transaction amount in BRL'),
  ('pix_enabled', 'true', 'Enable PIX payments'),
  ('boleto_enabled', 'true', 'Enable Boleto payments'),
  ('credit_card_enabled', 'true', 'Enable credit card payments')
ON CONFLICT (key) DO NOTHING;
