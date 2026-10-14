import { describe, expect, it } from 'vitest';
import { budget, ceremoniesAVenir, cleNom, cotisationsParGroupe, donsParCategorie, statutDepense, synthese, toutesOperations } from './calculs';
import initiales from './donneesInitiales.json';
import { DEMO_CONTRIBUTIONS, DEMO_DEPENSES, DEMO_DONS } from './demo';
import { fcfa, jourLong, lienTelephone, lireMontant } from './format';
import { PARAMETRES_PAR_DEFAUT, type Contribution, type Depense, type Don, type Poste } from '../types';

const trace = (id: string) => ({
  id,
  annule: false,
  creePar: 'admin',
  creeLe: null,
  modifieLe: null,
  derniereOperation: 'h',
});

const contributions = DEMO_CONTRIBUTIONS.map((c, i) => ({ ...c, ...trace(`c${i}`) })) as Contribution[];
const dons = DEMO_DONS.map((d, i) => ({ ...d, ...trace(`n${i}`) })) as Don[];
const depenses = DEMO_DEPENSES.map((d, i) => ({ ...d, ...trace(`d${i}`) })) as Depense[];

describe('Données de démonstration (section 11)', () => {
  const s = synthese(contributions, dons, depenses);

  it('affiche 75 000 FCFA reçus', () => expect(s.totalEncaisse).toBe(75000));
  it('affiche 30 000 FCFA de dépenses payées', () => expect(s.totalDepense).toBe(30000));
  it('affiche un solde de 45 000 FCFA', () => expect(s.solde).toBe(45000));
  it('affiche 20 000 FCFA de dépenses prévues non payées', () => expect(s.resteAPayer).toBe(20000));
  it('compte 2 contributeurs distincts', () => expect(s.nbContributeurs).toBe(2));
  it('compte 1 don en nature de 10 cartons de boissons', () => {
    expect(s.nbDons).toBe(1);
    expect(donsParCategorie(dons)).toEqual([{ categorie: 'Boissons', unite: 'cartons', quantite: 10 }]);
  });
  it('ne compte jamais les dons en nature dans la caisse', () => {
    const avecValeur = dons.map((d) => ({ ...d, valeurEstimee: 60000 }));
    expect(synthese(contributions, avecValeur, depenses).solde).toBe(45000);
  });
});

describe('Paiements partiels et promesses', () => {
  it('ne déduit que la somme réellement payée', () => {
    const partielle = { ...depenses[1], montantPaye: 8000, statut: 'partielle' as const };
    const s = synthese(contributions, dons, [depenses[0], partielle]);
    expect(s.totalDepense).toBe(38000);
    expect(s.resteAPayer).toBe(12000);
    expect(s.solde).toBe(37000);
  });

  it('ne compte pas les promesses dans la caisse', () => {
    const promesse = { ...contributions[0], id: 'p', contributeur: 'Afi Exemple', contributeurCle: 'afi exemple', montant: 40000, montantRecu: 0 };
    const s = synthese([...contributions, promesse], dons, depenses);
    expect(s.totalEncaisse).toBe(75000);
    expect(s.promessesEnAttente).toBe(40000);
    expect(s.nbContributeurs).toBe(2);
  });

  it('compte une promesse partiellement honorée pour la part reçue seulement', () => {
    const p = { ...contributions[0], id: 'p', montant: 50000, montantRecu: 30000 };
    const s = synthese([p], [], []);
    expect(s.totalEncaisse).toBe(30000);
    expect(s.promessesEnAttente).toBe(20000);
  });
});

describe('Annulations', () => {
  it('retire une opération annulée de tous les totaux', () => {
    const annulee = { ...depenses[0], annule: true };
    const s = synthese(contributions, dons, [annulee, depenses[1]]);
    expect(s.totalDepense).toBe(0);
    expect(s.solde).toBe(75000);
    expect(s.nbDepenses).toBe(1);
  });

  it('affiche un solde négatif sans erreur', () => {
    const grosse = { ...depenses[0], montant: 100000, montantPaye: 100000 };
    expect(synthese(contributions, dons, [grosse]).solde).toBe(-25000);
  });
});

describe('Programme des cérémonies', () => {
  const programme = PARAMETRES_PAR_DEFAUT.ceremonies;
  it('affiche les trois cérémonies avant le 28 octobre', () => {
    expect(ceremoniesAVenir(programme, '2026-10-14')).toHaveLength(3);
  });
  it('garde une cérémonie affichée le jour même', () => {
    expect(ceremoniesAVenir(programme, '2026-10-31')).toHaveLength(1);
  });
  it('masque tout le programme après le 31 octobre', () => {
    expect(ceremoniesAVenir(programme, '2026-11-01')).toHaveLength(0);
  });
  it('donne le bon jour de la semaine (faire-part)', () => {
    expect(jourLong('2026-10-28')).toBe('Mercredi 28 octobre');
    expect(jourLong('2026-10-30')).toBe('Vendredi 30 octobre');
    expect(jourLong('2026-10-31')).toBe('Samedi 31 octobre');
  });
  it('prépare le lien d’appel du numéro de contact', () => {
    expect(lienTelephone('70 01 75 26')).toBe('tel:+22870017526');
  });
});

