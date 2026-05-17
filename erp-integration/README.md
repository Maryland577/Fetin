# ERP Integration

API unificada para gerenciar estoque, compras e financeiro em múltiplos ERPs.

## ERPs suportados
- **Omie** — via API REST (app_key/app_secret)
- **Bling** — via API v3 (Bearer token)
- **TOTVS Protheus** — via REST API (Basic Auth)
- **SAP** — via OData/REST (OAuth2)

## Setup

```bash
npm install
cp .env.example .env
# edite o .env com suas credenciais e defina ACTIVE_ERP
npm run dev
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /health | Status da aplicação |
| GET | /api/inventory | Listar produtos/estoque |
| PATCH | /api/inventory/:productId | Atualizar estoque `{ "quantity": 10 }` |
| GET | /api/orders | Listar pedidos de compra |
| GET | /api/orders/:id | Buscar pedido por ID |
| POST | /api/orders | Criar pedido de compra |
| GET | /api/finance/accounts | Listar contas |
| GET | /api/finance/balance | Consultar saldo |
| POST | /api/finance/transactions | Criar lançamento financeiro |

## Trocar de ERP

Basta alterar `ACTIVE_ERP` no `.env`:

```env
ACTIVE_ERP=bling   # ou: sap | totvs | omie | bling
```

## Adicionar novo ERP

1. Crie `src/adapters/meu-erp.js` extendendo `BaseERPAdapter`
2. Registre em `src/adapters/index.js`
