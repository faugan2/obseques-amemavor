import type firebase from 'firebase/compat/app';

export type Horodatage = firebase.firestore.Timestamp | null;

export type ModePaiement = 'especes' | 'mobile_money' | 'virement' | 'autre';

export const MODES_PAIEMENT: { valeur: ModePaiement; libelle: string }[] = [
  { valeur: 'especes', libelle: 'Espèces' },
  { valeur: 'mobile_money', libelle: 'Mobile Money' },
  { valeur: 'virement', libelle: 'Virement bancaire' },
  { valeur: 'autre', libelle: 'Autre' },
];

/** Champs communs à toutes les opérations (gérés automatiquement). */
export interface Trace {
  id: string;
  annule: boolean;
  motifAnnulation?: string;
  creePar: string;
  creeLe: Horodatage;
  modifieLe: Horodatage;
  /** Identifiant de l'entrée d'historique liée à la dernière écriture. */
  derniereOperation: string;
}

/** Cotisation = quote-part attendue de la famille ; participation = don libre d'un proche. */
export type TypeContribution = 'cotisation' | 'participation';

/**
 * Entrée d'argent dans la caisse (cotisation ou participation).
 * montant      = somme attendue (quote-part) ou annoncée
 * montantRecu  = somme réellement encaissée (seule comptée dans la caisse)
 */
export interface Contribution extends Trace {
  /** Absent sur les anciens enregistrements : considéré comme « participation ». */
  type?: TypeContribution;
  /** Groupe familial (cotisations uniquement), ex. « Enfants du défunt ». */
  groupe?: string;
  contributeur: string;
  contributeurCle: string;
  date: string; // AAAA-MM-JJ
  montant: number;
  montantRecu: number;
  mode: ModePaiement;
  motif: string;
  reference: string;
  commentaire: string;
}

export type StatutDon = 'annonce' | 'partiel' | 'recu';

export const STATUTS_DON: { valeur: StatutDon; libelle: string }[] = [
  { valeur: 'annonce', libelle: 'Annoncé' },
  { valeur: 'partiel', libelle: 'Partiellement reçu' },
  { valeur: 'recu', libelle: 'Reçu' },
];

export interface Don extends Trace {
  donateur: string;
  donateurCle: string;
  date: string;
  categorie: string;
  nature: string;
  quantite: number;
  unite: string;
  statut: StatutDon;
  /** Valeur estimative informative — jamais comptée dans la caisse. */
  valeurEstimee: number | null;
  observations: string;
}

export type StatutDepense = 'prevue' | 'partielle' | 'payee';

export interface Justificatif {
  chemin: string;
  nom: string;
  type: string;
}

/**
 * Dépense.
 * montant      = coût total
 * montantPaye  = somme réellement versée (seule retirée de la caisse)
 */
export interface Depense extends Trace {
  date: string;
  designation: string;
  /** Poste du budget auquel la dépense se rattache ('' = hors budget). */
  posteId?: string;
  /** Libellé du poste (copie, pour l'affichage et les exports). */
  categorie: string;
  /** Personne qui a engagé la dépense (ex. Carole). */
  responsable?: string;
  /** Source de l'argent utilisé (ex. Enveloppe Papa). */
  financement?: string;
  montant: number;
  montantPaye: number;
  statut: StatutDepense;
  beneficiaire: string;
  mode: ModePaiement;
  reference: string;
  justificatif: Justificatif | null;
  commentaire: string;
}

/** Poste du budget prévisionnel. Le réalisé est calculé à partir des dépenses rattachées. */
export interface Poste extends Trace {
  libelle: string;
  /** Montant prévu en FCFA (0 = non encore chiffré). */
  prevision: number;
  responsable: string;
  financement: string;
  commentaire: string;
  /** Ordre d'affichage. */
  ordre: number;
}

export type StatutDevis = 'recu' | 'retenu' | 'refuse';

export const STATUTS_DEVIS: { valeur: StatutDevis; libelle: string }[] = [
  { valeur: 'recu', libelle: 'Reçu, à étudier' },
  { valeur: 'retenu', libelle: 'Retenu' },
  { valeur: 'refuse', libelle: 'Non retenu' },
];

/** Devis d'un prestataire, rattaché à un poste du budget. */
export interface Devis extends Trace {
  prestataire: string;
  posteId: string;
  objet: string;
  montant: number;
  date: string;
  statut: StatutDevis;
  reference: string;
  commentaire: string;
}

export type StatutEmprunt = 'annonce' | 'partielle' | 'rembourse';

export const STATUTS_EMPRUNT: { valeur: StatutEmprunt; libelle: string }[] = [
  { valeur: 'annonce', libelle: 'Annoncé' },
  { valeur: 'partielle', libelle: 'Partiellement remboursé' },
  { valeur: 'rembourse', libelle: 'Remboursé' },
];

