
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Inicio from "./paginas/inicio";
import Cantina from "./paginas/cantina";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/cantina" element={<Cantina />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
