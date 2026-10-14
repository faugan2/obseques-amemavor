"""
Transforme les fichiers Excel (CSV) remis par le DG en données initiales pour l'application.

Entrée : scripts/sources/*.csv (UTF-8)
Sortie : src/lib/donneesInitiales.json

Usage : python3 scripts/importer_excel.py
"""
import csv
import json
import re
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SOURCES = RACINE / "scripts" / "sources"
SORTIE = RACINE / "src" / "lib" / "donneesInitiales.json"
DATE_IMPORT = "2026-10-14"
NOTE_DATE = "Date non précisée dans le fichier d'origine."

# Mots à écrire tels quels (noms propres, sigles) après la mise en minuscules.
NOMS = {
    "eept": "EEPT", "tvt": "TVT", "papa": "Papa", "klikame": "Klikamé", "ele": "Elé", "kpele": "Kpélé",
    "danyi": "Danyi", "lome": "Lomé", "tokoin": "Tokoin", "charity": "Charity", "vincent": "Vincent",
    "fo": "Fo", "atsou": "Atsou", "etsi": "Etsi", "mawugbe": "Mawugbe", "damali": "Damali", "guy": "Guy",
    "fri/sat/sun": "vendredi/samedi/dimanche", "accesoires": "accessoires", "defunts": "défunt",
    "electricite": "électricité", "eclairage": "éclairage", "amenagement": "aménagement",
    "ceremonie": "cérémonie", "cerceuil": "cercueil", "beton": "béton", "arme": "armé",
    "amenagements": "aménagements", "protestant": "protestant", "electrogene": "électrogène",
    "mairie": "mairie", "emoluments": "émoluments", "etrangers": "étrangers", "reception": "réception",
    "dejeuner": "déjeuner", "a": "à", "college": "Collège", "hotesses": "hôtesses", "baches": "bâches",
    "video": "vidéo", "parts": "-parts", "entretien": "entretien", "apres": "après", "complet": "complet",
}


def joli(texte: str) -> str:
    phrase = " ".join(texte.strip().lower().split())
    phrase = re.sub(r"[\w/]+", lambda m: NOMS.get(m.group(0), m.group(0)), phrase)
    return phrase[:1].upper() + phrase[1:]


def personne(texte: str) -> str:
    t = texte.strip()
    if not t:
        return ""
    corr = {"MANASSE": "Manassé", "FO ATSOU": "Fo Atsou", "FO ATSU": "Fo Atsou", "VINCENT FILS": "Vincent fils",
            "YAWO ELE": "Yawo (Elé)", "VINCENT ELE": "Vincent (Elé)", "FO ATSOU-CAROLE": "Fo Atsou, Carole"}
    if t.upper() in corr:
        return corr[t.upper()]
    return " ".join(m.capitalize() for m in t.lower().split())


def montant(texte: str) -> int:
    t = re.sub(r"[^\d]", "", texte or "")
    return int(t) if t else 0


def lire(nom: str):
    with open(SOURCES / nom, encoding="utf-8") as f:
        return list(csv.reader(f, delimiter=";"))


# ---------------------------------------------------------------- Postes du budget
postes = []
for ligne in lire("BUDGET_REALISATIONS_OBSEQUES.csv")[1:]:
    libelle = (ligne[0] if ligne else "").strip()
    if not libelle:
        continue
    if libelle.upper() == "TOTAL":
        break
    postes.append({
        "id": f"poste-{len(postes) + 1:02d}",
        "cle": libelle.upper(),
        "libelle": joli(libelle),
        "prevision": montant(ligne[1]),
        "financement": personne(ligne[4]),
        "responsable": personne(ligne[5]),
        "commentaire": (ligne[6].strip() if len(ligne) > 6 else "").replace("Besoins 03 Sites", "Besoins : 3 sites"),
        "ordre": (len(postes) + 1) * 10,
    })

FONCTIONNEMENT = {
    "id": f"poste-{len(postes) + 1:02d}",
    "cle": "FONCTIONNEMENT",
    "libelle": "Fonctionnement des domiciles (électricité, salaires, wifi, gaz…)",
    "prevision": 0,
    "financement": "",
    "responsable": "Carole",
    "commentaire": "Ajouté à l'import : dépenses courantes non prévues au budget initial.",
    "ordre": (len(postes) + 1) * 10,
}
postes.append(FONCTIONNEMENT)


