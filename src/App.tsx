import { useState } from "react";
import "./App.css";

function App() {
  const [dark, setDark] = useState(false);

  function toogleTheme() {
    const novo = !dark;
    setDark(novo);
    document.documentElement.setAttribute(
      "data-theme",
      novo ? "dark" : "light",
    );
  }

  console.log(dark);

  return (
    <div>
      <button onClick={toogleTheme}>Modo {dark ? "escuro" : "claro"} </button>
      <h1>Hello world</h1>
    </div>
  );
}

export default App;
