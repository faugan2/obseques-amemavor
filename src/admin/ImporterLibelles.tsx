import { useState } from 'react';
import { GabaritAdmin } from './Gabarit';
import { Chargement, MessageErreur, useNotifier } from '../composants/ui';
import { useDonnees } from '../lib/donnees';
import { creer } from '../lib/operations';
import { IconeFlecheBas } from '../composants/icones';

// Les 66 libellés extraits des fichiers Excel
const LIBELLES_A_IMPORTER = [
  'ACHAT ACCESOIRES TENUES DEFUNTS',
  'ACHAT DE PETITES BOUTEILLE VISITEURS',
  'ACHAT PRODUITS ENTRETIEN MAISON',
  'ACHATS 50 CARTONS D\'EAU',
  'AGRANDISSEMENT 1 PHOTO',
  'AGRANDISSEMENT PHOTO PAPA',
  'AMENAGEMENT PETITE CHAPELLE SUR TERRASSE KLIKAME',
  'AMENAGEMENTS SARCLAGE PARKING',
  'ANIMATEUR',
  'ANNONCE TVT',
  'AUTORISATION A LA MAIRIE',
  'Achat Bouteille de Gaz le Grand',
  'Achat Cash Power Villa Blanche Ele',
  'Achat petites boutelles d\'eau mini',
  'Agrandissement Photo',
  'Aménagement petite chapelle sur la terrase Klikame',
  'Avance Cerceuil',
  'CAMBUSE DIMANCHE 01/11',
  'CAMBUSE JEUDI 29/10',
  'CAMBUSE SAMEDI 31/10',
  'CAMBUSE VENDREDI 30/10',
  'CAMION SABLE 10 ROUES',
  'CERCUEIL',
  'COMMANDE DE GERBES',
  'CONSTRUCTION TOMBE BETON ARME',
  'ELECTRICITE ECLAIRAGE ZONE SOMBRE DOMICILE',
  'EMOLUMENTS  PORTEURS CERCUEIL',
  'ENVELOPPE CUISINE DES ENFANTS ET ETRANGERS DE PAPA',
  'ENVELOPPE LA GRANDE FAMILLE DE DANYI (ETSI MAWUGBE & DAMALI)',
  'ENVELOPPE PAPA',
  'ENVELOPPE PAROISSE EEPT COLLEGE PROTESTANT LOME TOKOIN',
  'ENVELOPPE PAROISSE EEPT KPELE ELE',
  'Eclairage zones d\'ombre au domicile Papa Klikame',
  'Emolument Garçon Ménage le 22 Septembre',
  'FORFAIT POUR FACTURE ELECTRICITE DES 3 DOMICILES ELE',
  'FRAIS MISSION CHEF DE FAMILLE A ELE',
  'FRAIS MISSION FO ATSOU PAROISSE KPELE ELE',
  'FRAIS MORGUE',
  'Frais Electricité Septembre Post Papa Maison Klikamé',
  'Frais Entretien Jardin Klikame',
  'Frais Mission Ele Paroisse KPELE ELE',
  'Frais Mission Ele du Chef de Famille AMEMAVOR',
  'GEL MAINS',
  'GRANDE TENTE RECEPTION DU SAMEDI ET MISE EN PLACE',
  'GROUPE ACCUEIL PAROISSE',
  'HOTESSES COORDINATION',
  'IMPRESSION BACHES',
  'IMPRESSION FAIRE PARTS',
  'LOCATION 02 ARMOIRES CLIMATISEURS POUR CHAPELLE ARDENTE',
  'LOCATION BUS',
  'LOCATION GROUPE ELECTROGENE',
  'MISE A DISPOSITION PAR GUY',
  'MISE EN PLACE APATAM CHAISES + CHAPELLE ARDENTE',
  'MISSION DANYI CHARITY',
  'MISSION VINCENT FILS',
  'Mission Danyi Charity du 08 Oct',
  'Mission Vincent Ele le 02 Oct',
  'NETTOYAGE COMPLET MAISON APRES ENTERREMENT',
  'PERMIS D\'INHUMER',
  'RECEPTION DU SAMEDI (DEJEUNER DE 500 PERSONNES)',
  'REPAS FRI/SAT/SUN',
  'REPORTAGE PHOTO VIDEO',
  'SAVON LIQUIDE',
  'SOPALIN',
  'TRANSPORT CHEVALET PHOTO',
  'TRAVAUX DIVERS ELECTRICITE ELE',
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
        const refLibelle = await creer('libelles', donnees, `Libellé · ${nom}`);

        // Créer automatiquement la ligne de budget correspondante
        const budgetData = {
          id_libelle: refLibelle.id,
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
      sousTitre="Importer automatiquement les 66 libellés des fichiers Excel"
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
