// Règles de calcul (section 8 du cahier des charges).
// Fonctions pures : aucun total n'est jamais saisi à la main.
import type { Contribution, Depense, Don, StatutDepense } from '../types';

/** Normalise un nom pour reconnaître la même personne malgré la casse, les accents ou l'ordre des mots. */
export function cleNom(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .sort()
    .join(' ');
}

export function statutDepense(montant: number, montantPaye: number): StatutDepense {
  if (montantPaye <= 0) return 'prevue';
  if (montantPaye >= montant) return 'payee';
  return 'partielle';
}

export type StatutContribution = 'recue' | 'partielle' | 'promise';

export function statutContribution(c: Pick<Contribution, 'montant' | 'montantRecu'>): StatutContribution {
  if (c.montantRecu <= 0) return 'promise';
  if (c.montantRecu >= c.montant) return 'recue';
  return 'partielle';
}

const actives = <T extends { annule: boolean }>(liste: T[]) => liste.filter((x) => !x.annule);

export interface Synthese {
  totalEncaisse: number;
  promessesEnAttente: number;
  nbPromesses: number;
  totalDepense: number;
  resteAPayer: number;
  nbDepensesNonSoldees: number;
  solde: number;
  nbContributeurs: number;
  nbContributions: number;
  nbDons: number;
  nbDepenses: number;
  partUtilisee: number; // 0..1
}

export function synthese(contributions: Contribution[], dons: Don[], depenses: Depense[]): Synthese {
  const c = actives(contributions);
  const d = actives(depenses);

  const totalEncaisse = c.reduce((s, x) => s + x.montantRecu, 0);
  const promessesEnAttente = c.reduce((s, x) => s + Math.max(0, x.montant - x.montantRecu), 0);
  const nbPromesses = c.filter((x) => x.montant > x.montantRecu).length;

  const totalDepense = d.reduce((s, x) => s + x.montantPaye, 0);
  const resteAPayer = d.reduce((s, x) => s + Math.max(0, x.montant - x.montantPaye), 0);
  const nbDepensesNonSoldees = d.filter((x) => x.montant > x.montantPaye).length;

  const contributeurs = new Set(c.filter((x) => x.montantRecu > 0).map((x) => x.contributeurCle || cleNom(x.contributeur)));

  return {
    totalEncaisse,
    promessesEnAttente,
    nbPromesses,
    totalDepense,
    resteAPayer,
    nbDepensesNonSoldees,
    solde: totalEncaisse - totalDepense,
    nbContributeurs: contributeurs.size,
    nbContributions: c.length,
    nbDons: actives(dons).length,
    nbDepenses: d.length,
    partUtilisee: totalEncaisse > 0 ? Math.min(1, totalDepense / totalEncaisse) : 0,
  };
}

export interface LigneCategorie {
  categorie: string;
  paye: number;
  reste: number;
}

export function depensesParCategorie(depenses: Depense[]): LigneCategorie[] {
  const map = new Map<string, LigneCategorie>();
  for (const d of actives(depenses)) {
    const l = map.get(d.categorie) ?? { categorie: d.categorie, paye: 0, reste: 0 };
    l.paye += d.montantPaye;
    l.reste += Math.max(0, d.montant - d.montantPaye);
    map.set(d.categorie, l);
  }
  return [...map.values()].sort((a, b) => b.paye + b.reste - (a.paye + a.reste));
}

export interface ResumeDon {
  categorie: string;
  unite: string;
  quantite: number;
}

/** Quantités de dons regroupées par catégorie et unité (ex. « 10 cartons de boissons »). */
export function donsParCategorie(dons: Don[]): ResumeDon[] {
  const map = new Map<string, ResumeDon>();
  for (const d of actives(dons)) {
    const cle = `${d.categorie}|${d.unite}`;
    const l = map.get(cle) ?? { categorie: d.categorie, unite: d.unite, quantite: 0 };
    l.quantite += d.quantite;
    map.set(cle, l);
  }
  return [...map.values()];
}

export type TypeOperation = 'contribution' | 'don' | 'depense';

export interface Operation {
  type: TypeOperation;
  id: string;
  date: string;
  ordre: number;
  libelle: string;
  detail: string;
  categorie: string;
  montant: number | null;
  annule: boolean;
  source: Contribution | Don | Depense;
}

function ms(t: { toMillis?: () => number } | null | undefined): number {
  return t && typeof t.toMillis === 'function' ? t.toMillis() : 0;
}

/** Fusionne les trois types d'opérations, triées de la plus récente à la plus ancienne. */
export function toutesOperations(contributions: Contribution[], dons: Don[], depenses: Depense[]): Operation[] {
  const ops: Operation[] = [
    ...contributions.map<Operation>((c) => ({
      type: 'contribution',
      id: c.id,
      date: c.date,
      ordre: ms(c.creeLe),
      libelle: c.contributeur,
      detail: c.motif,
      categorie: c.motif,
      montant: c.montantRecu,
      annule: c.annule,
      source: c,
    })),
    ...dons.map<Operation>((d) => ({
      type: 'don',
      id: d.id,
      date: d.date,
      ordre: ms(d.creeLe),
      libelle: `${d.quantite} ${d.unite} · ${d.nature}`,
      detail: d.donateur,
      categorie: d.categorie,
      montant: null,
      annule: d.annule,
      source: d,
    })),
    ...depenses.map<Operation>((d) => ({
      type: 'depense',
      id: d.id,
      date: d.date,
      ordre: ms(d.creeLe),
      libelle: d.designation,
      detail: d.beneficiaire,
      categorie: d.categorie,
      montant: d.montantPaye,
      annule: d.annule,
      source: d,
    })),
  ];
  return ops.sort((a, b) => (a.date === b.date ? b.ordre - a.ordre : a.date < b.date ? 1 : -1));
}

/** Cérémonies encore à venir (une cérémonie reste affichée toute la journée de sa date). */
export function ceremoniesAVenir<T extends { date: string }>(ceremonies: T[], aujourdhui: string): T[] {
  return ceremonies.filter((c) => c.date >= aujourdhui).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** Date de la dernière écriture, toutes opérations confondues. */
export function derniereMiseAJour(listes: { modifieLe: { toMillis?: () => number } | null }[][]): number {
  let max = 0;
  for (const liste of listes) for (const x of liste) max = Math.max(max, ms(x.modifieLe));
  return max;
}
