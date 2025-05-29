import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { TbMapSearch } from "react-icons/tb";


function Accueil() {
  const [adresse, setAdresse] = useState("Chargement...");
  const [filtre, setFiltre] = useState("");
  const [nom, setNom] = useState("");
  const [niveau, setNiveau] = useState("");
  const [type, setType] = useState("");
  const [ville, setVille] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [selectedLocalisation, setSelectedLocalisation] = useState(null);
  const [categorie, setCategorie] = useState("nom");
  const [etablissements, setEtablissements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [aLanceRecherche, setALanceRecherche] = useState(false);
  const [visibleWords, setVisibleWords] = useState(0);
  const [etabQuery, setEtabQuery] = useState("");
  const [etabSuggestions, setEtabSuggestions] = useState([]);
  const [showFiltres, setShowFiltres] = useState(false);
  const inputRef = useRef();
  const containerRef = useRef(null);
  const [suggestionsNom, setSuggestionsNom] = useState([]);
  const [suggestionsAdresse, setSuggestionsAdresse] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);



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
      console.log("📍 Position détectée :", latitude, longitude);
      try {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
        );

        const addr = res.data.address;
        const ville = addr.city || addr.town || addr.village || addr.state || "Ville inconnue";
        const quartier = addr.neighbourhood || addr.suburb || addr.city_district || "";
        const localisation = quartier ? `${ville}, ${quartier}` : ville;

        setAdresse(localisation);  // 👈 valeur initiale
      } catch (err) {
        console.error("Erreur géolocalisation :", err);
        setAdresse("Erreur de géolocalisation");
      }
    });
  } else {
    setAdresse("Géolocalisation non supportée");
  }
}, []);


const rechercher = async () => {
  // Si rien n’est rempli → erreur
  if ( !nom.trim() &&
    !niveau.trim() &&
    !type.trim() &&
    !filtre.trim() ) 
  {
    setShowErrorModal(true);
    return;
  }

  // Construction dynamique des paramètres
  const params = {};
  
  if (selectedLocalisation) {
    params.localisation = selectedLocalisation;
  }
  // Remplir le bon champ en fonction de la catégorie sélectionnée
  if (categorie === "nom") params.nom = nom.trim();
  if (categorie === "niveau") params.niveau = nom.trim();
  if (categorie === "type") params.type = nom.trim();

  try {
    const res = await axios.get("http://localhost:8000/api/recherche/", {
      params
    });

    setEtablissements(res.data);
    setVille(filtre || "la zone choisie");
    setShowModal(true);
    setALanceRecherche(true);
  } catch (err) {
    setEtablissements([]);
    setVille(filtre || "la zone choisie");
    setShowModal(true);
    setALanceRecherche(true);
  }
};



useEffect(() => {
  if (adresse) {
    setFiltre(adresse);
  }
}, [adresse]);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      setShowFiltres(false);
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
    return;
  }

  try {
    const res = await axios.get("http://localhost:8000/api/localisation-autocomplete/", {
      params: { q: value }
    });
    setSuggestionsAdresse(res.data);
  } catch (err) {
    console.error("❌ Erreur API localisation autocomplete :", err.message);
    setSuggestionsAdresse([]);
  }
};


