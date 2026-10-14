# Suivi des contributions et dépenses — Obsèques de feu Eli Komlan AMEMAVOR

Application web responsive (téléphone et ordinateur) qui permet à la famille de suivre en toute transparence l'argent reçu, les dons en nature, les dépenses et le solde de la caisse.

- **Espace familial** (public, sans connexion) : Accueil, Budget, Cotisations, Participations (en argent / en nature), Dépenses, Devis prestataires.
- **Administration** (trésorier uniquement, avec connexion) : ajout, modification et suppression de toutes les données, historique, rapport imprimable / PDF / Excel, import des fichiers Excel, paramètres, clôture.

---

## 1. Technologies

| Rôle | Choix |
| --- | --- |
| Interface | React 18 + TypeScript + Tailwind CSS (Vite) |
| Base de données | Firebase Firestore — **syntaxe v8** (`firebase/compat`) |
| Connexion | Firebase Authentication (e-mail + mot de passe) |
| Justificatifs (photos de reçus) | Firebase Storage |
| Hébergement | Firebase Hosting |
| Validation | `zod` côté client + règles de sécurité côté serveur |

## 2. Organisation des données

Toutes les collections portent le préfixe **`ame_`**. Les données de démonstration sont dans des collections séparées **`ame_demo_`** : elles ne peuvent jamais se mélanger aux vraies.

| Collection (réel) | Collection (démo) | Contenu |
| --- | --- | --- |
| `ame_contributions` | `ame_demo_contributions` | Entrées d'argent : `type` = `cotisation` (quote-part, avec `groupe` familial) ou `participation` (don libre). `montant` = attendu, `montantRecu` = réellement encaissé |
| `ame_dons` | `ame_demo_dons` | Participations en nature (quantité, unité, état) |
| `ame_postes` | `ame_demo_postes` | Postes du budget prévisionnel (prévision, responsable, financement) |
| `ame_depenses` | `ame_demo_depenses` | Dépenses rattachées à un poste (`posteId`), avec responsable et source de financement. `montant` = total, `montantPaye` = réellement versé |
| `ame_devis` | `ame_demo_devis` | Devis des prestataires, par poste (à étudier, retenu, non retenu) |
| `ame_historique` | `ame_demo_historique` | Journal de chaque création, correction, suppression (ajout seul) |
| `ame_parametres/general` | `ame_demo_parametres/general` | Texte d'accueil, photo, cérémonies, listes (groupes, financements, responsables), confidentialité, clôture |
| `ame_admins/{uid}` | (commune) | Liste des administrateurs |

Le choix de l'espace se fait par la variable `VITE_ESPACE` (`demo` ou `reel`) dans `.env.local`.

Fichiers Storage : `ame/{demo|reel}/justificatifs/...` et `ame/{demo|reel}/public/...` (photo du défunt).

### Règles de calcul (aucun total n'est saisi à la main)

- **Total encaissé** = cotisations versées + participations en argent reçues.
- **Budget** : le réalisé de chaque poste = somme des dépenses qui lui sont rattachées (engagé = montant total, payé = montant versé). Une dépense dont le poste a été supprimé apparaît « hors budget ».
- **Reste à financer** = budget prévu − argent reçu.
- **Total dépensé** = somme des `montantPaye` des dépenses non annulées (un paiement partiel ne compte que pour la part payée).
- **Solde** = total encaissé − total dépensé (un solde négatif est affiché, jamais bloqué).
- **Reste à payer** et **promesses en attente** sont suivis à part, hors solde.
- **Dons en nature** : jamais additionnés à l'argent ; la valeur estimée est purement informative.
- **Contributeurs distincts** : les noms sont rapprochés sans tenir compte des majuscules, des accents ni de l'ordre des mots ; le formulaire propose les noms déjà connus et signale les doublons probables.

Voir `src/lib/calculs.ts` et ses tests `src/lib/calculs.test.ts`.

### Informations du faire-part

