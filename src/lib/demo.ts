// Données de démonstration (section 11) — FICTIVES.
// Elles ne sont chargées que dans l'espace « demo » (collections ame_demo_*).
import type { Contribution, Depense, Don } from '../types';
import { cleNom } from './calculs';

type SansTrace<T> = Omit<T, 'id' | 'annule' | 'creePar' | 'creeLe' | 'modifieLe' | 'derniereOperation' | 'motifAnnulation'>;

export const DEMO_CONTRIBUTIONS: SansTrace<Contribution>[] = [
  {
    contributeur: 'Kodjo Exemple',
    contributeurCle: cleNom('Kodjo Exemple'),
    date: '2026-10-10',
    montant: 50000,
    montantRecu: 50000,
    mode: 'mobile_money',
    motif: 'Contribution générale',
    reference: 'DEMO-001',
    commentaire: 'Donnée fictive de démonstration',
  },
  {
    contributeur: 'Ama Exemple',
    contributeurCle: cleNom('Ama Exemple'),
    date: '2026-10-11',
    montant: 25000,
    montantRecu: 25000,
    mode: 'especes',
    motif: 'Contribution générale',
    reference: '',
    commentaire: 'Donnée fictive de démonstration',
  },
];

export const DEMO_DONS: SansTrace<Don>[] = [
  {
    donateur: 'Yao Exemple',
    donateurCle: cleNom('Yao Exemple'),
    date: '2026-10-12',
    categorie: 'Boissons',
    nature: 'Boissons sucrées assorties',
    quantite: 10,
    unite: 'cartons',
    statut: 'recu',
    valeurEstimee: null,
    observations: 'Donnée fictive de démonstration',
  },
];

export const DEMO_DEPENSES: SansTrace<Depense>[] = [
  {
    date: '2026-10-12',
    designation: 'Achat de nourriture',
    categorie: 'Boissons et nourriture',
    montant: 30000,
    montantPaye: 30000,
    statut: 'payee',
    beneficiaire: 'Marché Exemple',
    mode: 'especes',
    reference: 'DEMO-REÇU-001',
    justificatif: null,
    commentaire: 'Donnée fictive de démonstration',
  },
  {
    date: '2026-10-13',
    designation: 'Location de chaises',
    categorie: 'Location de chaises, bâches et matériel',
    montant: 20000,
    montantPaye: 0,
    statut: 'prevue',
    beneficiaire: 'Location Exemple',
    mode: 'especes',
    reference: '',
    justificatif: null,
    commentaire: 'Donnée fictive de démonstration',
  },
];