const handleNomChange = async (e) => {
  const value = e.target.value;
  setNom(value);

  if (value.length < 2) {
    setSuggestionsNom([]);
    return;
  }

  try {
    const res = await axios.get("http://localhost:8000/api/etablissements-autocomplete/", {
      params: { q: value }
    });
    setSuggestionsNom(res.data);
  } catch (err) {
    console.error("Erreur auto-completion :", err);
  }
};

  const handleSuggestionClick = (suggestions) => {
    setNom(suggestions);
    setSuggestionsNom([]);
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

 
      {/* Nom avec auto-completion */}
<div ref={containerRef} style={{ position: "relative", flex: 1 }}>
  <input
    type="search"
    ref={inputRef}
    placeholder="Nom, Niveau, ou type de l’établissement"
    value={nom}
    onFocus={() => {
      if (typeof nom === 'string' && nom.trim() === "") {
        setShowFiltres(true);
      }
    }}
    onChange={(e) => {
      const value = e.target.value;
      setNom(value);
      setCategorie("nom");

      if (value.trim().length === 0) {
        setSuggestionsNom([]);
        setShowFiltres(true);
      } else {
        setShowFiltres(false);
        axios.get("http://localhost:8000/api/etablissements-autocomplete/", {
          params: { q: value }
        })
        .then((res) => setSuggestionsNom(res.data))
        .catch(() => setSuggestionsNom([]));
      }
    
    }}
    style={{
      width: "100%",
      minWidth: "200px",
      padding: "1rem",
      fontSize: "1rem",
      border: "none",
      borderLeft: "1px solid #ddd",
      borderRadius: "8px",
      outline: "none"
    }}
  />

  {/* Suggestions d’établissements */}
  {suggestionsNom.length > 0 && (
    <ul style={{
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      backgroundColor: "white",
      border: "1px solid #ccc",
      borderRadius: "0 0 8px 8px",
      maxHeight: "200px",
      overflowY: "auto",
      zIndex: 1000,
      listStyle: "none",
      margin: 0,
      padding: 0
    }}>
      {suggestionsNom.map((item, index) => (
        <li
          key={index}
          onClick={() => {
            setNom(item);
            setSuggestionsNom([]);
            setShowFiltres(false);
          }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          style={{
            padding: "0.8rem",
            cursor: "pointer",
            borderBottom: "1px solid #eee",
            backgroundColor: hoveredIndex === index ? "#f0f8ff" : "white"
          }}
        >
          {item}
        </li>
      ))}
    </ul>
  )}


  {/* Menu déroulant des filtres (quand input est vide et focus) */}
{showFiltres && suggestionsNom.length === 0 && (
  <div
    style={{
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      backgroundColor: "#fff",
      border: "1px solid #ccc",
      padding: "1rem",
      zIndex: 999,
      borderRadius: "0 0 10px 10px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
    }}
  >
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ color: "#666", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
        NIVEAU SCOLAIRE
      </div>
      {["Primaire", "Secondaire", "Supériere"].map((n, index) => (
        <div
          key={n}
          onClick={() => {
            setNiveau(n);
            setCategorie("niveau");
            setNom(n); // 👈 remplis le champ input
            setShowFiltres(false);
          }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          style={{
            padding: "0.5rem",
            cursor: "pointer",
            backgroundColor: hoveredIndex === index ? "#f0f8ff" : (niveau === n ? "#e6f0ff" : "transparent"),
            borderRadius: "6px"
          }}
        >
          {n}
        </div>
      ))}
    </div>

    <div>
      <div style={{ color: "#666", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
        TYPE D'ÉTABLISSEMENT
      </div>
      {["Publique", "Privée"].map((t, index) => (
        <div
          key={t}
          onClick={() => {
            setType(t);
            setCategorie("type");
            setNom(t); // 👈 remplis le champ input
            setShowFiltres(false);
          }}
          onMouseEnter={() => setHoveredIndex(index + 10)} // éviter conflit index
          onMouseLeave={() => setHoveredIndex(null)}
          style={{
            padding: "0.5rem",
            cursor: "pointer",
            backgroundColor: hoveredIndex === index + 10 ? "#f0f8ff" : (type === t ? "#e6f0ff" : "transparent"),
            borderRadius: "6px"
          }}
        >
          {t}
        </div>
      ))}
    </div>
  </div>
)}

</div>



    <div style={{ flex: 1, position: "relative" }}>
        <input
          type="search"
          id="search-filtre"
          placeholder="Ville, Quartier"
          value={filtre}
          onChange={handleAdresseChange}
          style={{
            width: "100%",
            minWidth: "160px",
            padding: "1rem",
            fontSize: "1rem",
            border: "none",
            borderLeft: "1px solid #ddd",
            borderRadius: "8px",
            outline: "none"
          }}
        />
        {suggestionsAdresse.length > 0 && (
          <ul style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "0 0 8px 8px",
            maxHeight: "200px",
            overflowY: "auto",
            zIndex: 1000,
            listStyle: "none",
            margin: 0,
            padding: 0
          }}>
            {suggestionsAdresse.map((sugg, index) => (
              <li
                key={index}
                onClick={() => {
                  setFiltre(sugg.label);          // texte affiché
                  setSelectedLocalisation(sugg.id); // valeur envoyée à l'API
                  setSuggestionsAdresse([]);
                  document.getElementById("search-filtre").focus();
                }}
                style={{
                  padding: "0.8rem 1rem",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee"
                }}
              >
                {sugg.label} 
              </li>
            ))}

          </ul>
        )}
        
      </div>

      <button
        onClick={rechercher}
        style={{
          backgroundColor: "#007bff",
          color: "white",
          padding: "0.5rem 1rem",
          border: "none",
          borderRadius: "8px",
          fontSize: "1.2rem",
          cursor: "pointer"
        }}
      >
        <TbMapSearch size={28} />
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
            <p><strong>Téléphone :</strong> {e.téléphone}</p>
            <p><strong>Date de création :</strong> {new Date(e.date_creation).toLocaleDateString()}</p>
            <p><strong>Validation :</strong> {e.validate ? "Oui" : "Non"}</p>
            <p><strong>Niveau :</strong> {e.niveau}</p>
            <p><strong>Type :</strong> {e.type}</p>
            <p><strong>Localisation :</strong> {e.localisation.ville}, {e.localisation.quartier}</p>
            <p><strong>Coordonnées :</strong> {e.localisation.latitude}, {e.localisation.longitude}</p>
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
