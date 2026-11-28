
import { useEffect, useState } from "react";
import type { Item, NovoPedido } from "@cantina/tipos";
import Cabecalho from "../componentes/cabecalho";
import { listarItens, criarPedido } from "../servicos/api";
import "../App.css";
import { Link } from "react-router-dom";

function Cantina() {
  const [dark, setDark] = useState(false);
  const [itens, setItens] = useState<Item[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [itemSelecionado, setItemSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [criando, setCriando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  function alternarTema() {
    const novoTema = !dark;
    setDark(novoTema);

    document.documentElement.setAttribute(
      "data-theme",
      novoTema ? "dark" : "light",
    );
  }

  useEffect(() => {
    async function buscarItens() {
      try {
        const dados = await listarItens();
        setItens(dados);
      } catch (problema) {
        setErro(
          problema instanceof Error
            ? problema.message
            : "Não foi possível carregar o cardápio.",
        );
      } finally {
        setCarregando(false);
      }
    }

    buscarItens();
  }, []);

  const produtoSelecionado = itens.find(
    (item) => item.id === Number(itemSelecionado),
  );

  const totalCentavos = produtoSelecionado
    ? produtoSelecionado.preco_centavos * quantidade
    : 0;

  function formatarPreco(valor: number) {
    return (valor / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  async function handleCriarPedido(
    evento: React.FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();
    setMensagem("");

    if (!produtoSelecionado) {
      setMensagem("Selecione um produto.");
      return;
    }

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      setMensagem("Informe uma quantidade inteira maior que zero.");
      return;
    }

    const novoPedido: NovoPedido = {
      item_id: produtoSelecionado.id,
      quantidade,
    };

    try {
      setCriando(true);

      const pedido = await criarPedido(novoPedido);

      setMensagem(
        `Pedido #${pedido.id} registrado com sucesso! Total: ${formatarPreco(pedido.total_centavos)}`,
      );

      setItemSelecionado("");
      setQuantidade(1);
    } catch (problema) {
      setMensagem(
        problema instanceof Error
          ? problema.message
          : "Não foi possível registrar o pedido.",
      );
    } finally {
      setCriando(false);
    }
  }

  return (
    <div className="aplicacao">
      <Cabecalho
        dark={dark}
        onToggleTheme={alternarTema}
      />

      <main className="conteudo">
        <section className="introducao">
          <Link to="/" className="botao-voltar">
            ← Voltar para a página inicial
          </Link>

          <div>
            <span className="etiqueta">PAINEL DE CONTROLE</span>
            <h1>Visão geral</h1>
            <p>
              Gerencie os pedidos e acompanhe o funcionamento da cantina.
            </p>
          </div>
        </section>

        <section className="resumo">
          <div className="resumo-cartao">
            <span className="resumo-icone">▤</span>
            <div>
              <p>Produtos cadastrados</p>
              <strong>{itens.length}</strong>
            </div>
          </div>

          <div className="resumo-cartao">
            <span className="resumo-icone">＋</span>
            <div>
              <p>Pedidos</p>
              <strong>--</strong>
            </div>
          </div>
        </section>

        <section className="secao-pedido">
          <div className="secao-cabecalho">
            <div>
              <h2>Novo pedido</h2>
              <p>Selecione um produto e informe a quantidade.</p>
            </div>
          </div>

          <form onSubmit={handleCriarPedido} className="formulario-pedido">
            <div className="campo-pedido">
              <label htmlFor="produto">Produto</label>

              <select
                id="produto"
                value={itemSelecionado}
                onChange={(evento) => {
                  setItemSelecionado(evento.target.value);
                  setMensagem("");
                }}
                disabled={carregando || criando}
              >
                <option value="">Selecione um produto</option>

                {itens.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo-pedido">
              <label htmlFor="quantidade">Quantidade</label>

              <input
                id="quantidade"
                type="number"
                min="1"
                step="1"
                value={quantidade}
                onChange={(evento) => {
                  setQuantidade(Number(evento.target.value));
                  setMensagem("");
                }}
                disabled={criando}
              />
            </div>

            <div className="resumo-pedido">
              <div>
                <span>Preço unitário</span>
                <strong>
                  {produtoSelecionado
                    ? formatarPreco(produtoSelecionado.preco_centavos)
                    : formatarPreco(0)}
                </strong>
              </div>

              <div>
                <span>Total do pedido</span>
                <strong className="total-pedido">
                  {formatarPreco(totalCentavos)}
                </strong>
              </div>
            </div>

            <button
              type="submit"
              className="botao-registrar"
              disabled={criando || carregando || itens.length === 0}
            >
              {criando ? "Registrando..." : "Registrar pedido"}
            </button>

            {mensagem && (
              <p className="mensagem">
                {mensagem}
              </p>
            )}
          </form>
        </section>

        <section className="secao-cardapio">
          <div className="secao-cabecalho">
            <div>
              <h2>Cardápio</h2>
              <p>Produtos disponíveis para novos pedidos.</p>
            </div>

            <span className="contador">
              {itens.length} produtos
            </span>
          </div>

          {carregando && (
            <p className="mensagem">Carregando cardápio...</p>
          )}

          {erro && (
            <p className="mensagem mensagem-erro">{erro}</p>
          )}

          {!carregando && !erro && (
            <div className="grade-produtos">
              {itens.map((item) => (
                <article className="produto-cartao" key={item.id}>
                  <div className="produto-icone">▦</div>

                  <div className="produto-informacoes">
                    <h3>{item.nome}</h3>
                    <span>Disponível no cardápio</span>
                  </div>

                  <strong className="produto-preco">
                    {formatarPreco(item.preco_centavos)}
                  </strong>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Cantina;
