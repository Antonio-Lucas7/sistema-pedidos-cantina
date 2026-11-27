# Sistema de Pedidos da Cantina

Aplicação web para organizar os pedidos do balcão de uma cantina. O atendente escolhe um item do cardápio, informa a quantidade, vê o total em reais e acompanha o pedido até ficar pronto.

Projeto da disciplina **Programação para Sistemas Web**, adaptado do exemplo "Controle Acadêmico" da aula (mesma arquitetura em camadas e mesma stack).

## Status

| Parte | Situação |
|---|---|
| Pacote de tipos (`packages/tipos`) | ✅ Pronto |
| API (`apps/api`) | ✅ Pronta e testada |
| Site (`apps/web`) | 🚧 A fazer (projeto Vite criado, telas ainda não) |

## O que o sistema faz

- Lista o cardápio (nome e preço unitário).
- Registra pedidos de **um único item**, em **várias unidades**.
- Mostra o **total em reais** de cada pedido.
- Lista os pedidos com **filtro por situação**.
- Avança a situação do pedido: `recebido` → `em preparo` → `pronto`.
- Permite **alterar o preço** de um item. A mudança vale só para pedidos novos.

## Regras de negócio

1. A quantidade deve ser um **número inteiro maior que zero**.
2. O **total** é `quantidade × preço registrado no pedido`.
3. O pedido **guarda o preço unitário do momento em que foi feito**. Alterar o cardápio não muda pedidos antigos.
4. A situação só avança, na ordem `recebido` → `em preparo` → `pronto`. Um pedido pronto não avança mais.

Todas essas regras ficam em um só lugar: `apps/api/src/regras/pedidos.ts`.

## Stack

| Ferramenta | Uso |
|---|---|
| **Bun** | Executa TypeScript, instala pacotes, serve a API (`Bun.serve`) e traz o SQLite (`bun:sqlite`) |
| **TypeScript** | Tipos compartilhados entre API e site |
| **SQLite** | Banco em um único arquivo (`apps/api/cantina.sqlite`) |
| **React + Vite** | Site (a fazer) |
| **Tailwind CSS** | Estilos do site (a fazer) |

Sem framework na API e sem ORM: SQL puro, para ver exatamente como cada peça funciona.

## Estrutura do projeto

```
sistema-pedidos-cantina/
├── package.json              configura o monorepo (workspaces) e os atalhos de comando
├── README.md                 este arquivo
├── .gitignore                ignora node_modules, dist e *.sqlite
├── apps/
│   ├── api/                  o servidor (Bun + SQLite), porta 3333
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts              porta de entrada: liga o servidor e lista as rotas
│   │       ├── rotas/
│   │       │   ├── ajudantes.ts      erro() e tradução das mensagens do banco
│   │       │   ├── itens.ts          cardápio
│   │       │   └── pedidos.ts        pedidos
│   │       ├── regras/
│   │       │   └── pedidos.ts        regras de negócio (validação, total, fluxo)
│   │       └── banco/
│   │           ├── criar-tabelas.ts  CREATE TABLE
│   │           ├── conexao.ts        abre o SQLite
│   │           └── popular.ts        dados de exemplo
│   └── web/                  o site (React + Vite), porta 5173 (a fazer)
└── packages/
    └── tipos/                tipos compartilhados (@cantina/tipos)
        ├── package.json
        └── index.ts
```

## Arquitetura em camadas

Cada camada só conversa com a de baixo, e cada arquivo tem uma única responsabilidade.

```
   Navegador / site (React)
            │  HTTP + JSON
            ▼
   index.ts      → mapa de rotas (quem atende cada endereço)
            │
            ▼
   rotas/        → recebem o pedido, validam e montam a resposta
            │
            ▼
   regras/       → regras de negócio (quantidade, total, fluxo da situação)
            │
            ▼
   banco/        → conexão, tabelas e SQL (SQLite)
```

- Mudou uma regra (ex.: novas situações)? Só `regras/`.
- Mudou uma tabela? `banco/` e as rotas que a usam.
- O pacote `packages/tipos` é importado tanto pela API quanto pelo site, então os dois sempre concordam sobre o formato dos dados.

## Modelo de dados

```
itens                          pedidos
─────────────────────          ─────────────────────────────────────
id              PK             id                       PK
nome            TEXT único     item_id                  FK → itens.id
preco_centavos  INTEGER > 0    quantidade               INTEGER > 0
                               data                     TEXT (ISO 8601)
                               preco_unitario_centavos  INTEGER > 0
                               situacao                 recebido | em preparo | pronto
```

Um item pode estar em **vários** pedidos. Cada pedido aponta para **um** item.

- **Valores em centavos (inteiros):** evita erros de arredondamento. O site converte para reais só na hora de exibir (`centavos / 100`).
- **Não existe coluna `total`:** o total é calculado pela API, então nunca fica inconsistente.
- **Restrições no banco** (`CHECK`, `FOREIGN KEY`, `UNIQUE`) protegem os dados mesmo se a API errar.

## Como rodar

