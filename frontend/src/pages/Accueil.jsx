import { useEffect, useState } from "react";
import axios from "axios";

function Accueil() {
  const [adresse, setAdresse] = useState("Chargement...");
  const [ville, setVille] = useState("");
  const [filtre, setFiltre] = useState("");
  const [etablissements, setEtablissements] = useState([]);
  const [aLanceRecherche, setALanceRecherche] = useState(false);
  const [visibleWords, setVisibleWords] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);


const animatedText = "Découvrez les meilleures écoles et instituts autour de vous, en quelques clics.";
const words = animatedText.split(" ");

useEffect(() => {
  const interval = setInterval(() => {
    setVisibleWords((prev) => {
      if (prev < words.length) return prev + 1;
      clearInterval(interval);
      return prev;
    });
  }, 120); // 120ms par mot
  return () => clearInterval(interval);
}, []);


  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const addr = res.data.address;
          const pointPrecis =
            addr.neighbourhood ||
            addr.suburb ||
            addr.road ||
            addr.city_district ||
            addr.village ||
            addr.city ||
            addr.town ||
            "Localisation inconnue";
          setAdresse(pointPrecis);
        } catch (err) {
          setAdresse("Erreur de géolocalisation");
        }
      });
    }
  }, []);

 const rechercher = async () => {
  if (!ville.trim() && !filtre.trim()) {
    setShowErrorModal(true); // Affiche la modale d’erreur
    return;
  }
  try {
    const res = await axios.get("http://localhost:8000/api/recherche/", {
      params: { ville, filtre },
    });
    setEtablissements(res.data);
    setALanceRecherche(true);
    setShowModal(true);
  } catch (err) {
    alert("Erreur lors de la recherche.");
  }
};


  return (
    <div style={{ fontFamily: "Segoe UI, sans-serif", backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Barre du haut */}
      <div style={{ backgroundColor: "#003580", color: "white", padding: "0.5rem 1rem", fontSize: "0.9rem", display: "flex", justifyContent: "space-between" }}>
        <div>📞 (+1) 3344 999 999</div>
        <div>✉️ info@edunet.com</div>
      </div>

      {/* Navigation */}
      <nav style={{ backgroundColor: "white", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ccc" }}>
        <div style={{ fontWeight: "bold", fontSize: "1.5rem", color: "#003580" }}>🎓 Edunet.</div>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <a href="#" style={{ color: "#003580", textDecoration: "none", fontWeight: "500" }}>Accueil</a>
          <a href="#" style={{ color: "#003580", textDecoration: "none", fontWeight: "500" }}>À propos</a>
          <a href="#" style={{ color: "#003580", textDecoration: "none", fontWeight: "500" }}>Contact</a>
          <input type="text" placeholder="Rechercher..." style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }} />
        </div>
      </nav>
{/* Zone principale : recherche à gauche / image à droite */}
{/* Zone principale : recherche à gauche / image à droite */}
<div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start", // 🔥 aligne tout en haut
  padding: "4rem 3rem 2rem 3rem",
  gap: "3rem",
  flexWrap: "wrap"
}}>


  {/* Bloc gauche : recherche */}
<div style={{
  flex: "1 1 50%",
  minWidth: "320px",
  paddingTop: "6rem"   // ✅ augmente la distance depuis le haut
}}>

  {/* Texte explicatif mis en valeur */}
<div style={{ marginTop: "1.5rem", marginBottom: "2rem" }}>
  {/* 🔼 Texte explicatif mis en haut */}
  <p style={{
  fontSize: "2.2rem",
  fontWeight: "700",
  color: "#003580",
  marginTop: "0.5rem",
  marginBottom: "1rem",
  maxWidth: "750px",
  lineHeight: "1.6",
  fontStyle: "normal",
  minHeight: "3.2rem", // évite que ça saute
  display: "flex",
  flexWrap: "wrap"
}}>
  {words.map((word, index) => (
    <span
      key={index}
      style={{
        opacity: index < visibleWords ? 1 : 0,
        transition: "opacity 0.4s ease",
        marginRight: "0.5rem",
      }}
    >
      {word}
    </span>
  ))}
</p>


  <p style={{
    fontSize: "1.25rem",
    color: "#1a1a1a",
    fontWeight: "400",
    lineHeight: "1.75",
    marginBottom: "2rem",
    maxWidth: "750px"
  }}>
    Edunet vous aide à trouver rapidement un établissement selon votre ville, votre niveau ou votre spécialité grâce à un moteur de recherche intelligent et localisé.
  </p>

  {/* 🔽 Titre principal maintenant en bas */}
  <h1 style={{
    fontSize: "2.6rem",
    marginBottom: "1.5rem",
    color: "#003580"
  }}>
    Trouvez une bonne école.
  </h1>
</div>



  <div style={{
  display: "flex",
  alignItems: "center",
  backgroundColor: "white",
  borderRadius: "10px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  marginBottom: "1rem",
  padding: "0.5rem",
  gap: "1rem",             // ✅ espace entre les champs
  maxWidth: "700px",       // ✅ limite globale de largeur
  width: "100%"
}}>
  <input
    type="text"
    placeholder="Ville de l’établissement"
    value={ville}
    onChange={(e) => setVille(e.target.value)}
    style={{
      flex: "1",
      minWidth: "200px",
      padding: "1rem",
      fontSize: "1rem",
      border: "1px solid #ddd",
      borderRadius: "8px"
    }}
  />
  <input
    type="text"
    placeholder="Nom ou niveau"
    value={filtre}
    onChange={(e) => setFiltre(e.target.value)}
    style={{
      flex: "1",
      minWidth: "160px",
      padding: "1rem",
      fontSize: "1rem",
      border: "1px solid #ddd",
      borderRadius: "8px"
    }}
  />
  <button
    onClick={rechercher}
    style={{
      backgroundColor: "#007bff",
      color: "white",
      padding: "1rem 1.5rem",
      border: "none",
      borderRadius: "8px",
      fontSize: "1.2rem",
      cursor: "pointer"
    }}
  >
    🔍
  </button>
