import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { FournisseurAuth } from './lib/auth';
import { FournisseurDonnees, useDonnees } from './lib/donnees';
import { Chargement, FournisseurNotifications } from './composants/ui';
import Accueil from './famille/Accueil';
import Budget from './famille/Budget';
import Cotisations from './famille/Cotisations';
import Participations from './famille/Participations';
import Emprunts from './famille/Emprunts';
import Depenses from './famille/Depenses';
import Devis from './famille/Devis';
import { Protection } from './admin/Gabarit';

// L'administration est chargée à la demande : la famille ne télécharge que l'espace familial.
const Connexion = lazy(() => import('./admin/Connexion'));
const TableauBord = lazy(() => import('./admin/TableauBord'));
const FormContribution = lazy(() => import('./admin/FormContribution'));
const FormDon = lazy(() => import('./admin/FormDon'));
const FormDepense = lazy(() => import('./admin/FormDepense'));
const FormPoste = lazy(() => import('./admin/FormPoste'));
const FormDevis = lazy(() => import('./admin/FormDevis'));
const FormEmprunt = lazy(() => import('./admin/FormEmprunt'));
const FormLibelle = lazy(() => import('./admin/FormLibelle'));
const FormBudget = lazy(() => import('./admin/FormBudget'));
const ListeBudget = lazy(() => import('./admin/ListeBudget'));
const ListeDevis = lazy(() => import('./admin/ListeDevis'));
const PageEmprunts = lazy(() => import('./admin/Emprunts'));
const PageLibelles = lazy(() => import('./admin/Libelles'));
const PageImporterLibelles = lazy(() => import('./admin/ImporterLibelles'));
const PageImporterBudgetCorrect = lazy(() => import('./admin/ImporterBudgetCorrect'));
const Historique = lazy(() => import('./admin/Historique'));
const Rapport = lazy(() => import('./admin/Rapport'));
const Parametres = lazy(() => import('./admin/Parametres'));

function Introuvable() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-titre text-3xl">Page introuvable</h1>
      <Link to="/" className="font-bold text-recu">Retour à l'espace familial</Link>
    </div>
  );
}

const admin = (el: React.ReactNode) => <Protection>{el}</Protection>;

/** Titre de l'onglet du navigateur, suit le nom défini dans les Paramètres. */
function TitreDocument() {
  const { parametres } = useDonnees();
  useEffect(() => {
    document.title = `Obsèques de ${parametres.nomDefunt.replace(/^Feu /i, 'feu ')} · Suivi des contributions et dépenses`;
  }, [parametres.nomDefunt]);
  return null;
}

/** Remonte le formulaire quand on passe d'une opération à une autre. */
function ParCle({ composant: C }: { composant: React.ComponentType }) {
  const { id } = useParams();
  return <C key={id} />;
}

export default function App() {
  return (
    <BrowserRouter basename="/obseques-amemavor/">
      <FournisseurNotifications>
        <FournisseurDonnees>
          <TitreDocument />
          <FournisseurAuth>
            <Suspense fallback={<Chargement />}>
              <Routes>
                <Route path="/" element={<Accueil />} />
                <Route path="/budget" element={<Budget />} />
                <Route path="/cotisations" element={<Cotisations />} />
                <Route path="/participations" element={<Participations />} />
                <Route path="/emprunts" element={<Emprunts />} />
                <Route path="/depenses" element={<Depenses />} />
                <Route path="/devis" element={<Devis />} />
                {/* Anciennes adresses, déjà partagées éventuellement. */}
                <Route path="/recu" element={<Navigate to="/participations" replace />} />
                <Route path="/nature" element={<Navigate to="/participations?onglet=nature" replace />} />

                <Route path="/admin/connexion" element={<Connexion />} />
                <Route path="/admin" element={admin(<TableauBord key="tout" />)} />
                <Route path="/admin/cotisations" element={admin(<TableauBord key="cotisation" typeFixe="cotisation" />)} />
                <Route path="/admin/participations" element={admin(<TableauBord key="participation" typeFixe="participation" />)} />
                <Route path="/admin/dons" element={admin(<TableauBord key="don" typeFixe="don" />)} />
                <Route path="/admin/emprunts" element={admin(<PageEmprunts />)} />
                <Route path="/admin/depenses" element={admin(<TableauBord key="depense" typeFixe="depense" />)} />
                <Route path="/admin/budget" element={admin(<ListeBudget />)} />
                <Route path="/admin/devis" element={admin(<ListeDevis />)} />

                <Route path="/admin/cotisation/nouvelle" element={admin(<FormContribution key="cot" typeInitial="cotisation" />)} />
                <Route path="/admin/participation/nouvelle" element={admin(<FormContribution key="par" typeInitial="participation" />)} />
                <Route path="/admin/contribution/nouvelle" element={<Navigate to="/admin/participation/nouvelle" replace />} />
                <Route path="/admin/contribution/:id" element={admin(<ParCle composant={FormContribution} />)} />
                <Route path="/admin/don/nouveau" element={admin(<FormDon key="nouveau" />)} />
                <Route path="/admin/don/:id" element={admin(<ParCle composant={FormDon} />)} />
                <Route path="/admin/depense/nouvelle" element={admin(<FormDepense key="nouvelle" />)} />
                <Route path="/admin/depense/:id" element={admin(<ParCle composant={FormDepense} />)} />
                <Route path="/admin/poste/nouveau" element={admin(<FormPoste key="nouveau" />)} />
                <Route path="/admin/poste/:id" element={admin(<ParCle composant={FormPoste} />)} />
                <Route path="/admin/devis/nouveau" element={admin(<FormDevis key="nouveau" />)} />
                <Route path="/admin/devis/:id" element={admin(<ParCle composant={FormDevis} />)} />
                <Route path="/admin/emprunt/nouveau" element={admin(<FormEmprunt key="nouveau" />)} />
                <Route path="/admin/emprunt/:id" element={admin(<ParCle composant={FormEmprunt} />)} />
                <Route path="/admin/libelles" element={admin(<PageLibelles />)} />
                <Route path="/admin/libelle/nouveau" element={admin(<FormLibelle key="nouveau" />)} />
                <Route path="/admin/libelle/:id" element={admin(<ParCle composant={FormLibelle} />)} />
                <Route path="/admin/budget/:id" element={admin(<ParCle composant={FormBudget} />)} />
                <Route path="/admin/importer-libelles" element={admin(<PageImporterLibelles />)} />
                <Route path="/admin/importer-budget-correct" element={admin(<PageImporterBudgetCorrect />)} />
                <Route path="/admin/historique" element={admin(<Historique />)} />
                <Route path="/admin/rapport" element={admin(<Rapport />)} />
                <Route path="/admin/parametres" element={admin(<Parametres />)} />
                <Route path="*" element={<Introuvable />} />
              </Routes>
            </Suspense>
          </FournisseurAuth>
        </FournisseurDonnees>
      </FournisseurNotifications>
    </BrowserRouter>
  );
}
