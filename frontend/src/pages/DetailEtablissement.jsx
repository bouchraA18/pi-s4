import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  MapContainer, TileLayer, Marker, Popup as LeafPopup,
} from "react-leaflet";
import {
  ArrowLeft, Heart, MapPin, Phone, Globe, Star, Image as ImgIcon,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";

import ReviewSection from "../components/ReviewSection";

/* helper to ensure photos have absolute URLs */
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const normalizeUrl = (url) => (url.startsWith("http") ? url : `${API_BASE}${url}`);

export default function DetailEtablissement() {
  const { id } = useParams();
  const nav      = useNavigate();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [err,  setErr]  = useState("");
  const [fav,  setFav]  = useState(false);

  const [lightbox, setLightbox]   = useState(false);
  const [current,  setCurrent]    = useState(0);

  /* ─── Fetch public data ─────────────────────────────── */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setBusy(true);
        const r = await axios.get(`/api/etablissement/${id}/`);
        if (alive) setData(r.data);
      } catch (e) {
        console.error(e);
        if (alive) setErr("Impossible de charger cet établissement.");
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (busy)
    return <div className="h-screen flex justify-center items-center">Chargement…</div>;
  if (err || !data)
    return <div className="text-center p-10 text-red-600">{err || "Établissement introuvable."}</div>;

  /* destructuring for readability */
  const {
    nom, ville, niveau, type, telephone, site,
    description, latitude, longitude,
    photo_urls = [], formations = [],
  } = data;

  const photos = photo_urls.map(normalizeUrl);

  /* ─── UI ─────────────────────────────────────────────── */
  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* header */}
      <header className="sticky top-0 z-50 bg-white shadow px-4 py-4 flex items-center gap-4">
        <button onClick={() => nav(-1)} className="p-2 rounded hover:bg-gray-100">
          <ArrowLeft />
        </button>
        <h1 className="text-xl font-bold text-[#003580] truncate">{nom}</h1>
      </header>

      {/* gallery */}
      <section className="max-w-6xl mx-auto px-4 pt-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.length ? photos.map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="rounded object-cover h-56 w-full cursor-pointer"
              onClick={() => { setCurrent(i); setLightbox(true); }}
            />
          )) : (
            <div className="col-span-full flex flex-col items-center text-gray-400 py-10">
              <ImgIcon size={42} />
              <p>Aucune photo disponible</p>
            </div>
          )}
        </div>
      </section>

      {/* lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center">
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 text-white">
            <X size={36} />
          </button>
          <button onClick={() => setCurrent((current - 1 + photos.length) % photos.length)} className="absolute left-4 text-white">
            <ChevronLeft size={36} />
          </button>
          <img src={photos[current]} className="max-h-[80vh] max-w-[90vw] object-contain" alt="" />
          <button onClick={() => setCurrent((current + 1) % photos.length)} className="absolute right-4 text-white">
            <ChevronRight size={36} />
          </button>
        </div>
      )}

      {/* main stack (single column) */}
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* info card */}
        <div className="bg-white rounded shadow p-6 space-y-3">
          <p className="flex items-center gap-2 text-gray-700"><MapPin /> {ville}</p>
          <p className="flex items-center gap-2 text-gray-700"><Star /> {niveau}</p>
          <p className="flex items-center gap-2 text-gray-700"><Star /> {type === "privée" ? "Privé" : "Public"}</p>
          {telephone && <p className="flex items-center gap-2 text-gray-700"><Phone /> {telephone}</p>}
          {site && (
            <p className="flex items-center gap-2">
              <Globe />
              <a href={site} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                {site}
              </a>
            </p>
          )}

          {formations.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {formations.map((f, i) => (
                <span key={i} className="bg-blue-100 px-3 py-1 rounded-full text-sm text-[#003580]">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* description */}
        {description && (
          <div className="bg-white rounded shadow p-6">
            <h2 className="text-xl font-semibold text-[#003580] mb-2">Description</h2>
            <p className="text-gray-700 leading-relaxed">{description}</p>
          </div>
        )}

        {/* reviews */}
        <ReviewSection etabId={data.id} />

        {/* map at the very bottom */}
        <div className="bg-white rounded shadow p-4">
          {(typeof latitude === "number" && typeof longitude === "number") ? (
            <MapContainer
              center={[latitude, longitude]}
              zoom={14}
              className="h-[250px] w-full rounded"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
              <Marker position={[latitude, longitude]}>
                <LeafPopup>{nom}</LeafPopup>
              </Marker>
            </MapContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              Coordonnées non disponibles
            </div>
          )}
        </div>
      </main>

      {/* favourite toggle */}
      <button onClick={() => setFav(!fav)} className="fixed bottom-6 right-6 p-4 bg-white rounded-full shadow-lg hover:shadow-xl">
        <Heart size={28} className={fav ? "text-red-500 fill-red-500" : "text-gray-400"} />
      </button>
    </div>
  );
}
