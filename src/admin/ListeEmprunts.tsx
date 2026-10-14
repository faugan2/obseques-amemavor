import { Link } from 'react-router-dom';
import { EtatVide, Puce } from '../composants/ui';
import { useDonnees } from '../lib/donnees';
import { dateCourte, montant } from '../lib/format';
import { STATUTS_EMPRUNT } from '../types';

/** Administration des emprunts. */
export function ListeEmprunts() {
  const { emprunts, parametres } = useDonnees();
  const liste = [...emprunts].sort((a, b) => a.date.localeCompare(b.date) || a.preteur.localeCompare(b.preteur));

  return (
    <section className="carte">
      {liste.length === 0 ? (
        <div className="p-6">
          <EtatVide titre="Aucun emprunt pour le moment">
            Enregistrez ici les prêts accordés à la famille pour financer les obsèques.
          </EtatVide>
        </div>
      ) : (
        <ul>
          {liste.map((e, i) => {
            const solde = e.montant - e.montantRembourse;
            return (
              <li key={e.id} className={i > 0 ? 'border-t border-trait' : ''}>
                <Link to={`/admin/emprunt/${e.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3.5 text-encre no-underline hover:bg-[#FAFBF8]">
                  <div className="flex min-w-[220px] flex-1 flex-col">
                    <span className="font-bold">{e.preteur}</span>
                    <span className="text-xs text-encre-pale">{dateCourte(e.date)} {solde > 0 && `· Reste ${montant(solde)} à rembourser`}</span>
                  </div>
                  <Puce ton={e.statut === 'rembourse' ? 'recu' : e.statut === 'partielle' ? 'attente' : 'neutre'}>
                    {STATUTS_EMPRUNT.find((s) => s.valeur === e.statut)?.libelle}
                  </Puce>
                  <span className="w-[120px] text-right font-extrabold">{montant(e.montant)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
