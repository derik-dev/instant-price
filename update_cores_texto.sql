-- Adicionar coluna para customizar cor do texto do cabeçalho
alter table empresas 
add column if not exists cor_texto text default '#ffffff';
