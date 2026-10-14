// Exports : fichier Excel (rapport) et sauvegarde complète (JSON).
import { db } from './firebase';
import { ESPACE, nomCollection, type NomCollection } from './espace';
import { synthese } from './calculs';
import { libelleMode } from './format';
import type { Contribution, Depense, Don } from '../types';

export async function exporterExcel(contributions: Contribution[], dons: Don[], depenses: Depense[], nomDefunt: string): Promise<void> {
  const XLSX = await import('xlsx');
  const s = synthese(contributions, dons, depenses);
  const genere = new Date().toLocaleString('fr-FR');
  const statut = (annule: boolean) => (annule ? 'Annulée' : '');

  const feuilleSynthese = XLSX.utils.aoa_to_sheet([
    [`Obsèques de ${nomDefunt} — Rapport financier`],
    [`Généré le ${genere}${ESPACE === 'demo' ? ' — DONNÉES FICTIVES (démonstration)' : ''}`],
    [],
    ['Indicateur', 'Valeur (FCFA)'],
    ['Contributions reçues', s.totalEncaisse],
    ['Dépenses payées', s.totalDepense],
    ['Solde disponible', s.solde],
    ['Dépenses restant à payer (hors solde)', s.resteAPayer],
    ['Promesses en attente (hors solde)', s.promessesEnAttente],
    ['Nombre de contributeurs', s.nbContributeurs],
    ['Nombre de dons en nature', s.nbDons],
    ['Nombre de dépenses', s.nbDepenses],
  ]);
  feuilleSynthese['!cols'] = [{ wch: 44 }, { wch: 18 }];

  const feuilleContrib = XLSX.utils.json_to_sheet(
    contributions.map((c) => ({
      Date: c.date,
      Contributeur: c.contributeur,
      'Montant promis/total': c.montant,
      'Montant reçu': c.montantRecu,
      Mode: libelleMode(c.mode),
      Motif: c.motif,
      Référence: c.reference,
      Commentaire: c.commentaire,
      État: statut(c.annule),
      "Motif d'annulation": c.motifAnnulation ?? '',
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
      État: statut(d.annule),
    })),
  );
  const feuilleDepenses = XLSX.utils.json_to_sheet(
    depenses.map((d) => ({
      Date: d.date,
      Désignation: d.designation,
      Catégorie: d.categorie,
      'Montant total': d.montant,
      'Montant payé': d.montantPaye,
      'Reste à payer': d.montant - d.montantPaye,
      Statut: d.statut === 'payee' ? 'Payée' : d.statut === 'partielle' ? 'Partielle' : 'Prévue',
      Bénéficiaire: d.beneficiaire,
      Mode: libelleMode(d.mode),
      Référence: d.reference,
      Justificatif: d.justificatif ? d.justificatif.nom : '',
      Commentaire: d.commentaire,
      État: statut(d.annule),
    })),
  );

  const classeur = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(classeur, feuilleSynthese, 'Synthèse');
  XLSX.utils.book_append_sheet(classeur, feuilleContrib, 'Contributions');
  XLSX.utils.book_append_sheet(classeur, feuilleDons, 'Dons en nature');
  XLSX.utils.book_append_sheet(classeur, feuilleDepenses, 'Dépenses');
  const jour = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(classeur, `rapport-obseques-${ESPACE === 'demo' ? 'DEMO-' : ''}${jour}.xlsx`);
}

/** Sauvegarde complète de toutes les collections, historique compris. */
export async function telechargerSauvegarde(): Promise<void> {
  const noms: NomCollection[] = ['contributions', 'dons', 'depenses', 'historique', 'parametres'];
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
