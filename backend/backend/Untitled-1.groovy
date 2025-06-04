/* -----------------------------------------------
   src/pages/Accueil.jsx
   (homepage search + click-to-detail working)
-------------------------------------------------*/
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

/* leaflet marker icons (ESM-friendly paths) */
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon   from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/* fix default marker icon urls (otherwise blank markers) */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
});

/* small util: map → fit all markers */
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length) map.fitBounds(positions, { padding: [50, 50] });
  }, [map, positions]);
  return null;
}

/* ----------------------------------------------------
   ACCUEIL COMPONENT
---------------------------------------------------- */
function Accueil() {
  const { t, i18n } = useTranslation();

  /* ─── language switcher ─────────────────────────── */
  const changerLangue = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
  };

  /* ─── router helper ─────────────────────────────── */
  const navigate = useNavigate();

  /* ─── search form state ─────────────────────────── */
  const [adresse, setAdresse] = useState(t("loading"));
  const [ville,   setVille]   = useState("");
  const [niveau,  setNiveau]  = useState("");

  /* ajout pour la recherche en deux temps */
  const [villeFixe,  setVilleFixe]  = useState(false);
  const [villeBase,  setVilleBase]  = useState("");
  const [niveauFixe, setNiveauFixe] = useState(false);
  const [niveauBase, setNiveauBase] = useState("");

  /* ✅ options inclut maintenant quartiers + formations */
  const [options, setOptions] = useState({
    villes: [], quartiers: [], niveaux: [], formations: []
  });

  const [visibleWords, setVisibleWords] = useState(0);
  const [showErr, setShowErr] = useState(false);

  const [villeSug,  setVilleSug]  = useState([]);
  const [niveauSug, setNiveauSug] = useState([]);
  const [focusOn,   setFocusOn]   = useState(null);   // "ville" | "niveau" | null

  const villeRef  = useRef(null);
  const niveauRef = useRef(null);

  /* ─── results state ─────────────────────────────── */
  const [etabs,        setEtabs]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [currentPage,  setCurrentPage]  = useState(1);
  const ITEMS_PER_PAGE = 5;
  const totalPages     = Math.ceil(etabs.length / ITEMS_PER_PAGE);
  const paginated      = etabs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const positions      = etabs.map((e) => [e.latitude, e.longitude]);

  /* ─── headline typing effect ─────────────────────── */
  useEffect(() => {
    const words = t("hero.headline").split(" ");
    const id = setInterval(() => {
      setVisibleWords((v) => (v < words.length ? v + 1 : v));
    }, 120);
    return () => clearInterval(id);
  }, [t]);

  /* ─── current location pretty name ───────────────── */
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const { data } = await axios.get(
            "https://nominatim.openstreetmap.org/reverse",
            { params: { lat: latitude, lon: longitude, format: "json" } }
          );
          const a = data.address;
          setAdresse(
            a.neighbourhood || a.suburb || a.road || a.city_district ||
            a.village      || a.city   || a.town || t("adresse.unknown")
          );
        } catch {
          setAdresse(t("adresse.error"));
        }
      },
      () => setAdresse(t("adresse.denied"))
    );
  }, [t]);

  /* ─── fetch villes + niveaux + quartiers + formations ───── */
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/metadata/")
      .then((res) => setOptions(res.data))
      .catch(() => console.warn("Échec du chargement des métadonnées."));
  }, []);

  /* ─── suggestions filtering ─────────────────────── */
  useEffect(() => {
    /* Villes ou quartiers selon l’étape */
    const source = villeFixe ? options.quartiers : [...options.villes, ...options.quartiers];
    setVilleSug(
      ville
        ? source.filter(v =>
            v.toLowerCase().startsWith(ville.toLowerCase())
          ).slice(0, 6)
        : []
    );
  }, [ville, villeFixe, options.villes, options.quartiers]);

  useEffect(() => {
    /* Niveaux ou formations selon l’étape */
    const source = niveauFixe ? options.formations : [...options.niveaux, ...options.formations];
    setNiveauSug(
      niveau
        ? source.filter(n =>
            n.toLowerCase().startsWith(niveau.toLowerCase())
          ).slice(0, 6)
        : []
    );
  }, [niveau, niveauFixe, options.niveaux, options.formations]);

  /* ─── global click to close boxes ────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (
        (villeRef.current  && villeRef.current.contains(e.target)) ||
        (niveauRef.current && niveauRef.current.contains(e.target))
      )
        return;
      setFocusOn(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ─── search helper (LOCAL display) ─────────────── */
  const rechercher = async () => {
    if (!villeBase && !ville && !niveauBase && !niveau) {
      setShowErr(true);
      return;
    }

    try {
      setLoading(true);
      const pos = await new Promise((ok, ko) =>
        navigator.geolocation.getCurrentPosition(ok, ko)
      );
      const { latitude, longitude } = pos.coords;
      const params = { lat: latitude, lon: longitude };

      if (villeBase)             params.ville      = villeBase;
      if (villeFixe && ville)    params.quartier   = ville;
      if (niveauBase)            params.niveau     = niveauBase;
      if (niveauFixe && niveau)  params.formation  = niveau;

      const { data } = await axios.get(
        "http://localhost:8000/api/recherche/",
        { params }
      );
      setEtabs(data);
      setCurrentPage(1);
    } catch (err) {
      alert(t("errors.search"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ─── static icon (kept outside render) ─────────── */
  const SearchIcon = (
    <svg width="22" height="22" viewBox="0 0 24 24"
         fill="none" stroke="#ffffff" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.65" y1="16.65" x2="22" y2="22" />
    </svg>
  );

  const headline = t("hero.headline");
  const isAr = i18n.language === "ar";

  /* ─── render ────────────────────────────────────── */
 return (
    <div
      style={{
        fontFamily: "Segoe UI, sans-serif",
        background: "#f5f7fa",
        minHeight: "100vh",
      }}
    >
      {/* top bar */}
      <div
        style={{
          background: "#003580",
          color: "#fff",
          padding: "6px 16px",
          fontSize: "0.9rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{t("topbar.phone")}</span>
        <span>{t("topbar.email")}</span>
      </div>

      {/* nav */}
      <nav style={{ backgroundColor: "white", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: "bold", fontSize: "1.5rem", color: "#003580" }}>🎓 Edunet.</div>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <a style={{ color: "#003580", fontWeight: 500 }}>{t("menu.home")}</a>
          <a style={{ color: "#003580", fontWeight: 500 }}>{t("menu.about")}</a>
          <a style={{ color: "#003580", fontWeight: 500 }}>{t("menu.contact")}</a>
          <select onChange={(e) => changerLangue(e.target.value)} value={i18n.language} style={{ padding: "6px", borderRadius: "6px" }}>
            <option value="fr">FR</option>
            <option value="ar">AR</option>
          </select>
        </div>
      </nav>

      {/* hero */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "48px",
          padding: "64px 48px 32px",
        }}
      >
        {/* left column */}
        <div style={{ flex: "1 1 480px", minWidth: "320px" }}>
          <h2
            style={{
              fontSize: "2.4rem",
              color: "#003580",
              lineHeight: 1.3,
              margin: "0 0 16px",
            }}
          >
            {isAr
              ? headline
              : headline.split(" ").map((w, i) => (
                  <span
                    key={i}
                    style={{
                      opacity: i < visibleWords ? 1 : 0,
                      transition: "opacity .4s",
                      marginRight: 8,
                    }}
                  >
                    {w}
                  </span>
                ))}
          </h2>

          <p
            style={{
              fontSize: "1.15rem",
              lineHeight: 1.7,
              margin: "0 0 24px",
              color: "#1a1a1a",
            }}
          >
            {t("hero.subtext")}
          </p>

          <h1 style={{ fontSize: "2.6rem", color: "#003580", margin: "0 0 24px" }}>
            {t("hero.cta")}
          </h1>

          {/* SEARCH BAR ------------------------------------------------ */}
          <div
            style={{
              position: "relative",
              display: "flex",
              width: "100%",
              maxWidth: 700,
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: 12,
              boxShadow: "0 3px 8px rgba(0,0,0,.08)",
              overflow: "visible",
            }}
          >
            {/* ville / quartier */}
            <div style={{ flex: 1, position: "relative" }} ref={villeRef}>
              <input
                value={ville}
                onFocus={() => setFocusOn("ville")}
                onChange={(e) => {
                  const v=e.target.value;
                  setVille(v);
                  setFocusOn("ville");
                  if(villeFixe && v===""){ setVilleFixe(false); setVilleBase(""); }
                }}
                placeholder={villeFixe ? t("search.placeholder_quartier") : t("search.placeholder_ville")}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  padding: "16px 20px",
                  fontSize: "1rem",
                  borderRadius: "12px 0 0 12px",
                }}
              />
              {focusOn === "ville" && villeSug.length > 0 && (
                <ul
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    color: "#000",
                    boxShadow: "0 6px 18px rgba(0,0,0,.15)",
                    listStyle: "none",
                    margin: 0,
                    padding: "4px 0",
                    maxHeight: 240,
                    overflowY: "auto",
                    borderRadius: "0 0 12px 12px",
                    zIndex: 999,
                  }}
                >
                  {villeSug.map((v) => (
                    <li
                      key={v}
                      onMouseDown={() => {
                        if(!villeFixe && options.villes.includes(v)){
                          setVilleFixe(true); setVilleBase(v); setVille("");
                        }else{
                          setVille(v); setFocusOn(null);
                        }
                      }}
                      style={{
                        padding: "10px 20px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f0f4ff")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      {v}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* niveau / formation */}
            <div
              style={{ flex: 1, position: "relative", borderLeft: "1px solid #ddd" }}
              ref={niveauRef}
            >
              <input
                value={niveau}
                onFocus={() => setFocusOn("niveau")}
                onChange={(e) => {
                  const n=e.target.value;
                  setNiveau(n);
                  setFocusOn("niveau");
                  if(niveauFixe && n===""){ setNiveauFixe(false); setNiveauBase(""); }
                }}
                placeholder={niveauFixe ? t("search.placeholder_formation") : t("search.placeholder_niveau")}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  padding: "16px 20px",
                  fontSize: "1rem",
                }}
              />
              {focusOn === "niveau" && niveauSug.length > 0 && (
                <ul
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    color: "#000",
                    boxShadow: "0 6px 18px rgba(0,0,0,.15)",
                    listStyle: "none",
                    margin: 0,
                    padding: "4px 0",
                    maxHeight: 240,
                    overflowY: "auto",
                    borderRadius: "0 0 12px 12px",
                    zIndex: 999,
                  }}
                >
                  {niveauSug.map((n) => (
                    <li
                      key={n}
                      onMouseDown={() => {
                        if(!niveauFixe && options.niveaux.includes(n)){
                          setNiveauFixe(true); setNiveauBase(n); setNiveau("");
                        }else{
                          setNiveau(n); setFocusOn(null);
                        }
                      }}
                      style={{ padding: "10px 20px", cursor: "pointer" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f0f4ff")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      {n.charAt(0).toUpperCase() + n.slice(1)}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* search button */}
            <button
              onClick={rechercher}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 35px",
                border: "none",
                outline: "none",
                background: "#007bff",
                color: "#fff",
                borderRadius: "0 12px 12px 0",
                cursor: "pointer",
                transition: "background .2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#0064d4")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#007bff")
              }
              aria-label={t("search.button")}
            >
              {SearchIcon}
            </button>
          </div>

          {/* pills */}
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            {options.niveaux.map((n) => (
              <button
                key={n}
                onClick={() => {
                  setNiveauBase(n);
                  setNiveauFixe(true);
                  setNiveau("");
                  rechercher();
                }}
                style={{
                  padding: "6px 16px",
                  borderRadius: 20,
                  border:
                    niveauBase === n ? "1px solid #0056b3" : "1px solid #ddd",
                  background: niveauBase === n ? "#0056b3" : "#fff",
                  color: niveauBase === n ? "#fff" : "#333",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                }}
              >
                {n.charAt(0).toUpperCase() + n.slice(1)}
              </button>
            ))}
          </div>

          {/* location */}
          <div
            style={{
              marginTop: 16,
              display: "inline-flex",
              gap: 8,
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: "10px 16px",
              boxShadow: "0 2px 6px rgba(0,0,0,.1)",
              color: "#003580",
            }}
          >
            <strong>{t("location.current")}</strong> {adresse}
          </div>
        </div>

        {/* illustration */}
        <div
          style={{ flex: "1 1 400px", display: "flex", justifyContent: "center" }}
        >
          <img src="/images/lo.png" alt="" style={{ width: "100%", maxWidth: 640 }} />
        </div>
      </div>

      {/* RESULTS BLOCK (appears after first search) */}
      {loading ? (
        <p style={{ textAlign: "center" }}>{t("loading")}</p>
      ) : etabs.length === 0 ? null : (
        <>
          <h2 style={{ textAlign: "center", color: "#003580", margin: "1rem 0" }}>
            {t("results.title")}
          </h2>

          <div style={{ display: "flex", gap: "2rem", padding: "0 1rem 2rem" }}>
            {/* LEFT: cards + pagination */}
            <div
              style={{
                flex: 1,
                maxWidth: "600px",
                display: "flex",
                flexDirection: "column",
                height: "600px",
              }}
            >
              <div style={{ flex: 1, overflowY: "auto", paddingRight: "1rem" }}>
                {paginated.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => navigate(`/etablissement/${e.id}`)}
                    style={{
                      border: "1px solid #000",
                      borderRadius: "8px",
                      padding: "1.5rem",
                      marginBottom: "1.5rem",
                      background: "#fff",
                      position: "relative",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1rem",
                      }}
                    >
                      <h3 style={{ margin: 0, fontSize: "1.6rem", color: "#000080" }}>
                        {e.nom}
                      </h3>
                    </div>
                    <p style={{ margin: "0.5rem 0" }}>
                      <strong>{t("results.distance")}</strong> {e.distance} km
                    </p>
                    <p style={{ margin: "0.5rem 0" }}>
                      <strong>{t("results.ville")}</strong> {e.ville}
                    </p>
                    <p style={{ margin: "0.5rem 0" }}>
                      <strong>{t("results.niveau")}</strong> {e.niveau}
                    </p>
                    <div
                      style={{
                        marginTop: "1rem",
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          background: "#f1f1f1",
                          padding: "0.4rem 0.75rem",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                        }}
                      >
                        {e.niveau}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* pagination */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginTop: "1rem",
                }}
              >
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={buttonStyle}
                >
                  {t("pagination.prev")}
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    style={{
                      ...buttonStyle,
                      background: i + 1 === currentPage ? "#007bff" : "transparent",
                      color: i + 1 === currentPage ? "#fff" : "#007bff",
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  style={buttonStyle}
                >
                  {t("pagination.next")}
                </button>
              </div>
            </div>

            {/* RIGHT: map */}
            <div
              style={{ flex: 1, height: "600px", borderRadius: "12px", overflow: "hidden" }}
            >
              <MapContainer style={{ width: "100%", height: "100%" }} zoom={12}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <FitBounds positions={positions} />
                {etabs.map((e) => (
                  <Marker key={e.id} position={[e.latitude, e.longitude]}>
                    <Popup>
                      <strong>{e.nom}</strong>
                      <br />
                      {e.ville}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </>
      )}

      {/* error modal */}
      {showErr && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 32,
              width: "90%",
              maxWidth: 480,
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,.3)",
            }}
          >
            <h2 style={{ color: "#cc0000" }}>{t("error_modal.title")}</h2>
            <p style={{ fontSize: "1.1rem", margin: "16px 0" }}>
              {t("error_modal.message")}
            </p>
            <button
              onClick={() => setShowErr(false)}
              style={{
                padding: "10px 20px",
                background: "#003580",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              {t("error_modal.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


/* reusable btn style (pagination) */
const buttonStyle = {
  padding: "0.5rem 0.8rem",
  border: "1px solid #007bff",
  background: "transparent",
  borderRadius: "4px",
  cursor: "pointer",
};

export default Accueil;
