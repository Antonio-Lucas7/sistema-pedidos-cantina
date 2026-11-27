# Sistema de Pedidos da Cantina (backend)

API em Bun + SQLite, organizada em camadas: `index.ts` → `rotas/` → `regras/` → `banco/`.

## Como rodar (na pasta backend)

    bun install
    bun run banco:popular
    bun run dev:api

API em http://localhost:3333/api

## Endpoints

| Método | Endereço                   | Ação                                       |
|--------|----------------------------|--------------------------------------------|
| GET    | /api/itens                 | Lista o cardápio                           |
| PUT    | /api/itens/:id             | Altera o preço ({"preco_centavos": 950})   |
| GET    | /api/pedidos               | Lista pedidos (?situacao= opcional)        |
| POST   | /api/pedidos               | Cria ({"item_id": 1, "quantidade": 3})     |
| PUT    | /api/pedidos/:id/avancar   | Avança: recebido → em preparo → pronto     |

Valores em centavos (inteiros). O pedido guarda o preço unitário do momento da compra.
Para zerar o banco, apague apps/api/cantina.sqlite e rode `bun run banco:popular`.