describe('Outils', () => {
  it('reconnaît la même personne malgré l’ordre, la casse et les accents', () => {
    expect(cleNom('AMEMAVO Kossi')).toBe(cleNom('kossi  Amémavo'));
  });
  it('déduit le statut d’une dépense', () => {
    expect(statutDepense(20000, 0)).toBe('prevue');
    expect(statutDepense(20000, 8000)).toBe('partielle');
    expect(statutDepense(20000, 20000)).toBe('payee');
  });
  it('lit les montants saisis', () => {
    expect(lireMontant('25 000')).toBe(25000);
    expect(lireMontant('25000 FCFA')).toBe(25000);
    expect(Number.isNaN(lireMontant('12,5'))).toBe(true);
    expect(Number.isNaN(lireMontant('-5'))).toBe(true);
  });
  it('formate en FCFA', () => {
    expect(fcfa(45000)).toBe('45 000 FCFA');
  });
  it('trie les opérations de la plus récente à la plus ancienne', () => {
    const ops = toutesOperations(contributions, dons, depenses);
    expect(ops[0].libelle).toBe('Location de chaises');
    expect(ops[ops.length - 1].libelle).toBe('Kodjo Exemple');
  });
});

// Données des fichiers Excel remis par le DG (scripts/importer_excel.py).
const imp = {
  postes: initiales.postes.map((p) => ({ ...p, ...trace(p.id) })) as unknown as Poste[],
  depenses: initiales.depenses.map((d, i) => ({ ...d, ...trace(`d${i}`) })) as unknown as Depense[],
  contributions: initiales.contributions.map((c, i) => ({ ...c, contributeurCle: cleNom(c.contributeur), ...trace(`c${i}`) })) as unknown as Contribution[],
};

describe('Import des fichiers Excel', () => {
  const s = synthese(imp.contributions, [], imp.depenses);
  const b = budget(imp.postes, imp.depenses);

  it('reprend le budget prévu de 10 999 250 FCFA', () => expect(b.totalPrevision).toBe(10999250));
  it('reprend les 729 534 FCFA de dépenses courantes, plus 44 500 FCFA de morgue', () => expect(s.totalDepense).toBe(729534 + 44500));
  it('compte les enveloppes et la participation de Gaëlle Sepopo comme entrées', () => expect(s.totalParticipations).toBe(450000 + 300000 + 44500 + 100000));
  it('retrouve le solde du fichier (20 466) augmenté de la participation (100 000)', () => expect(s.solde).toBe(20466 + 100000));
  it('rattache toutes les dépenses à un poste', () => expect(b.horsBudget.nb).toBe(0));
  it('calcule le réalisé du cercueil (avance de 200 000 sur 450 000)', () => {
    const cercueil = b.lignes.find((l) => l.poste.libelle === 'Cercueil')!;
    expect([cercueil.prevision, cercueil.realise, cercueil.engage, cercueil.resteAPayer]).toEqual([450000, 200000, 450000, 250000]);
  });
  it('retrouve les frais de morgue payés par Justin', () => {
    expect(b.lignes.find((l) => l.poste.libelle === 'Frais morgue')!.realise).toBe(44500);
  });
});

describe('Budget, cotisations et participations', () => {
  const poste = (id: string, prevision: number) => ({ ...trace(id), libelle: id, prevision, responsable: '', financement: '', commentaire: '', ordre: 0 }) as Poste;
  const dep = (id: string, posteId: string, montant: number, paye: number) =>
    ({ ...depenses[0], ...trace(id), posteId, montant, montantPaye: paye, statut: statutDepense(montant, paye) }) as Depense;

  it('signale un dépassement de poste', () => {
    const b = budget([poste('tente', 100)], [dep('a', 'tente', 150, 150)]);
    expect(b.nbDepassements).toBe(1);
    expect(b.lignes[0].ecart).toBe(-50);
  });
  it('classe hors budget les dépenses d’un poste supprimé', () => {
    const b = budget([], [dep('a', 'disparu', 80, 80)]);
    expect(b.horsBudget).toEqual({ realise: 80, engage: 80, nb: 1 });
    expect(b.totalRealise).toBe(80);
  });
  it('sépare cotisations et participations', () => {
    const cot = { ...contributions[0], id: 'k', type: 'cotisation' as const, groupe: 'Enfants du défunt', montant: 100000, montantRecu: 40000 };
    const s = synthese([...contributions, cot], dons, depenses);
    expect([s.totalCotisations, s.cotisationsAttendues, s.totalParticipations, s.totalEncaisse]).toEqual([40000, 60000, 75000, 115000]);
    const g = cotisationsParGroupe([cot], PARAMETRES_PAR_DEFAUT.groupesCotisation);
    expect(g[0]).toMatchObject({ groupe: 'Enfants du défunt', attendu: 100000, verse: 40000 });
    expect(g).toHaveLength(4);
  });
  it('considère les anciens enregistrements sans type comme des participations', () => {
    const ancien = { ...contributions[0], type: undefined };
    expect(synthese([ancien], [], []).totalParticipations).toBe(50000);
  });
});
