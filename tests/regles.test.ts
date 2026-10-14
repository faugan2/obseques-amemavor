// Tests des règles de sécurité contre l'émulateur Firebase.
// Lancer avec : npm run test:regles
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

let env: RulesTestEnvironment;
const ts = () => firebase.firestore.FieldValue.serverTimestamp();

const contribution = {
  contributeur: 'Kodjo Exemple',
  contributeurCle: 'exemple kodjo',
  date: '2026-10-10',
  montant: 50000,
  montantRecu: 50000,
  mode: 'mobile_money',
  motif: '',
  reference: '',
  commentaire: '',
};

const depense = {
  date: '2026-10-12',
  designation: 'Achat de nourriture',
  categorie: 'Boissons et nourriture',
  montant: 30000,
  montantPaye: 30000,
  statut: 'payee',
  beneficiaire: '',
  mode: 'especes',
  reference: '',
  justificatif: null,
  commentaire: '',
};

type Db = firebase.firestore.Firestore;

function hist(uid: string, collection: string, cibleId: string, action = 'creation', motif = '') {
  return { action, collection, cibleId, libelle: 'test', avant: null, apres: null, motif, auteur: uid, auteurEmail: '', date: ts() };
}

/** Création accompagnée de son historique, comme le fait l'application. */
async function creer(db: Db, coll: string, id: string, donnees: object, uid = 'admin', avecHistorique = true) {
  const prefixe = coll.startsWith('ame_demo_') ? 'ame_demo_' : 'ame_';
  const type = coll.replace(prefixe, '');
  const refHist = db.collection(`${prefixe}historique`).doc();
  const batch = db.batch();
  batch.set(db.collection(coll).doc(id), {
    ...donnees,
    annule: false,
    creePar: uid,
    creeLe: ts(),
    modifieLe: ts(),
    derniereOperation: refHist.id,
  });
  if (avecHistorique) batch.set(refHist, hist(uid, type, id));
  return batch.commit();
}

async function modifier(db: Db, coll: string, id: string, champs: object, action = 'modification', motif = '') {
  const type = coll.replace('ame_', '');
  const refHist = db.collection('ame_historique').doc();
  const batch = db.batch();
  batch.update(db.collection(coll).doc(id), { ...champs, modifieLe: ts(), derniereOperation: refHist.id });
  batch.set(refHist, hist('admin', type, id, action, motif));
  return batch.commit();
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-obseques',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
    storage: { rules: readFileSync('storage.rules', 'utf8'), host: '127.0.0.1', port: 9199 },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection('ame_admins').doc('admin').set({ role: 'admin' });
  });
});

const admin = () => env.authenticatedContext('admin').firestore() as unknown as Db;
const intrus = () => env.authenticatedContext('intrus').firestore() as unknown as Db;
const visiteur = () => env.unauthenticatedContext().firestore() as unknown as Db;

describe('Espace familial (sans connexion)', () => {
  it('peut lire les contributions, dons, dépenses et paramètres', async () => {
    await assertSucceeds(visiteur().collection('ame_contributions').get());
    await assertSucceeds(visiteur().collection('ame_dons').get());
    await assertSucceeds(visiteur().collection('ame_depenses').get());
    await assertSucceeds(visiteur().collection('ame_parametres').doc('general').get());
  });
  it("ne peut pas lire l'historique", async () => {
    await assertFails(visiteur().collection('ame_historique').get());
  });
  it('ne peut rien écrire', async () => {
    await assertFails(creer(visiteur(), 'ame_contributions', 'c1', contribution, 'admin'));
  });
  it('ne peut pas lire les autres collections du projet', async () => {
    await assertFails(visiteur().collection('autre_application').get());
  });
});

describe('Utilisateur connecté mais non administrateur', () => {
  it('ne peut pas enregistrer de contribution', async () => {
    await assertFails(creer(intrus(), 'ame_contributions', 'c1', contribution, 'intrus'));
  });
  it('ne peut pas se déclarer administrateur', async () => {
    await assertFails(intrus().collection('ame_admins').doc('intrus').set({ role: 'admin' }));
  });
});

