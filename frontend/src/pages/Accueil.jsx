import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

function Accueil() {
  const { t, i18n } = useTranslation();

  const changerLangue = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
  };

  const [adresse, setAdresse] = useState("...");
  const [ville, setVille] = useState("");
  const [filtre, setFiltre] = useState("");

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
            t("adresse.unknown");
          setAdresse(pointPrecis);
        } catch (err) {
          setAdresse(t("adresse.error"));
        }
      });
    }
  }, [t]);

  return (
    <div style={{ fontFamily: "Segoe UI", backgroundColor: "#f5f7fa" }}>
      {/* Bandeau supérieur */}
      <div style={{ backgroundColor: "#003580", color: "white", padding: "0.5rem 1rem", display: "flex", justifyContent: "space-between" }}>
        <div>📞 (+1) 3344 999 999</div>
        <div>✉ info@edunet.com</div>
      </div>

      {/* Barre de navigation */}
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

      {/* Contenu principal */}
      <section style={{ padding: "4rem 3rem", display: "flex", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: "#003580", fontSize: "2.5rem", fontWeight: "bold" }}>{t("heroText")}</h1>
          <p style={{ margin: "1rem 0", fontSize: "1.2rem" }}>{t("heroDescription")}</p>
           <h1 style={{
  fontSize: "2.6rem",
  marginBottom: "1.5rem",
  color: "#003580"
}}>
  {t("heroTitle")}
</h1>

          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <input placeholder={t("placeholder.city")} style={{ flex: 1, padding: "1rem", borderRadius: "8px", border: "1px solid #ccc" }} />
            <input placeholder={t("placeholder.level")} style={{ flex: 1, padding: "1rem", borderRadius: "8px", border: "1px solid #ccc" }} />
            <button style={{ backgroundColor: "#007bff", color: "white", borderRadius: "8px", padding: "1rem" }}>{t("search")}</button>
          </div>

          <div style={{ backgroundColor: "white", padding: "0.7rem 1.2rem", borderRadius: "10px", boxShadow: "0 3px 8px rgba(0,0,0,0.1)", width: "fit-content" }}>
            📍 <strong>{t("localisation")}</strong> : {adresse}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <img src="/images/lo.png" alt="localisation" style={{ maxWidth: "100%", height: "auto" }} />
        </div>
      </section>

      {/* Cartes explicatives (TRADUITES MAIS PHOTOS FIXES) */}
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "3rem", padding: "5rem 2rem" }}>
        {[0, 1, 2].map((index) => {
          const images = ["/images/1106.jpg", "/images/c2.png", "/images/c3.jpg"];
          const card = t(`cards.${index}`, { returnObjects: true });

          return (
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
                <img src={images[index]} alt={card.titre} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }} />
              </div>
              <div style={{ padding: "2rem", backgroundColor: "white" }}>
                <h3 style={{ color: "#003580", fontSize: "1.6rem", fontWeight: "700", marginBottom: "1rem" }}>{card.titre}</h3>
                <p style={{ color: "#333", fontSize: "1.05rem", lineHeight: "1.75" }}>{card.texte}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Accueil;
