-- SQL para criar a tabela de API Keys no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Tabela para armazenar as API Keys dos usuários
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT 'Chave Padrão',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- Index para busca rápida por key
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);

-- Index para busca por user_id
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- RLS (Row Level Security) para proteger os dados
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário só pode ver suas próprias API Keys
CREATE POLICY "Users can view own api_keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Usuário só pode criar suas próprias API Keys
CREATE POLICY "Users can insert own api_keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Usuário só pode deletar suas próprias API Keys
CREATE POLICY "Users can delete own api_keys" ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Função para gerar API Key aleatória
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
BEGIN
  RETURN 'orcafacil_' || encode(gen_random_bytes(24), 'hex');
END;
$$ LANGUAGE plpgsql;
