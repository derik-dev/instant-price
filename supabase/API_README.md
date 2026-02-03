# API OrçaFácil - Documentação

API REST para integração do OrçaFácil com sistemas terceiros.

## 🚀 Deploy no Supabase

### Pré-requisitos
1. [Supabase CLI](https://supabase.com/docs/guides/cli) instalado
2. Projeto Supabase configurado

### Passos

1. **Criar tabela de API Keys**
   - Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
   - Vá em SQL Editor
   - Cole e execute o conteúdo de `supabase/migrations/001_create_api_keys.sql`

2. **Deploy da Edge Function**
   ```bash
   # Login no Supabase
   supabase login

   # Link com seu projeto
   supabase link --project-ref hjeqxocuuquosfapibxo

   # Deploy da função
   supabase functions deploy api --no-verify-jwt
   ```

3. **Pronto!** Sua API estará disponível em:
   ```
   https://hjeqxocuuquosfapibxo.supabase.co/functions/v1/api
   ```

---

## 🔐 Autenticação

Todas as requisições devem incluir uma API Key no header:

```
Authorization: Bearer SUA_API_KEY
```

Gere API Keys em: **Configurações > API Keys** no OrçaFácil.

---

## 📋 Endpoints

### Orçamentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/orcamentos` | Lista todos os orçamentos |
| `GET` | `/api/orcamentos/:id` | Busca orçamento por ID |
| `POST` | `/api/orcamentos` | Cria novo orçamento |
| `PUT` | `/api/orcamentos/:id` | Atualiza orçamento |
| `DELETE` | `/api/orcamentos/:id` | Remove orçamento |

#### Campos do Orçamento
```json
{
  "cliente": "Nome do Cliente",
  "valor": 1500.00,
  "mao_de_obra": 300.00,
  "servico": "Descrição do serviço",
  "prazo": "15",
  "pagamento": "pix",
  "chave_pix": "email@exemplo.com",
  "moeda": "EUR",
  "status": "Pendente"
}
```

---

### Clientes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/clientes` | Lista todos os clientes |
| `GET` | `/api/clientes/:id` | Busca cliente por ID |
| `POST` | `/api/clientes` | Cria novo cliente |
| `PUT` | `/api/clientes/:id` | Atualiza cliente |
| `DELETE` | `/api/clientes/:id` | Remove cliente |

#### Campos do Cliente
```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "phone": "(11) 99999-9999",
  "empresa": "Empresa LTDA",
  "cpf": "123.456.789-00",
  "endereco": "Rua Exemplo, 123"
}
```

---

### Itens / Catálogo

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/itens` | Lista todos os itens |
| `GET` | `/api/itens/:id` | Busca item por ID |
| `POST` | `/api/itens` | Cria novo item |
| `PUT` | `/api/itens/:id` | Atualiza item |
| `DELETE` | `/api/itens/:id` | Remove item |

#### Campos do Item
```json
{
  "nome": "Instalação Elétrica",
  "tipo": "Serviço",
  "preco": 500.00,
  "mao_de_obra": 200.00,
  "descricao": "Instalação completa"
}
```

---

### Empresa

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/empresa` | Retorna dados da empresa |
| `PUT` | `/api/empresa` | Atualiza dados da empresa |

#### Campos da Empresa
```json
{
  "nome": "Minha Empresa",
  "doc": "12.345.678/0001-90",
  "tel": "(11) 3333-4444",
  "endereco": "Av. Principal, 1000",
  "pix": "pix@empresa.com",
  "cor_primaria": "#2563eb",
  "cor_secundaria": "#1e40af"
}
```

---

## 📝 Exemplos

### Listar Orçamentos
```bash
curl -X GET "https://hjeqxocuuquosfapibxo.supabase.co/functions/v1/api/orcamentos" \
  -H "Authorization: Bearer orcafacil_abc123..."
```

### Criar Orçamento
```bash
curl -X POST "https://hjeqxocuuquosfapibxo.supabase.co/functions/v1/api/orcamentos" \
  -H "Authorization: Bearer orcafacil_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "cliente": "Maria Santos",
    "valor": 2500.00,
    "servico": "Reforma completa",
    "prazo": "30",
    "pagamento": "boleto"
  }'
```

### Atualizar Status
```bash
curl -X PUT "https://hjeqxocuuquosfapibxo.supabase.co/functions/v1/api/orcamentos/123" \
  -H "Authorization: Bearer orcafacil_abc123..." \
  -H "Content-Type: application/json" \
  -d '{"status": "Aprovado"}'
```

### Criar Cliente
```bash
curl -X POST "https://hjeqxocuuquosfapibxo.supabase.co/functions/v1/api/clientes" \
  -H "Authorization: Bearer orcafacil_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Pedro Oliveira",
    "email": "pedro@email.com",
    "phone": "(21) 98888-7777"
  }'
```

---

## ⚠️ Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `200` | Sucesso |
| `201` | Criado com sucesso |
| `400` | Requisição inválida |
| `401` | API Key inválida ou ausente |
| `404` | Recurso não encontrado |
| `405` | Método não permitido |
| `500` | Erro interno do servidor |

---

## 🔗 Integrações Populares

- **Zapier**: Use webhooks para automatizar
- **Make (Integromat)**: Módulo HTTP para integrar
- **n8n**: Node HTTP Request
- **Power Automate**: Conector HTTP

---

## 📞 Suporte

Dúvidas? Entre em contato pelo OrçaFácil.
