import type { Situacao } from "@cantina/tipos";

export const SITUACOES: Situacao[] = ["recebido", "em preparo", "pronto"];

export function validarQuantidade(quantidade: unknown): string | null {
  if (!Number.isInteger(quantidade) || (quantidade as number) <= 0) {
    return "A quantidade deve ser um número inteiro maior que zero.";
  }
  return null;
}

export function calcularTotal(quantidade: number, precoUnitarioCentavos: number): number {
  return quantidade * precoUnitarioCentavos;
}

// Devolve null quando o pedido já está na última situação
export function proximaSituacao(atual: Situacao): Situacao | null {
  return SITUACOES[SITUACOES.indexOf(atual) + 1] ?? null;
}