def poste(cle: str) -> dict:
    for p in postes:
        if p["cle"].startswith(cle):
            return p
    raise KeyError(cle)


# ---------------------------------------------------------------- Dépenses courantes
# Rattachement de chaque ligne du fichier à un poste du budget.
RATTACHEMENT = [
    ("Frais Electricit", "FONCTIONNEMENT", "2026-09-30"),
    ("Achat Cash Power", "FONCTIONNEMENT", None),
    ("Achat petites boutelles", "ACHAT DE PETITES BOUTEILLE", None),
    ("Eclairage zones", "ELECTRICITE ECLAIRAGE", None),
    ("Agrandissement Photo", "AGRANDISSEMENT PHOTO PAPA", None),
    ("Emolument Gar", "FONCTIONNEMENT", "2026-09-22"),
    ("Am", "AMENAGEMENT PETITE CHAPELLE", None),
    ("Provision Domicile Klikame I", "FONCTIONNEMENT", None),
    ("Frais Entretien Jardin", "FONCTIONNEMENT", None),
    ("Frais Mission Ele du Chef", "FRAIS MISSION CHEF DE FAMILLE", None),
    ("Frais Mission Ele Paroisse", "FRAIS MISSION FO ATSOU", None),
    ("Provision Domicile Klikame II", "FONCTIONNEMENT", None),
    ("Achat Bouteille de Gaz", "FONCTIONNEMENT", None),
    ("Salaire YAWO", "FONCTIONNEMENT", None),
    ("Salaire Vincent", "FONCTIONNEMENT", None),
    ("Salaire Gouvernante", "FONCTIONNEMENT", "2026-09-03"),
    ("WIFI", "FONCTIONNEMENT", None),
    ("Mission Vincent", "MISSION VINCENT FILS", "2026-10-02"),
    ("Mission Danyi", "MISSION DANYI CHARITY", "2026-10-08"),
    ("Avance Cerceuil", "CERCUEIL", None),
]

depenses = []
participations = []
source = "Enveloppe Papa"
for ligne in lire("DEPENSES_COURANTES.csv")[1:]:
    libelle = (ligne[0] if ligne else "").strip()
    if not libelle or libelle.upper() in ("TOTAL", "SOLDE"):
        if libelle.upper() == "TOTAL":
            break
        continue
    entree, frais = montant(ligne[1]), montant(ligne[2])
    if entree:
        if "GUY" in libelle.upper():
            source = "Enveloppe Guy"
            participations.append(("Guy", entree, "Mise à disposition (enveloppe Guy)"))
        else:
            participations.append(("Enveloppe Papa", entree, "Fonds mis à disposition (enveloppe Papa)"))
        continue
    regle = next(r for r in RATTACHEMENT if libelle.startswith(r[0]))
    p = poste(regle[1])
    cercueil = regle[1] == "CERCUEIL"
    depenses.append({
        "date": regle[2] or DATE_IMPORT,
        "designation": "Cercueil (avance)" if cercueil else libelle,
        "posteId": p["id"],
        "categorie": p["libelle"],
        "responsable": personne(ligne[3]) or ("Fo Atsou, Carole" if cercueil else ""),
        "financement": source,
        "montant": p["prevision"] if cercueil else frais,
        "montantPaye": frais,
        "statut": "partielle" if cercueil else "payee",
        "beneficiaire": "",
        "mode": "especes",
        "reference": "",
        "justificatif": None,
        "commentaire": "" if regle[2] else NOTE_DATE,
    })

# Frais de morgue : réglés directement par Justin (fichier budget, colonne « Dépenses réelles »).
morgue = poste("FRAIS MORGUE")
depenses.insert(0, {
    "date": DATE_IMPORT, "designation": "Frais morgue", "posteId": morgue["id"], "categorie": morgue["libelle"],
    "responsable": "Carole", "financement": "Justin", "montant": 44500, "montantPaye": 44500, "statut": "payee",
    "beneficiaire": "", "mode": "autre", "reference": "", "justificatif": None,
    "commentaire": "Réglé directement par Justin. " + NOTE_DATE,
})
participations.append(("Justin", 44500, "Paiement direct des frais de morgue"))

