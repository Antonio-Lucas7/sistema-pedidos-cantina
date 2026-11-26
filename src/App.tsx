import { useState } from "react";
import "./App.css";

function App() {
  const [dark, setDark] = useState(false); //Cria um estado que controla se o tema escuro está ativado.

  function toogleTheme() {
    const novo = !dark;
    setDark(novo); //Alterna entre tema claro e escuro.
    document.documentElement.setAttribute(
      "data-theme",
      novo ? "dark" : "light",
    ); //Altera o atributo do elemento HTML principal para aplicar as variáveis CSS do tema.
  }

  console.log(dark); //Exibe o valor atual de dark no console do navegador

  return (
    <div>
      <button onClick={toogleTheme}>Modo {dark ? "escuro" : "claro"} </button>
      <h1>Hello world</h1>
    </div>
  ); //Exibe um botão para alternar o tema e um título de teste.
}

export default App;
