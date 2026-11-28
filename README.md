# Sistema de Pedidos da Cantina

Aplicação web para organizar os pedidos do balcão de uma cantina. O atendente escolhe um item do cardápio, informa a quantidade, vê o total em reais e acompanha o pedido até ficar pronto.

Projeto da disciplina **Programação para Sistemas Web**, adaptado do exemplo "Controle Acadêmico" da aula (mesma arquitetura em camadas e mesma stack).

## Status

| Parte | Situação |
|---|---|
| Pacote de tipos (`packages/tipos`) | ✅ Pronto |
| API (`apps/api`) | ✅ Pronta e testada |
| Site (`apps/web`) | 🚧 Esqueleto Vite + React + TypeScript criado; telas da cantina ainda não implementadas |

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
| **React + Vite** | Site (`apps/web`, esqueleto criado; telas ainda a fazer) |
| **Tailwind CSS** | Estilos do site (planejado; **ainda não instalado** em `apps/web`) |

Sem framework na API e sem ORM: SQL puro, para ver exatamente como cada peça funciona.

## Estrutura do projeto

Monorepo **Bun workspaces**: `apps/*` são os aplicativos, `packages/*` são pacotes compartilhados. O `package-lock.json` interno do site e a pasta `src/` solta da raiz foram removidos (não serviam para nada; o monorepo usa só o `bun.lock` da raiz e o `src/` do site é `apps/web/src`).

```
n2-trabalho/                        raiz do monorepo
├── package.json                    configura o monorepo (workspaces apps/*, packages/*) e os atalhos de comando
├── README.md                       este arquivo
├── DOCUMENTACAO-BACKEND.md         documentação completa do backend (arquivo por arquivo, testes, FAQ)
├── .gitignore                      ignora node_modules, dist e *.sqlite
├── bun.lock                        lockfile único do monorepo (gerado pelo Bun; não editar à mão)
├── apps/                           aplicativos do monorepo (workspace apps/*)
│   ├── api/                        @cantina/api — o servidor (Bun + SQLite), porta 3333
│   │   ├── package.json            nome, scripts (dev, start, banco:popular) e dependências
│   │   ├── tsconfig.json           configuração TypeScript da API (inclui src/)
│   │   ├── cantina.sqlite          banco SQLite gerado em tempo de execução (gitignored; recriado por banco:popular)
│   │   └── src/                    código-fonte da API
│   │       ├── index.ts            porta de entrada: liga o servidor (Bun.serve) e lista as rotas
│   │       ├── rotas/              camada HTTP: recebem a requisição, validam e montam a resposta
│   │       │   ├── ajudantes.ts    erro() e tradução das mensagens de erro do SQLite
│   │       │   ├── itens.ts        cardápio: GET /api/itens, PUT /api/itens/:id
│   │       │   └── pedidos.ts      pedidos: GET/POST /api/pedidos, PUT /api/pedidos/:id/avancar
│   │       ├── regras/             camada de regras de negócio (sem HTTP, sem SQL)
│   │       │   └── pedidos.ts      SITUACOES, validarQuantidade, calcularTotal, proximaSituacao
│   │       └── banco/              camada de dados (SQLite)
│   │           ├── conexao.ts      abre apps/api/cantina.sqlite, liga FOREIGN KEYS e cria as tabelas
│   │           ├── criar-tabelas.ts CREATE TABLE IF NOT EXISTS (itens, pedidos)
│   │           └── popular.ts      apaga tudo, reinicia ids e insere o cardápio de exemplo
│   └── web/                        @cantina/web — o site (React + Vite + TypeScript), porta 5173 (esqueleto; telas a fazer)
│       ├── package.json            nome, scripts (dev, build, lint, preview) e dependências
│       ├── .gitignore              ignora node_modules, dist, dist-ssr, *.local, arquivos de editor
│       ├── index.html              página HTML única; carrega /src/main.tsx
│       ├── vite.config.ts          configuração do Vite (plugin React)
│       ├── eslint.config.js        configuração do ESLint (typescript-eslint, react-hooks, react-refresh)
│       ├── tsconfig.json           solução TS: referencia tsconfig.app.json e tsconfig.node.json
│       ├── tsconfig.app.json       TS do código do site (src/, JSX react-jsx, tipos vite/client)
│       ├── tsconfig.node.json      TS dos arquivos de configuração Node (vite.config.ts)
│       └── src/                    código-fonte do site
│           ├── main.tsx            entrada React: createRoot(...).render(<App />) em StrictMode
│           ├── App.tsx             componente raiz atual (esqueleto: botão de tema claro/escuro + "Hello world")
│           ├── App.css             estilos do componente App (vazio por enquanto; importado por App.tsx)
│           └── index.css           estilos globais (variáveis de tema claro/escuro, base, layout)
├── packages/                       pacotes compartilhados do monorepo (workspace packages/*)
│   └── tipos/                      @cantina/tipos — tipos TypeScript compartilhados entre API e site
│       ├── package.json            nome @cantina/tipos, main/types = index.ts
│       └── index.ts                Situacao, Item, Pedido, PedidoDetalhado, NovoPedido
├── node_modules/                   dependências instaladas pelo Bun (não versionado; há também apps/web/node_modules)
└── .git/                           dados do versionamento Git (não versionado dentro de si)
```

