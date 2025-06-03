import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup as LeafPopup,
} from "react-leaflet";
import {
  ArrowLeft, Heart, MapPin, Phone, Globe, Star,
  ChevronLeft, ChevronRight, X
} from "lucide-react";

import ReviewSection from "../components/ReviewSection";

const Stars = ({ value = 0, size = 20, filledClass = "text-yellow-400", emptyClass = "text-gray-300" }) =>
  [...Array(5)].map((_, i) => (
    <Star
      key={i}
      size={size}
      className={(i + 1) <= Math.round(value) ? filledClass : emptyClass}
    />
  ));

const formatDate = (d) =>
  new Date(d).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

export default function DetailEtablissement() {
  const { id } = useParams();
  const nav = useNavigate();

  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");
  const [fav, setFav] = useState(false);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setBusy(true);
        const res = await axios.get(`/api/etablissement/${id}/`);
        if (alive) setData(res.data);
      } catch (e) {
        console.error(e);
        if (alive) setErr("Impossible de charger cet établissement.");
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (busy) return <div className="h-screen flex justify-center items-center">Chargement...</div>;
  if (err || !data) return <div className="text-center p-10 text-red-600">{err || "Établissement introuvable."}</div>;

  const photos = Array.isArray(data.photo_urls) ? data.photo_urls : [];

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <header className="sticky top-0 z-50 bg-white shadow px-4 py-4 flex items-center gap-4">
        <button onClick={() => nav(-1)} className="p-2 rounded hover:bg-gray-100">
          <ArrowLeft />
        </button>
        <h1 className="text-xl font-bold text-[#003580] truncate">{data.nom}</h1>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-4">
          {photos.map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="rounded object-cover h-48 w-full cursor-pointer"
              onClick={() => { setCurrentImage(i); setLightboxOpen(true); }}
            />
          ))}
        </div>
      </section>

      {lightboxOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center">
          <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 text-white">
            <X size={36} />
          </button>
          <button onClick={() => setCurrentImage((currentImage - 1 + photos.length) % photos.length)} className="absolute left-4 text-white">
            <ChevronLeft size={36} />
          </button>
          <img src={photos[currentImage]} className="max-h-[80vh] max-w-[90vw] object-contain" alt="" />
          <button onClick={() => setCurrentImage((currentImage + 1) % photos.length)} className="absolute right-4 text-white">
            <ChevronRight size={36} />
          </button>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-4 space-y-12">
        <section className="space-y-3">
          <p className="flex items-center gap-2"><MapPin /> {data.ville}</p>
          <p className="flex items-center gap-2"><Star /> {data.niveau}</p>
          {data.telephone && <p className="flex items-center gap-2"><Phone /> {data.telephone}</p>}
          {data.site && <p className="flex items-center gap-2"><Globe /> <a href={data.site} target="_blank" rel="noreferrer" className="text-blue-600 underline">{data.site}</a></p>}
          <div className="flex flex-wrap gap-2">
            {data.formations?.map((f, i) => (
              <span key={i} className="bg-blue-100 px-3 py-1 rounded-full text-sm text-[#003580]">{f}</span>
            ))}
          </div>
        </section>

        <section>
          {(typeof data.latitude === "number" && typeof data.longitude === "number") ? (
            <MapContainer center={[data.latitude, data.longitude]} zoom={14} className="h-72 w-full rounded">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[data.latitude, data.longitude]}>
                <LeafPopup>{data.nom}</LeafPopup>
              </Marker>
            </MapContainer>
          ) : (
            <p className="text-gray-500">Coordonnées non disponibles</p>
          )}
        </section>

        {data.description && (
          <section>
            <h2 className="text-xl font-semibold text-[#003580] mb-2">Description</h2>
            <p className="text-gray-700 leading-relaxed">{data.description}</p>
          </section>
        )}

        {/* NEW: Review system inserted here */}
        <ReviewSection etabId={data.id} />
      </main>

      <button onClick={() => setFav(!fav)} className="fixed bottom-6 right-6 p-4 bg-white rounded-full shadow-lg hover:shadow-xl">
        <Heart size={28} className={fav ? "text-red-500 fill-red-500" : "text-gray-400"} />
      </button>
    </div>

    
  );

  
}