for ligne in lire("PARTICIPATIONS.csv")[2:]:
    if ligne and ligne[0].strip() and ligne[0].strip().upper() != "TOTAL" and montant(ligne[1]):
        participations.append((personne(ligne[0]).replace("Gaelle", "Gaëlle"), montant(ligne[1]), ""))

contributions = [{
    "type": "participation", "groupe": "", "contributeur": nom, "date": DATE_IMPORT,
    "montant": m, "montantRecu": m, "mode": "autre" if nom in ("Enveloppe Papa", "Guy", "Justin") else "especes",
    "motif": motif, "reference": "", "commentaire": NOTE_DATE,
} for nom, m, motif in participations]

# Corrections d'orthographe des libellés du fichier d'origine.
CORRECTIONS = {
    "petites bouteille visiteurs": "petites bouteilles visiteurs",
    "faire -parts": "faire-part",
    "Location 02 armoires": "Location de 2 armoires",
    "Achat petites boutelles d'eau mini": "Achat de petites bouteilles d'eau",
    "Eclairage zones d'ombre au domicile Papa Klikame": "Éclairage des zones d'ombre au domicile de Papa à Klikamé",
    "Aménagement petite chapelle sur la terrase Klikame": "Aménagement de la petite chapelle sur la terrasse à Klikamé",
    "Provision Domicile Klikame II": "Provision domicile Klikamé (2)",
    "Provision Domicile Klikame I": "Provision domicile Klikamé (1)",
    "Frais Entretien Jardin Klikame": "Entretien du jardin à Klikamé",
    "Frais Mission Ele du Chef de Famille AMEMAVOR": "Mission à Elé du chef de famille AMEMAVOR",
    "Frais Mission Ele Paroisse KPELE ELE": "Mission à Elé, paroisse de Kpélé Elé",
    "Achat Cash Power Villa Blanche Ele": "Achat Cash Power, villa blanche à Elé",
    "Frais Electricité Septembre Post Papa Maison Klikamé": "Électricité de septembre, maison de Papa à Klikamé",
    "Emolument Garçon Ménage le 22 Septembre": "Émolument du garçon de ménage",
    "Achat Bouteille de Gaz le Grand": "Achat d'une grande bouteille de gaz",
    "Salaire YAWO Maison Blanche": "Salaire de Yawo, maison blanche",
    "Salaire Vincent chez Dr OBED": "Salaire de Vincent, chez Dr Obed",
    "Salaire Gouvernante Klikame le 03 Sept": "Salaire de la gouvernante à Klikamé",
    "WIFI Domicile Klikame": "Wifi du domicile de Klikamé",
    "Mission Vincent Ele le 02 Oct": "Mission de Vincent à Elé",
    "Mission Danyi Charity du 08 Oct": "Mission de Charity à Danyi",
    "Agrandissement Photo": "Agrandissement de la photo",
}


def corriger(t: str) -> str:
    for a, b in CORRECTIONS.items():
        t = t.replace(a, b)
    return t


for p in postes:
    del p["cle"]
    p["libelle"] = corriger(p["libelle"])
for d in depenses:
    d["designation"] = corriger(d["designation"])
    d["categorie"] = next(p["libelle"] for p in postes if p["id"] == d["posteId"])

donnees = {"postes": postes, "depenses": depenses, "contributions": contributions}
SORTIE.write_text(json.dumps(donnees, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

prevu = sum(p["prevision"] for p in postes)
paye = sum(d["montantPaye"] for d in depenses)
recu = sum(c["montantRecu"] for c in contributions)
print(f"{len(postes)} postes · prévu {prevu:,} FCFA".replace(",", " "))
print(f"{len(depenses)} dépenses · payé {paye:,} FCFA".replace(",", " "))
print(f"{len(contributions)} participations · reçu {recu:,} FCFA".replace(",", " "))
print(f"Solde : {recu - paye:,} FCFA".replace(",", " "))