### Resumo por diretório

| Diretório | O que faz | O que guarda |
|---|---|---|
| `/` (raiz) | Raiz do monorepo Bun | `package.json`, `bun.lock`, `README.md`, `DOCUMENTACAO-BACKEND.md`, `.gitignore`, `apps/`, `packages/`, `node_modules/`, `.git/` |
| `apps/` | Agrupa os aplicativos (workspace `apps/*`) | `apps/api/`, `apps/web/` |
| `apps/api/` | Servidor da cantina (`@cantina/api`), porta 3333 | `package.json`, `tsconfig.json`, `src/`, `cantina.sqlite` (gerado, gitignored) |
| `apps/api/src/` | Código-fonte da API | `index.ts`, `rotas/`, `regras/`, `banco/` |
| `apps/api/src/rotas/` | Camada HTTP: rotas, validação de entrada, respostas e erros | `ajudantes.ts`, `itens.ts`, `pedidos.ts` |
| `apps/api/src/regras/` | Camada de regras de negócio puras (sem HTTP/SQL) | `pedidos.ts` |
| `apps/api/src/banco/` | Camada de dados SQLite | `conexao.ts`, `criar-tabelas.ts`, `popular.ts` |
| `apps/web/` | Site (`@cantina/web`, React + Vite + TS), porta 5173; esqueleto, telas a fazer | `package.json`, `.gitignore`, `index.html`, `vite.config.ts`, `eslint.config.js`, `tsconfig*.json`, `src/`, `node_modules/` |
| `apps/web/src/` | Código-fonte do site | `main.tsx`, `App.tsx`, `App.css`, `index.css` |
| `packages/` | Agrupa pacotes compartilhados (workspace `packages/*`) | `packages/tipos/` |
| `packages/tipos/` | Tipos TypeScript compartilhados (`@cantina/tipos`) | `package.json`, `index.ts` |
| `node_modules/` | Dependências instaladas (não versionado) | pacotes baixados pelo Bun |

### O que foi apagado (não servia para nada)

| Caminho | Por que não servia |
|---|---|
| `src/` (raiz) + `src/assets/` | Pasta `src` solta na raiz, vazia; o código vive em `apps/*` e `packages/*`, e nada a referenciava |
| `apps/api/src/regras/sistema-pedidos-cantina.code-workspace` | Arquivo de workspace do VS Code dentro da pasta de regras; apontava para um caminho fixo de outra máquina (`.../Users/admde/Downloads/...`) e não afeta o projeto |
| `apps/web/package-lock.json` | Lockfile do npm dentro de um monorepo Bun que já usa `bun.lock` na raiz; `bun install` não o usa |

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
- O pacote `packages/tipos` é importado pela API (e deve ser reusado pelo site; hoje `apps/web` ainda não importa nada dele), então os dois concordam sobre o formato dos dados.

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
| `bun run dev` | Liga todos os projetos `@cantina/*` que têm script `dev` (API + site) |
| `bun run dev:api` | Liga só a API (porta 3333) |
| `bun run banco:popular` | Zera o banco e insere o cardápio de exemplo |

Para zerar o banco: apague `apps/api/cantina.sqlite` e rode `bun run banco:popular`.

Cardápio de exemplo: Sanduíche (R$ 8,50), Coxinha (R$ 7,00), Suco (R$ 6,00) e Refrigerante (R$ 5,50).

O site (`apps/web`) tem seus próprios scripts: `bun run --filter @cantina/web dev` (porta 5173), `build`, `lint` e `preview`. Hoje ele sobe apenas um esqueleto (tema claro/escuro + "Hello world"), sem conversar com a API.

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

`apps/web` já existe como esqueleto **Vite + React + TypeScript** (scaffold), mas as telas da cantina ainda não foram implementadas. Plano, seguindo o mesmo padrão do projeto de referência:

- Proxy `/api` → `http://localhost:3333` no `vite.config.ts` (o site chama `/api/...` sem se preocupar com porta nem CORS). Hoje **não** há proxy configurado.
- **Tailwind CSS**: estilização. Hoje **não** está instalado.
- `src/servicos/api.ts`: único arquivo que conversa com a API (e trata os erros). Hoje **não** existe.
- Tela de **novo pedido**: escolher item, informar quantidade e ver o total em reais.
- Tela de **lista de pedidos**: filtro por situação e botão para avançar a situação.
- **Formulário de preço**: altera o preço de um item.
- Conversão de moeda: reais → centavos ao enviar (`Math.round(reais * 100)`) e centavos → reais ao exibir (`centavos / 100`).
- Reusar os tipos de `@cantina/tipos` (`Item`, `PedidoDetalhado`, `NovoPedido`, `Situacao`).

## Documentação extra

- `DOCUMENTACAO-BACKEND.md` (raiz): documentação completa do backend — o que é o Bun, estrutura de pastas, arquivo por arquivo, modelo de dados, referência da API, testes, depuração e próximos passos.

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
