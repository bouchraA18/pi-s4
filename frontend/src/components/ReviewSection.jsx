/* ReviewSection.jsx
   ───────────────────────────────────────────────────────────── */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Star, Send, User } from "lucide-react";

/* small helper: grab whichever token the app stores */
const getToken = () =>
  localStorage.getItem("visitor_token") ||
  localStorage.getItem("access_token") ||
  localStorage.getItem("access") ||
  "";

export default function ReviewSection({ etabId }) {
  const [list, setList]   = useState([]);
  const [busy, setBusy]   = useState(false);
  const [err,  setErr]    = useState("");
  const [note, setNote]   = useState(0);
  const [name, setName]   = useState("");     // optional
  const [txt,  setTxt]    = useState("");

  /* ── load existing avis ───────────────────────── */
  const fetchAvis = async () => {
    setBusy(true);
    try {
      const { data } = await axios.get(`/api/etablissement/${etabId}/avis/`);
      setList(data);
    } catch (e) {
      console.error(e);
      setErr("Impossible de charger les avis.");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => { fetchAvis(); /* eslint-disable-next-line */ }, [etabId]);

  /* ── submit handler ───────────────────────────── */
  const loggedIn = Boolean(getToken());
  const handleSend = async () => {
    if (note === 0) return setErr("Veuillez choisir une note.");
    try {
      await axios.post(
        `/api/etablissement/${etabId}/avis/`,
        { note, commentaire: txt, nom: name },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      /* reset local form */
      setNote(0); setName(""); setTxt("");
      fetchAvis();
    } catch (e) {
      const msg = e.response?.data?.error || "Erreur lors de l’envoi.";
      setErr(msg);
    }
  };

  /* ── star picker component ────────────────────── */
  const StarPicker = () => (
    <div className="flex gap-1 mb-3">
      {[1,2,3,4,5].map((n) => (
        <button
          key={n}
          onClick={() => setNote(n)}
          className={n <= note ? "text-yellow-500" : "text-gray-300"}
          aria-label={`${n} étoile${n>1?"s":""}`}
        >
          <Star fill={n <= note ? "#facc15" : "none"} size={28}/>
        </button>
      ))}
    </div>
  );

  /* ── render ───────────────────────────────────── */
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-[#003580]">Avis</h2>

      {/* existing list */}
      {busy ? (
        <p>Chargement…</p>
      ) : list.length === 0 ? (
        <p className="italic text-gray-500">Aucun avis pour l’instant.</p>
      ) : (
        <ul className="space-y-4">
          {list.map((a) => (
            <li key={a.id} className="bg-white shadow rounded p-4 space-y-1">
              <div className="flex items-center gap-2 text-sm text-[#003580]">
                <User size={16}/>
                {a.utilisateur?.nom || "(Utilisateur)"}
              </div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_,i)=>(
                  <Star key={i} size={18} className={i < a.note ? "text-yellow-400" : "text-gray-300"} />
                ))}
              </div>
              {a.commentaire && (
                <p className="text-gray-700">{a.commentaire}</p>
              )}
              <p className="text-xs text-gray-400">
                {new Date(a.date).toLocaleDateString("fr-FR")}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* add-review block */}
      <div className="bg-white shadow rounded p-6">
        {loggedIn ? (
          <>
            <h3 className="font-medium mb-2">Laisser un avis</h3>
            {err && <p className="text-red-600 mb-2">{err}</p>}

            <StarPicker/>

            <input
              type="text"
              placeholder="Votre nom (facultatif)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-3"
            />
            <textarea
              placeholder="Votre commentaire (facultatif)"
              rows={4}
              value={txt}
              onChange={(e) => setTxt(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4 resize-none"
            />

            <button
              onClick={handleSend}
              className="flex items-center gap-2 bg-[#003580] text-white px-5 py-2 rounded hover:bg-blue-900"
            >
              <Send size={18}/> Envoyer
            </button>
          </>
        ) : (
          <p className="text-gray-600">
            Vous devez être connecté pour laisser un avis.
          </p>
        )}
      </div>
    </section>
  );
}
