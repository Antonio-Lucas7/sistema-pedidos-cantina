import type { BunRequest } from "bun";
import type { Item, NovoPedido, Pedido, PedidoDetalhado } from "@cantina/tipos";
import { banco } from "../banco/conexao";
import { SITUACOES, calcularTotal, proximaSituacao, validarQuantidade } from "../regras/pedidos";
import { erro } from "./ajudantes";

type Linha = Omit<PedidoDetalhado, "total_centavos">;

const SELECT_PEDIDOS = `
  SELECT p.*, i.nome AS item_nome
  FROM pedidos p
  JOIN itens i ON i.id = p.item_id`;

// O total vem da regra, não do banco
function comTotal(linha: Linha): PedidoDetalhado {
  return {
    ...linha,
    total_centavos: calcularTotal(linha.quantidade, linha.preco_unitario_centavos),
  };
}

// GET /api/pedidos  ou  /api/pedidos?situacao=pronto
export function listar(req: BunRequest) {
  const situacao = new URL(req.url).searchParams.get("situacao");

  if (situacao && !SITUACOES.includes(situacao as any)) {
    return erro("Situação inválida.");
  }

  const linhas = (situacao
    ? banco.query(`${SELECT_PEDIDOS} WHERE p.situacao = ? ORDER BY p.id DESC`).all(situacao)
    : banco.query(`${SELECT_PEDIDOS} ORDER BY p.id DESC`).all()) as Linha[];

  return Response.json(linhas.map(comTotal));
}

export async function criar(req: BunRequest) {
  const dados = (await req.json()) as NovoPedido;

  const problema = validarQuantidade(dados.quantidade);
  if (problema) return erro(problema);

  const item = banco.query("SELECT * FROM itens WHERE id = ?").get(dados.item_id) as Item | null;
  if (!item) return erro("Item não encontrado.", 404);

  // Copia o preço atual do item para dentro do pedido
  const resultado = banco
    .query(`INSERT INTO pedidos (item_id, quantidade, data, preco_unitario_centavos)
            VALUES (?, ?, ?, ?)`)
    .run(item.id, dados.quantidade, new Date().toISOString(), item.preco_centavos);

  const criado = banco
    .query(`${SELECT_PEDIDOS} WHERE p.id = ?`)
    .get(resultado.lastInsertRowid) as Linha;
  return Response.json(comTotal(criado), { status: 201 });
}

// PUT /api/pedidos/:id/avancar  (recebido → em preparo → pronto)
export function avancar(req: BunRequest<"/api/pedidos/:id/avancar">) {
  const pedido = banco
    .query("SELECT * FROM pedidos WHERE id = ?")
    .get(req.params.id) as Pedido | null;
  if (!pedido) return erro("Pedido não encontrado.", 404);

  const proxima = proximaSituacao(pedido.situacao);
  if (!proxima) return erro("Este pedido já está pronto.");

  banco.query("UPDATE pedidos SET situacao = ? WHERE id = ?").run(proxima, pedido.id);

  const atualizado = banco
    .query(`${SELECT_PEDIDOS} WHERE p.id = ?`)
    .get(pedido.id) as Linha;
  return Response.json(comTotal(atualizado));
}
