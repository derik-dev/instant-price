-- Add 'frete' column to 'itens' table
ALTER TABLE itens ADD COLUMN IF NOT EXISTS frete NUMERIC DEFAULT 0;

-- Add 'itens_json' column to 'orcamentos' table to store detailed items list (qty, price, etc.)
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS itens_json JSONB;