describe('Administrateur', () => {
  it('enregistre une contribution avec son historique', async () => {
    await assertSucceeds(creer(admin(), 'ame_contributions', 'c1', contribution));
  });
  it("est refusé sans entrée d'historique", async () => {
    await assertFails(creer(admin(), 'ame_contributions', 'c1', contribution, 'admin', false));
  });
  it('enregistre une dépense payée et une dépense partielle', async () => {
    await assertSucceeds(creer(admin(), 'ame_depenses', 'd1', depense));
    await assertSucceeds(creer(admin(), 'ame_depenses', 'd2', { ...depense, montant: 20000, montantPaye: 8000, statut: 'partielle' }));
  });
  it('refuse un statut incohérent avec le montant payé', async () => {
    await assertFails(creer(admin(), 'ame_depenses', 'd1', { ...depense, montantPaye: 10000, statut: 'payee' }));
  });
  it('refuse un montant reçu supérieur au montant', async () => {
    await assertFails(creer(admin(), 'ame_contributions', 'c1', { ...contribution, montantRecu: 60000 }));
  });
  it('refuse un montant négatif ou décimal', async () => {
    await assertFails(creer(admin(), 'ame_contributions', 'c1', { ...contribution, montant: -5, montantRecu: 0 }));
    await assertFails(creer(admin(), 'ame_contributions', 'c2', { ...contribution, montant: 12.5, montantRecu: 12.5 }));
  });
  it('refuse un champ inconnu', async () => {
    await assertFails(creer(admin(), 'ame_contributions', 'c1', { ...contribution, pirate: true }));
  });
  it('corrige une opération avec historique', async () => {
    await creer(admin(), 'ame_contributions', 'c1', contribution);
    await assertSucceeds(modifier(admin(), 'ame_contributions', 'c1', { montant: 25000, montantRecu: 25000 }, 'modification', 'erreur'));
  });
  it('ne supprime pas sans copie dans l’historique', async () => {
    await creer(admin(), 'ame_contributions', 'c1', contribution);
    await assertFails(admin().collection('ame_contributions').doc('c1').delete());
  });
  it('supprime avec motif et copie complète dans l’historique', async () => {
    await creer(admin(), 'ame_contributions', 'c1', contribution);
    const sansMotif = admin().batch();
    sansMotif.delete(admin().collection('ame_contributions').doc('c1'));
    sansMotif.set(admin().collection('ame_historique').doc('sup_c1'), { ...hist('admin', 'contributions', 'c1', 'suppression', ''), avant: contribution });
    await assertFails(sansMotif.commit());
    const ok = admin().batch();
    ok.delete(admin().collection('ame_contributions').doc('c1'));
    ok.set(admin().collection('ame_historique').doc('sup_c1'), { ...hist('admin', 'contributions', 'c1', 'suppression', 'Doublon'), avant: contribution });
    await assertSucceeds(ok.commit());
  });
  it('un non-administrateur ne peut pas supprimer', async () => {
    await creer(admin(), 'ame_contributions', 'c1', contribution);
    const b = intrus().batch();
    b.delete(intrus().collection('ame_contributions').doc('c1'));
    b.set(intrus().collection('ame_historique').doc('sup_c1'), { ...hist('intrus', 'contributions', 'c1', 'suppression', 'Doublon') });
    await assertFails(b.commit());
  });
  it('enregistre une cotisation avec son groupe familial', async () => {
    await assertSucceeds(creer(admin(), 'ame_contributions', 'k1', { ...contribution, type: 'cotisation', groupe: 'Enfants du défunt' }));
    await assertFails(creer(admin(), 'ame_contributions', 'k2', { ...contribution, type: 'don' }));
  });
  it('gère les postes du budget et les devis', async () => {
    const poste = { libelle: 'Cercueil', prevision: 450000, responsable: 'Carole', financement: 'Enveloppe Guy', commentaire: '', ordre: 10 };
    await assertSucceeds(creer(admin(), 'ame_postes', 'poste-11', poste));
    await assertFails(creer(admin(), 'ame_postes', 'poste-12', { ...poste, prevision: -1 }));
    await assertSucceeds(creer(admin(), 'ame_depenses', 'd9', { ...depense, posteId: 'poste-11', categorie: 'Cercueil', responsable: 'Carole', financement: 'Enveloppe Guy' }));
    const devis = { prestataire: 'Menuiserie', posteId: 'poste-11', objet: '', montant: 450000, date: '2026-10-14', statut: 'retenu', reference: '', commentaire: '' };
    await assertSucceeds(creer(admin(), 'ame_devis', 'v1', devis));
    await assertFails(creer(admin(), 'ame_devis', 'v2', { ...devis, statut: 'peut-etre' }));
    await assertSucceeds(visiteur().collection('ame_postes').get());
    await assertSucceeds(visiteur().collection('ame_devis').get());
  });
  it("annule seulement avec un motif, puis l'opération est figée", async () => {
    await creer(admin(), 'ame_depenses', 'd1', depense);
    await assertFails(modifier(admin(), 'ame_depenses', 'd1', { annule: true, motifAnnulation: '' }, 'annulation', ''));
    await assertSucceeds(
      modifier(admin(), 'ame_depenses', 'd1', { annule: true, motifAnnulation: 'Doublon' }, 'annulation', 'Doublon'),
    );
    await assertFails(modifier(admin(), 'ame_depenses', 'd1', { annule: false }, 'modification', 'retour'));
  });
  it("ne peut ni modifier ni supprimer l'historique", async () => {
    await creer(admin(), 'ame_contributions', 'c1', contribution);
    const h = await admin().collection('ame_historique').limit(1).get();
    const ref = admin().collection('ame_historique').doc(h.docs[0].id);
    await assertFails(ref.update({ motif: 'effacé' }));
    await assertFails(ref.delete());
  });
  it('ne peut plus rien enregistrer après la clôture', async () => {
    const db = admin();
    const refHist = db.collection('ame_historique').doc();
    const batch = db.batch();
    batch.set(db.collection('ame_parametres').doc('general'), {
      cloture: true,
      afficherNoms: true,
      afficherMontants: true,
      afficherJustificatifs: false,
      categoriesDepenses: [],
      categoriesDons: [],
      derniereOperation: refHist.id,
    });
    batch.set(refHist, hist('admin', 'parametres', 'general', 'parametres'));
    await assertSucceeds(batch.commit());
    await assertFails(creer(admin(), 'ame_contributions', 'c1', contribution));
  });
  it('les données de démonstration restent dans les collections ame_demo_', async () => {
    await assertSucceeds(creer(admin(), 'ame_demo_contributions', 'c1', contribution));
    const reel = await admin().collection('ame_contributions').get();
    if (!reel.empty) throw new Error('Les données de démo ont fuité dans les collections réelles');
  });
});

