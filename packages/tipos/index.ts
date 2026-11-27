export type Situacao = "recebido" | "em preparo" | "pronto";

export type Item = { id: number; nome: string; preco_centavos: number };

export type Pedido = {
  id: number;
  item_id: number;
  quantidade: number;
  data: string;
  preco_unitario_centavos: number; // preço congelado no momento do pedido
  situacao: Situacao;
};

// Pedido + dados vindos do JOIN e do cálculo
export type PedidoDetalhado = Pedido & { item_nome: string; total_centavos: number };

export type NovoPedido = { item_id: number; quantidade: number };