Les valeurs de départ reprennent le faire-part : **Feu Eli Komlan AMEMAVOR**, 18 septembre 1953 – 20 septembre 2026, « L'Éternel est mon berger » (Psaume 23), le programme des cérémonies d'adieu (28, 30 et 31 octobre 2026), les salutations à Klikamé et le contact **70 01 75 26**.

- La photo est intégrée au site (`public/photo-defunt.png`) : elle s'affiche sans Firebase Storage.
- Le bloc « Cérémonies d'adieu » de l'accueil disparaît automatiquement après la date de la dernière cérémonie (après le 31 octobre).
- Le numéro de contact reste affiché dans le pied de page de l'espace familial (lien d'appel direct sur téléphone).
- Tout est modifiable dans **Paramètres** (nom, dates, citation, cérémonies, salutations, téléphone, photo). Une fois les paramètres enregistrés une première fois, ce sont les valeurs de la base qui s'affichent.

## 3. Sécurité

Assurée côté serveur par `firestore.rules` et `storage.rules` :

- lecture publique des contributions, dons, dépenses et paramètres (espace familial) ;
- écriture **réservée aux administrateurs** (`ame_admins/{uid}`), qu'on ne peut créer que depuis la console ;
- **chaque écriture doit être accompagnée de son entrée d'historique** dans le même lot, sinon elle est refusée ;
- l'historique est en ajout seul : ni modification, ni suppression ;
- **suppression** réservée à l'administrateur, avec motif obligatoire : une copie complète de l'élément supprimé est déposée dans l'historique (entrée `sup_<id>`) dans le même lot, sinon la suppression est refusée ;
- validation stricte des champs (montants entiers positifs, statut cohérent avec le montant payé, champs inconnus refusés…) ;
- après **clôture**, plus aucun ajout ni correction ;
- justificatifs : images ou PDF de 10 Mo maximum, visibles par la famille seulement si l'option est activée.

**Limite à connaître** : l'option « masquer les noms / les montants » agit sur l'affichage. Les données restent techniquement lisibles par quelqu'un qui interrogerait directement la base. Si la famille veut une confidentialité stricte, il faudra protéger l'espace familial par un code d'accès (évolution possible).

## 4. Installation

Prérequis : Node.js 18 ou plus récent.

```bash
npm install
npm run dev                  # http://localhost:5173
```

La configuration du projet Firebase `my-streakers` est intégrée au code (`src/lib/firebase.ts`) : rien à configurer pour démarrer. Ce n'est pas un secret (elle est visible par tout visiteur du site) ; la protection repose sur les règles de sécurité.

Un fichier `.env.local` (modèle : `.env.example`) est facultatif. Il sert à :
- passer aux données réelles avec `VITE_ESPACE=reel` (par défaut : `demo`) ;
- utiliser un autre projet Firebase.

Après toute modification de `.env.local`, arrêter puis relancer `npm run dev`.

## 5. Configuration Firebase (une seule fois)

1. **Authentication** → *Sign-in method* → activer **E-mail/Mot de passe**.
2. **Authentication** → *Users* → **Ajouter un utilisateur** (e-mail et mot de passe du trésorier). Copier son **UID**.
3. **Firestore** → créer la collection **`ame_admins`**, avec un document dont l'**ID est l'UID** copié, et un champ `role` = `"admin"`.
4. **Storage** : activer Cloud Storage (nécessaire pour les photos de reçus — sur les projets récents, Firebase demande le forfait Blaze, qui reste gratuit sous les quotas).
5. **Règles de sécurité** — ⚠️ **Lire avant de déployer** :
   - le projet `my-streakers` peut héberger d'autres applications ; déployer `firestore.rules` **remplace toutes les règles du projet** ;
   - s'il y a d'autres collections, copier le bloc compris entre `AME : début` et `AME : fin` **dans les règles existantes** (console Firebase → Firestore → Règles, puis Storage → Règles) ;
   - attention : si les règles existantes contiennent une règle générale du type `match /{document=**} { allow read, write: if true; }`, elle annule toutes les protections ci-dessus — il faut la retirer ;
   - si le projet n'est utilisé que par cette application : `npm run deploy:regles`.
