
import "./App.css";

const features = [
  {
    number: "01",
    title: "Registro de pedidos",
    description:
      "Selecione produtos, informe quantidades e registre pedidos de forma simples e rápida.",
  },
  {
    number: "02",
    title: "Acompanhamento",
    description:
      "Acompanhe cada pedido durante as etapas: recebido, em preparo e pronto.",
  },
  {
    number: "03",
    title: "Controle de preços",
    description:
      "Atualize os preços do cardápio sem alterar os valores dos pedidos anteriores.",
  },
];

function App() {
  return (
    <main className="container">
      <section className="hero">
        <div className="hero-content">
          <span className="subtitle">SISTEMA DE PEDIDOS</span>

          <h1>Organize seus pedidos. Simplifique sua cantina.</h1>

          <p>
            Mais praticidade e organização para o gerenciamento
            dos pedidos da cantina.
          </p>

          <a href="/pedidos" className="access-button">
            Acessar o sistema →
          </a>
        </div>

        <div className="hero-image">
          <img
            src="https://images.openai.com/static-rsc-4/GJpjkOoMdDVITzt1QOe10DW4DSbSPwqhT3wgt1-aEP-STQaZHbMJBsSleIowq-WrhSkJqIvlv_AHW1-fwz_dHN4SDko4e03hg0jQMHBqqqie0TSFa6Ch5ngaHxVSG866GDTHi_6nzTWHKVuqE4z2KScOQh24hjNAfI9FbHCmsEe2RyLkYpDPmzFqkVWLIMUt?purpose=fullsize"
            alt="Ilustração de pedidos e produtos da cantina"
          />
        </div>
      </section>

      <section className="features" id="funcionalidades">
        {features.map((feature) => (
          <article className="feature-card" key={feature.number}>
            <span className="number">{feature.number}</span>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;
