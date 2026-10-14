import { describe, expect, it } from 'vitest';
import { ceremoniesAVenir, cleNom, depensesParCategorie, donsParCategorie, statutDepense, synthese, toutesOperations } from './calculs';
import { DEMO_CONTRIBUTIONS, DEMO_DEPENSES, DEMO_DONS } from './demo';
import { fcfa, jourLong, lienTelephone, lireMontant } from './format';
import { PARAMETRES_PAR_DEFAUT, type Contribution, type Depense, type Don } from '../types';

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
  it('regroupe les dépenses par catégorie', () => {
    expect(depensesParCategorie(depenses)).toEqual([
      { categorie: 'Boissons et nourriture', paye: 30000, reste: 0 },
      { categorie: 'Location de chaises, bâches et matériel', paye: 0, reste: 20000 },
    ]);
  });
});
