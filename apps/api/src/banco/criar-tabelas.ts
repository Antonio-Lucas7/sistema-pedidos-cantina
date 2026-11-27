import type { Database } from "bun:sqlite";

export function criarTabelas(banco: Database) {
  banco.run(`
    CREATE TABLE IF NOT EXISTS itens (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      nome           TEXT NOT NULL UNIQUE,
      preco_centavos INTEGER NOT NULL CHECK (preco_centavos > 0)
    )`);

  banco.run(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id                 INTEGER NOT NULL REFERENCES itens(id),
      quantidade              INTEGER NOT NULL CHECK (quantidade > 0),
      data                    TEXT NOT NULL,
      preco_unitario_centavos INTEGER NOT NULL CHECK (preco_unitario_centavos > 0),
      situacao                TEXT NOT NULL DEFAULT 'recebido'
        CHECK (situacao IN ('recebido', 'em preparo', 'pronto'))
    )`);
}
