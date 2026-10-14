import { Link } from 'react-router-dom';
import { GabaritAdmin } from './Gabarit';
import { EtatVide, Puce } from '../composants/ui';
import { useDonnees } from '../lib/donnees';
import { dateCourte, montant } from '../lib/format';
import { STATUTS_DEVIS } from '../types';

/** Administration des devis prestataires. */
export default function ListeDevis() {
  const { devis, postes, parametres } = useDonnees();
  const nomPoste = (id: string) => postes.find((p) => p.id === id)?.libelle ?? 'Sans poste';
  const liste = [...devis].sort((a, b) => nomPoste(a.posteId).localeCompare(nomPoste(b.posteId)) || a.montant - b.montant);

  return (
    <GabaritAdmin
      titre="Devis prestataires"
      sousTitre="Visibles par la famille. Un devis « retenu » s'affiche à côté du poste dans le budget."
      actions={
        !parametres.cloture && (
          <Link to="/admin/devis/nouveau" className="inline-flex min-h-[46px] items-center rounded-xl bg-foret px-5 text-sm font-extrabold text-white no-underline">
            + Nouveau devis
          </Link>
        )
      }
    >
      <section className="carte">
        {liste.length === 0 ? (
          <div className="p-6"><EtatVide titre="Aucun devis pour le moment">Enregistrez ici les devis reçus des prestataires (tente, traiteur, chaises…).</EtatVide></div>
        ) : (
          <ul>
            {liste.map((d, i) => (
              <li key={d.id} className={i > 0 ? 'border-t border-trait' : ''}>
                <Link to={`/admin/devis/${d.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3.5 text-encre no-underline hover:bg-[#FAFBF8]">
                  <div className="flex min-w-[220px] flex-1 flex-col">
                    <span className="font-bold">{d.prestataire}</span>
                    <span className="text-xs text-encre-pale">{nomPoste(d.posteId)} · {dateCourte(d.date)}{d.objet && ` · ${d.objet}`}</span>
                  </div>
                  <Puce ton={d.statut === 'retenu' ? 'recu' : d.statut === 'refuse' ? 'neutre' : 'attente'}>
                    {STATUTS_DEVIS.find((s) => s.valeur === d.statut)?.libelle}
                  </Puce>
                  <span className="w-[120px] text-right font-extrabold">{montant(d.montant)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </GabaritAdmin>
  );
}
