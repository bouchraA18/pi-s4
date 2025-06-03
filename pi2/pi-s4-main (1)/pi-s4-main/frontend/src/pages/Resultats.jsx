// src/pages/Resultats.jsx
import React, { useEffect, useState, useRef } from "react";
import axios                     from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MapContainer, TileLayer, Marker, Popup, useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L                         from "leaflet";

/* Leaflet marker assets (shadow only; icons remplacés par divIcon) */
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/* ----------- Fix default marker shadow ------------ */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  shadowUrl: markerShadow,
  shadowSize: [41, 41],
  shadowAnchor: [13, 41],
});

/* ----------- Fit map to markers ------------------- */
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length) map.fitBounds(positions, { padding: [50, 50] });
  }, [map, positions]);
  return null;
}

/* ----------- Badge icon factory ------------------- */
const makeNumberIcon = (num) =>
  L.divIcon({
    className: "num-marker",
    html: `<div>${num}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
    shadowUrl: markerShadow,
  });

export default function Resultats() {
  const { search }              = useLocation();
  const navigate                = useNavigate();
  const [options, setOptions]   = useState({ niveaux: [], villes: [] });
  const [ville, setVille]       = useState("");
  const [niveau, setNiveau]     = useState("");
  const [etabs, setEtabs]       = useState([]);
  const [loading, setLoading]   = useState(true);

  /* ------------ pagination ------------------------- */
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE                = 5;
  const totalPages                    = Math.ceil(etabs.length / ITEMS_PER_PAGE);
  const paginated                     = etabs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /* ------------ read filters from URL -------------- */
  useEffect(() => {
    const params = new URLSearchParams(search);
    setVille(params.get("ville") || "");
    setNiveau(params.get("niveau") || "");
    setCurrentPage(1);
  }, [search]);

  /* ------------ load metadata ---------------------- */
  useEffect(() => {
    axios.get("http://localhost:8000/api/metadata/")
      .then(res => setOptions(res.data))
      .catch(()  => console.warn("Échec du chargement des métadonnées."));
  }, []);

  /* ------------ fetch results ---------------------- */
  useEffect(() => {
    setLoading(true);
    axios.get("http://localhost:8000/api/recherche/", {
      params: Object.fromEntries(new URLSearchParams(search).entries())
    })
    .then(res => setEtabs(res.data))
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [search]);

  /* ------------ in-page search --------------------- */
  const handleSearch = () => {
    if (!ville && !niveau) return;
    const p = new URLSearchParams();
    if (ville)  p.set("ville", ville);
    if (niveau) p.set("niveau", niveau);
    navigate(`/resultats?${p.toString()}`);
  };

  const positions = etabs.map(e => [e.latitude, e.longitude]);

  return (
    <div style={{ fontFamily:"Segoe UI, sans-serif" }}>
      {/* ---------------- Top nav -------------------- */}
      <nav style={{
        background:"#fff",
        padding:"1rem 2rem",
        display:"flex",
        justifyContent:"space-between",
        alignItems:"center",
        borderBottom:"1px solid #ccc"
      }}>
        <div style={{ fontWeight:"bold", fontSize:"1.5rem", color:"#003580" }}>
          🎓 Edunet.
        </div>
        <a onClick={()=>navigate("/")} style={{
          color:"#003580", textDecoration:"none", fontWeight:500, cursor:"pointer"
        }}>
          ← Retour à la recherche
        </a>
      </nav>

      {/* ---------------- Search bar ---------------- */}
      <div style={{
        background:"#fff",
        margin:"1.5rem auto",
        padding:"1rem",
        maxWidth:"700px",
        display:"flex", gap:"1rem",
        borderRadius:"8px",
        boxShadow:"0 2px 6px rgba(0,0,0,.1)"
      }}>
        <select value={ville} onChange={e=>setVille(e.target.value)}
          style={{ flex:1, padding:"0.75rem", borderRadius:"6px", border:"1px solid #ddd" }}>
          <option value="">Toutes villes</option>
          {options.villes.map((w,i)=><option key={i} value={w}>{w}</option>)}
        </select>
        <select value={niveau} onChange={e=>setNiveau(e.target.value)}
          style={{ flex:1, padding:"0.75rem", borderRadius:"6px", border:"1px solid #ddd" }}>
          <option value="">Tous niveaux</option>
          {options.niveaux.map((n,i)=><option key={i} value={n}>{n}</option>)}
        </select>
        <button onClick={handleSearch} style={{
          background:"#007bff", color:"#fff",
          padding:"0.75rem 1.5rem",
          border:"none", borderRadius:"6px", cursor:"pointer"
        }}>
          🔍
        </button>
      </div>

      <h2 style={{ textAlign:"center", color:"#003580", margin:"1rem 0" }}>
        Résultats de recherche
      </h2>

      {/* ---------------- Results ------------------- */}
      {loading ? (
        <p style={{ textAlign:"center" }}>Chargement…</p>
      ) : etabs.length===0 ? (
        <p style={{ textAlign:"center", color:"#cc0000" }}>
          😔 Aucun établissement trouvé.
        </p>
      ) : (
        <div style={{
          display:"flex",
          height:"650px",
          borderTop:"1px solid #e0e0e0"
        }}>
          {/* LEFT 50% : colourful cards */}
          <div style={{
            width:"50%",
            overflowY:"auto",
            padding:"1.5rem 1rem",
            display:"flex",
            flexDirection:"column",
            gap:"1.5rem"
          }}>
            {paginated.map((e, idx) => (
              <div
                key={e.id}
                onClick={()=>navigate(`/etablissement/${e.id}`)}
                style={{
                  cursor:"pointer",
                  borderRadius:12,
                  overflow:"hidden",
                  boxShadow:"0 4px 12px rgba(0,0,0,.08)",
                  background:"#fff",
                  transition:"transform .15s"
                }}
                onMouseEnter={ev=>ev.currentTarget.style.transform="translateY(-4px)"}
                onMouseLeave={ev=>ev.currentTarget.style.transform="none"}
              >
                {/* ribbon header */}
                <div style={{
                  background:"linear-gradient(135deg,#0064d4,#0099ff)",
                  color:"#fff", padding:".6rem 1rem"
                }}>
                  <h3 style={{margin:0,fontSize:"1.4rem",fontWeight:600}}>
                    {idx + 1}. {e.nom}
                  </h3>
                </div>

                <div style={{ padding:"1rem 1.2rem", color:"#333" }}>
                  <p style={{ margin:".3rem 0" }}>
                    <strong>Distance :</strong> {e.distance} km
                  </p>
                  <p style={{ margin:".3rem 0" }}>
                    <strong>Ville :</strong> {e.ville}
                  </p>
                  <p style={{ margin:".3rem 0" }}>
                    <strong>Niveau :</strong> {e.niveau}
                  </p>
                </div>
              </div>
            ))}

            {/* pagination */}
            <div style={{ textAlign:"center", marginTop:"0.5rem" }}>
              <button
                onClick={()=>setCurrentPage(p=>Math.max(1,p-1))}
                disabled={currentPage===1}
                style={pagerBtn}>‹</button>
              {[...Array(totalPages)].map((_,i)=>(
                <button key={i} onClick={()=>setCurrentPage(i+1)}
                  style={{
                    ...pagerBtn,
                    background:i+1===currentPage ? "#007bff":undefined,
                    color:i+1===currentPage ? "#fff":undefined
                  }}>
                  {i+1}
                </button>
              ))}
              <button
                onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))}
                disabled={currentPage===totalPages}
                style={pagerBtn}>›</button>
            </div>
          </div>

          {/* RIGHT 50% : map */}
          <div style={{ width:"50%", position:"relative" }}>
            <MapContainer style={{ width:"100%", height:"100%" }} zoom={12}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <FitBounds positions={positions}/>
              {etabs.map((e, idx) => (
                <Marker
                  key={e.id}
                  position={[e.latitude, e.longitude]}
                  icon={makeNumberIcon(idx + 1)}
                >
                  <Popup>
                    <strong>{e.nom}</strong><br/>{e.ville}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {/* CSS pour badges numérotés */}
      <style>{`
        .num-marker{
          background:#006064;
          border-radius:50%;
          color:#fff;
          font-weight:600;
          display:flex;align-items:center;justify-content:center;
          border:2px solid #fff;
          box-shadow:0 0 4px rgba(0,0,0,.35);
        }
        .num-marker div{
          width:26px;height:26px;
          line-height:26px;text-align:center;
        }
      `}</style>
    </div>
  );
}

/* -- petit helper pour pagination -- */
const pagerBtn = {
  margin:"0 .25rem",
  padding:".35rem .6rem",
  border:"1px solid #007bff",
  borderRadius:4,
  background:"#fff",
  color:"#007bff",
  cursor:"pointer"
};
