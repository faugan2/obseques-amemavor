import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Route, Routes, useParams } from 'react-router-dom';
import { FournisseurAuth } from './lib/auth';
import { FournisseurDonnees } from './lib/donnees';
import { Chargement, FournisseurNotifications } from './composants/ui';
import Accueil from './famille/Accueil';
import Recu from './famille/Recu';
import Nature from './famille/Nature';
import Depenses from './famille/Depenses';
import { Protection } from './admin/Gabarit';

// L'administration est chargée à la demande : la famille ne télécharge que l'espace familial.
const Connexion = lazy(() => import('./admin/Connexion'));
const TableauBord = lazy(() => import('./admin/TableauBord'));
const FormContribution = lazy(() => import('./admin/FormContribution'));
const FormDon = lazy(() => import('./admin/FormDon'));
const FormDepense = lazy(() => import('./admin/FormDepense'));
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

/** Remonte le formulaire quand on passe d'une opération à une autre. */
function ParCle({ composant: C }: { composant: React.ComponentType }) {
  const { id } = useParams();
  return <C key={id} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <FournisseurNotifications>
        <FournisseurDonnees>
          <FournisseurAuth>
            <Suspense fallback={<Chargement />}>
              <Routes>
                <Route path="/" element={<Accueil />} />
                <Route path="/recu" element={<Recu />} />
                <Route path="/nature" element={<Nature />} />
                <Route path="/depenses" element={<Depenses />} />

                <Route path="/admin/connexion" element={<Connexion />} />
                <Route path="/admin" element={admin(<TableauBord />)} />
                <Route path="/admin/contribution/nouvelle" element={admin(<FormContribution key="nouvelle" />)} />
                <Route path="/admin/contribution/:id" element={admin(<ParCle composant={FormContribution} />)} />
                <Route path="/admin/don/nouveau" element={admin(<FormDon key="nouveau" />)} />
                <Route path="/admin/don/:id" element={admin(<ParCle composant={FormDon} />)} />
                <Route path="/admin/depense/nouvelle" element={admin(<FormDepense key="nouvelle" />)} />
                <Route path="/admin/depense/:id" element={admin(<ParCle composant={FormDepense} />)} />
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
