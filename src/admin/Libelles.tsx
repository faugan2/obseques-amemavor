import { Link } from 'react-router-dom';
import { GabaritAdmin } from './Gabarit';
import { ListeLibelles } from './ListeLibelles';
import { useDonnees } from '../lib/donnees';

export default function PageLibelles() {
  const { parametres } = useDonnees();

  return (
    <GabaritAdmin
      titre="Libellés"
      sousTitre="Gestion des libellés utilisés par les postes budgétaires et les dépenses."
      actions={
        !parametres.cloture && (
          <Link to="/admin/libelle/nouveau" className="inline-flex min-h-[46px] items-center rounded-xl bg-foret px-5 text-sm font-extrabold text-white no-underline">
            + Nouveau libellé
          </Link>
        )
      }
    >
      <ListeLibelles />
    </GabaritAdmin>
  );
}
