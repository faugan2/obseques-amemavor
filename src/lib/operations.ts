// Écritures en base — syntaxe Firebase v8.
// Chaque écriture (création, correction, annulation, paramètres) est faite dans
// un « batch » qui enregistre AUSSI une entrée d'historique. Les règles de
// sécurité refusent toute écriture qui n'est pas accompagnée de son historique.
import { auth, db, firebase, storage } from './firebase';
import { DOC_PARAMETRES, EST_DEMO, dossierJustificatifs, nomCollection } from './espace';
import type { ActionHistorique, Contribution, Depense, Don, Justificatif, Parametres } from '../types';
import { DEMO_CONTRIBUTIONS, DEMO_DEPENSES, DEMO_DONS } from './demo';
import { cleNom } from './calculs';
import initiales from './donneesInitiales.json';

export type CollectionOperation = 'contributions' | 'dons' | 'depenses' | 'postes' | 'devis' | 'emprunts';

type Donnees = Record<string, unknown>;

const horodatage = () => firebase.firestore.FieldValue.serverTimestamp();

const CHAMPS_TECHNIQUES = new Set(['id', 'creePar', 'creeLe', 'modifieLe', 'derniereOperation']);

/** Ne garde que les champs qui ont réellement changé. */
export function differences(avant: Donnees, apres: Donnees): { avant: Donnees; apres: Donnees } {
  const a: Donnees = {};
  const b: Donnees = {};
  for (const cle of Object.keys(apres)) {
    if (CHAMPS_TECHNIQUES.has(cle)) continue;
    if (JSON.stringify(avant[cle] ?? null) !== JSON.stringify(apres[cle] ?? null)) {
      a[cle] = avant[cle] ?? null;
      b[cle] = apres[cle] ?? null;
    }
  }
  return { avant: a, apres: b };
}

function utilisateur() {
  const u = auth.currentUser;
  if (!u) throw new Error('Vous devez être connecté pour enregistrer une opération.');
  return u;
}

function entreeHistorique(
  action: ActionHistorique,
  collection: string,
  cibleId: string,
  libelle: string,
  avant: Donnees | null,
  apres: Donnees | null,
  motif: string,
) {
  const u = utilisateur();
  return {
    action,
    collection,
    cibleId,
    libelle,
    avant,
    apres,
    motif,
    auteur: u.uid,
    auteurEmail: u.email ?? '',
    date: horodatage(),
  };
}

/** Réserve un identifiant (utile pour téléverser un justificatif avant l'enregistrement). */
export function nouvelIdentifiant(collection: CollectionOperation): string {
  return db.collection(nomCollection(collection)).doc().id;
}

export async function creer(
  collection: CollectionOperation,
  donnees: Donnees,
  libelle: string,
  idImpose?: string,
): Promise<string> {
  const u = utilisateur();
  const col = db.collection(nomCollection(collection));
  const ref = idImpose ? col.doc(idImpose) : col.doc();
  const refHist = db.collection(nomCollection('historique')).doc();
  const batch = db.batch();
  batch.set(ref, {
    ...donnees,
    annule: false,
    creePar: u.uid,
    creeLe: horodatage(),
    modifieLe: horodatage(),
    derniereOperation: refHist.id,
  });
  batch.set(refHist, entreeHistorique('creation', collection, ref.id, libelle, null, donnees, ''));
  await batch.commit();
  return ref.id;
}

export async function modifier(
  collection: CollectionOperation,
  id: string,
  avant: Donnees,
  nouvelles: Donnees,
  libelle: string,
  motif: string,
): Promise<void> {
  const diff = differences(avant, nouvelles);
  if (Object.keys(diff.apres).length === 0) return;
  const ref = db.collection(nomCollection(collection)).doc(id);
  const refHist = db.collection(nomCollection('historique')).doc();
  const batch = db.batch();
  batch.update(ref, { ...diff.apres, modifieLe: horodatage(), derniereOperation: refHist.id });
  batch.set(refHist, entreeHistorique('modification', collection, id, libelle, diff.avant, diff.apres, motif));
  await batch.commit();
}

export async function annuler(collection: CollectionOperation, id: string, libelle: string, motif: string): Promise<void> {
  if (motif.trim().length < 3) throw new Error("Indiquez le motif de l'annulation.");
  const ref = db.collection(nomCollection(collection)).doc(id);
  const refHist = db.collection(nomCollection('historique')).doc();
  const batch = db.batch();
  batch.update(ref, {
    annule: true,
    motifAnnulation: motif.trim(),
    modifieLe: horodatage(),
    derniereOperation: refHist.id,
  });
  batch.set(
    refHist,
    entreeHistorique('annulation', collection, id, libelle, { annule: false }, { annule: true }, motif.trim()),
  );
  await batch.commit();
}

/**
 * Suppression définitive demandée par l'administrateur.
 * Une copie complète de l'enregistrement est conservée dans l'historique
 * (entrée « sup_<id> »), avec le motif : la trace n'est jamais perdue.
 */
