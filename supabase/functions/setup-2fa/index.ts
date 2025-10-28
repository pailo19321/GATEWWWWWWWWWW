import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Função para gerar secret aleatório (32 caracteres base32)
function generateSecret(): string {
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const randomBytes = new Uint8Array(20);
  crypto.getRandomValues(randomBytes);
  
  for (let i = 0; i < randomBytes.length; i++) {
    secret += base32chars[randomBytes[i] % 32];
  }
  
  return secret;
}

// Função para gerar códigos de backup
function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const randomBytes = new Uint8Array(4);
    crypto.getRandomValues(randomBytes);
    const code = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    codes.push(code);
  }
  return codes;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Não autorizado');
    }

    if (req.method === 'POST') {
      const { action } = await req.json();

      if (action === 'enable') {
        // Gerar secret e códigos de backup
        const secret = generateSecret();
        const backupCodes = generateBackupCodes();

        // Salvar no banco (ainda não ativado)
        const { data: mfaSettings, error } = await supabaseClient
          .from('user_mfa_settings')
          .upsert({
            user_id: user.id,
            secret: secret,
            backup_codes: backupCodes,
            is_enabled: false, // Só ativa depois de verificar o código
          })
          .select()
          .single();

        if (error) throw error;

        // Criar URL do QR Code (otpauth://)
        const issuer = 'GoldsPay';
        const accountName = user.email;
        const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

        return new Response(
          JSON.stringify({
            success: true,
            secret: secret,
            qrCodeUrl: otpauthUrl,
            backupCodes: backupCodes,
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      } else if (action === 'disable') {
        // Desativar 2FA
        const { error } = await supabaseClient
          .from('user_mfa_settings')
          .update({
            is_enabled: false,
            enabled_at: null,
          })
          .eq('user_id', user.id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    } else if (req.method === 'GET') {
      // Buscar configurações atuais
      const { data: mfaSettings, error } = await supabaseClient
        .from('user_mfa_settings')
        .select('is_enabled, enabled_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          is_enabled: mfaSettings?.is_enabled || false,
          enabled_at: mfaSettings?.enabled_at || null,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    throw new Error('Método não permitido');
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});