</div>

<div style={{
  display: "inline-flex",
  alignItems: "center",
  gap: "0.6rem",
  backgroundColor: "#ffffff",
  border: "1px solid #ccc",
  padding: "0.7rem 1.2rem",
  borderRadius: "10px",
  boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
  fontSize: "1rem",
  fontWeight: "500",
  color: "#003580",
  marginTop: "1rem",
  width: "fit-content"
}}>
   <span><strong>Localisation actuelle :</strong> {adresse}</span>
</div>

  </div>

  {/* Bloc droit : image contenue proprement */}
  <div style={{ flex: "1 1 45%", minWidth: "320px", display: "flex", justifyContent: "center" }}>
    <img
      src="/images/lo.png"
      alt="Illustration localisation"
      style={{
        width: "100%",
        maxWidth: "680px",
        height: "auto",
        objectFit: "contain"
      }}
    />
  </div>
</div>
{/* 🔽 Section des cartes explicatives jolies avec effet lumineux */}
<div style={{
  display: "flex",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "3rem",
  padding: "5rem 2rem",
}}>
  {[
    {
      titre: "🎯 Ciblage précis",
      texte: "Trouvez les établissements correspondant à votre niveau ou spécialité. La plateforme vous guide intelligemment vers les options qui vous correspondent le mieux.",
      image: "/images/1106.jpg"
    },
    {
      titre: "📍 Localisation intelligente",
      texte: "Notre moteur détecte automatiquement votre position pour vous proposer les établissements les plus proches et adaptés à vos besoins.",
      image: "/images/c2.png"
    },
    {
      titre: "🚀 Accès rapide",
      texte: "Obtenez des résultats instantanés et précis sans remplir de longs formulaires. L'accès à l'information devient simple et rapide.",
      image: "/images/c3.jpg"
    }
  ].map((item, index) => (
    <div key={index} style={{
      width: "400px",
      background: "white",
      borderRadius: "20px",
      overflow: "hidden",
      boxShadow: "0 8px 20px rgba(0, 0, 0, 0.08)",
      transition: "all 0.4s ease",
      cursor: "pointer",
      border: "2px solid transparent"
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-12px)";
        e.currentTarget.style.boxShadow = "0 0 25px #007bff55";
        e.currentTarget.style.borderColor = "#007bff88";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.08)";
        e.currentTarget.style.borderColor = "transparent";
      }}
    >
      <div style={{ overflow: "hidden", height: "230px" }}>
        <img
          src={item.image}
          alt={item.titre}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.4s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        />
      </div>
      <div style={{ padding: "2rem", backgroundColor: "white" }}>
        <h3 style={{
          color: "#003580",
          fontSize: "1.6rem",
          fontWeight: "700",
          marginBottom: "1rem"
        }}>{item.titre}</h3>
        <p style={{
          color: "#333",
          fontSize: "1.05rem",
          lineHeight: "1.75"
        }}>{item.texte}</p>
      </div>
    </div>
  ))}
</div>


      {/* Résultats */}
      <div style={{ maxWidth: "900px", margin: "2rem auto" }}>
       
      </div>
      {showErrorModal && (
  <div style={{
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999
  }}>
    <div style={{
      backgroundColor: "white",
      padding: "2rem",
      borderRadius: "12px",
      width: "90%",
      maxWidth: "500px",
      textAlign: "center",
      boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
    }}>
      <h2 style={{ color: "#cc0000", marginBottom: "1rem" }}>⚠️ Attention</h2>
      <p style={{ fontSize: "1.2rem", color: "#333" }}>
        Veuillez remplir au moins un champ de recherche.
      </p>
      <button
        onClick={() => setShowErrorModal(false)}
        style={{
          marginTop: "1.5rem",
          padding: "0.6rem 1.2rem",
          backgroundColor: "#003580",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "1rem",
          cursor: "pointer"
        }}
      >
        Fermer
      </button>
    </div>
  </div>
)}

      {showModal && (
  <div style={{
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  }}>
    <div style={{
      backgroundColor: "white",
      padding: "2rem",
      borderRadius: "12px",
      width: "90%",
      maxWidth: "700px",
      maxHeight: "80vh",
      overflowY: "auto",
      boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
    }}>
      <h2 style={{ color: "#003580", marginBottom: "1rem" }}>Résultats de recherche</h2>

      {etablissements.length === 0 ? (
        <p style={{ color: "#cc0000" }}>😔 Aucun établissement trouvé à {ville}</p>
      ) : (
        etablissements.map((e) => (
          <div key={e.id} style={{
            backgroundColor: "#f5f7fa",
            padding: "1rem",
            marginBottom: "1rem",
            borderRadius: "8px",
            borderLeft: "5px solid #003580"
          }}>
            <h3 style={{ color: "#003580" }}>{e.nom}</h3>
            <p><strong> Ville :</strong> {e.ville}</p>
            <p><strong> Niveau :</strong> {e.niveau}</p>
            <p><strong> Coordonnées :</strong> {e.latitude}, {e.longitude}</p>
          </div>
        ))
      )}

      <button onClick={() => setShowModal(false)} style={{
        marginTop: "1rem",
        padding: "0.7rem 1.5rem",
        backgroundColor: "#003580",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer"
      }}>
        Fermer
      </button>
    </div>
  </div>
)}

    </div>
    
  );
  
}

export default Accueil;
