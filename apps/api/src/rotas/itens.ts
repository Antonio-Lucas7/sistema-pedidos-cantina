import type { BunRequest } from "bun";
import { banco } from "../banco/conexao";
import { erro } from "./ajudantes";

export function listar() {
  return Response.json(banco.query("SELECT * FROM itens ORDER BY nome").all());
}

// Alterar o preço NÃO mexe nos pedidos antigos: eles guardam o próprio preço
export async function atualizarPreco(req: BunRequest<"/api/itens/:id">) {
  const dados = (await req.json()) as { preco_centavos: number };

  if (!Number.isInteger(dados.preco_centavos) || dados.preco_centavos <= 0) {
    return erro("O preço deve ser um número inteiro de centavos, maior que zero.");
  }

  const resultado = banco
    .query("UPDATE itens SET preco_centavos = ? WHERE id = ?")
    .run(dados.preco_centavos, req.params.id);
  if (resultado.changes === 0) return erro("Item não encontrado.", 404);

  return Response.json(banco.query("SELECT * FROM itens WHERE id = ?").get(req.params.id));
}
