import { useState } from 'react';
import { GabaritAdmin } from './Gabarit';
import { Chargement, useNotifier } from '../composants/ui';
import { useDonnees } from '../lib/donnees';
import { creer } from '../lib/operations';

const BUDGETS_A_IMPORTER = [
  { nom: 'FRAIS MORGUE', prevision: 220000, financement: 'JUSTIN', responsable: 'CAROLE' },
  { nom: 'ELECTRICITE ECLAIRAGE ZONE SOMBRE DOMICILE', prevision: 45000, financement: 'ENVELOPPE PAPA', responsable: 'CAROLE' },
  { nom: 'ACHAT DE PETITES BOUTEILLE VISITEURS', prevision: 24000, financement: 'ENVELOPPE PAPA', responsable: 'CAROLE' },
  { nom: 'AGRANDISSEMENT PHOTO PAPA', prevision: 30000, financement: 'ENVELOPPE PAPA', responsable: 'CAROLE' },
  { nom: 'AMENAGEMENT PETITE CHAPELLE SUR TERRASSE KLIKAME', prevision: 30000, financement: 'ENVELOPPE PAPA', responsable: 'CAROLE' },
  { nom: 'FRAIS MISSION CHEF DE FAMILLE A ELE', prevision: 25000, financement: 'ENVELOPPE PAPA', responsable: 'MANASSE' },
  { nom: 'FRAIS MISSION FO ATSOU PAROISSE KPELE ELE', prevision: 10000, financement: 'ENVELOPPE PAPA', responsable: 'FO ATSOU' },
  { nom: 'MISSION VINCENT FILS', prevision: 15000, financement: 'ENVELOPPE GUY', responsable: 'VINCENT FILS' },
  { nom: 'MISSION DANYI CHARITY', prevision: 30000, financement: 'ENVELOPPE GUY', responsable: 'CHARITY' },
  { nom: 'MISE EN PLACE APATAM CHAISES + CHAPELLE ARDENTE', prevision: 1600000, financement: '', responsable: '' },
  { nom: 'CERCUEIL', prevision: 450000, financement: 'ENVELOPPE GUY', responsable: 'FO ATSOU-CAROLE' },
  { nom: 'CONSTRUCTION TOMBE BETON ARME', prevision: 332500, financement: '', responsable: '' },
  { nom: 'LOCATION 02 ARMOIRES CLIMATISEURS POUR CHAPELLE ARDENTE', prevision: 100000, financement: '', responsable: '' },
  { nom: 'ENVELOPPE PAROISSE EEPT COLLEGE PROTESTANT LOME TOKOIN', prevision: 50000, financement: '', responsable: '' },
  { nom: 'ENVELOPPE PAROISSE EEPT KPELE ELE', prevision: 50000, financement: '', responsable: '' },
  { nom: 'CAMBUSE JEUDI 29/10', prevision: 64600, financement: '', responsable: '' },
  { nom: 'CAMBUSE VENDREDI 30/10', prevision: 119200, financement: '', responsable: '' },
  { nom: 'CAMBUSE SAMEDI 31/10', prevision: 312350, financement: '', responsable: '' },
  { nom: 'CAMBUSE DIMANCHE 01/11', prevision: 56600, financement: '', responsable: '' },
  { nom: 'ACHATS 50 CARTONS D\'EAU', prevision: 175000, financement: '', responsable: '' },
  { nom: 'GRANDE TENTE RECEPTION DU SAMEDI ET MISE EN PLACE', prevision: 4000000, financement: '', responsable: '' },
  { nom: 'RECEPTION DU SAMEDI (DEJEUNER DE 500 PERSONNES)', prevision: 3260000, financement: '', responsable: '' },
  { nom: 'LOCATION GROUPE ELECTROGENE', prevision: 0, financement: '', responsable: '', commentaire: 'Besoins 03 Sites' },
  { nom: 'AUTORISATION A LA MAIRIE', prevision: 0, financement: '', responsable: '' },
  { nom: 'LOCATION BUS', prevision: 0, financement: '', responsable: '' },
  { nom: 'TRAVAUX DIVERS ELECTRICITE ELE', prevision: 0, financement: '', responsable: '' },
  { nom: 'ANIMATEUR', prevision: 0, financement: '', responsable: '' },
  { nom: 'HOTESSES COORDINATION', prevision: 0, financement: '', responsable: '' },
  { nom: 'SOPALIN', prevision: 0, financement: '', responsable: '' },
  { nom: 'SAVON LIQUIDE', prevision: 0, financement: '', responsable: '' },
  { nom: 'REPAS FRI/SAT/SUN', prevision: 0, financement: '', responsable: '' },
  { nom: 'CAMION SABLE 10 ROUES', prevision: 0, financement: '', responsable: '' },
  { nom: 'IMPRESSION FAIRE PARTS', prevision: 0, financement: '', responsable: '' },
  { nom: 'IMPRESSION BACHES', prevision: 0, financement: '', responsable: '' },
  { nom: 'GEL MAINS', prevision: 0, financement: '', responsable: '' },
  { nom: 'EMOLUMENTS  PORTEURS CERCUEIL', prevision: 0, financement: '', responsable: '' },
  { nom: 'ENVELOPPE CUISINE DES ENFANTS ET ETRANGERS DE PAPA', prevision: 0, financement: '', responsable: '' },
  { nom: 'ENVELOPPE LA GRANDE FAMILLE DE DANYI (ETSI MAWUGBE & DAMALI)', prevision: 0, financement: '', responsable: '' },
  { nom: 'GROUPE ACCUEIL PAROISSE', prevision: 0, financement: '', responsable: '' },
  { nom: 'ACHAT PRODUITS ENTRETIEN MAISON', prevision: 0, financement: '', responsable: '' },
  { nom: 'AGRANDISSEMENT 1 PHOTO', prevision: 0, financement: '', responsable: '' },
  { nom: 'TRANSPORT CHEVALET PHOTO', prevision: 0, financement: '', responsable: '' },
  { nom: 'ANNONCE TVT', prevision: 0, financement: '', responsable: '' },
  { nom: 'REPORTAGE PHOTO VIDEO', prevision: 0, financement: '', responsable: '' },
  { nom: 'NETTOYAGE COMPLET MAISON APRES ENTERREMENT', prevision: 0, financement: '', responsable: '' },
  { nom: 'PERMIS D\'INHUMER', prevision: 0, financement: '', responsable: '' },
  { nom: 'ACHAT ACCESOIRES TENUES DEFUNTS', prevision: 0, financement: '', responsable: '' },
  { nom: 'COMMANDE DE GERBES', prevision: 0, financement: '', responsable: '' },
  { nom: 'FORFAIT POUR FACTURE ELECTRICITE DES 3 DOMICILES ELE', prevision: 0, financement: '', responsable: '' },
];

