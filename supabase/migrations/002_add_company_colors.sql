-- SQL para adicionar colunas de cores na tabela empresas
-- Execute este script no SQL Editor do Supabase Dashboard

-- Adiciona coluna cor_primaria
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS cor_primaria TEXT DEFAULT '#2563eb';

-- Adiciona coluna cor_secundaria
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS cor_secundaria TEXT DEFAULT '#1e40af';

-- Adiciona coluna moeda_padrao
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS moeda_padrao TEXT DEFAULT 'EUR';

-- Adiciona coluna logo (Base64)
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS logo TEXT;

-- Adiciona coluna pix_qr (Base64)
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS pix_qr TEXT;

-- Comentários nas colunas
COMMENT ON COLUMN empresas.cor_primaria IS 'Cor primária da identidade visual (hex)';
COMMENT ON COLUMN empresas.cor_secundaria IS 'Cor secundária da identidade visual (hex)';
COMMENT ON COLUMN empresas.moeda_padrao IS 'Moeda padrão para novos orçamentos (USD, EUR)';
COMMENT ON COLUMN empresas.logo IS 'Logo da empresa em Base64';
COMMENT ON COLUMN empresas.pix_qr IS 'QR Code PIX em Base64';
