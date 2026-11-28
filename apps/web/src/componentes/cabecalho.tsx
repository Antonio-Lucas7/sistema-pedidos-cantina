
type CabecalhoProps = {
  dark: boolean;
  onToggleTheme: () => void;
};

function Cabecalho({ dark, onToggleTheme }: CabecalhoProps) {
  return (
    <header className="cabecalho">
      <div className="marca">
        <div className="marca-icone">C</div>

        <div className="marca-texto">
          <strong>Cantina</strong>
          <span>Sistema de Pedidos</span>
        </div>
      </div>

      <button
        className="botao-tema"
        onClick={onToggleTheme}
        type="button"
      >
        {dark ? "☀ Tema claro" : "☾ Tema escuro"}
      </button>
    </header>
  );
}

export default Cabecalho;
