// Exports : fichier Excel (rapport) et sauvegarde complète (JSON).
import { db } from './firebase';
import { ESPACE, nomCollection, type NomCollection } from './espace';
import { budget, budgetDepuisLignes, cotisationsParGroupe, synthese, typeDe } from './calculs';
import { libelleMode } from './format';
import type { Contribution, Depense, Devis, Don, Poste } from '../types';

export async function exporterExcel(
  contributions: Contribution[],
  dons: Don[],
  depenses: Depense[],
  postes: Poste[], // Garder pour compatibilité backwards
  nomDefunt: string,
  devis: Devis[] = [],
  budgetLignes?: any[], // Nouvelles données: libelles du budget
  libelles?: any[], // Noms des libelles
): Promise<void> {
  const XLSX = await import('xlsx');
  const s = synthese(contributions, dons, depenses);
  // Utiliser budgetLignes si disponibles, sinon utiliser l'ancien budget()
  const b = budgetLignes && libelles ? budgetDepuisLignes(budgetLignes, depenses) : budget(postes, depenses, devis);
  const genere = new Date().toLocaleString('fr-FR');
  const etat = (annule: boolean) => (annule ? 'Annulée' : '');
  const actives = <T extends { annule?: boolean }>(l: T[]) => l.filter((x) => !x.annule);

  // Feuille 1 : point global, comme dans les fichiers de la famille.
  const feuillePoint = XLSX.utils.aoa_to_sheet([
    [`Obsèques de ${nomDefunt} — Point global`],
    [`Généré le ${genere}${ESPACE === 'demo' ? ' — DONNÉES FICTIVES (démonstration)' : ''}`],
    [],
    ['Indicateur', 'FCFA'],
    ['Cotisations famille', s.totalCotisations],
    ['Participations', s.totalParticipations],
    ['Dépenses obsèques', s.totalDepense],
    ['Reliquat', s.solde],
    [],
    ['Budget prévu', b.totalPrevision],
    ['Budget engagé', b.totalEngage],
    ['Reste à payer sur dépenses engagées', s.resteAPayer],
    ['Cotisations encore attendues', s.cotisationsAttendues],
    ['Participations annoncées non reçues', s.promessesEnAttente],
  ]);
  feuillePoint['!cols'] = [{ wch: 40 }, { wch: 16 }];

  const feuilleBudget = XLSX.utils.json_to_sheet([
    ...b.lignes.map((l) => ({
      'Postes de dépenses': l.poste.libelle,
      Prévisions: l.prevision || '',
      'Dépenses engagées': l.engage || '',
      'Dépenses réelles (payées)': l.realise || '',
      Écart: l.prevision ? l.ecart : '',
      Financement: l.poste.financement,
      Responsables: l.poste.responsable,
      Commentaires: l.poste.commentaire,
    })),
    { 'Postes de dépenses': 'TOTAL', Prévisions: b.totalPrevision, 'Dépenses engagées': b.totalEngage, 'Dépenses réelles (payées)': b.totalRealise },
  ]);
  feuilleBudget['!cols'] = [{ wch: 55 }, { wch: 13 }, { wch: 16 }, { wch: 22 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 30 }];

  const groupes = cotisationsParGroupe(contributions, []);
  const feuilleCotisations = XLSX.utils.json_to_sheet(
    groupes.flatMap((g) => [
      ...actives(g.membres).map((c) => ({ Groupe: g.groupe, Nom: c.contributeur, 'Quote-part': c.montant, Versé: c.montantRecu, Reste: c.montant - c.montantRecu, Date: c.date })),
      { Groupe: `Sous-total ${g.groupe}`, Nom: '', 'Quote-part': g.attendu, Versé: g.verse, Reste: g.attendu - g.verse, Date: '' },
    ]),
  );

  const feuilleParticipations = XLSX.utils.json_to_sheet(
    contributions
      .filter((c) => typeDe(c) === 'participation')
      .map((c) => ({
        Date: c.date,
        Nom: c.contributeur,
        'Montant annoncé': c.montant,
        'Montant reçu': c.montantRecu,
        Mode: libelleMode(c.mode),
        Motif: c.motif,
        Référence: c.reference,
        Commentaire: c.commentaire,
        État: etat(c.annule),
      })),
  );

  const feuilleDons = XLSX.utils.json_to_sheet(
    dons.map((d) => ({
      Date: d.date,
      Donateur: d.donateur,
      Catégorie: d.categorie,
      Nature: d.nature,
      Quantité: d.quantite,
      Unité: d.unite,
      Réception: d.statut === 'recu' ? 'Reçu' : d.statut === 'partiel' ? 'Partiellement reçu' : 'Annoncé',
      'Valeur estimée (information)': d.valeurEstimee ?? '',
      Observations: d.observations,
      État: etat(d.annule),
    })),
  );

  const feuilleDepenses = XLSX.utils.json_to_sheet(
    depenses.map((d) => ({
      Date: d.date,
      Désignation: d.designation,
      Poste: d.categorie,
      Responsable: d.responsable ?? '',
      Financement: d.financement ?? '',
      'Montant total': d.montant,
      'Montant payé': d.montantPaye,
      'Reste à payer': d.montant - d.montantPaye,
      Statut: d.statut === 'payee' ? 'Payée' : d.statut === 'partielle' ? 'Partielle' : 'Prévue',
      Bénéficiaire: d.beneficiaire,
      Mode: libelleMode(d.mode),
      Référence: d.reference,
      Commentaire: d.commentaire,
      État: etat(d.annule),
    })),
  );

  const nomPoste = (id: string) => postes.find((p) => p.id === id)?.libelle ?? '';
  const feuilleDevis = XLSX.utils.json_to_sheet(
    devis.map((d) => ({
      Date: d.date,
      Prestataire: d.prestataire,
      Poste: nomPoste(d.posteId),
      Objet: d.objet,
      Montant: d.montant,
      Décision: d.statut === 'retenu' ? 'Retenu' : d.statut === 'refuse' ? 'Non retenu' : 'À étudier',
      Référence: d.reference,
      Commentaire: d.commentaire,
    })),
  );

  const classeur = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(classeur, feuillePoint, 'Point global');
  XLSX.utils.book_append_sheet(classeur, feuilleBudget, 'Budget');
  XLSX.utils.book_append_sheet(classeur, feuilleCotisations, 'Cotisations');
  XLSX.utils.book_append_sheet(classeur, feuilleParticipations, 'Participations');
  XLSX.utils.book_append_sheet(classeur, feuilleDons, 'Participations en nature');
  XLSX.utils.book_append_sheet(classeur, feuilleDepenses, 'Dépenses');
  XLSX.utils.book_append_sheet(classeur, feuilleDevis, 'Devis');
  const jour = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(classeur, `rapport-obseques-${ESPACE === 'demo' ? 'DEMO-' : ''}${jour}.xlsx`);
}

/** Sauvegarde complète de toutes les collections, historique compris. */
export async function telechargerSauvegarde(): Promise<void> {
  const noms: NomCollection[] = ['contributions', 'dons', 'depenses', 'postes', 'devis', 'historique', 'parametres'];
  const contenu: Record<string, unknown> = { espace: ESPACE, exporteLe: new Date().toISOString() };
  for (const n of noms) {
    const snap = await db.collection(nomCollection(n)).get();
    contenu[nomCollection(n)] = snap.docs.map((d) => {
      const donnees = d.data();
      for (const [k, v] of Object.entries(donnees)) {
        if (v && typeof v === 'object' && 'toDate' in v) donnees[k] = (v as { toDate: () => Date }).toDate().toISOString();
      }
      return { id: d.id, ...donnees };
    });
  }
  const blob = new Blob([JSON.stringify(contenu, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sauvegarde-obseques-${ESPACE}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
