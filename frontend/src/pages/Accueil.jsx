/* -----------------------------------------------
   src/pages/Accueil.jsx
   (homepage search + click-to-detail working)
-------------------------------------------------*/
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { TbMapSearch } from "react-icons/tb";
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

  const [showAuthDropdown, setShowAuthDropdown] = useState(false);

  const authLinkStyle = {
    display: "block",
    padding: "8px 16px",
    textDecoration: "none",
    color: "#003580",
    fontWeight: 500,
    transition: "background 0.2s",
  };

  /* ─── search form state ─────────────────────────── */
  const [adresse, setAdresse] = useState(t("loading"));
  const [ville, setVille] = useState("");
  const [niveau, setNiveau] = useState("");
  const [villeFixe, setVilleFixe] = useState(false);
  const [niveauFixe, setNiveauFixe] = useState(false);
  const [options, setOptions] = useState({
    villes: [], quartiers: [], niveaux: [], formations: []
  });
  const [filtre, setFiltre] = useState("");
  const [nom, setNom] = useState("");
  const [type, setType] = useState("");
  const [selectedLocalisation, setSelectedLocalisation] = useState(null);
  const [categorie, setCategorie] = useState("");
  const [etabs, setEtablissements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [aLanceRecherche, setALanceRecherche] = useState(false);
  const [etabQuery, setEtabQuery] = useState("");
  const [etabSuggestions, setEtabSuggestions] = useState([]);
  const [showFiltres, setShowFiltres] = useState(false);
  const inputRef = useRef();
  const containerRef = useRef(null);
  const [suggestionsNom, setSuggestionsNom] = useState([]);
  const [suggestionsAdresse, setSuggestionsAdresse] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [visibleWords, setVisibleWords] = useState(0);
  const [showErr, setShowErr] = useState(false);
  const [villeSug, setVilleSug] = useState([]);
  const [niveauSug, setNiveauSug] = useState([]);
  const [focusOn, setFocusOn] = useState(null);
  const villeRef = useRef(null);
  const niveauRef = useRef(null);
  const menuRef = useRef(null);
  const menuReft = useRef(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(etabs.length / ITEMS_PER_PAGE);
  const paginated = etabs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const positions = etabs.map((e) => [e.latitude, e.longitude]);
  const [noResult, setNoResult] = useState(false);

  useEffect(() => {
    const words = t("hero.headline").split(" ");
    const id = setInterval(() => {
      setVisibleWords((v) => (v < words.length ? v + 1 : v));
    }, 120);
    return () => clearInterval(id);
  }, [t]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ latitude, longitude });
          try {
            const res = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
            );
            const addr = res.data.address;
            const ville = addr.city || addr.town || addr.village || addr.state || t("adresse.unknown");
            const quartier = addr.neighbourhood || addr.suburb || addr.city_district || "";
            const localisation = quartier ? `${ville}, ${quartier}` : ville;
            setAdresse(localisation);
          } catch (err) {
            setAdresse(t("adresse.error"));
          }
        },
        () => {
          setAdresse(t("adresse.denied"));
        }
      );
    } 
  }, []);

  useEffect(() => {
    if (adresse) {
      setFiltre(adresse);
    }
  }, [adresse]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setSuggestionsNom([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAdresseChange = async (e) => {
    const value = e.target.value;
    setFiltre(value);
    if (value.length < 1) {
      setSuggestionsAdresse([]);
      setSelectedLocalisation(null);
      return;
    }
    try {
      const res = await axios.get("http://localhost:8000/api/localisation-autocomplete/", {
        params: { q: value }
      });
      setSuggestionsAdresse(res.data);
      const match = res.data.find((s) => s.label.toLowerCase() === value.toLowerCase());
      if (match) {
        setSelectedLocalisation(match.id);
      } else {
        setSelectedLocalisation(null);
      }
    } catch (err) {
      setSuggestionsAdresse([]);
    }
  };

  useEffect(() => {
    if (etabQuery.length >= 1) {
      axios.get(`http://localhost:8000/api/etablissements-autocomplete/`, {
        params: { q: etabQuery }
      })
      .then(res => setEtabSuggestions(res.data))
      .catch(() => setEtabSuggestions([]));
    } else {
      setEtabSuggestions([]);
    }
  }, [etabQuery]);

  useEffect(() => {
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
    const source = niveauFixe ? options.formations : [...options.niveaux, ...options.formations];
    setNiveauSug(
      niveau
        ? source.filter(n =>
            n.toLowerCase().startsWith(niveau.toLowerCase())
          ).slice(0, 6)
        : []
    );
  }, [niveau, niveauFixe, options.niveaux, options.formations]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowFiltres(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (
        (villeRef.current && villeRef.current.contains(e.target)) ||
        (niveauRef.current && niveauRef.current.contains(e.target))
      )
        return;
      setFocusOn(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuReft.current && !menuReft.current.contains(event.target)) {
        setSuggestionsAdresse(false);             
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const updateCategorie = (newNiveau = null, newType = null) => {
    if (newNiveau !== null) {
      setNiveau(newNiveau);
    }
    if (newType !== null) {
      setType(newType);
      setShowFiltres(false);
    }
    const newCategorie = [newNiveau || niveau, newType || type].filter(Boolean).join(" - ");
    setCategorie(newCategorie);
  };

  const rechercher = async () => {
    if (!nom.trim() && !niveau.trim() && !type.trim() && !filtre.trim()) {
      setShowErr(true);
      return;
    }

    setLoading(true);
    setCurrentPage(1);

    const params = {};
    if (selectedLocalisation) {
      params.localisation = selectedLocalisation;
    } else if (filtre.trim()) {
      const [villePart, quartierPart] = filtre.split(",").map(s => s.trim());
      if (villePart)    params.ville    = villePart;
      if (quartierPart) params.quartier = quartierPart;
    }

    if (nom.trim())    params.nom    = nom.trim();
    if (niveau.trim()) params.niveau = niveau.trim();
    if (type.trim())   params.type   = type.trim();

    if (coords?.latitude != null && coords?.longitude != null) {
      params.lat = coords.latitude;
      params.lon = coords.longitude;
    }

    try {
      const res = await axios.get("http://localhost:8000/api/recherche/", { params });
      setEtablissements(res.data);
      setNoResult(res.data.length === 0);
      setVille(filtre || t("recherche.zoneParDefaut"));
      setShowModal(true);
      setALanceRecherche(true);
    } catch (err) {
      setEtablissements([]);
      setNoResult(false);
    } finally {
      setLoading(false);
    }
  };

  const headline = t("hero.headline");
  const isAr = i18n.language === "ar";

  return (
    <div style={{ fontFamily: "Segoe UI, sans-serif", background: "#f5f7fa", minHeight: "100vh" }}>
      <div style={{ background: "#003580", color: "#fff", padding: "6px 16px", fontSize: "0.9rem", display: "flex", justifyContent: "space-between" }}>
        <span>{t("topbar.phone")}</span>
        <span>{t("topbar.email")}</span>
      </div>

      <nav style={{ backgroundColor: "white", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: "bold", fontSize: "1.5rem", color: "#003580" }}>🎓 Edunet.</div>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexGrow: 1, justifyContent: "center" }}>
          <a href="/" style={{ color: "#003580", fontWeight: 500 }}>{t("menu.home")}</a>
          <a href="" style={{ color: "#003580", fontWeight: 500 }}>{t("menu.about")}</a>
          <a href="" style={{ color: "#003580", fontWeight: 500 }}>{t("menu.contact")}</a>
        </div>
        <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
          <select onChange={(e) => changerLangue(e.target.value)} value={i18n.language} style={{ padding: "6px", borderRadius: "6px" }}>
            <option value="fr">FR</option>
            <option value="ar">AR</option>
          </select>
          <div style={{ position: "relative" }}>
            <div style={{ color: "#003580", fontWeight: 500, cursor: "pointer" }} onMouseEnter={() => setShowAuthDropdown(true)} onMouseLeave={() => setShowAuthDropdown(false)}>
              Connexion / Inscription
              {showAuthDropdown && (
                <div style={{ position: "absolute", top: "100%", right: 0, background: "white", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", borderRadius: "8px", zIndex: 999, padding: "10px 0", minWidth: "220px" }} onMouseEnter={() => setShowAuthDropdown(true)} onMouseLeave={() => setShowAuthDropdown(false)}>
                  <a href="/login/visitor" style={authLinkStyle}>Connexion Visiteur</a>
                  <a href="/login/establishment" style={authLinkStyle}>Connexion Établissement</a>
                  <div style={{ borderTop: "1px solid #eee", margin: "6px 0" }}></div>
                  <a href="/register/visitor" style={authLinkStyle}>Inscription Visiteur</a>
                  <a href="/register/establishment" style={authLinkStyle}>Inscription Établissement</a>
                </div>
              )}
            </div>
          </div>
          <a href="/admin/login" style={{ color: "#003580", fontWeight: 500 }}>Administration</a>
        </div>
      </nav>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "48px", padding: "64px 48px 32px" }}>
        <div style={{ flex: "1 1 480px", minWidth: "320px", marginTop: "100px" }}>
          <h2 style={{ fontSize: "2.4rem", color: "#003580", lineHeight: 1.3, margin: "0 0 16px", marginBottom: "35px", fontWeight: "bold", wordWrap: "break-word", overflowWrap: "break-word", whiteSpace: "normal" }}>
            {isAr ? headline : headline.split(" ").map((w, i) => (
              <span key={i} style={{ opacity: i < visibleWords ? 1 : 0, transition: "opacity .4s", marginRight: 8 }}>{w}</span>
            ))}
          </h2>
          <p style={{ fontSize: "1.15rem", lineHeight: 1.7, margin: "0 0 24px", color: "#1a1a1a" }}>{t("hero.subtext")}</p>
          <h1 style={{ fontSize: "2.6rem", color: "#003580", margin: "0 0 24px",fontWeight: "bold" }}>{t("hero.cta")}</h1>

          <div style={{ display: "flex", alignItems: "center", backgroundColor: "white", borderRadius: "10px", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", marginBottom: "1rem", padding: "0.5rem", gap: "1rem", maxWidth: "900px", width: "700px" }}>
            <div ref={containerRef} style={{ position: "relative", flex: 1 }}>
              <input type="search" ref={inputRef} placeholder={t("recherche.placeholderNom")} value={nom} onChange={(e) => {
                const value = e.target.value;
                setNom(value);
                if (value.trim().length === 0) {
                  setSuggestionsNom([]);
                } else {
                  axios.get("http://localhost:8000/api/etablissements-autocomplete/", { params: { q: value } })
                    .then((res) => setSuggestionsNom(res.data))
                    .catch(() => setSuggestionsNom([]));
                }
              }} style={{ width: "100%", minWidth: "200px", padding: "1rem", fontSize: "1rem", border: "none", borderLeft: "1px solid #ddd", borderRadius: "8px", outline: "none" }} />

              {suggestionsNom.length > 0 && (
                <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "white", border: "1px solid #ccc", borderRadius: "0 0 8px 8px", maxHeight: "200px", overflowY: "auto", zIndex: 1000, listStyle: "none", margin: 0, padding: 0 }}>
                  {suggestionsNom.map((item, index) => (
                    <li key={index} onClick={() => { setNom(item); setSuggestionsNom([]); }} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} style={{ padding: "0.8rem", cursor: "pointer", borderBottom: "1px solid #eee", backgroundColor: hoveredIndex === index ? "#f0f8ff" : "white" }}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div style={{ flex: 1, position: "relative" }} ref={menuRef}>
              <input type="search" id="type-et-niveau" placeholder={t("recherche.placeholderniveautype")} value={categorie} readOnly onFocus={() => setShowFiltres(true)} style={{ width: "100%", minWidth: "160px", padding: "1rem", fontSize: "1rem", border: "none", borderLeft: "1px solid #ddd", borderRadius: "8px", outline: "none" }} /> 
              {categorie && (
                <span onClick={() => { setCategorie(""); setType(""); setNiveau(""); }} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "1.2rem", cursor: "pointer", color: "#666" }}>×</span>
              )}

              {showFiltres && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "#fff", border: "1px solid #ccc", padding: "1rem", zIndex: 999, borderRadius: "0 0 10px 10px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ color: "#666", fontSize: "0.8rem", marginBottom: "0.5rem" }}>{t("recherche.niveau")}</div>
                    {[t("recherche.primaire"), t("recherche.secondaire"), t("recherche.supérieur")].map((n, index) => (
                      <div key={n} onClick={() => updateCategorie(n, null)} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} style={{ padding: "0.5rem", cursor: "pointer", backgroundColor: hoveredIndex === index ? "#f0f8ff" : niveau === n ? "#e6f0ff" : "transparent", borderRadius: "6px" }}>
                        {n}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ color: "#666", fontSize: "0.8rem", marginBottom: "0.5rem" }}>{t("recherche.type")}</div>
                    {[t("recherche.publique"), t("recherche.privee")].map((t_, index) => (
                      <div key={t_} onClick={() => { updateCategorie(null, t_); }} onMouseEnter={() => setHoveredIndex(index + 10)} onMouseLeave={() => setHoveredIndex(null)} style={{ padding: "0.5rem", cursor: "pointer", backgroundColor: hoveredIndex === index + 10 ? "#f0f8ff" : type === t_ ? "#e6f0ff" : "transparent", borderRadius: "6px" }}>
                        {t_}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ flex: 2, position: "relative" }}>
              <input type="search" id="search-filtre" placeholder={t("recherche.placeholderAdresse")} value={filtre} onChange={(e) => {
                const value = e.target.value;
                setFiltre(value);
                setSelectedLocalisation(null);
                if (value.trim().length > 0) {
                  axios.get("http://localhost:8000/api/localisation-autocomplete/", { params: { q: value.trim() } })
                    .then((res) => {
                      setSuggestionsAdresse(res.data);
                      const match = res.data.find((s) => s.label.toLowerCase().trim() === value.toLowerCase().trim());
                      if (match) setSelectedLocalisation(match.id);
                    })
                    .catch(() => setSuggestionsAdresse([]));
                } else {
                  setSuggestionsAdresse([]);
                }
              }} style={{ width: "100%", minWidth: "160px", padding: "1rem", fontSize: "1rem", border: "none", borderLeft: "1px solid #ddd", borderRadius: "8px", outline: "none" }} />
              {suggestionsAdresse.length > 0 && (
                <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "white", border: "1px solid #ccc", borderRadius: "0 0 8px 8px", maxHeight: "200px", overflowY: "auto", zIndex: 1000, listStyle: "none", margin: 0, padding: 0 }} ref={menuReft}>
                  {suggestionsAdresse.map((sugg, index) => (
                    <li key={index} onClick={() => { setFiltre(sugg.label); setSelectedLocalisation(sugg.id); setSuggestionsAdresse([]); document.getElementById("search-filtre").focus(); }} style={{ padding: "0.8rem 1rem", cursor: "pointer", borderBottom: "1px solid #eee" }}>
                      {sugg.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button onClick={rechercher} style={{ backgroundColor: "#007bff", color: "white", padding: "0.5rem 1rem", border: "none", borderRadius: "8px", fontSize: "1.2rem", cursor: "pointer" }}>
              <TbMapSearch size={28} />
            </button>
          </div>
        </div>

        <div style={{ flex: "1 1 400px", display: "flex", justifyContent: "center" }}>
          <img src="/images/lo.png" alt="" style={{ width: "100%", maxWidth: 640 }} />
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: "center" }}>{t("loading")}</p>
      ) : noResult ? (
        <p style={{ textAlign: "center", fontStyle: "italic", marginTop: 40 }}>
          {t("errors.noResults") || "Aucun établissement ne correspond à votre recherche."}
        </p>
      ) : etabs.length > 0 ? (
        <>
          <h2 style={{ textAlign: "center", color: "#cc0000", margin: "1rem 0" }}>
            {t("results.title")}
          </h2>

          <div style={{ display: "flex", gap: "2rem", padding: "0 1rem 2rem" }}>
            <div style={{ flex: 1, maxWidth: "600px", display: "flex", flexDirection: "column", height: "600px" }}>
              <div style={{ flex: 1, overflowY: "auto", paddingRight: "1rem" }}>
                {paginated.map((e) => (
                  <div key={e.id} onClick={() => navigate(`/etablissement/${e.id}`)} style={{ border: "1px solid #000", borderRadius: "8px", padding: "1.5rem", marginBottom: "1.5rem", background: "#fff", position: "relative", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <h3 style={{ margin: 0, fontSize: "1.6rem", color: "#000080" }}>{e.nom}</h3>
                    </div>
                    <p style={{ margin: "0.5rem 0" }}><strong>{t("results.distance")}</strong> {e.distance} km</p>
                    <p style={{ margin: "0.5rem 0" }}><strong>Ville :</strong> {e.ville}</p>
                    <p style={{ margin: "0.5rem 0" }}><strong>Quartier :</strong> {e.quartier}</p>
                    <p style={{ margin: "0.5rem 0" }}><strong>{t("results.niveau")}</strong> {e.niveau}</p>
                    <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ background: "#f1f1f1", padding: "0.4rem 0.75rem", borderRadius: "6px", fontSize: "0.85rem" }}>{e.niveau}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={buttonStyle}>{t("pagination.prev")}</button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} style={{ ...buttonStyle, background: i + 1 === currentPage ? "#007bff" : "transparent", color: i + 1 === currentPage ? "#fff" : "#007bff" }}>{i + 1}</button>
                ))}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={buttonStyle}>{t("pagination.next")}</button>
              </div>
            </div>

            <div style={{ flex: 1, height: "600px", borderRadius: "12px", overflow: "hidden" }}>
              <MapContainer style={{ width: "100%", height: "100%" }} zoom={12}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                <FitBounds positions={etabs.filter(e => e.latitude && e.longitude).map(e => [e.latitude, e.longitude])} />
                {etabs.filter(e => e.latitude && e.longitude).map((e) => (
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
      ) : null}

      {etabs.length === 0 && !loading && !noResult && (
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "3rem", padding: "5rem 2rem" }}>
          {[
            { titre: t("cards.0.title"), texte: t("cards.0.text"), image: "/images/1106.jpg" },
            { titre: t("cards.1.title"), texte: t("cards.1.text"), image: "/images/c2.png" },
            { titre: t("cards.2.title"), texte: t("cards.2.text"), image: "/images/c3.jpg" },
          ].map((item, index) => (
            <div key={index} style={{ width: "400px", background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 8px 20px rgba(0, 0, 0, 0.08)", transition: "all 0.4s ease", cursor: "pointer", border: "2px solid transparent" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-12px)"; e.currentTarget.style.boxShadow = "0 0 25px #007bff55"; e.currentTarget.style.borderColor = "#007bff88"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.08)"; e.currentTarget.style.borderColor = "transparent"; }}>
              <div style={{ overflow: "hidden", height: "230px" }}>
                <img src={item.image} alt={item.titre} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"} />
              </div>
              <div style={{ padding: "2rem", backgroundColor: "white" }}>
                <h3 style={{ color: "#003580", fontSize: "1.6rem", fontWeight: "700", marginBottom: "1rem" }}>{item.titre}</h3>
                <p style={{ color: "#333", fontSize: "1.05rem", lineHeight: "1.75" }}>{item.texte}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showErr && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 32, width: "90%", maxWidth: 480, textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,.3)" }}>
            <h2 style={{ color: "#cc0000" }}>{t("error_modal.title")}</h2>
            <p style={{ fontSize: "1.1rem", margin: "16px 0" }}>{t("error_modal.message")}</p>
            <button onClick={() => setShowErr(false)} style={{ padding: "10px 20px", background: "#003580", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
              {t("error_modal.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const buttonStyle = {
  padding: "0.5rem 0.8rem",
  border: "1px solid #007bff",
  background: "transparent",
  borderRadius: "4px",
  cursor: "pointer",
};

export default Accueil;