/**
 * Emprunt accordé à la famille.
 * montant             = somme empruntée (entrée de caisse)
 * montantRembourse    = somme déjà remboursée (sortie de caisse)
 */
export interface Emprunt extends Trace {
  preteur: string; // Nom de la personne qui prête
  montant: number; // Montant emprunté
  date: string; // Date du prêt (AAAA-MM-JJ)
  dateRemboursement?: string; // Date prévue de remboursement
  montantRembourse: number; // Montant déjà remboursé
  statut: StatutEmprunt; // État du remboursement
  mode: ModePaiement;
  reference: string;
  commentaire: string;
}

/** Libellé centralisé utilisé par postes et dépenses. */
export interface Libelle extends Trace {
  nom: string; // Nom unique du libellé
  description: string; // Description détaillée
  ordre: number; // Ordre d'affichage
}

/** Ligne de budget : montants prévisionnels pour un libellé. */
export interface BudgetLigne extends Trace {
  id_libelle: string; // Référence au libellé
  responsable: string; // Responsable du poste
  financement: string; // Source de financement prévue
  prevision: number; // Montant prévu (0 si non chiffré)
  montantPaye: number; // Montant total payé pour ce libellé
  commentaire: string; // Notes
}

/** Une cérémonie du programme des obsèques (affichée jusqu'à sa date incluse). */
export interface Ceremonie {
  date: string; // AAAA-MM-JJ
  heure: string;
  titre: string;
  lieu: string;
}

export interface Parametres {
  nomDefunt: string;
  dates: string;
  citation: string;
  texteAccueil: string;
  photoUrl: string;
  ceremonies: Ceremonie[];
  infoSalutations: string;
  telephoneContact: string;
  afficherNoms: boolean;
  afficherMontants: boolean;
  afficherJustificatifs: boolean;
  categoriesDepenses: string[];
  categoriesDons: string[];
  unites: string[];
  groupesCotisation: string[];
  sourcesFinancement: string[];
  responsables: string[];
  cloture: boolean;
  derniereSauvegarde: string;
  derniereOperation?: string;
}

export type ActionHistorique = 'creation' | 'modification' | 'annulation' | 'suppression' | 'parametres';

export interface EntreeHistorique {
  id: string;
  action: ActionHistorique;
  collection: string;
  cibleId: string;
  libelle: string;
  avant: Record<string, unknown> | null;
  apres: Record<string, unknown> | null;
  motif: string;
  auteur: string;
  auteurEmail: string;
  date: Horodatage;
}

export const PARAMETRES_PAR_DEFAUT: Parametres = {
  nomDefunt: 'Feu Eli Komlan AMEMAVOR',
  dates: '18 septembre 1953 – 20 septembre 2026',
  citation: '« L’Éternel est mon berger. » Psaume 23',
  texteAccueil:
    "Chaque franc reçu et dépensé est enregistré ici, pour que toute la famille puisse suivre l'organisation en toute transparence.",
  // Photo intégrée au site (dossier public/) : aucun besoin de Firebase Storage.
  photoUrl: '/photo-defunt.png',
  ceremonies: [
    { date: '2026-10-28', heure: '18h30', titre: 'Veillée de prières', lieu: 'EEPT Paroisse de Tokoin Ouest, Lomé (Collège Protestant)' },
    { date: '2026-10-30', heure: '20h', titre: 'Veillée de prières', lieu: 'EEPT Paroisse de Kpélé Elé' },
    { date: '2026-10-31', heure: '8h', titre: "Culte d'enterrement, suivi de l'inhumation", lieu: 'EEPT Paroisse de Kpélé Elé' },
  ],
  infoSalutations: 'Dès le mardi 20 octobre, les salutations ont lieu au domicile du défunt à Klikamé.',
  telephoneContact: '70 01 75 26',
  afficherNoms: true,
  afficherMontants: true,
  afficherJustificatifs: false,
  categoriesDepenses: [
    'Préparation du corps et prestations funéraires',
    'Transport',
    'Boissons et nourriture',
    'Location de chaises, bâches et matériel',
    'Organisation de la cérémonie',
    'Communication et impressions',
    'Hébergement',
    'Divers et imprévus',
  ],
  categoriesDons: ['Boissons', 'Nourriture', 'Matériel', 'Transport', 'Hébergement', 'Logistique', 'Autre'],
  unites: ['cartons', 'sacs', 'bouteilles', 'casiers', 'unités', 'chaises', 'bâches', 'prestations'],
  groupesCotisation: ['Enfants du défunt', 'Frères et sœurs du défunt', 'Famille paternelle', 'Famille maternelle'],
  sourcesFinancement: ['Enveloppe Papa', 'Enveloppe Guy', 'Justin', 'Caisse des obsèques'],
  responsables: ['Carole', 'Charity', 'Manassé', 'Fo Atsou', 'Vincent fils', 'Odile', 'Yawo (Elé)', 'Vincent (Elé)'],
  cloture: false,
  derniereSauvegarde: '',
};
