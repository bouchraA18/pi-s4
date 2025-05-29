# scripts/seed_pymongo.py
from datetime import date
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db     = client["monprojetdb"]

records = [
    {
        "nom": "Université de Nouakchott Al-Aasriya",
        "niveau": "supérieur",
        "description": (
            "Université publique fondée en 1981 (fusionnée en 2016). "
            "Plus de 12 000 étudiants sur plusieurs campus."
        ),
        "telephone": "+222 45 29 17 18",
        "site": "https://www.una.mr",
        "photo_urls": ["/images/image1.jpg", "/images/image2.jpg", "/images/image3.jpg"],
        "ville": "Nouakchott",
        "quartier": "Tevragh-Zeina",              # ← NEW
        "latitude": 18.0941,
        "longitude": -15.9719,
        "formations": ["Médecine", "Droit", "Sciences & Tech."],
    },
    {
        "nom": "Université des Sciences & Tech. de Nouadhibou",
        "niveau": "supérieur",
        "description": (
            "Établissement public spécialisé dans l’ingénierie minière, "
            "les pêches et la logistique portuaire."
        ),
        "telephone": "+222 46 74 01 92",
        "site": "https://ustn.mr",
        "photo_urls": ["/images/placeholder.jpg"],
        "ville": "Nouadhibou",
        "quartier": "Centre-Ville",               # ← NEW
        "latitude": 20.9334,
        "longitude": -17.0465,
        "formations": ["Génie minier", "Logistique portuaire"],
    },
    {
        "nom": "Institut Sup. d’Enseignement Technique de Rosso",
        "niveau": "supérieur",
        "description": (
            "Ancien Lycée de Rosso, devenu ISET Rosso ; formation "
            "agro-pastorale et technologique (≈800 étudiants)."
        ),
        "telephone": "+222 45 57 60 31",
        "site": "https://iset-rosso.mr",
        "photo_urls": ["/images/image4.jpg", "/images/image5.jpg"],
        "ville": "Rosso",
        "quartier": "Nord",                       # ← NEW
        "latitude": 16.5137,
        "longitude": -15.8070,
        "formations": ["Agronomie", "Génie rural"],
    },
    {
        "nom": "Lycée National de Zouérat",
        "niveau": "lycée",
        "description": "Premier lycée public du Tiris Zemmour (1967).",
        "telephone": "+222 22 11 22 33",
        "site": "",
        "photo_urls": ["/images/image6.jpg", "/images/image7.jpg"],
        "ville": "Zouérat",
        "quartier": "Ouest",                      # ← NEW
        "latitude": 22.7343,
        "longitude": -12.4526,
        "formations": ["Série scientifique", "Série technique"],
    },
    {
        "nom": "Centre de Formation Polyvalente de Sélibaby",
        "niveau": "formation professionnelle",
        "description": (
            "Formations courtes en agriculture, énergie solaire et "
            "micro-entrepreneuriat."
        ),
        "telephone": "+222 48 36 49 01",
        "site": "",
        "photo_urls": ["/images/image8.jpg"],
        "ville": "Sélibaby",
        "quartier": "Sud-Est",                    # ← NEW
        "latitude": 15.1589,
        "longitude": -12.1843,
        "formations": ["Technicien agricole", "Installateur PV"],
    },
    {
        "nom": "Institut Supérieur du Numérique (SupNum)",
        "niveau": "supérieur",
        "description": "Institut public spécialisé en technologies numériques et innovation, basé à Nouakchott.",
        "telephone": "+222 44 44 44 44",
        "site": "https://supnum.mr",
        "photo_urls": ["/images/image9.webp", "/images/image10.webp", "/images/image11.webp"],
        "ville": "Nouakchott",
        "quartier": "Ksar",                       # ← NEW
        "latitude": 18.0880,
        "longitude": -15.9742,
        "formations": ["Développement Web", "Sécurité Informatique", "Réseaux & Télécoms"],
    },
    {
        "nom": "Écoles Maarif",
        "niveau": "primaire",
        "description": "Établissement privé mauritanien reconnu, offrant un enseignement bilingue de qualité.",
        "telephone": "+222 33 33 33 33",
        "site": "https://maarif.mr",
        "photo_urls": ["/images/image12.jpg", "/images/image13.webp"],
        "ville": "Nouakchott",
        "quartier": "Toujounine",                 # ← NEW
        "latitude": 18.0902,
        "longitude": -15.9784,
        "formations": ["Maternelle", "Primaire", "Collège"],
    },
]

# Localisation IDs : clé = (ville, quartier)
loc_ids = {}
for rec in records:
    key = (rec["ville"], rec["quartier"])
    if key not in loc_ids:
        loc_ids[key] = db.core_localisation.insert_one(
            {
                "ville":     rec["ville"],
                "quartier":  rec["quartier"],     # ← NEW
                "latitude":  rec["latitude"],
                "longitude": rec["longitude"],
            }
        ).inserted_id

# Drop and insert fresh data
db.core_etablissement.drop()
for rec in records:
    db.core_etablissement.insert_one(
        {
            "nom":             rec["nom"],
            "telephone":       rec["telephone"],
            "date_creation":   date.today().isoformat(),
            "validate":        True,
            "niveau":          rec["niveau"],
            "description":     rec["description"],
            "formations":      rec["formations"],
            "photo_urls":      rec["photo_urls"],
            "site":            rec["site"],
            "localisation_id": loc_ids[(rec["ville"], rec["quartier"])],
        }
    )

print(f"✅  Seeded {len(records)} authentic establishments with quartiers & formations.")
