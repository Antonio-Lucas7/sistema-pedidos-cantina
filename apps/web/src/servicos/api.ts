
import type {
  Item,
  PedidoDetalhado,
  NovoPedido,
} from "@cantina/tipos";


// Função central para realizar requisições à API
async function requisicao<T>(
  rota: string,
  opcoes?: RequestInit,
): Promise<T> {
  const resposta = await fetch(`/api${rota}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...opcoes,
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro ao comunicar com o servidor.");
  }

  return dados as T;
}

// Busca todos os itens do cardápio
export function listarItens(): Promise<Item[]> {
  return requisicao<Item[]>("/itens");
}

// Busca os pedidos, com possibilidade de filtrar pela situação
export function listarPedidos(
  situacao?: string,
): Promise<PedidoDetalhado[]> {
  const filtro = situacao
    ? `?situacao=${encodeURIComponent(situacao)}`
    : "";

  return requisicao<PedidoDetalhado[]>(`/pedidos${filtro}`);
}

// Registra um novo pedido
export function criarPedido(
  pedido: NovoPedido,
): Promise<PedidoDetalhado> {
  return requisicao<PedidoDetalhado>("/pedidos", {
    method: "POST",
    body: JSON.stringify(pedido),
  });
}

// Avança a situação de um pedido
export function avancarPedido(
  id: number,
): Promise<PedidoDetalhado> {
  return requisicao<PedidoDetalhado>(`/pedidos/${id}/avancar`, {
    method: "PUT",
  });
}

// Atualiza o preço de um item
export function atualizarPreco(
  id: number,
  preco_centavos: number,
): Promise<Item> {
  return requisicao<Item>(`/itens/${id}`, {
    method: "PUT",
    body: JSON.stringify({ preco_centavos }),
  });
}