Pré-requisito: [Bun](https://bun.sh) instalado (`bun --version`).

Sempre na **raiz do projeto**:

```powershell
bun install              # instala as dependências e liga os workspaces
bun run banco:popular    # apaga os dados e insere o cardápio de exemplo
bun run dev:api          # liga a API em http://localhost:3333/api
```

| Comando | O que faz |
|---|---|
| `bun run dev` | Liga todos os projetos `@cantina/*` que têm script `dev` |
| `bun run dev:api` | Liga só a API (porta 3333) |
| `bun run banco:popular` | Zera o banco e insere o cardápio de exemplo |

Para zerar o banco: apague `apps/api/cantina.sqlite` e rode `bun run banco:popular`.

Cardápio de exemplo: Sanduíche (R$ 8,50), Coxinha (R$ 7,00), Suco (R$ 6,00) e Refrigerante (R$ 5,50).

## Endpoints da API

Base: `http://localhost:3333/api`

| Método | Endereço | Ação | Corpo (JSON) |
|---|---|---|---|
| GET | `/itens` | Lista o cardápio | |
| PUT | `/itens/:id` | Altera o preço do item | `{ "preco_centavos": 950 }` |
| GET | `/pedidos` | Lista pedidos (mais recentes primeiro) | |
| GET | `/pedidos?situacao=pronto` | Lista filtrando por situação | |
| POST | `/pedidos` | Registra um pedido | `{ "item_id": 1, "quantidade": 3 }` |
| PUT | `/pedidos/:id/avancar` | Avança a situação do pedido | |

### Exemplo de resposta (`POST /api/pedidos`, status 201)

```json
{
  "id": 1,
  "item_id": 1,
  "item_nome": "Sanduíche",
  "quantidade": 3,
  "data": "2026-11-26T20:18:00.000Z",
  "preco_unitario_centavos": 850,
  "situacao": "recebido",
  "total_centavos": 2550
}
```

### Status HTTP e erros

| Status | Quando |
|---|---|
| 200 | Deu certo |
| 201 | Pedido criado |
| 400 | Pedido inválido (quantidade ≤ 0, preço inválido, situação inválida, pedido já pronto) |
| 404 | Item ou pedido não encontrado, ou rota inexistente |

Os erros sempre voltam no formato `{ "erro": "mensagem amigável" }`. Qualquer falha inesperada é capturada pela função `error()` do `index.ts`, que traduz as mensagens técnicas do SQLite.

## Roteiro de teste (do enunciado)

Com a API ligada (`bun run dev:api`), em **outro terminal** (PowerShell):

```powershell
# 1. Zero unidades: deve ser recusado (400)
try {
  Invoke-RestMethod -Method Post -Uri http://localhost:3333/api/pedidos `
    -ContentType "application/json" -Body '{"item_id":1,"quantidade":0}'
} catch { $_.ErrorDetails.Message }

# 2. Três sanduíches a R$ 8,50: total_centavos deve ser 2550 (R$ 25,50)
Invoke-RestMethod -Method Post -Uri http://localhost:3333/api/pedidos `
  -ContentType "application/json" -Body '{"item_id":1,"quantidade":3}'

# 3. Altera o preço do sanduíche para R$ 9,50
Invoke-RestMethod -Method Put -Uri http://localhost:3333/api/itens/1 `
  -ContentType "application/json" -Body '{"preco_centavos":950}'

# 4. O pedido antigo deve continuar com total 2550
Invoke-RestMethod -Uri http://localhost:3333/api/pedidos

# 5. Avança a situação (recebido → em preparo → pronto); a terceira chamada é recusada
Invoke-RestMethod -Method Put -Uri http://localhost:3333/api/pedidos/1/avancar

# 6. Filtro por situação
Invoke-RestMethod -Uri "http://localhost:3333/api/pedidos?situacao=pronto"
```

## Site (a fazer)

Plano para `apps/web`, seguindo o mesmo padrão do projeto de referência:

- **Vite + React + TypeScript + Tailwind**, com proxy `/api` → `http://localhost:3333` no `vite.config.ts` (o site chama `/api/...` sem se preocupar com porta nem CORS).
- `src/servicos/api.ts`: único arquivo que conversa com a API (e trata os erros).
- Tela de **novo pedido**: escolher item, informar quantidade e ver o total em reais.
- Tela de **lista de pedidos**: filtro por situação e botão para avançar a situação.
- **Formulário de preço**: altera o preço de um item.
- Conversão de moeda: reais → centavos ao enviar (`Math.round(reais * 100)`) e centavos → reais ao exibir (`centavos / 100`).

## Problemas comuns

| Problema | Solução |
|---|---|
| `bun: command not found` | Feche e abra o terminal depois de instalar o Bun |
| `Cannot find module 'bun'` ou `'@cantina/tipos'` no editor | Rode `bun install` na **raiz** e use `TypeScript: Restart TS Server` no VS Code |
| `Port 3333 is already in use` | Já existe uma API rodando em outro terminal: feche com `Ctrl + C` |
| Mudei uma tabela e nada mudou | `CREATE TABLE IF NOT EXISTS` não altera tabela existente: apague `apps/api/cantina.sqlite` e rode `bun run banco:popular` |
| Pedido recusado com "quantidade deve ser um número inteiro" | A quantidade precisa ir como número no JSON (`3`), não como texto (`"3"`) |

## Observação

Como no projeto de referência, não há login nem senha. É um sistema didático e **não deve ser publicado na internet**.
