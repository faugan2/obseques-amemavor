import { Link } from 'react-router-dom';
import { GabaritAdmin } from './Gabarit';
import { ListeEmprunts } from './ListeEmprunts';
import { useDonnees } from '../lib/donnees';

export default function PageEmprunts() {
  const { parametres } = useDonnees();

  return (
    <GabaritAdmin
      titre="Emprunts"
      sousTitre="Gestion des prêts accordés à la famille."
      actions={
        !parametres.cloture && (
          <Link to="/admin/emprunt/nouveau" className="inline-flex min-h-[46px] items-center rounded-xl bg-foret px-5 text-sm font-extrabold text-white no-underline">
            + Nouvel emprunt
          </Link>
        )
      }
    >
      <ListeEmprunts />
    </GabaritAdmin>
  );
}
