export function erro(mensagem: string, status = 400) {
  return Response.json({ erro: mensagem }, { status });
}

export function traduzirErroDoBanco(mensagem: string): string {
  if (mensagem.includes("UNIQUE constraint failed"))
    return "Já existe um registro com esses dados.";
  if (mensagem.includes("FOREIGN KEY constraint failed"))
    return "Item inexistente ou ligado a pedidos.";
  if (mensagem.includes("CHECK constraint failed"))
    return "Quantidade e preço devem ser maiores que zero.";
  return mensagem;
}
