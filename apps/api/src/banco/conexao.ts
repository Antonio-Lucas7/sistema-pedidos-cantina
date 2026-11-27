import { Database } from "bun:sqlite";
import { criarTabelas } from "./criar-tabelas";

const caminhoDoArquivo = import.meta.dir + "/../../cantina.sqlite";
export const banco = new Database(caminhoDoArquivo, { create: true });

banco.run("PRAGMA foreign_keys = ON");
criarTabelas(banco);
