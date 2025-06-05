// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Accueil                 from "./pages/Accueil";
import Resultats               from "./pages/Resultats";
import DetailEtablissement     from "./pages/DetailEtablissement";

import AdminLogin              from "./pages/AdminLogin";
import ProtectedRoute          from "./components/ProtectedRoute";

import AdminDashboard          from "./pages/AdminDashboard";
import AdminEtablissements     from "./pages/AdminEtablissements";
import AdminReviews            from "./pages/AdminReviews";

function App() {
  return (
    <Router>
      <Routes>
        {/* ---------- Public ---------- */}
        <Route path="/"                    element={<Accueil />} />
        <Route path="/resultats"           element={<Resultats />} />
        <Route path="/etablissement/:id"   element={<DetailEtablissement />} />
        <Route path="/admin/login"         element={<AdminLogin />} />

        {/* ---------- Legacy alias: /admin/dashboard → /admin/etablissements ---------- */}
        <Route
          path="/admin/dashboard"
          element={<Navigate to="/admin/etablissements" replace />}
        />

        {/* ---------- Admin (protected) ---------- */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />   {/* sidebar + <Outlet/> */}
            </ProtectedRoute>
          }
        >
          <Route index                     element={<Navigate to="etablissements" />} />
          <Route path="etablissements"     element={<AdminEtablissements />} />
          <Route path="reviews"            element={<AdminReviews />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