6. Au premier enregistrement d'un justificatif, Firebase peut demander d'autoriser Storage à lire Firestore (nécessaire aux règles Storage) : accepter.

### Charger les données de démonstration

Avec `VITE_ESPACE=demo` : se connecter, aller dans **Paramètres** → **Charger les données fictives**. Le tableau de bord doit afficher 75 000 FCFA reçus, 30 000 payés, 45 000 en caisse, 20 000 restant à payer et 10 cartons de boissons.

### Importer les fichiers Excel du DG

Les fichiers remis (budget, dépenses courantes, participations, cotisations) sont convertis par `scripts/importer_excel.py` en `src/lib/donneesInitiales.json` : 51 postes (10 999 250 FCFA prévus), 21 dépenses (774 034 FCFA payés, dont 44 500 de frais de morgue réglés par Justin), 4 participations (enveloppes Papa 450 000 et Guy 300 000, Justin 44 500, Gaëlle Sepopo 100 000). Solde : 120 466 FCFA, soit le solde du fichier (20 466) plus la participation de Gaëlle Sepopo.

Dans l'application : **Paramètres** → **Données des fichiers Excel** → **Importer**. L'import n'est possible que si le budget et les dépenses sont vides (pas de doublons). Les dates absentes des fichiers sont fixées au 14 octobre 2026, avec une note en commentaire. Le fichier des cotisations était un modèle vide : seuls ses groupes familiaux sont repris.

### Passer aux données réelles

Mettre `VITE_ESPACE=reel` dans `.env.local`, puis reconstruire et redéployer. Les collections `ame_` (réelles) sont vides au départ, et le bouton de démonstration n'existe pas dans cet espace.

## 6. Déploiement en production

```bash
npm install -g firebase-tools   # ou npx firebase
firebase login
firebase hosting:sites:create ame-obseques-amemavor   # une seule fois
npm run deploy                                       # construit puis publie
```

Le site est publié sur `https://ame-obseques-amemavor.web.app` (HTTPS automatique). On utilise un **site d'hébergement séparé** pour ne pas écraser un autre site du projet `my-streakers`. Si le nom est déjà pris, en choisir un autre et le reporter dans `firebase.json` (`hosting.site`).

## 7. Tests

```bash
npm test             # règles de calcul (données de démonstration, paiements partiels, promesses, annulations…)
npm run test:regles  # règles de sécurité contre l'émulateur Firebase (nécessite Java)
```

`npm run test:regles` couvre notamment : lecture publique, écriture refusée sans connexion ou sans droits d'administration, historique obligatoire, suppression avec motif et copie dans l'historique, cotisations, postes et devis, annulation avec motif, statut cohérent, clôture, isolation démo/réel et justificatifs.

## 8. Sauvegardes

- **Paramètres → Télécharger maintenant** : fichier JSON complet (historique compris). La date de la dernière sauvegarde s'affiche dans le tableau de bord.
- **Rapport → Excel** : classeur avec la synthèse, les contributions, les dons et les dépenses.
- Recommandé : une sauvegarde après chaque séance de saisie. Pour des sauvegardes automatiques, activer les exports planifiés de Firestore (forfait Blaze).

## 9. Structure du code

```
src/
  lib/          firebase (v8), espace (préfixes ame_), calculs, opérations (écritures + historique),
                données temps réel, auth, validation, exports, format FCFA
  famille/      espace familial : Accueil, Budget, Cotisations, Participations (ParticipationsArgent,
                ParticipationsNature), Depenses, Devis
  admin/        Connexion, TableauBord (aussi listes par type), ListeBudget, ListeDevis,
                FormContribution, FormDon, FormDepense, FormPoste, FormDevis,
                Historique, Rapport, Parametres
scripts/        importer_excel.py et fichiers sources (CSV)
  composants/   icônes et éléments d'interface
firestore.rules, storage.rules, firebase.json
tests/regles.test.ts
```
