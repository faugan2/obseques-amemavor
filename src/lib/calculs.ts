// Règles de calcul. Fonctions pures : aucun total n'est jamais saisi à la main.
import type { Contribution, Depense, Devis, Don, Emprunt, Poste, StatutDepense, TypeContribution } from '../types';

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

/** Les anciens enregistrements sans type sont des participations. */
export function typeDe(c: Pick<Contribution, 'type'>): TypeContribution {
  return c.type === 'cotisation' ? 'cotisation' : 'participation';
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

const actives = <T extends { annule?: boolean }>(liste: T[]) => liste.filter((x) => !x.annule);
const somme = <T,>(liste: T[], f: (x: T) => number) => liste.reduce((s, x) => s + f(x), 0);

export interface Synthese {
  /** Cotisations réellement versées. */
  totalCotisations: number;
  /** Quotes-parts restant à verser. */
  cotisationsAttendues: number;
  nbCotisants: number;
  /** Participations en argent réellement reçues. */
  totalParticipations: number;
  /** Participations annoncées mais pas encore reçues. */
  promessesEnAttente: number;
  nbPromesses: number;
  /** Emprunts reçus. */
  totalEmprunts: number;
  /** Montant des emprunts déjà remboursés. */
  totalEmpruntsRembourses: number;
  /** Emprunts uniquement (Fond de roulement). */
  totalEncaisse: number;
  totalDepense: number;
  resteAPayer: number;
  nbDepensesNonSoldees: number;
  solde: number;
  nbContributeurs: number;
  nbParticipants: number;
  nbContributions: number;
  nbDons: number;
  nbDepenses: number;
  nbEmprunts: number;
  partUtilisee: number; // 0..1
}

export function synthese(contributions: Contribution[], dons: Don[], depenses: Depense[], emprunts: Emprunt[] = []): Synthese {
  const c = actives(contributions);
  const cot = c.filter((x) => typeDe(x) === 'cotisation');
  const par = c.filter((x) => typeDe(x) === 'participation');
  const d = actives(depenses);
  const e = actives(emprunts);

  const totalCotisations = somme(cot, (x) => x.montantRecu);
  const totalParticipations = somme(par, (x) => x.montantRecu);
  const totalEmprunts = somme(e, (x) => x.montant);
  const totalEmpruntsRembourses = somme(e, (x) => x.montantRembourse);
  const totalEncaisse = totalEmprunts;
  const totalDepense = somme(d, (x) => x.montantPaye);

  const distincts = (l: Contribution[]) => new Set(l.filter((x) => x.montantRecu > 0).map((x) => x.contributeurCle || cleNom(x.contributeur))).size;

  return {
    totalCotisations,
    cotisationsAttendues: somme(cot, (x) => Math.max(0, x.montant - x.montantRecu)),
    nbCotisants: distincts(cot),
    totalParticipations,
    promessesEnAttente: somme(par, (x) => Math.max(0, x.montant - x.montantRecu)),
    nbPromesses: par.filter((x) => x.montant > x.montantRecu).length,
    totalEmprunts,
    totalEmpruntsRembourses,
    totalEncaisse,
    totalDepense,
    resteAPayer: somme(d, (x) => Math.max(0, x.montant - x.montantPaye)),
    nbDepensesNonSoldees: d.filter((x) => x.montant > x.montantPaye).length,
    solde: totalEncaisse - totalDepense - totalEmpruntsRembourses,
    nbContributeurs: distincts(c),
    nbParticipants: distincts(par),
    nbContributions: c.length,
    nbDons: actives(dons).length,
    nbDepenses: d.length,
    nbEmprunts: e.length,
    partUtilisee: totalEncaisse > 0 ? Math.min(1, totalDepense / totalEncaisse) : 0,
  };
}

// ---------------------------------------------------------------- Budget

export interface LigneBudget {
  poste: Poste;
  prevision: number;
  /** Somme réellement payée sur les dépenses du poste. */
  realise: number;
  /** Montant total des dépenses du poste (payé + reste à payer). */
  engage: number;
  resteAPayer: number;
  /** prévision − engagé (négatif = dépassement). */
  ecart: number;
  nbDepenses: number;
  /** Montant du devis retenu, s'il y en a un. */
  devisRetenu: number | null;
}

export interface Budget {
  lignes: LigneBudget[];
  totalPrevision: number;
  totalRealise: number;
  totalEngage: number;
  /** Dépenses rattachées à aucun poste existant. */
  horsBudget: { realise: number; engage: number; nb: number };
  nbPostesNonChiffres: number;
  nbDepassements: number;
}

/** Calcule les stats du budget depuis les budgetLignes (nouvelle approche).
 * @param budgetLignes Lignes de budget avec id_libelle, responsable, financement, prevision, montantPaye
 * @param depenses Toutes les dépenses liées aux libellés via id_libelle
 */
export function budgetDepuisLignes(budgetLignes: any[], depenses: Depense[], libelles: any[] = []): Budget {
  // Créer une map des libelles par nom pour la migration
  const libellesParNom = new Map(libelles.map((l: any) => [l.nom, l]));

  // Migration: ajouter id_libelle aux dépenses qui ne l'ont pas
  const dAvecLibelle = depenses.map((dep) => {
    if (!dep.id_libelle && dep.categorie) {
      const libelle = libellesParNom.get(dep.categorie);
      return { ...dep, id_libelle: libelle?.id_libelle || libelle?.id };
    }
    return dep;
  });

  const d = actives(dAvecLibelle);
  const libellesMap = new Map(libelles.map((l: any) => [l.id_libelle || l.id, l]));

  const lignes: LigneBudget[] = budgetLignes.map((bl) => {
    // Récupérer les dépenses liées à ce libellé via id_libelle
    const liees = d.filter((x) => x.id_libelle === bl.id_libelle);
    const realise = somme(liees, (x) => x.montantPaye);
    const engage = somme(liees, (x) => x.montant);

    // Chercher le nom du libellé dans la collection libelles
    const libelleData = libellesMap.get(bl.id_libelle);
    const nomFinal = libelleData?.nom || bl.nom || '';


    return {
      poste: {
        id: bl.id_libelle,
        libelle: nomFinal,
        prevision: bl.prevision,
        responsable: bl.responsable,
        financement: bl.financement,
        commentaire: bl.commentaire,
        ordre: 0,
      } as Poste,
      prevision: bl.prevision,
      realise,
      engage,
      resteAPayer: engage - realise,
      ecart: (bl.prevision || 0) - engage,
      nbDepenses: liees.length,
      devisRetenu: null,
    };
  });

  const hors = d.filter((x) => !x.id_libelle);
  return {
    lignes,
    totalPrevision: somme(lignes, (l) => l.prevision),
    totalRealise: somme(lignes, (l) => l.realise) + somme(hors, (x) => x.montantPaye),
    totalEngage: somme(lignes, (l) => l.engage) + somme(hors, (x) => x.montant),
    horsBudget: { realise: somme(hors, (x) => x.montantPaye), engage: somme(hors, (x) => x.montant), nb: hors.length },
    nbPostesNonChiffres: lignes.filter((l) => l.prevision === 0).length,
    nbDepassements: lignes.filter((l) => l.prevision > 0 && l.engage > l.prevision).length,
  };
}

export function budget(postes: Poste[], depenses: Depense[], devis: Devis[] = []): Budget {
  const d = actives(depenses);
  const ids = new Set(postes.map((p) => p.id));
  const lignes = [...actives(postes)]
    .sort((a, b) => a.ordre - b.ordre || a.libelle.localeCompare(b.libelle))
    .map<LigneBudget>((poste) => {
      const liees = d.filter((x) => x.posteId === poste.id);
      const realise = somme(liees, (x) => x.montantPaye);
      const engage = somme(liees, (x) => x.montant);
      const retenu = actives(devis).find((v) => v.posteId === poste.id && v.statut === 'retenu');
      return {
        poste,
        prevision: poste.prevision,
        realise,
        engage,
        resteAPayer: engage - realise,
        ecart: poste.prevision - engage,
        nbDepenses: liees.length,
        devisRetenu: retenu ? retenu.montant : null,
      };
    });
  const hors = d.filter((x) => !x.posteId || !ids.has(x.posteId));
  return {
    lignes,
    totalPrevision: somme(lignes, (l) => l.prevision),
    totalRealise: somme(lignes, (l) => l.realise) + somme(hors, (x) => x.montantPaye),
    totalEngage: somme(lignes, (l) => l.engage) + somme(hors, (x) => x.montant),
    horsBudget: { realise: somme(hors, (x) => x.montantPaye), engage: somme(hors, (x) => x.montant), nb: hors.length },
    nbPostesNonChiffres: lignes.filter((l) => l.prevision === 0).length,
    nbDepassements: lignes.filter((l) => l.prevision > 0 && l.engage > l.prevision).length,
  };
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

export interface GroupeCotisation {
  groupe: string;
  attendu: number;
  verse: number;
  membres: Contribution[];
}

/** Cotisations regroupées par groupe familial, dans l'ordre des Paramètres. */
export function cotisationsParGroupe(contributions: Contribution[], ordreGroupes: string[]): GroupeCotisation[] {
  const cot = contributions.filter((c) => typeDe(c) === 'cotisation');
  const noms = [...ordreGroupes, ...new Set(cot.map((c) => c.groupe || 'Autres').filter((g) => !ordreGroupes.includes(g)))];
  return noms.map((groupe) => {
    const membres = cot
      .filter((c) => (c.groupe || 'Autres') === groupe)
      .sort((a, b) => a.contributeur.localeCompare(b.contributeur));
    const act = actives(membres);
    return { groupe, attendu: somme(act, (c) => c.montant), verse: somme(act, (c) => c.montantRecu), membres };
  });
}

export type TypeOperation = 'cotisation' | 'participation' | 'don' | 'depense';

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

/** Fusionne toutes les opérations, triées de la plus récente à la plus ancienne. */
export function toutesOperations(contributions: Contribution[], dons: Don[], depenses: Depense[]): Operation[] {
  const ops: Operation[] = [
    ...contributions.map<Operation>((c) => ({
      type: typeDe(c),
      id: c.id,
      date: c.date,
      ordre: ms(c.creeLe),
      libelle: c.contributeur,
      detail: typeDe(c) === 'cotisation' ? c.groupe || '' : c.motif,
      categorie: typeDe(c) === 'cotisation' ? c.groupe || 'Cotisation' : c.motif,
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
      detail: d.responsable || d.beneficiaire,
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