describe('Justificatifs (Storage)', () => {
  const fichier = new Uint8Array([1, 2, 3]);
  const chemin = 'ame/reel/justificatifs/d1/recu.jpg';

  it('un visiteur ne peut pas téléverser', async () => {
    const st = env.unauthenticatedContext().storage();
    await assertFails(st.ref(chemin).put(fichier, { contentType: 'image/jpeg' }));
  });
  it("l'administrateur téléverse une photo de reçu", async () => {
    const st = env.authenticatedContext('admin').storage();
    await assertSucceeds(st.ref(chemin).put(fichier, { contentType: 'image/jpeg' }));
  });
  it("refuse un fichier qui n'est ni une image ni un PDF", async () => {
    const st = env.authenticatedContext('admin').storage();
    await assertFails(st.ref('ame/reel/justificatifs/d1/x.exe').put(fichier, { contentType: 'application/x-msdownload' }));
  });
  it('la famille ne voit les reçus que si l’option est activée', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.storage().ref(chemin).put(fichier, { contentType: 'image/jpeg' });
      await ctx.firestore().collection('ame_parametres').doc('general').set({ afficherJustificatifs: false });
    });
    await assertFails(env.unauthenticatedContext().storage().ref(chemin).getDownloadURL());
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('ame_parametres').doc('general').set({ afficherJustificatifs: true });
    });
    await assertSucceeds(env.unauthenticatedContext().storage().ref(chemin).getDownloadURL());
  });
});
