// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Accueil from "./pages/Accueil";
import Resultats from "./pages/Resultats";
import DetailEtablissement from "./pages/DetailEtablissement";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/resultats" element={<Resultats />} />
        <Route path="/etablissement/:id" element={<DetailEtablissement />} />
      </Routes>
    </Router>
  );
}

export default App;
