import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

function Details() {
  const { id } = useParams();
  const [etab, setEtab] = useState(null);

  useEffect(() => {
    axios
      .get(`http://localhost:8000/api/etablissement/${id}/`)
      .then((res) => setEtab(res.data))
      .catch(console.error);
  }, [id]);

  if (!etab) return <p>Chargement...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>{etab.nom}</h1>
      <p><strong>Niveau :</strong> {etab.niveau}</p>
      <p><strong>Ville :</strong> {etab.ville}</p>
      <p><strong>Téléphone :</strong> {etab.téléphone}</p>
      <p><strong>Créé le :</strong> {etab.date_creation}</p>
      <p><strong>Coordonnées :</strong> {etab.latitude}, {etab.longitude}</p>
    </div>
  );
}

export default Details;
