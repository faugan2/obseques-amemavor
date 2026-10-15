import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EtatVide, classes } from '../composants/ui';
import { useDonnees } from '../lib/donnees';

const ELEMENTS_PAR_PAGE = 20;

/** Administration des libellés. */
export function ListeLibelles() {
  const { libelles } = useDonnees();
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(0);

  const liste = [...libelles].sort((a, b) => a.ordre - b.ordre || a.nom.localeCompare(b.nom));

  // Filtrer par recherche
  const filtres = liste.filter((l) =>
    l.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    l.description.toLowerCase().includes(recherche.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filtres.length / ELEMENTS_PAR_PAGE);
  const debut = page * ELEMENTS_PAR_PAGE;
  const fin = debut + ELEMENTS_PAR_PAGE;
  const affichees = filtres.slice(debut, fin);

  // Réinitialiser page si recherche change
  const changerRecherche = (v: string) => {
    setRecherche(v);
    setPage(0);
  };

  return (
    <section className="flex flex-col gap-4">
      {/* Barre de recherche */}
      <div className="carte px-5 py-4">
        <input
          type="text"
          placeholder="Rechercher un libellé..."
          value={recherche}
          onChange={(e) => changerRecherche(e.target.value)}
          className="champ w-full"
        />
        <p className="mt-2 text-xs text-encre-pale">
          {filtres.length} libellé{filtres.length !== 1 ? 's' : ''} trouvé{filtres.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Tableau */}
      <div className="carte">
        {filtres.length === 0 ? (
          <div className="p-6">
            <EtatVide titre={recherche ? 'Aucun résultat' : 'Aucun libellé pour le moment'}>
              {recherche ? 'Essayez une autre recherche.' : 'Créez les libellés qui seront utilisés par les postes budgétaires et les dépenses.'}
            </EtatVide>
          </div>
        ) : (
          <>
            <ul>
              {affichees.map((l, i) => {
                const numero = debut + i + 1;
                return (
                  <li key={l.id} className={i > 0 ? 'border-t border-trait' : ''}>
                    <Link
                      to={`/admin/libelle/${l.id}`}
                      className="flex flex-wrap items-start gap-x-4 gap-y-1.5 px-5 py-3.5 text-encre no-underline hover:bg-[#FAFBF8]"
                    >
                      <span className="shrink-0 w-8 font-bold text-encre-pale">{numero}.</span>
                      <div className="flex min-w-[220px] flex-1 flex-col">
                        <span className="font-bold">{l.nom}</span>
                        {l.description && <span className="text-xs text-encre-pale">{l.description}</span>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-trait px-5 py-4">
                <span className="text-sm text-encre-pale">
                  Page {page + 1} sur {totalPages} ({filtres.length} total)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className={classes(
                      'rounded-lg px-4 py-2 text-sm font-semibold',
                      page === 0
                        ? 'bg-trait text-encre-pale cursor-not-allowed'
                        : 'bg-foret text-white hover:bg-foret/90'
                    )}
                  >
                    ← Précédent
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page === totalPages - 1}
                    className={classes(
                      'rounded-lg px-4 py-2 text-sm font-semibold',
                      page === totalPages - 1
                        ? 'bg-trait text-encre-pale cursor-not-allowed'
                        : 'bg-foret text-white hover:bg-foret/90'
                    )}
                  >
                    Suivant →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
