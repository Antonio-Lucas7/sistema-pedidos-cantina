import * as itens from "./rotas/itens";
import * as pedidos from "./rotas/pedidos";
import { erro, traduzirErroDoBanco } from "./rotas/ajudantes";

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

console.log("✅ API rodando em http://localhost:3333/api");
