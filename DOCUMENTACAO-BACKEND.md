# Documentação do Backend — Sistema de Pedidos da Cantina

Documentação completa da API: o que é o Bun, como funciona o monorepo, o que cada pasta e cada arquivo faz, o que cada função recebe e devolve, como testar e como depurar.

> Os exemplos de resposta e os casos de borda das seções 9 e 11 foram executados de verdade contra a API (Bun 1.4.5), não apenas escritos de cabeça.

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Como rodar](#2-como-rodar)
3. [O que é o Bun](#3-o-que-é-o-bun)
4. [Como funciona o monorepo](#4-como-funciona-o-monorepo)
5. [Estrutura de pastas](#5-estrutura-de-pastas)
6. [Arquitetura em camadas](#6-arquitetura-em-camadas)
7. [Explicação arquivo por arquivo](#7-explicação-arquivo-por-arquivo)
8. [Modelo de dados e regras de negócio](#8-modelo-de-dados-e-regras-de-negócio)
9. [Referência da API](#9-referência-da-api)
10. [A viagem de uma requisição](#10-a-viagem-de-uma-requisição)
11. [Testes](#11-testes)
12. [Depuração e problemas comuns](#12-depuração-e-problemas-comuns)
13. [Limitações conhecidas e próximos passos](#13-limitações-conhecidas-e-próximos-passos)
14. [Como acrescentar uma funcionalidade](#14-como-acrescentar-uma-funcionalidade)
15. [Glossário](#15-glossário)

---

## 1. Visão geral

O backend é uma **API HTTP** que recebe pedidos em JSON, aplica as regras da cantina e guarda tudo em um banco **SQLite**. Ele não tem tela: quem mostra as telas é o site (`apps/web`, ainda a fazer), que conversa com a API.

**O que a API faz:**

- Lista o cardápio (itens com nome e preço).
- Altera o preço de um item.
- Registra pedidos de **um único item**, em **várias unidades**.
- Calcula o **total** de cada pedido.
- Lista os pedidos, com **filtro por situação**.
- Avança a situação do pedido: `recebido` → `em preparo` → `pronto`.

**Tecnologias:**

| Tecnologia | Papel |
|---|---|
| Bun | Executa o TypeScript, instala pacotes, serve a API e traz o SQLite embutido |
| TypeScript | Tipos para evitar erros antes de rodar |
| SQLite | Banco de dados em um único arquivo (`apps/api/cantina.sqlite`) |

Não há framework (como Express) nem ORM: a API usa só `Bun.serve` e SQL puro. A ideia é ver exatamente como cada peça funciona, sem "mágica".

---

## 2. Como rodar

**Pré-requisito:** Bun instalado. Confira com `bun --version`.

Sempre na **raiz do projeto** (a pasta onde está o `package.json` com `workspaces`):

```powershell
bun install              # 1. instala dependências e liga os workspaces
bun run banco:popular    # 2. cria o banco e insere o cardápio de exemplo
bun run dev:api          # 3. liga a API em http://localhost:3333/api
```

| Comando | Termina sozinho? | O que faz |
|---|---|---|
| `bun install` | Sim | Instala as dependências |
| `bun run banco:popular` | Sim | Apaga itens e pedidos e recria o cardápio de exemplo |
| `bun run dev:api` | **Não** | Liga a API e a deixa rodando (reinicia ao salvar arquivos) |
| `bun run dev` | **Não** | Liga todos os projetos `@cantina/*` que tenham script `dev` |

A API **não sobe sozinha**: ela só funciona enquanto o `dev:api` estiver aberto. Para testar, use **outro terminal**. `Ctrl + C` desliga.

**Zerar o banco:** apague `apps/api/cantina.sqlite` e rode `bun run banco:popular`.

---

## 3. O que é o Bun

O **Bun** é uma ferramenta única que substitui várias que antes eram separadas:

| No jeito tradicional | No Bun |
|---|---|
| Node.js para rodar JavaScript | `bun arquivo.ts` |
| Compilar TypeScript antes de rodar | O Bun roda `.ts` direto |
| npm para instalar pacotes | `bun install`, `bun add` |
| nodemon para reiniciar ao salvar | `bun --watch` |
| Biblioteca externa de SQLite | `bun:sqlite` (já embutido) |
| Framework de servidor (Express etc.) | `Bun.serve` (já embutido) |

Por isso este projeto quase não tem dependências: o servidor e o banco **fazem parte do Bun**.

### 3.1 Roda TypeScript, mas não confere os tipos

O Bun executa arquivos `.ts` simplesmente **removendo as anotações de tipo**. Ele **não verifica** se os tipos estão corretos. Quem verifica são:

- o **editor** (VS Code), que sublinha os erros em vermelho;
- o comando `bunx tsc --noEmit`, que confere o projeto inteiro.

Isso explica um erro comum: o editor mostra `Cannot find module 'bun:sqlite'`, mas a API roda normalmente. O código sempre esteve certo; o editor é que não conhecia as peças embutidas do Bun (veja a seção 3.4).

### 3.2 Peças embutidas que o projeto usa

| Peça | Onde aparece | O que é |
|---|---|---|
| `bun:sqlite` | `banco/conexao.ts` | Cliente SQLite nativo (`Database`, `.query()`, `.run()`) |
| `Bun.serve` | `index.ts` | Servidor HTTP com mapa de rotas |
| `import.meta.dir` | `banco/conexao.ts` | Pasta do arquivo atual (exclusivo do Bun) |
| `Request` / `Response` | `rotas/*.ts` | Objetos do padrão web, os mesmos do `fetch` do navegador |
| `BunRequest` | `rotas/*.ts` | `Request` com a propriedade extra `params` (ex.: o `:id` da rota) |

`Response.json(dados, { status })` cria uma resposta com corpo em JSON e o status HTTP escolhido.

### 3.3 Comandos que você vai usar

| Comando | O que faz |
|---|---|
| `bun install` | Lê os `package.json`, baixa as dependências e liga os workspaces |
| `bun add pacote` | Adiciona uma dependência ao projeto onde você está |
| `bun add -d pacote` | Adiciona como dependência de **desenvolvimento** (só para programar, como `@types/bun`) |
| `bun run nome` | Executa o script `nome` do `package.json` |
| `bun arquivo.ts` | Executa um arquivo direto |
| `bun --watch arquivo.ts` | Executa e **reinicia sozinho** a cada arquivo salvo |
| `bunx pacote` | Executa um programa de um pacote sem instalá-lo de vez (ex.: `bunx tsc`) |

### 3.4 Por que existe `@types/bun` e `tsconfig.json`

- **`@types/bun`** (em `devDependencies`) ensina ao TypeScript quais são os tipos de `bun:sqlite`, `Bun.serve` e `BunRequest`.
- **`apps/api/tsconfig.json`** diz ao TypeScript como tratar os arquivos da API e **qual pacote de tipos carregar** (`"types": ["bun"]`). Sem ele, o editor não encontra `bun:sqlite`.

Conteúdo do `tsconfig.json` (crie-o em `apps/api/`, ao lado do `package.json` da API):

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "types": ["bun"]
  },
  "include": ["src"]
}
```

| Opção | Significado |
|---|---|
| `lib: ["ESNext"]` | Usa os recursos mais novos do JavaScript |
| `target`, `module: "ESNext"` | Código moderno, com `import`/`export` |
| `moduleResolution: "bundler"` | Resolve `import` como o Bun faz (sem exigir extensão `.ts`) |
| `noEmit: true` | O TypeScript só **confere**, não gera arquivos (quem executa é o Bun) |
| `strict: true` | Ativa as checagens rigorosas de tipo |
| `skipLibCheck: true` | Não reconfere os `.d.ts` de bibliotecas (mais rápido) |
| `types: ["bun"]` | Carrega os tipos do `@types/bun` |
| `include: ["src"]` | Só confere o código da pasta `src` |

Para conferir os tipos sem depender do editor, dentro de `apps/api`:

```powershell
bunx tsc --noEmit
```

Se não imprimir nada, está tudo certo.

---

## 4. Como funciona o monorepo

### 4.1 O conceito

Um **monorepo** guarda **vários projetos no mesmo repositório**. Aqui são dois pacotes:

- `apps/api` — o servidor;
- `packages/tipos` — os tipos compartilhados (e, no futuro, `apps/web` também usará).

A alternativa seria um repositório para cada um. O monorepo evita isso: um único `bun install` instala tudo, e uma mudança em um tipo aparece na hora em todos os projetos que o usam.

### 4.2 O `package.json` da raiz

```json
{
  "name": "sistema-pedidos-cantina",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "bun run --filter \"@cantina/*\" dev",
    "dev:api": "bun run --filter @cantina/api dev",
    "banco:popular": "bun run --filter @cantina/api banco:popular"
  }
}
```

| Campo | O que faz |
|---|---|
| `"private": true` | Impede publicar a raiz por engano na internet (ela só organiza o conjunto) |
| `"workspaces"` | Lista, em padrões de pasta, onde ficam os projetos. `"apps/*"` significa "toda pasta dentro de `apps` que tenha um `package.json`" |
| `"scripts"` | Atalhos de comando, executados com `bun run nome` |

Cada pasta encontrada por `workspaces` é um **workspace**: um projeto com seu próprio `package.json`, seu nome e suas dependências.

### 4.3 Nomes de pacote e o escopo `@cantina`

Cada workspace tem um `"name"`: `@cantina/api` e `@cantina/tipos`. O trecho `@cantina/` é um **escopo** (um "sobrenome"). Ele serve para:

- identificar o pacote de forma única;
- escolher projetos em lote com `--filter "@cantina/*"`.

É o **nome**, e não o caminho da pasta, que outros projetos usam para importar.

### 4.4 Como a API usa o pacote de tipos

Em `apps/api/package.json`:

```json
"dependencies": { "@cantina/tipos": "workspace:*" }
```

`"workspace:*"` significa: "use o pacote **local** deste repositório, em qualquer versão". Ele **não** baixa nada da internet. Depois do `bun install`, o Bun cria um **link** (atalho) de `@cantina/tipos` para a pasta `packages/tipos`. Por isso, dentro da API, isto funciona:

```ts
import type { Item } from "@cantina/tipos";
```

E o `packages/tipos/package.json` tem `"main": "index.ts"` e `"types": "index.ts"`. Ou seja, o "pacote" aponta direto para o código-fonte `.ts`, **sem etapa de compilação** (o Bun lê TypeScript direto).

```
   packages/tipos  ◄────  apps/api       (hoje)
        ▲
        └──────────────  apps/web       (futuro)
```

A direção é sempre a mesma: os projetos dependem dos tipos; os tipos não dependem de ninguém.

### 4.5 O que o `bun install` faz

Na raiz, o `bun install`:

1. lê todos os `package.json` dos workspaces;
2. junta as dependências de todos (`@types/bun`, `@cantina/tipos`...);
3. baixa o que for externo e guarda na pasta `node_modules`;
4. cria os links entre os workspaces (o `@cantina/tipos` → `packages/tipos`);
5. grava o arquivo `bun.lock`.

Sobre as pastas geradas:

- **`node_modules`** é gerada, pesada e **não vai para o Git** (está no `.gitignore`). Pode apagar e recriar com `bun install` a qualquer momento.
- Dependendo da versão, o Bun guarda os pacotes no `node_modules` da raiz (com uma pasta oculta `.bun`) e/ou no `node_modules` de cada app (ex.: `apps/api/node_modules/@types/bun`). Você não precisa mexer nisso.
- **`bun.lock`** registra as versões exatas instaladas, para todo mundo ter o mesmo resultado. Esse **vai para o Git**.

### 4.6 O que o `--filter` faz

```powershell
bun run --filter @cantina/api dev
```

Executa o script `dev` **apenas** no pacote `@cantina/api`. Com `--filter "@cantina/*"`, executa o script `dev` em **todos** os pacotes com esse escopo que tenham um script `dev` (os que não têm são ignorados). É o que torna possível ter, no futuro, um único `bun run dev` ligando a API e o site juntos.

A cadeia completa de `bun run dev:api`:

```
bun run dev:api                              ← package.json da raiz
   └─ bun run --filter @cantina/api dev      ← escolhe o projeto @cantina/api
        └─ bun --watch src/index.ts          ← script "dev" de apps/api/package.json
             └─ Bun.serve({ port: 3333 })    ← o servidor fica de pé
```

### 4.6.1 Os três `package.json` do projeto

| Arquivo | Para que serve |
|---|---|
| `package.json` (raiz) | Declara os workspaces e os atalhos de comando |
| `apps/api/package.json` | Scripts reais da API e suas dependências |
| `packages/tipos/package.json` | Descreve o pacote de tipos e onde está o código dele |

### 4.7 Resumo: por que usar monorepo aqui

| Vantagem | Exemplo |
|---|---|
| Um só `bun install` | Instala API, tipos e (depois) o site de uma vez |
| Tipos compartilhados | Mudou um campo em `Pedido`? O TypeScript aponta tudo que precisa ajustar |
| Atalhos de comando | `bun run dev:api` da raiz, sem entrar em pastas |
| Um só repositório | Um `git push` leva tudo |

---

## 5. Estrutura de pastas

```
sistema-pedidos-cantina/
├── package.json                  workspaces + atalhos de comando
├── bun.lock                      versões exatas das dependências (gerado)
├── .gitignore                    ignora node_modules, dist e *.sqlite
├── README.md                     visão geral do projeto
├── apps/                         os PROGRAMAS que rodam
│   ├── api/                      o servidor (porta 3333)
│   │   ├── package.json          scripts e dependências da API
│   │   ├── tsconfig.json         configuração do TypeScript (veja a seção 3.4)
│   │   ├── cantina.sqlite        o banco (gerado ao ligar a API; fora do Git)
│   │   └── src/
│   │       ├── index.ts          porta de entrada: mapa de rotas
│   │       ├── rotas/            recebem o pedido HTTP e respondem
│   │       │   ├── ajudantes.ts
│   │       │   ├── itens.ts
│   │       │   └── pedidos.ts
│   │       ├── regras/           regras de negócio
│   │       │   └── pedidos.ts
│   │       └── banco/            conexão, tabelas e dados de exemplo
│   │           ├── criar-tabelas.ts
│   │           ├── conexao.ts
│   │           └── popular.ts
│   └── web/                      o site (a fazer)
└── packages/                     código COMPARTILHADO
    └── tipos/
        ├── package.json
        └── index.ts              os tipos (Item, Pedido, Situacao...)
```

Regra para lembrar: **`apps/` são programas que rodam; `packages/` são bibliotecas que os programas importam.**

---

## 6. Arquitetura em camadas

A API é organizada como uma lasanha: cada camada só conversa com a de baixo, e cada arquivo tem **uma única responsabilidade**.

```
   Cliente (navegador, site, curl)
            │   HTTP + JSON
            ▼
   ┌─────────────────────────────────────────────────────┐
   │ index.ts    Mapa de rotas: quem atende cada endereço │
   └─────────────────────────────────────────────────────┘
            ▼
   ┌─────────────────────────────────────────────────────┐
   │ rotas/      Lê o pedido, valida, monta a resposta    │
   └─────────────────────────────────────────────────────┘
            ▼
   ┌─────────────────────────────────────────────────────┐
   │ regras/     Regras de negócio (funções puras)        │
   └─────────────────────────────────────────────────────┘
            ▼
   ┌─────────────────────────────────────────────────────┐
   │ banco/      Conexão e tabelas do SQLite              │
   └─────────────────────────────────────────────────────┘
```

| Camada | Responsabilidade | O que NÃO faz |
|---|---|---|
| `index.ts` | Ligar o servidor e dizer qual função atende cada rota | Não tem regra nem SQL |
| `rotas/` | Traduzir HTTP ↔ dados: ler o corpo, chamar as regras, rodar SQL, escolher o status | Não decide o que é um pedido válido (isso é das regras) |
| `regras/` | Dizer o que é válido e calcular (quantidade, total, próxima situação) | Não conhece HTTP nem banco |
| `banco/` | Abrir o SQLite, criar tabelas, popular | Não conhece regras |

**Por que separar?** Mudou a regra de negócio? Só `regras/`. Mudou uma tabela? `banco/` e as rotas que a usam. Cada arquivo continua pequeno e fácil de ler.

---

## 7. Explicação arquivo por arquivo

### 7.1 `packages/tipos/index.ts`

Define o **formato dos dados**. Só existe em tempo de desenvolvimento (tipos somem quando o código roda), mas guia o editor e o `tsc`.

```ts
export type Situacao = "recebido" | "em preparo" | "pronto";
```
Só estes três textos são aceitos. O `|` cria uma **união**: o valor tem de ser um deles.

```ts
export type Item = { id: number; nome: string; preco_centavos: number };
```
Uma linha da tabela `itens`.

```ts
export type Pedido = {
  id: number;
  item_id: number;
  quantidade: number;
  data: string;                      // texto ISO 8601
  preco_unitario_centavos: number;   // preço congelado no momento do pedido
  situacao: Situacao;
};
```
Uma linha da tabela `pedidos`.

```ts
export type PedidoDetalhado = Pedido & { item_nome: string; total_centavos: number };
```
O `&` **junta** tipos: o pedido mais dois campos que não existem na tabela. `item_nome` vem do JOIN com `itens`; `total_centavos` é calculado pela regra.

```ts
export type NovoPedido = { item_id: number; quantidade: number };
```
O que o cliente envia para **criar** um pedido (só o item e a quantidade; o resto a API preenche).

### 7.2 `apps/api/package.json`

| Campo | Significado |
|---|---|
| `"name": "@cantina/api"` | Nome do pacote (usado pelo `--filter`) |
| `"type": "module"` | Usa `import`/`export` (módulos modernos) |
| `scripts.dev` | `bun --watch src/index.ts`: liga a API e reinicia ao salvar |
| `scripts.start` | `bun src/index.ts`: liga a API sem reiniciar |
| `scripts.banco:popular` | `bun src/banco/popular.ts`: insere o cardápio de exemplo |
| `dependencies` | `@cantina/tipos` em `workspace:*` (pacote local) |
| `devDependencies` | `@types/bun`: só para programar (tipos do Bun) |

### 7.3 `banco/criar-tabelas.ts`

**Função:** `criarTabelas(banco: Database): void`
Recebe a conexão aberta e cria as duas tabelas. Usa `banco.run(sql)` para executar SQL sem esperar linhas de volta.

`CREATE TABLE IF NOT EXISTS` só cria a tabela se ela **ainda não existir**. Por isso a função pode rodar toda vez que a API liga sem apagar dados. A consequência: **se você mudar a definição de uma tabela depois de criada, nada muda**. Para refletir a mudança, apague `cantina.sqlite` e rode `banco:popular`.

**Tabela `itens`**

| Coluna | Definição | Efeito |
|---|---|---|
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | O banco gera o id sozinho: 1, 2, 3... |
| `nome` | `TEXT NOT NULL UNIQUE` | Obrigatório e não repete |
| `preco_centavos` | `INTEGER NOT NULL CHECK (preco_centavos > 0)` | Obrigatório e sempre maior que zero |

**Tabela `pedidos`**

| Coluna | Definição | Efeito |
|---|---|---|
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Id automático |
| `item_id` | `INTEGER NOT NULL REFERENCES itens(id)` | **Chave estrangeira**: precisa existir em `itens` |
| `quantidade` | `INTEGER NOT NULL CHECK (quantidade > 0)` | Inteira e maior que zero |
| `data` | `TEXT NOT NULL` | Data/hora em texto ISO 8601 (UTC) |
| `preco_unitario_centavos` | `INTEGER NOT NULL CHECK (... > 0)` | **Preço copiado do item no momento do pedido** |
| `situacao` | `TEXT NOT NULL DEFAULT 'recebido' CHECK (situacao IN (...))` | Só aceita os três valores; começa em `recebido` |

> **Atenção:** a lista `('recebido', 'em preparo', 'pronto')` aparece aqui **e** em `regras/pedidos.ts` (`SITUACOES`) **e** no tipo `Situacao`. Se criar uma situação nova, atualize os três lugares.

O `CHECK` e o `REFERENCES` são uma **segunda barreira de proteção**: mesmo que a API tenha um erro, o banco recusa dados inválidos.

### 7.4 `banco/conexao.ts`

```ts
import { Database } from "bun:sqlite";
import { criarTabelas } from "./criar-tabelas";

const caminhoDoArquivo = import.meta.dir + "/../../cantina.sqlite";
export const banco = new Database(caminhoDoArquivo, { create: true });

banco.run("PRAGMA foreign_keys = ON");
criarTabelas(banco);
```

Linha por linha:

1. **`import.meta.dir`** é a pasta deste arquivo (`apps/api/src/banco`). Somar `"/../../cantina.sqlite"` sobe duas pastas e cai em `apps/api/`. Assim o banco fica sempre no mesmo lugar, **não importa de onde você rodou o comando**.
2. **`new Database(caminho, { create: true })`** abre o arquivo SQLite e **cria** se ele não existir.
3. **`export const banco`** exporta a conexão. Todos os outros arquivos importam esta **mesma** conexão (uma só para o programa inteiro).
4. **`PRAGMA foreign_keys = ON`**: no SQLite a checagem de chave estrangeira vem **desligada** por padrão, a cada conexão. Sem esta linha, o `REFERENCES` seria ignorado.
5. **`criarTabelas(banco)`** garante que as tabelas existem.

> **Efeito colateral importante:** este código roda **no momento em que o arquivo é importado**. Importar `conexao.ts` já abre o banco e cria as tabelas. É por isso que o `popular.ts`, que só importa `banco`, já encontra tudo pronto.

### 7.5 `banco/popular.ts`

Script que roda sozinho (`bun run banco:popular`) e termina.

```ts
banco.run("DELETE FROM pedidos");   // 1º: filhos antes dos pais
banco.run("DELETE FROM itens");
banco.run("DELETE FROM sqlite_sequence"); // zera os contadores de id
```

- **A ordem importa:** `pedidos` referencia `itens`, então os pedidos precisam ser apagados **antes** dos itens. Do contrário a chave estrangeira bloquearia.
- **`sqlite_sequence`** é uma tabela interna do SQLite que guarda o último id de cada tabela com `AUTOINCREMENT`. Apagá-la faz os ids voltarem a começar do 1.

```ts
const inserir = banco.query("INSERT INTO itens (nome, preco_centavos) VALUES (?, ?)");
inserir.run("Sanduíche", 850);
...
```

- **`banco.query(sql)`** prepara o comando uma vez (uma "instrução preparada"). O `?` é um **parâmetro**, preenchido em ordem por `.run(...)`.
- Reaproveitar a mesma instrução com valores diferentes é mais eficiente e **seguro**.

Cardápio inserido:

| id | Nome | Preço |
|---|---|---|
| 1 | Sanduíche | R$ 8,50 (850) |
| 2 | Coxinha | R$ 7,00 (700) |
| 3 | Suco | R$ 6,00 (600) |
| 4 | Refrigerante | R$ 5,50 (550) |

> Este comando **apaga todos os pedidos**. Use só para começar do zero.

### 7.6 `regras/pedidos.ts`

Aqui ficam as regras de negócio, em funções **puras**: recebem valores e devolvem valores, sem tocar em HTTP nem no banco. Por isso são fáceis de entender e de testar.

**`SITUACOES: Situacao[]`**
`["recebido", "em preparo", "pronto"]`. **A ordem da lista é a ordem do fluxo.**

**`validarQuantidade(quantidade: unknown): string | null`**

| | |
|---|---|
| Recebe | Qualquer valor (`unknown`), pois vem do JSON do cliente e não dá para confiar |
| Devolve | `null` se estiver válida; ou uma **mensagem de erro** em texto |
| Regra | Precisa ser **número inteiro** (`Number.isInteger`) e **maior que zero** |

| Entrada | Resultado |
|---|---|
| `3` | `null` (válida) |
| `0`, `-1` | mensagem de erro |
| `2.5` | mensagem de erro (não é inteiro) |
| `"3"` (texto) | mensagem de erro (`Number.isInteger("3")` é falso) |
| `undefined` | mensagem de erro |

O padrão "devolve `null` quando está tudo certo, ou o texto do problema" é o mesmo usado nas rotas: `const problema = validar(...); if (problema) return erro(problema);`.

**`calcularTotal(quantidade: number, precoUnitarioCentavos: number): number`**
Devolve `quantidade × precoUnitarioCentavos`, em centavos. Ex.: `calcularTotal(3, 850)` → `2550` (R$ 25,50). Como tudo é inteiro, **não há erro de arredondamento**.

**`proximaSituacao(atual: Situacao): Situacao | null`**
Procura a posição da situação atual em `SITUACOES` (`indexOf`) e devolve a seguinte. Se já for a última, o `?? null` devolve `null`.

| Entrada | Saída |
|---|---|
| `"recebido"` | `"em preparo"` |
| `"em preparo"` | `"pronto"` |
| `"pronto"` | `null` (fim do fluxo) |

### 7.7 `rotas/ajudantes.ts`

Pequenas funções usadas por todas as rotas.

**`erro(mensagem: string, status = 400): Response`**
Monta uma resposta de erro padronizada: corpo `{ "erro": "mensagem" }` e o status HTTP escolhido (400 se você não informar).

**`traduzirErroDoBanco(mensagem: string): string`**
Troca mensagens técnicas do SQLite (em inglês) por frases que o usuário entende:

| Se a mensagem contém... | A API responde... |
|---|---|
| `UNIQUE constraint failed` | Já existe um registro com esses dados. |
| `FOREIGN KEY constraint failed` | Item inexistente ou ligado a pedidos. |
| `CHECK constraint failed` | Quantidade e preço devem ser maiores que zero. |
| qualquer outra coisa | A mensagem original, sem alteração |

Com as rotas atuais, as validações das rotas barram esses casos **antes** de chegar ao banco; a tradução funciona como **rede de segurança**. Já o último caso (mensagem sem alteração) é o que acontece com um JSON malformado (seção 11).

### 7.8 `rotas/itens.ts`

**`listar(): Response`**
`SELECT * FROM itens ORDER BY nome` e devolve a lista em JSON (status 200). `.all()` devolve **todas** as linhas.

**`atualizarPreco(req: BunRequest<"/api/itens/:id">): Promise<Response>`**
Altera o preço de um item. Passos:

1. Lê o corpo: `await req.json()` → `{ preco_centavos }`.
2. **Valida:** precisa ser inteiro e maior que zero. Senão, `400`.
3. Executa `UPDATE itens SET preco_centavos = ? WHERE id = ?` (o id vem de `req.params.id`).
4. Se `resultado.changes === 0`, nenhum item foi alterado, ou seja, **o id não existe** → `404`.
5. Busca o item atualizado e o devolve (`200`).

> **Ponto central do enunciado:** esta rota atualiza **só** a tabela `itens`. Os pedidos antigos **não são tocados**, pois cada um guarda o seu próprio `preco_unitario_centavos`. Por isso o total de um pedido antigo não muda.

O tipo `BunRequest<"/api/itens/:id">` diz ao TypeScript que `req.params.id` existe.

### 7.9 `rotas/pedidos.ts`

**Constantes e tipos internos**

```ts
type Linha = Omit<PedidoDetalhado, "total_centavos">;
```
Uma linha vinda do banco: tudo do `PedidoDetalhado`, **menos** o total (o banco não guarda o total). `Omit` "retira" campos de um tipo.

```ts
const SELECT_PEDIDOS = `
  SELECT p.*, i.nome AS item_nome
  FROM pedidos p
  JOIN itens i ON i.id = p.item_id`;
```
O `SELECT` base, reutilizado em várias rotas. O **JOIN** une `pedidos` com `itens` pelo `item_id` para trazer o **nome** do item. `p` e `i` são apelidos das tabelas.

**`comTotal(linha: Linha): PedidoDetalhado`**
Pega a linha do banco e **acrescenta** `total_centavos`, calculado por `calcularTotal(quantidade, preco_unitario_centavos)`. Note que usa o **preço do pedido**, não o preço atual do item. É assim que o total antigo fica preservado.

**`listar(req: BunRequest): Response`** — `GET /api/pedidos`

1. Lê `?situacao=` da URL: `new URL(req.url).searchParams.get("situacao")`.
2. Se foi informada e **não** está em `SITUACOES`, responde `400` ("Situação inválida.").
3. Com filtro: `... WHERE p.situacao = ? ORDER BY p.id DESC`. Sem filtro: lista tudo, do **mais recente para o mais antigo** (`ORDER BY p.id DESC`).
4. Passa cada linha por `comTotal` (`map`) e devolve o JSON.

Detalhe: `?situacao=` vazio conta como "sem filtro" (texto vazio é tratado como falso). Uma situação válida sem pedidos devolve `[]` com status `200` (lista vazia não é erro).

**`criar(req: BunRequest): Promise<Response>`** — `POST /api/pedidos`

1. Lê o corpo: `{ item_id, quantidade }`.
2. **Valida a quantidade** com `validarQuantidade`. Se houver problema → `400`.
3. Busca o item: `SELECT * FROM itens WHERE id = ?`. Se não existe → `404` ("Item não encontrado.").
4. **Insere** o pedido, copiando `item.preco_centavos` para `preco_unitario_centavos` e gravando a data atual (`new Date().toISOString()`).
5. Busca o pedido recém-criado usando `resultado.lastInsertRowid` (o id que o banco acabou de gerar), calcula o total e responde `201` (Created).

Os `?` do SQL são sempre preenchidos com `.run(...)`/`.get(...)`. **Nunca se concatenam valores no texto do SQL**: isso abriria brecha para **SQL Injection**.

**`avancar(req: BunRequest<"/api/pedidos/:id/avancar">): Response`** — `PUT /api/pedidos/:id/avancar`

1. Busca o pedido pelo id. Se não existe → `404`.
2. `proximaSituacao(pedido.situacao)`. Se for `null` (já está `pronto`) → `400` ("Este pedido já está pronto.").
3. `UPDATE pedidos SET situacao = ? WHERE id = ?`.
4. Devolve o pedido atualizado (`200`).

O cliente **não escolhe** a situação nova: ele só pede "avançar". A regra de qual é a próxima mora na API, então ninguém pode pular de `recebido` direto para `pronto`.

### 7.10 `index.ts`

A porta de entrada. Liga o servidor e liga cada endereço à função que o atende.

```ts
Bun.serve({
  port: 3333,
  routes: {
    "/api/itens":               { GET: itens.listar },
    "/api/itens/:id":           { PUT: itens.atualizarPreco },
    "/api/pedidos":             { GET: pedidos.listar, POST: pedidos.criar },
    "/api/pedidos/:id/avancar": { PUT: pedidos.avancar },
  },
  fetch() { return erro("Rota não encontrada.", 404); },
  error(problema) {
    console.error(problema);
    return erro(traduzirErroDoBanco(problema.message));
  },
});
```

| Parte | O que faz |
|---|---|
| `port: 3333` | Porta em que a API escuta |
| `routes` | Mapa **endereço + método HTTP → função**. `:id` é uma parte variável do endereço e chega na rota como `req.params.id` |
| `fetch()` | Resposta padrão para **qualquer coisa que não esteja em `routes`**: devolve `404`. Também é o que responde um método sem rota (ex.: `DELETE /api/itens/1`) |
| `error(problema)` | Chamada quando **uma rota lança uma exceção**. Registra no terminal (`console.error`) e devolve `400` com `{ "erro": "..." }`. Assim a API **não cai** por causa de um erro |

O `index.ts` só diz **quem atende** cada pedido. Não tem regra nem SQL.

---

## 8. Modelo de dados e regras de negócio

### 8.1 Diagrama

```
itens                           pedidos
───────────────────────         ──────────────────────────────────────────
id              PK              id                       PK
nome            TEXT único      item_id                  FK → itens.id
preco_centavos  INTEGER > 0     quantidade               INTEGER > 0
                                data                     TEXT (ISO 8601, UTC)
                                preco_unitario_centavos  INTEGER > 0
                                situacao                 recebido | em preparo | pronto
```

Relação **1 para N**: um item pode estar em **vários** pedidos; cada pedido aponta para **um** item.

### 8.2 Decisões de modelagem

| Decisão | Por quê |
|---|---|
| Preços em **centavos inteiros** | Decimais (`8.5`) geram erros de arredondamento no computador. Com inteiros, `3 × 850 = 2550` exato. O site converte para reais só ao exibir (`centavos / 100`) |
| **`preco_unitario_centavos` dentro do pedido** | Congela o preço do momento. Alterar o cardápio não reescreve a história |
| **Sem coluna `total`** | O total é sempre calculado, então nunca fica inconsistente com quantidade × preço |
| **Restrições no banco** (`CHECK`, `FK`, `UNIQUE`) | Protegem os dados mesmo que a API tenha um erro |
| Data em **ISO 8601 / UTC** | Formato padrão, ordenável como texto; o site converte para o horário local |

### 8.3 Regras de negócio

| # | Regra | Onde está |
|---|---|---|
| 1 | Quantidade: inteiro maior que zero | `regras/pedidos.ts` (`validarQuantidade`) e `CHECK` no banco |
| 2 | Total = quantidade × preço **registrado no pedido** | `regras/pedidos.ts` (`calcularTotal`) |
| 3 | Mudar o preço do item vale só para pedidos novos | `rotas/pedidos.ts` (copia o preço ao criar) e `rotas/itens.ts` (não mexe em `pedidos`) |
| 4 | A situação só avança na ordem `recebido` → `em preparo` → `pronto` | `regras/pedidos.ts` (`proximaSituacao`) |
| 5 | O preço do item deve ser inteiro (centavos) e maior que zero | `rotas/itens.ts` e `CHECK` no banco |

---

## 9. Referência da API

**Base:** `http://localhost:3333/api`
Requisições com corpo usam o cabeçalho `Content-Type: application/json`.

### 9.1 Visão geral

| Método | Endereço | Ação | Sucesso |
|---|---|---|---|
| GET | `/itens` | Lista o cardápio | 200 |
| PUT | `/itens/:id` | Altera o preço de um item | 200 |
| GET | `/pedidos` | Lista pedidos | 200 |
| GET | `/pedidos?situacao=pronto` | Lista filtrando por situação | 200 |
| POST | `/pedidos` | Registra um pedido | 201 |
| PUT | `/pedidos/:id/avancar` | Avança a situação do pedido | 200 |

### 9.2 `GET /api/itens`

Lista o cardápio em ordem alfabética.

```json
[
  { "id": 2, "nome": "Coxinha",      "preco_centavos": 700 },
  { "id": 4, "nome": "Refrigerante", "preco_centavos": 550 },
  { "id": 1, "nome": "Sanduíche",    "preco_centavos": 850 },
  { "id": 3, "nome": "Suco",         "preco_centavos": 600 }
]
```

### 9.3 `PUT /api/itens/:id`

Altera o preço de um item.

**Corpo:** `{ "preco_centavos": 950 }`

**Resposta (200):**
```json
{ "id": 1, "nome": "Sanduíche", "preco_centavos": 950 }
```

| Erro | Status | Corpo |
|---|---|---|
| Preço não inteiro, zero ou negativo | 400 | `{"erro":"O preço deve ser um número inteiro de centavos, maior que zero."}` |
| Item não existe | 404 | `{"erro":"Item não encontrado."}` |

### 9.3.1 `GET /api/pedidos`

Lista os pedidos, do mais recente ao mais antigo. O parâmetro opcional `?situacao=` filtra (`recebido`, `em preparo` ou `pronto`; espaço no URL deve ser `%20`, ex.: `?situacao=em%20preparo`).

```json
[
  {
    "id": 2,
    "item_id": 1,
    "quantidade": 1,
    "data": "2026-11-27T00:14:17.532Z",
    "preco_unitario_centavos": 950,
    "situacao": "recebido",
    "item_nome": "Sanduíche",
    "total_centavos": 950
  }
]
```

| Erro | Status | Corpo |
|---|---|---|
| Situação fora da lista | 400 | `{"erro":"Situação inválida."}` |

Uma situação válida **sem pedidos** devolve `[]` com status 200.

### 9.4 `POST /api/pedidos`

Registra um pedido.

**Corpo:** `{ "item_id": 1, "quantidade": 3 }`

**Resposta (201):**
```json
{
  "id": 1,
  "item_id": 1,
  "quantidade": 3,
  "data": "2026-11-27T00:14:17.517Z",
  "preco_unitario_centavos": 850,
  "situacao": "recebido",
  "item_nome": "Sanduíche",
  "total_centavos": 2550
}
```

| Erro | Status | Corpo |
|---|---|---|
| Quantidade zero, negativa, decimal, texto ou ausente | 400 | `{"erro":"A quantidade deve ser um número inteiro maior que zero."}` |
| `item_id` inexistente ou ausente | 404 | `{"erro":"Item não encontrado."}` |

### 9.5 `PUT /api/pedidos/:id/avancar`

Avança a situação para a próxima etapa. Não leva corpo.

**Resposta (200):** o pedido atualizado, com `"situacao": "em preparo"` (ou `"pronto"`).

| Erro | Status | Corpo |
|---|---|---|
| Pedido não existe | 404 | `{"erro":"Pedido não encontrado."}` |
| Pedido já está pronto | 400 | `{"erro":"Este pedido já está pronto."}` |

### 9.6 Rotas inexistentes

Qualquer endereço ou método não listado devolve `404`:
```json
{ "erro": "Rota não encontrada." }
```

### 9.7 Status HTTP usados

| Status | Significado | Quando |
|---|---|---|
| 200 | Deu certo | Consultas e atualizações |
| 201 | Criado | Pedido registrado |
| 400 | Pedido com problema | Validação falhou, corpo inválido, pedido já pronto |
| 404 | Não encontrado | Item, pedido ou rota inexistente |

---

## 10. A viagem de uma requisição

Exemplo: `POST /api/pedidos` com `{ "item_id": 1, "quantidade": 3 }`.

```
1. Cliente      envia POST /api/pedidos com o JSON
2. Bun.serve    recebe; procura "/api/pedidos" + POST em routes
3. index.ts     encontrou: chama pedidos.criar(req)
4. rotas/pedidos.ts
     4.1  await req.json()                   → { item_id: 1, quantidade: 3 }
     4.2  validarQuantidade(3)               → null (ok)        [camada regras]
     4.3  SELECT * FROM itens WHERE id = 1   → { Sanduíche, 850 } [camada banco]
     4.4  INSERT INTO pedidos (..., 850)     → grava, com preço 850 copiado
     4.5  SELECT ... JOIN ... WHERE id = ?   → o pedido criado
     4.6  comTotal(linha)                    → total_centavos = 3 × 850 = 2550
5. Response.json(..., { status: 201 })       volta para o cliente
```

**Se algo lançar uma exceção** (ex.: JSON malformado no passo 4.1), o fluxo pula para o `error()` do `index.ts`, que registra no terminal e responde `400` com `{ "erro": "..." }`. A API continua de pé.

---

## 11. Testes

### 11.1 Roteiro do enunciado

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

# 5. Avança a situação (recebido → em preparo → pronto); a 3ª chamada é recusada
Invoke-RestMethod -Method Put -Uri http://localhost:3333/api/pedidos/1/avancar

# 6. Filtro por situação
Invoke-RestMethod -Uri "http://localhost:3333/api/pedidos?situacao=pronto"
```

**Resultado esperado:** o pedido do passo 2 tem `total_centavos = 2550`; depois do passo 3, esse mesmo pedido **continua** com 2550, enquanto um pedido novo de sanduíche já sai com `preco_unitario_centavos = 950`.

### 11.2 Casos de borda (executados contra a API)

| Requisição | Status | Resposta |
|---|---|---|
| POST com `quantidade: "3"` (texto) | 400 | A quantidade deve ser um número inteiro maior que zero. |
| POST com `quantidade: 2.5` | 400 | A quantidade deve ser um número inteiro maior que zero. |
| POST com `quantidade: -1` | 400 | A quantidade deve ser um número inteiro maior que zero. |
| POST com `item_id: 99` | 404 | Item não encontrado. |
| POST sem `item_id` | 404 | Item não encontrado. |
| PUT `/itens/99` | 404 | Item não encontrado. |
| PUT `/itens/1` com `preco_centavos: 9.5` | 400 | O preço deve ser um número inteiro de centavos, maior que zero. |
| PUT `/itens/1` com `preco_centavos: 0` | 400 | O preço deve ser um número inteiro de centavos, maior que zero. |
| PUT `/pedidos/99/avancar` | 404 | Pedido não encontrado. |
| GET `/pedidos?situacao=xyz` | 400 | Situação inválida. |
| GET `/pedidos?situacao=pronto` (sem pedidos) | 200 | `[]` |
| DELETE `/itens/1` (método sem rota) | 404 | Rota não encontrada. |
| POST com JSON malformado (`{quebrado`) | 400 | `JSON Parse error: Expected '}'` (em inglês; veja a seção 13) |
| POST com corpo `null` | 400 | `null is not an object (evaluating 'dados.quantidade')` (mensagem técnica; veja a seção 13) |

### 11.3 Teste dos tipos

Dentro de `apps/api`:

```powershell
bunx tsc --noEmit
```

Sem saída = nenhum erro de tipo.

---

## 12. Depuração e problemas comuns

### 12.1 Onde olhar

| Pergunta | Ferramenta |
|---|---|
| O pedido chegou na API? | O **terminal** onde roda o `dev:api` (o `console.log`/`console.error` da API aparecem lá, **não** no navegador) |
| Qual foi o status e o corpo? | Teste com `Invoke-RestMethod`, `curl` ou o navegador (GET) |
| O que foi gravado? | Extensão **SQLite Viewer** do VS Code, abrindo `apps/api/cantina.sqlite` |

Um `console.log("recebi:", dados)` dentro de uma rota ajuda a ver o que chegou. Lembre de removê-lo depois.

### 12.2 Problemas comuns

| Problema | Causa e solução |
|---|---|
| `bun: command not found` | Feche e abra o terminal depois de instalar o Bun |
| `Cannot find module 'bun:sqlite'` **no editor** (a API roda) | Falta o `apps/api/tsconfig.json` e/ou o `@types/bun`. Crie o arquivo (seção 3.4), confira `apps/api/node_modules/@types/bun` e rode **TypeScript: Restart TS Server** no VS Code |
| `Cannot find module '@cantina/tipos'` | Falta `bun install` na **raiz** (ele cria o link do workspace) |
| `Port 3333 is already in use` | Já há uma API rodando em outro terminal. Feche-o (`Ctrl + C`) |
| Mudei uma tabela e nada mudou | `CREATE TABLE IF NOT EXISTS` não altera tabela existente. Apague `cantina.sqlite` e rode `bun run banco:popular` |
| `foreign key`/`item não encontrado` em tudo | O banco está vazio: rode `bun run banco:popular` |
| `bunx tsc` imprime uma longa ajuda | Não achou `tsconfig.json` na pasta atual. Rode dentro de `apps/api` e crie o arquivo |
| Erros estranhos de módulo com o projeto no **OneDrive** | O Bun usa links simbólicos que o OneDrive nem sempre sincroniza. Mova o projeto para fora dele (ex.: `C:\dev`), apague `node_modules` e rode `bun install` |
| Ao usar `curl` no PowerShell, o JSON dá erro | No PowerShell, `curl` é um apelido de `Invoke-WebRequest`. Use `Invoke-RestMethod` (como nos exemplos) ou `curl.exe` |
| Muitos "Unknown word" no VS Code | É a extensão Code Spell Checker lendo português como inglês. Não afeta o código; desative-a no workspace |

---

## 13. Limitações conhecidas e próximos passos

Pontos observados nos testes, sem esconder nada:

| Limitação | Detalhe |
|---|---|
| **Corpo `null` ou que não seja objeto** | Responde `400`, mas com a mensagem técnica do runtime (`null is not an object...`), pois não há validação de que o corpo é um objeto |
| **JSON malformado** | Responde `400`, mas a mensagem vem em inglês (`JSON Parse error...`) |
| **Sem rota para cadastrar itens** | O cardápio nasce do `banco:popular`; só é possível mudar o **preço** |
| **Sem cancelar/excluir pedido** | O fluxo só avança |
| **Sem paginação** | `GET /pedidos` devolve todos os pedidos |
| **Sem autenticação** | Qualquer um pode chamar a API. É um projeto didático e **não deve ser publicado na internet** |
| **Sem testes automatizados** | Os testes são manuais (seção 11) |
| **Sem CORS** | Não é necessário enquanto o site usar o proxy do Vite (o site chama `/api/...` na mesma origem) |

**Possíveis melhorias:**

- validar que o corpo é um objeto e devolver mensagens em português;
- `POST /api/itens` para cadastrar itens;
- testes automatizados com `bun test` (as funções de `regras/` são puras e fáceis de testar);
- `GET /api/pedidos/:id` para buscar um pedido específico.

---

## 14. Como acrescentar uma funcionalidade

**Exemplo: uma nova rota `GET /api/itens/:id`.** Siga a camada de baixo para cima:

1. **Banco:** a tabela já existe; nada a fazer.
2. **Regras:** se houver regra nova, crie a função em `regras/`.
3. **Rota:** em `rotas/itens.ts`, crie a função (`SELECT ... WHERE id = ?`; se `.get()` devolver `null`, responda `404` com `erro(...)`).
4. **Mapa de rotas:** em `index.ts`, acrescente `GET: itens.buscar` ao `"/api/itens/:id"`.
5. **Tipos:** se a resposta tiver formato novo, descreva-o em `packages/tipos/index.ts`.
6. **Teste** com `Invoke-RestMethod` e rode `bunx tsc --noEmit`.

**Exemplo: uma nova situação (ex.: `entregue`).** Atualize, nesta ordem:
1. `packages/tipos/index.ts` (o tipo `Situacao`);
2. `regras/pedidos.ts` (a lista `SITUACOES`, na posição correta do fluxo);
3. `banco/criar-tabelas.ts` (o `CHECK`) e **apague o `.sqlite`**, porque a tabela já existente não é alterada.

---

## 15. Glossário

| Termo | Significado |
|---|---|
| **API** | Conjunto de operações que um programa oferece para outros, por rede |
| **HTTP** | O "idioma" da web: um pedido tem método, endereço e (às vezes) corpo; a resposta tem status e corpo |
| **Método HTTP** | A ação: `GET` (buscar), `POST` (criar), `PUT` (atualizar), `DELETE` (excluir) |
| **Rota / endpoint** | Uma operação identificada por método + endereço (ex.: `GET /api/itens`) |
| **JSON** | Formato de texto para trocar dados, parecido com objetos do JavaScript |
| **REST** | Padrão de organizar endereços por recurso (`/api/pedidos`) e usar os métodos HTTP como ação |
| **CRUD** | Create, Read, Update, Delete: as quatro operações básicas de um cadastro |
| **Status HTTP** | Número da resposta: 2xx deu certo, 4xx problema no pedido, 5xx erro no servidor |
| **SQL** | Linguagem do banco de dados (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `CREATE TABLE`) |
| **SQLite** | Banco de dados que vive em um único arquivo |
| **PK (chave primária)** | Coluna que identifica cada linha (aqui, `id`) |
| **FK (chave estrangeira)** | Coluna que aponta para a PK de outra tabela (`pedidos.item_id`) |
| **JOIN** | Une linhas de duas tabelas por uma coluna em comum |
| **Instrução preparada / `?`** | SQL com parâmetros preenchidos à parte; evita SQL Injection |
| **SQL Injection** | Ataque que insere comandos SQL em um campo de texto; evitado ao nunca concatenar valores no SQL |
| **Camadas** | Divisão do código em níveis, cada um com uma responsabilidade |
| **Função pura** | Função que só recebe valores e devolve valores, sem efeitos externos (como as de `regras/`) |
| **Monorepo** | Vários projetos no mesmo repositório |
| **Workspace** | Pasta registrada no `package.json` da raiz como parte do monorepo |
| **Escopo (`@cantina`)** | "Sobrenome" de um pacote, que o identifica e permite escolhê-los em grupo |
| **Dependência** | Código de outros que o projeto usa, listado no `package.json` |
| **`devDependencies`** | Dependências só para desenvolver (como os tipos), não para rodar |
| **Lockfile (`bun.lock`)** | Registro das versões exatas instaladas |
| **Seed / popular** | Inserir dados de exemplo no banco |
| **Runtime** | O programa que executa o código (aqui, o Bun) |
| **Tipo (TypeScript)** | Descrição do formato de um dado, usada para achar erros antes de rodar |
| **Centavos** | Valores guardados como inteiros (`850` = R$ 8,50) para evitar erros de arredondamento |
| **ISO 8601** | Formato padrão de data/hora em texto (`2026-11-27T00:14:17.517Z`); o `Z` indica UTC |