export default function ImporterBudgetCorrect() {
  const { libelles, chargement } = useDonnees();
  const notifier = useNotifier();
  const [importEnCours, setImportEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  const importer = async () => {
    if (importEnCours) return;

    setErreur('');
    setImportEnCours(true);

    try {
      let creees = 0;
      let erreurs = 0;

      for (let i = 0; i < BUDGETS_A_IMPORTER.length; i++) {
        const budget = BUDGETS_A_IMPORTER[i];

        try {
          // Créer le libellé
          const idLibelle = await creer('libelles', {
            nom: budget.nom,
            description: budget.commentaire || '',
            ordre: (i + 1) * 10,
          }, `Libellé · ${budget.nom}`);

          // Créer la ligne de budget avec les bonnes infos
          const budgetData = {
            id_libelle: idLibelle,
            responsable: budget.responsable,
            financement: budget.financement,
            prevision: budget.prevision,
            montantPaye: 0,
            commentaire: budget.commentaire ? `${budget.commentaire}` : `Importé du CSV`,
          };
          await creer('budget', budgetData, `Budget · ${budget.nom}`);

          creees++;
        } catch (e) {
          console.error(`Erreur pour ${budget.nom}:`, e);
          erreurs++;
        }
      }

      notifier(`✅ ${creees}/${BUDGETS_A_IMPORTER.length} libellés + budgets créés!${erreurs > 0 ? ` (${erreurs} erreurs)` : ''}`);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur lors de l\'import');
    } finally {
      setImportEnCours(false);
    }
  };

  if (chargement) return <GabaritAdmin titre="Import Budget"><Chargement /></GabaritAdmin>;

  return (
    <GabaritAdmin
      titre="Import des budgets"
      sousTitre="Importer les 49 libellés et budgets du CSV"
    >
      {erreur && (
        <div className="rounded-2xl bg-depense-pale p-4 text-depense-fonce mb-4">
          {erreur}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-flottante">
        <h3 className="text-lg font-bold mb-4">📊 À importer: {BUDGETS_A_IMPORTER.length} libellés</h3>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.05em] text-encre-pale border-b">
                <th className="px-4 py-2 font-bold">#</th>
                <th className="px-4 py-2 font-bold">Libellé</th>
                <th className="px-4 py-2 text-right font-bold">Montant</th>
                <th className="px-4 py-2 font-bold">Financement</th>
                <th className="px-4 py-2 font-bold">Responsable</th>
              </tr>
            </thead>
            <tbody>
              {BUDGETS_A_IMPORTER.slice(0, 10).map((b, i) => (
                <tr key={i} className="border-b text-xs">
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2 font-semibold">{b.nom}</td>
                  <td className="px-4 py-2 text-right">{b.prevision.toLocaleString('fr-FR')} FCFA</td>
                  <td className="px-4 py-2">{b.financement || '—'}</td>
                  <td className="px-4 py-2">{b.responsable || '—'}</td>
                </tr>
              ))}
              <tr className="border-t-2 text-xs font-bold">
                <td colSpan={2} className="px-4 py-2">... et {BUDGETS_A_IMPORTER.length - 10} autres</td>
                <td className="px-4 py-2 text-right">{BUDGETS_A_IMPORTER.reduce((s, b) => s + b.prevision, 0).toLocaleString('fr-FR')} FCFA</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>

        <button
          onClick={() => void importer()}
          disabled={importEnCours}
          className="inline-flex min-h-[46px] items-center rounded-xl bg-recu px-6 text-sm font-extrabold text-white hover:opacity-90 disabled:opacity-50"
        >
          {importEnCours ? <Chargement /> : `✅ Importer les ${BUDGETS_A_IMPORTER.length} libellés + budgets`}
        </button>
      </div>
    </GabaritAdmin>
  );
}
