import { Link } from 'react-router-dom';
import { EtatVide } from '../composants/ui';
import { useDonnees } from '../lib/donnees';

/** Administration des libellés. */
export function ListeLibelles() {
  const { libelles, parametres } = useDonnees();

  console.log('📊 ListeLibelles rendu');
  console.log(`📦 Nombre de libellés reçus: ${libelles.length}`);
  console.log('📋 Libellés:', libelles);

  const liste = [...libelles].sort((a, b) => a.ordre - b.ordre || a.nom.localeCompare(b.nom));

  return (
    <section className="carte">
      {liste.length === 0 ? (
        <div className="p-6">
          <EtatVide titre="Aucun libellé pour le moment">
            Créez les libellés qui seront utilisés par les postes budgétaires et les dépenses.
          </EtatVide>
        </div>
      ) : (
        <ul>
          {liste.map((l, i) => (
            <li key={l.id} className={i > 0 ? 'border-t border-trait' : ''}>
              <Link to={`/admin/libelle/${l.id}`} className="flex flex-wrap items-start gap-x-4 gap-y-1.5 px-5 py-3.5 text-encre no-underline hover:bg-[#FAFBF8]">
                <div className="flex min-w-[220px] flex-1 flex-col">
                  <span className="font-bold">{l.nom}</span>
                  {l.description && <span className="text-xs text-encre-pale">{l.description}</span>}
                </div>
                <span className="shrink-0 rounded-full bg-attente-pale px-3 py-1 text-xs font-semibold text-attente-fonce">Ordre: {l.ordre}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