export async function supprimer(
  collection: CollectionOperation,
  id: string,
  libelle: string,
  donnees: Donnees,
  motif: string,
): Promise<void> {
  if (motif.trim().length < 3) throw new Error('Indiquez le motif de la suppression.');
  const copie: Donnees = {};
  for (const [cle, valeur] of Object.entries(donnees)) {
    if (cle === 'id') continue;
    copie[cle] = valeur && typeof valeur === 'object' && 'toDate' in valeur ? (valeur as { toDate: () => Date }).toDate().toISOString() : valeur;
  }
  const ref = db.collection(nomCollection(collection)).doc(id);
  const refHist = db.collection(nomCollection('historique')).doc(`sup_${id}`);
  const batch = db.batch();
  batch.delete(ref);
  batch.set(refHist, entreeHistorique('suppression', collection, id, libelle, copie, null, motif.trim()));
  await batch.commit();
}

export async function enregistrerParametres(avant: Parametres, apres: Parametres, motif = ''): Promise<void> {
  const { derniereOperation: _ignore, ...propres } = apres;
  void _ignore;
  const diff = differences(avant as unknown as Donnees, propres as unknown as Donnees);
  const ref = db.collection(nomCollection('parametres')).doc(DOC_PARAMETRES);
  const refHist = db.collection(nomCollection('historique')).doc();
  const batch = db.batch();
  batch.set(ref, { ...propres, derniereOperation: refHist.id });
  batch.set(
    refHist,
    entreeHistorique('parametres', 'parametres', DOC_PARAMETRES, 'Paramètres', diff.avant, diff.apres, motif),
  );
  await batch.commit();
}

const TYPES_AUTORISES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
const TAILLE_MAX = 10 * 1024 * 1024;

export async function televerserJustificatif(depenseId: string, fichier: File): Promise<Justificatif> {
  if (!TYPES_AUTORISES.includes(fichier.type)) {
    throw new Error('Format non accepté. Utilisez une photo (JPG, PNG) ou un PDF.');
  }
  if (fichier.size > TAILLE_MAX) throw new Error('Le fichier dépasse 10 Mo.');
  const nomPropre = fichier.name.replace(/[^\w.-]+/g, '_').slice(-80);
  const chemin = `${dossierJustificatifs()}/${depenseId}/${Date.now()}_${nomPropre}`;
  await storage.ref(chemin).put(fichier, { contentType: fichier.type });
  return { chemin, nom: fichier.name, type: fichier.type };
}

export async function lienJustificatif(j: Justificatif): Promise<string> {
  return storage.ref(j.chemin).getDownloadURL();
}

export async function televerserPhoto(fichier: File): Promise<string> {
  if (!fichier.type.startsWith('image/')) throw new Error('Choisissez une image.');
  if (fichier.size > 5 * 1024 * 1024) throw new Error("L'image dépasse 5 Mo.");
  const ref = storage.ref(`ame/${EST_DEMO ? 'demo' : 'reel'}/public/photo_${Date.now()}`);
  await ref.put(fichier, { contentType: fichier.type });
  return ref.getDownloadURL();
}

/** Charge les données fictives — uniquement dans l'espace de démonstration. */
export async function chargerDonneesDemo(): Promise<void> {
  if (!EST_DEMO) throw new Error("Les données de démonstration ne peuvent pas être chargées dans l'espace réel.");
  for (const c of DEMO_CONTRIBUTIONS) await creer('contributions', c as Partial<Contribution> as Donnees, `Participation · ${c.contributeur}`);
  for (const d of DEMO_DONS) await creer('dons', d as Partial<Don> as Donnees, `Don · ${d.donateur}`);
  for (const d of DEMO_DEPENSES) await creer('depenses', d as Partial<Depense> as Donnees, `Dépense · ${d.designation}`);
}

/**
 * Importe les données des fichiers Excel remis par le DG (budget, dépenses courantes,
 * participations). Chaque élément est créé avec son entrée d'historique, comme une saisie normale.
 * Les postes gardent leur identifiant (poste-01…) pour que les dépenses s'y rattachent.
 */
export async function importerDonneesExcel(
  dejaPresents: { postes: string[] },
  progression: (fait: number, total: number) => void,
): Promise<void> {
  const total = initiales.postes.length + initiales.depenses.length + initiales.contributions.length;
  let fait = 0;
  const avancer = () => progression(++fait, total);
  for (const { id, ...p } of initiales.postes) {
    if (!dejaPresents.postes.includes(id)) await creer('postes', p, `Poste · ${p.libelle} (import Excel)`, id);
    avancer();
  }
  for (const d of initiales.depenses) {
    await creer('depenses', d as Donnees, `Dépense · ${d.designation} (import Excel)`);
    avancer();
  }
  for (const c of initiales.contributions) {
    await creer('contributions', { ...c, contributeurCle: cleNom(c.contributeur) }, `Participation · ${c.contributeur} (import Excel)`);
    avancer();
  }
}
