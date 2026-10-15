import { useState } from 'react';
import { GabaritAdmin } from './Gabarit';
import { Chargement, useNotifier } from '../composants/ui';
import { useDonnees } from '../lib/donnees';
import { creer } from '../lib/operations';

// Les 50 libellés du CSV (nouveaux, sans doublons)
const LIBELLES_A_IMPORTER = [
  'FRAIS MORGUE',
  'ELECTRICITE ECLAIRAGE ZONE SOMBRE DOMICILE',
  'ACHAT DE PETITES BOUTEILLE VISITEURS',
  'AGRANDISSEMENT PHOTO PAPA',
  'AMENAGEMENT PETITE CHAPELLE SUR TERRASSE KLIKAME',
  'FRAIS MISSION CHEF DE FAMILLE A ELE',
  'FRAIS MISSION FO ATSOU PAROISSE KPELE ELE',
  'MISSION VINCENT FILS',
  'MISSION DANYI CHARITY',
  'MISE EN PLACE APATAM CHAISES + CHAPELLE ARDENTE',
  'CERCUEIL',
  'CONSTRUCTION TOMBE BETON ARME',
  'PERMIS D\'INHUMER',
  'LOCATION 02 ARMOIRES CLIMATISEURS POUR CHAPELLE ARDENTE',
  'ENVELOPPE PAROISSE EEPT COLLEGE PROTESTANT LOME TOKOIN',
  'ENVELOPPE PAROISSE EEPT KPELE ELE',
  'AMENAGEMENTS SARCLAGE PARKING',
  'ACHAT ACCESOIRES TENUES DEFUNTS',
  'COMMANDE DE GERBES',
  'CAMBUSE JEUDI 29/10',
  'CAMBUSE VENDREDI 30/10',
  'CAMBUSE SAMEDI 31/10',
  'CAMBUSE DIMANCHE 01/11',
  'ACHATS 50 CARTONS D\'EAU',
  'GRANDE TENTE RECEPTION DU SAMEDI ET MISE EN PLACE',
  'RECEPTION DU SAMEDI (DEJEUNER DE 500 PERSONNES)',
  'LOCATION GROUPE ELECTROGENE',
  'AUTORISATION A LA MAIRIE',
  'LOCATION BUS',
  'TRAVAUX DIVERS ELECTRICITE ELE',
  'ANIMATEUR',
  'HOTESSES COORDINATION',
  'SOPALIN',
  'SAVON LIQUIDE',
  'REPAS FRI/SAT/SUN',
  'CAMION SABLE 10 ROUES',
  'IMPRESSION FAIRE PARTS',
  'IMPRESSION BACHES',
  'GEL MAINS',
  'EMOLUMENTS PORTEURS CERCUEIL',
  'ENVELOPPE CUISINE DES ENFANTS ET ETRANGERS DE PAPA',
  'ENVELOPPE LA GRANDE FAMILLE DE DANYI (ETSI MAWUGBE & DAMALI)',
  'GROUPE ACCUEIL PAROISSE',
  'ACHAT PRODUITS ENTRETIEN MAISON',
  'AGRANDISSEMENT 1 PHOTO',
  'TRANSPORT CHEVALET PHOTO',
  'ANNONCE TVT',
  'REPORTAGE PHOTO VIDEO',
  'NETTOYAGE COMPLET MAISON APRES ENTERREMENT',
  'FORFAIT POUR FACTURE ELECTRICITE DES 3 DOMICILES ELE',
];

export default function ImporterLibelles() {
  const { libelles, chargement } = useDonnees();
  const notifier = useNotifier();
  const [importEnCours, setImportEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  // Libellés qui existent déjà
  const libellesExistants = new Set(libelles.map((l) => l.nom));
  const aImporter = LIBELLES_A_IMPORTER.filter((l) => !libellesExistants.has(l));
  const deja = LIBELLES_A_IMPORTER.filter((l) => libellesExistants.has(l));

  const importer = async () => {
    if (aImporter.length === 0) {
      notifier('Tous les libellés sont déjà importés!');
      return;
    }

    setErreur('');
    setImportEnCours(true);

    try {
      for (let i = 0; i < aImporter.length; i++) {
        const nom = aImporter[i];
        const donnees = {
          nom,
          description: '',
          ordre: (deja.length + i + 1) * 10,
        };
        // Créer le libellé
        const idLibelle = await creer('libelles', donnees, `Libellé · ${nom}`);

        // Créer automatiquement la ligne de budget correspondante
        const budgetData = {
          id_libelle: idLibelle,
          responsable: '',
          financement: '',
          prevision: 0,
          montantPaye: 0,
          commentaire: `Créé automatiquement pour le libellé "${nom}"`,
        };
        await creer('budget', budgetData, `Budget · ${nom}`);
      }
      notifier(`✅ ${aImporter.length} libellés + lignes de budget importés!`);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur lors de l\'import');
    } finally {
      setImportEnCours(false);
    }
  };

  if (chargement) return <GabaritAdmin titre="Import des libellés"><Chargement /></GabaritAdmin>;

  return (
    <GabaritAdmin
      titre="Import des libellés"
      sousTitre="Importer les 50 libellés du CSV"
    >
      {erreur && (
        <div className="rounded-2xl bg-depense-pale p-4 text-depense-fonce">
          ⚠️ {erreur}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* À importer */}
        <section className="carte flex flex-col">
          <h2 className="border-b border-trait px-5 py-4 font-bold text-attente">
            À importer: {aImporter.length}
          </h2>
          <ul className="flex-1 overflow-y-auto px-5 py-3">
            {aImporter.map((l, i) => (
              <li key={i} className="border-b border-trait py-2 text-sm last:border-b-0">
                {l}
              </li>
            ))}
          </ul>
          <button
            onClick={importer}
            disabled={importEnCours || aImporter.length === 0}
            className="m-5 inline-flex min-h-[46px] items-center justify-center rounded-xl bg-recu px-5 font-extrabold text-white disabled:opacity-50"
          >
            {importEnCours ? '⏳ Import en cours...' : `✅ Importer ${aImporter.length} libellés`}
          </button>
        </section>

        {/* Déjà importés */}
        <section className="carte flex flex-col">
          <h2 className="border-b border-trait px-5 py-4 font-bold text-recu">
            Déjà importés: {deja.length}
          </h2>
          <ul className="flex-1 overflow-y-auto px-5 py-3">
            {deja.map((l, i) => (
              <li key={i} className="border-b border-trait py-2 text-sm text-encre-pale line-through last:border-b-0">
                {l}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </GabaritAdmin>
  );
}
