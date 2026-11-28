
import { Link } from "react-router-dom";
import "./inicio.css";

function Inicio() {
  return (
    <div className="pagina-inicial">
      <header className="inicio-cabecalho">
        <Link to="/" className="inicio-marca">
          <span className="inicio-logo">C</span>
          <span>
            <strong>Cantina</strong>
            <small>Sistema de Pedidos</small>
          </span>
        </Link>

        <Link to="/cantina" className="inicio-acesso">
          Acessar sistema
        </Link>
      </header>

      <main>
        <section className="inicio-hero">
          <div className="inicio-texto">
            <span className="inicio-etiqueta">
              SISTEMA DE GERENCIAMENTO DE PEDIDOS
            </span>

            <h1>
              Mais organização
              <br />
              para a sua <span>cantina.</span>
            </h1>

            <p>
              Uma solução simples e eficiente para registrar pedidos,
              acompanhar seu andamento e gerenciar os produtos do cardápio.
            </p>

            <Link to="/cantina" className="inicio-botao">
              Iniciar sistema <span>→</span>
            </Link>

            <small className="inicio-observacao">
              Gerenciamento de pedidos de forma prática e organizada.
            </small>
          </div>

          {/* <div className="inicio-ilustracao">
              <img
                  src="src/image/ilustracao.png"
                  alt="Ilustração representando o atendimento de uma cantina"
              />
          </div> */}
          
          <div className="inicio-destaque">
            <div className="destaque-cartao">
              <span className="destaque-etiqueta">CONTROLE DE PEDIDOS</span>
              <h2>Da solicitação à entrega.</h2>

              <div className="destaque-pedido">
                <div>
                  <strong>Pedido organizado</strong>
                  <small>Acompanhe cada etapa</small>
                </div>
                <span className="destaque-icone">✓</span>
              </div>

              <div className="destaque-etapas">
                <span className="etapa-concluida">Recebido</span>
                <span className="etapa-concluida">Em preparo</span>
                <span>Pronto</span>
              </div>

              <div className="destaque-linha" />
              <p>Mais controle sobre a rotina da cantina.</p>
            </div>
            <div className="destaque-decoracao" />
          </div>
        </section>

        <section className="inicio-funcionalidades">
          <div className="funcionalidades-titulo">
            <span>RECURSOS DO SISTEMA</span>
            <h2>Tudo o que você precisa em um só lugar.</h2>
          </div>

          <div className="funcionalidades-grade">
            <article className="funcionalidade">
              <span>01</span>
              <h3>Gestão do cardápio</h3>
              <p>Consulte os produtos disponíveis e atualize seus preços.</p>
            </article>

            <article className="funcionalidade">
              <span>02</span>
              <h3>Registro de pedidos</h3>
              <p>Registre produtos e quantidades com cálculo automático.</p>
            </article>

            <article className="funcionalidade">
              <span>03</span>
              <h3>Acompanhamento</h3>
              <p>Visualize e atualize a situação de cada pedido.</p>
            </article>
          </div>
        </section>
      </main>

      <footer className="inicio-rodape">
        <span>Sistema de Pedidos da Cantina</span>
        <span>Organização e praticidade no atendimento.</span>
      </footer>
    </div>
  );
}

export default Inicio;
